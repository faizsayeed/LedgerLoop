from __future__ import annotations
import re
from typing import List, Dict, Any, Optional, Tuple
from ..models.schemas import Receipt, Invoice, Allocation, Customer, ReconciliationMatch, ExceptionItem
from .business_rules import compute_invoice_outstanding, parse_iso_date

def find_duplicate_receipts(receipts: List[Receipt]) -> List[str]:
    """Identifies receipts that appear to be duplicates based on UTR or exact tuple."""
    seen_refs: Dict[str, str] = {}
    duplicates: List[str] = []
    
    for r in receipts:
        ref_norm = r.reference_number.strip().upper()
        if ref_norm in seen_refs:
            duplicates.append(r.receipt_id)
        else:
            seen_refs[ref_norm] = r.receipt_id

    # Also check if explicit "-DUP" tag is present
    for r in receipts:
        if "-DUP" in r.receipt_id and r.receipt_id not in duplicates:
            duplicates.append(r.receipt_id)
            
    return duplicates

def generate_reconciliation_matches(
    receipts: List[Receipt],
    invoices: List[Invoice],
    allocations: List[Allocation],
    customers: Dict[str, Customer]
) -> List[ReconciliationMatch]:
    """
    Evaluates unallocated receipts against open invoices and produces
    heuristic match recommendations with transparent reasoning.
    """
    duplicates = find_duplicate_receipts(receipts)

    # Compute unallocated balance per receipt
    allocated_by_rec: Dict[str, float] = {}
    for a in allocations:
        allocated_by_rec[a.receipt_id] = allocated_by_rec.get(a.receipt_id, 0.0) + a.allocated_amount

    # Compute outstanding balance per invoice
    open_invoices: Dict[str, float] = {}
    for inv in invoices:
        _, outstanding = compute_invoice_outstanding(inv, allocations)
        if outstanding > 0.001:
            open_invoices[inv.invoice_id] = outstanding

    matches: List[ReconciliationMatch] = []

    for r in receipts:
        cust = customers.get(r.customer_id)
        cust_name = cust.name if cust else "Unknown Customer"
        already_allocated = allocated_by_rec.get(r.receipt_id, 0.0)
        unallocated = round(r.amount - already_allocated, 2)
        is_dup = r.receipt_id in duplicates

        if is_dup:
            matches.append(ReconciliationMatch(
                receipt_id=r.receipt_id,
                receipt_amount=r.amount,
                receipt_date=r.receipt_date,
                receipt_reference=r.reference_number,
                customer_id=r.customer_id,
                customer_name=cust_name,
                unallocated_amount=unallocated,
                suggested_invoice_id=None,
                suggested_invoice_amount=None,
                suggested_invoice_outstanding=None,
                confidence_score=0.0,
                match_reason=f"Flagged duplicate entry: UTR '{r.reference_number}' matches existing receipt record.",
                is_duplicate=True,
                is_ambiguous=False,
                status="flagged_duplicate"
            ))
            continue

        if unallocated <= 0.001:
            # Fully allocated
            continue

        # Look for matches among open invoices for this customer
        cust_invoices = [inv for inv in invoices if inv.customer_id == r.customer_id and open_invoices.get(inv.invoice_id, 0) > 0.001]

        best_inv_id: Optional[str] = None
        best_conf = 0.0
        best_reason = "No confident automated match found. Review unapplied balance."
        is_ambiguous = False

        # Rule 1: Invoice ID mentioned in remarks / bank narration
        remarks = (r.remarks or "").upper()
        ref = (r.reference_number or "").upper()
        text_to_search = f"{remarks} {ref}"

        ref_match = None
        for inv in cust_invoices:
            if inv.invoice_id.upper() in text_to_search:
                ref_match = inv
                break

        if ref_match:
            best_inv_id = ref_match.invoice_id
            best_conf = 0.95
            best_reason = f"Explicit reference '{ref_match.invoice_id}' found in payment remarks."
        else:
            # Rule 2: Exact outstanding balance match
            exact_matches = [inv for inv in cust_invoices if abs(open_invoices[inv.invoice_id] - unallocated) < 0.01]
            if len(exact_matches) == 1:
                best_inv_id = exact_matches[0].invoice_id
                best_conf = 0.85
                best_reason = f"Exact amount match (₹{unallocated:,.2f}) for customer open invoice {exact_matches[0].invoice_id}."
            elif len(exact_matches) > 1:
                best_inv_id = exact_matches[0].invoice_id
                best_conf = 0.60
                is_ambiguous = True
                best_reason = f"Ambiguous match: {len(exact_matches)} open invoices have the identical amount of ₹{unallocated:,.2f}."
            elif cust_invoices:
                # Rule 3: Oldest overdue invoice FIFO heuristic
                oldest_inv = min(cust_invoices, key=lambda i: parse_iso_date(i.due_date))
                best_inv_id = oldest_inv.invoice_id
                best_conf = 0.70
                best_reason = f"Oldest open invoice heuristic: matches {oldest_inv.invoice_id} (Due {oldest_inv.due_date})."

        inv_obj = next((i for i in invoices if i.invoice_id == best_inv_id), None) if best_inv_id else None

        matches.append(ReconciliationMatch(
            receipt_id=r.receipt_id,
            receipt_amount=r.amount,
            receipt_date=r.receipt_date,
            receipt_reference=r.reference_number,
            customer_id=r.customer_id,
            customer_name=cust_name,
            unallocated_amount=unallocated,
            suggested_invoice_id=best_inv_id,
            suggested_invoice_amount=inv_obj.amount if inv_obj else None,
            suggested_invoice_outstanding=open_invoices.get(best_inv_id, None) if best_inv_id else None,
            confidence_score=best_conf,
            match_reason=best_reason,
            is_duplicate=False,
            is_ambiguous=is_ambiguous,
            status="pending_confirmation" if best_inv_id else "unmatched"
        ))

    return matches

def validate_and_apply_allocation(
    receipt: Receipt,
    invoice: Invoice,
    alloc_amount: float,
    current_allocations: List[Allocation],
    allocated_by: str = "Finance Ops User"
) -> Tuple[Allocation, Optional[str]]:
    """
    Applies an allocation from a receipt to an invoice with strict checks:
    - Amount > 0
    - Amount <= remaining receipt balance
    - Amount <= remaining invoice balance (prevents overpayment: Test H)
    """
    if alloc_amount <= 0:
        raise ValueError(f"Allocation amount must be positive. Received: ₹{alloc_amount}")

    # Check remaining receipt amount
    used_receipt = sum(a.allocated_amount for a in current_allocations if a.receipt_id == receipt.receipt_id)
    rem_receipt = round(receipt.amount - used_receipt, 2)
    if alloc_amount > rem_receipt + 0.001:
        raise ValueError(
            f"Over-allocation error: Requested ₹{alloc_amount:,.2f} exceeds available unallocated receipt balance of ₹{rem_receipt:,.2f}."
        )

    # Check remaining invoice amount
    used_invoice = sum(a.allocated_amount for a in current_allocations if a.invoice_id == invoice.invoice_id)
    rem_invoice = round(invoice.amount - used_invoice, 2)
    if alloc_amount > rem_invoice + 0.001:
        raise ValueError(
            f"Overpayment error: Requested allocation of ₹{alloc_amount:,.2f} exceeds remaining invoice outstanding balance of ₹{rem_invoice:,.2f}."
        )

    alloc_id = f"ALC-MANUAL-{len(current_allocations) + 1:04d}"
    new_alloc = Allocation(
        allocation_id=alloc_id,
        receipt_id=receipt.receipt_id,
        invoice_id=invoice.invoice_id,
        allocated_amount=alloc_amount,
        allocation_date=receipt.receipt_date,
        allocated_by=allocated_by,
        notes=f"Confirmed match against {invoice.invoice_id}"
    )

    return new_alloc, None

from __future__ import annotations
import json
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
from ..models.schemas import (
    CompanyInfo, Customer, Invoice, Receipt, Allocation,
    EnrichedInvoice, ExceptionItem, AuditLogEntry, FollowUpDraftResponse
)
from ..services.business_rules import (
    enrich_invoices, compute_kpis, compute_ageing_summary, validate_import_data
)
from ..services.reconciliation import (
    generate_reconciliation_matches, find_duplicate_receipts, validate_and_apply_allocation
)

DEFAULT_FIXTURE_PATH = Path(__file__).resolve().parent.parent.parent.parent / "Starter_Data" / "C28" / "fixture.json"

class ARRepository:
    def __init__(self, fixture_path: Optional[Path] = None):
        self.fixture_path = fixture_path or DEFAULT_FIXTURE_PATH
        self.company: Optional[CompanyInfo] = None
        self.as_of_date: str = "2026-10-15"
        self.customers: Dict[str, Customer] = {}
        self.invoices: List[Invoice] = []
        self.receipts: List[Receipt] = []
        self.allocations: List[Allocation] = []
        self.exceptions: List[ExceptionItem] = []
        self.audit_logs: List[AuditLogEntry] = []
        self.saved_drafts: List[FollowUpDraftResponse] = []
        self.load_fixture()

    def load_fixture(self):
        """Loads canonical fixture into memory and initializes state."""
        if not self.fixture_path.exists():
            raise FileNotFoundError(f"Fixture file not found at {self.fixture_path}")

        with open(self.fixture_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.company = CompanyInfo(**data["company"])
        self.as_of_date = data.get("as_of_date", "2026-10-15")
        self.customers = {c["id"]: Customer(**c) for c in data.get("customers", [])}
        self.invoices = [Invoice(**i) for i in data.get("invoices", [])]
        self.receipts = [Receipt(**r) for r in data.get("receipts", [])]
        self.allocations = [Allocation(**a) for a in data.get("allocations", [])]
        self.audit_logs = [
            AuditLogEntry(
                timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                action="INITIALIZE_FIXTURE",
                performed_by="System",
                entity_type="FIXTURE",
                entity_id="C28",
                details=f"Loaded canonical dataset with {len(self.invoices)} invoices, {len(self.receipts)} receipts, {len(self.allocations)} allocations."
            )
        ]
        self.rebuild_exceptions()

    def reset_state(self):
        """Resets application state back to original fixture cleanly."""
        self.load_fixture()
        self.saved_drafts = []

    def set_as_of_date(self, new_as_of_date: str):
        """Updates the global as-of date and recalculates dependent views."""
        self.as_of_date = new_as_of_date
        self.audit_logs.append(AuditLogEntry(
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            action="UPDATE_AS_OF_DATE",
            performed_by="Finance User",
            entity_type="SYSTEM",
            entity_id="AS_OF_DATE",
            details=f"As-of date modified to {new_as_of_date}."
        ))
        self.rebuild_exceptions()

    def get_enriched_invoices(self) -> List[EnrichedInvoice]:
        return enrich_invoices(
            self.invoices, self.allocations, self.customers, self.as_of_date
        )

    def rebuild_exceptions(self):
        """Generates comprehensive exception queue from current system records."""
        exceptions: List[ExceptionItem] = []
        enriched = self.get_enriched_invoices()

        # 1. Disputed invoices
        for inv in enriched:
            if inv.dispute_status == "disputed":
                exceptions.append(ExceptionItem(
                    exception_id=f"EXC-DISP-{inv.invoice_id}",
                    exception_type="dispute",
                    entity_id=inv.invoice_id,
                    customer_name=inv.customer_name,
                    financial_impact=inv.outstanding_balance,
                    severity="Critical",
                    reason=inv.dispute_details.reason if inv.dispute_details else "Customer reported operational dispute",
                    status="Under Investigation" if inv.dispute_details and inv.dispute_details.resolution_status == "under_investigation" else "Open",
                    assigned_owner=inv.dispute_details.owner if inv.dispute_details else "Unassigned",
                    recommended_resolution=inv.agreed_next_action or "Review warehouse receipt logs and dispatch notes.",
                    created_date=inv.dispute_details.opened_date if inv.dispute_details else inv.issue_date
                ))

        # 2. Duplicate receipts
        dup_ids = find_duplicate_receipts(self.receipts)
        for r in self.receipts:
            if r.receipt_id in dup_ids:
                cust = self.customers.get(r.customer_id)
                exceptions.append(ExceptionItem(
                    exception_id=f"EXC-DUP-{r.receipt_id}",
                    exception_type="potential_duplicate",
                    entity_id=r.receipt_id,
                    customer_name=cust.name if cust else "Unknown Customer",
                    financial_impact=r.amount,
                    severity="High",
                    reason=f"Identical reference/UTR '{r.reference_number}' found in bank feed. Quarantine from ledger.",
                    status="Open",
                    assigned_owner="Treasury Ops",
                    recommended_resolution="Verify bank statement statement line; reject duplicate credit record.",
                    created_date=r.receipt_date
                ))

        # 3. Unapplied receipts
        allocated_by_rec = {}
        for a in self.allocations:
            allocated_by_rec[a.receipt_id] = allocated_by_rec.get(a.receipt_id, 0.0) + a.allocated_amount

        for r in self.receipts:
            if r.receipt_id not in dup_ids:
                unallocated = round(r.amount - allocated_by_rec.get(r.receipt_id, 0.0), 2)
                if unallocated > 0.001:
                    cust = self.customers.get(r.customer_id)
                    exceptions.append(ExceptionItem(
                        exception_id=f"EXC-UNAPP-{r.receipt_id}",
                        exception_type="unapplied_receipt",
                        entity_id=r.receipt_id,
                        customer_name=cust.name if cust else "Unknown Customer",
                        financial_impact=unallocated,
                        severity="Medium",
                        reason=f"Unapplied payment balance of ₹{unallocated:,.2f} awaiting invoice allocation.",
                        status="Open",
                        assigned_owner="Finance Ops Lead",
                        recommended_resolution="Run smart reconciliation matcher to link with matching customer invoice.",
                        created_date=r.receipt_date
                    ))

        # 4. Missed payment promises
        for inv in enriched:
            if inv.promise_to_pay and inv.promise_to_pay.status == "broken":
                exceptions.append(ExceptionItem(
                    exception_id=f"EXC-PROM-{inv.invoice_id}",
                    exception_type="missed_promise",
                    entity_id=inv.invoice_id,
                    customer_name=inv.customer_name,
                    financial_impact=inv.outstanding_balance,
                    severity="High",
                    reason=f"Committed payment of ₹{inv.promise_to_pay.promised_amount:,.2f} on {inv.promise_to_pay.promised_date} elapsed without credit.",
                    status="Open",
                    assigned_owner=inv.promise_to_pay.recorded_by or "Credit Desk",
                    recommended_resolution="Initiate escalation follow-up and review credit terms.",
                    created_date=inv.promise_to_pay.recorded_at or inv.due_date
                ))

        self.exceptions = exceptions

    def apply_receipt_allocation(self, receipt_id: str, invoice_id: str, amount: float, user: str = "Finance Ops") -> Allocation:
        """Applies receipt allocation safely with overpayment guardrails."""
        rec = next((r for r in self.receipts if r.receipt_id == receipt_id), None)
        if not rec:
            raise ValueError(f"Receipt '{receipt_id}' not found.")
        inv = next((i for i in self.invoices if i.invoice_id == invoice_id), None)
        if not inv:
            raise ValueError(f"Invoice '{invoice_id}' not found.")

        new_alloc, _ = validate_and_apply_allocation(rec, inv, amount, self.allocations, user)
        self.allocations.append(new_alloc)
        self.audit_logs.append(AuditLogEntry(
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            action="APPLY_ALLOCATION",
            performed_by=user,
            entity_type="ALLOCATION",
            entity_id=new_alloc.allocation_id,
            details=f"Allocated ₹{amount:,.2f} from {receipt_id} to {invoice_id}."
        ))
        self.rebuild_exceptions()
        return new_alloc

    def reverse_allocation(self, allocation_id: str, user: str = "Finance Ops"):
        """Reverses an allocation in an auditable manner."""
        target = next((a for a in self.allocations if a.allocation_id == allocation_id), None)
        if not target:
            raise ValueError(f"Allocation '{allocation_id}' not found.")
        self.allocations = [a for a in self.allocations if a.allocation_id != allocation_id]
        self.audit_logs.append(AuditLogEntry(
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            action="REVERSE_ALLOCATION",
            performed_by=user,
            entity_type="ALLOCATION",
            entity_id=allocation_id,
            details=f"Reversed allocation of ₹{target.allocated_amount:,.2f} between {target.receipt_id} and {target.invoice_id}."
        ))
        self.rebuild_exceptions()

    def update_dispute_decision(self, invoice_id: str, status: str, owner: str, notes: str, user: str = "Finance Ops"):
        """Updates dispute review decision and audit trail."""
        inv = next((i for i in self.invoices if i.invoice_id == invoice_id), None)
        if not inv:
            raise ValueError(f"Invoice '{invoice_id}' not found.")

        if inv.dispute_details:
            inv.dispute_details.resolution_status = status
            inv.dispute_details.owner = owner
            inv.dispute_details.notes = notes
        if status == "resolved":
            inv.dispute_status = "resolved"

        self.audit_logs.append(AuditLogEntry(
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            action="UPDATE_DISPUTE",
            performed_by=user,
            entity_type="INVOICE",
            entity_id=invoice_id,
            details=f"Dispute on {invoice_id} updated: status='{status}', owner='{owner}'."
        ))
        self.rebuild_exceptions()

# Singleton repo instance
repo = ARRepository()

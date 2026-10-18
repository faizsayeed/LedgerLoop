from __future__ import annotations
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from ..models.schemas import (
    EnrichedInvoice, FollowUpDraftRequest, FollowUpDraftResponse
)

def compose_contextual_follow_up(
    invoice: EnrichedInvoice,
    req: FollowUpDraftRequest
) -> FollowUpDraftResponse:
    """
    Composes a professional, context-aware customer communication draft.
    Strictly adapts wording depending on whether invoice is disputed,
    partially paid, missed promise, or ordinary overdue.
    """
    tone = req.tone.lower()
    scenario = req.scenario
    cust_name = invoice.customer_name
    inv_id = invoice.invoice_id
    balance = invoice.outstanding_balance
    due_date = invoice.due_date
    allocated = invoice.receipts_allocated
    original_amt = invoice.amount

    draft_id = f"DFT-{uuid.uuid4().hex[:8].upper()}"

    # Scenario 1: DISPUTED INVOICE
    if invoice.dispute_status == "disputed" or scenario == "disputed":
        subject = f"Clarification & Resolution: Invoice {inv_id} — {cust_name}"
        reason = invoice.dispute_details.reason if invoice.dispute_details else "reported goods/rate discrepancy"
        owner = invoice.dispute_details.owner if invoice.dispute_details else "our warehouse operations team"

        if tone == "polite":
            body = (
                f"Dear Accounts Payable Team at {cust_name},\n\n"
                f"We hope this note finds you well.\n\n"
                f"Regarding Invoice {inv_id} (Total: ₹{original_amt:,.2f}), our records show an open inquiry "
                f"concerning: '{reason}'.\n\n"
                f"We want to assure you that our team ({owner}) is actively investigating this matter to ensure a fair "
                f"and prompt resolution. In the meantime, routine collection reminders for this invoice have been paused on our desk.\n\n"
                f"Could you please share any supporting debit notes, inspection logs, or photographic proof if not yet sent? "
                f"We value our partnership and look forward to concluding this swiftly.\n\n"
                f"Warm regards,\n"
                f"Finance Operations Desk\nApex FMCG & Logistics Distribution Pvt Ltd"
            )
        elif tone == "firm":
            body = (
                f"Attention: Finance & Commercial Lead, {cust_name}\n\n"
                f"Re: Resolution of Disputed Invoice {inv_id} (Exposure: ₹{balance:,.2f})\n\n"
                f"Our records reflect an active claim logged against Invoice {inv_id}: '{reason}'.\n\n"
                f"To prevent billing stalls and month-end account reconciliation delays, we request a brief alignment call "
                f"within the next 48 hours. Please provide final documentation so our operations lead ({owner}) can execute "
                f"the appropriate credit adjustment or confirm clearance.\n\n"
                f"Regards,\n"
                f"Credit & Receivables Management\nApex FMCG & Logistics Distribution Pvt Ltd"
            )
        else:  # Neutral
            body = (
                f"To: Accounts Department, {cust_name}\n\n"
                f"Subject: Status of Invoice {inv_id} Inquiry\n\n"
                f"Invoice {inv_id} for ₹{original_amt:,.2f} is currently marked under review due to '{reason}'.\n"
                f"The matter is assigned to {owner}. Normal collection reminders are suspended pending operational sign-off.\n"
                f"Next Agreed Step: {invoice.agreed_next_action or 'Review inspection findings'}.\n\n"
                f"Regards,\nFinance Desk"
            )

    # Scenario 2: PARTIALLY PAID INVOICE
    elif allocated > 0 or scenario == "partial_payment":
        subject = f"Statement of Account & Balance Remittance: Invoice {inv_id} [₹{balance:,.2f} Outstanding]"
        if tone == "polite":
            body = (
                f"Dear Finance Team at {cust_name},\n\n"
                f"Thank you for your recent remittance of ₹{allocated:,.2f} credited towards Invoice {inv_id}.\n\n"
                f"This note confirms that the initial payment has been allocated to your account. Our ledger reflects "
                f"a verified remaining balance of ₹{balance:,.2f} against the original invoice total of ₹{original_amt:,.2f} "
                f"(Due date: {due_date}).\n\n"
                f"Kindly let us know your planned schedule for remitting the remaining ₹{balance:,.2f}.\n\n"
                f"Best regards,\n"
                f"Accounts Receivable Team\nApex FMCG & Logistics Distribution Pvt Ltd"
            )
        elif tone == "firm":
            body = (
                f"Attention: Accounts Payable, {cust_name}\n\n"
                f"Re: Unsettled Balance of ₹{balance:,.2f} — Invoice {inv_id}\n\n"
                f"We acknowledge receipt of ₹{allocated:,.2f} against Invoice {inv_id}. However, an unpaid balance "
                f"of ₹{balance:,.2f} remains past due ({invoice.days_overdue} days overdue).\n\n"
                f"Please arrange for the balance transfer of ₹{balance:,.2f} by tomorrow EOD and share the UTR reference number "
                f"to ensure uninterrupted order processing.\n\n"
                f"Sincerely,\nCredit Control\nApex FMCG & Logistics Distribution Pvt Ltd"
            )
        else:  # Neutral
            body = (
                f"To: Accounts Department, {cust_name}\n\n"
                f"Ledger reconciliation update for Invoice {inv_id}:\n"
                f"- Original Amount: ₹{original_amt:,.2f}\n"
                f"- Payments Credited: ₹{allocated:,.2f}\n"
                f"- Net Balance Due: ₹{balance:,.2f}\n"
                f"- Due Date: {due_date}\n\n"
                f"Please remit the outstanding amount of ₹{balance:,.2f} at your earliest convenience.\n\n"
                f"Finance Operations"
            )

    # Scenario 3: MISSED / BROKEN PAYMENT PROMISE
    elif (invoice.promise_to_pay and invoice.promise_to_pay.status == "broken") or scenario == "missed_promise":
        p_amt = invoice.promise_to_pay.promised_amount if invoice.promise_to_pay else balance
        p_date = invoice.promise_to_pay.promised_date if invoice.promise_to_pay else "agreed date"
        subject = f"URGENT: Elapsed Payment Commitment — Invoice {inv_id} [₹{balance:,.2f}]"

        if tone == "polite":
            body = (
                f"Dear Accounts Payable Team at {cust_name},\n\n"
                f"We are writing regarding Invoice {inv_id} for ₹{balance:,.2f}.\n\n"
                f"Per our earlier communication on your account, payment was committed for {p_date}. As of today, our bank "
                f"statement does not reflect this credit.\n\n"
                f"Could you please verify whether the transfer has been initiated from your end, or share the bank UTR reference? "
                f"We would appreciate your prompt update.\n\n"
                f"Sincerely,\nCredit Desk\nApex FMCG & Logistics Distribution Pvt Ltd"
            )
        elif tone == "firm":
            body = (
                f"URGENT ATTENTION: Finance Controller / AP Head, {cust_name}\n\n"
                f"Re: Broken Payment Commitment — Invoice {inv_id} (₹{balance:,.2f})\n\n"
                f"Your committed payment date of {p_date} for ₹{p_amt:,.2f} has lapsed without credit received.\n"
                f"This invoice is now {invoice.days_overdue} days overdue. Continued delinquency jeopardizes active credit limits "
                f"and pending dispatch releases under your customer account.\n\n"
                f"We require immediate bank UTR confirmation today for the full balance of ₹{balance:,.2f}.\n\n"
                f"Credit Risk & Recovery Team\nApex FMCG & Logistics Distribution Pvt Ltd"
            )
        else:  # Neutral
            body = (
                f"To: Finance Team, {cust_name}\n\n"
                f"Notification of Overdue Payment Promise:\n"
                f"Invoice {inv_id} (₹{balance:,.2f}) had an agreed payment commitment on {p_date}.\n"
                f"No matching bank credit has been identified. Please remit ₹{balance:,.2f} immediately.\n\n"
                f"Finance Ops"
            )

    # Scenario 4: ORDINARY OVERDUE INVOICE
    else:
        subject = f"Payment Reminder: Invoice {inv_id} Overdue [₹{balance:,.2f}] — {cust_name}"
        if tone == "polite":
            body = (
                f"Dear Accounts Payable Team at {cust_name},\n\n"
                f"This is a gentle reminder that Invoice {inv_id} for ₹{balance:,.2f} fell due on {due_date} "
                f"({invoice.days_overdue} days ago).\n\n"
                f"We kindly request you to schedule this payment in your upcoming payment run. If you have already "
                f"processed this transfer, please share the UTR reference number so we can allocate it to your account.\n\n"
                f"Thank you for your continued partnership.\n\n"
                f"Warm regards,\nAccounts Receivable Team\nApex FMCG & Logistics Distribution Pvt Ltd"
            )
        elif tone == "firm":
            body = (
                f"Attention: Finance Department, {cust_name}\n\n"
                f"NOTICE OF OVERDUE RECEIVABLE — Invoice {inv_id}\n\n"
                f"Our records indicate that Invoice {inv_id} amounting to ₹{balance:,.2f} is currently {invoice.days_overdue} "
                f"days overdue (Maturity date was {due_date}).\n\n"
                f"Please ensure payment is executed immediately via RTGS/NEFT to avoid escalation and temporary credit holds.\n\n"
                f"Bank Transfer Details:\n"
                f"A/C Name: Apex FMCG & Logistics Distribution Pvt Ltd\n"
                f"Bank: HDFC Bank Current A/C #00912000341 (IFSC: HDFC0000091)\n\n"
                f"Sincerely,\nCredit Control Department"
            )
        else:  # Neutral
            body = (
                f"To: Accounts Payable, {cust_name}\n\n"
                f"Invoice {inv_id} for ₹{balance:,.2f} was due on {due_date} and is now {invoice.days_overdue} days past due.\n"
                f"Please remit the outstanding balance at the earliest or provide a confirmed promise-to-pay date.\n\n"
                f"Accounts Receivable Desk"
            )

    return FollowUpDraftResponse(
        draft_id=draft_id,
        invoice_id=inv_id,
        customer_name=cust_name,
        customer_email="ap.contact@customer-domain.in",
        scenario=scenario,
        tone=tone,
        subject=subject,
        body=body,
        outstanding_balance=balance,
        due_date=due_date,
        agreed_next_action=invoice.agreed_next_action or "Awaiting payment",
        is_disputed=(invoice.dispute_status == "disputed"),
        status="draft",
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )

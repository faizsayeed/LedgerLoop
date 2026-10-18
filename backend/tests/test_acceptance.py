import pytest
from pathlib import Path
from backend.app.db.storage import ARRepository
from backend.app.models.schemas import ScenarioLabInput, UnitEconomicsInput
from backend.app.services.business_rules import (
    compute_invoice_outstanding, compute_days_overdue, get_ageing_bucket,
    enrich_invoices, compute_kpis, compute_ageing_summary, validate_import_data
)
from backend.app.services.reconciliation import (
    find_duplicate_receipts, validate_and_apply_allocation, generate_reconciliation_matches
)
from backend.app.services.scenario_lab import run_what_if_simulation
from backend.app.services.business_case import calculate_unit_economics

@pytest.fixture
def repo():
    fixture_path = Path(__file__).resolve().parent.parent.parent / "Starter_Data" / "C28" / "fixture.json"
    r = ARRepository(fixture_path=fixture_path)
    r.reset_state()
    return r

def test_a_partial_payment(repo):
    """
    TEST A — PARTIAL PAYMENT:
    An invoice of 10,000 with receipts allocated totalling 4,000 must show 6,000 outstanding.
    """
    inv = next((i for i in repo.invoices if i.invoice_id == "INV-2026-001"), None)
    assert inv is not None, "Invoice INV-2026-001 must exist in fixture"
    assert inv.amount == 10000.0, "Original invoice amount must be 10,000.00"

    allocs, outstanding = compute_invoice_outstanding(inv, repo.allocations)
    assert allocs == 4000.0, "Receipts allocated must total 4,000.00"
    assert outstanding == 6000.0, "Outstanding balance must be exactly 6,000.00"

def test_b_full_payment(repo):
    """
    TEST B — FULL PAYMENT:
    A fully paid invoice must not appear in the active collection priority queue.
    """
    inv = next((i for i in repo.invoices if i.invoice_id == "INV-2026-002"), None)
    assert inv is not None
    assert inv.amount == 25000.0

    allocs, outstanding = compute_invoice_outstanding(inv, repo.allocations)
    assert allocs == 25000.0
    assert outstanding == 0.0

    enriched = repo.get_enriched_invoices()
    active_queue = [i for i in enriched if i.outstanding_balance > 0.001 and i.dispute_status != "disputed"]
    active_ids = [i.invoice_id for i in active_queue]

    assert "INV-2026-002" not in active_ids, "Fully paid invoice must NOT appear in active collection queue"

def test_c_dispute(repo):
    """
    TEST C — DISPUTE:
    A disputed balance remains visible but is routed to review, not ordinary collection follow-up.
    """
    inv = next((i for i in repo.invoices if i.invoice_id == "INV-2026-003"), None)
    assert inv is not None
    assert inv.dispute_status == "disputed"

    enriched = repo.get_enriched_invoices()
    enriched_inv = next(i for i in enriched if i.invoice_id == "INV-2026-003")

    # Disputed balance remains visible in total financial reporting
    assert enriched_inv.outstanding_balance == 75000.0
    kpis = compute_kpis(enriched, repo.receipts, repo.allocations, repo.as_of_date)
    assert kpis.disputed_outstanding >= 75000.0

    # Routed to review, not active collection priority queue
    active_queue = [i for i in enriched if i.outstanding_balance > 0.001 and i.dispute_status != "disputed"]
    active_ids = [i.invoice_id for i in active_queue]
    assert "INV-2026-003" not in active_ids, "Disputed invoice must be excluded from active collection queue"

    # Must appear in exceptions list
    dispute_exceptions = [e for e in repo.exceptions if e.entity_id == "INV-2026-003"]
    assert len(dispute_exceptions) == 1, "Disputed invoice must appear in Exception Review queue"

def test_d_ageing(repo):
    """
    TEST D — AGEING:
    Changing the as-of date updates ageing consistently across all affected screens.
    """
    # Baseline: 2026-10-15
    repo.set_as_of_date("2026-10-15")
    enriched_base = repo.get_enriched_invoices()
    inv_6 = next(i for i in enriched_base if i.invoice_id == "INV-2026-006")
    # Due date is 2026-10-10 -> 5 days overdue
    assert inv_6.days_overdue == 5
    assert inv_6.ageing_bucket == "1-30 Days"

    # Advance as-of date to 2026-11-20 (36 days later)
    repo.set_as_of_date("2026-11-20")
    enriched_advanced = repo.get_enriched_invoices()
    inv_6_adv = next(i for i in enriched_advanced if i.invoice_id == "INV-2026-006")
    # Due date 2026-10-10 to 2026-11-20 = 41 days overdue -> "31-60 Days"
    assert inv_6_adv.days_overdue == 41
    assert inv_6_adv.ageing_bucket == "31-60 Days"

    ageing_summary = compute_ageing_summary(enriched_advanced)
    assert any(b.bucket == "31-60 Days" and b.amount >= inv_6_adv.outstanding_balance for b in ageing_summary)

def test_e_unapplied_receipt(repo):
    """
    TEST E — UNAPPLIED RECEIPT:
    An unapplied receipt must remain visible and must not reduce an invoice balance until validly allocated.
    """
    # REC-2026-104 is ₹50,000 unapplied receipt
    rec = next((r for r in repo.receipts if r.receipt_id == "REC-2026-104"), None)
    assert rec is not None
    assert rec.amount == 50000.0

    # Verify no allocations exist yet for REC-2026-104
    allocs = [a for a in repo.allocations if a.receipt_id == "REC-2026-104"]
    assert len(allocs) == 0

    # Invoice INV-2026-007 (customer CUST-004) balance must NOT be reduced
    enriched = repo.get_enriched_invoices()
    inv_7 = next(i for i in enriched if i.invoice_id == "INV-2026-007")
    assert inv_7.outstanding_balance == 145000.0, "Invoice balance must not be reduced by unapplied receipt"

    # KPI unapplied receipts reflects this
    kpis = compute_kpis(enriched, repo.receipts, repo.allocations, repo.as_of_date)
    assert kpis.unapplied_receipts_amount >= 50000.0

def test_f_promise_to_pay(repo):
    """
    TEST F — PROMISE TO PAY:
    A recorded promise must not be mistaken for an actual payment.
    """
    inv = next((i for i in repo.invoices if i.invoice_id == "INV-2026-004"), None)
    assert inv is not None
    assert inv.promise_to_pay is not None
    assert inv.promise_to_pay.promised_amount == 50000.0

    # Balance remains full 50,000 outstanding (not reduced)
    _, outstanding = compute_invoice_outstanding(inv, repo.allocations)
    assert outstanding == 50000.0, "Promise must NOT reduce outstanding receivable"

def test_g_duplicate(repo):
    """
    TEST G — DUPLICATE:
    Duplicate receipt data must be flagged and must not be counted twice.
    """
    dups = find_duplicate_receipts(repo.receipts)
    assert "REC-2026-107-DUP" in dups, "Duplicate bank statement line must be flagged"

    # Must appear in exception queue
    repo.rebuild_exceptions()
    dup_exceptions = [e for e in repo.exceptions if e.exception_type == "potential_duplicate"]
    assert len(dup_exceptions) >= 1
    assert any(e.entity_id == "REC-2026-107-DUP" for e in dup_exceptions)

def test_h_overpayment(repo):
    """
    TEST H — OVERPAYMENT:
    Excess allocation must trigger a validation error or review exception.
    """
    rec = repo.receipts[0]
    inv = repo.invoices[0]  # INV-2026-001 has 6,000 remaining

    # Attempting to allocate 500,000 must raise ValueError
    with pytest.raises(ValueError) as excinfo:
        validate_and_apply_allocation(rec, inv, 500000.0, repo.allocations)
    assert "exceeds" in str(excinfo.value).lower() or "over" in str(excinfo.value).lower()

def test_i_import_validation(repo):
    """
    TEST I — IMPORT VALIDATION:
    Invalid records must be reported with understandable error messages.
    """
    invalid_payload = {
        "invoices": [
            {
                "invoice_id": "INV-ERR-NEGATIVE",
                "customer_id": "CUST-001",
                "issue_date": "2026-09-01",
                "due_date": "2026-09-15",
                "amount": -5000.0
            },
            {
                "invoice_id": "INV-ERR-UNKNOWN-CUST",
                "customer_id": "CUST-999-DOES-NOT-EXIST",
                "issue_date": "2026-09-01",
                "due_date": "2026-09-15",
                "amount": 12000.0
            }
        ]
    }
    report = validate_import_data(invalid_payload, repo.invoices, repo.receipts, list(repo.customers.values()))
    assert not report.success
    assert report.rejected_count == 2
    assert len(report.errors) >= 2
    assert any("must be positive" in e for e in report.errors)
    assert any("not found" in e for e in report.errors)

def test_j_scenario_isolation(repo):
    """
    TEST J — SCENARIO ISOLATION:
    Simulated changes must not overwrite original source data.
    """
    enriched_before = repo.get_enriched_invoices()
    before_amounts = {i.invoice_id: i.outstanding_balance for i in enriched_before}

    sim_params = ScenarioLabInput(
        as_of_date=repo.as_of_date,
        simulate_partial_receipt_pct=75.0,  # 75% simulated reduction!
        broken_promise_recovery_rate=0.8
    )
    result = run_what_if_simulation(enriched_before, sim_params)

    # Simulated outstanding is significantly reduced
    assert result.simulated_outstanding < result.baseline_outstanding

    # But canonical repository remains strictly untouched
    enriched_after = repo.get_enriched_invoices()
    after_amounts = {i.invoice_id: i.outstanding_balance for i in enriched_after}
    assert before_amounts == after_amounts, "Canonical repository must remain identical after simulation"

def test_unit_economics_safeguards():
    """Unit economics must guard against zero price and negative contributions."""
    bad_input = UnitEconomicsInput(monthly_subscription_price=5000.0, hosting_infra_cost_monthly=4000.0, support_cost_monthly=3000.0)
    result = calculate_unit_economics(bad_input)
    assert len(result.guardrail_warnings) > 0
    assert result.break_even_customers == 0

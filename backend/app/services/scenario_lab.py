from __future__ import annotations
from typing import List, Dict, Any
from ..models.schemas import (
    EnrichedInvoice, ScenarioLabInput, ScenarioLabResult, AgeingBucketSummary
)
from .business_rules import get_ageing_bucket, compute_ageing_summary

def run_what_if_simulation(
    base_invoices: List[EnrichedInvoice],
    params: ScenarioLabInput
) -> ScenarioLabResult:
    """
    Runs an isolated What-If scenario on top of base invoices.
    DOES NOT mutate the original invoice models (Test J isolation).
    """
    baseline_outstanding = round(sum(i.outstanding_balance for i in base_invoices), 2)
    baseline_overdue = round(sum(i.outstanding_balance for i in base_invoices if i.days_overdue > 0 and i.outstanding_balance > 0.001), 2)
    baseline_action_accounts = len({i.customer_id for i in base_invoices if i.days_overdue > 0 and i.outstanding_balance > 0.001})

    # Ageing before
    ageing_before = compute_ageing_summary(base_invoices)

    # Clone invoices for simulation
    sim_invoices: List[EnrichedInvoice] = []
    recovered_cash = 0.0

    for inv in base_invoices:
        sim_inv = inv.model_copy(deep=True)
        is_overdue = sim_inv.days_overdue > 0
        is_disputed = sim_inv.dispute_status == "disputed"

        # Apply simulated partial receipt if overdue & non-disputed
        if is_overdue and not is_disputed and params.simulate_partial_receipt_pct > 0:
            reduction = round(sim_inv.outstanding_balance * (params.simulate_partial_receipt_pct / 100.0), 2)
            sim_inv.outstanding_balance = max(0.0, round(sim_inv.outstanding_balance - reduction, 2))
            recovered_cash += reduction

        # Apply broken promise recovery
        if sim_inv.promise_to_pay and sim_inv.promise_to_pay.status == "broken":
            recovery = round(sim_inv.outstanding_balance * params.broken_promise_recovery_rate, 2)
            sim_inv.outstanding_balance = max(0.0, round(sim_inv.outstanding_balance - recovery, 2))
            recovered_cash += recovery

        # Apply shift in overdue days if simulated
        if params.extend_overdue_days != 0 and sim_inv.outstanding_balance > 0.001:
            sim_inv.days_overdue = max(0, sim_inv.days_overdue + params.extend_overdue_days)
            sim_inv.ageing_bucket = get_ageing_bucket(sim_inv.days_overdue)

        sim_invoices.append(sim_inv)

    simulated_outstanding = round(sum(i.outstanding_balance for i in sim_invoices), 2)
    simulated_overdue = round(sum(i.outstanding_balance for i in sim_invoices if i.days_overdue > 0 and i.outstanding_balance > 0.001), 2)
    simulated_action_accounts = len({i.customer_id for i in sim_invoices if i.days_overdue > 0 and i.outstanding_balance > 0.001})

    # Workload calculation:
    # Aggressive follow-up: 1.5 hrs / account / month
    # Standard: 0.8 hrs / account / month
    # Gentle: 0.4 hrs / account / month
    effort_rate = 1.5 if params.follow_up_intensity == "Aggressive" else (0.8 if params.follow_up_intensity == "Standard" else 0.4)
    estimated_hours_needed = round(simulated_action_accounts * effort_rate * 4.0, 1)  # monthly hours
    available_hours_monthly = params.workload_staff_hours * 4.0
    coverage_pct = round((available_hours_monthly / estimated_hours_needed * 100.0), 1) if estimated_hours_needed > 0 else 100.0

    ageing_after = compute_ageing_summary(sim_invoices)

    notes = [
        f"Simulated cash accelerated: ₹{recovered_cash:,.2f} through partial payment initiatives and promise recoveries.",
        f"Customer collection accounts requiring active follow-up adjusted from {baseline_action_accounts} to {simulated_action_accounts}.",
        f"Available staff workload capacity: {available_hours_monthly:.0f} hrs/month vs {estimated_hours_needed:.1f} hrs estimated demand ({coverage_pct}% coverage).",
        "Original ledger records untouched. All simulated metrics isolated to this sandbox session."
    ]

    return ScenarioLabResult(
        baseline_outstanding=baseline_outstanding,
        simulated_outstanding=simulated_outstanding,
        baseline_overdue=baseline_overdue,
        simulated_overdue=simulated_overdue,
        baseline_forecast_30d=baseline_overdue * 0.45,
        simulated_forecast_30d=round((baseline_overdue * 0.45) + recovered_cash, 2),
        baseline_action_accounts=baseline_action_accounts,
        simulated_action_accounts=simulated_action_accounts,
        estimated_hours_needed=estimated_hours_needed,
        capacity_coverage_pct=min(200.0, coverage_pct),
        ageing_before=ageing_before,
        ageing_after=ageing_after,
        notes=notes
    )

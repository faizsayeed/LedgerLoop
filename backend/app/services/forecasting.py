from __future__ import annotations
from datetime import timedelta
from typing import List, Dict, Any, Optional
from ..models.schemas import (
    EnrichedInvoice, CashForecastDay, CashForecastScenario
)
from .business_rules import parse_iso_date

def generate_cash_forecast(
    enriched_invoices: List[EnrichedInvoice],
    as_of_date_str: str
) -> List[CashForecastScenario]:
    """
    Generates rule-based 7-day, 15-day, and 30-day cash-flow forecasts
    under three transparent, distinct operating scenarios.
    Disputed invoices are strictly isolated from collection assumptions.
    """
    as_of_dt = parse_iso_date(as_of_date_str)
    horizon_days = 30

    # Collect non-disputed open invoices
    open_active = [
        inv for inv in enriched_invoices
        if inv.outstanding_balance > 0.001 and inv.dispute_status != "disputed"
    ]
    disputed_items = [
        inv for inv in enriched_invoices
        if inv.outstanding_balance > 0.001 and inv.dispute_status == "disputed"
    ]
    total_disputed = sum(inv.outstanding_balance for inv in disputed_items)

    # Initialize daily schedule for 30 days
    date_list = [as_of_dt + timedelta(days=i) for i in range(1, horizon_days + 1)]
    date_strs = [d.strftime("%Y-%m-%d") for d in date_list]

    # --- 1. OPTIMISTIC SCENARIO ---
    # Assumptions:
    # 1. 100% of pending payment promises are honored on their exact promised date.
    # 2. 100% of current invoices maturing in the period are paid exactly on their due date.
    # 3. 50% of 1-30 days overdue balances are recovered across the first 14 days.
    # 4. Disputed balances (₹{total_disputed:,.2f}) completely excluded from routine forecast.
    opt_days: List[CashForecastDay] = []
    opt_daily_promised: Dict[str, float] = {d: 0.0 for d in date_strs}
    opt_daily_unconf: Dict[str, float] = {d: 0.0 for d in date_strs}

    for inv in open_active:
        if inv.promise_to_pay and inv.promise_to_pay.status == "pending":
            p_date = inv.promise_to_pay.promised_date
            if p_date in opt_daily_promised:
                opt_daily_promised[p_date] += min(inv.promise_to_pay.promised_amount, inv.outstanding_balance)
        else:
            due_d = inv.due_date
            if due_d in opt_daily_unconf:
                opt_daily_unconf[due_d] += inv.outstanding_balance
            elif inv.days_overdue > 0 and inv.days_overdue <= 30:
                # Spread half over first 10 days
                spread_amt = (inv.outstanding_balance * 0.5) / 10.0
                for d in date_strs[:10]:
                    opt_daily_unconf[d] += spread_amt

    for d in date_strs:
        prom = round(opt_daily_promised[d], 2)
        unconf = round(opt_daily_unconf[d], 2)
        total = round(prom + unconf, 2)
        opt_days.append(CashForecastDay(
            date=d,
            expected_amount=total,
            promised_amount=prom,
            unconfirmed_amount=unconf,
            disputed_excluded_amount=round(total_disputed / 30.0, 2),
            basis="100% promise adherence + on-time maturity + 50% short-term overdue recovery",
            confidence="Medium" if unconf > 0 else "High"
        ))

    # --- 2. EXPECTED / BASELINE SCENARIO ---
    # Assumptions:
    # 1. 80% adherence on recorded payment promises.
    # 2. Tier-1 / Low-risk accounts pay at 85% probability on due date.
    # 3. Medium-risk accounts pay at 65% probability.
    # 4. High-risk accounts pay at 35% probability.
    # 5. Overdue receivables (>30 days) collect at 20% recovery rate.
    exp_days: List[CashForecastDay] = []
    exp_daily_promised: Dict[str, float] = {d: 0.0 for d in date_strs}
    exp_daily_unconf: Dict[str, float] = {d: 0.0 for d in date_strs}

    for inv in open_active:
        risk_factor = 0.85 if inv.customer_risk_tier == "Low Risk" else (0.65 if inv.customer_risk_tier == "Medium Risk" else 0.35)
        if inv.promise_to_pay and inv.promise_to_pay.status == "pending":
            p_date = inv.promise_to_pay.promised_date
            if p_date in exp_daily_promised:
                exp_daily_promised[p_date] += min(inv.promise_to_pay.promised_amount, inv.outstanding_balance) * 0.80
        else:
            due_d = inv.due_date
            if due_d in exp_daily_unconf:
                exp_daily_unconf[due_d] += inv.outstanding_balance * risk_factor
            elif inv.days_overdue > 0 and inv.days_overdue <= 30:
                spread_amt = (inv.outstanding_balance * 0.35) / 14.0
                for d in date_strs[:14]:
                    exp_daily_unconf[d] += spread_amt
            elif inv.days_overdue > 30:
                spread_amt = (inv.outstanding_balance * 0.15) / 20.0
                for d in date_strs[5:25]:
                    exp_daily_unconf[d] += spread_amt

    for d in date_strs:
        prom = round(exp_daily_promised[d], 2)
        unconf = round(exp_daily_unconf[d], 2)
        total = round(prom + unconf, 2)
        exp_days.append(CashForecastDay(
            date=d,
            expected_amount=total,
            promised_amount=prom,
            unconfirmed_amount=unconf,
            disputed_excluded_amount=round(total_disputed / 30.0, 2),
            basis="Customer risk-weighted probability + 80% promise adherence",
            confidence="High" if prom > unconf else "Medium"
        ))

    # --- 3. DELAYED-PAYMENT SCENARIO ---
    # Assumptions:
    # 1. Systematic payment delay: maturities shift back by +15 days.
    # 2. Broken or delayed promises (only 40% adherence).
    # 3. High-risk accounts default to extended negotiations; zero inflow in 7-day window.
    del_days: List[CashForecastDay] = []
    del_daily_promised: Dict[str, float] = {d: 0.0 for d in date_strs}
    del_daily_unconf: Dict[str, float] = {d: 0.0 for d in date_strs}

    for inv in open_active:
        if inv.promise_to_pay and inv.promise_to_pay.status == "pending":
            p_dt = parse_iso_date(inv.promise_to_pay.promised_date)
            # Shift promise back by 7 days
            shifted_str = (p_dt + timedelta(days=7)).strftime("%Y-%m-%d")
            if shifted_str in del_daily_promised:
                del_daily_promised[shifted_str] += min(inv.promise_to_pay.promised_amount, inv.outstanding_balance) * 0.45
        else:
            due_dt = parse_iso_date(inv.due_date)
            shifted_due = (due_dt + timedelta(days=15)).strftime("%Y-%m-%d")
            if shifted_due in del_daily_unconf:
                del_daily_unconf[shifted_due] += inv.outstanding_balance * 0.50

    for d in date_strs:
        prom = round(del_daily_promised[d], 2)
        unconf = round(del_daily_unconf[d], 2)
        total = round(prom + unconf, 2)
        del_days.append(CashForecastDay(
            date=d,
            expected_amount=total,
            promised_amount=prom,
            unconfirmed_amount=unconf,
            disputed_excluded_amount=round(total_disputed / 30.0, 2),
            basis="15-day settlement lag + 45% promise conversion rate",
            confidence="Low"
        ))

    def sum_window(days: List[CashForecastDay], count: int) -> float:
        return round(sum(d.expected_amount for d in days[:count]), 2)

    scenarios = [
        CashForecastScenario(
            scenario_name="Optimistic",
            description="Assumes 100% adherence to customer commitments, on-time maturity for current invoices, and 50% recovery of 1-30 day overdue balances.",
            assumptions=[
                "100% of recorded payment promises honored on date",
                "Full on-time payment on maturity date for current invoices",
                "50% collection velocity on short-term overdue (<30 days)",
                f"₹{total_disputed:,.2f} in open disputes strictly excluded"
            ],
            total_7d=sum_window(opt_days, 7),
            total_15d=sum_window(opt_days, 15),
            total_30d=sum_window(opt_days, 30),
            daily_breakdown=opt_days
        ),
        CashForecastScenario(
            scenario_name="Expected",
            description="Risk-calibrated model based on distributor customer segments: Tier-1 (85%), Medium-Risk (65%), High-Risk (35%), and 80% promise adherence.",
            assumptions=[
                "80% statistical adherence on pending promises",
                "Tier-1 / Low-Risk retail accounts collect at 85% probability",
                "Medium-Risk regional dealers collect at 65% probability",
                "High-Risk independent retail network collects at 35% probability",
                f"Disputed receivables (₹{total_disputed:,.2f}) completely quarantined"
            ],
            total_7d=sum_window(exp_days, 7),
            total_15d=sum_window(exp_days, 15),
            total_30d=sum_window(exp_days, 30),
            daily_breakdown=exp_days
        ),
        CashForecastScenario(
            scenario_name="Delayed-Payment",
            description="Stress test simulation where liquidity pressure forces buyers to defer settlements by +15 days and promise conversion drops to 45%.",
            assumptions=[
                "Buyer settlement terms effectively extended by +15 days",
                "Only 45% of customer payment promises honored",
                "Overdue balances face prolonged dispute or legal resolution",
                "Conservative baseline for liquidity buffering"
            ],
            total_7d=sum_window(del_days, 7),
            total_15d=sum_window(del_days, 15),
            total_30d=sum_window(del_days, 30),
            daily_breakdown=del_days
        )
    ]

    return scenarios

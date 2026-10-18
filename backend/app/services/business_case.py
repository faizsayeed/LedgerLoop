from __future__ import annotations
import math
from typing import List, Dict, Any
from ..models.schemas import UnitEconomicsInput, UnitEconomicsResult

def calculate_unit_economics(params: UnitEconomicsInput) -> UnitEconomicsResult:
    """
    Computes commercial SaaS unit economics and financial viability metrics.
    Guards strictly against division by zero and negative contribution margins.
    """
    warnings: List[str] = []

    # Recurring variable cost to serve per customer per month
    monthly_var_cost = params.hosting_infra_cost_monthly + params.support_cost_monthly

    # Monthly contribution per customer
    # Formula: subscription revenue - recurring variable cost to serve
    monthly_contribution = params.monthly_subscription_price - monthly_var_cost

    # Contribution margin %
    if params.monthly_subscription_price > 0:
        cm_pct = round((monthly_contribution / params.monthly_subscription_price) * 100.0, 1)
    else:
        cm_pct = 0.0
        warnings.append("Subscription price is zero or negative.")

    # Guardrails against non-positive contribution
    if monthly_contribution <= 0:
        warnings.append(
            f"Negative or zero unit contribution (₹{monthly_contribution:,.2f}/mo). Price must exceed variable cost (₹{monthly_var_cost:,.2f}/mo) to achieve commercial viability."
        )
        break_even_customers = 0
    else:
        # Break-even customer count: monthly fixed operating costs / monthly contribution per customer (rounded up)
        if params.fixed_overhead_monthly > 0:
            break_even_customers = math.ceil(params.fixed_overhead_monthly / monthly_contribution)
        else:
            break_even_customers = 0

    # Customer Lifetime Value (LTV) calculation
    # LTV = (Monthly contribution * Lifetime months) - Onboarding cost
    ltv = max(0.0, (monthly_contribution * params.customer_lifetime_months) - params.onboarding_setup_cost)
    
    # LTV / CAC ratio
    if params.customer_acquisition_cost > 0:
        ltv_cac = round(ltv / params.customer_acquisition_cost, 2)
    else:
        ltv_cac = 0.0
        warnings.append("Customer acquisition cost (CAC) is zero; LTV:CAC ratio undefined.")

    if ltv_cac < 3.0 and ltv_cac > 0:
        warnings.append(f"LTV:CAC ratio ({ltv_cac}x) is below typical venture SaaS threshold of 3.0x.")

    # Customer Value Hypotheses for SMB Distributors:
    # 1. Manual reconciliation time savings
    # Assume 18 hours/month saved per finance lead @ ₹750/hr = ₹13,500/month
    hours_saved_monthly = 18.0
    hourly_rate = 750.0
    recon_savings_monthly = hours_saved_monthly * hourly_rate

    # 2. Working Capital Interest Saved via DSO Reduction
    # Indian SME distributor working capital loan / cash credit (CC/OD) interest rate ~ 11.5% p.a.
    # 4 days DSO reduction on a ₹2.5 Cr monthly book
    # Savings = Book * (4 / 365) * 11.5%
    dso_reduction_days = 4.0
    working_cap_interest_rate = 0.115
    interest_savings_monthly = round(
        (params.ar_volume_managed_monthly * (dso_reduction_days / 365.0) * working_cap_interest_rate) / 12.0, 2
    )

    # 3. Prevented Overdue Bad Debt / Untracked Disputes
    # 0.15% recovery improvement on gross receivables
    prevented_leakage_monthly = round(params.ar_volume_managed_monthly * 0.0015, 2)

    total_buyer_value_monthly = recon_savings_monthly + interest_savings_monthly + prevented_leakage_monthly
    buyer_roi_multiple = round(total_buyer_value_monthly / params.monthly_subscription_price, 1) if params.monthly_subscription_price > 0 else 0.0

    value_hypotheses = [
        {
            "hypothesis": "Reconciliation Hours Reclaimed",
            "mechanism": "Automated UTR bank-statement matching eliminates manual ledger ticking.",
            "monthly_value": recon_savings_monthly,
            "metric_driver": f"{hours_saved_monthly:.0f} hrs/mo @ ₹{hourly_rate:.0f}/hr finance lead rate",
            "validation_test": "Time tracking during 14-day distributor shadow pilot"
        },
        {
            "hypothesis": "Working Capital Carrying Cost Reduction",
            "mechanism": "Explainable priority queue cuts DSO by 4 days, reducing Bank CC/OD interest.",
            "monthly_value": interest_savings_monthly,
            "metric_driver": f"4 days DSO improvement @ 11.5% p.a. cost of capital on ₹{params.ar_volume_managed_monthly/10000000.0:.2f} Cr book",
            "validation_test": "Pre vs post deployment DSO measurement at 60 days"
        },
        {
            "hypothesis": "Dispute Resolution Leakage Prevention",
            "mechanism": "Real-time escalation of delivery discrepancies prevents stale debit notes from writing off.",
            "monthly_value": prevented_leakage_monthly,
            "metric_driver": "0.15% reduction in uncollected dispute write-offs",
            "validation_test": "Audit unresolved debit note balance at month-end"
        },
        {
            "hypothesis": "Net ROI Multiple for SMB Distributor",
            "mechanism": "Combined monthly operational and capital benefit relative to SaaS license price.",
            "monthly_value": total_buyer_value_monthly,
            "metric_driver": f"{buyer_roi_multiple}x monthly value-to-price ratio (₹{total_buyer_value_monthly:,.2f} value vs ₹{params.monthly_subscription_price:,.2f} price)",
            "validation_test": "CFO buyer willingness-to-pay interview structured around calculated yield"
        }
    ]

    return UnitEconomicsResult(
        monthly_contribution_per_customer=round(monthly_contribution, 2),
        contribution_margin_pct=cm_pct,
        break_even_customers=break_even_customers,
        ltv_to_cac_ratio=ltv_cac,
        total_fixed_operating_costs=params.fixed_overhead_monthly,
        guardrail_warnings=warnings,
        value_hypotheses=value_hypotheses
    )

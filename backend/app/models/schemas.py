from __future__ import annotations
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class CompanyInfo(BaseModel):
    company_id: str
    company_name: str
    legal_entity: str
    gstin: str
    currency: str = "INR"
    currency_symbol: str = "₹"
    default_credit_period_days: int = 30
    financial_year: str = "2026-27"

class Customer(BaseModel):
    id: str
    name: str
    segment: str
    contact_person: str
    email: str
    phone: str
    credit_limit: float
    payment_terms_days: int
    risk_tier: str  # "Low Risk", "Medium Risk", "High Risk"
    city: str
    state: str

class PromiseToPay(BaseModel):
    promised_amount: float
    promised_date: str  # YYYY-MM-DD
    recorded_by: str = "Finance Ops"
    recorded_at: str = ""
    status: str = "pending"  # "pending", "honored", "broken"
    contact_channel: Optional[str] = None
    notes: Optional[str] = None

class DisputeDetails(BaseModel):
    reason: str
    opened_date: str
    owner: str
    notes: str
    resolution_status: str  # "open", "under_investigation", "escalated", "resolved"
    financial_impact: float

class Invoice(BaseModel):
    invoice_id: str
    customer_id: str
    issue_date: str  # YYYY-MM-DD
    due_date: str    # YYYY-MM-DD
    amount: float
    dispute_status: str = "none"  # "none", "disputed", "resolved"
    dispute_details: Optional[DisputeDetails] = None
    agreed_next_action: Optional[str] = None
    promise_to_pay: Optional[PromiseToPay] = None
    po_reference: Optional[str] = None
    notes: Optional[str] = None

class Receipt(BaseModel):
    receipt_id: str
    customer_id: str
    receipt_date: str
    amount: float
    payment_method: str  # "NEFT", "RTGS", "UPI", "Cheque"
    reference_number: str  # Bank UTR / Cheque No
    remarks: Optional[str] = None
    bank_account: Optional[str] = None

class Allocation(BaseModel):
    allocation_id: str
    receipt_id: str
    invoice_id: str
    allocated_amount: float
    allocation_date: str
    allocated_by: str = "System"
    notes: Optional[str] = None

class ScoringFactor(BaseModel):
    factor: str
    points: float
    description: str

class PriorityExplanation(BaseModel):
    priority_level: str  # "Critical", "High", "Medium", "Low"
    numeric_score: float
    factors: List[ScoringFactor]
    recommended_action: str
    is_disputed: bool = False
    is_fully_paid: bool = False

class EnrichedInvoice(BaseModel):
    invoice_id: str
    customer_id: str
    customer_name: str
    customer_risk_tier: str
    issue_date: str
    due_date: str
    amount: float
    receipts_allocated: float
    outstanding_balance: float
    days_overdue: int
    ageing_bucket: str  # "Current", "1-30 Days", "31-60 Days", "61-90 Days", ">90 Days"
    dispute_status: str
    dispute_details: Optional[DisputeDetails] = None
    promise_to_pay: Optional[PromiseToPay] = None
    agreed_next_action: Optional[str] = None
    priority_explanation: PriorityExplanation
    po_reference: Optional[str] = None
    notes: Optional[str] = None

class KPISummary(BaseModel):
    as_of_date: str
    total_outstanding: float
    total_invoiced: float
    overdue_outstanding: float
    overdue_invoice_count: int
    disputed_outstanding: float
    disputed_invoice_count: int
    unapplied_receipts_amount: float
    unapplied_receipts_count: int
    expected_receipts_7d: float
    collection_efficiency_ratio: float
    average_days_to_collect: float

class AgeingBucketSummary(BaseModel):
    bucket: str
    amount: float
    count: int
    percentage: float

class ReconciliationMatch(BaseModel):
    receipt_id: str
    receipt_amount: float
    receipt_date: str
    receipt_reference: str
    customer_id: str
    customer_name: str
    unallocated_amount: float
    suggested_invoice_id: Optional[str] = None
    suggested_invoice_amount: Optional[float] = None
    suggested_invoice_outstanding: Optional[float] = None
    confidence_score: float  # 0.0 - 1.0 (heuristic)
    match_reason: str
    is_duplicate: bool = False
    is_ambiguous: bool = False
    status: str = "unmatched"  # "unmatched", "pending_confirmation", "allocated", "flagged_duplicate"

class ExceptionItem(BaseModel):
    exception_id: str
    exception_type: str  # "dispute", "unapplied_receipt", "potential_duplicate", "overpayment", "missed_promise", "missing_data"
    entity_id: str
    customer_name: str
    financial_impact: float
    severity: str  # "Critical", "High", "Medium", "Low"
    reason: str
    status: str  # "Open", "Under Investigation", "Escalated", "Resolved"
    assigned_owner: str
    recommended_resolution: str
    created_date: str

class CashForecastDay(BaseModel):
    date: str
    expected_amount: float
    promised_amount: float
    unconfirmed_amount: float
    disputed_excluded_amount: float
    basis: str
    confidence: str  # "High", "Medium", "Low"

class CashForecastScenario(BaseModel):
    scenario_name: str  # "Optimistic", "Expected", "Delayed-Payment"
    description: str
    assumptions: List[str]
    total_7d: float
    total_15d: float
    total_30d: float
    daily_breakdown: List[CashForecastDay]

class ScenarioLabInput(BaseModel):
    as_of_date: str
    workload_staff_hours: float = 40.0
    follow_up_intensity: str = "Standard"  # "Aggressive", "Standard", "Gentle"
    early_payment_discount_pct: float = 0.0
    simulate_partial_receipt_pct: float = 0.0
    extend_overdue_days: int = 0
    broken_promise_recovery_rate: float = 0.5

class ScenarioLabResult(BaseModel):
    baseline_outstanding: float
    simulated_outstanding: float
    baseline_overdue: float
    simulated_overdue: float
    baseline_forecast_30d: float
    simulated_forecast_30d: float
    baseline_action_accounts: int
    simulated_action_accounts: int
    estimated_hours_needed: float
    capacity_coverage_pct: float
    ageing_before: List[AgeingBucketSummary]
    ageing_after: List[AgeingBucketSummary]
    notes: List[str]

class UnitEconomicsInput(BaseModel):
    monthly_subscription_price: float = 25000.0  # ₹ / month
    hosting_infra_cost_monthly: float = 3500.0   # ₹ / customer / mo
    support_cost_monthly: float = 4000.0         # ₹ / customer / mo
    onboarding_setup_cost: float = 15000.0       # One-time per customer
    customer_lifetime_months: int = 24
    fixed_overhead_monthly: float = 180000.0     # Engineering + Operations fixed overhead
    customer_acquisition_cost: float = 30000.0   # CAC per signed distributor
    ar_volume_managed_monthly: float = 25000000.0 # Distributor AR book size ₹2.5 Cr

class UnitEconomicsResult(BaseModel):
    monthly_contribution_per_customer: float
    contribution_margin_pct: float
    break_even_customers: int
    ltv_to_cac_ratio: float
    total_fixed_operating_costs: float
    guardrail_warnings: List[str]
    value_hypotheses: List[Dict[str, Any]]

class ImportReport(BaseModel):
    success: bool
    imported_invoices_count: int
    imported_receipts_count: int
    rejected_count: int
    warnings_count: int
    errors: List[str]
    warnings: List[str]
    details: List[Dict[str, Any]]

class FollowUpDraftRequest(BaseModel):
    invoice_id: str
    scenario: str  # "ordinary_overdue", "partial_payment", "disputed", "unapplied_receipt", "promise_received", "missed_promise", "payment_confirmation"
    tone: str = "polite"  # "neutral", "polite", "firm"
    custom_recipient_email: Optional[str] = None
    custom_recipient_name: Optional[str] = None

class FollowUpDraftResponse(BaseModel):
    draft_id: str
    invoice_id: str
    customer_name: str
    customer_email: str
    scenario: str
    tone: str
    subject: str
    body: str
    outstanding_balance: float
    due_date: str
    agreed_next_action: str
    is_disputed: bool
    status: str = "draft"  # "draft", "approved", "escalated"
    created_at: str

class AuditLogEntry(BaseModel):
    timestamp: str
    action: str
    performed_by: str
    entity_type: str
    entity_id: str
    details: str

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    role: str
    avatar_initials: str
    avatar_color: str
    organization: str
    permissions: List[str]
    auth_provider: str
    last_login: str

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "Finance Operations Lead"
    organization: Optional[str] = "Apex FMCG & Cold-Chain Logistics Ltd."

class OAuthLoginRequest(BaseModel):
    provider: str  # "google" | "microsoft"
    token: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    organization: Optional[str] = None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


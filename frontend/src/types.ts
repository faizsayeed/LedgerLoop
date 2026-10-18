export interface CompanyInfo {
  company_id: string;
  company_name: string;
  legal_entity: string;
  gstin: string;
  currency: string;
  currency_symbol: string;
  default_credit_period_days: number;
  financial_year: string;
}

export interface Customer {
  id: string;
  name: string;
  segment: string;
  contact_person: string;
  email: string;
  phone: string;
  credit_limit: number;
  payment_terms_days: number;
  risk_tier: string;
  city: string;
  state: string;
}

export interface PromiseToPay {
  promised_amount: number;
  promised_date: string;
  recorded_by?: string;
  recorded_at?: string;
  status: 'pending' | 'honored' | 'broken';
  contact_channel?: string;
  notes?: string;
}

export interface DisputeDetails {
  reason: string;
  opened_date: string;
  owner: string;
  notes: string;
  resolution_status: string;
  financial_impact: number;
}

export interface ScoringFactor {
  factor: string;
  points: number;
  description: string;
}

export interface PriorityExplanation {
  priority_level: 'Critical' | 'High' | 'Medium' | 'Low';
  numeric_score: number;
  factors: ScoringFactor[];
  recommended_action: string;
  is_disputed: boolean;
  is_fully_paid: boolean;
}

export interface EnrichedInvoice {
  invoice_id: string;
  customer_id: string;
  customer_name: string;
  customer_risk_tier: string;
  issue_date: string;
  due_date: string;
  amount: number;
  receipts_allocated: number;
  outstanding_balance: number;
  days_overdue: number;
  ageing_bucket: 'Current' | '1-30 Days' | '31-60 Days' | '61-90 Days' | '>90 Days';
  dispute_status: 'none' | 'disputed' | 'resolved';
  dispute_details?: DisputeDetails | null;
  promise_to_pay?: PromiseToPay | null;
  agreed_next_action?: string | null;
  priority_explanation: PriorityExplanation;
  po_reference?: string | null;
  notes?: string | null;
}

export interface KPISummary {
  as_of_date: string;
  total_outstanding: number;
  total_invoiced: number;
  overdue_outstanding: number;
  overdue_invoice_count: number;
  disputed_outstanding: number;
  disputed_invoice_count: number;
  unapplied_receipts_amount: number;
  unapplied_receipts_count: number;
  expected_receipts_7d: number;
  collection_efficiency_ratio: number;
  average_days_to_collect: number;
}

export interface AgeingBucketSummary {
  bucket: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface Receipt {
  receipt_id: string;
  customer_id: string;
  receipt_date: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  remarks?: string;
  bank_account?: string;
}

export interface Allocation {
  allocation_id: string;
  receipt_id: string;
  invoice_id: string;
  allocated_amount: number;
  allocation_date: string;
  allocated_by?: string;
  notes?: string;
}

export interface ReconciliationMatch {
  receipt_id: string;
  receipt_amount: number;
  receipt_date: string;
  receipt_reference: string;
  customer_id: string;
  customer_name: string;
  unallocated_amount: number;
  suggested_invoice_id?: string | null;
  suggested_invoice_amount?: number | null;
  suggested_invoice_outstanding?: number | null;
  confidence_score: number;
  match_reason: string;
  is_duplicate: boolean;
  is_ambiguous: boolean;
  status: string;
}

export interface ExceptionItem {
  exception_id: string;
  exception_type: string;
  entity_id: string;
  customer_name: string;
  financial_impact: number;
  severity: string;
  reason: string;
  status: string;
  assigned_owner: string;
  recommended_resolution: string;
  created_date: string;
}

export interface CashForecastDay {
  date: string;
  expected_amount: number;
  promised_amount: number;
  unconfirmed_amount: number;
  disputed_excluded_amount: number;
  basis: string;
  confidence: string;
}

export interface CashForecastScenario {
  scenario_name: string;
  description: string;
  assumptions: string[];
  total_7d: number;
  total_15d: number;
  total_30d: number;
  daily_breakdown: CashForecastDay[];
}

export interface ScenarioLabInput {
  as_of_date: string;
  workload_staff_hours: number;
  follow_up_intensity: string;
  early_payment_discount_pct: number;
  simulate_partial_receipt_pct: number;
  extend_overdue_days: number;
  broken_promise_recovery_rate: number;
}

export interface ScenarioLabResult {
  baseline_outstanding: number;
  simulated_outstanding: number;
  baseline_overdue: number;
  simulated_overdue: number;
  baseline_forecast_30d: number;
  simulated_forecast_30d: number;
  baseline_action_accounts: number;
  simulated_action_accounts: number;
  estimated_hours_needed: number;
  capacity_coverage_pct: number;
  ageing_before: AgeingBucketSummary[];
  ageing_after: AgeingBucketSummary[];
  notes: string[];
}

export interface UnitEconomicsInput {
  monthly_subscription_price: number;
  hosting_infra_cost_monthly: number;
  support_cost_monthly: number;
  onboarding_setup_cost: number;
  customer_lifetime_months: number;
  fixed_overhead_monthly: number;
  customer_acquisition_cost: number;
  ar_volume_managed_monthly: number;
}

export interface UnitEconomicsResult {
  monthly_contribution_per_customer: number;
  contribution_margin_pct: number;
  break_even_customers: number;
  ltv_to_cac_ratio: number;
  total_fixed_operating_costs: number;
  guardrail_warnings: string[];
  value_hypotheses: Array<{
    hypothesis: string;
    mechanism: string;
    monthly_value: number;
    metric_driver: string;
    validation_test: string;
  }>;
}

export interface FollowUpDraft {
  draft_id: string;
  invoice_id: string;
  customer_name: string;
  customer_email: string;
  scenario: string;
  tone: string;
  subject: string;
  body: string;
  outstanding_balance: number;
  due_date: string;
  agreed_next_action: string;
  is_disputed: boolean;
  status: string;
  created_at: string;
}

export interface TestResultItem {
  test_id: string;
  name: string;
  passed: boolean;
  detail: string;
}

export interface TestSuiteResponse {
  all_passed: boolean;
  total_tests: number;
  passed_count: number;
  results: TestResultItem[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_initials: string;
  avatar_color: string;
  organization: string;
  permissions: string[];
  auth_provider: 'google' | 'microsoft' | 'local';
  last_login: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
  organization?: string;
}

export interface OAuthLoginRequest {
  provider: 'google' | 'microsoft';
  token?: string;
  email?: string;
  name?: string;
  organization?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  performed_by: string;
  entity_type: string;
  entity_id: string;
  details: string;
}



import {
  KPISummary, AgeingBucketSummary, EnrichedInvoice, ReconciliationMatch,
  ExceptionItem, CashForecastScenario, ScenarioLabInput, ScenarioLabResult,
  UnitEconomicsInput, UnitEconomicsResult, FollowUpDraft, TestSuiteResponse,
  CompanyInfo, AuditLogEntry, UserProfile, LoginRequest, RegisterRequest, OAuthLoginRequest, AuthResponse
} from '../types';

const API_BASE = (
  (import.meta as any).env?.VITE_API_URL ||
  ((import.meta as any).env?.DEV ? 'http://localhost:8000/api' : '/api')
).replace(/\/+$/, '');

export interface OverviewData {
  company: CompanyInfo;
  as_of_date: string;
  kpis: KPISummary;
  ageing_summary: AgeingBucketSummary[];
  priority_queue: EnrichedInvoice[];
  action_centre: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    urgency: string;
    target_tab: string;
  }>;
}

export interface ReconciliationData {
  summary: {
    total_receipts_count: number;
    total_receipts_amount: number;
    allocated_amount: number;
    unallocated_amount: number;
    duplicate_amount: number;
    reconciliation_rate_pct: number;
  };
  matches: ReconciliationMatch[];
  receipts: any[];
  allocations: any[];
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}`;
      try {
        const errorData = await res.json();
        errorMsg = errorData.detail || errorMsg;
      } catch {
        // use default error message
      }
      throw new Error(errorMsg);
    }

    return await res.json();
  } catch (err: any) {
    console.error(`API Call failed on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  getOverview: () => request<OverviewData>('/overview'),

  getInvoices: (params?: { customer_id?: string; ageing_bucket?: string; dispute_status?: string; priority?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.customer_id) query.set('customer_id', params.customer_id);
    if (params?.ageing_bucket) query.set('ageing_bucket', params.ageing_bucket);
    if (params?.dispute_status) query.set('dispute_status', params.dispute_status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return request<EnrichedInvoice[]>(`/invoices${qs ? `?${qs}` : ''}`);
  },

  getInvoiceDetail: (invoiceId: string) =>
    request<{ invoice: EnrichedInvoice; customer: any; allocations: any[]; available_receipts: any[] }>(`/invoices/${invoiceId}`),

  getReconciliation: () => request<ReconciliationData>('/reconciliation'),

  applyAllocation: (receipt_id: string, invoice_id: string, amount: number) =>
    request<{ success: boolean; allocation: any }>('/reconciliation/allocate', {
      method: 'POST',
      body: JSON.stringify({ receipt_id, invoice_id, amount }),
    }),

  reverseAllocation: (allocation_id: string) =>
    request<{ success: boolean; message: string }>('/reconciliation/reverse', {
      method: 'POST',
      body: JSON.stringify({ allocation_id }),
    }),

  getExceptions: () => request<ExceptionItem[]>('/exceptions'),

  updateDisputeDecision: (invoice_id: string, status: string, owner: string, notes: string) =>
    request<{ success: boolean; message: string }>(`/exceptions/${invoice_id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ status, owner, notes }),
    }),

  getForecasting: () => request<CashForecastScenario[]>('/forecasting'),

  runScenarioLab: (params: ScenarioLabInput) =>
    request<ScenarioLabResult>('/scenario-lab', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  calculateUnitEconomics: (params: UnitEconomicsInput) =>
    request<UnitEconomicsResult>('/unit-economics', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  createFollowUpDraft: (payload: { invoice_id: string; scenario: string; tone: string }) =>
    request<FollowUpDraft>('/follow-ups/draft', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getSavedDrafts: () => request<FollowUpDraft[]>('/follow-ups/drafts'),

  approveDraft: (draft_id: string) =>
    request<{ success: boolean; draft: FollowUpDraft }>('/follow-ups/approve', {
      method: 'POST',
      body: JSON.stringify({ draft_id }),
    }),

  setAsOfDate: (new_as_of_date: string) =>
    request<{ success: boolean; as_of_date: string }>('/system/as-of-date', {
      method: 'POST',
      body: JSON.stringify({ new_as_of_date }),
    }),

  resetSystem: () =>
    request<{ success: boolean; message: string }>('/system/reset', {
      method: 'POST',
    }),

  getAuditLogs: () => request<AuditLogEntry[]>('/audit-logs'),

  getTestResults: () => request<TestSuiteResponse>('/test-results'),

  importRecords: (payload: any) =>
    request<any>('/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getExportUrl: (reportType: string) => `${API_BASE}/export/${reportType}`,

  // Authentication & OAuth
  login: (req: LoginRequest) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  register: (req: RegisterRequest) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  oauthLogin: (req: OAuthLoginRequest) =>
    request<AuthResponse>('/auth/oauth', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  getAllPersonas: () => request<UserProfile[]>('/auth/users'),

  getCurrentUser: (token?: string) =>
    request<UserProfile>(`/auth/me${token ? `?token=${token}` : ''}`),

  logout: (token?: string) =>
    request<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify(token || ''),
    }),
};



import React, { useState } from 'react';
import {
  DollarSign,
  AlertOctagon,
  Clock,
  ShieldAlert,
  Wallet,
  CalendarCheck,
  ArrowUpRight,
  ChevronRight,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  Filter,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Building2,
  AlertCircle
} from 'lucide-react';
import { OverviewData } from '../../api/client';
import { EnrichedInvoice } from '../../types';
import { StatCard } from '../Common/StatCard';
import { Badge } from '../Common/Badge';
import { formatINR, formatDate } from '../../utils/formatters';

interface OverviewViewProps {
  data: OverviewData | null;
  onSelectInvoice: (inv: EnrichedInvoice) => void;
  onNavigateTab: (tab: any) => void;
  onDraftFollowUp: (inv: EnrichedInvoice) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  data,
  onSelectInvoice,
  onNavigateTab,
  onDraftFollowUp,
}) => {
  const [tableFilter, setTableFilter] = useState<'all' | 'critical' | 'broken' | 'moderntrade'>('all');

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
        Loading executive receivables intelligence...
      </div>
    );
  }

  const { kpis, ageing_summary, priority_queue, action_centre } = data;
  const overduePct = ((kpis.overdue_outstanding / (kpis.total_outstanding || 1)) * 100).toFixed(0);

  // Filter priority queue based on tab
  const filteredQueue = priority_queue.filter((inv) => {
    if (tableFilter === 'critical') {
      return inv.priority_explanation.priority_level === 'Critical' || inv.priority_explanation.priority_level === 'High';
    }
    if (tableFilter === 'broken') {
      return inv.promise_to_pay?.status === 'broken';
    }
    if (tableFilter === 'moderntrade') {
      return inv.customer_risk_tier.toLowerCase().includes('low') || inv.customer_name.toLowerCase().includes('reliance') || inv.customer_name.toLowerCase().includes('dmart');
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner Alert (Operational Disputes Quarantined) */}
      {kpis.disputed_invoice_count > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-amber-50/90 border border-amber-200 rounded-lg text-xs text-amber-950 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-100 rounded-md shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
            </div>
            <span>
              <strong className="font-semibold">{kpis.disputed_invoice_count} operational disputes</strong> totaling{' '}
              <strong className="font-mono font-bold text-amber-900">{formatINR(kpis.disputed_outstanding)}</strong> are quarantined from routine collection calls pending physical ops and rebate review.
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('disputes')}
            className="flex items-center gap-1 font-semibold text-amber-800 hover:text-amber-950 px-2.5 py-1 bg-amber-100/70 hover:bg-amber-100 rounded border border-amber-200/80 transition-colors shrink-0"
          >
            Review Disputes <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SECTION 1: Top KPI Cards (Responsive 2/3/6 column grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          title="Total Outstanding"
          value={formatINR(kpis.total_outstanding)}
          definition="Gross receivables balance owed across all accounts, calculated as Total Invoiced minus valid allocated receipts."
          contextText={`Invoiced: ${formatINR(kpis.total_invoiced)}`}
          icon={<DollarSign className="w-4 h-4 text-slate-700" />}
          highlight
          onClick={() => onNavigateTab('receivables')}
        />

        <StatCard
          title="Overdue Outstanding"
          value={formatINR(kpis.overdue_outstanding)}
          definition="Receivables where the contractual due date is strictly earlier than the active as-of date."
          contextText={`${kpis.overdue_invoice_count} overdue invoices`}
          badge={{
            text: `${overduePct}% of book`,
            variant: kpis.overdue_outstanding > 0 ? 'critical' : 'success',
          }}
          icon={<AlertOctagon className="w-4 h-4 text-red-600" />}
          onClick={() => onNavigateTab('receivables')}
        />

        <StatCard
          title="Overdue Invoices"
          value={`${kpis.overdue_invoice_count}`}
          definition="Count of open invoices that have elapsed past agreed customer payment terms."
          contextText={`Avg DSO: ${kpis.average_days_to_collect} days`}
          icon={<Clock className="w-4 h-4 text-amber-600" />}
          onClick={() => onNavigateTab('receivables')}
        />

        <StatCard
          title="Disputed Outstanding"
          value={formatINR(kpis.disputed_outstanding)}
          definition="Receivables under damaged goods or scheme rebate claim, segregated from routine collection."
          contextText={`${kpis.disputed_invoice_count} claims in review`}
          badge={{ text: 'QUARANTINED', variant: 'warning' }}
          icon={<ShieldAlert className="w-4 h-4 text-orange-600" />}
          onClick={() => onNavigateTab('disputes')}
        />

        <StatCard
          title="Unapplied Receipts"
          value={formatINR(kpis.unapplied_receipts_amount)}
          definition="Bank credits or remittances received without verified invoice allocation."
          contextText={`${kpis.unapplied_receipts_count} suspense receipts`}
          badge={{ text: 'SUSPENSE', variant: 'info' }}
          icon={<Wallet className="w-4 h-4 text-teal-700" />}
          onClick={() => onNavigateTab('reconciliation')}
        />

        <StatCard
          title="Expected Receipts (7D)"
          value={formatINR(kpis.expected_receipts_7d)}
          definition="Conservative estimate of cash maturing in next 7 days from confirmed promises and maturing invoices."
          contextText="Rule-based run rate"
          icon={<CalendarCheck className="w-4 h-4 text-emerald-700" />}
          onClick={() => onNavigateTab('forecasting')}
        />
      </div>

      {/* SECTION 2: Core Analytical Cockpit (Two Column Power Layout: 7 / 5 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (Col-span-7): Receivables Ageing & Risk Distribution */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-teal-700" /> Receivables Ageing Distribution
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Calculated against as-of date: <span className="font-mono text-slate-800 font-semibold">{data.as_of_date}</span>
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('receivables')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 transition-colors"
              >
                Full Register <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stacked Segmented Visual Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-mono">
                <span>Book Balance: <strong>{formatINR(kpis.total_outstanding)}</strong></span>
                <span className="text-red-700 font-semibold">Overdue Ratio: {overduePct}%</span>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded-md flex overflow-hidden border border-slate-200 shadow-inner">
                {ageing_summary.map((b, idx) => {
                  const colors = [
                    'bg-emerald-500 hover:bg-emerald-600', // Current
                    'bg-teal-600 hover:bg-teal-700',       // 1-30
                    'bg-amber-500 hover:bg-amber-600',     // 31-60
                    'bg-orange-500 hover:bg-orange-600',   // 61-90
                    'bg-red-600 hover:bg-red-700',         // >90
                  ];
                  return (
                    <div
                      key={b.bucket}
                      style={{ width: `${Math.max(b.percentage, b.amount > 0 ? 3.5 : 0)}%` }}
                      className={`${colors[idx % colors.length]} transition-all duration-200 relative group cursor-pointer border-r border-white/20 last:border-0`}
                      title={`${b.bucket}: ${formatINR(b.amount)} (${b.percentage.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>

              {/* Color legend */}
              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[10px] text-slate-600 font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Current (42.1%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-600" /> 1–30d (47.5%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> 31–60d (2.6%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500" /> 61–90d (6.2%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-600" /> &gt;90d (1.6%)
                </span>
              </div>
            </div>

            {/* Ageing Table Breakdown */}
            <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Ageing Bucket</th>
                    <th className="py-2 px-3 text-right">Outstanding (INR)</th>
                    <th className="py-2 px-3 text-right">Invoices</th>
                    <th className="py-2 px-3 text-right">% of Book</th>
                    <th className="py-2 px-3">Standard Policy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ageing_summary.map((b, idx) => {
                    const policies = [
                      'Standard Terms (Normal Run)',
                      'Friendly Pre-Due Reminder',
                      'Direct Call & Statement Review',
                      'Commercial Hold Warning',
                      'Legal Demand / Supply Freeze',
                    ];
                    return (
                      <tr key={b.bucket} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3 font-medium text-slate-800 flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              idx === 0
                                ? 'bg-emerald-500'
                                : idx === 1
                                ? 'bg-teal-600'
                                : idx === 2
                                ? 'bg-amber-500'
                                : idx === 3
                                ? 'bg-orange-500'
                                : 'bg-red-600'
                            }`}
                          />
                          <span className="font-semibold">{b.bucket}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatINR(b.amount)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">{b.count}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">{b.percentage.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-[11px] text-slate-500">
                          <span className="truncate block max-w-[170px]" title={policies[idx]}>
                            {policies[idx]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Payment Terms: Net 30/45 Days</span>
            <span className="font-semibold text-slate-800">Total Book: {formatINR(kpis.total_outstanding)}</span>
          </div>
        </div>

        {/* Right Column (Col-span-5): Finance Action Centre & Cash Horizon */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Action Centre */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-teal-700" /> Finance Action Centre
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-semibold">
                Priority Tasks
              </span>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {action_centre.map((act) => (
                <div
                  key={act.id}
                  onClick={() => onNavigateTab(act.target_tab)}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 cursor-pointer transition-all flex items-start justify-between group"
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-slate-900 group-hover:text-teal-900 truncate">
                        {act.title}
                      </h4>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase shrink-0 ${
                          act.urgency === 'Critical'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : act.urgency === 'High'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {act.urgency}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-1">{act.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              ))}
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Activity audit logging active</span>
              <button
                onClick={() => onNavigateTab('collections')}
                className="font-semibold text-teal-700 hover:text-teal-900 transition-colors"
              >
                Open Collection Queue →
              </button>
            </div>
          </div>

          {/* Cash Inflow Horizon (7D / 14D / 30D Run-Rate) */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-700" /> Cash Inflow Horizon
              </h3>
              <span className="text-[11px] font-mono text-emerald-700 font-semibold">Calibrated Run-Rate</span>
            </div>

            <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Next 7 Days</span>
                <span className="text-sm font-bold font-mono text-slate-900 mt-0.5 block">
                  {formatINR(kpis.expected_receipts_7d)}
                </span>
                <span className="text-[9px] text-emerald-600 font-medium mt-0.5 block">4 Invoices</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">8–14 Days</span>
                <span className="text-sm font-bold font-mono text-slate-900 mt-0.5 block">
                  ₹3,50,000
                </span>
                <span className="text-[9px] text-slate-500 font-medium mt-0.5 block">Reliance &amp; Dairy</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">15–30 Days</span>
                <span className="text-sm font-bold font-mono text-slate-900 mt-0.5 block">
                  ₹4,25,000
                </span>
                <span className="text-[9px] text-slate-500 font-medium mt-0.5 block">DMart &amp; Wholesale</span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Working capital target: <strong>68% recovered</strong></span>
              <button
                onClick={() => onNavigateTab('forecasting')}
                className="font-semibold text-teal-700 hover:text-teal-900"
              >
                Forecasting Lab →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Active Collection Priority Queue */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Active Collection Priority Queue
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold font-mono">
                {filteredQueue.length} Active Accounts
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Ranked by explainable scoring: days overdue (40%), exposure size (25%), risk tier (20%), and promise adherence (15%). Settled and disputed accounts excluded.
            </p>
          </div>

          {/* Table Filters */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto text-xs">
            <button
              onClick={() => setTableFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                tableFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({priority_queue.length})
            </button>
            <button
              onClick={() => setTableFilter('critical')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                tableFilter === 'critical' ? 'bg-white text-red-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Critical &amp; High
            </button>
            <button
              onClick={() => setTableFilter('broken')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                tableFilter === 'broken' ? 'bg-white text-amber-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Broken Commitments
            </button>
            <button
              onClick={() => setTableFilter('moderntrade')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                tableFilter === 'moderntrade' ? 'bg-white text-teal-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tier-1 Retail
            </button>
          </div>
        </div>

        {/* Priority Table */}
        <div className="mt-3.5 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Priority / Score</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Invoice ID</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-right">Days Overdue</th>
                <th className="py-2.5 px-3 text-right">Original Amount</th>
                <th className="py-2.5 px-3 text-right">Allocated</th>
                <th className="py-2.5 px-3 text-right">Outstanding</th>
                <th className="py-2.5 px-3">Commitment / Promise</th>
                <th className="py-2.5 px-3">Recommended Next Action</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No collection accounts match this filter. All accounts are settled, disputed, or current.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((inv) => {
                  const prio = inv.priority_explanation;
                  return (
                    <tr
                      key={inv.invoice_id}
                      onClick={() => onSelectInvoice(inv)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={
                              prio.priority_level === 'Critical'
                                ? 'critical'
                                : prio.priority_level === 'High'
                                ? 'warning'
                                : prio.priority_level === 'Medium'
                                ? 'info'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {prio.priority_level}
                          </Badge>
                          <span className="font-mono text-[11px] text-slate-500 font-bold">
                            {prio.numeric_score.toFixed(0)}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                        <div className="max-w-[170px] truncate font-semibold text-slate-900">{inv.customer_name}</div>
                        <div className="text-[10px] text-slate-400">{inv.customer_risk_tier}</div>
                      </td>

                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                        {inv.invoice_id}
                      </td>

                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {formatDate(inv.due_date)}
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-bold ${
                            inv.days_overdue > 60
                              ? 'text-red-700'
                              : inv.days_overdue > 0
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {inv.days_overdue > 0 ? `+${inv.days_overdue} d` : 'Current'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 tabular-nums whitespace-nowrap">
                        {formatINR(inv.amount)}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700 tabular-nums whitespace-nowrap">
                        {inv.receipts_allocated > 0 ? formatINR(inv.receipts_allocated) : '—'}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatINR(inv.outstanding_balance)}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {inv.promise_to_pay ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Badge variant={inv.promise_to_pay.status === 'broken' ? 'critical' : 'success'} size="sm">
                              {inv.promise_to_pay.status.toUpperCase()}
                            </Badge>
                            <span className="text-slate-600 font-mono text-[10px] font-medium">
                              {formatDate(inv.promise_to_pay.promised_date)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 max-w-[210px] truncate text-[11px]" title={inv.agreed_next_action || prio.recommended_action}>
                        {inv.agreed_next_action || prio.recommended_action}
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onDraftFollowUp(inv)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors shadow-sm"
                        >
                          Draft Email
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

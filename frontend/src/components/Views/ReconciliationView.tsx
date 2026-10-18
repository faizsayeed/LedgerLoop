import React, { useState } from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Link,
  ShieldCheck,
  Building,
  Plus,
  X,
  HelpCircle
} from 'lucide-react';
import { ReconciliationData } from '../../api/client';
import { ReconciliationMatch, EnrichedInvoice } from '../../types';
import { Badge } from '../Common/Badge';
import { formatINR, formatDate, formatPercent } from '../../utils/formatters';

interface ReconciliationViewProps {
  data: ReconciliationData | null;
  invoices?: EnrichedInvoice[];
  onApplyAllocation: (receiptId: string, invoiceId: string, amount: number) => Promise<void>;
  onReverseAllocation: (allocationId: string) => Promise<void>;
  onRefresh: () => void;
}

export const ReconciliationView: React.FC<ReconciliationViewProps> = ({
  data,
  invoices = [],
  onApplyAllocation,
  onReverseAllocation,
  onRefresh,
}) => {
  const [selectedMatch, setSelectedMatch] = useState<ReconciliationMatch | null>(null);
  const [allocAmount, setAllocAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual Allocation Modal State
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualReceiptId, setManualReceiptId] = useState<string>('');
  const [manualInvoiceId, setManualInvoiceId] = useState<string>('');
  const [manualAmount, setManualAmount] = useState<number>(0);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
        Loading smart payment reconciliation workspace...
      </div>
    );
  }

  const { summary, matches, allocations, receipts } = data;

  // Unapplied receipts for manual matching
  const unappliedReceipts = receipts.filter((r) => {
    const allocated = allocations
      .filter((a) => a.receipt_id === r.receipt_id)
      .reduce((s, a) => s + a.allocated_amount, 0);
    return r.amount - allocated > 0.001 && !r.receipt_id.endsWith('-DUP');
  });

  const handleOpenAllocateModal = (m: ReconciliationMatch) => {
    setSelectedMatch(m);
    const suggestedAmt = Math.min(
      m.unallocated_amount,
      m.suggested_invoice_outstanding ?? m.unallocated_amount
    );
    setAllocAmount(suggestedAmt);
    setErrorMessage(null);
  };

  const handleConfirmAllocation = async () => {
    if (!selectedMatch || !selectedMatch.suggested_invoice_id) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onApplyAllocation(
        selectedMatch.receipt_id,
        selectedMatch.suggested_invoice_id,
        allocAmount
      );
      setSelectedMatch(null);
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to apply allocation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReceiptId || !manualInvoiceId || manualAmount <= 0) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onApplyAllocation(manualReceiptId, manualInvoiceId, manualAmount);
      setShowManualModal(false);
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Manual allocation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* SECTION 1: Reconciliation Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Bank Receipts Ingested
          </span>
          <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1 truncate">
            {formatINR(summary.total_receipts_amount)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {summary.total_receipts_count} total remittances
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Matched &amp; Allocated
          </span>
          <p className="text-xl font-bold text-emerald-700 font-mono tabular-nums mt-1 truncate">
            {formatINR(summary.allocated_amount)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {allocations.length} committed ledger allocations
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Unapplied Suspense Balance
          </span>
          <p className="text-xl font-bold text-amber-700 font-mono tabular-nums mt-1 truncate">
            {formatINR(summary.unallocated_amount)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Awaiting automated/human link
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Quarantined Duplicates
          </span>
          <p className="text-xl font-bold text-red-700 font-mono tabular-nums mt-1 truncate">
            {formatINR(summary.duplicate_amount)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Identical UTR entries isolated
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Reconciliation Rate
          </span>
          <p className="text-xl font-bold text-teal-800 font-mono tabular-nums mt-1 truncate">
            {formatPercent(summary.reconciliation_rate_pct)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Throughput efficiency
          </span>
        </div>
      </div>

      {/* SECTION 2: Smart Suggested Matches Queue */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" /> Smart Automated Match Queue
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold font-mono">
                {matches.length} Unallocated Remittances
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Heuristic candidate matching derived from UTR remarks, customer ID, exact outstanding balance, and FIFO date alignment. Human confirmation required.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (unappliedReceipts.length > 0) {
                  setManualReceiptId(unappliedReceipts[0].receipt_id);
                  setManualAmount(unappliedReceipts[0].amount);
                }
                if (invoices.length > 0) {
                  setManualInvoiceId(invoices[0].invoice_id);
                }
                setShowManualModal(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600" /> Manual Allocation
            </button>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Receipt ID / UTR</th>
                <th className="py-2.5 px-3">Receipt Date</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3 text-right">Unapplied Amt</th>
                <th className="py-2.5 px-3">Suggested Target</th>
                <th className="py-2.5 px-3 text-right">Target Balance</th>
                <th className="py-2.5 px-3 text-center">Confidence</th>
                <th className="py-2.5 px-3">Match Reason &amp; Heuristic</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    All ingested bank receipts are 100% reconciled and applied!
                  </td>
                </tr>
              ) : (
                matches.map((m) => {
                  return (
                    <tr
                      key={m.receipt_id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        m.is_duplicate ? 'bg-red-50/40' : ''
                      }`}
                    >
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-900">{m.receipt_id}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
                          {m.receipt_reference}
                        </div>
                      </td>

                      <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {formatDate(m.receipt_date)}
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{m.customer_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{m.customer_id}</div>
                      </td>

                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatINR(m.unallocated_amount)}
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        {m.suggested_invoice_id ? (
                          <span className="font-mono font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {m.suggested_invoice_id}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No direct match</span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                        {m.suggested_invoice_outstanding !== null && m.suggested_invoice_outstanding !== undefined
                          ? formatINR(m.suggested_invoice_outstanding)
                          : '—'}
                      </td>

                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        {m.is_duplicate ? (
                          <Badge variant="critical" size="sm">DUPLICATE</Badge>
                        ) : m.is_ambiguous ? (
                          <Badge variant="warning" size="sm">AMBIGUOUS</Badge>
                        ) : m.confidence_score >= 0.85 ? (
                          <Badge variant="success" size="sm">{(m.confidence_score * 100).toFixed(0)}% MATCH</Badge>
                        ) : m.confidence_score > 0 ? (
                          <Badge variant="info" size="sm">{(m.confidence_score * 100).toFixed(0)}% FIFO</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">0%</Badge>
                        )}
                      </td>

                      <td className="py-2 px-3 text-slate-600 max-w-[240px] truncate text-[11px]" title={m.match_reason}>
                        {m.match_reason}
                      </td>

                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        {m.is_duplicate ? (
                          <span className="text-red-700 text-[11px] font-bold">Quarantined</span>
                        ) : m.suggested_invoice_id ? (
                          <button
                            onClick={() => handleOpenAllocateModal(m)}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-sm"
                          >
                            Confirm Match
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setManualReceiptId(m.receipt_id);
                              setManualAmount(m.unallocated_amount);
                              setShowManualModal(true);
                            }}
                            className="px-2 py-1 text-[11px] font-medium text-teal-800 hover:bg-teal-50 border border-teal-200 rounded"
                          >
                            Manual Link
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: Committed Allocations Ledger */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Committed Receipt Allocations (Auditable &amp; Reversible)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Traceable links tying customer bank remittances to invoice settlements. Allocations can be reversed if posted in error.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400 font-semibold">
            {allocations.length} Active Allocations
          </span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Allocation ID</th>
                <th className="py-2 px-3">Receipt ID</th>
                <th className="py-2 px-3">Settled Invoice</th>
                <th className="py-2 px-3 text-right">Allocated Amount</th>
                <th className="py-2 px-3">Posting Date</th>
                <th className="py-2 px-3">Posted By</th>
                <th className="py-2 px-3">Audit Notes</th>
                <th className="py-2 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allocations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    No receipt allocations recorded yet.
                  </td>
                </tr>
              ) : (
                allocations.map((a) => (
                  <tr key={a.allocation_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                      {a.allocation_id}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {a.receipt_id}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-teal-800 whitespace-nowrap">
                      {a.invoice_id}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                      {formatINR(a.allocated_amount)}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {formatDate(a.allocation_date)}
                    </td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap font-medium">
                      {a.allocated_by || 'System'}
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-[11px] max-w-[210px] truncate">
                      {a.notes || '—'}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => onReverseAllocation(a.allocation_id)}
                        className="px-2 py-0.5 text-[11px] font-semibold text-red-700 hover:text-red-900 hover:bg-red-50 border border-red-200 rounded transition-colors"
                      >
                        Reverse
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Human-In-The-Loop Allocation Confirmation Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Link className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Confirm Payment Allocation</h3>
                <p className="text-[11px] text-slate-500">
                  Review proposed reconciliation link before committing to the ledger.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                {errorMessage}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt Ref:</span>
                  <span className="font-mono font-medium text-slate-800">{selectedMatch.receipt_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold text-slate-800">{selectedMatch.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unapplied Balance:</span>
                  <span className="font-mono font-bold text-slate-900">{formatINR(selectedMatch.unallocated_amount)}</span>
                </div>
              </div>

              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Target Invoice:</span>
                  <span className="font-mono font-bold text-teal-900">{selectedMatch.suggested_invoice_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Invoice Outstanding:</span>
                  <span className="font-mono font-bold text-teal-950">
                    {formatINR(selectedMatch.suggested_invoice_outstanding ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] pt-1 border-t border-teal-100">
                  <span className="text-slate-500">Match Rationale:</span>
                  <span className="text-teal-900 text-right font-medium max-w-[200px] truncate">{selectedMatch.match_reason}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Allocation Amount (INR ₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={Math.min(selectedMatch.unallocated_amount, selectedMatch.suggested_invoice_outstanding ?? Infinity)}
                  value={allocAmount}
                  onChange={(e) => setAllocAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Guarded by Test H: Exceeding invoice balance or receipt balance will be rejected.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                disabled={isSubmitting}
                onClick={() => setSelectedMatch(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-200 rounded"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting || allocAmount <= 0}
                onClick={handleConfirmAllocation}
                className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded disabled:opacity-50 transition-colors shadow-sm"
              >
                {isSubmitting ? 'Posting...' : 'Commit Allocation to Ledger'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Allocation Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Manual Payment Allocation</h3>
              </div>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Select Unapplied Receipt</label>
                <select
                  value={manualReceiptId}
                  onChange={(e) => {
                    setManualReceiptId(e.target.value);
                    const rec = receipts.find((r) => r.receipt_id === e.target.value);
                    if (rec) setManualAmount(rec.amount);
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                >
                  {unappliedReceipts.map((r) => (
                    <option key={r.receipt_id} value={r.receipt_id}>
                      {r.receipt_id} — {formatINR(r.amount)} ({r.remarks || r.payment_method})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Target Open Invoice</label>
                <select
                  value={manualInvoiceId}
                  onChange={(e) => setManualInvoiceId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                >
                  {invoices
                    .filter((i) => i.outstanding_balance > 0.001)
                    .map((i) => (
                      <option key={i.invoice_id} value={i.invoice_id}>
                        {i.invoice_id} — {i.customer_name} ({formatINR(i.outstanding_balance)} due)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Allocation Amount (INR ₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={manualAmount}
                  onChange={(e) => setManualAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || manualAmount <= 0}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold"
                >
                  Apply Manual Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

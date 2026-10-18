import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Plus,
  X,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { ExceptionItem, EnrichedInvoice } from '../../types';
import { Badge } from '../Common/Badge';
import { formatINR } from '../../utils/formatters';

interface DisputesViewProps {
  exceptions: ExceptionItem[];
  invoices?: EnrichedInvoice[];
  onUpdateDecision: (invoiceId: string, status: string, owner: string, notes: string) => Promise<void>;
  onRefresh: () => void;
}

export const DisputesView: React.FC<DisputesViewProps> = ({
  exceptions,
  invoices = [],
  onUpdateDecision,
  onRefresh,
}) => {
  const [selectedException, setSelectedException] = useState<ExceptionItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>('Under Investigation');
  const [assignedOwner, setAssignedOwner] = useState<string>('');
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [resolutionOutcome, setResolutionOutcome] = useState<string>('credit_note');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Dispute Modal
  const [showRaiseModal, setShowRaiseModal] = useState<boolean>(false);
  const [disputeInvoiceId, setDisputeInvoiceId] = useState<string>('');
  const [disputeReason, setDisputeReason] = useState<string>('Transit damage - 15 master cartons crushed');
  const [disputeOwner, setDisputeOwner] = useState<string>('Rohan Gupta (Warehouse Ops)');

  const filteredExceptions = exceptions.filter((e) => {
    if (filterType !== 'ALL' && e.exception_type !== filterType) return false;
    return true;
  });

  const handleOpenReview = (item: ExceptionItem) => {
    setSelectedException(item);
    setReviewStatus(item.status);
    setAssignedOwner(item.assigned_owner || 'Rohan Gupta (Warehouse Ops)');
    setDecisionNotes('');
  };

  const handleSaveDecision = async () => {
    if (!selectedException) return;
    setIsSubmitting(true);
    try {
      const formattedNotes = decisionNotes
        ? `${decisionNotes} [Action: ${resolutionOutcome.replace('_', ' ')}]`
        : `Resolution decision logged. Status: ${reviewStatus}. Action: ${resolutionOutcome.replace('_', ' ')}.`;
      await onUpdateDecision(
        selectedException.entity_id,
        reviewStatus,
        assignedOwner,
        formattedNotes
      );
      setSelectedException(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to update decision', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRaiseDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeInvoiceId) return;
    setIsSubmitting(true);
    try {
      await onUpdateDecision(
        disputeInvoiceId,
        'under_investigation',
        disputeOwner,
        disputeReason
      );
      setShowRaiseModal(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to raise dispute', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalExposure = exceptions.reduce((s, e) => s + e.financial_impact, 0);

  return (
    <div className="space-y-5">
      {/* Top Exception Metrics Strip */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 divide-x divide-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Backlog</span>
            <p className="text-base font-bold text-slate-900 font-mono tabular-nums">{exceptions.length} Items</p>
          </div>
          <div className="pl-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Financial Exposure</span>
            <p className="text-base font-bold text-red-700 font-mono tabular-nums">{formatINR(totalExposure)}</p>
          </div>
          <div className="pl-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Disputes</span>
            <p className="text-base font-bold text-amber-700 font-mono tabular-nums">
              {exceptions.filter((e) => e.exception_type === 'dispute').length} Claims
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 text-xs bg-slate-50 p-1 border border-slate-200 rounded-md">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              filterType === 'ALL' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({exceptions.length})
          </button>
          <button
            onClick={() => setFilterType('dispute')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              filterType === 'dispute' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Disputes
          </button>
          <button
            onClick={() => setFilterType('potential_duplicate')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              filterType === 'potential_duplicate' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Duplicates
          </button>
          <button
            onClick={() => setFilterType('unapplied_receipt')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              filterType === 'unapplied_receipt' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unapplied
          </button>
          <button
            onClick={() => setFilterType('missed_promise')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              filterType === 'missed_promise' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Promises
          </button>
        </div>
      </div>

      {/* Exception Queue Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Active Exception &amp; Dispute Management Queue
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Auditable exception workflow for delivery damage claims, commercial rate disputes, duplicate bank feeds, and missed promises.
            </p>
          </div>

          <button
            onClick={() => {
              if (invoices.length > 0) setDisputeInvoiceId(invoices[0].invoice_id);
              setShowRaiseModal(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 text-teal-400" /> Log Dispute Claim
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Entity ID</th>
                <th className="py-2 px-3">Customer</th>
                <th className="py-2 px-3 text-right">Exposure (INR)</th>
                <th className="py-2 px-3">Severity</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Case Owner</th>
                <th className="py-2 px-3">Reason / Details</th>
                <th className="py-2 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExceptions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No open exceptions under this category.
                  </td>
                </tr>
              ) : (
                filteredExceptions.map((item) => (
                  <tr key={item.exception_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="font-bold text-slate-700 capitalize text-[11px]">
                        {item.exception_type.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-2 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {item.entity_id}
                    </td>

                    <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {item.customer_name}
                    </td>

                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                      {formatINR(item.financial_impact)}
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">
                      <Badge
                        variant={
                          item.severity === 'Critical'
                            ? 'critical'
                            : item.severity === 'High'
                            ? 'warning'
                            : 'info'
                        }
                        size="sm"
                      >
                        {item.severity}
                      </Badge>
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {item.status}
                      </span>
                    </td>

                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap text-[11px]">
                      {item.assigned_owner}
                    </td>

                    <td className="py-2 px-3 text-slate-600 max-w-[220px] truncate text-[11px]" title={item.reason}>
                      {item.reason}
                    </td>

                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleOpenReview(item)}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors shadow-sm"
                      >
                        Review Decision
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Workflow Modal */}
      {selectedException && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldAlert className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Record Exception Review Decision: {selectedException.entity_id}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Audited state transition recorded to system activity logs.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800">{selectedException.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Financial Exposure:</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(selectedException.financial_impact)}</span>
              </div>
              <div className="pt-1 text-[11px] text-slate-600">
                <span className="font-medium text-slate-700">Root Cause:</span> {selectedException.reason}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Review Status
                  </label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Open">Open (Pending Inspection)</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Escalated">Escalated to Area Manager</option>
                    <option value="resolved">Resolved (Close Exception)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Resolution Mechanism
                  </label>
                  <select
                    value={resolutionOutcome}
                    onChange={(e) => setResolutionOutcome(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="credit_note">Issue Debit / Credit Note Adjustment</option>
                    <option value="replacement_stock">Deliver Replacement Consignment</option>
                    <option value="dispute_rejected">Dispute Rejected (Enforce Full Payment)</option>
                    <option value="investigation_active">Keep In Suspense for Survey</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Assigned Case Owner
                </label>
                <input
                  type="text"
                  value={assignedOwner}
                  onChange={(e) => setAssignedOwner(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. Rohan Gupta (Warehouse Ops)"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Decision Notes &amp; Next Action
                </label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Enter audit rationale, inspected documents, or agreed credit note numbers..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                disabled={isSubmitting}
                onClick={() => setSelectedException(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-200 rounded"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleSaveDecision}
                className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-sm"
              >
                {isSubmitting ? 'Saving...' : 'Commit Decision to Audit Trail'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Dispute Modal */}
      {showRaiseModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Log Customer Dispute Claim</h3>
              </div>
              <button onClick={() => setShowRaiseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRaiseDisputeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Invoice</label>
                <select
                  value={disputeInvoiceId}
                  onChange={(e) => setDisputeInvoiceId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                >
                  {invoices
                    .filter((i) => i.dispute_status !== 'disputed')
                    .map((i) => (
                      <option key={i.invoice_id} value={i.invoice_id}>
                        {i.invoice_id} — {i.customer_name} ({formatINR(i.outstanding_balance)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Claim Reason &amp; Description</label>
                <textarea
                  rows={3}
                  required
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assigned Investigator</label>
                <input
                  type="text"
                  required
                  value={disputeOwner}
                  onChange={(e) => setDisputeOwner(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRaiseModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold"
                >
                  Quarantine &amp; Log Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { X, Calendar, User, FileText, CheckCircle2, ShieldAlert, AlertTriangle, ArrowRight, Clock, Building } from 'lucide-react';
import { EnrichedInvoice } from '../../types';
import { formatINR, formatDate } from '../../utils/formatters';
import { Badge } from './Badge';

interface DetailDrawerProps {
  invoice: EnrichedInvoice | null;
  onClose: () => void;
  onDraftFollowUp?: (inv: EnrichedInvoice) => void;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  invoice,
  onClose,
  onDraftFollowUp,
}) => {
  if (!invoice) return null;

  const prio = invoice.priority_explanation;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-[2px] transition-opacity">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white border-l border-slate-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 text-white rounded">
                <FileText className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900">{invoice.invoice_id}</h2>
                  {invoice.dispute_status === 'disputed' ? (
                    <Badge variant="dispute">DISPUTED</Badge>
                  ) : invoice.outstanding_balance <= 0.001 ? (
                    <Badge variant="success">PAID IN FULL</Badge>
                  ) : (
                    <Badge
                      variant={
                        prio.priority_level === 'Critical'
                          ? 'critical'
                          : prio.priority_level === 'High'
                          ? 'warning'
                          : 'info'
                      }
                    >
                      {prio.priority_level.toUpperCase()} PRIORITY ({prio.numeric_score.toFixed(0)} pts)
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{invoice.customer_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
            {/* Financial Balance Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 grid grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400">Invoice Amount</span>
                <p className="text-base font-bold text-slate-900 tabular-nums mt-0.5">{formatINR(invoice.amount)}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400">Allocated Receipts</span>
                <p className="text-base font-bold text-emerald-700 tabular-nums mt-0.5">{formatINR(invoice.receipts_allocated)}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400">Net Outstanding</span>
                <p className="text-base font-bold text-slate-900 tabular-nums mt-0.5">{formatINR(invoice.outstanding_balance)}</p>
              </div>
            </div>

            {/* Dates & Ageing */}
            <div className="border border-slate-200 rounded-md p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" /> Lifecycle & Maturity
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Issue Date:</span>
                  <span className="ml-2 font-medium text-slate-800">{formatDate(invoice.issue_date)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Due Date:</span>
                  <span className="ml-2 font-medium text-slate-800">{formatDate(invoice.due_date)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Overdue Status:</span>
                  <span className={`ml-2 font-semibold ${invoice.days_overdue > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                    {invoice.days_overdue > 0 ? `${invoice.days_overdue} days overdue` : 'Current / Not Overdue'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Ageing Bucket:</span>
                  <span className="ml-2 font-medium text-slate-800">{invoice.ageing_bucket}</span>
                </div>
                {invoice.po_reference && (
                  <div className="col-span-2">
                    <span className="text-slate-500">PO Reference:</span>
                    <span className="ml-2 font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{invoice.po_reference}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Explainable Prioritization Breakdown */}
            <div className="border border-slate-200 rounded-md p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-teal-600" /> Explainable Scoring Methodology
                </h3>
                <span className="text-xs font-semibold text-slate-700">Total Score: {prio.numeric_score.toFixed(0)}/100</span>
              </div>
              <p className="text-xs text-slate-500">
                Rule-based audit trace derived from days overdue, exposure size, risk profile, and commitment history.
              </p>
              <div className="space-y-2 pt-1">
                {prio.factors.map((f, idx) => (
                  <div key={idx} className="flex items-start justify-between p-2 bg-slate-50 rounded border border-slate-100 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{f.factor}</span>
                      <p className="text-slate-500 text-[11px] mt-0.5">{f.description}</p>
                    </div>
                    <span className={`font-mono font-bold ${f.points >= 0 ? 'text-slate-800' : 'text-emerald-600'}`}>
                      {f.points >= 0 ? `+${f.points.toFixed(0)}` : f.points.toFixed(0)} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dispute Details (if any) */}
            {invoice.dispute_details && (
              <div className="border border-orange-200 bg-orange-50/50 rounded-md p-4 space-y-2">
                <div className="flex items-center gap-2 text-orange-900 font-semibold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-orange-600" /> Active Operational Dispute
                </div>
                <div className="text-xs space-y-1.5 text-slate-700">
                  <p><span className="font-medium text-slate-900">Reason:</span> {invoice.dispute_details.reason}</p>
                  <p><span className="font-medium text-slate-900">Assigned Owner:</span> {invoice.dispute_details.owner}</p>
                  <p><span className="font-medium text-slate-900">Resolution Status:</span> <span className="capitalize font-semibold text-orange-800">{invoice.dispute_details.resolution_status.replace('_', ' ')}</span></p>
                  <p className="text-slate-600 italic bg-white/70 p-2 rounded border border-orange-100">{invoice.dispute_details.notes}</p>
                </div>
              </div>
            )}

            {/* Promise to Pay (if any) */}
            {invoice.promise_to_pay && (
              <div className={`border rounded-md p-4 space-y-2 ${invoice.promise_to_pay.status === 'broken' ? 'border-red-200 bg-red-50/40' : 'border-teal-200 bg-teal-50/40'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-teal-700" /> Payment Commitment Record
                  </span>
                  <Badge variant={invoice.promise_to_pay.status === 'broken' ? 'critical' : 'success'}>
                    {invoice.promise_to_pay.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-xs space-y-1 text-slate-700">
                  <p><span className="font-medium">Promised Amount:</span> <span className="font-bold">{formatINR(invoice.promise_to_pay.promised_amount)}</span></p>
                  <p><span className="font-medium">Commitment Date:</span> {formatDate(invoice.promise_to_pay.promised_date)}</p>
                  {invoice.promise_to_pay.contact_channel && <p><span className="font-medium">Channel:</span> {invoice.promise_to_pay.contact_channel}</p>}
                  {invoice.promise_to_pay.notes && <p className="text-slate-500 italic mt-1">{invoice.promise_to_pay.notes}</p>}
                </div>
              </div>
            )}

            {/* Recommended Next Action */}
            <div className="border border-slate-200 rounded-md p-4 bg-slate-900 text-white space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-400">Agreed Next Action</span>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {invoice.agreed_next_action || prio.recommended_action}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            {onDraftFollowUp && invoice.outstanding_balance > 0.001 && (
              <button
                onClick={() => {
                  onDraftFollowUp(invoice);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded flex items-center gap-1.5 transition-colors"
              >
                Draft Follow-Up <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

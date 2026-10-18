import React, { useState, useEffect } from 'react';
import {
  Mail,
  Copy,
  CheckCircle2,
  Sparkles,
  Send,
  User,
  Phone,
  Building2,
  ShieldCheck,
  Check
} from 'lucide-react';
import { EnrichedInvoice, FollowUpDraft } from '../../types';
import { formatINR, formatDate } from '../../utils/formatters';
import { Badge } from '../Common/Badge';

interface CollectionWorkspaceViewProps {
  invoices: EnrichedInvoice[];
  initialInvoice?: EnrichedInvoice | null;
  savedDrafts: FollowUpDraft[];
  onGenerateDraft: (invoiceId: string, scenario: string, tone: string) => Promise<FollowUpDraft>;
  onApproveDraft: (draftId: string) => Promise<void>;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const CollectionWorkspaceView: React.FC<CollectionWorkspaceViewProps> = ({
  invoices,
  initialInvoice,
  savedDrafts,
  onGenerateDraft,
  onApproveDraft,
  onShowToast,
}) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    initialInvoice?.invoice_id || (invoices[0]?.invoice_id ?? '')
  );
  const [scenario, setScenario] = useState<string>('ordinary_overdue');
  const [tone, setTone] = useState<string>('polite');
  const [currentDraft, setCurrentDraft] = useState<FollowUpDraft | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSentSimulated, setIsSentSimulated] = useState(false);
  const [editableBody, setEditableBody] = useState<string>('');
  const [editableSubject, setEditableSubject] = useState<string>('');

  const currentInvoice = invoices.find((i) => i.invoice_id === selectedInvoiceId) || invoices[0];

  useEffect(() => {
    if (initialInvoice) {
      setSelectedInvoiceId(initialInvoice.invoice_id);
      if (initialInvoice.dispute_status === 'disputed') {
        setScenario('disputed');
      } else if (initialInvoice.promise_to_pay?.status === 'broken') {
        setScenario('missed_promise');
      } else if (initialInvoice.receipts_allocated > 0) {
        setScenario('partial_payment');
      } else {
        setScenario('ordinary_overdue');
      }
    }
  }, [initialInvoice]);

  // Automatically generate draft whenever invoice, scenario or tone changes
  useEffect(() => {
    if (currentInvoice) {
      triggerGeneration(currentInvoice.invoice_id, scenario, tone);
    }
  }, [selectedInvoiceId, scenario, tone]);

  const triggerGeneration = async (invId: string, sc: string, tn: string) => {
    setIsGenerating(true);
    setIsSentSimulated(false);
    try {
      const draft = await onGenerateDraft(invId, sc, tn);
      setCurrentDraft(draft);
      setEditableSubject(draft.subject);
      setEditableBody(draft.body);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    const fullText = `Subject: ${editableSubject}\n\n${editableBody}`;
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    onShowToast('Copied to Clipboard', 'Verified communication draft copied.', 'info');
  };

  const handleApprove = async () => {
    if (!currentDraft) return;
    try {
      await onApproveDraft(currentDraft.draft_id);
      setCurrentDraft({ ...currentDraft, status: 'approved' });
      onShowToast('Draft Approved', 'Logged to customer communications audit trail.', 'success');
    } catch (err: any) {
      onShowToast('Approval Failed', err.message, 'error');
    }
  };

  const handleSimulateSend = () => {
    setIsSentSimulated(true);
    onShowToast('Email Queued for Dispatch', `Verified statement transmitted to ${currentInvoice?.customer_name}.`, 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* LEFT: Composer Controls & Verified Metadata */}
      <div className="lg:col-span-5 space-y-4">
        {/* Selector & Config Card */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-600" /> Contextual Follow-Up Composer
            </h3>
            <span className="text-[10px] font-mono text-slate-400 font-semibold">Rules-Based</span>
          </div>

          {/* Invoice Target Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Customer Account &amp; Invoice
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => {
                setSelectedInvoiceId(e.target.value);
                const inv = invoices.find((i) => i.invoice_id === e.target.value);
                if (inv?.dispute_status === 'disputed') setScenario('disputed');
                else if (inv?.promise_to_pay?.status === 'broken') setScenario('missed_promise');
                else if ((inv?.receipts_allocated ?? 0) > 0) setScenario('partial_payment');
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono font-medium"
            >
              {invoices.map((inv) => (
                <option key={inv.invoice_id} value={inv.invoice_id}>
                  {inv.invoice_id} — {inv.customer_name} ({formatINR(inv.outstanding_balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Verified Customer Ledger Card */}
          {currentInvoice && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{currentInvoice.customer_name}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Original Invoice Amount:</span>
                <span className="font-mono text-slate-700">{formatINR(currentInvoice.amount)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Allocated Remittances:</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {currentInvoice.receipts_allocated > 0 ? formatINR(currentInvoice.receipts_allocated) : '₹0.00'}
                </span>
              </div>
              <div className="flex justify-between items-baseline border-t border-slate-200 pt-1">
                <span className="text-slate-700 font-bold">Verified Remaining Balance:</span>
                <span className="font-mono font-extrabold text-slate-900">{formatINR(currentInvoice.outstanding_balance)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Overdue Status:</span>
                <span className={`font-bold ${currentInvoice.days_overdue > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                  {currentInvoice.days_overdue > 0 ? `${currentInvoice.days_overdue} days overdue` : 'Current / Not Overdue'}
                </span>
              </div>
            </div>
          )}

          {/* Scenario Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Communication Scenario
            </label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ordinary_overdue">Ordinary Overdue Remittance Reminder</option>
              <option value="partial_payment">Partially Paid Balance Request (Acknowledges Received Amount)</option>
              <option value="disputed">Operational Dispute Clarification (Non-demand inquiry)</option>
              <option value="missed_promise">Broken Payment Commitment Escalation</option>
              <option value="payment_confirmation">Payment Confirmation &amp; Account Statement</option>
            </select>
          </div>

          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Communication Tone
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['polite', 'neutral', 'firm'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`py-1.5 px-3 rounded text-xs font-bold capitalize border transition-all ${
                    tone === t
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Safety & Compliance Notice */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-500 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" /> Human Verification Guarantee
          </div>
          <p className="text-[11px] leading-relaxed">
            All figures (credited amounts, net balance, invoice IDs) are pulled directly from ledger tables. No AI hallucinations.
          </p>
        </div>
      </div>

      {/* RIGHT: Live Draft Preview, Editor & Actions */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-md p-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-teal-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Live Draft Preview &amp; Review
              </h3>
              <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                DRAFT — NOT SENT
              </span>
            </div>
            {currentDraft && (
              <span className="text-[10px] font-mono text-slate-400 font-medium">
                Ref: {currentDraft.draft_id}
              </span>
            )}
          </div>

          <div className="mt-3 space-y-3">
            {/* Recipient Details Pill */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs flex flex-wrap items-center justify-between gap-2 text-slate-700">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-slate-900">
                  {currentInvoice?.customer_name}
                </span>
                <span className="text-slate-400 text-[11px] font-mono">
                  [ap.lead@{currentInvoice?.customer_name?.toLowerCase().replace(/[^a-z]/g, '') || 'client'}.com]
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Due: {formatDate(currentInvoice?.due_date)}
              </div>
            </div>

            {/* Subject Line */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={editableSubject}
                onChange={(e) => setEditableSubject(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Editable Body */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Verified Message Body (Editable)
              </label>
              <textarea
                rows={12}
                value={editableBody}
                onChange={(e) => setEditableBody(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded text-xs text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-sans leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Attached: Statement of Account &amp; E-Way Bill</span>
              <span className="capitalize font-semibold text-slate-600">Tone: {tone}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mt-4">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                currentDraft?.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {currentDraft?.status || 'DRAFT'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded flex items-center gap-1.5 transition-colors shadow-sm"
            >
              {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              {isCopied ? 'Copied' : 'Copy Draft'}
            </button>

            {currentDraft?.status !== 'approved' && (
              <button
                onClick={handleApprove}
                className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Check className="w-3.5 h-3.5 text-teal-400" /> Approve Draft
              </button>
            )}

            <button
              onClick={handleSimulateSend}
              className="px-3 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              {isSentSimulated ? 'Dispatched' : 'Simulate Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

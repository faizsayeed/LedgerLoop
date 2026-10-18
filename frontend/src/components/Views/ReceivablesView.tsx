import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpDown,
  X,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { EnrichedInvoice } from '../../types';
import { Badge } from '../Common/Badge';
import { formatINR, formatDate } from '../../utils/formatters';

interface ReceivablesViewProps {
  invoices: EnrichedInvoice[];
  onSelectInvoice: (inv: EnrichedInvoice) => void;
  onDraftFollowUp: (inv: EnrichedInvoice) => void;
  onExportCSV: () => void;
  onCreateInvoice?: (inv: any) => Promise<void>;
}

export const ReceivablesView: React.FC<ReceivablesViewProps> = ({
  invoices,
  onSelectInvoice,
  onDraftFollowUp,
  onExportCSV,
  onCreateInvoice,
}) => {
  const [filterBucket, setFilterBucket] = useState<string>('ALL');
  const [filterDispute, setFilterDispute] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterCustomer, setFilterCustomer] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [sortField, setSortField] = useState<'outstanding' | 'days_overdue' | 'amount' | 'due_date'>('outstanding');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // New Invoice Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newInvId, setNewInvId] = useState<string>('INV-2026-020');
  const [newCustId, setNewCustId] = useState<string>('CUST-001');
  const [newAmount, setNewAmount] = useState<number>(75000);
  const [newDueDate, setNewDueDate] = useState<string>('2026-11-15');
  const [newPo, setNewPo] = useState<string>('PO-NEW-2026-88');
  const [newNotes, setNewNotes] = useState<string>('Batch delivery of packaged grains and edible oil');

  // Customer List for dropdown
  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, string>();
    invoices.forEach((i) => map.set(i.customer_id, i.customer_name));
    return Array.from(map.entries());
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        if (filterBucket !== 'ALL' && inv.ageing_bucket !== filterBucket) return false;
        if (filterDispute !== 'ALL' && inv.dispute_status !== filterDispute) return false;
        if (filterPriority !== 'ALL' && inv.priority_explanation.priority_level !== filterPriority) return false;
        if (filterCustomer !== 'ALL' && inv.customer_id !== filterCustomer) return false;
        if (search) {
          const q = search.toLowerCase();
          const matchId = inv.invoice_id.toLowerCase().includes(q);
          const matchCust = inv.customer_name.toLowerCase().includes(q);
          const matchPo = inv.po_reference?.toLowerCase().includes(q) || false;
          if (!matchId && !matchCust && !matchPo) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortField === 'outstanding') {
          valA = a.outstanding_balance;
          valB = b.outstanding_balance;
        } else if (sortField === 'days_overdue') {
          valA = a.days_overdue;
          valB = b.days_overdue;
        } else if (sortField === 'amount') {
          valA = a.amount;
          valB = b.amount;
        } else if (sortField === 'due_date') {
          return sortAsc
            ? a.due_date.localeCompare(b.due_date)
            : b.due_date.localeCompare(a.due_date);
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [invoices, filterBucket, filterDispute, filterPriority, filterCustomer, search, sortField, sortAsc]);

  const toggleSort = (field: 'outstanding' | 'days_overdue' | 'amount' | 'due_date') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const totalOutstanding = filteredInvoices.reduce((s, i) => s + i.outstanding_balance, 0);
  const totalInvoiced = filteredInvoices.reduce((s, i) => s + i.amount, 0);
  const totalAllocated = filteredInvoices.reduce((s, i) => s + i.receipts_allocated, 0);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onCreateInvoice) {
      await onCreateInvoice({
        invoice_id: newInvId,
        customer_id: newCustId,
        issue_date: '2026-10-15',
        due_date: newDueDate,
        amount: newAmount,
        po_reference: newPo,
        notes: newNotes,
        dispute_status: 'none',
      });
      setShowCreateModal(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Ledger Metrics Strip */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 divide-x divide-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Invoiced</span>
            <p className="text-base font-bold text-slate-900 font-mono tabular-nums">{formatINR(totalInvoiced)}</p>
          </div>
          <div className="pl-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Allocated Credits</span>
            <p className="text-base font-bold text-emerald-700 font-mono tabular-nums">{formatINR(totalAllocated)}</p>
          </div>
          <div className="pl-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Outstanding</span>
            <p className="text-base font-bold text-slate-900 font-mono tabular-nums">{formatINR(totalOutstanding)}</p>
          </div>
          <div className="pl-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Records</span>
            <p className="text-base font-bold text-slate-800 font-mono tabular-nums">{filteredInvoices.length} Invoices</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCreateInvoice && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-teal-400" /> New Invoice
            </button>
          )}
          <button
            onClick={onExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3 shadow-sm flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Search Box */}
          <div className="relative w-56 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice, customer, PO..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Customer Filter */}
          <select
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 max-w-[160px]"
          >
            <option value="ALL">All Customers</option>
            {uniqueCustomers.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          {/* Ageing Bucket Filter */}
          <select
            value={filterBucket}
            onChange={(e) => setFilterBucket(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="ALL">All Ageing Buckets</option>
            <option value="Current">Current / Not Overdue</option>
            <option value="1-30 Days">1–30 Days Overdue</option>
            <option value="31-60 Days">31–60 Days Overdue</option>
            <option value="61-90 Days">61–90 Days Overdue</option>
            <option value=">90 Days">&gt;90 Days Overdue</option>
          </select>

          {/* Dispute Status Filter */}
          <select
            value={filterDispute}
            onChange={(e) => setFilterDispute(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="ALL">All Dispute States</option>
            <option value="none">Undisputed Only</option>
            <option value="disputed">Disputed Claims Only</option>
            <option value="resolved">Resolved Disputes</option>
          </select>

          {/* Priority Level Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical Priority</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          {(filterBucket !== 'ALL' || filterDispute !== 'ALL' || filterPriority !== 'ALL' || filterCustomer !== 'ALL' || search) && (
            <button
              onClick={() => {
                setFilterBucket('ALL');
                setFilterDispute('ALL');
                setFilterPriority('ALL');
                setFilterCustomer('ALL');
                setSearch('');
              }}
              className="text-xs text-teal-700 hover:underline font-semibold ml-1"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Showing {filteredInvoices.length} of {invoices.length} entries
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Invoice ID</th>
                <th className="py-2.5 px-3">Customer Name</th>
                <th
                  onClick={() => toggleSort('due_date')}
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-800 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Due Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('days_overdue')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-800 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Days Overdue</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Ageing Bucket</th>
                <th
                  onClick={() => toggleSort('amount')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-800 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Original Amount</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right">Allocated</th>
                <th
                  onClick={() => toggleSort('outstanding')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-800 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Outstanding</span>
                    <ArrowUpDown className="w-3 h-3 text-teal-600" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Agreed Action</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No invoice records match current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isPaid = inv.outstanding_balance <= 0.001;
                  const isDisputed = inv.dispute_status === 'disputed';
                  return (
                    <tr
                      key={inv.invoice_id}
                      onClick={() => onSelectInvoice(inv)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-2 px-3 whitespace-nowrap">
                        {isDisputed ? (
                          <Badge variant="dispute" size="sm">DISPUTED</Badge>
                        ) : isPaid ? (
                          <Badge variant="success" size="sm">SETTLED</Badge>
                        ) : inv.days_overdue > 60 ? (
                          <Badge variant="critical" size="sm">CRITICAL</Badge>
                        ) : inv.days_overdue > 0 ? (
                          <Badge variant="warning" size="sm">OVERDUE</Badge>
                        ) : (
                          <Badge variant="info" size="sm">CURRENT</Badge>
                        )}
                      </td>

                      <td className="py-2 px-3 font-mono font-medium text-slate-800 whitespace-nowrap">
                        {inv.invoice_id}
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{inv.customer_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{inv.customer_id}</div>
                      </td>

                      <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {formatDate(inv.due_date)}
                      </td>

                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-bold ${
                            inv.days_overdue > 60
                              ? 'text-red-700'
                              : inv.days_overdue > 0
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {inv.days_overdue > 0 ? `+${inv.days_overdue} d` : `${inv.days_overdue} d`}
                        </span>
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="text-slate-700 font-medium">{inv.ageing_bucket}</span>
                      </td>

                      <td className="py-2 px-3 text-right font-mono text-slate-600 tabular-nums whitespace-nowrap">
                        {formatINR(inv.amount)}
                      </td>

                      <td className="py-2 px-3 text-right font-mono text-emerald-700 tabular-nums whitespace-nowrap">
                        {inv.receipts_allocated > 0 ? formatINR(inv.receipts_allocated) : '—'}
                      </td>

                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatINR(inv.outstanding_balance)}
                      </td>

                      <td className="py-2 px-3 text-slate-600 max-w-[210px] truncate text-[11px]" title={inv.agreed_next_action || ''}>
                        {inv.agreed_next_action || '—'}
                      </td>

                      <td className="py-2 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectInvoice(inv)}
                            className="px-2 py-0.5 text-[11px] text-slate-700 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-100 font-medium"
                          >
                            Details
                          </button>
                          {!isPaid && (
                            <button
                              onClick={() => onDraftFollowUp(inv)}
                              className="px-2 py-0.5 text-[11px] text-teal-800 bg-teal-50 border border-teal-200 rounded hover:bg-teal-100 font-semibold"
                            >
                              Draft
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Create New Invoice Record</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Invoice ID</label>
                <input
                  type="text"
                  required
                  value={newInvId}
                  onChange={(e) => setNewInvId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Customer Account</label>
                <select
                  value={newCustId}
                  onChange={(e) => setNewCustId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                >
                  {uniqueCustomers.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name} ({id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Invoice Amount (INR ₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Maturity / Due Date</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">PO / Contract Reference</label>
                <input
                  type="text"
                  value={newPo}
                  onChange={(e) => setNewPo(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Dispatch / Product Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Play,
  ShieldCheck,
  FileCode,
  ExternalLink,
  RefreshCw,
  Clock
} from 'lucide-react';
import { TestSuiteResponse } from '../../types';
import { api } from '../../api/client';
import { Badge } from '../Common/Badge';

interface ReportsEvidenceViewProps {
  asOfDate: string;
}

export const ReportsEvidenceView: React.FC<ReportsEvidenceViewProps> = ({ asOfDate }) => {
  const [testSuite, setTestSuite] = useState<TestSuiteResponse | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const fetchTests = async () => {
    setIsRunningTests(true);
    try {
      const res = await api.getTestResults();
      setTestSuite(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunningTests(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const downloadReport = (type: string) => {
    window.open(api.getExportUrl(type), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: Export Centre */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-teal-600" /> Financial Reports &amp; Verified Data Exports
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live streaming CSV and JSON exports derived from validated ledger records as of <span className="font-mono font-semibold text-slate-700">{asOfDate}</span>.
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Source: SQLite / Canonical In-Memory Ledger
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Receivables Register</span>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Complete invoices ledger with customer info, ageing days, allocated receipts, and net outstanding.
              </p>
            </div>
            <button
              onClick={() => downloadReport('receivables')}
              className="py-1 px-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> Download CSV
            </button>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Ageing Distribution Report</span>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Summary across standard ageing buckets: Current, 1-30, 31-60, 61-90, &gt;90 days overdue.
              </p>
            </div>
            <button
              onClick={() => downloadReport('ageing')}
              className="py-1 px-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> Download CSV
            </button>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Dispute &amp; Exception Report</span>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Audit list of quarantined disputes, reasons, assigned owners, and current resolution statuses.
              </p>
            </div>
            <button
              onClick={() => downloadReport('disputes')}
              className="py-1 px-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> Download CSV
            </button>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Audit Activity Trail</span>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Full chronological ledger audit log of allocations, date adjustments, and review decisions.
              </p>
            </div>
            <button
              onClick={() => downloadReport('audit')}
              className="py-1 px-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> Download CSV
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: Live Acceptance Tests Dashboard (Tests A through J) */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                Starter-Data Acceptance Test Evidence (Tests A through J)
              </h3>
              {testSuite && (
                <Badge variant={testSuite.all_passed ? 'success' : 'critical'}>
                  {testSuite.passed_count} / {testSuite.total_tests} TESTS PASSING
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live automated validation verifying partial payments, full settlements, dispute isolation, ageing updates, duplicate detection, and scenario isolation.
            </p>
          </div>

          <button
            onClick={fetchTests}
            disabled={isRunningTests}
            className="py-1.5 px-3 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRunningTests ? 'animate-spin' : ''}`} />
            Run Test Suite
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Test Code</th>
                <th className="py-2.5 px-3">Test Requirement Description</th>
                <th className="py-2.5 px-3">Execution Verification Details</th>
                <th className="py-2.5 px-3 text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!testSuite ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    Executing live test suite...
                  </td>
                </tr>
              ) : (
                testSuite.results.map((t) => (
                  <tr key={t.test_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {t.test_id}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap">
                      {t.name}
                    </td>
                    <td className="py-2 px-3 text-slate-600 text-[11px] font-mono leading-relaxed">
                      {t.detail}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      {t.passed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PASSED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          <AlertCircle className="w-3 h-3 text-red-600" /> FAILED
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: Change-Evidence Panel */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-subtle space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
            Change-Evidence Matrix
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Audit summary of requirements, architectural execution, validation proofs, and intentional design boundaries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              1. Starting State
            </span>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              Empty repository with lone README. Created canonical starter dataset <code className="text-slate-800 font-mono">Starter_Data/C28/fixture.json</code> matching all distributor criteria and tests A–J.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              2. Negotiated Scope
            </span>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              Full-stack enterprise AR prototype combining FastAPI backend, React+TypeScript+Tailwind UI, explainable prioritization, smart reconciliation, and MBA unit economics.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              3. Final Implementation
            </span>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              10 interactive workspaces, auditable reconciliation, 3-scenario cash forecast, What-If simulation with data isolation, and validated context-aware follow-up drafts.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              4. Known Limitations
            </span>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              Email sending deliberately unintegrated (safety requirement). Statistical reconciliation calibrated as transparent heuristics rather than opaque black-box AI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

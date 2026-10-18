import React, { useState } from 'react';
import {
  Settings,
  Upload,
  RefreshCw,
  Building,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { CompanyInfo } from '../../types';
import { api } from '../../api/client';

interface SettingsViewProps {
  company: CompanyInfo | null;
  onResetData: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  company,
  onResetData,
  onShowToast,
}) => {
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importReport, setImportReport] = useState<any | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleTestImportInvalid = async () => {
    // Malformed sample to demonstrate Test I validation report
    const badSample = {
      invoices: [
        {
          invoice_id: "INV-ERR-SAMPLE-01",
          customer_id: "CUST-NONEXISTENT",
          issue_date: "2026-09-01",
          due_date: "2026-09-15",
          amount: -5000.0,
          notes: "Negative amount + non-existent customer"
        },
        {
          invoice_id: "INV-ERR-SAMPLE-02",
          customer_id: "CUST-001",
          issue_date: "invalid-date",
          due_date: "2026-09-15",
          amount: 20000.0,
          notes: "Invalid date format"
        }
      ],
      receipts: [
        {
          receipt_id: "REC-ERR-SAMPLE-01",
          customer_id: "CUST-001",
          receipt_date: "2026-10-10",
          amount: -1500.0,
          payment_method: "NEFT",
          reference_number: "REF-ERR",
          remarks: "Negative receipt amount"
        }
      ]
    };

    setIsImporting(true);
    try {
      const res = await api.importRecords(badSample);
      setImportReport(res);
      onShowToast('Import Validation Executed', `Processed with ${res.rejected_count} validation rejections.`, 'info');
    } catch (err: any) {
      onShowToast('Import Error', err.message, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleTestImportValid = async () => {
    const validSample = {
      invoices: [
        {
          invoice_id: "INV-2026-015",
          customer_id: "CUST-004",
          issue_date: "2026-10-05",
          due_date: "2026-11-04",
          amount: 45000.0,
          po_reference: "PO-APL-2026-388",
          notes: "Validly imported invoice record"
        }
      ]
    };

    setIsImporting(true);
    try {
      const res = await api.importRecords(validSample);
      setImportReport(res);
      onShowToast('Records Accepted', `Successfully imported ${res.imported_invoices_count} invoice(s).`, 'success');
    } catch (err: any) {
      onShowToast('Import Error', err.message, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: Distributor Entity Configuration */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-subtle space-y-4">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-teal-700" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Distributor Profile &amp; Statutory Settings
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            GSTIN: {company?.gstin || '27AAACA1234F1Z8'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-500 font-medium block">Trading Name</span>
            <p className="font-semibold text-slate-900 mt-0.5">{company?.company_name || 'Apex Distribution Pvt Ltd'}</p>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Legal Entity Name</span>
            <p className="font-semibold text-slate-900 mt-0.5">{company?.legal_entity || 'Apex Distribution Private Limited'}</p>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Default Credit Period</span>
            <p className="font-semibold text-slate-900 mt-0.5">{company?.default_credit_period_days || 30} Days (Net 30)</p>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Base Currency &amp; Notation</span>
            <p className="font-semibold text-slate-900 mt-0.5">₹ INR (Indian Rupee, Lakhs / Crores)</p>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Active Financial Year</span>
            <p className="font-semibold text-slate-900 mt-0.5">{company?.financial_year || '2026-27'}</p>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Primary Ledger State</span>
            <p className="font-semibold text-emerald-700 mt-0.5">● Connected (Deterministic Service Layer)</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Import & Data Validation Center (Test I) */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-subtle space-y-4">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Data Ingestion &amp; Validation Engine (Test I)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Zero Silent Discards Enforced
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Import new distributor invoices and bank statement feeds. Records are checked for positive balances, valid ISO dates, existing customer IDs, and non-duplicate references before entry into ledger.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleTestImportValid}
            disabled={isImporting}
            className="py-1.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded transition-colors"
          >
            Test Import Valid Invoices
          </button>
          <button
            onClick={handleTestImportInvalid}
            disabled={isImporting}
            className="py-1.5 px-3.5 bg-white border border-red-300 text-red-700 hover:bg-red-50 text-xs font-medium rounded transition-colors"
          >
            Test Import Invalid Records (Trigger Test I)
          </button>
        </div>

        {/* Validation Report Card */}
        {importReport && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                Import Validation Report Status:
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  importReport.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {importReport.success ? 'ALL ACCEPTED' : `${importReport.rejected_count} REJECTIONS RECORDED`}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
              <div className="p-2 bg-white rounded border border-slate-200">
                Invoices Accepted: <strong className="text-emerald-700">{importReport.imported_invoices_count}</strong>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                Receipts Accepted: <strong className="text-emerald-700">{importReport.imported_receipts_count}</strong>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                Rejected Records: <strong className="text-red-700">{importReport.rejected_count}</strong>
              </div>
            </div>

            {importReport.errors.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="font-semibold text-red-800 text-[11px] block">Specific Validation Errors:</span>
                {importReport.errors.map((err: string, i: number) => (
                  <p key={i} className="text-red-700 text-[11px] font-mono leading-snug">
                    • {err}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 3: System Reset */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-subtle space-y-4">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Canonical Fixture Reset
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Restore the application back to its canonical baseline state defined in <code className="text-slate-800 font-mono">Starter_Data/C28/fixture.json</code>. This resets all allocations, test invoices, and exception decisions back to initial demonstration values.
        </p>

        <button
          onClick={onResetData}
          className="py-1.5 px-3.5 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 text-xs font-medium rounded shadow-subtle transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Reset Database to Canonical Fixture
        </button>
      </div>
    </div>
  );
};

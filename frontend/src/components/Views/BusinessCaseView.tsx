import React, { useState, useEffect } from 'react';
import {
  Calculator,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  PieChart,
  Target,
  ArrowRight
} from 'lucide-react';
import { UnitEconomicsInput, UnitEconomicsResult } from '../../types';
import { formatINR, formatPercent } from '../../utils/formatters';

interface BusinessCaseViewProps {
  onCalculate: (params: UnitEconomicsInput) => Promise<UnitEconomicsResult>;
}

export const BusinessCaseView: React.FC<BusinessCaseViewProps> = ({ onCalculate }) => {
  const [params, setParams] = useState<UnitEconomicsInput>({
    monthly_subscription_price: 25000.0,
    hosting_infra_cost_monthly: 3500.0,
    support_cost_monthly: 4000.0,
    onboarding_setup_cost: 15000.0,
    customer_lifetime_months: 24,
    fixed_overhead_monthly: 180000.0,
    customer_acquisition_cost: 30000.0,
    ar_volume_managed_monthly: 25000000.0,
  });

  const [result, setResult] = useState<UnitEconomicsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runCalculation = async (p: UnitEconomicsInput) => {
    setIsLoading(true);
    try {
      const res = await onCalculate(p);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runCalculation(params);
  }, []);

  const handleInputChange = (field: keyof UnitEconomicsInput, value: number) => {
    const updated = { ...params, [field]: value };
    setParams(updated);
    runCalculation(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top MBA Review Header */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-md text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-teal-400" />
            <h2 className="text-sm font-semibold tracking-tight">
              MBA Business Case &amp; Commercial Unit Economics
            </h2>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
              UNVALIDATED ASSUMPTIONS MODEL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Financial operations model for B2B distributors in India. All figures represent structural unit economics hypotheses designed for pilot validation with target CFOs.
          </p>
        </div>
        <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 text-xs text-slate-400">
          <span className="block text-[10px] uppercase font-semibold text-slate-500">Target Segment</span>
          <span className="font-semibold text-slate-200">SMB Distributors (₹10–50 Cr Annual GMV)</span>
        </div>
      </div>

      {/* Guardrail Warnings (if any) */}
      {result && result.guardrail_warnings.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Economic Model Guardrail Triggered
          </div>
          {result.guardrail_warnings.map((w, i) => (
            <p key={i} className="text-[11px] leading-snug">• {w}</p>
          ))}
        </div>
      )}

      {/* SECTION 1: Key Economics Outputs */}
      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-subtle">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Monthly Contribution / Customer
            </span>
            <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
              {formatINR(result.monthly_contribution_per_customer)}
            </p>
            <span className="text-xs text-slate-500 mt-1 block">
              Price minus variable cost to serve
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-subtle">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Contribution Margin
            </span>
            <p className="text-2xl font-bold text-teal-800 tabular-nums mt-1">
              {result.contribution_margin_pct.toFixed(1)}%
            </p>
            <span className="text-xs text-slate-500 mt-1 block">
              SaaS gross margin profile
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-subtle">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Break-Even Customer Count
            </span>
            <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
              {result.break_even_customers} <span className="text-sm font-normal text-slate-500">distributors</span>
            </p>
            <span className="text-xs text-slate-500 mt-1 block">
              Covers ₹{params.fixed_overhead_monthly / 1000}k fixed monthly burn
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-subtle">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              LTV : CAC Ratio
            </span>
            <p className="text-2xl font-bold text-teal-800 tabular-nums mt-1">
              {result.ltv_to_cac_ratio.toFixed(1)}x
            </p>
            <span className="text-xs text-slate-500 mt-1 block">
              {params.customer_lifetime_months}-month horizon assumption
            </span>
          </div>
        </div>
      )}

      {/* SECTION 2: Interactive Assumption Levers & Formulas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editable Assumptions */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-md p-5 shadow-subtle space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Commercial &amp; Operating Cost Levers
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Editable Inputs</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="font-medium text-slate-700">Proposed Monthly Subscription Price</label>
                <span className="font-mono font-bold text-slate-900">{formatINR(params.monthly_subscription_price)} / mo</span>
              </div>
              <input
                type="number"
                step="1000"
                value={params.monthly_subscription_price}
                onChange={(e) => handleInputChange('monthly_subscription_price', parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Hosting &amp; Infra Cost / Cust</label>
                <input
                  type="number"
                  step="500"
                  value={params.hosting_infra_cost_monthly}
                  onChange={(e) => handleInputChange('hosting_infra_cost_monthly', parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Support Cost / Cust / Mo</label>
                <input
                  type="number"
                  step="500"
                  value={params.support_cost_monthly}
                  onChange={(e) => handleInputChange('support_cost_monthly', parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">One-Time Onboarding Cost</label>
                <input
                  type="number"
                  step="1000"
                  value={params.onboarding_setup_cost}
                  onChange={(e) => handleInputChange('onboarding_setup_cost', parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Customer CAC (Sales &amp; Mktg)</label>
                <input
                  type="number"
                  step="5000"
                  value={params.customer_acquisition_cost}
                  onChange={(e) => handleInputChange('customer_acquisition_cost', parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="font-medium text-slate-700">Fixed Monthly Operating Burn (Engineering, SG&amp;A)</label>
                <span className="font-mono font-bold text-slate-900">{formatINR(params.fixed_overhead_monthly)} / mo</span>
              </div>
              <input
                type="number"
                step="10000"
                value={params.fixed_overhead_monthly}
                onChange={(e) => handleInputChange('fixed_overhead_monthly', parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Formula Derivation Breakdown */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-md p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                Formula Derivations &amp; Academic Rigor
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Explicit mathematical definitions compliant with standard managerial accounting.
              </p>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] space-y-1">
                <span className="text-slate-400 uppercase font-sans text-[10px] font-semibold block">Monthly Contribution Formula</span>
                <p className="text-slate-900">
                  Monthly Contribution = Subscription Price - (Hosting + Support Variable Cost)
                </p>
                <p className="text-teal-700 font-semibold pt-1 border-t border-slate-200">
                  {formatINR(params.monthly_subscription_price)} - ({formatINR(params.hosting_infra_cost_monthly)} + {formatINR(params.support_cost_monthly)}) = {formatINR(result?.monthly_contribution_per_customer ?? 0)}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] space-y-1">
                <span className="text-slate-400 uppercase font-sans text-[10px] font-semibold block">Break-Even Customer Threshold</span>
                <p className="text-slate-900">
                  Break-Even Customers = ⌈ Fixed Monthly Burn ÷ Positive Monthly Contribution ⌉
                </p>
                <p className="text-teal-700 font-semibold pt-1 border-t border-slate-200">
                  ⌈ {formatINR(params.fixed_overhead_monthly)} ÷ {formatINR(result?.monthly_contribution_per_customer ?? 1)} ⌉ = {result?.break_even_customers} distributors
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] space-y-1">
                <span className="text-slate-400 uppercase font-sans text-[10px] font-semibold block">LTV : CAC Multiple</span>
                <p className="text-slate-900">
                  LTV = (Monthly Contribution × Lifetime Months) - Onboarding Cost
                </p>
                <p className="text-teal-700 font-semibold pt-1 border-t border-slate-200">
                  Ratio: {result?.ltv_to_cac_ratio.toFixed(1)}x (Target &gt; 3.0x benchmark)
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Zero division and negative margin guardrails active.
          </div>
        </div>
      </div>

      {/* SECTION 3: Customer Value Hypotheses & Pilot Validation Plan */}
      {result && result.value_hypotheses && (
        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-subtle space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-teal-600" /> Buyer Value Hypotheses &amp; Pilot Validation Plan
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Concrete financial justification for SMB distributor finance controllers, and structured tests to prove them during a pilot.
              </p>
            </div>
            <span className="text-[11px] text-teal-800 font-mono font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Pilot Roadmap
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.value_hypotheses.map((h, idx) => (
              <div key={idx} className="p-4 rounded border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {h.hypothesis}
                  </h4>
                  <span className="font-mono font-bold text-teal-800">
                    {formatINR(h.monthly_value)} / mo
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {h.mechanism}
                </p>
                <div className="pt-2 border-t border-slate-200 text-[11px] space-y-1">
                  <div>
                    <span className="text-slate-500 font-medium">Metric Driver:</span>{' '}
                    <span className="font-mono text-slate-700">{h.metric_driver}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Validation Test in Pilot:</span>{' '}
                    <span className="text-slate-800 font-semibold">{h.validation_test}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

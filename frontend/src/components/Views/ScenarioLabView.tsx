import React, { useState } from 'react';
import {
  FlaskConical,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { ScenarioLabInput, ScenarioLabResult } from '../../types';
import { formatINR, formatPercent } from '../../utils/formatters';
import { Badge } from '../Common/Badge';

interface ScenarioLabViewProps {
  asOfDate: string;
  onRunSimulation: (params: ScenarioLabInput) => Promise<ScenarioLabResult>;
}

export const ScenarioLabView: React.FC<ScenarioLabViewProps> = ({
  asOfDate,
  onRunSimulation,
}) => {
  const [params, setParams] = useState<ScenarioLabInput>({
    as_of_date: asOfDate,
    workload_staff_hours: 40.0,
    follow_up_intensity: 'Standard',
    early_payment_discount_pct: 0.0,
    simulate_partial_receipt_pct: 25.0,
    extend_overdue_days: 0,
    broken_promise_recovery_rate: 0.5,
  });

  const [result, setResult] = useState<ScenarioLabResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSimulate = async () => {
    setIsLoading(true);
    try {
      const res = await onRunSimulation(params);
      setResult(res);
    } catch (err) {
      console.error('Simulation failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setParams({
      as_of_date: asOfDate,
      workload_staff_hours: 40.0,
      follow_up_intensity: 'Standard',
      early_payment_discount_pct: 0.0,
      simulate_partial_receipt_pct: 0.0,
      extend_overdue_days: 0,
      broken_promise_recovery_rate: 0.5,
    });
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Simulation Sandbox Banner */}
      <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-teal-950">
        <div className="flex items-center gap-2.5">
          <FlaskConical className="w-5 h-5 text-teal-700 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-teal-950">
              Interactive What-If Scenario Sandbox
            </h3>
            <p className="text-teal-800/80 text-[11px] mt-0.5">
              Experiment with working capital levers, partial cash acceleration, and recovery workload. Original ledger records remain strictly isolated (Test J compliant).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-900 font-mono text-[10px] font-semibold">
            SANDBOX SESSION
          </span>
          <button
            onClick={handleReset}
            className="px-2.5 py-1 text-slate-700 bg-white border border-teal-300 rounded hover:bg-slate-50 flex items-center gap-1 font-medium transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" /> Reset Simulation
          </button>
        </div>
      </div>

      {/* SECTION 1: Control Panel */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
            Simulation Levers &amp; Operational Inputs
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Real-time before/after modeling</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Lever 1: Simulate Partial Cash Acceleration */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="font-medium text-slate-700">Simulate Partial Cash Collection</label>
              <span className="font-mono font-bold text-teal-800">{params.simulate_partial_receipt_pct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="75"
              step="5"
              value={params.simulate_partial_receipt_pct}
              onChange={(e) => setParams({ ...params, simulate_partial_receipt_pct: parseFloat(e.target.value) })}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              Assumes aggressive interim settlements on overdue balances.
            </p>
          </div>

          {/* Lever 2: Broken Promise Recovery Rate */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="font-medium text-slate-700">Broken Promise Recovery</label>
              <span className="font-mono font-bold text-teal-800">{(params.broken_promise_recovery_rate * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={params.broken_promise_recovery_rate}
              onChange={(e) => setParams({ ...params, broken_promise_recovery_rate: parseFloat(e.target.value) })}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              Executive escalation conversion rate on lapsed promises.
            </p>
          </div>

          {/* Lever 3: Follow-Up Workload Intensity */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
            <label className="font-medium text-slate-700 block">Follow-Up Intensity</label>
            <div className="grid grid-cols-3 gap-1">
              {(['Gentle', 'Standard', 'Aggressive'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setParams({ ...params, follow_up_intensity: lvl })}
                  className={`py-1 rounded text-[11px] font-medium border transition-all ${
                    params.follow_up_intensity === lvl
                      ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">
              Aggressive (1.5h/acct), Standard (0.8h/acct), Gentle (0.4h/acct).
            </p>
          </div>

          {/* Lever 4: Available Staff Capacity */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="font-medium text-slate-700">Team Capacity (Hours/Wk)</label>
              <span className="font-mono font-bold text-slate-900">{params.workload_staff_hours} hrs</span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              step="5"
              value={params.workload_staff_hours}
              onChange={(e) => setParams({ ...params, workload_staff_hours: parseFloat(e.target.value) })}
              className="w-full accent-slate-800 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              Available finance lead &amp; AR caller weekly capacity.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSimulate}
            disabled={isLoading}
            className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-subtle transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Computing Simulation...' : 'Run What-If Simulation'}
          </button>
        </div>
      </div>

      {/* SECTION 2: Before & After Comparative Matrix */}
      {result ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Outstanding Receivables */}
            <div className="bg-white border border-slate-200 rounded-md p-4 shadow-subtle">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Total Outstanding
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-teal-800 tabular-nums">
                  {formatINR(result.simulated_outstanding)}
                </span>
                <span className="text-xs text-slate-400 line-through tabular-nums">
                  {formatINR(result.baseline_outstanding)}
                </span>
              </div>
              <div className="mt-2 text-xs flex items-center gap-1 text-emerald-700 font-medium">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>
                  {formatINR(result.baseline_outstanding - result.simulated_outstanding)} Cash Released
                </span>
              </div>
            </div>

            {/* Metric 2: Overdue Receivables */}
            <div className="bg-white border border-slate-200 rounded-md p-4 shadow-subtle">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Overdue Receivables
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-teal-800 tabular-nums">
                  {formatINR(result.simulated_overdue)}
                </span>
                <span className="text-xs text-slate-400 line-through tabular-nums">
                  {formatINR(result.baseline_overdue)}
                </span>
              </div>
              <div className="mt-2 text-xs flex items-center gap-1 text-emerald-700 font-medium">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>
                  {formatINR(result.baseline_overdue - result.simulated_overdue)} Overdue Cleared
                </span>
              </div>
            </div>

            {/* Metric 3: Action Accounts */}
            <div className="bg-white border border-slate-200 rounded-md p-4 shadow-subtle">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Active Follow-Up Accounts
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-slate-900 tabular-nums">
                  {result.simulated_action_accounts}
                </span>
                <span className="text-xs text-slate-400 line-through tabular-nums">
                  {result.baseline_action_accounts}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Target accounts requiring intervention
              </div>
            </div>

            {/* Metric 4: Staff Capacity Coverage */}
            <div className="bg-white border border-slate-200 rounded-md p-4 shadow-subtle">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Workload Capacity Coverage
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-slate-900 tabular-nums">
                  {result.capacity_coverage_pct.toFixed(0)}%
                </span>
                <span className="text-xs text-slate-500">
                  ({result.estimated_hours_needed} hrs required)
                </span>
              </div>
              <div className="mt-2 text-xs">
                {result.capacity_coverage_pct >= 100 ? (
                  <span className="text-emerald-700 font-medium">✓ Capacity sufficient</span>
                ) : (
                  <span className="text-amber-700 font-medium">⚠ Staff capacity constrained</span>
                )}
              </div>
            </div>
          </div>

          {/* Ageing Before vs After Comparison */}
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-subtle">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800 pb-3 border-b border-slate-100">
              Ageing Distribution: Baseline vs Simulated
            </h3>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Ageing Bucket</th>
                    <th className="py-2 px-3 text-right">Baseline Amount</th>
                    <th className="py-2 px-3 text-right">Simulated Amount</th>
                    <th className="py-2 px-3 text-right">Variance (INR)</th>
                    <th className="py-2 px-3 text-right">Simulated % of Book</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.ageing_before.map((b, idx) => {
                    const afterBucket = result.ageing_after[idx] || b;
                    const diff = afterBucket.amount - b.amount;
                    return (
                      <tr key={b.bucket} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-medium text-slate-800">{b.bucket}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600 tabular-nums">
                          {formatINR(b.amount)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatINR(afterBucket.amount)}
                        </td>
                        <td className={`py-2 px-3 text-right font-mono font-semibold tabular-nums ${diff < 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
                          {diff < 0 ? `- ${formatINR(Math.abs(diff))}` : formatINR(diff)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          {afterBucket.percentage.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Simulation Notes */}
            <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded text-xs space-y-1">
              <span className="font-semibold text-slate-700 block">Simulation Insights &amp; Log:</span>
              {result.notes.map((note, i) => (
                <p key={i} className="text-slate-600 text-[11px] leading-relaxed">
                  • {note}
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-md p-12 text-center text-slate-400 text-xs">
          Adjust the levers above and click <strong className="text-slate-700">"Run What-If Simulation"</strong> to generate before-and-after metrics.
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  ShieldAlert,
  Info,
  CheckCircle2,
  Clock,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { CashForecastScenario } from '../../types';
import { formatINR, formatDate } from '../../utils/formatters';
import { Badge } from '../Common/Badge';

interface CashFlowViewProps {
  scenarios: CashForecastScenario[];
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({ scenarios }) => {
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState<number>(1); // Default to Expected (idx 1)
  const [activeHorizon, setActiveHorizon] = useState<'7d' | '15d' | '30d'>('30d');

  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
        Loading cash-flow forecasting scenarios...
      </div>
    );
  }

  const currentScenario = scenarios[selectedScenarioIdx] || scenarios[0];
  const horizonCount = activeHorizon === '7d' ? 7 : activeHorizon === '15d' ? 15 : 30;
  const filteredDays = currentScenario.daily_breakdown.slice(0, horizonCount);

  const horizonTotal =
    activeHorizon === '7d'
      ? currentScenario.total_7d
      : activeHorizon === '15d'
      ? currentScenario.total_15d
      : currentScenario.total_30d;

  // Transform data for Recharts
  const chartData = filteredDays.map((d) => ({
    date: d.date.slice(5), // MM-DD
    fullDate: formatDate(d.date),
    promised: d.promised_amount,
    unconfirmed: d.unconfirmed_amount,
    total: d.expected_amount,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded shadow-xl text-xs space-y-1 border border-slate-700">
          <p className="font-semibold text-slate-200">{payload[0]?.payload?.fullDate}</p>
          <p className="text-emerald-400 font-mono">
            Promised Remittance: {formatINR(payload[0]?.payload?.promised)}
          </p>
          <p className="text-teal-300 font-mono">
            Unconfirmed Maturity: {formatINR(payload[0]?.payload?.unconfirmed)}
          </p>
          <p className="text-white font-mono font-bold border-t border-slate-700 pt-1">
            Total Expected: {formatINR(payload[0]?.payload?.total)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Top Disclaimer Banner */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 flex items-start gap-2.5 shadow-sm">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-900 font-semibold">Financial Disclaimer:</strong> Estimates presented are rule-based operational scenario projections derived from contractual maturity dates, customer risk tier weightings, and recorded promises. They are not guaranteed cash, recorded revenue, or binding bank inflows. Disputed balances are strictly quarantined.
        </div>
      </div>

      {/* Scenario Switcher Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {scenarios.map((sc, idx) => {
          const isSelected = selectedScenarioIdx === idx;
          return (
            <div
              key={sc.scenario_name}
              onClick={() => setSelectedScenarioIdx(idx)}
              className={`p-3.5 rounded-md border cursor-pointer transition-all shadow-sm flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border-teal-600 ring-1 ring-teal-600 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    {sc.scenario_name}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                      idx === 0
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : idx === 1
                        ? 'bg-teal-50 text-teal-800 border-teal-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {idx === 0 ? 'Best Case' : idx === 1 ? 'Calibrated Model' : 'Stress Test'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {sc.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">30-Day Total</span>
                <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
                  {formatINR(sc.total_30d)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Visual Recharts Timeline Chart */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Projected Inflow Run Schedule ({activeHorizon.toUpperCase()})
            </h3>
          </div>

          {/* Horizon Toggle */}
          <div className="flex items-center gap-1 bg-slate-50 p-0.5 border border-slate-200 rounded-md text-xs self-start sm:self-auto">
            {(['7d', '15d', '30d'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setActiveHorizon(h)}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  activeHorizon === h
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {h.toUpperCase()} Horizon
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Bar Chart Container */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                formatter={(value) => (value === 'promised' ? 'Promised Remittances' : 'Unconfirmed Maturities')}
              />
              <Bar dataKey="promised" stackId="a" fill="#059669" radius={[0, 0, 0, 0]} />
              <Bar dataKey="unconfirmed" stackId="a" fill="#0f766e" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 3: Horizon Overview & Assumptions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Scenario Assumptions Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-2.5 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Transparent Scenario Assumptions: {currentScenario.scenario_name}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Full disclosure of underlying business logic and probability calibration.
              </p>
            </div>

            <div className="mt-3 space-y-2">
              {currentScenario.assumptions.map((ass, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{ass}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Deterministic simulation rules</span>
            <span>Zero black-box AI guessing</span>
          </div>
        </div>

        {/* Horizon Forecast Metric Cards */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-md p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-2.5 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Horizon Collection Summary: {activeHorizon.toUpperCase()}
              </h3>
            </div>

            {/* Inflow Metric */}
            <div className="mt-3.5 p-4 bg-slate-50 border border-slate-200 rounded-md flex items-baseline justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Projected Collections ({activeHorizon.toUpperCase()})
                </span>
                <p className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
                  {formatINR(horizonTotal)}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <span className="block font-semibold text-slate-800">
                  {currentScenario.scenario_name} Basis
                </span>
                <span>Active window: Next {horizonCount} Days</span>
              </div>
            </div>

            {/* Quick Horizons Comparison */}
            <div className="grid grid-cols-3 gap-3 mt-3.5 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-md">
                <span className="text-[10px] font-bold text-slate-400 uppercase">7-Day Run</span>
                <p className="text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5">{formatINR(currentScenario.total_7d)}</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-md">
                <span className="text-[10px] font-bold text-slate-400 uppercase">15-Day Run</span>
                <p className="text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5">{formatINR(currentScenario.total_15d)}</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-md">
                <span className="text-[10px] font-bold text-slate-400 uppercase">30-Day Run</span>
                <p className="text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5">{formatINR(currentScenario.total_30d)}</p>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Maturity and risk-weighted probabilities active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

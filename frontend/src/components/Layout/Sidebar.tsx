import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Scale,
  AlertTriangle,
  Mail,
  TrendingUp,
  FlaskConical,
  FileSpreadsheet,
  Calculator,
  Settings,
  ShieldCheck,
  Building2,
  ChevronRight
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'receivables'
  | 'reconciliation'
  | 'disputes'
  | 'collections'
  | 'forecasting'
  | 'scenario-lab'
  | 'reports'
  | 'business-case'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  exceptionCount?: number;
  unappliedCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  exceptionCount = 0,
  unappliedCount = 0,
}) => {
  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeVariant?: 'critical' | 'warning' | 'info';
  }> = [
    {
      id: 'overview',
      label: 'Executive Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'receivables',
      label: 'Receivables Register',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      id: 'reconciliation',
      label: 'Reconciliation',
      icon: <Scale className="w-4 h-4" />,
      badge: unappliedCount > 0 ? unappliedCount : undefined,
      badgeVariant: 'warning',
    },
    {
      id: 'disputes',
      label: 'Disputes & Reviews',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: exceptionCount > 0 ? exceptionCount : undefined,
      badgeVariant: 'critical',
    },
    {
      id: 'collections',
      label: 'Collection Workspace',
      icon: <Mail className="w-4 h-4" />,
    },
    {
      id: 'forecasting',
      label: 'Cash Flow Forecast',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: 'scenario-lab',
      label: 'What-If Scenario Lab',
      icon: <FlaskConical className="w-4 h-4" />,
    },
    {
      id: 'reports',
      label: 'Reports & Evidence',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      badge: '11/11 Tests',
      badgeVariant: 'info',
    },
    {
      id: 'business-case',
      label: 'MBA Business Case',
      icon: <Calculator className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Settings & Ingestion',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 text-slate-300 select-none shadow-lg z-30">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 text-slate-950 font-extrabold rounded-md flex items-center justify-center text-xs tracking-wider shadow-sm">
              C28
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-bold text-white tracking-tight">LedgerLoop Desk</h1>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <p className="text-[10px] text-teal-400 font-medium">AR Operations Platform</p>
            </div>
          </div>
        </div>

        <div className="mt-3 px-2 py-1.5 bg-slate-800/70 rounded border border-slate-700/60 flex items-center justify-between text-[10px]">
          <span className="text-slate-400 truncate font-medium">Apex FMCG Distribution</span>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
            PROD v2.4
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        <div className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Daily Operations
        </div>
        {navItems.slice(0, 5).map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-all ${
                isActive
                  ? 'bg-teal-950/80 text-teal-300 font-semibold border-l-2 border-teal-400 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-teal-400' : 'text-slate-400'}>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium ${
                    item.badgeVariant === 'critical'
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : item.badgeVariant === 'warning'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Planning &amp; Audit
        </div>
        {navItems.slice(5).map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-all ${
                isActive
                  ? 'bg-teal-950/80 text-teal-300 font-semibold border-l-2 border-teal-400 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-teal-400' : 'text-slate-400'}>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium ${
                    item.badgeVariant === 'critical'
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : item.badgeVariant === 'warning'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-slate-800 text-teal-400 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Trust & Audit Footer */}
      <div className="p-3 border-t border-slate-800 text-xs text-slate-400 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div className="text-[11px] leading-tight">
            <span className="text-slate-200 font-medium block">Auditable Ledger Logic</span>
            <span className="text-[10px] text-slate-400">Zero black-box AI guessing</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

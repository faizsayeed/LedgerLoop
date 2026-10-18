import React from 'react';
import { HelpCircle } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  definition: string;
  contextText: string;
  icon: React.ReactNode;
  badge?: {
    text: string;
    variant: 'critical' | 'warning' | 'success' | 'info';
  };
  highlight?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  definition,
  contextText,
  icon,
  badge,
  highlight = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-3.5 shadow-sm hover:shadow-md flex flex-col justify-between transition-all duration-150 cursor-pointer group border ${
        highlight
          ? 'bg-[#131b2e] border-teal-500/40 hover:border-teal-400/60 ring-1 ring-teal-500/20'
          : 'bg-[#111827] border-slate-800 hover:border-slate-700'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1 min-w-0 pr-1">
            <span className="text-[10px] sm:text-[10.5px] font-bold tracking-tight uppercase text-slate-400 leading-snug">
              {title}
            </span>
            <div className="group/help relative cursor-help shrink-0">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 transition-colors" />
              <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/help:block z-50 w-60 p-2.5 text-[11px] text-slate-200 bg-slate-950 border border-slate-800 rounded-md shadow-2xl font-normal normal-case leading-relaxed pointer-events-none">
                {definition}
              </div>
            </div>
          </div>
          <div className="text-slate-400 p-1.5 bg-slate-800/80 border border-slate-700/80 group-hover:bg-slate-800 group-hover:text-teal-400 rounded-md shadow-sm shrink-0 transition-colors">
            {icon}
          </div>
        </div>

        {/* Large Financial Number */}
        <div className="mt-1">
          <div className="text-base sm:text-[17px] font-bold tracking-tight text-slate-100 font-mono tabular-nums leading-tight">
            {value}
          </div>
        </div>
      </div>

      {/* Bottom Subtitle & Context Row */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 text-[11px] text-slate-400">
        <span className="truncate">{contextText}</span>
        {badge && (
          <span
            className={`whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 font-mono ${
              badge.variant === 'critical'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                : badge.variant === 'warning'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                : badge.variant === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
};

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
      className={`bg-white border rounded-lg p-3.5 shadow-sm hover:shadow-md flex flex-col justify-between transition-all duration-200 cursor-pointer group ${
        highlight
          ? 'border-teal-300 ring-1 ring-teal-500/20 bg-gradient-to-b from-white to-teal-50/20'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1 min-w-0 pr-1">
            <span className="text-[10px] sm:text-[10.5px] font-bold tracking-tight uppercase text-slate-500 leading-snug">
              {title}
            </span>
            <div className="group/help relative cursor-help shrink-0">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
              <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/help:block z-50 w-60 p-2.5 text-[11px] text-slate-100 bg-slate-900 rounded-md shadow-2xl font-normal normal-case leading-relaxed pointer-events-none">
                {definition}
              </div>
            </div>
          </div>
          <div className="text-slate-700 p-1.5 bg-slate-50 group-hover:bg-teal-50 group-hover:text-teal-700 border border-slate-200 rounded-md shadow-sm shrink-0 transition-colors">
            {icon}
          </div>
        </div>

        {/* Large Financial Number */}
        <div className="mt-1">
          <div className="text-base sm:text-[17px] font-bold tracking-tight text-slate-900 font-mono tabular-nums leading-tight">
            {value}
          </div>
        </div>
      </div>

      {/* Bottom Subtitle & Context Row */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px] text-slate-500">
        <span className="truncate">{contextText}</span>
        {badge && (
          <span
            className={`whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${
              badge.variant === 'critical'
                ? 'bg-red-50 text-red-700 border-red-200'
                : badge.variant === 'warning'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : badge.variant === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
};

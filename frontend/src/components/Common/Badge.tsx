import React from 'react';

interface BadgeProps {
  variant?: 'critical' | 'warning' | 'success' | 'info' | 'dispute' | 'neutral';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'info',
  children,
  className = '',
  size = 'md',
}) => {
  const base = 'inline-flex items-center font-medium rounded border';
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10.5px] leading-tight font-mono' : 'px-2 py-0.5 text-xs';

  const variants = {
    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    info: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
    dispute: 'bg-orange-500/10 text-orange-400 border-orange-500/25',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700/80',
  };

  return (
    <span className={`${base} ${sizeClasses} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

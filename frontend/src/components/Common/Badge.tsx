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
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[11px] leading-tight' : 'px-2 py-0.5 text-xs';

  const variants = {
    critical: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    info: 'bg-slate-100 text-slate-800 border-slate-200',
    dispute: 'bg-orange-50 text-orange-800 border-orange-200',
    neutral: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  return (
    <span className={`${base} ${sizeClasses} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

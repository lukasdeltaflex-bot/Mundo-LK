import React from 'react';
import { cn } from '@/shared/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  children,
  ...props
}) => {
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

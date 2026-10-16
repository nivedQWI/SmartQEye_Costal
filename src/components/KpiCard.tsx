// ============================================================
// SmartQEye Coastal — KpiCard Shared Component
// RFP §5, Proposal §5.1, Phase 7B Shared Component Library
// ============================================================

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string | number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  tooltip?: string;
  onClick?: () => void;
  className?: string;
  badge?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  tooltip,
  onClick,
  className,
  badge,
}: KpiCardProps) {
  const variantStyles = {
    default: 'border-[var(--line)] bg-[var(--panel)] text-[var(--text)]',
    primary: 'border-[var(--sea-600)]/40 bg-[var(--sea-600)]/10 text-[var(--sea-600)]',
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
    warning: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200',
    danger: 'border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-200',
  };

  const trendIcon = {
    up: <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
    down: <TrendingDown className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />,
    neutral: <Minus className="w-3.5 h-3.5 opacity-50" />,
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between shadow-xs',
        variantStyles[variant],
        onClick && 'cursor-pointer hover:shadow-md hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-[var(--sea-600)] outline-none',
        className
      )}
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold opacity-70 tracking-wide uppercase font-mono flex items-center gap-1.5 truncate">
          {title}
          {tooltip && (
            <span title={tooltip} className="cursor-help inline-block opacity-60 hover:opacity-100">
              <Info className="w-3 h-3" />
            </span>
          )}
        </span>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {badge && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[var(--surface)] border border-current opacity-80">
              {badge}
            </span>
          )}
          {Icon && (
            <div className="p-1.5 rounded-lg bg-[var(--surface)] text-[var(--sea-600)] border border-[var(--line)]">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Main value */}
      <div className="flex items-baseline justify-between gap-2 mt-auto">
        <div className="text-2xl lg:text-3xl font-bold font-serif tracking-tight truncate">
          {value}
        </div>

        {trend && (
          <div className="flex items-center gap-1 text-[11px] font-mono font-semibold">
            {trendIcon[trend.direction]}
            <span>{trend.value}</span>
            {trend.label && <span className="opacity-50 text-[10px] hidden sm:inline">{trend.label}</span>}
          </div>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className="text-[11px] opacity-70 mt-1 font-sans truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
}

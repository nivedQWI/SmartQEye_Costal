// ============================================================
// SmartQEye Coastal — StatusChip & AttentionChip Shared Components
// Phase 7B Shared Component Library
// Color-independent glyphs + high contrast borders
// ============================================================

import React from 'react';
import { cn } from '@/lib/utils';
import { AttentionBadge } from '@/components/AttentionBadge';
import type { AttentionLevel, RationaleFactor } from '@/types';

export interface StatusChipProps {
  status: string;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'xs' | 'sm' | 'md';
  pulse?: boolean;
  glyph?: string;
  className?: string;
}

export function StatusChip({
  status,
  variant,
  size = 'sm',
  pulse = false,
  glyph,
  className,
}: StatusChipProps) {
  // Infer variant if not explicitly given
  const normalized = status.toUpperCase().replace(/\s+/g, '_');
  let effectiveVariant = variant;

  if (!effectiveVariant) {
    if (['ACTIVE', 'LIVE', 'PASSED', 'VERIFIED', 'RESOLVED', 'SUCCESS', 'ONLINE', 'CONNECTED'].includes(normalized)) {
      effectiveVariant = 'success';
    } else if (['STANDBY', 'WARNING', 'PENDING', 'BUFFERING', 'DEGRADED', 'ATTENTION', 'MONITOR', 'UNDER_REVIEW'].includes(normalized)) {
      effectiveVariant = 'warning';
    } else if (['ERROR', 'FAILED', 'CRITICAL', 'NO_SIGNAL', 'OFFLINE', 'BREACH', 'TAMPER_FLAGGED', 'DISMISSED'].includes(normalized)) {
      effectiveVariant = 'danger';
    } else if (['INFO', 'CANDIDATE', 'SCHEDULED', 'STARTING', 'ACKNOWLEDGED'].includes(normalized)) {
      effectiveVariant = 'info';
    } else if (['EVALUATING', 'MINING_SET', 'ROLLBACK_TARGET'].includes(normalized)) {
      effectiveVariant = 'purple';
    } else {
      effectiveVariant = 'neutral';
    }
  }

  const variantClasses = {
    neutral: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/30',
    success: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/40',
    warning: 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/40',
    danger: 'bg-red-500/15 text-red-800 dark:text-red-200 border-red-500/40',
    info: 'bg-sky-500/15 text-sky-800 dark:text-sky-200 border-sky-500/40',
    purple: 'bg-purple-500/15 text-purple-800 dark:text-purple-200 border-purple-500/40',
  }[effectiveVariant];

  const dotColors = {
    neutral: 'bg-gray-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-sky-500',
    purple: 'bg-purple-500',
  }[effectiveVariant];

  const sizeClasses = {
    xs: 'px-1.5 py-0.2 text-[9px] gap-1',
    sm: 'px-2 py-0.5 text-[10px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center font-mono font-bold rounded-full border leading-tight select-none',
        sizeClasses,
        variantClasses,
        className
      )}
    >
      {glyph ? (
        <span aria-hidden="true" className="text-[10px]">{glyph}</span>
      ) : (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            dotColors,
            pulse && 'animate-ping'
          )}
        />
      )}
      <span>{status.replace(/_/g, ' ')}</span>
    </span>
  );
}

// ─── AttentionChip Re-export & Compact Variant ─────────────────

export interface AttentionChipProps {
  level: AttentionLevel;
  factors?: RationaleFactor[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AttentionChip({ level, factors, size = 'sm', className }: AttentionChipProps) {
  return (
    <AttentionBadge
      level={level}
      factors={factors}
      size={size}
      className={className}
    />
  );
}

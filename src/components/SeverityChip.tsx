// ============================================================
// SmartQEye Coastal — Severity Chip
// Includes glyph shape + text label (never colour alone)
// ============================================================

import { cn, SEV_GLYPH, SEV_LABELS } from '@/lib/utils';
import type { Severity } from '@/types';

const SEV_STYLE: Record<Severity, string> = {
  INFO:     'text-sky-700 bg-sky-100 border-sky-200 dark:text-sky-300 dark:bg-sky-900/30 dark:border-sky-800',
  LOW:      'text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-800',
  MEDIUM:   'text-amber-700 bg-amber-100 border-amber-200 dark:text-amber-300 dark:bg-amber-900/30 dark:border-amber-800',
  HIGH:     'text-orange-700 bg-orange-100 border-orange-200 dark:text-orange-300 dark:bg-orange-900/30 dark:border-orange-800',
  CRITICAL: 'text-red-700 bg-red-100 border-red-200 dark:text-red-300 dark:bg-red-900/30 dark:border-red-800',
};

interface SeverityChipProps {
  severity: Severity;
  size?: 'sm' | 'md' | 'lg';
  showGlyph?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function SeverityChip({
  severity,
  size = 'md',
  showGlyph = true,
  showLabel = true,
  className,
}: SeverityChipProps) {
  const sizes = {
    sm: 'px-2 py-0.5 text-xs font-semibold gap-1.5',
    md: 'px-2.5 py-0.5 text-xs font-semibold gap-1.5',
    lg: 'px-3.5 py-1 text-sm font-semibold gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border font-mono',
        sizes[size],
        SEV_STYLE[severity],
        className,
      )}
      aria-label={`Severity: ${SEV_LABELS[severity]}`}
    >
      {showGlyph && (
        <span aria-hidden="true" className="text-[0.7em] leading-none">{SEV_GLYPH[severity]}</span>
      )}
      {showLabel && <span>{SEV_LABELS[severity]}</span>}
    </span>
  );
}

// ─── Severity dot (minimal) ───────────────────────────────────
interface SeverityDotProps {
  severity: Severity;
  pulse?: boolean;
  className?: string;
}

const DOT_COLOURS: Record<Severity, string> = {
  INFO:     'bg-sky-500',
  LOW:      'bg-emerald-500',
  MEDIUM:   'bg-amber-500',
  HIGH:     'bg-orange-500',
  CRITICAL: 'bg-red-600',
};

export function SeverityDot({ severity, pulse = false, className }: SeverityDotProps) {
  return (
    <span className={cn('relative inline-flex h-2 w-2', className)}>
      {pulse && (
        <span
          className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-60', DOT_COLOURS[severity])}
        />
      )}
      <span className={cn('relative inline-flex rounded-full h-2 w-2', DOT_COLOURS[severity])} />
    </span>
  );
}

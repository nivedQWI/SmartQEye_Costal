// ============================================================
// SmartQEye Coastal — Feed State Ring / Chip
// ============================================================

import { cn, FEED_STATE_LABELS, FEED_STATE_COLOUR } from '@/lib/utils';
import type { FeedState } from '@/types';

interface FeedStateChipProps {
  state: FeedState;
  size?: 'sm' | 'md';
  className?: string;
}

const STATE_STYLE: Record<FeedState, string> = {
  LIVE:          'text-emerald-700 bg-emerald-100 border-emerald-300 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700',
  BUFFERING:     'text-amber-700 bg-amber-100 border-amber-300 dark:text-amber-300 dark:bg-amber-900/30 dark:border-amber-700',
  NO_SIGNAL:     'text-red-700 bg-red-100 border-red-300 dark:text-red-300 dark:bg-red-900/30 dark:border-red-700',
  RECORDED:      'text-sky-700 bg-sky-100 border-sky-300 dark:text-sky-300 dark:bg-sky-900/30 dark:border-sky-700',
  EDGE_SYNC_LAG: 'text-purple-700 bg-purple-100 border-purple-300 dark:text-purple-300 dark:bg-purple-900/30 dark:border-purple-700',
};

const STATE_DOT: Record<FeedState, string> = {
  LIVE:          'bg-emerald-500',
  BUFFERING:     'bg-amber-500',
  NO_SIGNAL:     'bg-red-600',
  RECORDED:      'bg-sky-500',
  EDGE_SYNC_LAG: 'bg-purple-500',
};

export function FeedStateChip({ state, size = 'md', className }: FeedStateChipProps) {
  const sizes = {
    sm: 'px-1.5 py-0 text-xs gap-1',
    md: 'px-2 py-0.5 text-xs gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        sizes[size],
        STATE_STYLE[state],
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', STATE_DOT[state], state === 'LIVE' && 'animate-pulse')} />
      {FEED_STATE_LABELS[state]}
    </span>
  );
}

// ─── Modality chip ────────────────────────────────────────────

interface ModalityChipProps {
  modality: 'RGB' | 'THERMAL' | 'NIGHT_VISION';
  size?: 'sm' | 'md';
  className?: string;
}

export function ModalityChip({ modality, size = 'md', className }: ModalityChipProps) {
  const sizes = { sm: 'px-1.5 py-0 text-xs', md: 'px-2 py-0.5 text-xs' };
  const style = modality === 'RGB'
    ? 'text-sky-700 bg-sky-100 border-sky-300 dark:text-sky-300 dark:bg-sky-900/30 dark:border-sky-700'
    : modality === 'THERMAL'
    ? 'text-orange-700 bg-orange-100 border-orange-300 dark:text-orange-300 dark:bg-orange-900/30 dark:border-orange-700'
    : 'text-emerald-700 bg-emerald-100 border-emerald-300 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700';
  return (
    <span className={cn('inline-flex items-center font-mono font-medium rounded border', sizes[size], style, className)}>
      {modality === 'NIGHT_VISION' ? 'NVG' : modality}
    </span>
  );
}

// ─── Status dot for health services ──────────────────────────

interface StatusDotProps {
  status: 'OK' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';
  label?: string;
}

const STATUS_COLOURS: Record<string, string> = {
  OK:      'bg-emerald-500',
  DEGRADED:'bg-amber-500',
  DOWN:    'bg-red-600',
  UNKNOWN: 'bg-gray-400',
};

export function StatusDot({ status, label }: StatusDotProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_COLOURS[status])} />
      {label && <span className="text-xs">{label}</span>}
    </span>
  );
}

// ─── Porthole ring component (for feed tiles) ─────────────────
interface PortholeRingProps {
  state: FeedState;
  children: React.ReactNode;
  className?: string;
}

export function PortholeRing({ state, children, className }: PortholeRingProps) {
  const ringClass = {
    LIVE: 'ring-live',
    BUFFERING: 'ring-buffering',
    NO_SIGNAL: 'ring-no-signal',
    RECORDED: 'ring-recorded',
    EDGE_SYNC_LAG: 'ring-edge-sync',
  }[state];

  return (
    <div
      className={cn('rounded-lg overflow-hidden', ringClass, className)}
      style={{ outline: `2px solid ${FEED_STATE_COLOUR[state]}` }}
    >
      {children}
    </div>
  );
}

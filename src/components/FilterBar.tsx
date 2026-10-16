// ============================================================
// SmartQEye Coastal — FilterBar Shared Component
// Phase 7B Shared Component Library
// ============================================================

import React from 'react';
import { Filter, X, Calendar, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterChip {
  id: string;
  label: string;
  value: string;
  onRemove: () => void;
}

export interface FilterBarProps {
  chips?: FilterChip[];
  onClearAll?: () => void;
  dateRange?: {
    start: string;
    end: string;
    onChangeStart?: (val: string) => void;
    onChangeEnd?: (val: string) => void;
  };
  presets?: {
    id: string;
    label: string;
    active: boolean;
    onClick: () => void;
  }[];
  children?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  chips = [],
  onClearAll,
  dateRange,
  presets = [],
  children,
  className,
}: FilterBarProps) {
  const hasFilters = chips.length > 0;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-xl border bg-[var(--surface)] text-xs',
        className
      )}
      style={{ borderColor: 'var(--line)' }}
    >
      {/* Left side: Filter presets and extra controls */}
      <div className="flex items-center gap-2 flex-wrap flex-1">
        <div className="flex items-center gap-1.5 opacity-60 font-mono text-[10px] uppercase font-bold mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {presets.map(p => (
          <button
            key={p.id}
            onClick={p.onClick}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
              p.active
                ? 'bg-[var(--sea-600)] text-white border-[var(--sea-600)] shadow-2xs'
                : 'bg-[var(--panel)] border-[var(--line)] opacity-70 hover:opacity-100'
            )}
          >
            {p.label}
          </button>
        ))}

        {children}
      </div>

      {/* Right side: Date inputs & Active Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {dateRange && (
          <div className="flex items-center gap-1.5 font-mono text-xs px-2 py-0.5 rounded-lg border bg-[var(--panel)]" style={{ borderColor: 'var(--line)' }}>
            <Calendar className="w-3.5 h-3.5 opacity-50" />
            <input
              type="date"
              value={dateRange.start}
              onChange={e => dateRange.onChangeStart?.(e.target.value)}
              className="bg-transparent text-[11px] outline-none"
              title="Start Date"
            />
            <span className="opacity-40">→</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={e => dateRange.onChangeEnd?.(e.target.value)}
              className="bg-transparent text-[11px] outline-none"
              title="End Date"
            />
          </div>
        )}

        {chips.map(chip => (
          <span
            key={chip.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-[var(--sea-600)]/15 text-[var(--sea-600)] border border-[var(--sea-600)]/30"
          >
            <span className="opacity-60">{chip.label}:</span>
            <span>{chip.value}</span>
            <button
              onClick={chip.onRemove}
              className="p-0.5 hover:bg-black/10 rounded cursor-pointer"
              title={`Remove ${chip.label} filter`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {hasFilters && onClearAll && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 text-[11px] font-semibold opacity-60 hover:opacity-100 hover:text-red-500 transition-colors cursor-pointer"
            title="Reset all active filters"
          >
            <RotateCcw className="w-3 h-3" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}

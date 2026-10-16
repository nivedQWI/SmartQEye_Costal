// ============================================================
// SmartQEye Coastal — AttentionBadge Component (Phase 3F)
// Context-Aware Operational Attention Level indicator + Rationale Popover
// Levels: RECORD_ONLY, MONITOR, ATTENTION, CRITICAL
// ============================================================

import { useState } from 'react';
import { Shield, Info, AlertTriangle, Eye, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AttentionLevel, RationaleFactor } from '@/types';

interface AttentionBadgeProps {
  level: AttentionLevel;
  factors?: RationaleFactor[];
  size?: 'sm' | 'md' | 'lg';
  showWhyButton?: boolean;
  className?: string;
}

const ATTENTION_CONFIG: Record<AttentionLevel, {
  label: string;
  glyph: string;
  bg: string;
  text: string;
  border: string;
  badgeClass: string;
  description: string;
}> = {
  RECORD_ONLY: {
    label: 'RECORD ONLY',
    glyph: '○',
    bg: 'rgba(147, 162, 171, 0.12)',
    text: '#93A2AB',
    border: 'rgba(147, 162, 171, 0.3)',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    description: 'Normal coastal traffic. Logged to observation ledger for cross-mission baseline statistics.',
  },
  MONITOR: {
    label: 'MONITOR',
    glyph: '◔',
    bg: 'rgba(63, 174, 154, 0.12)',
    text: '#3FAE9A',
    border: 'rgba(63, 174, 154, 0.35)',
    badgeClass: 'bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border-teal-300 dark:border-teal-800',
    description: 'Elevated interest. Continuous ByteTrack and telemetry monitoring active without dispatch alert.',
  },
  ATTENTION: {
    label: 'ATTENTION',
    glyph: '◑',
    bg: 'rgba(224, 165, 38, 0.15)',
    text: '#E0A526',
    border: 'rgba(224, 165, 38, 0.45)',
    badgeClass: 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    description: 'Significant behaviour deviation or zone dwell. Operator review recommended.',
  },
  CRITICAL: {
    label: 'CRITICAL',
    glyph: '●',
    bg: 'rgba(200, 53, 46, 0.15)',
    text: '#C8352E',
    border: 'rgba(200, 53, 46, 0.5)',
    badgeClass: 'bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200 border-red-300 dark:border-red-800',
    description: 'Immediate operational attention required. Geofence breach or high-risk convergence pattern.',
  },
};

export function AttentionBadge({
  level = 'RECORD_ONLY',
  factors = [],
  size = 'md',
  showWhyButton = true,
  className,
}: AttentionBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const cfg = ATTENTION_CONFIG[level] ?? ATTENTION_CONFIG.RECORD_ONLY;

  const sizeStyles = {
    sm: 'text-[9px] px-1.5 py-0.5 gap-1',
    md: 'text-[11px] px-2 py-0.5 gap-1.5',
    lg: 'text-xs px-2.5 py-1 gap-2',
  }[size];

  // Default factors if none provided
  const displayFactors: RationaleFactor[] = factors.length > 0 ? factors : [
    { factorName: 'Track Persistence', value: '42m continuous', contribution: 'PRIMARY' },
    { factorName: 'Zone Context Policy', value: level === 'CRITICAL' ? 'Naval Berth Prohibited' : 'Coastal Waterway', contribution: 'PRIMARY' },
    { factorName: 'Sensor Modality Confidence', value: '88% RTMDet', contribution: 'SUPPORTING' },
    { factorName: 'Temporal Profile', value: 'Dawn Patrol Sortie', contribution: 'CONTEXTUAL' },
  ];

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <div
        className={cn(
          'inline-flex items-center rounded-md font-mono font-bold border transition-colors select-none',
          sizeStyles,
          cfg.badgeClass
        )}
        style={{ color: cfg.text, borderColor: cfg.border, backgroundColor: cfg.bg }}
      >
        <span className={cn('font-black text-[13px] leading-none', level === 'CRITICAL' && 'animate-pulse')}>
          {cfg.glyph}
        </span>
        <span>{cfg.label}</span>

        {showWhyButton && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="ml-1 opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
            title="Why this attention level? Click to view accumulated evidence factors"
            aria-label="View attention level explanation"
          >
            <HelpCircle className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Rationale Popover */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div
            className="absolute left-0 top-full mt-1.5 w-72 rounded-xl border p-3 shadow-2xl z-50 text-xs font-sans animate-in fade-in zoom-in-95 duration-150"
            style={{
              background: 'var(--raised)',
              borderColor: 'var(--line)',
              color: 'var(--text)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-2 mb-2" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-1.5 font-bold font-serif text-[11px]">
                <Shield className="w-3.5 h-3.5 text-[var(--sea-accent)]" />
                <span>Context-Aware Attention Rationale</span>
              </div>
              <span
                className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border"
                style={{ color: cfg.text, borderColor: cfg.border, backgroundColor: cfg.bg }}
              >
                {cfg.label}
              </span>
            </div>

            <p className="text-[11px] opacity-75 mb-2.5 leading-snug">
              {cfg.description}
            </p>

            <div className="space-y-1.5 mb-2.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-50 block">
                Accumulated Evidence Factors
              </span>
              {displayFactors.map((f, i) => {
                const contribColor =
                  f.contribution === 'PRIMARY'
                    ? 'var(--sev-critical)'
                    : f.contribution === 'SUPPORTING'
                    ? 'var(--sev-high)'
                    : 'var(--text-muted)';
                return (
                  <div
                    key={i}
                    className="flex items-start justify-between text-[11px] py-1 border-b last:border-b-0 gap-2"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <span className="opacity-75">{f.factorName}:</span>
                    <span className="font-mono font-semibold text-right" style={{ color: contribColor }}>
                      {f.value}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              className="p-1.5 rounded bg-black/5 dark:bg-white/5 text-[9px] font-mono opacity-60 leading-tight border"
              style={{ borderColor: 'var(--line)' }}
            >
              Intelligence pipeline: Context-Aware Operational Attention. Final decision authority rests with human police officer.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

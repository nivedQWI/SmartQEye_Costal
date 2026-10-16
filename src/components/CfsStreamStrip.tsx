// ============================================================
// SmartQEye Coastal — Cognitive Frame Selection (CFS) Strip (Phase 3E)
// Proposal 5.1.17: Pre-inference frame selection optimizing edge/central compute
// CFS optimizes compute; CKFE selects evidence frames after an event.
// ============================================================

import { useState, useMemo } from 'react';
import { Cpu, Zap, Activity, Info, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CfsSlice, CfsSliceState, CfsReasonCode } from '@/types';

interface CfsStreamStripProps {
  feedId?: string;
  uavCode?: string;
  compact?: boolean;
  className?: string;
}

const REASON_LABELS: Record<CfsReasonCode, string> = {
  NEW_OBJECT: 'New Contact in Field of View',
  SIGNIFICANT_MOTION: 'Significant Kinematic Motion Delta',
  TRACK_UNCERTAINTY: 'Track Discontinuity / Ambiguity',
  ZONE_INTERACTION: 'Geofence Boundary Proximity',
  SCENE_CHANGE: 'Drone Gimbal Pan / Altitude Change',
  IDLE_SCENE: 'Static Maritime Background / Low Delta',
};

const STATE_COLORS: Record<CfsSliceState, { bg: string; border: string; text: string; label: string }> = {
  FULL: {
    bg: '#2ECC71',
    border: '#27AE60',
    text: '#2ECC71',
    label: 'FULL (30 FPS Deep Detection)',
  },
  LIGHT: {
    bg: '#E0A526',
    border: '#D48816',
    text: '#E0A526',
    label: 'LIGHT (5 FPS Tracker Only)',
  },
  SKIP: {
    bg: '#475569',
    border: '#334155',
    text: '#94A3B8',
    label: 'SKIP (0 FPS Interpolated)',
  },
};

export function CfsStreamStrip({
  feedId = 'f-01',
  uavCode = 'UAV-KL-01',
  compact = false,
  className,
}: CfsStreamStripProps) {
  const [selectedSlice, setSelectedSlice] = useState<CfsSlice | null>(null);

  // Generate deterministic 60-second slice strip for Vizhinjam Dawn Patrol
  const slices: CfsSlice[] = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {
      // 0s-10s: baseline patrol -> mostly LIGHT or SKIP
      // 11s-28s: new contact enters + restricted zone approach -> FULL
      // 29s-45s: dwell & tracking -> LIGHT + sporadic FULL
      // 46s-60s: stable transit -> mostly SKIP / LIGHT
      let state: CfsSliceState = 'SKIP';
      let reasonCode: CfsReasonCode = 'IDLE_SCENE';
      let fps = 0;

      if ((i >= 8 && i <= 15) || (i >= 22 && i <= 30) || (i >= 42 && i <= 48)) {
        state = 'FULL';
        reasonCode = i >= 22 && i <= 30 ? 'ZONE_INTERACTION' : i >= 8 && i <= 15 ? 'NEW_OBJECT' : 'TRACK_UNCERTAINTY';
        fps = 30;
      } else if ((i >= 4 && i <= 7) || (i >= 16 && i <= 21) || (i >= 31 && i <= 41) || (i >= 49 && i <= 54)) {
        state = 'LIGHT';
        reasonCode = i % 2 === 0 ? 'SIGNIFICANT_MOTION' : 'SCENE_CHANGE';
        fps = 5;
      } else {
        state = 'SKIP';
        reasonCode = 'IDLE_SCENE';
        fps = 0;
      }

      return {
        secondOffset: i,
        state,
        reasonCode,
        reasonText: REASON_LABELS[reasonCode],
        fps,
      };
    });
  }, []);

  // Compute metrics
  const fullCount = slices.filter(s => s.state === 'FULL').length;
  const lightCount = slices.filter(s => s.state === 'LIGHT').length;
  const skipCount = slices.filter(s => s.state === 'SKIP').length;
  const framesDeep = fullCount * 30 + lightCount * 5;
  const framesTotal = 60 * 30; // 1,800 frames baseline
  const gpuSavedPct = Math.round((1 - framesDeep / framesTotal) * 100);

  return (
    <div
      className={cn('rounded-xl border p-3 font-sans transition-all', className)}
      style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
    >
      {/* Header with Title & Pipeline Distinct Tooltip */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-[var(--sea-600)]/15 text-[var(--sea-600)]">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-xs font-bold">Cognitive Frame Selection (CFS)</span>
              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-600 font-bold border border-cyan-500/20">
                EDGE OPTIMISATION
              </span>
            </div>
            {!compact && (
              <span className="text-[10px] opacity-60 block font-mono">
                {uavCode} ({feedId}) · 60s Temporal Inference Profile
              </span>
            )}
          </div>
        </div>

        {/* CFS vs CKFE Distinction Pill */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted bg-[var(--raised)] px-2 py-0.5 rounded border border-[var(--line)]">
          <Info className="w-3 h-3 text-[var(--sea-accent)]" />
          <span title="CFS runs before inference to optimise compute; CKFE selects keyframes after an alert as evidence">
            CFS: Pre-Inference Compute Filter
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 mb-2.5 text-center">
        <div className="p-1.5 rounded bg-[var(--raised)] border border-[var(--line)]">
          <span className="text-[9px] font-mono opacity-50 block uppercase">Deep Inference</span>
          <span className="text-xs font-mono font-bold text-emerald-600">
            {framesDeep} / {framesTotal} <span className="opacity-60 text-[10px]">({Math.round((framesDeep / framesTotal) * 100)}%)</span>
          </span>
        </div>

        <div className="p-1.5 rounded bg-[var(--raised)] border border-[var(--line)]">
          <span className="text-[9px] font-mono opacity-50 block uppercase">GPU Time Saved</span>
          <span className="text-xs font-mono font-bold text-[var(--sea-600)]">
            {gpuSavedPct}% <span className="text-[9px] opacity-60 font-sans font-normal">(illustrative)</span>
          </span>
        </div>

        <div className="p-1.5 rounded bg-[var(--raised)] border border-[var(--line)]">
          <span className="text-[9px] font-mono opacity-50 block uppercase">Inference State</span>
          <span className="text-xs font-mono font-bold text-amber-500">
            {fullCount}s FULL · {lightCount}s LIGHT
          </span>
        </div>
      </div>

      {/* 60-Second Timeline Strip */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[9px] font-mono opacity-50">
          <span>T-60s</span>
          <span>T-30s</span>
          <span>LIVE NOW</span>
        </div>

        <div className="flex h-5 w-full rounded overflow-hidden border border-slate-700/60 bg-slate-900 gap-[1px] p-[1px]">
          {slices.map((slice, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedSlice(slice)}
              className={cn(
                'flex-1 h-full rounded-[1px] transition-transform hover:scale-125 focus:outline-hidden',
                selectedSlice?.secondOffset === slice.secondOffset && 'ring-1 ring-white'
              )}
              style={{ backgroundColor: STATE_COLORS[slice.state].bg }}
              title={`T-${60 - slice.secondOffset}s: ${slice.state} (${slice.fps} FPS) — ${slice.reasonText}`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between pt-1 text-[9px] font-mono opacity-70">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-[#2ECC71]" /> FULL (15-30 FPS)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-[#E0A526]" /> LIGHT (5 FPS)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-[#475569]" /> SKIP (0 FPS)
            </span>
          </div>

          <span className="opacity-50">Click slice for rationale</span>
        </div>
      </div>

      {/* Selected Slice Detail Callout */}
      {selectedSlice && (
        <div className="mt-2.5 p-2 rounded-lg bg-[var(--raised)] border border-[var(--line)] text-xs flex items-start justify-between animate-in fade-in">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: STATE_COLORS[selectedSlice.state].bg }}
              />
              <span>T-{60 - selectedSlice.secondOffset}s Inference Slice:</span>
              <span style={{ color: STATE_COLORS[selectedSlice.state].text }}>
                {STATE_COLORS[selectedSlice.state].label}
              </span>
            </div>
            <p className="text-[11px] opacity-75 mt-0.5">
              Selection Reason: <strong>{selectedSlice.reasonText}</strong> ({selectedSlice.reasonCode})
            </p>
          </div>

          <button
            onClick={() => setSelectedSlice(null)}
            className="text-[10px] opacity-40 hover:opacity-100 font-mono ml-2"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

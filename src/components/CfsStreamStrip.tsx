// ============================================================
// SmartQEye Coastal — Cognitive Frame Selection (CFS) Strip
// Proposal 5.1.17: Pre-inference frame selection optimizing edge/central compute
// Shows live frame accounting for the focused feed:
//   Frames Received → Frames Selected (sent to AI) + Frames Discarded
// ============================================================

import { useEffect, useState } from 'react';
import { Zap, Info, Download, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CfsStreamStripProps {
  feedId?: string;
  uavCode?: string;
  /** Camera frame rate of the incoming stream. */
  fps?: number;
  compact?: boolean;
  className?: string;
}

// Deterministic 60-second CFS profile (seconds in which the scene had activity).
// FULL seconds: every frame selected; LIGHT: 5 fps selected; SKIP: 0 selected.
function selectedForSecond(sec: number, fps: number): number {
  const i = sec % 60;
  if ((i >= 8 && i <= 15) || (i >= 22 && i <= 30) || (i >= 42 && i <= 48)) return fps;
  if ((i >= 4 && i <= 7) || (i >= 16 && i <= 21) || (i >= 31 && i <= 41) || (i >= 49 && i <= 54)) return Math.min(5, fps);
  return 0;
}

function seedFromId(id: string): number {
  let h = 0;
  for (let k = 0; k < id.length; k++) h = (h * 31 + id.charCodeAt(k)) >>> 0;
  return h;
}

// Start each feed from a plausible, feed-specific running total so the
// counters look like an in-progress stream rather than starting at zero.
function initialStats(feedId: string, fps: number) {
  const seconds = 600 + (seedFromId(feedId) % 900); // 10–25 min into the sortie
  let selected = 0;
  for (let s = 0; s < seconds; s++) selected += selectedForSecond(s, fps);
  return { seconds, received: seconds * fps, selected };
}

export function CfsStreamStrip({
  feedId = 'f-01',
  uavCode = 'UAV-KL-01',
  fps = 25,
  compact = false,
  className,
}: CfsStreamStripProps) {
  const [stats, setStats] = useState(() => initialStats(feedId, fps));

  useEffect(() => {
    setStats(initialStats(feedId, fps));
    const id = window.setInterval(() => {
      setStats(prev => {
        const sec = prev.seconds + 1;
        // ±1 frame jitter on the incoming stream
        const got = Math.max(0, fps + (Math.random() < 0.15 ? -1 : 0));
        return {
          seconds: sec,
          received: prev.received + got,
          selected: prev.selected + Math.min(got, selectedForSecond(sec, fps)),
        };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [feedId, fps]);

  const discarded = stats.received - stats.selected;
  const selectedPct = stats.received ? (stats.selected / stats.received) * 100 : 0;
  const fmt = (n: number) => n.toLocaleString('en-IN');

  return (
    <div
      className={cn('rounded-xl border p-3 font-sans transition-all', className)}
      style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-[var(--sea-600)]/15 text-[var(--sea-600)]">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-xs font-bold">Cognitive Frame Selection (CFS)</span>
              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 font-bold border border-cyan-500/20">
                LIVE
              </span>
            </div>
            {!compact && (
              <span className="text-[10px] opacity-60 block font-mono">
                {uavCode} ({feedId}) · {fps} FPS stream
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono bg-[var(--raised)] px-2 py-0.5 rounded border border-[var(--line)]">
          <Info className="w-3 h-3 text-[var(--sea-accent)]" />
          <span title="CFS picks only the useful frames for AI analysis and drops repetitive ones">
            {selectedPct.toFixed(1)}% of frames sent to AI
          </span>
        </div>
      </div>

      {/* Live frame counters */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-1.5 rounded bg-[var(--raised)] border border-[var(--line)]">
          <span className="text-[9px] font-mono opacity-60 uppercase flex items-center justify-center gap-1">
            <Download className="w-3 h-3" /> Frames Received
          </span>
          <span className="text-sm font-mono font-bold tabular" style={{ color: 'var(--text)' }}>
            {fmt(stats.received)}
          </span>
        </div>

        <div className="p-1.5 rounded bg-[var(--raised)] border border-[var(--line)]">
          <span className="text-[9px] font-mono opacity-60 uppercase flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Frames Selected
          </span>
          <span className="text-sm font-mono font-bold tabular text-emerald-600 dark:text-emerald-400">
            {fmt(stats.selected)}
          </span>
        </div>

        <div className="p-1.5 rounded bg-[var(--raised)] border border-[var(--line)]">
          <span className="text-[9px] font-mono opacity-60 uppercase flex items-center justify-center gap-1">
            <XCircle className="w-3 h-3 text-slate-400" /> Frames Discarded
          </span>
          <span className="text-sm font-mono font-bold tabular text-slate-500 dark:text-slate-300">
            {fmt(discarded)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SmartQEye Coastal — Cognitive Keyframe Extraction (CKFE) Strip (Phase 3E)
// Proposal 5.1.18: Post-event evidence frame selection for court dossiers
// CFS optimizes compute; CKFE selects evidence frames after an event.
// ============================================================

import { useState } from 'react';
import { Camera, Image as ImageIcon, Flame, Check, Copy, ExternalLink, Info } from 'lucide-react';
import { cn, copyToClipboard } from '@/lib/utils';
import type { CkfeEvidenceKeyframe } from '@/types';

interface CkfeKeyframeStripProps {
  keyframes?: CkfeEvidenceKeyframe[];
  selectedKeyframeId?: string;
  onSelectKeyframe?: (timeSec: number, kf: CkfeEvidenceKeyframe) => void;
  className?: string;
}

const DEFAULT_KEYFRAMES: CkfeEvidenceKeyframe[] = [
  {
    id: 'kf-01',
    timeSec: 8,
    timestampIso: '08:30:08 IST',
    modality: 'RGB',
    reason: 'FIRST_APPEARANCE',
    reasonLabel: 'First target ingress into coastal patrol sector',
    confidence: 0.88,
    thumbnailUrl: '/mock/kf1.jpg',
    sha256: '9f3a2c8d1e4f6b7a0c9d2e5f3a8b4c1d7e0f2a9b5c8d3e6f1a4b7c0d9e2f5a81',
  },
  {
    id: 'kf-02',
    timeSec: 18,
    timestampIso: '08:30:18 IST',
    modality: 'RGB',
    reason: 'CLOSEST_APPROACH',
    reasonLabel: 'Closest shoreline proximity (48m from breakwater)',
    confidence: 0.91,
    thumbnailUrl: '/mock/kf2.jpg',
    sha256: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a23',
  },
  {
    id: 'kf-03',
    timeSec: 24,
    timestampIso: '08:30:24 IST',
    modality: 'THERMAL',
    reason: 'ZONE_ENTRY',
    reasonLabel: 'Crossed Restricted Military Zone Z-07 boundary',
    confidence: 0.94,
    thumbnailUrl: '/mock/kf3.jpg',
    sha256: '4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d54',
  },
  {
    id: 'kf-04',
    timeSec: 32,
    timestampIso: '08:30:32 IST',
    modality: 'THERMAL',
    reason: 'PEAK_CONFIDENCE',
    reasonLabel: 'Peak thermal contrast & signature identification (95%)',
    confidence: 0.95,
    thumbnailUrl: '/mock/kf4.jpg',
    sha256: '7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e85',
  },
  {
    id: 'kf-05',
    timeSec: 45,
    timestampIso: '08:30:45 IST',
    modality: 'RGB',
    reason: 'STATE_TRANSITION',
    reasonLabel: 'Kinematic course shift away from naval berth towards open sea',
    confidence: 0.89,
    thumbnailUrl: '/mock/kf5.jpg',
    sha256: 'c0d9e2f5a819f3a2c8d1e4f6b7a0c9d2e5f3a8b4c1d7e0f2a9b5c8d3e6f1a4b6',
  },
];

const REASON_COLORS: Record<string, string> = {
  FIRST_APPEARANCE: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30',
  CLOSEST_APPROACH: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  ZONE_ENTRY: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30',
  PEAK_CONFIDENCE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  STATE_TRANSITION: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
};

export function CkfeKeyframeStrip({
  keyframes = DEFAULT_KEYFRAMES,
  selectedKeyframeId,
  onSelectKeyframe,
  className,
}: CkfeKeyframeStripProps) {
  const [activeKf, setActiveKf] = useState<CkfeEvidenceKeyframe>(keyframes[0] ?? DEFAULT_KEYFRAMES[0]);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  const handleCopySha = async (sha: string) => {
    await copyToClipboard(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 1800);
  };

  const handleSelect = (kf: CkfeEvidenceKeyframe) => {
    setActiveKf(kf);
    if (onSelectKeyframe) {
      onSelectKeyframe(kf.timeSec, kf);
    }
  };

  return (
    <div
      className={cn('rounded-xl border p-3 font-sans transition-all', className)}
      style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-[var(--sea-600)]/15 text-[var(--sea-600)]">
            <Camera className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-xs font-bold">Cognitive Keyframe Extraction (CKFE)</span>
              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 font-bold border border-purple-500/20">
                POST-EVENT EVIDENCE
              </span>
            </div>
            <span className="text-[10px] opacity-60 block font-mono">
              Deterministic evidence frames curated for Evidence-Linked Incident Record (ELIR)
            </span>
          </div>
        </div>

        {/* CFS vs CKFE Tooltip */}
        <div className="flex items-center gap-1 text-[10px] font-mono opacity-70 bg-[var(--raised)] px-2 py-0.5 rounded border border-[var(--line)]">
          <Info className="w-3 h-3 text-[var(--sea-accent)]" />
          <span title="CKFE extracts salient evidence frames after an alert for police dossiers. CFS operates before inference.">
            CKFE: Salient Evidence Frames
          </span>
        </div>
      </div>

      {/* Keyframe Thumbnail Strip */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        {keyframes.map((kf, i) => {
          const isSelected = (selectedKeyframeId ? selectedKeyframeId === kf.id : activeKf.id === kf.id);
          return (
            <button
              key={kf.id}
              type="button"
              onClick={() => handleSelect(kf)}
              className={cn(
                'group relative flex flex-col rounded-lg border text-left overflow-hidden transition-all p-1.5',
                isSelected
                  ? 'border-[var(--sea-accent)] ring-2 ring-[var(--sea-accent)]/30 shadow-md'
                  : 'border-[var(--line)] hover:border-slate-400 bg-[var(--raised)]'
              )}
            >
              {/* Synthetic image preview */}
              <div
                className="w-full h-14 rounded overflow-hidden relative mb-1.5 flex items-center justify-center font-mono text-[10px]"
                style={{
                  background: kf.modality === 'THERMAL'
                    ? 'linear-gradient(135deg, #0b1d3a 0%, #781d42 50%, #f97316 100%)'
                    : 'linear-gradient(135deg, #030C14 0%, #0c2338 60%, #1e3a5f 100%)',
                }}
              >
                <div className="absolute top-1 left-1 flex items-center gap-1">
                  <span className="text-[9px] font-bold px-1 rounded bg-black/60 text-white font-mono">
                    KF-{i + 1}
                  </span>
                  <span className={cn(
                    'text-[8px] font-mono px-1 rounded font-bold flex items-center gap-0.5',
                    kf.modality === 'THERMAL' ? 'bg-amber-500/80 text-black' : 'bg-cyan-600/80 text-white'
                  )}>
                    {kf.modality === 'THERMAL' && <Flame className="w-2 h-2" />}
                    {kf.modality}
                  </span>
                </div>

                <span className="text-[10px] font-mono text-white/50 group-hover:text-white transition-colors">
                  T+{kf.timeSec}s
                </span>

                <div className="absolute bottom-1 right-1 text-[8px] font-mono bg-black/70 text-emerald-400 px-1 rounded">
                  {(kf.confidence * 100).toFixed(0)}%
                </div>
              </div>

              {/* Reason Pill */}
              <span
                className={cn(
                  'text-[8px] font-mono font-bold px-1 py-0.5 rounded border truncate block w-full text-center',
                  REASON_COLORS[kf.reason] ?? 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30'
                )}
              >
                {kf.reason.replace(/_/g, ' ')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Keyframe Detail Dossier Box */}
      {activeKf && (
        <div
          className="rounded-lg border p-2.5 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in"
          style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-[var(--sea-accent)]">
                Keyframe {activeKf.id.toUpperCase()} (T+{activeKf.timeSec}s · {activeKf.timestampIso})
              </span>
              <span
                className={cn(
                  'text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border',
                  REASON_COLORS[activeKf.reason]
                )}
              >
                {activeKf.reason.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-[11px] opacity-80 font-medium">
              Extraction Rationale: {activeKf.reasonLabel}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => handleCopySha(activeKf.sha256)}
              className="flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-mono transition-colors hover:bg-[var(--surface-hover)]"
              style={{ borderColor: 'var(--line)' }}
              title="Copy court-admissible SHA-256 evidence checksum"
            >
              {copiedSha === activeKf.sha256 ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-600 font-bold">Copied SHA-256</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 opacity-60" />
                  <span>SHA: {activeKf.sha256.slice(0, 10)}...</span>
                </>
              )}
            </button>

            {onSelectKeyframe && (
              <button
                type="button"
                onClick={() => onSelectKeyframe(activeKf.timeSec, activeKf)}
                className="btn-navy text-[10px] px-2.5 py-1 rounded flex items-center gap-1 font-mono"
              >
                <span>Jump Video</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

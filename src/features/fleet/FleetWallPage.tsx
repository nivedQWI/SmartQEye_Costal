// ============================================================
// SmartQEye Coastal — Fleet Wall (20 Feeds)
// 20-Feed Multiview Surveillance Matrix with Cognitive Frame Selection (CFS)
// ============================================================

import { useState } from 'react';
import { Monitor, Cpu, Radio, Shield, Zap, RefreshCw, Eye } from 'lucide-react';
import { useHealthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { FeedState, Modality } from '@/types';

interface WallFeed {
  id: string;
  name: string;
  uavCode: string;
  modality: Modality;
  state: FeedState;
  fpsCurrent: number;
  cfsRate: number; // Cognitive Frame Selection rate
  cfsSavingsPct: number;
  zone: string;
  batteryPct: number;
  altitudeM: number;
}

export default function FleetWallPage() {
  const [filterModality, setFilterModality] = useState<'ALL' | 'RGB' | 'THERMAL'>('ALL');
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);

  // Generate 20 operational drone feeds
  const wallFeeds: WallFeed[] = Array.from({ length: 20 }, (_, i) => {
    const uavNum = (i % 6) + 1;
    const isThermal = i % 2 === 1;
    const zones = [
      'Vizhinjam Inner Approach', 'Vizhinjam Outer Harbour', 'Kovalam Beach North',
      'Lighthouse Beach', 'Poovar Estuary Watch', 'Shanghumugham Shoreline',
      'Vizhinjam Port Breakwater', 'Adimalathura Fishing Zone', 'Chowara Cliffs',
      'Muthalapozhi Approach'
    ];
    const states: FeedState[] = ['LIVE', 'LIVE', 'LIVE', 'LIVE', 'LIVE', 'LIVE', 'EDGE_SYNC_LAG', 'BUFFERING'];
    const state = i === 15 ? 'EDGE_SYNC_LAG' : i === 18 ? 'BUFFERING' : 'LIVE';
    const cfsActive = i % 3 === 0;

    return {
      id: `wall-feed-${String(i + 1).padStart(2, '0')}`,
      name: `Sentry Sector ${String.fromCharCode(65 + (i % 8))}-${Math.floor(i / 8) + 1}`,
      uavCode: `UAV-KL-0${uavNum}`,
      modality: isThermal ? 'THERMAL' : 'RGB',
      state,
      fpsCurrent: state === 'LIVE' ? (cfsActive ? 8 : 25) : 0,
      cfsRate: cfsActive ? 8 : 25,
      cfsSavingsPct: cfsActive ? 68 : 0,
      zone: zones[i % zones.length],
      batteryPct: Math.max(18, 92 - (i * 3.5)),
      altitudeM: 110 + (i * 4),
    };
  });

  const filtered = wallFeeds.filter(f => {
    if (filterModality === 'ALL') return true;
    return f.modality === filterModality;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--surface)] text-[var(--sea-600)] border" style={{ borderColor: 'var(--line)' }}>
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold">20-Feed Coastal Fleet Wall</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                CFS COGNITIVE SELECTION ACTIVE
              </span>
            </div>
            <p className="text-xs opacity-60">
              Synchronised multi-stream tactical video surveillance · Central GPU Node A/B inference pipeline
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded-lg border text-xs font-medium" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            {(['ALL', 'RGB', 'THERMAL'] as const).map(m => (
              <button
                key={m}
                onClick={() => setFilterModality(m)}
                className={cn(
                  'px-3 py-1 rounded-md transition-all text-xs font-mono',
                  filterModality === m
                    ? 'bg-[var(--sea-600)] text-white shadow-xs font-bold'
                    : 'opacity-70 hover:opacity-100 hover:bg-[var(--surface-hover)]'
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono opacity-70 px-3 py-1 rounded border" style={{ borderColor: 'var(--line)' }}>
            Feeds: <span className="font-bold text-[var(--sea-600)]">{filtered.length}</span>/20 Online
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(feed => (
            <div
              key={feed.id}
              onClick={() => setSelectedFeedId(feed.id)}
              className={cn(
                'group relative rounded-xl border overflow-hidden flex flex-col transition-all cursor-pointer',
                selectedFeedId === feed.id ? 'ring-2 ring-[var(--sea-600)] shadow-lg' : 'hover:border-[var(--sea-400)]'
              )}
              style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
            >
              {/* Video Simulated Canvas */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden flex items-center justify-center">
                {/* Simulated sea backdrop */}
                <div
                  className={cn(
                    'absolute inset-0 opacity-40',
                    feed.modality === 'THERMAL'
                      ? 'bg-gradient-to-br from-indigo-950 via-purple-900 to-amber-950'
                      : 'bg-gradient-to-br from-teal-950 via-cyan-950 to-slate-900'
                  )}
                />

                {/* Grid reticle overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
                <div className="absolute inset-x-2 top-2 flex items-center justify-between pointer-events-none text-[10px] font-mono text-white/80">
                  <span className="bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs font-bold">
                    {feed.uavCode}
                  </span>
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded backdrop-blur-xs font-bold text-[9px]',
                      feed.modality === 'THERMAL' ? 'bg-amber-500/80 text-black' : 'bg-cyan-500/80 text-black'
                    )}
                  >
                    {feed.modality}
                  </span>
                </div>

                {/* State Indicator */}
                {feed.state !== 'LIVE' ? (
                  <div className="relative z-10 flex flex-col items-center gap-1 text-amber-400 bg-black/75 px-3 py-1.5 rounded-lg border border-amber-500/30 text-[10px] font-mono">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{feed.state.replace(/_/g, ' ')}</span>
                  </div>
                ) : (
                  <div className="relative z-10 flex flex-col items-center opacity-40 group-hover:opacity-80 transition-opacity">
                    <Eye className="w-6 h-6 text-white/70" />
                    <span className="text-[9px] font-mono text-white/70 mt-1">SENTRY FEED</span>
                  </div>
                )}

                {/* Bottom telemetry overlay */}
                <div className="absolute inset-x-2 bottom-1.5 flex items-center justify-between pointer-events-none text-[9px] font-mono text-white/75">
                  <span>{feed.fpsCurrent} FPS</span>
                  <span>ALT {feed.altitudeM}m</span>
                  <span>BAT {feed.batteryPct}%</span>
                </div>
              </div>

              {/* Card Meta Footer */}
              <div className="p-2 text-xs flex flex-col gap-1 border-t" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold truncate max-w-[120px]">{feed.name}</span>
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      feed.state === 'LIVE' ? 'bg-emerald-500' : 'bg-amber-500'
                    )}
                  />
                </div>
                <div className="text-[10px] opacity-60 truncate font-mono">
                  {feed.zone}
                </div>

                {/* CFS Chip */}
                <div className="mt-1 pt-1 border-t flex items-center justify-between text-[9px] font-mono" style={{ borderColor: 'var(--line)' }}>
                  <span className="opacity-50">CFS Mode:</span>
                  {feed.cfsSavingsPct > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {feed.cfsRate} fps (-{feed.cfsSavingsPct}% VRAM)
                    </span>
                  ) : (
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                      Full 25 fps
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

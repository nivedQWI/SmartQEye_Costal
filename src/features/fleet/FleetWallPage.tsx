// ============================================================
// SmartQEye Coastal — Fleet Wall (RFP §5: ≥ 20 Concurrent Feeds)
// Virtualised Multi-Stream Grid with Compute Placement & CFS Load Bars
// ============================================================

import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Monitor, Cpu, Radio, Shield, Zap, RefreshCw, Eye,
  Pin, PinOff, Filter, Maximize2, AlertTriangle, Layers,
  Compass, Activity, HardDrive, CheckCircle2, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeedState, Modality, AttentionLevel, Severity } from '@/types';

export type ComputePlacement = 'CENTRAL_GPU' | 'LOCAL_EDGE' | 'COOP_WORKER' | 'POST_MISSION';

export interface FleetFeedItem {
  id: string;
  name: string;
  uavCode: string;
  missionCode: string;
  missionTitle: string;
  modality: Modality;
  state: FeedState;
  placement: ComputePlacement;
  placementLabel: string;
  cfsMode: 'FULL' | 'LIGHT' | 'SKIP';
  cfsFps: number;
  cfsSavingsPct: number;
  cfsReason: string;
  zoneCode: string;
  zoneName: string;
  attention: AttentionLevel;
  activeAlertCount: number;
  highestSeverity?: Severity;
  batteryPct: number;
  altitudeM: number;
  groundSpeedKnots: number;
  bitrateMbps: number;
  packetLossPct: number;
  fpsCurrent: number;
  videoOffsetSec: number;
}

const ZONES_LIST = [
  { code: 'Z-01', name: 'Vizhinjam Port Security' },
  { code: 'Z-02', name: 'Kovalam Beach Monitored' },
  { code: 'Z-03', name: 'Shanghumugham Shoreline' },
  { code: 'Z-04', name: 'Poovar Estuary Watch' },
  { code: 'Z-05', name: 'Adimalathura Fishing' },
  { code: 'Z-06', name: 'Chowara Cliff Buffer' },
  { code: 'Z-07', name: 'Muthalapozhi Approach' },
  { code: 'Z-08', name: 'Neendakara Outer Harbor' },
];

export default function FleetWallPage() {
  const navigate = useNavigate();
  const parentRef = useRef<HTMLDivElement>(null);

  // Filter States
  const [targetFeedCount, setTargetFeedCount] = useState<20 | 24 | 32>(20);
  const [filterState, setFilterState] = useState<string>('ALL');
  const [filterModality, setFilterModality] = useState<string>('ALL');
  const [filterPlacement, setFilterPlacement] = useState<string>('ALL');
  const [filterZone, setFilterZone] = useState<string>('ALL');
  const [pinnedIds, setPinnedIds] = useState<string[]>([
    'feed-01',
    'feed-02',
    'feed-03',
    'feed-04',
  ]);
  const [isPriorityQuadActive, setIsPriorityQuadActive] = useState<boolean>(true);

  // Generate 32 feeds for scalable headroom
  const allFeeds: FleetFeedItem[] = useMemo(() => {
    return Array.from({ length: 32 }, (_, i) => {
      const uavNum = (i % 8) + 1;
      const isThermal = i % 2 === 1;
      const zone = ZONES_LIST[i % ZONES_LIST.length];

      // Realistic state distribution
      const state: FeedState =
        i === 15 ? 'EDGE_SYNC_LAG' :
        i === 18 ? 'BUFFERING' :
        i === 22 ? 'RECORDED' :
        i === 28 ? 'NO_SIGNAL' : 'LIVE';

      // Placement distribution
      const placement: ComputePlacement =
        i % 4 === 0 ? 'LOCAL_EDGE' :
        i % 4 === 1 ? 'COOP_WORKER' :
        i === 22 ? 'POST_MISSION' : 'CENTRAL_GPU';

      const placementLabel =
        placement === 'CENTRAL_GPU' ? 'Central GPU Node A' :
        placement === 'LOCAL_EDGE' ? 'Station Edge Laptop' :
        placement === 'COOP_WORKER' ? 'Co-op Edge Pool' : 'Post-Mission Batch';

      // CFS mode
      const cfsMode: 'FULL' | 'LIGHT' | 'SKIP' =
        i === 0 || i === 1 || i === 7 ? 'FULL' :
        i % 3 === 0 ? 'SKIP' : 'LIGHT';

      const cfsFps = cfsMode === 'FULL' ? 25 : cfsMode === 'LIGHT' ? 8 : 1;
      const cfsSavingsPct = cfsMode === 'FULL' ? 0 : cfsMode === 'LIGHT' ? 68 : 96;
      const cfsReason =
        cfsMode === 'FULL' ? 'TARGET_ACTIVE' :
        cfsMode === 'LIGHT' ? 'BACKGROUND_SURVEILLANCE' : 'IDLE_OCEAN_SURFACE';

      const activeAlertCount = i === 0 ? 2 : i === 1 ? 1 : i === 7 ? 1 : 0;
      const highestSeverity: Severity | undefined =
        i === 0 ? 'CRITICAL' :
        i === 1 ? 'HIGH' :
        i === 7 ? 'MEDIUM' : undefined;

      const attention: AttentionLevel =
        i === 0 ? 'CRITICAL' :
        i === 1 || i === 7 ? 'ATTENTION' : 'MONITOR';

      return {
        id: `feed-${String(i + 1).padStart(2, '0')}`,
        name: `Sector Sentry ${String.fromCharCode(65 + (i % 8))}-${Math.floor(i / 8) + 1}`,
        uavCode: `UAV-KL-0${uavNum}`,
        missionCode: `MSN-20261016-${String(Math.floor(i / 4) + 1).padStart(2, '0')}`,
        missionTitle: `${zone.name} Sortie`,
        modality: isThermal ? 'THERMAL' : 'RGB',
        state,
        placement,
        placementLabel,
        cfsMode,
        cfsFps,
        cfsSavingsPct,
        cfsReason,
        zoneCode: zone.code,
        zoneName: zone.name,
        attention,
        activeAlertCount,
        highestSeverity,
        batteryPct: Math.max(22, 94 - i * 2.1),
        altitudeM: 80 + (i % 6) * 12,
        groundSpeedKnots: 14 + (i % 5) * 3.2,
        bitrateMbps: state === 'LIVE' ? (isThermal ? 4.8 : 7.2) : 0,
        packetLossPct: state === 'EDGE_SYNC_LAG' ? 4.2 : 0.02,
        fpsCurrent: state === 'LIVE' ? cfsFps : 0,
        videoOffsetSec: (i * 14) % 120,
      };
    });
  }, []);

  // Filter based on selected count and filters
  const visibleFeeds = useMemo(() => {
    return allFeeds.slice(0, targetFeedCount).filter(f => {
      const matchState = filterState === 'ALL' || f.state === filterState;
      const matchModality = filterModality === 'ALL' || f.modality === filterModality;
      const matchPlacement = filterPlacement === 'ALL' || f.placement === filterPlacement;
      const matchZone = filterZone === 'ALL' || f.zoneCode === filterZone;
      return matchState && matchModality && matchPlacement && matchZone;
    });
  }, [allFeeds, targetFeedCount, filterState, filterModality, filterPlacement, filterZone]);

  // Priority quad feeds
  const priorityQuadFeeds = useMemo(() => {
    return allFeeds.filter(f => pinnedIds.includes(f.id)).slice(0, 4);
  }, [allFeeds, pinnedIds]);

  function togglePin(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setPinnedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : [prev[1], prev[2], prev[3], id]
    );
  }

  // Virtualizer for the grid (group into rows of 4 columns)
  const columnsCount = 4;
  const gridRows = useMemo(() => {
    const rows: FleetFeedItem[][] = [];
    for (let i = 0; i < visibleFeeds.length; i += columnsCount) {
      rows.push(visibleFeeds.slice(i, i + columnsCount));
    }
    return rows;
  }, [visibleFeeds]);

  const rowVirtualizer = useVirtualizer({
    count: gridRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 240, // Height of each row card in px
    overscan: 2,
  });

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* ── Top Header ── */}
      <div
        className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--surface)] text-[var(--sea-600)] border" style={{ borderColor: 'var(--line)' }}>
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold">Tactical Fleet Wall</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                {visibleFeeds.length} CONCURRENT FEEDS
              </span>
            </div>
            {/* Rule 1 Compliance Caption */}
            <p className="text-xs font-mono opacity-60">
              20-feed operating envelope: target — to be benchmarked on approved infrastructure.
            </p>
          </div>
        </div>

        {/* Headroom Scale Buttons & Priority Quad Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded-lg border text-xs font-mono font-semibold" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <span className="px-2 text-[10px] opacity-50 uppercase">Grid Scale:</span>
            {([20, 24, 32] as const).map(count => (
              <button
                key={count}
                onClick={() => setTargetFeedCount(count)}
                className={cn(
                  'px-2.5 py-1 rounded-md transition-all cursor-pointer',
                  targetFeedCount === count
                    ? 'bg-[var(--sea-600)] text-white shadow-xs font-bold'
                    : 'opacity-70 hover:opacity-100 hover:bg-[var(--surface-hover)]'
                )}
              >
                {count} Feeds {count === 32 ? '(Headroom)' : ''}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPriorityQuadActive(prev => !prev)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
              isPriorityQuadActive
                ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                : 'hover:bg-[var(--surface-hover)] border-[var(--line)] opacity-70'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Priority Quad ({pinnedIds.length}/4)</span>
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div
        className="flex flex-wrap items-center justify-between px-6 py-2.5 border-b gap-3 flex-shrink-0 text-xs font-mono"
        style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase opacity-50 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>

          {/* State Filter */}
          <select
            value={filterState}
            onChange={e => setFilterState(e.target.value)}
            className="px-2 py-1 rounded-lg border bg-[var(--panel)] outline-none"
            style={{ borderColor: 'var(--line)' }}
          >
            <option value="ALL">All States</option>
            <option value="LIVE">LIVE</option>
            <option value="EDGE_SYNC_LAG">EDGE SYNC LAG</option>
            <option value="BUFFERING">BUFFERING</option>
            <option value="NO_SIGNAL">NO SIGNAL</option>
            <option value="RECORDED">RECORDED</option>
          </select>

          {/* Modality Filter */}
          <select
            value={filterModality}
            onChange={e => setFilterModality(e.target.value)}
            className="px-2 py-1 rounded-lg border bg-[var(--panel)] outline-none"
            style={{ borderColor: 'var(--line)' }}
          >
            <option value="ALL">All Modalities</option>
            <option value="RGB">RGB (Visible)</option>
            <option value="THERMAL">THERMAL (IR)</option>
          </select>

          {/* Compute Placement Filter */}
          <select
            value={filterPlacement}
            onChange={e => setFilterPlacement(e.target.value)}
            className="px-2 py-1 rounded-lg border bg-[var(--panel)] outline-none"
            style={{ borderColor: 'var(--line)' }}
          >
            <option value="ALL">All Compute Placements</option>
            <option value="CENTRAL_GPU">Central GPU Node</option>
            <option value="LOCAL_EDGE">Station Edge Laptop</option>
            <option value="COOP_WORKER">Co-op Edge Pool</option>
            <option value="POST_MISSION">Post-Mission Batch</option>
          </select>

          {/* Zone Filter */}
          <select
            value={filterZone}
            onChange={e => setFilterZone(e.target.value)}
            className="px-2 py-1 rounded-lg border bg-[var(--panel)] outline-none"
            style={{ borderColor: 'var(--line)' }}
          >
            <option value="ALL">All Coastal Zones</option>
            {ZONES_LIST.map(z => (
              <option key={z.code} value={z.code}>{z.code} - {z.name}</option>
            ))}
          </select>
        </div>

        <div className="opacity-60 text-[11px]">
          Showing {visibleFeeds.length} streams · Click any feed to focus into Live Monitor
        </div>
      </div>

      {/* ── Scrollable Grid Area ── */}
      <div ref={parentRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Priority Quad View (if active) */}
        {isPriorityQuadActive && priorityQuadFeeds.length > 0 && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-mono font-bold text-amber-600 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> PRIORITY QUAD MATRIX (PINNED CHANNELS)
              </span>
              <span className="text-[10px] font-mono opacity-50">High-Attention Focal Feeds</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {priorityQuadFeeds.map(feed => (
                <FeedTileCard
                  key={`pinned-${feed.id}`}
                  feed={feed}
                  isPinned={true}
                  onTogglePin={e => togglePin(feed.id, e)}
                  onFocus={() => navigate(`/live?feedId=${feed.id}`)}
                />
              ))}
            </div>

            <div className="h-px w-full my-3" style={{ background: 'var(--line)' }} />
          </div>
        )}

        {/* Virtualized Main 4-Column Grid */}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const rowItems = gridRows[virtualRow.index] || [];
            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-2 pb-3"
              >
                {rowItems.map(feed => (
                  <FeedTileCard
                    key={feed.id}
                    feed={feed}
                    isPinned={pinnedIds.includes(feed.id)}
                    onTogglePin={e => togglePin(feed.id, e)}
                    onFocus={() => navigate(`/live?feedId=${feed.id}`)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Individual Feed Tile Component ─────────────────────────────

function FeedTileCard({
  feed,
  isPinned,
  onTogglePin,
  onFocus,
}: {
  feed: FleetFeedItem;
  isPinned: boolean;
  onTogglePin: (e: React.MouseEvent) => void;
  onFocus: () => void;
}) {
  return (
    <div
      onClick={onFocus}
      className="rounded-xl border overflow-hidden transition-all hover:shadow-lg cursor-pointer group flex flex-col justify-between"
      style={{ background: 'var(--panel)', borderColor: 'var(--line)', minHeight: '225px' }}
    >
      {/* Thumbnail + Video Simulation Canvas */}
      <div className="relative h-28 bg-black overflow-hidden flex items-center justify-center">
        {/* Simulated canvas background with time-offset pattern */}
        <div
          className="absolute inset-0 opacity-70 bg-cover bg-center"
          style={{
            backgroundImage: "url('/coastal_harbor_bg.png')",
            filter: feed.modality === 'THERMAL' ? 'hue-rotate(180deg) invert(1) contrast(1.4)' : 'none',
          }}
        />

        {/* Scanline & Reticle Overlay */}
        <div className="absolute inset-0 pointer-events-none border border-cyan-500/20" />
        <div className="absolute top-2 left-2 text-[10px] font-mono font-bold text-white bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{feed.uavCode}</span>
        </div>

        {/* Top-Right Modality & Pin */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[9px] font-mono font-bold',
              feed.modality === 'THERMAL'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
            )}
          >
            {feed.modality}
          </span>
          <button
            onClick={onTogglePin}
            className="p-1 rounded bg-black/60 text-white/80 hover:text-white transition-colors"
            title={isPinned ? 'Unpin feed' : 'Pin to Priority Quad'}
          >
            {isPinned ? <PinOff className="w-3 h-3 text-amber-400" /> : <Pin className="w-3 h-3" />}
          </button>
        </div>

        {/* State Chip in Center if degraded */}
        {feed.state !== 'LIVE' && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-center p-2">
            <span
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-mono font-bold',
                feed.state === 'EDGE_SYNC_LAG' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                feed.state === 'BUFFERING' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                'bg-red-500/20 text-red-400 border border-red-500/40'
              )}
            >
              {feed.state.replace(/_/g, ' ')}
            </span>
          </div>
        )}

        {/* Active Alert Badge */}
        {feed.activeAlertCount > 0 && (
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-red-600/90 text-white font-mono text-[9px] font-bold flex items-center gap-1 shadow-sm">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>{feed.activeAlertCount} ALERT</span>
          </div>
        )}

        {/* Live FPS */}
        <div className="absolute bottom-2 right-2 font-mono text-[9px] text-white/80 bg-black/50 px-1 rounded">
          {feed.fpsCurrent.toFixed(1)} FPS
        </div>
      </div>

      {/* Feed Information & CFS Load Bar */}
      <div className="p-3 space-y-2 text-xs flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="font-bold truncate text-xs group-hover:text-[var(--sea-600)] transition-colors">
              {feed.name}
            </span>
            <span className="font-mono text-[10px] opacity-50">{feed.zoneCode}</span>
          </div>
          <div className="text-[10px] font-mono opacity-60 truncate">{feed.missionTitle}</div>
        </div>

        {/* Compute Placement Badge */}
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="opacity-50">COMPUTE:</span>
          <span
            className={cn(
              'px-1.5 py-0.2 rounded border font-semibold',
              feed.placement === 'CENTRAL_GPU' ? 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' :
              feed.placement === 'LOCAL_EDGE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
              'bg-purple-500/10 text-purple-600 border-purple-500/20'
            )}
          >
            {feed.placementLabel}
          </span>
        </div>

        {/* CFS Cognitive Frame Selection Load Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="opacity-50">CFS MODE:</span>
            <span
              className={cn(
                'font-bold',
                feed.cfsMode === 'FULL' ? 'text-red-500' :
                feed.cfsMode === 'LIGHT' ? 'text-emerald-500' : 'text-blue-500'
              )}
            >
              {feed.cfsMode} ({feed.cfsFps} FPS)
            </span>
          </div>
          <div className="w-full bg-[var(--line)] h-1.5 rounded-full overflow-hidden flex">
            <div
              className={cn(
                'h-full transition-all duration-300',
                feed.cfsMode === 'FULL' ? 'bg-red-500 w-full' :
                feed.cfsMode === 'LIGHT' ? 'bg-emerald-500 w-1/3' : 'bg-blue-500 w-1/12'
              )}
            />
          </div>
        </div>

        {/* Mini stats footer */}
        <div className="pt-2 border-t grid grid-cols-3 gap-1 text-[10px] font-mono opacity-65 text-center" style={{ borderColor: 'var(--line)' }}>
          <div>{feed.batteryPct.toFixed(0)}% BAT</div>
          <div>{feed.altitudeM}m ALT</div>
          <div>{feed.bitrateMbps} Mbps</div>
        </div>
      </div>
    </div>
  );
}

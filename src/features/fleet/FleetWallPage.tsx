// ============================================================
// SmartQEye Coastal — Fleet Wall (RFP §5: ≥ 20 Concurrent Feeds)
// Virtualised Multi-Stream Grid with Compute Placement & CFS Load Bars
// ============================================================

import { useState, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Monitor, Pin, PinOff, Filter, AlertTriangle, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CoastalVideoPlayer } from '@/components/CoastalVideoPlayer';
import { useFeedStore } from '@/lib/store';
import { getFeedPlace, COASTAL_ZONES } from '@/lib/feedLocations';
import type { FeedState, Modality, AttentionLevel, Severity } from '@/types';

export type ComputePlacement = 'CENTRAL_GPU' | 'LOCAL_EDGE' | 'COOP_WORKER' | 'POST_MISSION';

export interface FleetFeedItem {
  id: string;
  name: string;
  uavCode: string;
  missionCode: string;
  missionTitle: string;
  modality: Modality;
  videoSrc?: string;
  videoName?: string;
  state: FeedState;
  placement: ComputePlacement;
  placementLabel: string;
  cfsMode: 'FULL' | 'LIGHT' | 'SKIP';
  cfsFps: number;
  cfsSavingsPct: number;
  cfsReason: string;
  zoneCode: string;
  zoneName: string;
  zoneGroup: string;
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

// Max simultaneous <video> decoders on the wall. Playing all 20 feeds at once
// saturates the browser's decoder/GPU and freezes the page, so only this many
// stream; the rest are shown as OFFLINE (paused to save bandwidth).
const MAX_STREAMS = 6;

/** Pick up to `max` LIVE feeds to stream, spreading the picks across coastal zones. */
function pickStreamingIds(feeds: FleetFeedItem[], max: number): Set<string> {
  const byZone = new Map<string, FleetFeedItem[]>();
  feeds.filter(f => f.state === 'LIVE').forEach(f => {
    byZone.set(f.zoneGroup, [...(byZone.get(f.zoneGroup) ?? []), f]);
  });
  const queues = [...byZone.values()];
  const picked = new Set<string>();
  while (picked.size < max && queues.some(q => q.length)) {
    for (const q of queues) {
      const next = q.shift();
      if (next && picked.size < max) picked.add(next.id);
    }
  }
  return picked;
}

export default function FleetWallPage() {
  const navigate = useNavigate();
  const storeFeeds = useFeedStore(s => s.feeds);

  // Filter States
  const [filterState, setFilterState] = useState<string>('ALL');
  const [filterModality, setFilterModality] = useState<string>('ALL');
  const [filterZone, setFilterZone] = useState<string>('ALL');
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [isPriorityQuadActive, setIsPriorityQuadActive] = useState<boolean>(false);

  // The fleet wall shows the same 20 drone feeds as Live Monitor (so clicking a
  // tile can highlight that exact feed there).
  const allFeeds: FleetFeedItem[] = useMemo(() => {
    return storeFeeds.slice(0, 20).map((liveFeed, i) => {
      const place = getFeedPlace(liveFeed);
      const state: FeedState = liveFeed.state;

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
        id: liveFeed.id,
        name: liveFeed.label,
        uavCode: liveFeed.uavCode,
        missionCode: liveFeed.missionCode ?? '',
        missionTitle: `${place.name}, ${place.district}`,
        modality: liveFeed.modality,
        videoSrc: liveFeed.videoSrc,
        videoName: liveFeed.videoSrc?.split('/').pop(),
        state,
        placement,
        placementLabel,
        cfsMode,
        cfsFps,
        cfsSavingsPct,
        cfsReason,
        zoneCode: place.key.toUpperCase().slice(0, 4),
        zoneName: place.name,
        zoneGroup: place.zone,
        attention,
        activeAlertCount,
        highestSeverity,
        batteryPct: Math.max(22, 94 - i * 2.1),
        altitudeM: 80 + (i % 6) * 12,
        groundSpeedKnots: 14 + (i % 5) * 3.2,
        bitrateMbps: state === 'LIVE' ? (liveFeed.modality === 'THERMAL' ? 4.8 : 7.2) : 0,
        packetLossPct: state === 'EDGE_SYNC_LAG' ? 4.2 : 0.02,
        fpsCurrent: state === 'LIVE' ? cfsFps : 0,
        videoOffsetSec: (i * 14) % 120,
      };
    });
  }, [storeFeeds]);

  // Apply filters (zone = coastal zone / port group)
  const visibleFeeds = useMemo(() => {
    return allFeeds.filter(f => {
      const matchState = filterState === 'ALL' || f.state === filterState;
      const matchModality = filterModality === 'ALL' || f.modality === filterModality;
      const matchZone = filterZone === 'ALL' || f.zoneGroup === filterZone;
      return matchState && matchModality && matchZone;
    });
  }, [allFeeds, filterState, filterModality, filterZone]);

  // Priority quad feeds
  const priorityQuadFeeds = useMemo(() => {
    return allFeeds.filter(f => pinnedIds.includes(f.id)).slice(0, 4);
  }, [allFeeds, pinnedIds]);

  // Which feeds actually stream video (max MAX_STREAMS across the whole page).
  // Pinned quad feeds get priority when the quad is shown.
  const streamingIds = useMemo(() => {
    const quad = isPriorityQuadActive ? priorityQuadFeeds.filter(f => f.state === 'LIVE') : [];
    const ids = new Set(quad.slice(0, MAX_STREAMS).map(f => f.id));
    const rest = pickStreamingIds(visibleFeeds.filter(f => !ids.has(f.id)), MAX_STREAMS - ids.size);
    rest.forEach(id => ids.add(id));
    return ids;
  }, [visibleFeeds, priorityQuadFeeds, isPriorityQuadActive]);

  const zoneCounts = useMemo(() => {
    const m = new Map<string, number>();
    allFeeds.forEach(f => m.set(f.zoneGroup, (m.get(f.zoneGroup) ?? 0) + 1));
    return m;
  }, [allFeeds]);

  function openInLiveMonitor(feedId: string) {
    navigate(`/live?feed=${encodeURIComponent(feedId)}&from=fleet`);
  }

  function togglePin(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setPinnedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : [prev[1], prev[2], prev[3], id]
    );
  }

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
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                {streamingIds.size} STREAMING
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-500/10 border border-slate-500/20" style={{ color: 'var(--text-muted)' }}>
                {visibleFeeds.length - [...streamingIds].filter(id => visibleFeeds.some(f => f.id === id)).length} OFFLINE
              </span>
            </div>
            <p className="text-xs font-mono opacity-60">
              {filterZone === 'ALL' ? 'All coastal zones' : filterZone} · up to {MAX_STREAMS} live streams at a time to keep the wall responsive
            </p>
          </div>
        </div>

        {/* Priority Quad Toggle */}
        <div className="flex items-center gap-2">
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
            <option value="ALL">All Modalities (All Feeds)</option>
            <option value="RGB">RGB (Visible Light)</option>
            <option value="THERMAL">THERMAL (FLIR Ironbow)</option>
            <option value="NIGHT_VISION">NIGHT VISION (NVG Green)</option>
          </select>

          {/* Coastal Zone / Port Filter */}
          <select
            value={filterZone}
            onChange={e => setFilterZone(e.target.value)}
            className="px-2 py-1 rounded-lg border bg-[var(--panel)] outline-none"
            style={{ borderColor: 'var(--line)' }}
            aria-label="Coastal zone"
          >
            <option value="ALL">All Coastal Zones ({allFeeds.length})</option>
            {COASTAL_ZONES.map(z => (
              <option key={z} value={z}>{z} ({zoneCounts.get(z) ?? 0})</option>
            ))}
          </select>
        </div>

        <div className="opacity-60 text-[11px]">
          Showing {visibleFeeds.length} feeds · Click any feed to open it in Live Monitor
        </div>
      </div>

      {/* ── Scrollable Grid Area ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  isStreaming={streamingIds.has(feed.id)}
                  onTogglePin={e => togglePin(feed.id, e)}
                  onFocus={() => openInLiveMonitor(feed.id)}
                />
              ))}
            </div>

            <div className="h-px w-full my-3" style={{ background: 'var(--line)' }} />
          </div>
        )}

        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-2 pb-6">
          {visibleFeeds.length === 0 && (
            <div className="col-span-full text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>
              No feeds match the selected filters.
            </div>
          )}
          {visibleFeeds.map(feed => {
            const shownInQuad = isPriorityQuadActive && priorityQuadFeeds.some(p => p.id === feed.id);
            return (
              <FeedTileCard
                key={feed.id}
                feed={feed}
                isPinned={pinnedIds.includes(feed.id)}
                // Avoid decoding the same video twice when it's already playing in the quad
                isStreaming={!shownInQuad && streamingIds.has(feed.id)}
                offlineNote={shownInQuad ? 'Playing in Priority Quad' : undefined}
                onTogglePin={e => togglePin(feed.id, e)}
                onFocus={() => openInLiveMonitor(feed.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Individual Feed Tile Component ─────────────────────────────

const FeedTileCard = memo(function FeedTileCard({
  feed,
  isPinned,
  isStreaming,
  offlineNote,
  onTogglePin,
  onFocus,
}: {
  feed: FleetFeedItem;
  isPinned: boolean;
  isStreaming: boolean;
  offlineNote?: string;
  onTogglePin: (e: React.MouseEvent) => void;
  onFocus: () => void;
}) {
  const isOffline = feed.state === 'LIVE' && !isStreaming;
  return (
    <div
      onClick={onFocus}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFocus(); } }}
      role="button"
      tabIndex={0}
      title="Open this feed in Live Monitor"
      className="rounded-xl border overflow-hidden transition-all hover:shadow-lg hover:border-[var(--sea-400)] focus-visible:outline-2 focus-visible:outline-sky-500 cursor-pointer group flex flex-col justify-between"
      style={{ background: 'var(--panel)', borderColor: 'var(--line)', minHeight: '225px' }}
    >
      {/* Real-time Coastal Video Canvas */}
      <div className="relative h-28 bg-black overflow-hidden flex items-center justify-center">
        {feed.state === 'NO_SIGNAL' ? (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center p-2 z-10">
            <span className="text-red-400 font-mono text-xs font-bold mb-0.5">NO SIGNAL</span>
            <span className="text-[10px] font-mono text-white/50">{feed.uavCode}</span>
          </div>
        ) : !isStreaming && feed.state !== 'LIVE' ? (
          // Degraded states (buffering / sync lag / recorded) get their own chip overlay below
          <div className="absolute inset-0 bg-[#0b1620]" />
        ) : !isStreaming ? (
          <div className="absolute inset-0 bg-[#0b1620] flex flex-col items-center justify-center text-center p-2">
            <span className="text-slate-300 font-mono text-xs font-bold mb-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> {offlineNote ? 'PINNED' : 'OFFLINE'}
            </span>
            <span className="text-[10px] font-mono text-white/50">
              {offlineNote ?? 'Stream paused · click to view live'}
            </span>
          </div>
        ) : (
          <CoastalVideoPlayer
            src={feed.videoSrc || '/videos/RGB_1.mp4'}
            modality={feed.modality}
            autoPlay={true}
            muted={true}
            loop={true}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        )}

        {/* Scanline & Reticle Overlay */}
        <div className="absolute inset-0 pointer-events-none border border-cyan-500/20" />
        <div className="absolute top-2 left-2 text-[10px] font-mono font-bold text-white bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs flex items-center gap-1 z-10">
          <span className={cn('w-1.5 h-1.5 rounded-full', isOffline ? 'bg-slate-500' : 'bg-emerald-400 animate-pulse')} />
          <span>{feed.uavCode}</span>
        </div>

        {/* Top-Right Modality & Pin */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[9px] font-mono font-bold',
              feed.modality === 'THERMAL'
                ? 'bg-orange-950/80 text-orange-300 border border-orange-500/40'
                : feed.modality === 'NIGHT_VISION'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
            )}
          >
            {feed.modality === 'NIGHT_VISION' ? 'NVG' : feed.modality}
          </span>
          <button
            onClick={onTogglePin}
            className="p-1 rounded bg-black/60 text-white/80 hover:text-white transition-colors cursor-pointer"
            title={isPinned ? 'Unpin feed' : 'Pin to Priority Quad'}
          >
            {isPinned ? <PinOff className="w-3 h-3 text-amber-400" /> : <Pin className="w-3 h-3" />}
          </button>
        </div>

        {/* State Chip in Center if degraded */}
        {feed.state !== 'LIVE' && feed.state !== 'NO_SIGNAL' && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-center p-2 z-10">
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
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-red-600/90 text-white font-mono text-[9px] font-bold flex items-center gap-1 shadow-sm z-10">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>{feed.activeAlertCount} ALERT</span>
          </div>
        )}

        {/* Video File Name & Live FPS */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 z-10">
          {feed.videoName && (
            <span className="font-mono text-[9px] text-white/80 bg-black/60 px-1 py-0.5 rounded backdrop-blur-xs">
              {feed.videoName}
            </span>
          )}
          <span className="font-mono text-[9px] text-white/80 bg-black/50 px-1 py-0.5 rounded">
            {(isOffline ? 0 : feed.fpsCurrent).toFixed(1)} FPS
          </span>
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
          <div>{isOffline ? 0 : feed.bitrateMbps} Mbps</div>
        </div>
      </div>
    </div>
  );
});

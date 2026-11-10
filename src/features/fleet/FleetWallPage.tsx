// ============================================================
// SmartQEye Coastal — Tactical Fleet Wall & Stream Management
// Unified operational multi-feed overview displaying all ingested
// RTSP, RTMP, HLS, and MP4 video streams with Operator Termination
// ============================================================

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Monitor, Plus, Square, Play, Trash2, Filter, Layers, Maximize2,
  Radio, Video, ShieldAlert, RefreshCw, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CoastalVideoPlayer } from '@/components/CoastalVideoPlayer';
import { AddStreamModal } from '@/components/AddStreamModal';
import { useFeedStore } from '@/lib/store';
import { getFeedPlace } from '@/lib/feedLocations';
import type { Feed, FeedState } from '@/types';

export default function FleetWallPage() {
  const navigate = useNavigate();
  const { feeds, terminateFeed, resumeFeed, removeFeed, restoreDefaultFeeds } = useFeedStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterModality, setFilterModality] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [gridColumns, setGridColumns] = useState<'auto' | '1' | '2' | '3' | '4'>('auto');

  // Filter feeds based on operator selection
  const filteredFeeds = useMemo(() => {
    return feeds.filter(feed => {
      if (filterModality !== 'ALL' && feed.modality !== filterModality) return false;
      if (filterStatus === 'LIVE' && feed.state !== 'LIVE') return false;
      if (filterStatus === 'TERMINATED' && feed.state !== 'TERMINATED') return false;
      return true;
    });
  }, [feeds, filterModality, filterStatus]);

  const activeLiveCount = feeds.filter(f => f.state === 'LIVE').length;
  const terminatedCount = feeds.filter(f => f.state === 'TERMINATED').length;

  // Determine grid CSS
  const gridClass = useMemo(() => {
    if (gridColumns === '1') return 'grid-cols-1';
    if (gridColumns === '2') return 'grid-cols-1 md:grid-cols-2';
    if (gridColumns === '3') return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    if (gridColumns === '4') return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

    // Auto layout based on feed count
    const count = filteredFeeds.length;
    if (count <= 1) return 'grid-cols-1';
    if (count <= 4) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 9) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
  }, [gridColumns, filteredFeeds.length]);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* ── Top Header ── */}
      <div
        className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0 flex-wrap gap-3"
        style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold text-white">Tactical Fleet Wall</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {activeLiveCount} ACTIVE
              </span>
              {terminatedCount > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
                  <Square className="w-2.5 h-2.5 fill-red-400" />
                  {terminatedCount} TERMINATED
                </span>
              )}
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-500/10 border border-slate-500/20 text-slate-300">
                TOTAL: {feeds.length}
              </span>
            </div>
            <p className="text-xs font-mono opacity-60">
              Kerala Police Coastal Drone & Camera Ingestion Grid · All Ingested Streams Displayed Simultaneously
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Add Stream Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Video Stream / RTSP</span>
          </button>

          {/* Reset to Default */}
          <button
            onClick={restoreDefaultFeeds}
            title="Reset to default demonstration fleet"
            className="p-2 rounded-lg border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Filter & Layout Bar ── */}
      <div
        className="flex flex-wrap items-center justify-between px-6 py-2 border-b gap-3 flex-shrink-0 text-xs font-mono"
        style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase opacity-50 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>

          {/* Status Filter */}
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            {['ALL', 'LIVE', 'TERMINATED'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-2.5 py-1 transition-colors cursor-pointer',
                  filterStatus === status ? 'bg-sky-600 text-white font-bold' : 'bg-black/30 opacity-70 hover:opacity-100'
                )}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Modality Filter */}
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            {['ALL', 'RGB', 'THERMAL', 'NIGHT_VISION'].map(mod => (
              <button
                key={mod}
                onClick={() => setFilterModality(mod)}
                className={cn(
                  'px-2.5 py-1 transition-colors cursor-pointer',
                  filterModality === mod ? 'bg-sky-600 text-white font-bold' : 'bg-black/30 opacity-70 hover:opacity-100'
                )}
              >
                {mod === 'NIGHT_VISION' ? 'NVG' : mod}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Layout Switcher */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase opacity-50 flex items-center gap-1">
            <Layers className="w-3 h-3" /> Layout:
          </span>
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            {[
              { id: 'auto', label: 'AUTO' },
              { id: '1', label: '1x1' },
              { id: '2', label: '2x2' },
              { id: '3', label: '3x3' },
              { id: '4', label: '4x4' },
            ].map(l => (
              <button
                key={l.id}
                onClick={() => setGridColumns(l.id as any)}
                className={cn(
                  'px-2 py-1 text-[11px] transition-colors cursor-pointer',
                  gridColumns === l.id ? 'bg-sky-600 text-white font-bold' : 'bg-black/30 opacity-70 hover:opacity-100'
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Multi-Feed Video Grid ── */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredFeeds.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <Video className="w-12 h-12 text-slate-500 mb-3 opacity-50" />
            <h3 className="font-serif text-base font-bold text-slate-300">No Video Feeds Ingested</h3>
            <p className="text-xs font-mono text-slate-500 max-w-sm mt-1 mb-4">
              Click below to provide an RTSP link, RTMP URL, or MP4 video to start streaming live.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Video Stream</span>
            </button>
          </div>
        ) : (
          <div className={cn('grid gap-4', gridClass)}>
            {filteredFeeds.map(feed => {
              const place = getFeedPlace(feed);
              const isTerminated = feed.state === 'TERMINATED' || feed.isTerminated;

              return (
                <div
                  key={feed.id}
                  className="rounded-2xl border overflow-hidden flex flex-col transition-all shadow-md group hover:border-sky-500/50"
                  style={{
                    background: '#040d16',
                    borderColor: isTerminated ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.25)',
                  }}
                >
                  {/* Tile Header Bar */}
                  <div
                    className="flex items-center justify-between px-3 py-2 border-b text-xs flex-shrink-0"
                    style={{ background: 'rgba(9, 23, 36, 0.95)', borderColor: 'var(--line)' }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-sky-400 text-xs">
                        {feed.uavCode}
                      </span>
                      <span className="font-medium text-slate-200 text-xs truncate max-w-[130px]">
                        {feed.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* State Pill */}
                      {isTerminated ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-950/80 text-red-300 border border-red-500/40">
                          TERMINATED
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          LIVE
                        </span>
                      )}

                      {/* Protocol Badge */}
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-sky-950/80 text-sky-300 border border-sky-500/30">
                        {feed.streamType || (feed.videoSrc?.includes('.m3u8') ? 'HLS' : 'MP4')}
                      </span>
                    </div>
                  </div>

                  {/* Video Viewport Container */}
                  <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
                    <CoastalVideoPlayer
                      src={feed.videoSrc || '/videos/RGB_1.mp4'}
                      modality={feed.modality}
                      state={feed.state}
                      isTerminated={isTerminated}
                      streamType={feed.streamType}
                      autoPlay={!isTerminated}
                      muted={true}
                      loop={true}
                      showHudOverlay={true}
                      onResume={() => resumeFeed(feed.id)}
                      className="w-full h-full"
                    />

                    {/* Quick Focus Button in top corner */}
                    <button
                      onClick={() => navigate(`/live?feed=${encodeURIComponent(feed.id)}`)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-sky-600 text-white opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer"
                      title="Focus on this feed in Live Monitor"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Tile Bottom Command & Control Bar */}
                  <div
                    className="flex items-center justify-between px-3 py-2 border-t text-xs flex-shrink-0"
                    style={{ background: 'rgba(9, 23, 36, 0.95)', borderColor: 'var(--line)' }}
                  >
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 truncate">
                      <span>{place.name}</span>
                      <span className="opacity-40">·</span>
                      <span className="text-slate-300 font-semibold">{feed.resolution || '1080p'}</span>
                      <span className="opacity-40">·</span>
                      <span>≈{feed.latencyMs || 45}ms</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Operator Stream Termination Button */}
                      {isTerminated ? (
                        <button
                          onClick={() => resumeFeed(feed.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition-colors shadow-xs"
                          title="Resume video streaming"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Resume</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => terminateFeed(feed.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-red-600/90 hover:bg-red-500 text-white cursor-pointer transition-colors shadow-xs active:scale-95"
                          title="Terminate video stream"
                        >
                          <Square className="w-3 h-3 fill-white" />
                          <span>Stop Stream</span>
                        </button>
                      )}

                      {/* Remove custom feed button */}
                      {feed.id.startsWith('feed-custom-') && (
                        <button
                          onClick={() => removeFeed(feed.id)}
                          className="p-1 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete this stream"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ingestion Modal */}
      <AddStreamModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}

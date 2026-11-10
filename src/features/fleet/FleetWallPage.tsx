// ============================================================
// SmartQEye Coastal — Tactical Fleet Wall & Stream Management
// Unified operational multi-feed overview displaying all 20 UAV
// surveillance stations (UAV-01 to UAV-20) with active RTSP, RTMP,
// HLS, and MP4 video streams, Operator Termination & Tactical NO SIGNAL fallback
// ============================================================

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Monitor, Plus, Square, Play, Trash2, Filter, Layers, Maximize2,
  Radio, Video, ShieldAlert, RefreshCw, Eye, Anchor, ChevronLeft, Link2, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CoastalVideoPlayer } from '@/components/CoastalVideoPlayer';
import { AddStreamModal } from '@/components/AddStreamModal';
import { useFeedStore, useMissionStore } from '@/lib/store';
import { resolveVideoUrl, saveUploadedVideo, removeUploadedVideo } from '@/lib/videoStorage';
import { DRONE_SLOTS_20, DroneSlotDefinition } from '@/lib/mockData';
import { getFeedPlace } from '@/lib/feedLocations';
import type { Feed, FeedState } from '@/types';

interface AttachTargetState {
  code: string;
  sector: string;
  district: string;
  modality: 'RGB' | 'THERMAL' | 'NIGHT_VISION';
  feedId?: string;
}

export default function FleetWallPage() {
  const navigate = useNavigate();
  const { feeds, terminateFeed, resumeFeed, removeFeed, attachStreamToFeed, addFeed, restoreDefaultFeeds } = useFeedStore();
  const { stopMission } = useMissionStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterModality, setFilterModality] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [gridColumns, setGridColumns] = useState<'auto' | '1' | '2' | '3' | '4' | '5'>('auto');

  // Attach Stream modal state
  const [attachTarget, setAttachTarget] = useState<AttachTargetState | null>(null);
  const [attachStreamUrl, setAttachStreamUrl] = useState('');
  const [attachStreamType, setAttachStreamType] = useState<'RTMP' | 'RTSP' | 'HLS' | 'MP4'>('RTMP');
  const [attachFileInput, setAttachFileInput] = useState<File | null>(null);

  // Auto-rehydrate any expired blob URLs from IndexedDB on page load/refresh
  useEffect(() => {
    let mounted = true;
    feeds.forEach(async feed => {
      if (feed.videoSrc && feed.videoSrc.startsWith('blob:')) {
        const recovered = await resolveVideoUrl(feed.id, feed.videoSrc);
        if (mounted && recovered && recovered !== feed.videoSrc) {
          useFeedStore.getState().updateFeed({
            ...feed,
            videoSrc: recovered,
          });
        }
      }
    });
    return () => { mounted = false; };
  }, []);

  // 20 Drone Slots Data Mapping (UAV-01 through UAV-20)
  const slots20WithData = useMemo(() => {
    const assignedFeedIds = new Set<string>();

    return DRONE_SLOTS_20.map((slot, index) => {
      // 1. Direct match by uavCode
      let feed = feeds.find(f => f.uavCode === slot.code && !assignedFeedIds.has(f.id));
      // 2. Fallback to unassigned feed
      if (!feed && feeds[index] && !assignedFeedIds.has(feeds[index].id) && !DRONE_SLOTS_20.some(s => s.code === feeds[index].uavCode)) {
        feed = feeds[index];
      }
      if (feed) {
        assignedFeedIds.add(feed.id);
      }

      const hasVideo = Boolean(feed?.videoSrc && feed.videoSrc.trim() && feed.state !== 'NO_SIGNAL');
      const isTerminated = feed ? (feed.state === 'TERMINATED' || feed.isTerminated) : false;
      const isNoSignal = !hasVideo;
      const modality = feed?.modality || slot.defaultModality;

      return {
        slot,
        feed,
        hasVideo,
        isNoSignal,
        isTerminated,
        modality,
      };
    });
  }, [feeds]);

  // Filter slots based on operator selection
  const filteredSlots = useMemo(() => {
    return slots20WithData.filter(item => {
      if (filterModality !== 'ALL' && item.modality !== filterModality) return false;
      if (filterStatus === 'LIVE' && (!item.hasVideo || item.isTerminated)) return false;
      if (filterStatus === 'TERMINATED' && !item.isTerminated) return false;
      if (filterStatus === 'NO_SIGNAL' && !item.isNoSignal) return false;
      return true;
    });
  }, [slots20WithData, filterModality, filterStatus]);

  const activeLiveCount = slots20WithData.filter(s => s.hasVideo && !s.isTerminated).length;
  const terminatedCount = slots20WithData.filter(s => s.isTerminated).length;
  const noSignalCount = slots20WithData.filter(s => s.isNoSignal).length;

  // Determine grid CSS
  const gridClass = useMemo(() => {
    if (gridColumns === '1') return 'grid-cols-1';
    if (gridColumns === '2') return 'grid-cols-1 md:grid-cols-2';
    if (gridColumns === '3') return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    if (gridColumns === '4') return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    if (gridColumns === '5') return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';

    // Auto layout for 20 drone grid
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
  }, [gridColumns]);

  async function handleAttachStreamSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!attachTarget) return;

    const targetUavCode = attachTarget.code;
    const targetFeedId = attachTarget.feedId;

    let streamUrl = '';
    if (attachStreamType === 'MP4' && attachFileInput) {
      const feedId = targetFeedId || `feed-${targetUavCode.toLowerCase()}-${Date.now()}`;
      streamUrl = await saveUploadedVideo(feedId, attachFileInput);
    } else if (attachStreamUrl.trim()) {
      streamUrl = attachStreamUrl.trim();
    }

    if (!streamUrl) return;

    if (targetFeedId) {
      attachStreamToFeed(targetFeedId, streamUrl, attachStreamType);
    } else {
      addFeed({
        uavCode: targetUavCode,
        label: `${targetUavCode} Live Feed (${attachTarget.sector})`,
        videoSrc: streamUrl,
        streamType: attachStreamType,
        modality: attachTarget.modality,
      });
    }

    setAttachTarget(null);
    setAttachStreamUrl('');
    setAttachFileInput(null);
  }

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
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-lg font-bold text-white">Tactical Fleet Wall</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {activeLiveCount} LIVE
              </span>
              {noSignalCount > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 text-amber-400" />
                  {noSignalCount} NO SIGNAL
                </span>
              )}
              {terminatedCount > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
                  <Square className="w-2.5 h-2.5 fill-red-400" />
                  {terminatedCount} TERMINATED
                </span>
              )}
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-500/10 border border-slate-500/20 text-slate-300">
                20 UAV STATIONS ACTIVE
              </span>
            </div>
            <p className="text-xs font-mono opacity-60">
              Full 20-Drone Command Grid · Live Ingested Streams with Tactical NO SIGNAL Fallback for All Fleet Units
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mission Control Navigation Button */}
          <button
            onClick={() => navigate('/missions')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 transition-all cursor-pointer"
          >
            <Anchor className="w-3.5 h-3.5" />
            <span>Mission Control</span>
          </button>

          {/* Add Stream Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Ingest RTSP / RTMP</span>
          </button>

          {/* Resync Feeds from Active Missions */}
          <button
            onClick={restoreDefaultFeeds}
            title="Resync feeds from active missions"
            className="p-2 rounded-lg border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
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
            {['ALL', 'LIVE', 'NO_SIGNAL', 'TERMINATED'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-2.5 py-1 transition-colors cursor-pointer',
                  filterStatus === status ? 'bg-sky-600 text-white font-bold' : 'bg-black/30 opacity-70 hover:opacity-100'
                )}
              >
                {status.replace('_', ' ')}
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
              { id: 'auto', label: 'AUTO (5x4)' },
              { id: '2', label: '2x2' },
              { id: '3', label: '3x3' },
              { id: '4', label: '4x4' },
              { id: '5', label: '5 Cols' },
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

      {/* ── Main Multi-Feed 20-Drone Video Grid ── */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredSlots.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="p-4 rounded-3xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-3">
              <Video className="w-12 h-12 opacity-80" />
            </div>
            <h3 className="font-serif text-lg font-bold text-slate-200">No Drones Match Current Filter</h3>
            <p className="text-xs font-mono text-slate-400 max-w-md mt-1 mb-5 leading-relaxed">
              Adjust filters or clear your selection to view all 20 tactical drone feeds.
            </p>
            <button
              onClick={() => { setFilterStatus('ALL'); setFilterModality('ALL'); }}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold cursor-pointer"
            >
              Reset Filters (Show All 20 Drones)
            </button>
          </div>
        ) : (
          <div className={cn('grid gap-3.5', gridClass)}>
            {filteredSlots.map(({ slot, feed, hasVideo, isNoSignal, isTerminated, modality }) => {
              const place = feed ? getFeedPlace(feed) : { name: slot.sector };

              return (
                <div
                  key={slot.code}
                  className="rounded-2xl border overflow-hidden flex flex-col transition-all shadow-md group hover:border-sky-500/50"
                  style={{
                    background: '#040d16',
                    borderColor: isTerminated
                      ? 'rgba(239, 68, 68, 0.4)'
                      : isNoSignal
                      ? 'rgba(245, 158, 11, 0.35)'
                      : 'rgba(56, 189, 248, 0.25)',
                  }}
                >
                  {/* Tile Header Bar */}
                  <div
                    className="flex items-center justify-between px-3 py-2 border-b text-xs flex-shrink-0"
                    style={{ background: 'rgba(9, 23, 36, 0.95)', borderColor: 'var(--line)' }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-sky-400 text-xs">
                        {slot.code}
                      </span>
                      <span className="font-medium text-slate-200 text-xs truncate max-w-[130px]" title={feed?.label || slot.sector}>
                        {feed?.label || slot.sector}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* State Pill */}
                      {isTerminated ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-950/80 text-red-300 border border-red-500/40">
                          TERMINATED
                        </span>
                      ) : isNoSignal ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                          NO SIGNAL
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          LIVE
                        </span>
                      )}

                      {/* Protocol Badge */}
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-sky-950/80 text-sky-300 border border-sky-500/30">
                        {feed?.streamType || (feed?.videoSrc?.includes('.m3u8') ? 'HLS' : isNoSignal ? 'STANDBY' : 'MP4')}
                      </span>
                    </div>
                  </div>

                  {/* Video Viewport Container */}
                  <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
                    {isNoSignal ? (
                      /* ── Dedicated Tactical NO SIGNAL Display ── */
                      <div className="absolute inset-0 bg-[#060e17] flex flex-col items-center justify-center p-3 text-center z-10 overflow-hidden">
                        {/* Scanlines */}
                        <div
                          className="absolute inset-0 pointer-events-none opacity-20"
                          style={{
                            backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 3px)',
                          }}
                        />
                        <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-1.5 relative">
                          <Radio className="w-5 h-5 animate-pulse text-amber-400" />
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        </div>
                        <div className="font-mono text-xs font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                          NO SIGNAL
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 max-w-[210px] leading-relaxed mb-2.5">
                          Sensor carrier offline · {slot.district} Sector Standby
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setAttachTarget({
                              code: slot.code,
                              sector: slot.sector,
                              district: slot.district,
                              modality: slot.defaultModality,
                              feedId: feed?.id,
                            });
                            setAttachStreamUrl('');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-sky-600 hover:bg-sky-500 text-white cursor-pointer shadow-md transition-all active:scale-95 z-20"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span>Attach Stream Link</span>
                        </button>
                      </div>
                    ) : feed ? (
                      <CoastalVideoPlayer
                        feedId={feed.id}
                        src={feed.videoSrc || ''}
                        modality={feed.modality}
                        state={feed.state}
                        isTerminated={isTerminated}
                        streamType={feed.streamType}
                        autoPlay={!isTerminated}
                        muted={true}
                        loop={true}
                        showHudOverlay={true}
                        onResume={() => resumeFeed(feed.id)}
                        onAttachStream={() => {
                          setAttachTarget({
                            code: slot.code,
                            sector: slot.sector,
                            district: slot.district,
                            modality: slot.defaultModality,
                            feedId: feed.id,
                          });
                          setAttachStreamUrl('');
                        }}
                        className="w-full h-full"
                      />
                    ) : null}

                    {/* Quick Focus Button in top corner */}
                    {feed && (
                      <button
                        onClick={() => navigate(`/live?feed=${encodeURIComponent(feed.id)}`)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-sky-600 text-white opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer"
                        title="Focus on this feed in Live Monitor"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Tile Bottom Command & Control Bar */}
                  <div
                    className="flex items-center justify-between px-3 py-2 border-t text-xs flex-shrink-0"
                    style={{ background: 'rgba(9, 23, 36, 0.95)', borderColor: 'var(--line)' }}
                  >
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 truncate">
                      <span>{place.name}</span>
                      <span className="opacity-40">·</span>
                      <span className="text-slate-300 font-semibold">{isNoSignal ? slot.district : (feed?.resolution || '1080p')}</span>
                      <span className="opacity-40">·</span>
                      <span>{isNoSignal ? slot.makeModel.split(' ')[0] : `≈${feed?.latencyMs || 45}ms`}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Operator Stream Termination Button */}
                      {isTerminated && feed ? (
                        <button
                          onClick={() => resumeFeed(feed.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition-colors shadow-xs"
                          title="Resume video streaming"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Resume</span>
                        </button>
                      ) : !isNoSignal && feed ? (
                        <button
                          onClick={() => terminateFeed(feed.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-red-600/90 hover:bg-red-500 text-white cursor-pointer transition-colors shadow-xs active:scale-95"
                          title="Terminate this video stream"
                        >
                          <Square className="w-3 h-3 fill-white" />
                          <span>Stop Stream</span>
                        </button>
                      ) : null}

                      {/* Attach Link if No Signal */}
                      {isNoSignal && (
                        <button
                          onClick={() => {
                            setAttachTarget({
                              code: slot.code,
                              sector: slot.sector,
                              district: slot.district,
                              modality: slot.defaultModality,
                              feedId: feed?.id,
                            });
                            setAttachStreamUrl('');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-sky-600 hover:bg-sky-500 text-white cursor-pointer transition-colors shadow-xs"
                          title="Attach stream link to this feed"
                        >
                          <Link2 className="w-3 h-3" />
                          <span>Attach</span>
                        </button>
                      )}

                      {/* End Mission Button if active feed */}
                      {feed && (
                        <button
                          onClick={() => {
                            removeUploadedVideo(feed.id);
                            stopMission(feed.id);
                            removeFeed(feed.id);
                          }}
                          className="p-1 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="End this mission sortie"
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

      {/* ── Attach Stream Modal for NO SIGNAL tile ── */}
      {attachTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div
            className="w-full max-w-md rounded-2xl border p-5 shadow-2xl flex flex-col gap-4 text-xs font-mono"
            style={{ background: '#091828', borderColor: 'rgba(56, 189, 248, 0.3)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-sky-400" />
                <h3 className="font-serif text-sm font-bold text-white">
                  Attach Stream to {attachTarget.code}
                </h3>
              </div>
              <button
                onClick={() => setAttachTarget(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAttachStreamSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-300 font-bold mb-1">
                  Stream Protocol
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['RTMP', 'RTSP', 'HLS', 'MP4'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAttachStreamType(p)}
                      className={cn(
                        'py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer',
                        attachStreamType === p
                          ? 'bg-sky-600 text-white border-sky-500'
                          : 'bg-black/40 border-white/10 text-slate-300 hover:border-white/30'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {attachStreamType === 'MP4' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 font-bold mb-1">
                      Upload Video File (MP4 / WebM)
                    </label>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAttachFileInput(file);
                          setAttachStreamUrl(file.name);
                        }
                      }}
                      className="w-full text-xs text-slate-300 cursor-pointer"
                    />
                    {attachFileInput && (
                      <p className="text-[10px] text-emerald-400 font-semibold mt-1">
                        ✓ Selected: {attachFileInput.name}
                      </p>
                    )}
                  </div>
                  <div className="text-[10px] opacity-60 text-center">— OR URL —</div>
                  <input
                    type="text"
                    value={attachStreamUrl}
                    onChange={e => setAttachStreamUrl(e.target.value)}
                    placeholder="https://domain.com/video.mp4"
                    className="w-full px-3 py-2 rounded-xl border border-white/20 bg-black/40 text-white outline-none focus:border-sky-500 font-mono text-xs"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] text-slate-300 font-bold mb-1">
                    {attachStreamType} Endpoint URL
                  </label>
                  <input
                    type="text"
                    required
                    value={attachStreamUrl}
                    onChange={e => setAttachStreamUrl(e.target.value)}
                    placeholder={
                      attachStreamType === 'RTMP'
                        ? 'rtmp://127.0.0.1:1935/live/uav01'
                        : attachStreamType === 'RTSP'
                        ? 'rtsp://user:pass@camera.coastal.gov.in:554/live'
                        : 'https://stream.coastal.gov.in/live/stream.m3u8'
                    }
                    className="w-full px-3 py-2 rounded-xl border border-white/20 bg-black/40 text-white outline-none focus:border-sky-500 font-mono text-xs"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAttachTarget(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold cursor-pointer shadow-md"
                >
                  Attach &amp; Start Streaming
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Ingestion Modal */}
      <AddStreamModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}

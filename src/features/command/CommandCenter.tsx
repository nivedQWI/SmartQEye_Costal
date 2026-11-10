// ============================================================
// SmartQEye Coastal — Primary Command Centre Dashboard
// Unified operational command interface covering:
// - Live Coastal GIS Map (Kerala Coast & Seaports)
// - Dynamic Live Video Wall (16-Slot Drone Video Grid: UAV-01 to UAV-16)
// - Tactical KPI Metrics Row
// - Priority Event Queue (DEMO/SIMULATED)
// - Single Operator Central Command
// ============================================================

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, ChevronDown, ChevronUp, Plus, Maximize2, Video,
  Radio, Square, Play, ShieldAlert, Monitor, Activity, Bell,
  Sparkles, ShieldCheck
} from 'lucide-react';
import { CoastalMap, KERALA_VIEW } from '@/components/CoastalMap';
import { CoastalVideoPlayer } from '@/components/CoastalVideoPlayer';
import { AddStreamModal } from '@/components/AddStreamModal';
import { SeverityChip, SeverityDot } from '@/components/SeverityChip';
import { useAlertStore, useFeedStore, useMapStore, useMissionStore } from '@/lib/store';
import { cn, formatIST, eventTypeLabel } from '@/lib/utils';
import { KERALA_COASTAL_SECTORS, DRONE_SLOTS_20 } from '@/lib/mockData';
import { getFeedPlace } from '@/lib/feedLocations';
import type { Alert, Feed } from '@/types';

// ─── Priority Event Queue ─────────────────────────────────────

function PriorityEventQueue() {
  const { alerts } = useAlertStore();
  const navigate = useNavigate();

  const activeAlerts = useMemo(() => {
    return alerts
      .filter(a => a.status === 'NEW' || a.status === 'ACKNOWLEDGED')
      .sort((a, b) => {
        const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
        return order.indexOf(a.severity) - order.indexOf(b.severity);
      })
      .slice(0, 8);
  }, [alerts]);

  return (
    <div className="flex flex-col h-full bg-[#05101a] border-l" style={{ borderColor: 'var(--line)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b flex-shrink-0 bg-[#091724]" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-white">Priority Events</h3>
        </div>
        <button
          onClick={() => navigate('/alerts')}
          className="text-[11px] font-mono text-sky-400 hover:underline cursor-pointer"
        >
          View all →
        </button>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {activeAlerts.length === 0 ? (
          <div className="p-4 text-center text-xs font-mono text-slate-500">No pending attention events</div>
        ) : (
          activeAlerts.map(alert => (
            <div
              key={alert.id}
              onClick={() => navigate(`/alerts?focus=${encodeURIComponent(alert.id)}`)}
              className="p-3 hover:bg-white/5 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <SeverityChip severity={alert.severity} size="sm" />
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    DEMO EVENT
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 tabular">
                  {formatIST(alert.createdAt).split(' ')[1]}
                </span>
              </div>

              <div className="text-xs font-semibold text-slate-200 mt-1.5 truncate group-hover:text-sky-300 transition-colors">
                {eventTypeLabel(alert.event.type)}
              </div>

              <div className="flex items-center justify-between mt-1 text-[11px] font-mono text-slate-400">
                <span className="truncate">{alert.event.zone?.name ?? alert.event.uav?.code}</span>
                <span className="text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">Review →</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t bg-[#030910] text-[10px] font-mono text-slate-500 flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
        <span>OPERATIONAL ATTENTION</span>
        <span className="text-emerald-400 font-bold">● REALTIME SYNC</span>
      </div>
    </div>
  );
}

// ─── Layer Toggles Component ──────────────────────────────────

function LayerToggles() {
  const { layers, toggleLayer } = useMapStore();
  const [open, setOpen] = useState(false);

  return (
    <div
      className="absolute bottom-4 left-4 rounded-xl border overflow-hidden shadow-xl z-20"
      style={{ background: 'rgba(9, 23, 36, 0.95)', borderColor: 'var(--line)' }}
    >
      <button
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-200 hover:text-white transition-colors"
        onClick={() => setOpen(!open)}
      >
        <Layers className="w-3.5 h-3.5 text-sky-400" />
        <span>Map Layers</span>
        {open ? <ChevronDown className="w-3.5 h-3.5 ml-auto" /> : <ChevronUp className="w-3.5 h-3.5 ml-auto" />}
      </button>
      {open && (
        <div className="border-t px-3 pb-2 pt-1.5 space-y-1" style={{ borderColor: 'var(--line)' }}>
          {(Object.entries(layers) as [keyof typeof layers, boolean][]).map(([key, val]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={val}
                onChange={() => toggleLayer(key)}
                className="rounded cursor-pointer accent-sky-500"
              />
              <span className="capitalize">{key}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Command Center Page ─────────────────────────────────

export default function CommandCenter() {
  const navigate = useNavigate();
  const { feeds, terminateFeed, resumeFeed } = useFeedStore();
  const { missions, activeMissionId, activeMissions } = useMissionStore();

  const [viewMode, setViewMode] = useState<'COMBINED' | 'MAP_ONLY' | 'WALL_ONLY'>('COMBINED');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const activeMission = missions.find(m => m.id === activeMissionId);

  // 16 Drone Slots Configuration (UAV-01 through UAV-16)
  const DRONE_SLOTS_16 = useMemo(() => DRONE_SLOTS_20.slice(0, 16), []);

  const slots16WithData = useMemo(() => {
    const assignedIds = new Set<string>();
    return DRONE_SLOTS_16.map((slot, index) => {
      // 1. Primary match by UAV code
      let feed = feeds.find(f => f.uavCode === slot.code && !assignedIds.has(f.id));
      // 2. Fallback to unassigned feed
      if (!feed && feeds[index] && !assignedIds.has(feeds[index].id) && !DRONE_SLOTS_16.some(s => s.code === feeds[index].uavCode)) {
        feed = feeds[index];
      }
      if (feed) {
        assignedIds.add(feed.id);
      }
      const hasVideo = Boolean(feed?.videoSrc && feed.videoSrc.trim() && feed.state !== 'NO_SIGNAL');
      const isTerminated = feed ? (feed.state === 'TERMINATED' || feed.isTerminated) : false;
      return {
        slot,
        feed,
        hasVideo,
        isTerminated,
      };
    });
  }, [feeds, DRONE_SLOTS_16]);

  const slots16LiveCount = useMemo(() => {
    return slots16WithData.filter(s => s.hasVideo && !s.isTerminated).length;
  }, [slots16WithData]);

  const focus = useMemo(() => {
    return { center: KERALA_VIEW.center, zoom: KERALA_VIEW.zoom };
  }, []);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden select-none" style={{ background: '#030a12' }}>
      {/* ── Top Command Center Bar ── */}
      <div
        className="flex items-center justify-between px-5 py-2.5 border-b flex-shrink-0 flex-wrap gap-2 text-white"
        style={{ background: '#071421', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <h1 className="font-serif text-sm font-bold tracking-wide">
              SMARTQEYE COASTAL <span className="text-slate-400 font-normal">|</span> COMMAND CENTRE
            </h1>
          </div>

          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            SYSTEM OPERATIONAL
          </span>

          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            STREAMS: {slots16LiveCount}/16 ONLINE
          </span>

          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> DEMONSTRATION / SIMULATED ENVIRONMENT
          </span>
        </div>

        {/* View Switcher & Action */}
        <div className="flex items-center gap-2">
          {/* Operator Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Operator: Central Command</span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs font-mono">
            {[
              { id: 'COMBINED', label: 'COMBINED VIEW' },
              { id: 'MAP_ONLY', label: 'MAP ONLY' },
              { id: 'WALL_ONLY', label: 'VIDEO WALL' },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id as any)}
                className={cn(
                  'px-2.5 py-1 transition-colors cursor-pointer',
                  viewMode === v.id ? 'bg-sky-600 text-white font-bold' : 'bg-black/40 text-slate-400 hover:text-white'
                )}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Add Stream Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Stream</span>
          </button>
        </div>
      </div>

      {/* ── KPI Row (Section 10 of Specification) ── */}
      <div
        className="grid grid-cols-6 gap-2 px-4 py-2 border-b flex-shrink-0"
        style={{ background: '#050f1a', borderColor: 'var(--line)' }}
      >
        <div className="rounded-xl p-2.5 bg-[#091724] border border-white/10 flex flex-col items-center justify-center text-center">
          <div className="font-mono font-extrabold text-lg text-sky-400">{slots16LiveCount} / 16</div>
          <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Online Streams</div>
        </div>

        <div className="rounded-xl p-2.5 bg-[#091724] border border-white/10 flex flex-col items-center justify-center text-center">
          <div className="font-mono font-extrabold text-lg text-amber-400">{String(activeMissions.length).padStart(2, '0')}</div>
          <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Active Missions</div>
        </div>

        <div className="rounded-xl p-2.5 bg-[#091724] border border-white/10 flex flex-col items-center justify-center text-center">
          <div className="font-mono font-extrabold text-lg text-emerald-400">17</div>
          <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Tracked Contacts</div>
        </div>

        <div className="rounded-xl p-2.5 bg-[#091724] border border-white/10 flex flex-col items-center justify-center text-center">
          <div className="font-mono font-extrabold text-lg text-sky-300">06</div>
          <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Events (24H)</div>
        </div>

        <div className="rounded-xl p-2.5 bg-[#091724] border border-white/10 flex flex-col items-center justify-center text-center">
          <div className="font-mono font-extrabold text-lg text-red-400">02</div>
          <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Attention Queue</div>
        </div>

        <div className="rounded-xl p-2.5 bg-[#091724] border border-white/10 flex flex-col items-center justify-center text-center">
          <div className="font-mono font-extrabold text-lg text-emerald-400">HEALTHY</div>
          <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">System Health</div>
        </div>
      </div>

      {/* ── Main Tactical Canvas Area ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* 1. Coastal GIS Tactical Map */}
        {(viewMode === 'COMBINED' || viewMode === 'MAP_ONLY') && (
          <div
            className={cn(
              'relative h-full transition-all duration-300',
              viewMode === 'COMBINED' ? 'w-[45%]' : 'w-full'
            )}
          >
            <CoastalMap
              height="100%"
              className="absolute inset-0"
              showContacts={false}
              focus={focus}
              onAlertClick={(alertId) => navigate(`/alerts?focus=${encodeURIComponent(alertId)}`)}
              onDroneClick={(feedId) => navigate(`/live?feed=${encodeURIComponent(feedId)}`)}
            />
            <LayerToggles />

            {/* Map Watermark Banner */}
            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-black/75 border border-white/15 text-[10px] font-mono text-slate-300 backdrop-blur-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>Kerala Coastal Grid · 7 Ports Surveillance</span>
            </div>
          </div>
        )}

        {/* 2. Live Video Feeds Wall (16 Drone Video Grid View: UAV-01 to UAV-16) */}
        {(viewMode === 'COMBINED' || viewMode === 'WALL_ONLY') && (
          <div
            className={cn(
              'h-full flex flex-col border-l border-white/10 transition-all duration-300 bg-[#040c14]',
              viewMode === 'COMBINED' ? 'w-[37%]' : 'w-full'
            )}
          >
            {/* Feeds Header */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 bg-[#081522] flex-shrink-0">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-sky-400" />
                <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-white">
                  Live Video Wall ({slots16LiveCount}/16 Active)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/fleet')}
                  className="text-[11px] font-mono text-sky-400 hover:underline cursor-pointer"
                >
                  Fleet Wall (Full Grid) →
                </button>
              </div>
            </div>

            {/* 16 Drone Slots Grid View */}
            <div className="flex-1 overflow-y-auto p-2.5">
              <div className={cn(
                'grid gap-2',
                viewMode === 'WALL_ONLY' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2'
              )}>
                {slots16WithData.map(({ slot, feed, hasVideo, isTerminated }) => {
                  const place = feed ? getFeedPlace(feed) : { name: slot.sector };

                  if (hasVideo && feed) {
                    return (
                      <div
                        key={slot.code}
                        className="rounded-xl border overflow-hidden flex flex-col shadow-md transition-all group"
                        style={{
                          background: '#030911',
                          borderColor: isTerminated ? 'rgba(239,68,68,0.4)' : 'rgba(56,189,248,0.25)',
                        }}
                      >
                        {/* Feed Tile Top Bar */}
                        <div className="flex items-center justify-between px-2 py-1 bg-[#091724] border-b border-white/10 text-xs">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="font-mono font-bold text-sky-400 text-[11px]">{slot.code}</span>
                            <span className="font-medium text-slate-300 text-[11px] truncate max-w-[100px]" title={feed.label}>
                              {feed.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-sky-950/80 text-sky-300 border border-sky-500/30">
                              {feed.streamType || (feed.videoSrc?.includes('.m3u8') ? 'HLS' : 'MP4')}
                            </span>
                            {isTerminated ? (
                              <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-red-950/80 text-red-300 border border-red-500/40">
                                STOPPED
                              </span>
                            ) : (
                              <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                LIVE
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Feed Player Viewport */}
                        <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
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
                            className="w-full h-full"
                          />
                          <button
                            onClick={() => navigate(`/live?feed=${encodeURIComponent(feed.id)}`)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 hover:bg-sky-600 text-white opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer"
                            title="Focus in Live Monitor"
                          >
                            <Maximize2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Feed Tile Bottom Controls */}
                        <div className="flex items-center justify-between px-2 py-1 bg-[#06101a] border-t border-white/10 text-[10px] font-mono">
                          <span className="text-slate-400 truncate max-w-[100px]">{place.name}</span>
                          <div className="flex items-center gap-1">
                            {isTerminated ? (
                              <button
                                onClick={() => resumeFeed(feed.id)}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                              >
                                <Play className="w-2 h-2 fill-white" />
                                <span>Resume</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => terminateFeed(feed.id)}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 hover:bg-red-500 text-white cursor-pointer"
                              >
                                <Square className="w-2 h-2 fill-white" />
                                <span>Stop</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // No Signal Slot Tile
                  return (
                    <div
                      key={slot.code}
                      className="rounded-xl border overflow-hidden flex flex-col shadow-md transition-all group bg-[#040c15]"
                      style={{
                        borderColor: 'rgba(245, 158, 11, 0.25)',
                      }}
                    >
                      {/* Slot Top Bar */}
                      <div className="flex items-center justify-between px-2 py-1 bg-[#071320] border-b border-white/10 text-xs">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-mono font-bold text-amber-400/90 text-[11px]">{slot.code}</span>
                          <span className="font-medium text-slate-400 text-[11px] truncate max-w-[100px]" title={slot.sector}>
                            {slot.sector}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-amber-950/80 text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                          <Radio className="w-2 h-2 text-amber-400 animate-pulse" />
                          NO SIGNAL
                        </span>
                      </div>

                      {/* Tactical NO SIGNAL Viewport */}
                      <div className="relative aspect-video w-full bg-[#02070e] overflow-hidden flex flex-col items-center justify-center p-2 text-center">
                        <div
                          className="absolute inset-0 pointer-events-none opacity-20"
                          style={{
                            backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)',
                          }}
                        />
                        <Radio className="w-5 h-5 text-amber-500/80 mb-0.5 animate-pulse" />
                        <span className="font-mono text-[10px] font-extrabold text-amber-400 tracking-wider">
                          NO SIGNAL
                        </span>
                        <span className="text-[8px] font-mono text-slate-500 truncate max-w-[120px]">
                          Standby · Sensor Offline
                        </span>
                      </div>

                      {/* Bottom Info Bar */}
                      <div className="flex items-center justify-between px-2 py-1 bg-[#030911] border-t border-white/10 text-[9px] font-mono text-slate-500">
                        <span className="truncate max-w-[100px]">{slot.district}</span>
                        <button
                          onClick={() => navigate('/missions')}
                          className="text-sky-400 hover:text-sky-300 font-bold hover:underline cursor-pointer"
                        >
                          + Sortie
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. Priority Event Queue (Rightmost panel in Combined mode) */}
        {viewMode === 'COMBINED' && (
          <div className="w-[18%] h-full flex-shrink-0">
            <PriorityEventQueue />
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

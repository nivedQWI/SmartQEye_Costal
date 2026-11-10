// ============================================================
// SmartQEye Coastal — Primary Command Centre Dashboard
// Unified operational command interface covering:
// - Live Coastal GIS Map (Kerala Coast & Seaports)
// - Dynamic Live Video Wall (Shows all inputted RTSP/RTMP/HLS/MP4 streams)
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
import { KERALA_COASTAL_SECTORS } from '@/lib/mockData';
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
  const { missions, activeMissionId } = useMissionStore();

  const [viewMode, setViewMode] = useState<'COMBINED' | 'MAP_ONLY' | 'WALL_ONLY'>('COMBINED');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const activeMission = missions.find(m => m.id === activeMissionId);
  const liveFeedsCount = feeds.filter(f => f.state === 'LIVE').length;
  const terminatedCount = feeds.filter(f => f.state === 'TERMINATED').length;

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
            STREAMS: {liveFeedsCount}/{feeds.length} ONLINE
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
          <div className="font-mono font-extrabold text-lg text-sky-400">{liveFeedsCount} / {feeds.length}</div>
          <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Online Streams</div>
        </div>

        <div className="rounded-xl p-2.5 bg-[#091724] border border-white/10 flex flex-col items-center justify-center text-center">
          <div className="font-mono font-extrabold text-lg text-amber-400">04</div>
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

        {/* 2. Live Video Feeds Wall (Shows all inputted RTSP / RTMP / MP4 streams) */}
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
                  Live Video Wall ({feeds.length} Streams)
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

            {/* Feeds Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {feeds.map(feed => {
                const place = getFeedPlace(feed);
                const isTerminated = feed.state === 'TERMINATED' || feed.isTerminated;

                return (
                  <div
                    key={feed.id}
                    className="rounded-xl border overflow-hidden flex flex-col shadow-md transition-all group"
                    style={{
                      background: '#030911',
                      borderColor: isTerminated ? 'rgba(239,68,68,0.4)' : 'rgba(56,189,248,0.25)',
                    }}
                  >
                    {/* Feed Tile Top Bar */}
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#091724] border-b border-white/10 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-bold text-sky-400 text-xs">{feed.uavCode}</span>
                        <span className="font-medium text-slate-300 text-xs truncate max-w-[130px]">{feed.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-500/30">
                          {feed.streamType || (feed.videoSrc?.includes('.m3u8') ? 'HLS' : 'MP4')}
                        </span>
                        {isTerminated ? (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-500/40">
                            STOPPED
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            LIVE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Feed Player */}
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

                      {/* Expand Button */}
                      <button
                        onClick={() => navigate(`/live?feed=${encodeURIComponent(feed.id)}`)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-sky-600 text-white opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer"
                        title="Focus in Live Monitor"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Feed Tile Bottom Controls */}
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#06101a] border-t border-white/10 text-[11px] font-mono">
                      <span className="text-slate-400 truncate">{place.name}</span>
                      <div className="flex items-center gap-1.5">
                        {isTerminated ? (
                          <button
                            onClick={() => resumeFeed(feed.id)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                          >
                            <Play className="w-2.5 h-2.5 fill-white" />
                            <span>Resume</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => terminateFeed(feed.id)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 hover:bg-red-500 text-white cursor-pointer"
                          >
                            <Square className="w-2.5 h-2.5 fill-white" />
                            <span>Stop</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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

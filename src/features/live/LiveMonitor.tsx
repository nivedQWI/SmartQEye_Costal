// ============================================================
// SmartQEye Coastal — Live Monitor
// Multi-feed wall + Focus mode with canvas overlays + DVR
// ============================================================

import { useState, useEffect, useMemo, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getFeedPlace } from '@/lib/feedLocations';
import {
  Maximize2, Minimize2, Crosshair, Eye, EyeOff, Video,
} from 'lucide-react';
import { cn, formatIST, formatDeg, timeAgo } from '@/lib/utils';
import { FeedStateChip, ModalityChip } from '@/components/FeedStateChip';
import { CoastalMap } from '@/components/CoastalMap';
import { useFeedStore, useAlertStore } from '@/lib/store';
import { simulator } from '@/lib/simulator';
import { CONTACTS } from '@/lib/mockData';
import { CoastalVideoPlayer } from '@/components/CoastalVideoPlayer';
import { CfsStreamStrip } from '@/components/CfsStreamStrip';
import type { Feed, Modality } from '@/types';

// ─── Video tile with CoastalVideoPlayer ─────────────────────────

interface FeedTileProps {
  feed: Feed;
  isActive: boolean;
  isFocus: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  showOverlays: boolean;
}

const FeedTile = memo(function FeedTile({ feed, isActive, isFocus: _isFocus, onClick, onDoubleClick, showOverlays: _showOverlays }: FeedTileProps) {
  const stateColour = {
    LIVE: '#2ECC71', BUFFERING: '#E0A526', NO_SIGNAL: '#C8352E', RECORDED: '#2B7FA6', EDGE_SYNC_LAG: '#9B59B6', TERMINATED: '#C8352E',
  }[feed.state];

  return (
    <div
      className={cn('relative overflow-hidden rounded-xl cursor-pointer group transition-shadow', !isActive && 'hover:brightness-110')}
      style={{
        background: '#030C14',
        outline: isActive ? '3px solid #38BDF8' : `2px solid ${stateColour}`,
        outlineOffset: isActive ? '2px' : '0px',
        boxShadow: isActive ? '0 0 0 6px rgba(56,189,248,0.25), 0 0 24px rgba(56,189,248,0.45)' : undefined,
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={`${feed.label}${isActive ? ' (selected)' : ''}`}
      onKeyDown={e => { if (e.key === 'Enter') onDoubleClick(); else if (e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      {isActive && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider bg-sky-500 text-white shadow-lg flex items-center gap-1">
          <Crosshair className="w-3 h-3" /> SELECTED
        </div>
      )}
      {/* Video or Signal State */}
      <div className="absolute inset-0 flex items-center justify-center bg-[#030C14]">
        {feed.state === 'NO_SIGNAL' ? (
          <div className="text-center p-3">
            <div className="text-red-400 font-mono text-sm font-bold mb-1">NO SIGNAL</div>
            <div className="w-12 h-0.5 bg-red-600/50 mx-auto mb-1" />
            <div className="text-red-400/60 font-mono text-xs">Feed lost {timeAgo(feed.lastFrameAt ?? new Date().toISOString())}</div>
          </div>
        ) : feed.state === 'EDGE_SYNC_LAG' ? (
          <div className="text-center p-3">
            <div className="text-purple-400 font-mono text-xs font-bold mb-1">EDGE SYNC LAG</div>
            <div className="text-purple-400/60 font-mono text-xs">{feed.edgeSyncLagSec}s behind</div>
          </div>
        ) : (
          <CoastalVideoPlayer
            src={feed.videoSrc || ''}
            modality={feed.modality}
            autoPlay={true}
            muted={true}
            loop={true}
            showHudOverlay={true}
            className="w-full h-full pointer-events-none"
          />
        )}
      </div>

      {/* Overlay HUD chips */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
        <FeedStateChip state={feed.state} size="sm" />
        <ModalityChip modality={feed.modality} size="sm" />
      </div>

      {/* Latency */}
      {feed.state === 'LIVE' && (
        <div className="absolute top-2 right-2 font-mono text-[10px] text-white/60 bg-black/50 px-1.5 py-0.5 rounded z-10">
          ≈{Math.round(feed.latencyMs ?? 0)}ms
        </div>
      )}

      {/* Label */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-10 pointer-events-none">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-white/90 font-medium truncate max-w-[200px]">{feed.label}</span>
          {feed.fpsCurrent !== undefined && feed.fpsCurrent > 0 && (
            <span className="font-mono text-[10px] text-white/50">{Math.round(feed.fpsCurrent)}fps</span>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── Focus Mode ──────────────────────────────────────────────

function FocusMode({ feed, onExit }: { feed: Feed; onExit: () => void }) {
  const { telemetry } = useFeedStore();
  const place = getFeedPlace(feed);
  // Simulated telemetry exists only for some feeds; it must agree with the video's
  // coastal location, otherwise fall back to the resolved place coordinates.
  const simTele = telemetry[feed.id] ?? feed.telemetry;
  const teleMatchesPlace = !!simTele && Math.abs(simTele.lat - place.lat) < 0.1 && Math.abs(simTele.lon - place.lon) < 0.1;
  const tele = simTele && teleMatchesPlace ? simTele : undefined;
  const pos = { lat: tele?.lat ?? place.lat, lon: tele?.lon ?? place.lon };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Video + controls */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with back to grid and sensor modality selector */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b flex-shrink-0 flex-wrap gap-2"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-medium transition-colors hover:bg-[var(--raised)] cursor-pointer"
              style={{ borderColor: 'var(--line)', color: 'var(--sea-accent)' }}
            >
              <Minimize2 className="w-3.5 h-3.5" /> Grid View
            </button>
            <div className="h-4 w-px" style={{ background: 'var(--line)' }} />
            <FeedStateChip state={feed.state} size="sm" />
            <span className="font-mono text-xs font-semibold">{feed.label}</span>
            <span className="font-mono text-xs opacity-60">({feed.uavCode})</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs opacity-70">
            <ModalityChip modality={feed.modality} size="sm" />
            <span>{place.name}, {place.district}</span>
            <span className="opacity-60">·</span>
            <span>Mission: {feed.missionCode ?? 'MSN-20261016-0830-01-VIZHINJAM'}</span>
          </div>
        </div>

        {/* Video viewport with CoastalVideoPlayer */}
        <div className="flex-1 relative bg-black overflow-hidden flex flex-col">
          <CoastalVideoPlayer
            src={feed.videoSrc || ''}
            modality={feed.modality}
            autoPlay={true}
            muted={true}
            loop={true}
            showControls={true}
            showHudOverlay={true}
            className="flex-1 w-full h-full"
          />
        </div>

        {/* Cognitive Frame Selection (CFS) Pre-inference strip */}
        <div className="flex-shrink-0 border-t bg-[var(--panel)]" style={{ borderColor: 'var(--line)' }}>
          <CfsStreamStrip feedId={feed.id} uavCode={feed.uavCode} fps={feed.fpsTarget ?? 25} />
        </div>
      </div>

      {/* Right panel: telemetry + contacts */}
      <div className="w-64 flex-shrink-0 flex flex-col border-l" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        {/* Mini map — centred on this drone's actual coastal location */}
        <div className="h-48 flex-shrink-0 relative">
          <CoastalMap
            key={feed.id}
            height="100%"
            interactive={false}
            showAlerts={false}
            initialCenter={[pos.lon, pos.lat]}
            initialZoom={12.5}
            singleDrone={{
              feedId: feed.id,
              uavCode: feed.uavCode,
              missionCode: feed.missionCode ?? '',
              locationName: `${place.name}, ${place.district}`,
              lat: pos.lat,
              lon: pos.lon,
              headingDeg: tele?.headingDeg ?? 0,
            }}
          />
          <div className="absolute bottom-1 left-1 right-1 z-10 px-2 py-1 rounded-md text-[10px] font-mono bg-black/70 text-white truncate">
            {place.name} · {pos.lat.toFixed(4)}°N {pos.lon.toFixed(4)}°E
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Telemetry */}
          <div className="p-3 border-b" style={{ borderColor: 'var(--line)' }}>
            <h4 className="font-serif text-xs font-semibold mb-2 opacity-60 uppercase tracking-wider">Telemetry</h4>
            {(
              <div className="space-y-1">
                {[
                  ['Position', `${pos.lat.toFixed(4)}°N ${pos.lon.toFixed(4)}°E`],
                  ['Sector', place.district],
                  ['Altitude', tele ? `${Math.round(tele.altitudeM)} m` : '110 m'],
                  ['Heading', tele ? formatDeg(tele.headingDeg) : '—'],
                  ['Ground Speed', tele ? `${tele.groundSpeedMs.toFixed(1)} m/s` : '—'],
                  ['Battery', tele ? `${Math.round(tele.batteryPct)}%` : '—'],
                  ['Flight Mode', tele?.flightStatus ?? 'AUTO'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between text-sm gap-2">
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span className="font-mono font-medium tabular text-right">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contacts in view */}
          <div className="p-3">
            <h4 className="font-serif text-xs font-semibold mb-2 opacity-60 uppercase tracking-wider">Contacts in View</h4>
            {CONTACTS.slice(0, 5).map(contact => (
              <div key={contact.id} className="flex items-center gap-2 py-2 border-b text-sm" style={{ borderColor: 'var(--line)' }}>
                <div className="font-mono font-bold" style={{ color: 'var(--sea-accent)' }}>{contact.code}</div>
                <div className="flex-1 truncate" style={{ color: 'var(--text-muted)' }}>{contact.classLabel}</div>
                <div className="font-mono opacity-60">{(contact.classConf * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Grid layout ─────────────────────────────────────────────

type Layout = 1 | 4 | 9 | 16;

const LAYOUT_COLS: Record<Layout, string> = {
  1: 'grid-cols-1',
  4: 'grid-cols-2',
  9: 'grid-cols-3',
  16: 'grid-cols-4',
};

// ─── Live Monitor page ────────────────────────────────────────

export default function LiveMonitor() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { feeds, activeFeedId, setActiveFeed, gridLayout, setGridLayout } = useFeedStore();
  const [focusMode, setFocusMode] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const [selectedModality, setSelectedModality] = useState<'ALL' | Modality>('ALL');
  const [linkedAlertId, setLinkedAlertId] = useState<string | null>(null);
  const [linkSource, setLinkSource] = useState<string | null>(null);
  const alerts = useAlertStore(s => s.alerts);

  const activeFeed = feeds.find(f => f.id === activeFeedId) ?? feeds[0];

  // Deep link: /live?feed=<id>[&alert=<id>][&from=fleet] — select & highlight that feed
  useEffect(() => {
    const feedParam = searchParams.get('feed');
    if (!feedParam || !feeds.some(f => f.id === feedParam)) return;
    setActiveFeed(feedParam);
    setSelectedModality('ALL');
    setFocusMode(false);
    setLinkedAlertId(searchParams.get('alert'));
    setLinkSource(searchParams.get('from'));
    // Consume the params so a later manual selection isn't overridden
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const linkedAlert = linkedAlertId ? alerts.find(a => a.id === linkedAlertId) : undefined;

  // Connect simulator
  useEffect(() => {
    const unsub = simulator.subscribe(event => {
      if (event.type === 'FEED_UPDATE') {
        useFeedStore.getState().updateFeed(event.payload);
      }
      if (event.type === 'TELEMETRY') {
        useFeedStore.getState().updateTelemetry(event.payload);
      }
    });
    return unsub;
  }, []);

  const filteredFeeds = useMemo(() => {
    if (selectedModality === 'ALL') return feeds;
    return feeds.filter(f => f.modality === selectedModality);
  }, [feeds, selectedModality]);

  // Always keep the selected feed on screen (put it first if it would be cut off)
  const displayFeeds = useMemo(() => {
    const first = filteredFeeds.slice(0, gridLayout);
    if (!activeFeedId || first.some(f => f.id === activeFeedId)) return first;
    const active = filteredFeeds.find(f => f.id === activeFeedId);
    if (!active) return first;
    return [active, ...filteredFeeds.filter(f => f.id !== activeFeedId)].slice(0, gridLayout);
  }, [filteredFeeds, gridLayout, activeFeedId]);

  if (focusMode && activeFeed) {
    return <FocusMode feed={activeFeed} onExit={() => setFocusMode(false)} />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div
        className="flex items-center gap-3 px-3 py-2 border-b flex-shrink-0 flex-wrap"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        <span className="font-serif text-sm font-semibold">Live Monitor</span>

        {/* View Mode Toggle: Live vs Recorded Analysis (Demo Step 3) */}
        <div className="flex rounded-lg overflow-hidden border text-xs font-mono" style={{ borderColor: 'var(--line)' }}>
          <button className="px-2.5 py-1 bg-[var(--sea-600)] text-white font-bold flex items-center gap-1.5 cursor-default">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Monitor
          </button>
          <button
            onClick={() => navigate('/recorded-analysis')}
            className="px-2.5 py-1 bg-[var(--raised)] opacity-70 hover:opacity-100 transition-colors flex items-center gap-1.5 cursor-pointer hover:text-[var(--sea-accent)]"
            title="Open Recorded Video Analysis (Muthalapozhi Breakwater Channel & Kerala Sectors)"
          >
            <Video className="w-3.5 h-3.5 text-amber-500" />
            Recorded Analysis (Muthalapozhi)
          </button>
        </div>

        {/* Modality Section Filter Buttons */}
        <div className="flex rounded-lg overflow-hidden border text-xs font-mono" style={{ borderColor: 'var(--line)' }}>
          <button
            onClick={() => setSelectedModality('ALL')}
            className={cn('px-2.5 py-1 transition-colors cursor-pointer', selectedModality === 'ALL' ? 'bg-[var(--sea-600)] text-white font-bold' : 'opacity-70 hover:opacity-100 bg-[var(--raised)]')}
          >
            All Feeds ({feeds.length})
          </button>
          <button
            onClick={() => setSelectedModality('RGB')}
            className={cn('px-2.5 py-1 transition-colors cursor-pointer', selectedModality === 'RGB' ? 'bg-sky-600 text-white font-bold' : 'opacity-70 hover:opacity-100 bg-[var(--raised)]')}
          >
            RGB Optical
          </button>
          <button
            onClick={() => setSelectedModality('THERMAL')}
            className={cn('px-2.5 py-1 transition-colors cursor-pointer', selectedModality === 'THERMAL' ? 'bg-orange-600 text-white font-bold' : 'opacity-70 hover:opacity-100 bg-[var(--raised)]')}
          >
            Thermal Section
          </button>
          <button
            onClick={() => setSelectedModality('NIGHT_VISION')}
            className={cn('px-2.5 py-1 transition-colors cursor-pointer', selectedModality === 'NIGHT_VISION' ? 'bg-emerald-600 text-white font-bold' : 'opacity-70 hover:opacity-100 bg-[var(--raised)]')}
          >
            Night Vision
          </button>
        </div>

        <div className="flex-1" />

        {/* Grid switcher */}
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--line)' }}>
          {([1, 4, 9, 16] as Layout[]).map(l => (
            <button
              key={l}
              className={cn('px-2.5 py-1.5 text-xs font-mono transition-colors', gridLayout === l ? 'text-white' : 'opacity-50')}
              style={{ background: gridLayout === l ? 'var(--sea-600)' : 'var(--raised)' }}
              onClick={() => setGridLayout(l)}
              title={`${l} feeds`}
            >
              {l === 1 ? '1' : l === 4 ? '2×2' : l === 9 ? '3×3' : '4×4'}
            </button>
          ))}
        </div>

        {/* Overlay toggle */}
        <button
          className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors', showOverlays && 'border-[var(--sea-400)]')}
          style={{ borderColor: showOverlays ? 'var(--sea-400)' : 'var(--line)' }}
          onClick={() => setShowOverlays(!showOverlays)}
        >
          {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          Overlays
        </button>

        {activeFeed && (
          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors hover:bg-[var(--raised)]"
            style={{ borderColor: 'var(--line)' }}
            onClick={() => setFocusMode(true)}
          >
            <Maximize2 className="w-3.5 h-3.5" /> Focus
          </button>
        )}
      </div>

      {/* Linked-from banner (map / fleet wall deep link) */}
      {(linkedAlert || linkSource) && activeFeed && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 text-xs border-b flex-shrink-0"
          style={{ background: linkedAlert ? 'rgba(200,53,46,0.12)' : 'rgba(56,189,248,0.12)', borderColor: 'var(--line)' }}
        >
          <Crosshair className="w-3.5 h-3.5" style={{ color: linkedAlert ? 'var(--sev-critical)' : '#0284c7' }} />
          {linkedAlert ? (
            <span>
              Showing <b>{activeFeed.label}</b> — the drone that raised <b>{linkedAlert.alertCode}</b>{' '}
              ({linkedAlert.event.type.replace(/_/g, ' ')}) at {linkedAlert.event.location.name ?? linkedAlert.event.zone?.name}
            </span>
          ) : (
            <span>Showing <b>{activeFeed.label}</b> selected from the Fleet Wall</span>
          )}
          {linkedAlert && (
            <button
              className="ml-2 underline font-semibold cursor-pointer"
              style={{ color: 'var(--sea-accent)' }}
              onClick={() => navigate(`/alerts?focus=${encodeURIComponent(linkedAlert.id)}`)}
            >
              Open alert
            </button>
          )}
          <button
            className="ml-auto opacity-60 hover:opacity-100 cursor-pointer"
            onClick={() => { setLinkedAlertId(null); setLinkSource(null); }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Feed grid */}
        <div className={cn('flex-1 overflow-hidden p-3', displayFeeds.length === 0 ? 'flex items-center justify-center' : cn('grid gap-3', LAYOUT_COLS[gridLayout]))}>
          {displayFeeds.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-base font-bold text-slate-200">No Ingested Video Feeds Available</h3>
              <p className="text-xs font-mono text-slate-400 max-w-sm mt-1 mb-4">
                Video feeds appear live when surveillance sorties are launched in Mission Control or ingested via RTSP/RTMP.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/missions')}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold shadow-md cursor-pointer"
                >
                  Go to Mission Control
                </button>
                <button
                  onClick={() => navigate('/fleet')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 font-mono text-xs font-bold cursor-pointer"
                >
                  Tactical Fleet Wall
                </button>
              </div>
            </div>
          ) : (
            displayFeeds.map(feed => (
              <FeedTile
                key={feed.id}
                feed={feed}
                isActive={feed.id === activeFeedId}
                isFocus={false}
                onClick={() => setActiveFeed(feed.id)}
                onDoubleClick={() => { setActiveFeed(feed.id); setFocusMode(true); }}
                showOverlays={showOverlays}
              />
            ))
          )}
        </div>

        {/* Selected feed details */}
        {activeFeed && (
          <SelectedFeedPanel feed={activeFeed} onFocus={() => setFocusMode(true)} />
        )}
      </div>
    </div>
  );
}

// ─── Selected feed metadata panel ─────────────────────────────

function SelectedFeedPanel({ feed, onFocus }: { feed: Feed; onFocus: () => void }) {
  const telemetry = useFeedStore(s => s.telemetry[feed.id]);
  const place = getFeedPlace(feed);
  const tele = telemetry && Math.abs(telemetry.lat - place.lat) < 0.1 ? telemetry : undefined;
  const lat = tele?.lat ?? place.lat;
  const lon = tele?.lon ?? place.lon;

  const rows: [string, string][] = [
    ['Feed ID', feed.id.toUpperCase()],
    ['UAV', feed.uavCode],
    ['Mission', feed.missionCode ?? '—'],
    ['Sensor', feed.modality === 'NIGHT_VISION' ? 'Night Vision' : feed.modality === 'THERMAL' ? 'Thermal (LWIR)' : 'RGB Optical'],
    ['Location', place.name],
    ['District', place.district],
    ['Coordinates', `${lat.toFixed(4)}°N ${lon.toFixed(4)}°E`],
    ['Resolution', feed.resolution ?? '—'],
    ['Frame Rate', `${Math.round(feed.fpsCurrent ?? 0)} / ${feed.fpsTarget ?? 25} fps`],
    ['Bitrate', `${(feed.bitrateMbps ?? 0).toFixed(1)} Mbps`],
    ['Latency', feed.state === 'LIVE' ? `${Math.round(feed.latencyMs ?? 0)} ms` : '—'],
    ['Dropped Frames', String(feed.droppedFrames ?? 0)],
    ['Last Frame', feed.lastFrameAt ? formatIST(feed.lastFrameAt) : '—'],
  ];
  if (tele) {
    rows.push(['Altitude', `${Math.round(tele.altitudeM)} m`]);
    rows.push(['Battery', `${Math.round(tele.batteryPct)}%`]);
  }

  return (
    <aside
      className="w-72 flex-shrink-0 border-l flex flex-col overflow-hidden"
      style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      aria-label="Selected feed details"
    >
      <div className="px-3 py-2.5 border-b" style={{ borderColor: 'var(--line)' }}>
        <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
          <Crosshair className="w-3 h-3" /> Selected Feed
        </div>
        <div className="font-serif text-sm font-bold mt-0.5 leading-tight">{feed.label}</div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <FeedStateChip state={feed.state} size="sm" />
          <ModalityChip modality={feed.modality} size="sm" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-2 text-xs py-0.5">
            <span style={{ color: 'var(--text-muted)' }}>{k}</span>
            <span className="font-mono font-medium text-right" style={{ color: 'var(--text)' }}>{v}</span>
          </div>
        ))}
      </div>
      <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
        <button
          onClick={onFocus}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer hover:opacity-90"
          style={{ background: 'var(--sea-600)' }}
        >
          <Maximize2 className="w-3.5 h-3.5" /> Focus on this feed
        </button>
      </div>
    </aside>
  );
}

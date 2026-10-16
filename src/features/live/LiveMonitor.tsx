// ============================================================
// SmartQEye Coastal — Live Monitor
// Multi-feed wall + Focus mode with canvas overlays + DVR
// ============================================================

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid2x2, Grid3x3, Maximize2, Minimize2,
  Play, Pause, SkipBack, Radio, Crosshair,
  SlidersHorizontal, Eye, EyeOff,
} from 'lucide-react';
import { cn, formatIST, formatCoords, formatDeg, timeAgo } from '@/lib/utils';
import { FeedStateChip, ModalityChip } from '@/components/FeedStateChip';
import { SeverityChip } from '@/components/SeverityChip';
import { CoastalMap } from '@/components/CoastalMap';
import { useFeedStore, useAlertStore } from '@/lib/store';
import { simulator } from '@/lib/simulator';
import { ALERTS, CONTACTS } from '@/lib/mockData';
import { DroneVideoPlayer } from '@/components/DroneVideoPlayer';
import { CfsStreamStrip } from '@/components/CfsStreamStrip';
import type { Feed, TelemetrySample } from '@/types';

// ─── Video tile with DroneVideoPlayer ──────────────────────────

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
    LIVE: '#2ECC71', BUFFERING: '#E0A526', NO_SIGNAL: '#C8352E', RECORDED: '#2B7FA6', EDGE_SYNC_LAG: '#9B59B6',
  }[feed.state];

  return (
    <div
      className={cn('relative overflow-hidden rounded-xl cursor-pointer group', isActive && 'ring-2 ring-[var(--sea-accent)]')}
      style={{ background: '#030C14', outline: `2px solid ${stateColour}`, outlineOffset: '0px' }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
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
          <DroneVideoPlayer
            sceneName="vizhinjam_patrol"
            showControls={false}
            autoPlay={true}
            loop={true}
            initialModality={feed.modality}
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
          <span className="font-mono text-xs text-white/90 font-medium">{feed.label}</span>
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
  const tele = telemetry[feed.id] ?? feed.telemetry;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Video + controls */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with back to grid */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b flex-shrink-0"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-medium transition-colors hover:bg-[var(--raised)]"
              style={{ borderColor: 'var(--line)', color: 'var(--sea-accent)' }}
            >
              <Minimize2 className="w-3.5 h-3.5" /> Grid View
            </button>
            <div className="h-4 w-px" style={{ background: 'var(--line)' }} />
            <FeedStateChip state={feed.state} size="sm" />
            <span className="font-mono text-xs font-semibold">{feed.label}</span>
            <span className="font-mono text-xs opacity-60">({feed.uavCode})</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs opacity-60">
            <span>Mission: {feed.missionCode ?? 'MSN-20261016-0830-01-VIZHINJAM'}</span>
          </div>
        </div>

        {/* Video viewport with DroneVideoPlayer */}
        <div className="flex-1 relative bg-black overflow-hidden flex flex-col">
          <DroneVideoPlayer
            sceneName="vizhinjam_patrol"
            autoPlay={true}
            loop={true}
            showControls={true}
            initialModality={feed.modality}
            className="flex-1 w-full h-full"
          />
        </div>

        {/* Cognitive Frame Selection (CFS) Pre-inference strip */}
        <div className="flex-shrink-0 border-t bg-[var(--panel)]" style={{ borderColor: 'var(--line)' }}>
          <CfsStreamStrip feedId={feed.id} uavCode={feed.uavCode} />
        </div>
      </div>

      {/* Right panel: telemetry + contacts */}
      <div className="w-64 flex-shrink-0 flex flex-col border-l" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        {/* Mini map */}
        <div className="h-48 flex-shrink-0">
          <CoastalMap height="100%" interactive={false} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Telemetry */}
          <div className="p-3 border-b" style={{ borderColor: 'var(--line)' }}>
            <h4 className="font-serif text-xs font-semibold mb-2 opacity-60 uppercase tracking-wider">Telemetry</h4>
            {tele ? (
              <div className="space-y-1">
                {[
                  ['Position', `${tele.lat.toFixed(4)}°N ${tele.lon.toFixed(4)}°E`],
                  ['Altitude', `${Math.round(tele.altitudeM)} m`],
                  ['Heading', formatDeg(tele.headingDeg)],
                  ['Ground Speed', `${tele.groundSpeedMs.toFixed(1)} m/s`],
                  ['Battery', `${Math.round(tele.batteryPct)}%`],
                  ['Flight Mode', tele.flightStatus],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between text-sm gap-2">
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span className="font-mono font-medium tabular text-right">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>Telemetry unavailable</div>
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
  const { feeds, activeFeedId, setActiveFeed, gridLayout, setGridLayout } = useFeedStore();
  const [focusMode, setFocusMode] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);

  const activeFeed = feeds.find(f => f.id === activeFeedId) ?? feeds[0];

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

  const displayFeeds = feeds.slice(0, gridLayout);

  if (focusMode && activeFeed) {
    return <FocusMode feed={activeFeed} onExit={() => setFocusMode(false)} />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div
        className="flex items-center gap-3 px-3 py-2 border-b flex-shrink-0"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        <span className="font-serif text-sm font-semibold">Live Monitor</span>
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

      {/* Feed grid */}
      <div className={cn('flex-1 overflow-hidden p-2 grid gap-2', LAYOUT_COLS[gridLayout])}>
        {displayFeeds.map(feed => (
          <FeedTile
            key={feed.id}
            feed={feed}
            isActive={feed.id === activeFeedId}
            isFocus={false}
            onClick={() => setActiveFeed(feed.id)}
            onDoubleClick={() => { setActiveFeed(feed.id); setFocusMode(true); }}
            showOverlays={showOverlays}
          />
        ))}
      </div>
    </div>
  );
}

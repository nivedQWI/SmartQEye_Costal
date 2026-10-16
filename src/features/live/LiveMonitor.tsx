// ============================================================
// SmartQEye Coastal — Live Monitor
// Multi-feed wall + Focus mode with canvas overlays + DVR
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
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
import type { Feed, TelemetrySample } from '@/types';

// ─── Mock AI detections ──────────────────────────────────────

const MOCK_DETECTIONS = [
  { id: 'det-1', label: 'Small Craft', contactCode: 'C-1042', conf: 0.91, bbox: [0.15, 0.25, 0.28, 0.45] as [number,number,number,number], headingDeg: 42, speedKnots: 4.2, colour: '#6FB7D6', trail: [[0.14,0.44],[0.145,0.43],[0.15,0.42]] },
  { id: 'det-2', label: 'Vessel', contactCode: 'C-1038', conf: 0.87, bbox: [0.55, 0.30, 0.70, 0.55] as [number,number,number,number], headingDeg: 195, speedKnots: 2.1, colour: '#2B7FA6', trail: [[0.54,0.53],[0.545,0.52],[0.55,0.51]] },
  { id: 'det-3', label: 'Person ×3', contactCode: null, conf: 0.78, bbox: [0.78, 0.55, 0.88, 0.80] as [number,number,number,number], headingDeg: undefined, speedKnots: undefined, colour: '#E06A3B', trail: [] },
];

// ─── Video tile with canvas overlay ──────────────────────────

interface FeedTileProps {
  feed: Feed;
  isActive: boolean;
  isFocus: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  showOverlays: boolean;
}

function FeedTile({ feed, isActive, isFocus, onClick, onDoubleClick, showOverlays }: FeedTileProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);

  // Draw AI overlay on canvas (aligned to video)
  const drawOverlays = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showOverlays) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (feed.state !== 'LIVE' && feed.state !== 'RECORDED') return;

    MOCK_DETECTIONS.forEach(det => {
      const [x1, y1, x2, y2] = det.bbox;
      const bx = x1 * W, by = y1 * H, bw = (x2 - x1) * W, bh = (y2 - y1) * H;

      // Bounding box
      ctx.strokeStyle = det.colour;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);

      // Trail
      if (det.trail.length > 0) {
        ctx.beginPath();
        ctx.moveTo(det.trail[0][0] * W, det.trail[0][1] * H);
        det.trail.forEach(pt => ctx.lineTo(pt[0] * W, pt[1] * H));
        ctx.lineTo(bx + bw / 2, by + bh);
        ctx.strokeStyle = det.colour + '80';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Label background
      const label = `${det.label} ${det.contactCode ? `· ${det.contactCode}` : ''} ${(det.conf * 100).toFixed(0)}%`;
      ctx.font = '11px JetBrains Mono, monospace';
      const textW = ctx.measureText(label).width;
      ctx.fillStyle = det.colour + 'CC';
      ctx.fillRect(bx, by - 18, textW + 8, 18);

      // Label text
      ctx.fillStyle = 'white';
      ctx.fillText(label, bx + 4, by - 5);

      // Speed/heading if available
      if (det.speedKnots !== undefined) {
        const sub = `${det.speedKnots.toFixed(1)} kn · ${formatDeg(det.headingDeg ?? 0)}`;
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillStyle = det.colour + 'BB';
        ctx.fillRect(bx, by + bh, ctx.measureText(sub).width + 8, 16);
        ctx.fillStyle = 'white';
        ctx.fillText(sub, bx + 4, by + bh + 12);
      }
    });

    animRef.current = requestAnimationFrame(drawOverlays);
  }, [feed.state, showOverlays]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(drawOverlays);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [drawOverlays]);

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
      {/* Video placeholder */}
      <div className="absolute inset-0 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #030C14 0%, #0D2235 50%, #030C14 100%)' }}
      >
        {feed.state === 'NO_SIGNAL' ? (
          <div className="text-center">
            <div className="text-red-400 font-mono text-sm font-bold mb-1">NO SIGNAL</div>
            <div className="w-12 h-0.5 bg-red-600/50 mx-auto mb-1" />
            <div className="text-red-400/60 font-mono text-xs">Feed lost {timeAgo(feed.lastFrameAt ?? new Date().toISOString())}</div>
          </div>
        ) : feed.state === 'EDGE_SYNC_LAG' ? (
          <div className="text-center">
            <div className="text-purple-400 font-mono text-xs font-bold mb-1">EDGE SYNC LAG</div>
            <div className="text-purple-400/60 font-mono text-xs">{feed.edgeSyncLagSec}s behind</div>
          </div>
        ) : (
          // Sea / horizon placeholder
          <svg viewBox="0 0 400 225" className="w-full h-full opacity-30">
            <rect width="400" height="225" fill="#030C14"/>
            <path d="M0 140 Q100 130 200 140 Q300 150 400 135 L400 225 L0 225 Z" fill="#0A2035"/>
            <path d="M0 150 Q100 140 200 150 Q300 160 400 145" fill="none" stroke="#1A4060" strokeWidth="1"/>
            {/* Drone scan lines */}
            <line x1="0" y1="50" x2="400" y2="50" stroke="#2B7FA6" strokeWidth="0.5" strokeDasharray="8,12" opacity="0.3"/>
            <line x1="0" y1="100" x2="400" y2="100" stroke="#2B7FA6" strokeWidth="0.5" strokeDasharray="8,12" opacity="0.2"/>
          </svg>
        )}
      </div>

      {/* Canvas overlay */}
      {feed.state !== 'NO_SIGNAL' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          width={640}
          height={360}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Overlay HUD */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5">
        <FeedStateChip state={feed.state} size="sm" />
        <ModalityChip modality={feed.modality} size="sm" />
      </div>

      {/* Latency */}
      {feed.state === 'LIVE' && (
        <div className="absolute top-2 right-2 font-mono text-[10px] text-white/60 bg-black/50 px-1.5 py-0.5 rounded">
          ≈{Math.round(feed.latencyMs ?? 0)}ms
        </div>
      )}

      {/* Label */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-white/90 font-medium">{feed.label}</span>
          {feed.fpsCurrent !== undefined && feed.fpsCurrent > 0 && (
            <span className="font-mono text-[10px] text-white/50">{Math.round(feed.fpsCurrent)}fps</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Focus Mode ──────────────────────────────────────────────

function FocusMode({ feed, onExit }: { feed: Feed; onExit: () => void }) {
  const [overlays, setOverlays] = useState({ boxes: true, ids: true, trails: true, zones: true, conf: false });
  const [modality, setModality] = useState<'RGB' | 'THERMAL' | 'SPLIT'>('RGB');
  const [playing, setPlaying] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const { telemetry } = useFeedStore();
  const tele = telemetry[feed.id] ?? feed.telemetry;
  const navigate = useNavigate();

  // Draw overlays
  const drawFocus = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (!overlays.boxes) { animRef.current = requestAnimationFrame(drawFocus); return; }

    MOCK_DETECTIONS.forEach(det => {
      const [x1, y1, x2, y2] = det.bbox;
      const bx = x1 * W, by = y1 * H, bw = (x2 - x1) * W, bh = (y2 - y1) * H;

      ctx.strokeStyle = det.colour;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(bx, by, bw, bh);

      if (overlays.trails && det.trail.length > 0) {
        ctx.beginPath();
        ctx.moveTo(det.trail[0][0] * W, det.trail[0][1] * H);
        det.trail.forEach(pt => ctx.lineTo(pt[0] * W, pt[1] * H));
        ctx.lineTo(bx + bw / 2, by + bh);
        ctx.strokeStyle = det.colour + '80';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (overlays.ids || overlays.conf) {
        const parts = [];
        if (overlays.ids) parts.push(`${det.label}${det.contactCode ? ` · ${det.contactCode}` : ''}`);
        if (overlays.conf) parts.push(`${(det.conf * 100).toFixed(0)}%`);
        const label = parts.join(' ');
        ctx.font = 'bold 12px JetBrains Mono, monospace';
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = det.colour + 'DD';
        ctx.fillRect(bx, by - 20, tw + 10, 20);
        ctx.fillStyle = 'white';
        ctx.fillText(label, bx + 5, by - 6);
      }

      if (det.speedKnots !== undefined) {
        const sub = `${det.speedKnots.toFixed(1)} kn  ${formatDeg(det.headingDeg ?? 0)}`;
        ctx.font = '11px JetBrains Mono, monospace';
        const sw = ctx.measureText(sub).width;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(bx, by + bh + 2, sw + 10, 18);
        ctx.fillStyle = det.colour;
        ctx.fillText(sub, bx + 5, by + bh + 15);
      }
    });

    if (overlays.zones) {
      // Zone boundary overlay
      ctx.strokeStyle = '#C8352E';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 6]);
      ctx.strokeRect(30, 40, W - 60, H - 80);
      ctx.setLineDash([]);
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.fillStyle = '#C8352E99';
      ctx.fillRect(30, 20, 120, 18);
      ctx.fillStyle = 'white';
      ctx.fillText('Z-07 RESTRICTED', 35, 32);
    }

    animRef.current = requestAnimationFrame(drawFocus);
  }, [overlays]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(drawFocus);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [drawFocus]);

  // Timeline ticks (mock event markers)
  const timelineEvents = ALERTS.slice(0, 8).map((a, i) => ({
    pct: (i + 1) / 9,
    severity: a.severity,
    label: a.alertCode,
  }));

  return (
    <div className="flex h-full overflow-hidden">
      {/* Video + controls */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Modality / overlay controls */}
        <div
          className="flex items-center gap-3 px-3 py-1.5 border-b flex-shrink-0"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
        >
          <button onClick={onExit} className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1">
            <Minimize2 className="w-3.5 h-3.5" /> Grid View
          </button>
          <div className="h-4 w-px" style={{ background: 'var(--line)' }} />
          {/* Modality toggle */}
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--line)' }}>
            {(['RGB', 'THERMAL', 'SPLIT'] as const).map(m => (
              <button
                key={m}
                className={cn('px-2.5 py-1 text-xs font-mono font-medium transition-colors', modality === m ? 'text-white' : 'opacity-50')}
                style={{ background: modality === m ? 'var(--sea-600)' : 'var(--raised)' }}
                onClick={() => setModality(m)}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="h-4 w-px" style={{ background: 'var(--line)' }} />
          {/* Overlay toggles */}
          <div className="flex items-center gap-2 text-xs">
            <Eye className="w-3.5 h-3.5 opacity-50" />
            {(Object.entries(overlays) as [keyof typeof overlays, boolean][]).map(([key, val]) => (
              <button
                key={key}
                className={cn('px-1.5 py-0.5 rounded border text-xs transition-colors', val ? 'border-[var(--sea-400)]' : 'opacity-40')}
                style={{ borderColor: val ? 'var(--sea-400)' : 'var(--line)' }}
                onClick={() => setOverlays(prev => ({ ...prev, [key]: !prev[key] }))}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Video + canvas */}
        <div className="flex-1 relative bg-black overflow-hidden">
          {/* Placeholder sea/horizon */}
          <svg viewBox="0 0 800 450" className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="xMidYMid slice">
            <rect width="800" height="450" fill="#030C14"/>
            <path d="M0 280 Q200 260 400 275 Q600 290 800 265 L800 450 L0 450 Z" fill="#061828"/>
            <path d="M0 290 Q200 270 400 285 Q600 300 800 275" fill="none" stroke="#1A4060" strokeWidth="1.5" opacity="0.6"/>
            {/* Horizon haze */}
            <linearGradient id="hazeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2B7FA6" stopOpacity="0.05"/>
              <stop offset="100%" stopColor="#2B7FA6" stopOpacity="0"/>
            </linearGradient>
            <rect width="800" height="200" fill="url(#hazeGrad)"/>
          </svg>

          {/* Canvas overlay */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            width={1280}
            height={720}
            style={{ pointerEvents: 'none' }}
          />

          {/* Feed info overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <FeedStateChip state={feed.state} />
            <ModalityChip modality={modality === 'SPLIT' ? 'RGB' : modality} />
            <span className="font-mono text-xs text-white/60 bg-black/50 px-2 py-0.5 rounded">
              {feed.uavCode} · {tele?.lat.toFixed(4)}°N {tele?.lon.toFixed(4)}°E
            </span>
          </div>

          {modality === 'SPLIT' && (
            <div className="absolute inset-0 left-1/2 border-l-2 border-white/20 flex items-center justify-center" style={{ pointerEvents: 'none' }}>
              <div className="bg-black/60 text-white/60 text-xs font-mono px-2 py-1 rounded">THERMAL →</div>
            </div>
          )}
        </div>

        {/* DVR controls + tide timeline */}
        <div className="flex-shrink-0 border-t px-3 py-2" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          {/* Transport */}
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setPlaying(!playing)} className="p-1.5 rounded-lg hover:bg-[var(--raised)] transition-colors">
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button className="p-1.5 rounded-lg hover:bg-[var(--raised)] transition-colors opacity-60">
              <SkipBack className="w-4 h-4" />
            </button>
            <div
              className="flex-1 rounded-full h-1.5 relative cursor-pointer"
              style={{ background: 'var(--line)' }}
            >
              {/* Scrubber */}
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: '65%', background: 'var(--sea-400)' }} />
              <div className="absolute top-1/2 -translate-y-1/2" style={{ left: '65%', marginLeft: '-6px' }}>
                <div className="w-3 h-3 rounded-full bg-white border-2 border-[var(--sea-600)] shadow" />
              </div>
            </div>
            <span className="font-mono text-xs opacity-60">LIVE</span>
          </div>

          {/* Tide timeline */}
          <div className="relative h-8">
            <svg viewBox="0 0 800 32" className="w-full h-full" preserveAspectRatio="none">
              {/* Area curve (activity level) */}
              <defs>
                <linearGradient id="tideGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6FB7D6" stopOpacity="0.5"/>
                  <stop offset="100%" stopColor="#6FB7D6" stopOpacity="0.05"/>
                </linearGradient>
              </defs>
              <path
                d="M0 28 Q50 20 100 24 Q150 28 200 18 Q250 8 300 14 Q350 20 400 10 Q450 4 500 12 Q550 20 600 16 Q650 10 700 8 Q750 12 800 14 L800 32 L0 32 Z"
                fill="url(#tideGrad)"
              />
              <path
                d="M0 28 Q50 20 100 24 Q150 28 200 18 Q250 8 300 14 Q350 20 400 10 Q450 4 500 12 Q550 20 600 16 Q650 10 700 8 Q750 12 800 14"
                fill="none" stroke="#6FB7D6" strokeWidth="1.5"
              />
              {/* Event ticks */}
              {timelineEvents.map((ev, i) => {
                const x = ev.pct * 800;
                const colours: Record<string, string> = { CRITICAL:'#C8352E', HIGH:'#E06A3B', MEDIUM:'#E0A526', LOW:'#3FAE9A', INFO:'#2B7FA6' };
                return (
                  <line key={i} x1={x} y1="4" x2={x} y2="28"
                    stroke={colours[ev.severity] ?? '#2B7FA6'}
                    strokeWidth="2" opacity="0.8"
                  />
                );
              })}
            </svg>
          </div>
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

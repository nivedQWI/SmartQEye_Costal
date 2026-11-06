// ============================================================
// SmartQEye Coastal — Crowd Analytics (/crowd-analytics)
// As specified in Costal Police .docx
// ============================================================

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Users, TrendingUp, TrendingDown, AlertTriangle,
  Download, Activity, Sparkles,
  Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis,
  YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { cn } from '@/lib/utils';
import { UAVS } from '@/lib/mockData';

// ─── Live crowd model ─────────────────────────────────────────

const PEAK_COUNT = 570;
const FLOOR_COUNT = 190;
const TICK_MS = 2500;
const SERIES_WINDOW = 40;

interface CrowdPoint {
  time: string;
  count: number;
}

function formatIstTime(d: Date): string {
  return d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Build-up history ending exactly at the peak (the moment the page opens). */
function seedSeries(): CrowdPoint[] {
  const now = Date.now();
  const buildUp = [418, 436, 451, 470, 487, 503, 519, 534, 548, 559, 566, PEAK_COUNT];
  return buildUp.map((count, i) => ({
    time: formatIstTime(new Date(now - (buildUp.length - 1 - i) * TICK_MS)),
    count,
  }));
}

// Monitored coastal polygons — each holds a fixed share of the live head count
const SECTORS = [
  { id: 'z-1', name: 'Kovalam Lighthouse Beach Promenade', areaM2: 420, share: 0.30 },
  { id: 'z-2', name: 'Hawa Beach Entrance Bottleneck', areaM2: 120, share: 0.32 },
  { id: 'z-3', name: 'Samudra Beach North Steps', areaM2: 95, share: 0.26 },
  { id: 'z-4', name: 'Vizhinjam Fishing Harbor Fish Landing Wharf', areaM2: 260, share: 0.12 },
] as const;

type SectorStatus = 'LOW' | 'MEDIUM' | 'HIGH';

function deriveZones(total: number) {
  // Allocate by share; give any rounding remainder to the first sector so the table sums to `total`
  const counts = SECTORS.map(s => Math.round(total * s.share));
  counts[0] += total - counts.reduce((a, b) => a + b, 0);
  return SECTORS.map((s, i) => {
    const ppm2 = parseFloat((counts[i] / s.areaM2).toFixed(2));
    const status: SectorStatus = ppm2 >= 1.2 ? 'HIGH' : ppm2 >= 0.6 ? 'MEDIUM' : 'LOW';
    return { id: s.id, name: s.name, areaM2: s.areaM2, count: counts[i], ppm2, status };
  });
}

export default function CrowdAnalyticsPage() {
  const [selectedDrone, setSelectedDrone] = useState('UAV-KL-02');
  const [selectedModel, setSelectedModel] = useState<'CSRNet Part A' | 'CSRNet Part B' | 'DM-Count' | 'RTMDet-Crowd'>('CSRNet Part A');
  // Video stream state and controls
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Auto-play recovery on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.defaultMuted = true;
    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, []);

  function togglePlay() {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }

  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  }

  function restartVideo() {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
  }

  function toggleFullscreen() {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen?.();
    }
  }

  // ── Live crowd series (single source of truth for KPIs, chart and sector table) ──
  // Peak is fixed at PEAK_COUNT; the live count starts at the peak and ebbs
  // gradually towards a dispersal floor, then fluctuates around it.
  const [series, setSeries] = useState<CrowdPoint[]>(() => seedSeries());
  const [peakTime] = useState(() => formatIstTime(new Date()));

  const currentCount = series[series.length - 1].count;
  const prevCount = series.length > 1 ? series[series.length - 2].count : currentCount;
  const isIncreasing = currentCount > prevCount;

  // Sector breakdown derived from the live count (sums to currentCount)
  const zones = useMemo(() => deriveZones(currentCount), [currentCount]);
  const peakSectorDensity = Math.max(...zones.map(z => z.ppm2));
  const densityPpm2 = parseFloat(peakSectorDensity.toFixed(2));
  const densityRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' =
    peakSectorDensity >= 1.8 ? 'CRITICAL' : peakSectorDensity >= 1.2 ? 'HIGH' : peakSectorDensity >= 0.6 ? 'MEDIUM' : 'LOW';
  const activeAlerts = zones.filter(z => z.status === 'HIGH').length;

  // Alert Log
  const [alertLog] = useState([
    { id: 'c-alt-1', time: '18:42 IST', type: 'CROWD_SURGE', location: 'Hawa Beach Chokepoint', severity: 'HIGH', note: 'Threshold 1.8 p/m² exceeded' },
    { id: 'c-alt-2', time: '17:15 IST', type: 'DENSITY_PEAK', location: 'Lighthouse Promenade', severity: 'CRITICAL', note: 'Stampede risk buffer <15%' },
    { id: 'c-alt-3', time: '14:20 IST', type: 'BOTTLENECK_WARNING', location: 'North Steps Access', severity: 'MEDIUM', note: 'Egress rate lagging intake' },
  ]);

  // Live tick: gradual dispersal from the peak, then fluctuation near the floor
  useEffect(() => {
    const id = setInterval(() => {
      setSeries(prev => {
        const last = prev[prev.length - 1].count;
        let next: number;
        if (last > FLOOR_COUNT + 10) {
          // Ebbing phase: drop 2–7 persons per tick, occasional tiny uptick
          const delta = Math.random() < 0.12 ? Math.floor(Math.random() * 3) : -(2 + Math.floor(Math.random() * 6));
          next = last + delta;
        } else {
          // Settled phase: fluctuate ±4 around the floor band
          next = last + Math.floor(Math.random() * 9) - 4;
        }
        next = Math.max(FLOOR_COUNT - 5, Math.min(PEAK_COUNT, next));
        const point = { time: formatIstTime(new Date()), count: next };
        return [...prev, point].slice(-SERIES_WINDOW);
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  function handleExportCsv() {
    const rows = [
      ['Zone Name', 'Area (m2)', 'Current Count', 'Density (p/m2)', 'Status'],
      ...zones.map(z => [z.name, z.areaM2, z.count, z.ppm2, z.status])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `crowd_analytics_${selectedDrone}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto chart-paper p-4 md:p-6 gap-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Crowd Analytics &amp; Congestion Density
          </h1>
          <p className="text-xs opacity-70" style={{ color: 'var(--text-muted)' }}>
            Real-time head counts, CSRNet neural density estimation, surge warning thresholds, and export tools
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors bg-[var(--sand-200)] text-[var(--ink-900)] hover:bg-[var(--sand-300)]"
            style={{ borderColor: 'var(--sand-300)' }}
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          TOP CONTROLS STRIP
         ══════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-2xl border"
        style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}>
        {/* Drone selector pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-bold opacity-60">UAV FEED:</span>
          {UAVS.slice(0, 4).map(u => (
            <button
              key={u.id}
              onClick={() => setSelectedDrone(u.droneCode)}
              className={cn(
                'px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all',
                selectedDrone === u.droneCode
                  ? 'bg-[var(--sea-600)] text-white border-[var(--sea-600)] shadow-xs'
                  : 'bg-[var(--panel)] border-[var(--line)] opacity-70 hover:opacity-100'
              )}
            >
              {u.droneCode}
            </button>
          ))}
        </div>

        {/* Model dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold opacity-60">MODEL:</span>
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold border outline-none"
            style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)' }}
          >
            <option value="CSRNet Part A">CSRNet Part A (Dense Harbor)</option>
            <option value="CSRNet Part B">CSRNet Part B (Sparse Beach)</option>
            <option value="DM-Count">DM-Count (High Res)</option>
            <option value="RTMDet-Crowd">RTMDet-Crowd Head Detector (MMDetection)</option>
          </select>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          TOP-CENTER: 4 KPI CARDS STRIP (DOCX SPEC)
         ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: CURRENT COUNT */}
        <div className="rounded-2xl p-4 border shadow-sm" style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between text-xs opacity-60 mb-1">
            <span className="font-bold uppercase tracking-wider">Current Count</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight">{currentCount.toLocaleString()}</span>
            <span className={cn('text-xs font-bold flex items-center', isIncreasing ? 'text-red-500' : 'text-emerald-500')}>
              {isIncreasing ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
              {isIncreasing ? '↑ Surge' : '↓ Ebbing'}
            </span>
          </div>
          <p className="text-[11px] opacity-60 font-mono mt-1">Live head detection count</p>
        </div>

        {/* Card 2: PEAK COUNT */}
        <div className="rounded-2xl p-4 border shadow-sm" style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between text-xs opacity-60 mb-1">
            <span className="font-bold uppercase tracking-wider">Peak Count</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-bold font-mono tracking-tight">{PEAK_COUNT.toLocaleString()}</div>
          <p className="text-[11px] opacity-75 font-mono mt-1 text-amber-600 dark:text-amber-400 font-semibold">
            At {peakTime} IST (Sunset Surge)
          </p>
        </div>

        {/* Card 3: DRONE ALERTS ACTIVE */}
        <div className="rounded-2xl p-4 border shadow-sm" style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between text-xs opacity-60 mb-1">
            <span className="font-bold uppercase tracking-wider">Drone Alerts Active</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-red-600 tracking-tight">{activeAlerts}</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-red-100 text-red-800">BREACH</span>
          </div>
          <p className="text-[11px] opacity-60 font-mono mt-1">Density threshold exceeded</p>
        </div>

        {/* Card 4: DENSITY STATUS */}
        <div className="rounded-2xl p-4 border shadow-sm" style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between text-xs opacity-60 mb-1">
            <span className="font-bold uppercase tracking-wider">Density Status</span>
            <Sparkles className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              'text-2xl font-bold font-mono uppercase',
              densityRating === 'CRITICAL' ? 'text-red-600' : 'text-amber-500'
            )}>
              {densityRating}
            </span>
            <span className="text-sm font-mono font-bold opacity-80">({densityPpm2} p/m²)</span>
          </div>
          <p className="text-[11px] opacity-60 font-mono mt-1">Safety max threshold: 2.0 p/m²</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          MIDDLE: 60% LIVE CAMERA + 40% 24H AREA CHART
         ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left (60% / 3 cols): Live Drone Video Stream — UAV-KL-02 */}
        <div
          className="lg:col-span-3 rounded-2xl p-4 border shadow-sm flex flex-col justify-between"
          style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-serif text-sm font-bold">
                Live Drone Video Stream — {selectedDrone}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                STREAM 1080P @ 30 FPS
              </span>
            </div>
          </div>

          {/* Live Drone Video Player (Clean video without overlays) */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border flex items-center justify-center select-none group" style={{ borderColor: 'var(--line)' }}>
            <video
              ref={videoRef}
              src="/videos/Crowd_Video.mp4"
              autoPlay
              muted={isMuted}
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onLoadedData={() => {
                if (videoRef.current) {
                  videoRef.current.muted = true;
                  videoRef.current.play().catch(() => {});
                }
              }}
            />

            {/* Click to start if browser blocked autoplay */}
            {!isPlaying && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs cursor-pointer group transition-all"
              >
                <div className="p-3 rounded-full bg-sky-600/90 text-white shadow-xl group-hover:scale-110 transition-transform flex items-center justify-center">
                  <Play className="w-6 h-6 ml-0.5" />
                </div>
                <span className="mt-2 text-[10px] font-mono font-bold text-white bg-black/70 px-2.5 py-0.5 rounded border border-white/20">
                  CLICK TO START STREAM
                </span>
              </div>
            )}

            {/* Bottom controls bar (hidden until hover) */}
            <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between text-[10px] font-mono text-slate-200 bg-slate-950/85 backdrop-blur-xs p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center gap-1">
                <button
                  onClick={togglePlay}
                  className="p-1 rounded hover:bg-white/10 cursor-pointer"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={toggleMute}
                  className="p-1 rounded hover:bg-white/10 cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={restartVideo}
                  className="p-1 rounded hover:bg-white/10 cursor-pointer"
                  title="Restart"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sky-400 hidden sm:inline">CROWD STREAM — {selectedDrone}</span>
                <button
                  onClick={toggleFullscreen}
                  className="p-1 rounded hover:bg-white/10 cursor-pointer"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right (40% / 2 cols): Crowd Analysis Area Chart */}
        <div
          className="lg:col-span-2 rounded-2xl p-4 border shadow-sm flex flex-col justify-between"
          style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-serif text-sm font-bold">Crowd Analysis</h3>
            <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-bold">
              Live: {currentCount} | Peak: {PEAK_COUNT}
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="crowdAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2B7FA6" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#2B7FA6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="time" stroke="#888888" fontSize={10} minTickGap={28} />
                <YAxis stroke="#888888" fontSize={10} domain={[0, 600]} ticks={[0, 100, 200, 300, 400, 500, 600]} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--raised)',
                    borderColor: 'var(--line)',
                    borderRadius: 12,
                    fontSize: 12,
                    color: 'var(--text)',
                  }}
                  formatter={(value: any) => [`${value} persons`, 'Head Count']}
                  labelFormatter={(label: any) => `${label} IST`}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#2B7FA6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#crowdAreaGrad)"
                  name="Head Count"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] opacity-65 font-mono text-center mt-2">
            Live head count (IST) · updates every {TICK_MS / 1000}s · Peak {PEAK_COUNT} → dispersal
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          BOTTOM: DENSITY LEVEL DISTRIBUTION TABLE & ALERTS
         ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Density Distribution Table (2 Cols) */}
        <div
          className="lg:col-span-2 rounded-2xl p-5 border shadow-sm"
          style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: 'var(--line)' }}>
            <h3 className="font-serif text-sm font-bold">Density Level Distribution by Sector</h3>
            <span className="text-xs opacity-60">Monitored Coastal Polygons</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b font-mono opacity-60 uppercase text-[11px]" style={{ borderColor: 'var(--line)' }}>
                  <th className="py-2.5 px-3">Zone Sector</th>
                  <th className="py-2.5 px-3">Area (m²)</th>
                  <th className="py-2.5 px-3">Head Count</th>
                  <th className="py-2.5 px-3">Density (p/m²)</th>
                  <th className="py-2.5 px-3 text-right">Safety Status</th>
                </tr>
              </thead>
              <tbody>
                {zones.map(z => (
                  <tr key={z.id} className="border-b transition-colors hover:bg-[var(--surface-hover)]" style={{ borderColor: 'var(--line)', color: 'var(--text)' }}>
                    <td className="py-2.5 px-3 font-semibold">{z.name}</td>
                    <td className="py-2.5 px-3 font-mono">{z.areaM2} m²</td>
                    <td className="py-2.5 px-3 font-mono font-bold">{z.count}</td>
                    <td className="py-2.5 px-3 font-mono font-bold">{z.ppm2} p/m²</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-mono font-bold border',
                        z.status === 'HIGH' && 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40',
                        z.status === 'MEDIUM' && 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/40',
                        z.status === 'LOW' && 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40'
                      )}>
                        {z.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alert Incident Log (1 Col) */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between"
          style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: 'var(--line)' }}>
              <h3 className="font-serif text-sm font-bold">Crowd Incident Alarms</h3>
              <span className="text-xs font-mono text-red-600 font-bold">Live</span>
            </div>

            <div className="space-y-2.5">
              {alertLog.map(a => (
                <div key={a.id} className="p-2.5 rounded-xl border" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold font-mono text-red-600">{a.type}</span>
                    <span className="font-mono opacity-60">{a.time}</span>
                  </div>
                  <div className="text-xs font-semibold">{a.location}</div>
                  <div className="text-[11px] opacity-70 mt-0.5">{a.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

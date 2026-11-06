// ============================================================
// SmartQEye Coastal — Anomaly Monitor (/anomaly-monitor)
// As specified in Costal Police .docx
// ============================================================

import { useState, useRef, useEffect, type ReactNode } from 'react';
import {
  AlertTriangle, ShieldAlert, Play, Pause, RotateCcw,
  Download, Filter, Search, CheckCircle, Clock,
  Video, Eye, AlertOctagon, TrendingUp, Sliders,
  Volume2, VolumeX, Maximize2
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { cn } from '@/lib/utils';
import { AnomalyRecord, AnomalyType } from '@/types';
import { HumanInterpretationNote } from '@/components/HumanInterpretationNote';
import { SideDrawer } from '@/components/SideDrawer';

// Real-Time Behavioral Outlier Ledger: All Anomaly Types set to ERRATIC SPEEDING
const INITIAL_ANOMALIES: AnomalyRecord[] = [
  {
    id: 'anom-01',
    category: 'MARINE',
    anomalyType: 'ERRATIC_SPEEDING',
    riskScore: 92,
    droneCode: 'UAV-KL-02',
    timestamp: '19:42:15 IST',
    clipReplaySec: 20,
    description: 'Track #01: High-speed yacht accelerating abruptly to 38.6 knots in restricted coastal fairway zone.',
    status: 'NEW'
  },
  {
    id: 'anom-02',
    category: 'TRAFFIC',
    anomalyType: 'ERRATIC_SPEEDING',
    riskScore: 96,
    droneCode: 'UAV-KL-02',
    timestamp: '19:35:40 IST',
    clipReplaySec: 20,
    description: 'Vehicle KL-16-J-8812 proceeding at erratic high speed of 84 km/h in harbor access terminal bypass.',
    status: 'ESCALATED'
  },
  {
    id: 'anom-03',
    category: 'PERSON',
    anomalyType: 'ERRATIC_SPEEDING',
    riskScore: 88,
    droneCode: 'UAV-KL-02',
    timestamp: '19:12:05 IST',
    clipReplaySec: 20,
    description: 'Individual on high-speed motorized watercraft zig-zagging erratically in swimmer safety buffer.',
    status: 'REVIEWED'
  },
  {
    id: 'anom-04',
    category: 'MARINE',
    anomalyType: 'ERRATIC_SPEEDING',
    riskScore: 94,
    droneCode: 'UAV-KL-02',
    timestamp: '18:55:18 IST',
    clipReplaySec: 20,
    description: 'Track #04: Unidentified vessel zig-zagging at 46.6 knots within 50m of commercial cargo fairway.',
    status: 'ESCALATED'
  },
  {
    id: 'anom-05',
    category: 'PERSON',
    anomalyType: 'ERRATIC_SPEEDING',
    riskScore: 90,
    droneCode: 'UAV-KL-02',
    timestamp: '18:20:10 IST',
    clipReplaySec: 20,
    description: 'Erratic speeding jet-ski operated dangerously close to Kovalam rocky slope shoreline.',
    status: 'REVIEWED'
  },
  {
    id: 'anom-06',
    category: 'TRAFFIC',
    anomalyType: 'ERRATIC_SPEEDING',
    riskScore: 85,
    droneCode: 'UAV-KL-02',
    timestamp: '17:40:55 IST',
    clipReplaySec: 20,
    description: 'White sedan clocked in erratic high-speed acceleration reaching 92 km/h on coastal road.',
    status: 'FALSE_POSITIVE'
  }
];

// Forensic detail for each ledger instance (shown in the detail drawer)
interface AnomalyDetail {
  subjectId: string;
  subjectLabel: string;
  location: string;
  sector: string;
  lat: number;
  lon: number;
  confidence: number; // 0-1
  durationSec: number;
  observedMetric: string;
  threshold: string;
  model: string;
  factors: { name: string; value: string; weight: 'PRIMARY' | 'SUPPORTING' | 'CONTEXTUAL' }[];
  recommendedAction: string;
}

const ANOMALY_DETAILS: Record<string, AnomalyDetail> = {
  'anom-01': {
    subjectId: 'TRK-01', subjectLabel: 'High-speed yacht',
    location: 'Vizhinjam Outer Fairway', sector: 'Z-01 Vizhinjam Deepwater Seaport & Approach',
    lat: 8.3764, lon: 76.9791, confidence: 0.93, durationSec: 46,
    observedMetric: '38.6 kn peak speed', threshold: '16 kn fairway limit',
    model: 'RTMDet-L v2.4.1 + ByteTrack kinematics',
    factors: [
      { name: 'Speed above fairway limit', value: '38.6 kn vs 16 kn', weight: 'PRIMARY' },
      { name: 'Abrupt acceleration', value: '+22 kn in 9 s', weight: 'PRIMARY' },
      { name: 'Zone sensitivity', value: 'Restricted 24×7', weight: 'CONTEXTUAL' },
      { name: 'Track continuity', value: '0.95', weight: 'SUPPORTING' },
    ],
    recommendedAction: 'Alert Vizhinjam Coastal Police Station; dispatch interceptor boat to fairway entrance and verify vessel registration.',
  },
  'anom-02': {
    subjectId: 'KL-16-J-8812', subjectLabel: 'Passenger car',
    location: 'Harbour Access Terminal Bypass', sector: 'Vizhinjam Port Road',
    lat: 8.3810, lon: 76.9862, confidence: 0.96, durationSec: 31,
    observedMetric: '84 km/h', threshold: '30 km/h port-area limit',
    model: 'RTMDet-L v2.4.1 + ANPR OCR v1.3',
    factors: [
      { name: 'Speed above road limit', value: '84 km/h vs 30 km/h', weight: 'PRIMARY' },
      { name: 'Lane deviation', value: '3 swerves', weight: 'SUPPORTING' },
      { name: 'Plate read confidence', value: '0.97', weight: 'SUPPORTING' },
    ],
    recommendedAction: 'Pass plate KL-16-J-8812 to Traffic Police checkpoint at Vizhinjam junction for interception.',
  },
  'anom-03': {
    subjectId: 'TRK-03', subjectLabel: 'Person on personal watercraft',
    location: 'Kovalam Swimmer Safety Buffer', sector: 'Z-02 Kovalam Beach & Lighthouse Bay',
    lat: 8.3992, lon: 76.9845, confidence: 0.88, durationSec: 58,
    observedMetric: '7 zig-zag turns / min', threshold: '2 turns / min',
    model: 'RTMDet-L v2.4.1 + ST-GCN behaviour head',
    factors: [
      { name: 'Erratic heading changes', value: '7 / min', weight: 'PRIMARY' },
      { name: 'Distance to swimmers', value: '< 15 m', weight: 'PRIMARY' },
      { name: 'Time window', value: 'Evening tourist peak', weight: 'CONTEXTUAL' },
    ],
    recommendedAction: 'Notify Kovalam Tourism Police and lifeguards; direct the rider out of the swimming zone.',
  },
  'anom-04': {
    subjectId: 'TRK-04', subjectLabel: 'Unidentified vessel',
    location: 'Commercial Cargo Fairway', sector: 'Z-05 Cochin Port & Naval Base Restricted Waters',
    lat: 9.9631, lon: 76.2297, confidence: 0.94, durationSec: 72,
    observedMetric: '46.6 kn, 50 m from cargo lane', threshold: '16 kn / 200 m buffer',
    model: 'RTMDet-L v2.4.1 + ByteTrack kinematics',
    factors: [
      { name: 'Speed above fairway limit', value: '46.6 kn', weight: 'PRIMARY' },
      { name: 'Proximity to cargo lane', value: '50 m', weight: 'PRIMARY' },
      { name: 'No AIS match', value: 'Unidentified', weight: 'SUPPORTING' },
      { name: 'Zone sensitivity', value: 'Restricted 24×7', weight: 'CONTEXTUAL' },
    ],
    recommendedAction: 'Inform Coast Guard liaison and Fort Kochi Coastal Police; request patrol boat to identify and escort the vessel.',
  },
  'anom-05': {
    subjectId: 'TRK-05', subjectLabel: 'Jet-ski rider',
    location: 'Kovalam Rocky Slope Shoreline', sector: 'Z-02 Kovalam Beach & Lighthouse Bay',
    lat: 8.3958, lon: 76.9821, confidence: 0.90, durationSec: 39,
    observedMetric: '12 m from rocks at 24 kn', threshold: '50 m safety distance',
    model: 'RTMDet-L v2.4.1 + ST-GCN behaviour head',
    factors: [
      { name: 'Unsafe shoreline distance', value: '12 m', weight: 'PRIMARY' },
      { name: 'Speed near rocks', value: '24 kn', weight: 'SUPPORTING' },
    ],
    recommendedAction: 'Warn the operator via beach PA; record the rental operator for follow-up by Kovalam Police.',
  },
  'anom-06': {
    subjectId: 'TRK-06', subjectLabel: 'White sedan',
    location: 'Kovalam–Vizhinjam Coastal Road', sector: 'Coastal Road NH-66 Spur',
    lat: 8.3902, lon: 76.9905, confidence: 0.85, durationSec: 22,
    observedMetric: '92 km/h', threshold: '40 km/h coastal road limit',
    model: 'RTMDet-L v2.4.1 + ByteTrack kinematics',
    factors: [
      { name: 'Speed above road limit', value: '92 km/h', weight: 'PRIMARY' },
      { name: 'Operator review', value: 'Speed estimate distorted by camera pan', weight: 'CONTEXTUAL' },
    ],
    recommendedAction: 'No action — marked false positive by operator (camera-pan speed artefact). Kept for model feedback.',
  },
};

const RISK_TO_ATTENTION = (score: number) =>
  score >= 90 ? 'CRITICAL' : score >= 80 ? 'ELEVATED' : score >= 60 ? 'ATTENTION' : 'ROUTINE';

// Telemetry timeline from 16331642_3840_2160_60fps_0m00s_to_0m20s_analytics.json
const VIDEO_ANALYTICS_TIMELINE = [
  { second: '00:00', speeding: 38, proximity: 140, erratic: 22, loitering: 0, total: 200, maxSpeed: 108.6 },
  { second: '00:01', speeding: 40, proximity: 173, erratic: 21, loitering: 0, total: 234, maxSpeed: 66.7 },
  { second: '00:02', speeding: 32, proximity: 193, erratic: 18, loitering: 0, total: 243, maxSpeed: 56.4 },
  { second: '00:03', speeding: 56, proximity: 240, erratic: 4, loitering: 0, total: 300, maxSpeed: 46.6 },
  { second: '00:04', speeding: 54, proximity: 240, erratic: 19, loitering: 30, total: 343, maxSpeed: 95.7 },
  { second: '00:05', speeding: 53, proximity: 240, erratic: 9, loitering: 60, total: 362, maxSpeed: 77.0 },
  { second: '00:06', speeding: 69, proximity: 230, erratic: 22, loitering: 49, total: 370, maxSpeed: 42.8 },
  { second: '00:07', speeding: 249, proximity: 152, erratic: 1, loitering: 0, total: 402, maxSpeed: 124.6 },
  { second: '00:08', speeding: 106, proximity: 71, erratic: 4, loitering: 0, total: 181, maxSpeed: 52.5 },
  { second: '00:09', speeding: 99, proximity: 42, erratic: 15, loitering: 0, total: 156, maxSpeed: 97.0 },
  { second: '00:10', speeding: 73, proximity: 20, erratic: 35, loitering: 0, total: 128, maxSpeed: 104.9 },
  { second: '00:11', speeding: 57, proximity: 8, erratic: 37, loitering: 0, total: 102, maxSpeed: 101.8 },
  { second: '00:12', speeding: 20, proximity: 4, erratic: 39, loitering: 0, total: 63, maxSpeed: 51.0 },
  { second: '00:13', speeding: 22, proximity: 0, erratic: 36, loitering: 0, total: 58, maxSpeed: 51.1 },
  { second: '00:14', speeding: 24, proximity: 0, erratic: 36, loitering: 0, total: 60, maxSpeed: 58.9 },
  { second: '00:15', speeding: 83, proximity: 0, erratic: 21, loitering: 0, total: 104, maxSpeed: 68.3 },
  { second: '00:16', speeding: 105, proximity: 0, erratic: 9, loitering: 0, total: 114, maxSpeed: 95.0 },
  { second: '00:17', speeding: 104, proximity: 0, erratic: 11, loitering: 0, total: 115, maxSpeed: 69.4 },
  { second: '00:18', speeding: 107, proximity: 4, erratic: 6, loitering: 0, total: 117, maxSpeed: 182.0 },
  { second: '00:19', speeding: 104, proximity: 0, erratic: 7, loitering: 0, total: 111, maxSpeed: 205.9 }
];

export default function AnomalyMonitorPage() {
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>(INITIAL_ANOMALIES);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyRecord>(INITIAL_ANOMALIES[0]);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PERSON' | 'TRAFFIC' | 'MARINE'>('ALL');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailThumb, setDetailThumb] = useState<string | null>(null);

  /** Select a ledger row and open its forensic detail drawer. */
  function openDetail(item: AnomalyRecord) {
    setSelectedAnomaly(item);
    // Grab the current replay frame as the evidence thumbnail (same-origin video → canvas is not tainted)
    let thumb: string | null = null;
    const v = videoRef.current;
    if (v && v.readyState >= 2 && v.videoWidth > 0) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = Math.round((480 * v.videoHeight) / v.videoWidth);
        canvas.getContext('2d')?.drawImage(v, 0, 0, canvas.width, canvas.height);
        thumb = canvas.toDataURL('image/jpeg', 0.8);
      } catch {
        thumb = null;
      }
    }
    setDetailThumb(thumb);
    setDetailOpen(true);
  }

  // Auto-play recovery on mount / anomaly selection
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.defaultMuted = true;
    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsVideoPlaying(true))
        .catch(() => setIsVideoPlaying(false));
    }
  }, [selectedAnomaly]);

  function toggleVideoPlay() {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsVideoPlaying(true);
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
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
    setIsVideoPlaying(true);
  }

  function toggleFullscreen() {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen?.();
    }
  }


  const filteredAnomalies = anomalies.filter(a => {
    if (categoryFilter !== 'ALL' && a.category !== categoryFilter) return false;
    return true;
  });

  function handleUpdateStatus(id: string, status: AnomalyRecord['status']) {
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    if (selectedAnomaly.id === id) {
      setSelectedAnomaly(prev => ({ ...prev, status }));
    }
  }

  function handleExportCsv() {
    const headers = ['Time', 'Anomaly Type', 'Category', 'Risk Score', 'Drone', 'Duration (s)', 'Status', 'Description'];
    const rows = filteredAnomalies.map(a => [
      a.timestamp,
      a.anomalyType,
      a.category,
      a.riskScore,
      a.droneCode,
      a.clipReplaySec,
      a.status,
      `"${a.description.replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `anomaly_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto chart-paper p-4 md:p-6 gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Behavioral Anomaly Monitor
            </h1>
            <span className="badge-navy text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
              KERALA POLICE AI
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Real-time behavioral outlier detection for pedestrian loitering, falls, fleeing &amp; high-risk traffic violations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="btn-navy text-xs flex items-center gap-1.5 px-3 py-1.5 rounded"
          >
            <Download className="w-3.5 h-3.5" />
            Export Anomaly Log
          </button>
        </div>
      </div>

      {/* ── 4 KPI Metric Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="card-sand p-3.5 flex flex-col justify-between border-l-4 border-l-red-600">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-red-900">
            High Risk Alerts (&gt;80)
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-red-700">
              {anomalies.filter(a => a.riskScore >= 80).length}
            </span>
            <span className="bg-red-100 text-red-800 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-red-300">
              CRITICAL
            </span>
          </div>
          <div className="text-[10px] text-red-800 font-semibold mt-1">Requires supervisor sign-off</div>
        </div>

        <div className="card-sand p-3.5 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Total Anomalies Today
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-[var(--sea-600)] dark:text-[var(--sea-accent)]">48</span>
            <TrendingUp className="w-4 h-4 opacity-60" style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>28 Person · 14 Traffic · 6 Marine</div>
        </div>

        <div className="card-sand p-3.5 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            False Positive Rate
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400">3.8%</span>
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-mono font-bold bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
              High Precision
            </span>
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>SlowFast + ST-GCN Ensembles</div>
        </div>

        <div className="card-sand p-3.5 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Avg Clip Replay Size
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold" style={{ color: 'var(--text)' }}>22.5s</span>
            <Video className="w-4 h-4 opacity-60" style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Buffered in GPU ring memory</div>
        </div>
      </div>

      {/* ── Main Section: Instant Clip Replay Scrubber & 24h Area Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Instant Video Clip Replay Player & Scrubber */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="card-sand p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[var(--sea-600)] dark:text-[var(--sea-accent)]" />
                <h2 className="font-serif text-sm font-bold text-[var(--text)]">
                  Instant Clip Replay — {selectedAnomaly.id} ({selectedAnomaly.anomalyType.replace('_', ' ')})
                </h2>
              </div>
              <span className={cn(
                "font-mono text-[10px] font-bold px-2 py-0.5 rounded border",
                selectedAnomaly.riskScore >= 80 ? "bg-red-100 text-red-800 border-red-300 animate-pulse" : "bg-amber-100 text-amber-800 border-amber-300"
              )}>
                RISK SCORE: {selectedAnomaly.riskScore} / 100
              </span>
            </div>

            {/* Instant Clip Replay — Anomaly Detection Video */}
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-[var(--border)] bg-slate-950 flex items-center justify-center select-none group">
              <video
                ref={videoRef}
                src="/videos/Anomaly_detection_video.mp4"
                autoPlay
                muted={isMuted}
                loop
                playsInline
                preload="auto"
                className="w-full h-full object-cover"
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onLoadedData={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = true;
                    videoRef.current.play().catch(() => {});
                  }
                }}
              />

              {!isVideoPlaying && (
                <div
                  onClick={toggleVideoPlay}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs cursor-pointer group transition-all"
                >
                  <div className="p-3 rounded-full bg-red-600/90 text-white shadow-xl group-hover:scale-110 transition-transform flex items-center justify-center">
                    <Play className="w-6 h-6 ml-0.5" />
                  </div>
                  <span className="mt-2 text-[10px] font-mono font-bold text-white bg-black/70 px-2.5 py-0.5 rounded border border-white/20">
                    CLICK TO PLAY ANOMALY REPLAY
                  </span>
                </div>
              )}

              {/* Bottom controls bar (hidden until hover) */}
              <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between text-[10px] font-mono text-slate-200 bg-slate-950/85 backdrop-blur-xs p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleVideoPlay}
                    className="p-1 rounded hover:bg-white/10 cursor-pointer"
                    title={isVideoPlaying ? 'Pause' : 'Play'}
                  >
                    {isVideoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
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
                  <span className="text-red-400 hidden sm:inline">ANOMALY FORENSIC REPLAY · 60 FPS</span>
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

            {/* Description & Action Bar */}
            <div className="p-3 bg-[var(--surface-muted)] rounded border border-[var(--border)] flex flex-col gap-2">

              {/* Description & Action Bar */}
              <div className="text-xs font-sans mt-1 p-2 bg-[var(--surface)] rounded border border-[var(--border)]" style={{ color: 'var(--text)' }}>
                <span className="font-bold" style={{ color: 'var(--text)' }}>Incident Narrative: </span>
                {selectedAnomaly.description}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedAnomaly.id, 'ESCALATED')}
                    className="px-2.5 py-1 rounded bg-red-700 hover:bg-red-800 text-white font-mono text-[11px] font-bold shadow-xs cursor-pointer"
                  >
                    Escalate to Police Control
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedAnomaly.id, 'FALSE_POSITIVE')}
                    className="px-2.5 py-1 rounded border font-mono text-[11px] font-bold transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
                    style={{
                      background: 'var(--raised)',
                      borderColor: 'var(--line)',
                      color: 'var(--text)',
                    }}
                  >
                    Mark False Positive
                  </button>
                </div>

                <button
                  onClick={() => handleUpdateStatus(selectedAnomaly.id, 'REVIEWED')}
                  className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-[11px] font-bold shadow-xs cursor-pointer"
                >
                  Mark Reviewed
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Video Analytics Anomaly Distribution Trend */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="card-sand p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-sm font-bold text-[var(--text)]">
                  Video Analytics Anomaly Distribution Trend
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  From detection analytics JSON (00:00–00:20 · 3,763 Total Events)
                </p>
              </div>
              <span className="badge-navy text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                15/20 ANOMALOUS
              </span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={VIDEO_ANALYTICS_TIMELINE} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="speedingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="proximityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="erraticGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                  <XAxis dataKey="second" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: 'var(--text)'
                    }}
                    formatter={(val: any, name: any) => [`${val} events`, name]}
                    labelFormatter={(label: any) => `Time: ${label}s`}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                  <Area
                    type="monotone"
                    dataKey="speeding"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#speedingGrad)"
                    name="Speeding"
                  />
                  <Area
                    type="monotone"
                    dataKey="proximity"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#proximityGrad)"
                    name="Proximity Risk"
                  />
                  <Area
                    type="monotone"
                    dataKey="erratic"
                    stroke="#8b5cf6"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#erraticGrad)"
                    name="Erratic Course"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border)] text-center text-xs font-mono">
              <div className="p-2 bg-[var(--surface-muted)] rounded border border-[var(--border)]">
                <div className="text-[10px] text-red-600 font-bold">SPEEDING</div>
                <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>1,495</div>
                <div className="text-[9px] text-[var(--text-muted)]">&gt;16kt limit</div>
              </div>
              <div className="p-2 bg-[var(--surface-muted)] rounded border border-[var(--border)]">
                <div className="text-[10px] text-amber-600 font-bold">PROXIMITY RISK</div>
                <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>1,757</div>
                <div className="text-[9px] text-[var(--text-muted)]">&lt;18m buffer</div>
              </div>
              <div className="p-2 bg-[var(--surface-muted)] rounded border border-[var(--border)]">
                <div className="text-[10px] text-purple-600 font-bold">ERRATIC COURSE</div>
                <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>372</div>
                <div className="text-[9px] text-[var(--text-muted)]">Angular delta</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Anomaly Events Ledger Table ── */}
      <div className="card-sand p-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-base font-bold text-[var(--text)]">
              Real-Time Behavioral Outlier Ledger
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Click any incident to open its full forensic details · use Replay to load it in the clip player
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 bg-[var(--surface-muted)] border border-[var(--border)] rounded text-xs font-mono">
              <button
                onClick={() => setCategoryFilter('ALL')}
                className={cn("px-2.5 py-1 rounded transition-colors cursor-pointer", categoryFilter === 'ALL' ? "bg-[var(--surface)] text-[var(--sea-600)] dark:text-[var(--sea-accent)] font-bold shadow-xs" : "text-[var(--text-muted)] hover:text-[var(--text)]")}
              >
                All
              </button>
              <button
                onClick={() => setCategoryFilter('PERSON')}
                className={cn("px-2.5 py-1 rounded transition-colors cursor-pointer", categoryFilter === 'PERSON' ? "bg-[var(--surface)] text-[var(--sea-600)] dark:text-[var(--sea-accent)] font-bold shadow-xs" : "text-[var(--text-muted)] hover:text-[var(--text)]")}
              >
                Person
              </button>
              <button
                onClick={() => setCategoryFilter('TRAFFIC')}
                className={cn("px-2.5 py-1 rounded transition-colors cursor-pointer", categoryFilter === 'TRAFFIC' ? "bg-[var(--surface)] text-[var(--sea-600)] dark:text-[var(--sea-accent)] font-bold shadow-xs" : "text-[var(--text-muted)] hover:text-[var(--text)]")}
              >
                Traffic
              </button>
              <button
                onClick={() => setCategoryFilter('MARINE')}
                className={cn("px-2.5 py-1 rounded transition-colors cursor-pointer", categoryFilter === 'MARINE' ? "bg-[var(--surface)] text-[var(--sea-600)] dark:text-[var(--sea-accent)] font-bold shadow-xs" : "text-[var(--text-muted)] hover:text-[var(--text)]")}
              >
                Marine
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-[var(--border)] rounded-md">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--surface-muted)] text-[var(--text-muted)] border-b border-[var(--border)] font-mono text-[11px] uppercase">
                <th className="p-3">Time</th>
                <th className="p-3">Incident ID</th>
                <th className="p-3">Category</th>
                <th className="p-3">Anomaly Type</th>
                <th className="p-3">Risk Score</th>
                <th className="p-3">Drone</th>
                <th className="p-3">Status</th>
                <th className="p-3">Narrative Summary</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredAnomalies.map(item => (
                <tr
                  key={item.id}
                  tabIndex={0}
                  aria-selected={selectedAnomaly.id === item.id}
                  aria-label={`Open details for ${item.id}`}
                  onClick={() => openDetail(item)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openDetail(item);
                    }
                  }}
                  className={cn(
                    "hover:bg-[var(--surface-hover)] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--sea-accent)]",
                    selectedAnomaly.id === item.id ? "bg-[var(--selected-row-bg)] border-l-2 border-l-[var(--selected-row-border)] font-medium" : ""
                  )}
                >
                  <td className="p-3 font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{item.timestamp}</td>
                  <td className="p-3 font-mono font-bold text-[var(--sea-600)] dark:text-[var(--sea-accent)]">{item.id}</td>
                  <td className="p-3 font-mono font-semibold" style={{ color: 'var(--text)' }}>{item.category}</td>
                  <td className="p-3 font-sans font-bold" style={{ color: 'var(--text)' }}>{item.anomalyType.replace('_', ' ')}</td>
                  <td className="p-3 font-mono">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold",
                      item.riskScore >= 80 ? "bg-red-100 text-red-800 border border-red-300" :
                      item.riskScore >= 60 ? "bg-amber-100 text-amber-800 border border-amber-300" :
                      "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    )}>
                      {item.riskScore} / 100
                    </span>
                  </td>
                  <td className="p-3 font-mono" style={{ color: 'var(--text-muted)' }}>{item.droneCode}</td>
                  <td className="p-3 font-mono">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold",
                      item.status === 'NEW' ? "bg-red-600 text-white animate-pulse" :
                      item.status === 'ESCALATED' ? "bg-amber-100 text-amber-800 border border-amber-300" :
                      item.status === 'REVIEWED' ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                      "bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/30"
                    )}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 max-w-xs truncate" style={{ color: 'var(--text)' }}>{item.description}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAnomaly(item);
                      }}
                      className="px-2.5 py-1 rounded border font-mono text-[10px] font-bold transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
                      style={{
                        background: 'var(--raised)',
                        borderColor: 'var(--line)',
                        color: 'var(--sea-600)',
                      }}
                    >
                      Replay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Decision-Support Legal Disclaimer Footer (Rule 7) ── */}
      <HumanInterpretationNote className="mt-4" />

      {/* ── Ledger Instance Detail Drawer ── */}
      <AnomalyDetailDrawer
        open={detailOpen}
        onOpenChange={setDetailOpen}
        item={selectedAnomaly}
        thumb={detailThumb}
        onUpdateStatus={status => handleUpdateStatus(selectedAnomaly.id, status)}
        onReplay={() => {
          setDetailOpen(false);
          restartVideo();
        }}
      />
    </div>
  );
}

// ─── Detail drawer ────────────────────────────────────────────

function AnomalyDetailDrawer({
  open, onOpenChange, item, thumb, onUpdateStatus, onReplay,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item: AnomalyRecord;
  thumb: string | null;
  onUpdateStatus: (s: AnomalyRecord['status']) => void;
  onReplay: () => void;
}) {
  const d = ANOMALY_DETAILS[item.id];
  const attention = RISK_TO_ATTENTION(item.riskScore);
  const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });

  const rows: [string, ReactNode][] = [
    ['Event ID', <span className="font-mono font-bold text-[var(--sea-600)] dark:text-[var(--sea-accent)]">{item.id.toUpperCase()}</span>],
    ['Anomaly Type', item.anomalyType.replace(/_/g, ' ')],
    ['Category', item.category],
    ['Detected At', `${today}, ${item.timestamp}`],
    ['Drone / UAV', item.droneCode],
    ['Status', item.status.replace(/_/g, ' ')],
  ];
  if (d) {
    rows.push(
      ['Subject / Track', `${d.subjectId} · ${d.subjectLabel}`],
      ['Location', d.location],
      ['Sector', d.sector],
      ['Coordinates', `${d.lat.toFixed(4)}°N, ${d.lon.toFixed(4)}°E`],
      ['Observed', d.observedMetric],
      ['Threshold', d.threshold],
      ['Duration', `${d.durationSec} s (clip ${item.clipReplaySec} s)`],
      ['Detector Confidence', `${Math.round(d.confidence * 100)}%`],
      ['Model', d.model],
    );
  }

  const weightClass = {
    PRIMARY: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40',
    SUPPORTING: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40',
    CONTEXTUAL: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/40',
  } as const;

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={`Anomaly ${item.id.toUpperCase()} — ${item.anomalyType.replace(/_/g, ' ')}`}
      description={`${item.category} outlier · ${item.droneCode} · ${item.timestamp}`}
      width="lg"
      footer={
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <button
            onClick={onReplay}
            className="px-3 py-1.5 rounded border font-mono text-[11px] font-bold cursor-pointer hover:bg-[var(--surface-hover)] flex items-center gap-1.5"
            style={{ background: 'var(--raised)', borderColor: 'var(--line)', color: 'var(--text)' }}
          >
            <Play className="w-3.5 h-3.5" /> Replay Clip
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateStatus('FALSE_POSITIVE')}
              className="px-3 py-1.5 rounded border font-mono text-[11px] font-bold cursor-pointer hover:bg-[var(--surface-hover)]"
              style={{ background: 'var(--raised)', borderColor: 'var(--line)', color: 'var(--text)' }}
            >
              False Positive
            </button>
            <button
              onClick={() => onUpdateStatus('REVIEWED')}
              className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-[11px] font-bold cursor-pointer"
            >
              Mark Reviewed
            </button>
            <button
              onClick={() => onUpdateStatus('ESCALATED')}
              className="px-3 py-1.5 rounded bg-red-700 hover:bg-red-800 text-white font-mono text-[11px] font-bold cursor-pointer"
            >
              Escalate
            </button>
          </div>
        </div>
      }
    >
      {/* Severity strip */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn(
          'px-2 py-0.5 rounded text-[10px] font-mono font-bold border',
          item.riskScore >= 80 ? 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40'
        )}>
          RISK {item.riskScore} / 100
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border bg-[var(--surface-muted)]" style={{ borderColor: 'var(--line)', color: 'var(--text)' }}>
          ATTENTION: {attention}
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border bg-[var(--surface-muted)]" style={{ borderColor: 'var(--line)', color: 'var(--text)' }}>
          {item.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Evidence thumbnail */}
      <div className="rounded-lg overflow-hidden border bg-slate-950 aspect-video flex items-center justify-center" style={{ borderColor: 'var(--line)' }}>
        {thumb ? (
          <img src={thumb} alt={`Evidence frame for ${item.id}`} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-slate-400 font-mono text-[11px] p-4">
            <Video className="w-6 h-6 mx-auto mb-1 opacity-60" />
            Evidence frame available after the replay clip loads
          </div>
        )}
      </div>

      {/* Narrative */}
      <div className="p-3 rounded border text-xs" style={{ background: 'var(--surface-muted)', borderColor: 'var(--line)', color: 'var(--text)' }}>
        <div className="font-bold mb-1">What was observed</div>
        {item.description}
      </div>

      {/* Key/value facts */}
      <dl className="grid grid-cols-[minmax(130px,auto)_1fr] gap-x-4 gap-y-1.5 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt style={{ color: 'var(--text-muted)' }}>{k}</dt>
            <dd className="font-medium" style={{ color: 'var(--text)' }}>{v}</dd>
          </div>
        ))}
      </dl>

      {/* Rationale factors */}
      {d && (
        <div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Why the system flagged this
          </div>
          <ul className="space-y-1.5">
            {d.factors.map(f => (
              <li key={f.name} className="flex items-center justify-between gap-2 text-xs p-2 rounded border" style={{ borderColor: 'var(--line)', color: 'var(--text)' }}>
                <span>{f.name}: <span className="font-mono font-semibold">{f.value}</span></span>
                <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border flex-shrink-0', weightClass[f.weight])}>
                  {f.weight}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended action */}
      {d && (
        <div className="p-3 rounded border-l-4 border-l-amber-500 border text-xs" style={{ borderColor: 'var(--line)', background: 'var(--surface-muted)', color: 'var(--text)' }}>
          <div className="font-bold mb-1 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Recommended Police Action
          </div>
          {d.recommendedAction}
        </div>
      )}

      <p className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>
        AI decision support only — an officer must verify before any enforcement action.
      </p>
    </SideDrawer>
  );
}

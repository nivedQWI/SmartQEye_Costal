// ============================================================
// SmartQEye Coastal — Intrusion Detection & Geofencing (/intrusion-detection)
// As specified in Costal Police .docx
// ============================================================

import { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert, ShieldCheck, AlertOctagon, Download,
  Eye, Bell, MapPin, Radio, CheckCircle,
  Plus, Trash2, Video, Layers, AlertTriangle,
  Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { can } from '@/lib/roleConfig';
import { IntrusionRecord } from '@/types';

// Real Intrusion Detection Snapshots from D:\SmartQEye_Costal\Intrusion_detection
export interface IntrusionSnapshotItem {
  id: string;
  url: string;
  fileName: string;
  tag: string;
  targetCode: string;
  label: string;
  confidence: number;
  status: 'DWELLING' | 'ALERT' | 'EXITED' | 'TRACKING';
  zoneName: string;
  timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export const INTRUSION_SNAPSHOTS: IntrusionSnapshotItem[] = [
  {
    id: 'snap-5',
    url: '/intrusion/snapshot_5.png',
    fileName: 'snapshot (5).png',
    tag: '#13 SHIP 80% [DWELLING] / #20 SWIMMER 20%',
    targetCode: 'TARGET-SHIP-13',
    label: 'Motor Vessel with Swimmer Alert',
    confidence: 80,
    status: 'DWELLING',
    zoneName: 'Vizhinjam Naval Jetty & Fuel Wharf',
    timestamp: '19:42:10 IST',
    severity: 'CRITICAL',
  },
  {
    id: 'snap-4',
    url: '/intrusion/snapshot_4.png',
    fileName: 'snapshot (4).png',
    tag: '#1 YACHT 81% [DWELLING]',
    targetCode: 'TARGET-YACHT-01',
    label: 'High-Speed Yacht Incursion',
    confidence: 81,
    status: 'DWELLING',
    zoneName: 'Vizhinjam Naval Jetty & Fuel Wharf',
    timestamp: '19:35:18 IST',
    severity: 'HIGH',
  },
  {
    id: 'snap-3',
    url: '/intrusion/snapshot_3.png',
    fileName: 'snapshot (3).png',
    tag: '#1 YACHT 86% [EXITED]',
    targetCode: 'TARGET-YACHT-01',
    label: 'Yacht Exited Tripwire Perimeter',
    confidence: 86,
    status: 'EXITED',
    zoneName: 'Vizhinjam Naval Jetty & Fuel Wharf',
    timestamp: '19:15:32 IST',
    severity: 'MEDIUM',
  },
  {
    id: 'snap-2',
    url: '/intrusion/snapshot_2.png',
    fileName: 'snapshot (2).png',
    tag: '#5 SPEEDBOAT 81%',
    targetCode: 'TARGET-BOAT-05',
    label: 'Unregistered Fast Speedboat',
    confidence: 81,
    status: 'TRACKING',
    zoneName: 'Kovalam Lighthouse Cliff Edge Barrier',
    timestamp: '18:50:18 IST',
    severity: 'HIGH',
  },
  {
    id: 'snap-1',
    url: '/intrusion/snapshot_1.png',
    fileName: 'snapshot (1).png',
    tag: '#6 BOAT 70%',
    targetCode: 'TARGET-BOAT-06',
    label: 'Small Coastal Fishing Craft',
    confidence: 70,
    status: 'TRACKING',
    zoneName: 'Coastal Police Fast Interceptor Berth',
    timestamp: '18:22:04 IST',
    severity: 'MEDIUM',
  },
];

// Mock Geofence Zones
interface VirtualZone {
  id: string;
  name: string;
  type: 'RED_RESTRICTED' | 'YELLOW_WARNING' | 'GREEN_AUTHORIZED';
  description: string;
  targetCriteria: string[];
  maxDwellSec: number;
  activeBreaches: number;
  polygonPoints: string; // SVG points string
}

const INITIAL_ZONES: VirtualZone[] = [
  {
    id: 'zone-1',
    name: 'Vizhinjam Naval Jetty & Fuel Wharf',
    type: 'RED_RESTRICTED',
    description: 'Prohibited military installation zone. Zero tolerance unauthorized entry.',
    targetCriteria: ['PERSON', 'VESSEL', 'VEHICLE'],
    maxDwellSec: 0,
    activeBreaches: 1,
    polygonPoints: '120,80 320,70 380,210 180,230'
  },
  {
    id: 'zone-2',
    name: 'Kovalam Lighthouse Cliff Edge Barrier',
    type: 'YELLOW_WARNING',
    description: 'Hazardous high cliff safety perimeter. Tourist fall prevention buffer.',
    targetCriteria: ['PERSON', 'VESSEL'],
    maxDwellSec: 15,
    activeBreaches: 0,
    polygonPoints: '420,120 580,110 590,260 440,240'
  },
  {
    id: 'zone-3',
    name: 'Coastal Police Fast Interceptor Berth',
    type: 'RED_RESTRICTED',
    description: 'Tactical marine vessel mooring zone. Access restricted to badge holders.',
    targetCriteria: ['VESSEL'],
    maxDwellSec: 30,
    activeBreaches: 0,
    polygonPoints: '40,260 210,240 230,360 30,370'
  }
];

// Intrusion Records with Real Snapshots from D:\SmartQEye_Costal\Intrusion_detection
const INITIAL_INTRUSIONS: IntrusionRecord[] = [
  {
    id: 'intr-01',
    zoneId: 'zone-1',
    zoneName: 'Vizhinjam Naval Jetty & Fuel Wharf',
    breachType: 'VESSEL',
    targetCode: 'TARGET-SHIP-13 (#13 SHIP 80%)',
    severity: 'CRITICAL',
    dwellTimeSec: 84,
    timestamp: '19:42:10 IST',
    snapshotUrl: '/intrusion/snapshot_5.png',
    status: 'ACTIVE'
  },
  {
    id: 'intr-02',
    zoneId: 'zone-1',
    zoneName: 'Vizhinjam Naval Jetty & Fuel Wharf',
    breachType: 'VESSEL',
    targetCode: 'TARGET-YACHT-01 (#1 YACHT 81%)',
    severity: 'HIGH',
    dwellTimeSec: 62,
    timestamp: '19:35:18 IST',
    snapshotUrl: '/intrusion/snapshot_4.png',
    status: 'DISPATCHED'
  },
  {
    id: 'intr-03',
    zoneId: 'zone-1',
    zoneName: 'Vizhinjam Naval Jetty & Fuel Wharf',
    breachType: 'VESSEL',
    targetCode: 'TARGET-YACHT-01 (#1 YACHT 86%)',
    severity: 'MEDIUM',
    dwellTimeSec: 45,
    timestamp: '19:15:32 IST',
    snapshotUrl: '/intrusion/snapshot_3.png',
    status: 'RESOLVED'
  },
  {
    id: 'intr-04',
    zoneId: 'zone-2',
    zoneName: 'Kovalam Lighthouse Cliff Edge Barrier',
    breachType: 'VESSEL',
    targetCode: 'TARGET-BOAT-05 (#5 SPEEDBOAT 81%)',
    severity: 'HIGH',
    dwellTimeSec: 38,
    timestamp: '18:50:18 IST',
    snapshotUrl: '/intrusion/snapshot_2.png',
    status: 'ACKNOWLEDGED'
  },
  {
    id: 'intr-05',
    zoneId: 'zone-3',
    zoneName: 'Coastal Police Fast Interceptor Berth',
    breachType: 'VESSEL',
    targetCode: 'TARGET-BOAT-06 (#6 BOAT 70%)',
    severity: 'MEDIUM',
    dwellTimeSec: 19,
    timestamp: '18:22:04 IST',
    snapshotUrl: '/intrusion/snapshot_1.png',
    status: 'RESOLVED'
  }
];

export default function IntrusionDetectionPage() {
  const { user, devRole } = useAuthStore();
  const activeRole = user?.role ?? devRole ?? 'OPERATOR';
  const videoRef = useRef<HTMLVideoElement>(null);

  const [zones, setZones] = useState<VirtualZone[]>(INITIAL_ZONES);
  const [intrusions, setIntrusions] = useState<IntrusionRecord[]>(INITIAL_INTRUSIONS);
  const [selectedZone, setSelectedZone] = useState<VirtualZone | null>(INITIAL_ZONES[0]);
  const [isSimulatingBreach, setIsSimulatingBreach] = useState(false);
  const [inspectRecord, setInspectRecord] = useState<IntrusionRecord | null>(null);

  // Video Stream Controls
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
        .catch(() => {
          setIsPlaying(false);
        });
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

  function toggleFullscreen() {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      videoRef.current.requestFullscreen().catch(() => {});
    }
  }

  function restartVideo() {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
  }

  // Trigger simulated breach with real detection snapshots
  function handleSimulateBreach() {
    setIsSimulatingBreach(true);
    const sampleSnaps = [
      { url: '/intrusion/snapshot_5.png', code: 'TARGET-SHIP-13 (#13 SHIP 80%)', type: 'VESSEL' as const, sev: 'CRITICAL' as const, dwell: 88, zone: 'Vizhinjam Naval Jetty & Fuel Wharf' },
      { url: '/intrusion/snapshot_4.png', code: 'TARGET-YACHT-01 (#1 YACHT 81%)', type: 'VESSEL' as const, sev: 'HIGH' as const, dwell: 32, zone: 'Vizhinjam Naval Jetty & Fuel Wharf' },
      { url: '/intrusion/snapshot_2.png', code: 'TARGET-BOAT-05 (#5 SPEEDBOAT 81%)', type: 'VESSEL' as const, sev: 'HIGH' as const, dwell: 15, zone: 'Kovalam Lighthouse Cliff Edge Barrier' },
    ];
    const picked = sampleSnaps[Math.floor(Math.random() * sampleSnaps.length)];
    const newBreach: IntrusionRecord = {
      id: `intr-${Date.now().toString().slice(-4)}`,
      zoneId: 'zone-1',
      zoneName: picked.zone,
      breachType: picked.type,
      targetCode: picked.code,
      severity: picked.sev,
      dwellTimeSec: picked.dwell,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
      snapshotUrl: picked.url,
      status: 'ACTIVE'
    };
    setIntrusions(prev => [newBreach, ...prev]);
    setTimeout(() => setIsSimulatingBreach(false), 3000);
  }

  // Update breach status
  function handleUpdateStatus(id: string, newStatus: IntrusionRecord['status']) {
    setIntrusions(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    if (inspectRecord && inspectRecord.id === id) {
      setInspectRecord({ ...inspectRecord, status: newStatus });
    }
  }

  // Export JSON audit log
  function handleExportJson() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(intrusions, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `intrusion_audit_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto chart-paper p-4 md:p-6 gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Intrusion Detection &amp; Virtual Geofencing
            </h1>
            <span className="badge-navy text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
              REAL-TIME TRIPWIRES
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Dynamic geometric geofence tripwires, perimeter breach alarms &amp; instant tactical response dispatches
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateBreach}
            disabled={isSimulatingBreach}
            className="px-3 py-1.5 rounded text-xs font-mono font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            {isSimulatingBreach ? 'SIMULATING BREACH...' : 'Simulate Breach'}
          </button>

          {can(activeRole, 'EXPORT_DOWNLOAD') && (
            <button
              onClick={handleExportJson}
              className="btn-navy text-xs flex items-center gap-1.5 px-3 py-1.5 rounded"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON Audit
            </button>
          )}
        </div>
      </div>

      {/* ── Top 4 KPI Metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="card-sand p-3.5 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Active Virtual Geofences
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-[var(--sea-600)] dark:text-[var(--sea-accent)]">{zones.length}</span>
            <Layers className="w-4 h-4" style={{ color: 'var(--sea-accent)' }} />
          </div>
          <div className="text-[10px] mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>2 Prohibited · 1 Safety Buffer</div>
        </div>

        <div className="card-sand p-3.5 flex flex-col justify-between border-l-4 border-l-red-600">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-red-700 dark:text-red-400">
            Active Perimeter Breaches
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-red-600 dark:text-red-400">
              {intrusions.filter(i => i.status === 'ACTIVE').length}
            </span>
            <span className="animate-pulse bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-300 dark:border-red-800">
              LIVE ALARM
            </span>
          </div>
          <div className="text-[10px] text-red-700 dark:text-red-300 font-semibold mt-1">Naval Jetty Sector</div>
        </div>

        <div className="card-sand p-3.5 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Mean Response Time
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold" style={{ color: 'var(--text)' }}>18.4s</span>
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
              SLA &lt;30s
            </span>
          </div>
          <div className="text-[10px] mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>From trigger to dispatch</div>
        </div>

        <div className="card-sand p-3.5 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Total Breaches (24h)
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold" style={{ color: 'var(--text)' }}>{intrusions.length}</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-[10px] mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>3 Neutralized / 1 Active</div>
        </div>
      </div>

      {/* ── Main Layout: Drone Video with Polygon Overlay + Geofence Zone Manager ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Drone Video Stream with Geofence Tripwire Polygons */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="card-sand p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[var(--sea-600)] dark:text-[var(--sea-accent)]" />
                <h2 className="font-serif text-sm font-bold text-[var(--text)]">
                  Live Drone Feed &amp; Geofence Polygons — UAV-KL-01
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-300">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                  GEOFENCE BREACH ACTIVE
                </span>
              </div>
            </div>

            {/* Video Canvas with Dynamic SVG Polygons */}
            {/* Real-time Coastal Drone Intrusion Video Stream */}
            <div className="relative rounded-lg overflow-hidden border border-[var(--border)] bg-slate-950 aspect-video flex flex-col justify-between p-3 select-none">
              <video
                ref={videoRef}
                key="/intrusion-media/Intrusion_video.mp4"
                src="/intrusion-media/Intrusion_video.mp4"
                autoPlay
                muted={isMuted}
                loop
                playsInline
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedData={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = true;
                    videoRef.current.play().catch(() => {});
                  }
                }}
                onError={(e) => {
                  // Fallback to /videos/Intrusion_video.mp4 if /intrusion-media path is not ready
                  const target = e.currentTarget;
                  if (!target.src.includes('/videos/Intrusion_video.mp4')) {
                    target.src = '/videos/Intrusion_video.mp4';
                    target.load();
                    target.play().catch(() => {});
                  }
                }}
              />

              {/* Autoplay Pause Overlay (Click to Play if browser blocked autoplay) */}
              {!isPlaying && (
                <div
                  onClick={togglePlay}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs cursor-pointer group transition-all"
                >
                  <div className="p-4 rounded-full bg-red-600/90 text-white shadow-xl group-hover:scale-110 transition-transform flex items-center justify-center">
                    <Play className="w-8 h-8 ml-1" />
                  </div>
                  <span className="mt-2.5 text-xs font-mono font-bold text-white bg-black/70 px-3 py-1 rounded border border-white/20">
                    CLICK TO START STREAM
                  </span>
                </div>
              )}



              {/* HUD Header */}
              <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-200">
                <span className="bg-slate-900/85 backdrop-blur-xs px-2.5 py-1 rounded border border-slate-700/80 flex items-center gap-1.5 shadow-xs">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  UAV-KL-01 · 30 FPS RTMP RECON STREAM
                </span>
                <span className="bg-red-950/90 text-red-200 px-2.5 py-1 rounded border border-red-500/60 font-bold flex items-center gap-1.5 animate-pulse shadow-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  ALARM: VESSEL INTRUSION DETECTED IN ZONE 1
                </span>
              </div>

              {/* HUD Controls & Metrics Footer */}
              <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-200 bg-slate-950/85 backdrop-blur-xs p-2 rounded border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={togglePlay}
                    className="p-1 rounded hover:bg-white/10 text-slate-200 transition-colors cursor-pointer"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="p-1 rounded hover:bg-white/10 text-slate-200 transition-colors cursor-pointer"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={restartVideo}
                    className="p-1 rounded hover:bg-white/10 text-slate-200 transition-colors cursor-pointer"
                    title="Restart Video"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 hidden sm:inline">GEOFENCE ENGINE: SHAPELY EVAL (60 HZ)</span>
                  <span className="text-slate-400">LATENCY: 14MS</span>
                  <button
                    onClick={toggleFullscreen}
                    className="p-1 rounded hover:bg-white/10 text-slate-200 transition-colors cursor-pointer"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Real Intrusion Detection Snapshots Gallery ── */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[var(--accent)]" />
                  <h3 className="font-serif text-xs font-bold text-[var(--text)]">
                    Target Detection Snapshots ({INTRUSION_SNAPSHOTS.length})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  Real AI Bounding-Box Crops · Click to inspect
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {INTRUSION_SNAPSHOTS.map(snap => (
                  <div
                    key={snap.id}
                    onClick={() => {
                      const matched = intrusions.find(i => i.snapshotUrl === snap.url) || {
                        id: snap.id,
                        zoneId: 'zone-1',
                        zoneName: snap.zoneName,
                        breachType: 'VESSEL' as const,
                        targetCode: snap.targetCode,
                        severity: snap.severity,
                        dwellTimeSec: 84,
                        timestamp: snap.timestamp,
                        snapshotUrl: snap.url,
                        status: 'ACTIVE' as const,
                      };
                      setInspectRecord(matched);
                    }}
                    className="group rounded-md border border-[var(--border)] bg-[var(--surface)] p-2 hover:border-red-500 hover:shadow-md transition-all cursor-pointer flex flex-col gap-1.5"
                  >
                    <div className="relative aspect-video bg-black rounded overflow-hidden flex items-center justify-center border border-black/40">
                      <img
                        src={snap.url}
                        alt={snap.tag}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.includes('snapshot_')) {
                            target.src = `/intrusion/${snap.fileName}`;
                          }
                        }}
                      />
                      <span className={cn(
                        "absolute top-1 left-1 px-1 py-0.2 rounded font-mono text-[8px] font-bold",
                        snap.status === 'DWELLING' ? "bg-red-950/90 text-red-300 border border-red-500/50" :
                        snap.status === 'EXITED' ? "bg-emerald-950/90 text-emerald-300 border border-emerald-500/50" :
                        "bg-amber-950/90 text-amber-300 border border-amber-500/50"
                      )}>
                        {snap.status}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] font-bold text-slate-900 truncate" title={snap.tag}>
                        {snap.tag}
                      </span>
                      <span className="text-[9px] text-slate-500 truncate">
                        {snap.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Geofence Zones Config & Active Breaches */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="card-sand p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-sm font-bold text-[var(--text)]">
                Configured Virtual Geofences
              </h3>
              <span className="badge-navy text-[10px] px-2 py-0.5 rounded font-mono">
                {zones.length} Active
              </span>
            </div>

            <div className="space-y-2.5">
              {zones.map(z => {
                const isSelected = selectedZone?.id === z.id;
                return (
                  <div
                    key={z.id}
                    onClick={() => setSelectedZone(z)}
                    className={cn(
                      "p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5",
                      isSelected
                        ? "border-[var(--sea-600)] ring-2 ring-[var(--sea-500)]/40 shadow-xs"
                        : "hover:border-[var(--sea-400)]",
                      z.activeBreaches > 0
                        ? "bg-red-500/10 border-red-300 dark:border-red-800"
                        : isSelected
                        ? "bg-[var(--sea-100)] dark:bg-[var(--raised)]"
                        : "bg-[var(--raised)] border-[var(--line)]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-xs font-bold" style={{ color: 'var(--text)' }}>
                        {z.name}
                      </span>
                      {z.activeBreaches > 0 ? (
                        <span className="animate-pulse bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-300 dark:border-red-800">
                          {z.activeBreaches} BREACH
                        </span>
                      ) : (
                        <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                          CLEAR
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                      {z.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t text-[10px] font-mono" style={{ borderColor: 'var(--line)', color: 'var(--text-muted)' }}>
                      <span>Criteria: <strong style={{ color: 'var(--text)' }}>{z.targetCriteria.join(', ')}</strong></span>
                      <span>Max Dwell: <strong style={{ color: 'var(--text)' }}>{z.maxDwellSec}s</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Historical Breach Ledger Table ── */}
      <div className="card-sand p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-base font-bold text-[var(--text)]">
              Perimeter Intrusion Incident Ledger
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Complete record of virtual tripwire breaches, dwell times, and police response dispatch records
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border rounded-xl" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b font-mono text-[11px] uppercase tracking-wider font-semibold" style={{ background: 'var(--raised)', borderColor: 'var(--line)', color: 'var(--text-muted)' }}>
                <th className="p-3">Time</th>
                <th className="p-3">Snapshot</th>
                <th className="p-3">Zone Breached</th>
                <th className="p-3">Target Code</th>
                <th className="p-3">Target Type</th>
                <th className="p-3">Dwell Time</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Response Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--line)' }}>
              {intrusions.map(item => (
                <tr
                  key={item.id}
                  className={cn(
                    "transition-colors",
                    item.status === 'ACTIVE'
                      ? "bg-red-500/10 hover:bg-red-500/15"
                      : "hover:bg-[var(--surface-hover)]"
                  )}
                  style={{ borderColor: 'var(--line)' }}
                >
                  <td className="p-3 font-mono font-medium whitespace-nowrap" style={{ color: 'var(--text)' }}>{item.timestamp}</td>
                  <td className="p-3">
                    <div className="w-14 h-10 bg-slate-950 rounded overflow-hidden border flex items-center justify-center p-0.5" style={{ borderColor: 'var(--line)' }}>
                      <img
                        src={item.snapshotUrl}
                        alt={item.targetCode}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </td>
                  <td className="p-3 font-semibold" style={{ color: 'var(--text)' }}>{item.zoneName}</td>
                  <td className="p-3 font-mono font-bold text-[var(--sea-600)] dark:text-[var(--sea-accent)]">{item.targetCode}</td>
                  <td className="p-3 font-mono font-bold" style={{ color: 'var(--text)' }}>{item.breachType}</td>
                  <td className="p-3 font-mono font-semibold" style={{ color: 'var(--text)' }}>{item.dwellTimeSec}s</td>
                  <td className="p-3">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded text-[10px] font-bold font-mono border",
                      item.severity === 'CRITICAL' ? "bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800" :
                      item.severity === 'HIGH' ? "bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800" :
                      "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                    )}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded text-[10px] font-bold font-mono border",
                      item.status === 'ACTIVE' ? "bg-red-600 text-white animate-pulse border-red-600" :
                      item.status === 'DISPATCHED' ? "bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800" :
                      item.status === 'ACKNOWLEDGED' ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800" :
                      "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                    )}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.status === 'ACTIVE' && can(activeRole, 'DISPATCH_INTERCEPTOR') && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'DISPATCHED')}
                          className="px-2.5 py-1 rounded bg-red-700 hover:bg-red-800 text-white font-mono text-[10px] font-bold shadow-xs cursor-pointer"
                        >
                          Dispatch
                        </button>
                      )}
                      {item.status === 'DISPATCHED' && can(activeRole, 'RESOLVE_ALERT') && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'RESOLVED')}
                          className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-[10px] font-bold shadow-xs cursor-pointer"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => setInspectRecord(item)}
                        className="px-2.5 py-1 rounded border font-mono text-[10px] font-bold transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
                        style={{
                          background: 'var(--raised)',
                          borderColor: 'var(--line)',
                          color: 'var(--sea-600)',
                        }}
                      >
                        Inspect
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Intrusion Inspection Modal ── */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[var(--raised)] text-[var(--text)] max-w-md w-full p-6 flex flex-col gap-4 shadow-2xl border border-[var(--line)] rounded-2xl">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <h3 className="font-serif text-base font-bold" style={{ color: 'var(--text)' }}>Perimeter Breach Record</h3>
              </div>
              <button onClick={() => setInspectRecord(null)} className="text-xl font-bold hover:opacity-80 cursor-pointer" style={{ color: 'var(--text-muted)' }}>×</button>
            </div>

            <div className="flex justify-center p-3 bg-slate-950 rounded-lg border border-slate-800">
              <img
                src={inspectRecord.snapshotUrl}
                alt={inspectRecord.targetCode}
                className="max-h-52 max-w-full object-contain rounded border-2 border-red-500 shadow-md"
              />
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Zone Breached:</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>{inspectRecord.zoneName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target Code:</span>
                <span className="font-bold text-red-600 dark:text-red-400">{inspectRecord.targetCode}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target Classification:</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>{inspectRecord.breachType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Dwell Duration:</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>{inspectRecord.dwellTimeSec} seconds</span>
              </div>
              <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Breach Timestamp:</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>{inspectRecord.timestamp}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Response Status:</span>
                <span className="font-bold text-[var(--sea-600)] dark:text-[var(--sea-accent)]">{inspectRecord.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
              {inspectRecord.status !== 'RESOLVED' && can(activeRole, 'RESOLVE_ALERT') ? (
                <button
                  onClick={() => handleUpdateStatus(inspectRecord.id, 'RESOLVED')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-mono text-xs font-bold cursor-pointer hover:bg-emerald-800 transition-colors"
                >
                  Mark Resolved
                </button>
              ) : inspectRecord.status === 'RESOLVED' ? (
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">✓ Incident Closed</span>
              ) : null}

              <button
                onClick={() => setInspectRecord(null)}
                className="btn-navy text-xs px-4 py-2 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

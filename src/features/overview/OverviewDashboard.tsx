// ============================================================
// SmartQEye Coastal — Edge Overview Dashboard
// Operator landing page with real-time KPI grid, mission details,
// flight dynamics charts, system hardware meters, and sortie log
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Activity, Wifi, Video, Radio, HardDrive, Cpu, Zap, Database,
  Upload, CheckCircle, Trash2, BatteryCharging, Clock, MapPin,
  User, Anchor, Play, ChevronRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────

interface KpiCard {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;      // tailwind text color
  bgColor: string;    // tailwind bg color for icon circle
  status?: 'ok' | 'warn' | 'critical' | 'neutral';
}

interface FlightPoint {
  time: string;
  altitude: number;
  speed: number;
}

interface CompletedSortie {
  id: string;
  missionId: string;
  name: string;
  droneCode: string;
  pilot: string;
  location: string;
  duration: string;
  endedAt: string;
  framesProcessed: number;
}

// ─── Simulated Data Generators ───────────────────────────────

function randomBetween(min: number, max: number) {
  return +(min + Math.random() * (max - min)).toFixed(1);
}

function generateFlightData(): FlightPoint[] {
  const now = new Date();
  return Array.from({ length: 20 }, (_, i) => {
    const t = new Date(now.getTime() - (19 - i) * 3000);
    return {
      time: t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }),
      altitude: randomBetween(80, 140),
      speed: randomBetween(18, 48),
    };
  });
}

const COMPLETED_SORTIES: CompletedSortie[] = [
  { id: 's-1', missionId: 'MSN-20261015-0630-12-ALPHA', name: 'Vizhinjam Harbour Dawn Patrol', droneCode: 'UAV-03', pilot: 'SI Ramesh Kumar', location: 'Vizhinjam Breakwater', duration: '58 min', endedAt: '07:28 IST', framesProcessed: 52140 },
  { id: 's-2', missionId: 'MSN-20261014-1415-08-BRAVO', name: 'Kovalam Tourist Beach Perimeter', droneCode: 'UAV-01', pilot: 'SI Manesh V.', location: 'Kovalam Light House', duration: '74 min', endedAt: '15:29 IST', framesProcessed: 66600 },
  { id: 's-3', missionId: 'MSN-20261014-0920-05-ALPHA', name: 'Poovar Estuary Joint Maritime Patrol', droneCode: 'UAV-05', pilot: 'ASI Pradeep K.', location: 'Poovar Golden Sand', duration: '62 min', endedAt: '10:22 IST', framesProcessed: 55800 },
  { id: 's-4', missionId: 'MSN-20261013-1800-22-CHARLIE', name: 'Beypore Harbour Night Watch', droneCode: 'UAV-02', pilot: 'HC Suresh M.', location: 'Beypore Deep Harbour', duration: '90 min', endedAt: '19:30 IST', framesProcessed: 81000 },
  { id: 's-5', missionId: 'MSN-20261013-0545-00-DELTA', name: 'Alappuzha Coastline Sweep', droneCode: 'UAV-06', pilot: 'ASI Vinod R.', location: 'Alappuzha Beach', duration: '48 min', endedAt: '06:33 IST', framesProcessed: 43200 },
];

// ─── Component ───────────────────────────────────────────────

export default function OverviewDashboard() {
  // Live KPI state (simulated with intervals)
  const [activeMission, setActiveMission] = useState(1);
  const [droneLink, setDroneLink] = useState<'UP' | 'DOWN'>('UP');
  const [streamFps, setStreamFps] = useState(25.0);
  const [bitrate, setBitrate] = useState(8.4);
  const [bufferUtil, setBufferUtil] = useState(34);
  const [cpuUsage, setCpuUsage] = useState(42);
  const [gpuUsage, setGpuUsage] = useState(67);
  const [storage, setStorage] = useState(58);
  const [uploadQueue, setUploadQueue] = useState(12);
  const [selectedFrames, setSelectedFrames] = useState(1847);
  const [discardedFrames, setDiscardedFrames] = useState(4230);
  const [droneBattery, setDroneBattery] = useState(72);

  // Flight dynamics chart data
  const [flightData, setFlightData] = useState<FlightPoint[]>(generateFlightData);

  // Elapsed mission timer
  const [elapsed, setElapsed] = useState(0);
  const missionStartTime = useState(() => Date.now() - 47 * 60 * 1000)[0]; // started 47 min ago

  // System storage & hardware
  const [diskUsed, setDiskUsed] = useState(58);
  const [ramUsed, setRamUsed] = useState(71);

  // Tick KPIs every 2s
  const tickKpis = useCallback(() => {
    setStreamFps(randomBetween(23, 30));
    setBitrate(randomBetween(6.5, 10.2));
    setBufferUtil(Math.round(randomBetween(15, 75)));
    setCpuUsage(Math.round(randomBetween(28, 68)));
    setGpuUsage(Math.round(randomBetween(52, 88)));
    setStorage(Math.round(randomBetween(52, 72)));
    setUploadQueue(Math.round(randomBetween(0, 40)));
    setSelectedFrames(prev => prev + Math.round(randomBetween(2, 8)));
    setDiscardedFrames(prev => prev + Math.round(randomBetween(4, 14)));
    setDroneBattery(prev => Math.max(10, prev - +(Math.random() * 0.3).toFixed(1)));
    setDiskUsed(Math.round(randomBetween(52, 72)));
    setRamUsed(Math.round(randomBetween(60, 82)));
    setDroneLink(Math.random() > 0.05 ? 'UP' : 'DOWN');
    setActiveMission(Math.random() > 0.03 ? 1 : 0);
  }, []);

  useEffect(() => {
    tickKpis();
    const kpiInterval = setInterval(tickKpis, 2000);
    return () => clearInterval(kpiInterval);
  }, [tickKpis]);

  // Flight chart data every 3s
  useEffect(() => {
    const chartInterval = setInterval(() => {
      setFlightData(prev => {
        const now = new Date();
        const next: FlightPoint = {
          time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }),
          altitude: randomBetween(80, 140),
          speed: randomBetween(18, 48),
        };
        return [...prev.slice(1), next];
      });
    }, 3000);
    return () => clearInterval(chartInterval);
  }, []);

  // Elapsed timer every 1s
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - missionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [missionStartTime]);

  const formatElapsed = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ─── KPI Card Definitions ──────────────────────────────────

  function getStatus(val: number, warn: number, crit: number, invert = false): 'ok' | 'warn' | 'critical' {
    if (invert) return val <= warn ? 'ok' : val <= crit ? 'warn' : 'critical';
    return val <= warn ? 'ok' : val <= crit ? 'warn' : 'critical';
  }

  const kpiCards: KpiCard[] = [
    {
      label: 'Active Mission', value: activeMission, icon: Play,
      color: activeMission ? 'text-emerald-600' : 'text-gray-500',
      bgColor: activeMission ? 'bg-emerald-500/15' : 'bg-gray-400/15',
      status: activeMission ? 'ok' : 'neutral',
    },
    {
      label: 'Drone Link', value: droneLink, icon: Wifi,
      color: droneLink === 'UP' ? 'text-emerald-600' : 'text-red-500',
      bgColor: droneLink === 'UP' ? 'bg-emerald-500/15' : 'bg-red-500/15',
      status: droneLink === 'UP' ? 'ok' : 'critical',
    },
    {
      label: 'Stream FPS', value: streamFps, unit: 'fps', icon: Video,
      color: 'text-cyan-600', bgColor: 'bg-cyan-500/15', status: 'ok',
    },
    {
      label: 'Bitrate', value: bitrate, unit: 'Mbps', icon: Radio,
      color: 'text-blue-600', bgColor: 'bg-blue-500/15', status: 'ok',
    },
    {
      label: 'Buffer Util.', value: bufferUtil, unit: '%', icon: Database,
      color: bufferUtil < 60 ? 'text-gray-600' : bufferUtil < 80 ? 'text-amber-600' : 'text-red-500',
      bgColor: bufferUtil < 60 ? 'bg-gray-400/15' : bufferUtil < 80 ? 'bg-amber-500/15' : 'bg-red-500/15',
      status: bufferUtil < 60 ? 'neutral' : bufferUtil < 80 ? 'warn' : 'critical',
    },
    {
      label: 'CPU Usage', value: cpuUsage, unit: '%', icon: Cpu,
      color: cpuUsage < 70 ? 'text-gray-600' : 'text-red-500',
      bgColor: cpuUsage < 70 ? 'bg-gray-400/15' : 'bg-red-500/15',
      status: cpuUsage < 70 ? 'neutral' : 'critical',
    },
    {
      label: 'GPU Usage', value: gpuUsage, unit: '%', icon: Zap,
      color: gpuUsage < 80 ? 'text-purple-600' : 'text-red-500',
      bgColor: gpuUsage < 80 ? 'bg-purple-500/15' : 'bg-red-500/15',
      status: gpuUsage < 80 ? 'ok' : 'critical',
    },
    {
      label: 'Storage', value: storage, unit: '%', icon: HardDrive,
      color: storage < 60 ? 'text-emerald-600' : storage < 80 ? 'text-amber-600' : 'text-red-500',
      bgColor: storage < 60 ? 'bg-emerald-500/15' : storage < 80 ? 'bg-amber-500/15' : 'bg-red-500/15',
      status: storage < 60 ? 'ok' : storage < 80 ? 'warn' : 'critical',
    },
    {
      label: 'Upload Queue', value: uploadQueue, unit: 'frames', icon: Upload,
      color: 'text-gray-600', bgColor: 'bg-gray-400/15', status: 'neutral',
    },
    {
      label: 'Selected Frames', value: selectedFrames.toLocaleString(), icon: CheckCircle,
      color: 'text-emerald-600', bgColor: 'bg-emerald-500/15', status: 'ok',
    },
    {
      label: 'Discarded Frames', value: discardedFrames.toLocaleString(), icon: Trash2,
      color: 'text-gray-500', bgColor: 'bg-gray-400/15', status: 'neutral',
    },
    {
      label: 'Drone Battery', value: Math.round(droneBattery), unit: '%', icon: BatteryCharging,
      color: droneBattery > 40 ? 'text-emerald-600' : droneBattery > 20 ? 'text-amber-600' : 'text-red-500',
      bgColor: droneBattery > 40 ? 'bg-emerald-500/15' : droneBattery > 20 ? 'bg-amber-500/15' : 'bg-red-500/15',
      status: droneBattery > 40 ? 'ok' : droneBattery > 20 ? 'warn' : 'critical',
    },
  ];

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col overflow-y-auto chart-paper p-4 md:p-6 gap-5">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Edge Overview Dashboard
          </h1>
          <p className="text-xs opacity-70" style={{ color: 'var(--text-muted)' }}>
            Real-time operational overview — Kerala Coastal Surveillance Edge Node
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-bold text-emerald-600">EDGE NODE ONLINE</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          TOP: 12-CARD OPERATIONAL KPI GRID
         ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl p-3 border shadow-sm flex flex-col gap-2 transition-all hover:shadow-md"
            style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', kpi.bgColor)}>
                <kpi.icon className={cn('w-4 h-4', kpi.color)} />
              </div>
              {kpi.status === 'ok' && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
              {kpi.status === 'warn' && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
              {kpi.status === 'critical' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
              {kpi.status === 'neutral' && <span className="w-2 h-2 rounded-full bg-gray-400" />}
            </div>
            <div>
              <div className={cn('text-lg font-bold font-mono leading-tight', kpi.color)}>
                {kpi.value}
                {kpi.unit && <span className="text-[10px] font-normal opacity-70 ml-1">{kpi.unit}</span>}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {kpi.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          MIDDLE: 3 COLUMN LAYOUT
         ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT: Active Mission Details ── */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col"
          style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center gap-2 pb-3 border-b mb-4" style={{ borderColor: 'var(--line)' }}>
            <Anchor className="w-4 h-4 text-[var(--sea-600)]" />
            <h3 className="font-serif text-sm font-bold">Active Mission</h3>
            {activeMission ? (
              <span className="ml-auto text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded opacity-60" style={{ background: 'var(--sand-200)' }}>
                IDLE
              </span>
            )}
          </div>

          <div className="space-y-3 flex-1">
            <DetailRow icon={<Activity className="w-3.5 h-3.5" />} label="Mission ID" value="MSN-20261016-0942-15-ALPHA" mono />
            <DetailRow icon={<Anchor className="w-3.5 h-3.5" />} label="Mission Name" value="Vizhinjam Seaport Security Patrol" />
            <DetailRow icon={<User className="w-3.5 h-3.5" />} label="Pilot / Operator" value="SI Ramesh Kumar (KP-8842)" />
            <DetailRow icon={<MapPin className="w-3.5 h-3.5" />} label="Location" value="Vizhinjam International Seaport" />
            <DetailRow icon={<Clock className="w-3.5 h-3.5" />} label="Drone" value="UAV-03 — Asteria Falcon Eye" mono />
          </div>

          {/* Elapsed Timer */}
          <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Live Elapsed Time
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-xl font-bold text-emerald-600 tabular-nums">
                  {formatElapsed(elapsed)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CENTER: Flight Dynamics ── */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col"
          style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center gap-2 pb-3 border-b mb-4" style={{ borderColor: 'var(--line)' }}>
            <Activity className="w-4 h-4 text-[var(--sea-600)]" />
            <h3 className="font-serif text-sm font-bold">Flight Dynamics</h3>
            <span className="ml-auto text-[10px] font-mono opacity-60">Live 60s window</span>
          </div>

          {/* Altitude Chart */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Altitude (m)
              </span>
              <span className="font-mono text-xs font-bold text-cyan-600">
                {flightData[flightData.length - 1]?.altitude ?? 0} m
              </span>
            </div>
            <div className="h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={flightData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="altGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="time" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                  <YAxis domain={[60, 160]} tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: 'rgba(0,0,0,0.85)', border: 'none', color: '#fff' }} />
                  <Area type="monotone" dataKey="altitude" stroke="#06b6d4" strokeWidth={2} fill="url(#altGrad)" animationDuration={300} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Speed Chart */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Speed (km/h)
              </span>
              <span className="font-mono text-xs font-bold text-amber-600">
                {flightData[flightData.length - 1]?.speed ?? 0} km/h
              </span>
            </div>
            <div className="h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={flightData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="spdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="time" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                  <YAxis domain={[10, 60]} tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: 'rgba(0,0,0,0.85)', border: 'none', color: '#fff' }} />
                  <Area type="monotone" dataKey="speed" stroke="#f59e0b" strokeWidth={2} fill="url(#spdGrad)" animationDuration={300} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── RIGHT: System Storage & Hardware Meters ── */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col"
          style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center gap-2 pb-3 border-b mb-4" style={{ borderColor: 'var(--line)' }}>
            <HardDrive className="w-4 h-4 text-[var(--sea-600)]" />
            <h3 className="font-serif text-sm font-bold">System Storage &amp; Hardware</h3>
          </div>

          <div className="space-y-5 flex-1">
            {/* Disk Usage */}
            <MeterBar
              label="Disk Usage"
              value={diskUsed}
              icon={<HardDrive className="w-3.5 h-3.5" />}
              detail={`${diskUsed}% of 512 GB NVMe`}
              warnAt={70}
              critAt={90}
            />

            {/* RAM Memory */}
            <MeterBar
              label="RAM Memory"
              value={ramUsed}
              icon={<Database className="w-3.5 h-3.5" />}
              detail={`${ramUsed}% of 32 GB DDR5`}
              warnAt={75}
              critAt={90}
            />

            {/* CPU */}
            <MeterBar
              label="CPU Utilization"
              value={cpuUsage}
              icon={<Cpu className="w-3.5 h-3.5" />}
              detail={`${cpuUsage}% — Intel Core i9-13900HX`}
              warnAt={70}
              critAt={90}
            />

            {/* GPU */}
            <MeterBar
              label="GPU Compute"
              value={gpuUsage}
              icon={<Zap className="w-3.5 h-3.5" />}
              detail={`${gpuUsage}% — NVIDIA Jetson AGX Orin`}
              warnAt={80}
              critAt={95}
            />
          </div>

          {/* Hardware summary footer */}
          <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
              <div className="flex justify-between">
                <span>Uptime:</span>
                <strong className="text-emerald-600">14d 6h</strong>
              </div>
              <div className="flex justify-between">
                <span>Temp:</span>
                <strong className="text-amber-600">62°C</strong>
              </div>
              <div className="flex justify-between">
                <span>Network:</span>
                <strong className="text-emerald-600">1 Gbps</strong>
              </div>
              <div className="flex justify-between">
                <span>Power:</span>
                <strong className="text-emerald-600">AC + UPS</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          BOTTOM: RECENT COMPLETED FLIGHT SORTIES TABLE
         ══════════════════════════════════════════════════ */}
      <div
        className="rounded-2xl p-5 border shadow-sm"
        style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--sea-600)]" />
            <h3 className="font-serif text-sm font-bold">Recent Completed Sorties</h3>
          </div>
          <span className="text-xs opacity-60">{COMPLETED_SORTIES.length} recent flights</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b font-mono opacity-60 uppercase text-[11px]" style={{ borderColor: 'var(--line)' }}>
                <th className="py-2.5 px-3">Mission ID</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">UAV</th>
                <th className="py-2.5 px-3">Pilot</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Ended</th>
                <th className="py-2.5 px-3 text-right">Frames</th>
              </tr>
            </thead>
            <tbody>
              {COMPLETED_SORTIES.map(s => (
                <tr key={s.id} className="border-b transition-colors hover:bg-[var(--sand-100)]" style={{ borderColor: 'var(--line)' }}>
                  <td className="py-2.5 px-3 font-mono font-bold" style={{ color: 'var(--sea-600)' }}>
                    {s.missionId}
                  </td>
                  <td className="py-2.5 px-3 font-medium">
                    {s.name}
                    <div className="text-[10px] opacity-60">{s.location}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono">{s.droneCode}</td>
                  <td className="py-2.5 px-3">{s.pilot}</td>
                  <td className="py-2.5 px-3 font-mono">{s.duration}</td>
                  <td className="py-2.5 px-3 font-mono">{s.endedAt}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold" style={{ color: 'var(--sea-600)' }}>
                    {s.framesProcessed.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function DetailRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--sand-100)', color: 'var(--sea-600)' }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </div>
        <div className={cn('text-sm font-semibold leading-snug', mono && 'font-mono text-xs')}>
          {value}
        </div>
      </div>
    </div>
  );
}

function MeterBar({
  label, value, icon, detail, warnAt, critAt,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  detail: string;
  warnAt: number;
  critAt: number;
}) {
  const color =
    value < warnAt ? 'bg-emerald-500' :
    value < critAt ? 'bg-amber-500' :
    'bg-red-500';
  const textColor =
    value < warnAt ? 'text-emerald-600' :
    value < critAt ? 'text-amber-600' :
    'text-red-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          {icon}
          <span className="text-xs font-semibold">{label}</span>
        </div>
        <span className={cn('font-mono text-sm font-bold tabular-nums', textColor)}>{value}%</span>
      </div>
      <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--sand-200)' }}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <div className="text-[10px] font-mono mt-1 opacity-60">{detail}</div>
    </div>
  );
}

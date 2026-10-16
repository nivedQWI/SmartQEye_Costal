// ============================================================
// SmartQEye Coastal — System Health (/health)
// As specified in Costal Police .docx
// 6 Hardware SVG Donut Gauges + Rolling Timeline Graph
// ============================================================

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity, Cpu, Database, HardDrive, Server,
  Wifi, WifiOff, Thermometer, Zap, Clock
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis,
  YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { cn, formatPct, formatIST } from '@/lib/utils';
import { FeedStateChip, ModalityChip } from '@/components/FeedStateChip';
import { healthApi } from '@/lib/api';
import { useHealthStore } from '@/lib/store';
import { simulator } from '@/lib/simulator';
import type { SystemHealth } from '@/types';

// ─── SVG Donut Gauge Component ────────────────────────────────

function SvgDonutGauge({
  label,
  value,
  max = 100,
  unit = '%',
  warn = 75,
  danger = 90,
  subLabel,
}: {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  warn?: number;
  danger?: number;
  subLabel?: string;
}) {
  const radius = 38;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const offset = circumference - (pct / 100) * circumference;

  const color =
    pct >= danger ? '#C8352E' : pct >= warn ? '#E0A526' : '#2B7FA6';

  return (
    <div
      className="flex flex-col items-center justify-center p-4 rounded-2xl border shadow-sm text-center"
      style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
    >
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--line)"
            strokeWidth={stroke}
            opacity="0.5"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-mono text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            {Math.round(value)}
            <span className="text-xs font-normal opacity-70 ml-0.5">{unit}</span>
          </span>
          {subLabel && <span className="text-[10px] font-mono opacity-60">{subLabel}</span>}
        </div>
      </div>
      <span className="mt-2 text-xs font-bold tracking-wider uppercase text-center" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  );
}

export default function SystemHealth() {
  const { health: storeHealth, updateHealth } = useHealthStore();

  const { data: health = storeHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: healthApi.get,
    refetchInterval: 5000,
    initialData: storeHealth,
  });

  useEffect(() => {
    return simulator.subscribe(event => {
      if (event.type === 'HEALTH_UPDATE') {
        updateHealth(event.payload);
      }
    });
  }, [updateHealth]);

  // Rolling timeline data (60 min simulation)
  const [timelineData, setTimelineData] = useState(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const minAgo = (11 - i) * 5;
      return {
        time: `-${minAgo}m`,
        cpu: Math.round(52 + Math.sin(i * 0.8) * 14 + (Math.random() * 6)),
        gpu: Math.round(68 + Math.cos(i * 0.9) * 12 + (Math.random() * 8)),
        ram: Math.round(61 + i * 0.6),
      };
    });
  });

  useEffect(() => {
    const id = setInterval(() => {
      setTimelineData(prev => {
        const next = [...prev.slice(1)];
        next.push({
          time: 'now',
          cpu: Math.round(health.cpuUsagePct),
          gpu: Math.round(health.gpuUsagePct),
          ram: Math.round(62 + (Math.random() * 4)),
        });
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [health]);

  // Hardware metrics
  const cpuTemp = 64; // °C
  const gpuTemp = 71; // °C
  const ramUsagePct = 64; // % (30.7 / 48 GB)

  return (
    <div className="h-full flex flex-col overflow-y-auto chart-paper p-4 md:p-6 gap-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Hardware Telemetry &amp; System Health
          </h1>
          <p className="text-xs opacity-70" style={{ color: 'var(--text-muted)' }}>
            Real-time server hardware telemetry, GPU thermals, rolling load curves, and live camera feed diagnostics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full font-mono font-medium border bg-emerald-50 text-emerald-800 border-emerald-300">
            Node: TVM-EDGE-PRIMARY · DB: {health.dbStatus}
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          TOP GRID: 6 HARDWARE SVG DONUT GAUGES (DOCX SPEC)
         ══════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-[var(--sea-600)]" />
          <h2 className="font-serif text-xs font-bold uppercase tracking-wider opacity-75">
            Hardware Sensor Donut Telemetry
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* 1. CPU Usage % */}
          <SvgDonutGauge
            label="CPU Usage"
            value={health.cpuUsagePct}
            unit="%"
            warn={75}
            danger={90}
            subLabel="32 Cores"
          />

          {/* 2. CPU Temperature (°C) */}
          <SvgDonutGauge
            label="CPU Temp"
            value={cpuTemp}
            max={100}
            unit="°C"
            warn={70}
            danger={85}
            subLabel="Normal"
          />

          {/* 3. GPU Usage % */}
          <SvgDonutGauge
            label="GPU Compute"
            value={health.gpuUsagePct}
            unit="%"
            warn={80}
            danger={92}
            subLabel="CUDA Load"
          />

          {/* 4. GPU Temperature (°C) */}
          <SvgDonutGauge
            label="GPU Temp"
            value={gpuTemp}
            max={100}
            unit="°C"
            warn={78}
            danger={88}
            subLabel="RTX 4090"
          />

          {/* 5. Memory (RAM) % */}
          <SvgDonutGauge
            label="Memory RAM"
            value={ramUsagePct}
            unit="%"
            warn={80}
            danger={90}
            subLabel="30.7/48 GB"
          />

          {/* 6. SSD Storage % */}
          <SvgDonutGauge
            label="SSD Storage"
            value={health.storageUsagePct}
            unit="%"
            warn={85}
            danger={95}
            subLabel={`${health.storageUsedTB.toFixed(1)} TB`}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          BOTTOM: MULTI-LINE TIMELINE GRAPH (DOCX SPEC)
         ══════════════════════════════════════════════════ */}
      <div
        className="rounded-2xl p-5 border shadow-sm"
        style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--sea-600)]" />
            <h3 className="font-serif text-sm font-bold">
              Rolling Timeline: System Resource Consumption
            </h3>
          </div>
          <span className="text-xs font-mono opacity-60">Sampled every 5s · Last 60 minutes</span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="time" stroke="#888888" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#888888" fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{
                  background: 'var(--raised)',
                  borderColor: 'var(--line)',
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="cpu" name="CPU Usage %" stroke="#2B7FA6" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="gpu" name="GPU Compute %" stroke="#E0A526" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="ram" name="Memory RAM %" stroke="#3FAE9A" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          FEED HEALTH DIAGNOSTICS TABLE
         ══════════════════════════════════════════════════ */}
      <div
        className="rounded-2xl p-5 border shadow-sm"
        style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--sea-600)]" />
            <h3 className="font-serif text-sm font-bold">Drone Feeds Health &amp; Ingestion Latency</h3>
          </div>
          <span className="text-xs font-mono opacity-60">{health.feeds.length} Active Feeds</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b font-mono opacity-60 uppercase text-[11px]" style={{ borderColor: 'var(--line)' }}>
                <th className="py-2.5 px-3">UAV Code</th>
                <th className="py-2.5 px-3">Modality</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">FPS Current/Target</th>
                <th className="py-2.5 px-3 text-right">Latency</th>
                <th className="py-2.5 px-3 text-right">Bitrate</th>
                <th className="py-2.5 px-3 text-right">Dropped Frames</th>
                <th className="py-2.5 px-3 text-right">Telemetry Age</th>
              </tr>
            </thead>
            <tbody>
              {health.feeds.map(feed => (
                <tr
                  key={feed.feedId}
                  className="border-b transition-colors hover:bg-[var(--sand-100)]"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <td className="py-2.5 px-3 font-mono font-bold">{feed.uavCode}</td>
                  <td className="py-2.5 px-3">
                    <ModalityChip modality={feed.modality} size="sm" />
                  </td>
                  <td className="py-2.5 px-3">
                    <FeedStateChip state={feed.state} size="sm" />
                  </td>
                  <td className={cn('py-2.5 px-3 text-right font-mono', feed.fpsCurrent < feed.fpsTarget * 0.8 && 'text-amber-600')}>
                    {feed.fpsCurrent.toFixed(1)} / {feed.fpsTarget}
                  </td>
                  <td className={cn('py-2.5 px-3 text-right font-mono', feed.latencyMs > 500 && 'text-amber-600')}>
                    {feed.latencyMs} ms
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">{feed.bitrateMbps.toFixed(1)} Mbps</td>
                  <td className={cn('py-2.5 px-3 text-right font-mono', feed.droppedFrames > 0 && 'text-red-500 font-bold')}>
                    {feed.droppedFrames}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">{(feed.lastTelemetryAgeMs / 1000).toFixed(1)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SmartQEye Coastal — Crowd Analytics (/crowd-analytics)
// As specified in Costal Police .docx
// ============================================================

import { useState, useEffect } from 'react';
import {
  Users, TrendingUp, TrendingDown, AlertTriangle,
  Download, Eye, EyeOff, Layers, Activity, Clock,
  FileText, ShieldAlert, Sparkles, MapPin
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis,
  YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { cn } from '@/lib/utils';
import { UAVS } from '@/lib/mockData';

export default function CrowdAnalyticsPage() {
  const [selectedDrone, setSelectedDrone] = useState('UAV-KL-02');
  const [selectedModel, setSelectedModel] = useState<'CSRNet Part A' | 'CSRNet Part B' | 'DM-Count' | 'YOLO-Crowd'>('CSRNet Part A');
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Live KPI values
  const [currentCount, setCurrentCount] = useState(1420);
  const [peakCount] = useState({ count: 2180, time: '17:45 IST' });
  const [activeAlerts, setActiveAlerts] = useState(2);
  const [densityRating, setDensityRating] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [densityPpm2, setDensityPpm2] = useState(3.4);
  const [isIncreasing, setIsIncreasing] = useState(true);

  // 24-hour crowd trend timeline
  const [trendData] = useState(() => [
    { time: '06:00', count: 320, threshold: 1800 },
    { time: '08:00', count: 680, threshold: 1800 },
    { time: '10:00', count: 1140, threshold: 1800 },
    { time: '12:00', count: 1490, threshold: 1800 },
    { time: '14:00', count: 1280, threshold: 1800 },
    { time: '16:00', count: 1820, threshold: 1800 },
    { time: '17:00', count: 2180, threshold: 1800 },
    { time: '18:00', count: 1960, threshold: 1800 },
    { time: '19:00', count: 1540, threshold: 1800 },
    { time: '20:00', count: 1420, threshold: 1800 },
  ]);

  // Zone distribution
  const [zones] = useState([
    { id: 'z-1', name: 'Kovalam Lighthouse Beach Promenade', areaM2: 650, count: 520, ppm2: 0.8, status: 'MEDIUM' as const },
    { id: 'z-2', name: 'Hawa Beach Entrance Bottleneck', areaM2: 240, count: 480, ppm2: 2.0, status: 'HIGH' as const },
    { id: 'z-3', name: 'Samudra Beach North Steps', areaM2: 180, count: 320, ppm2: 1.77, status: 'HIGH' as const },
    { id: 'z-4', name: 'Vizhinjam Fishing Harbor Fish Landing Wharf', areaM2: 300, count: 100, ppm2: 0.33, status: 'LOW' as const },
  ]);

  // Alert Log
  const [alertLog] = useState([
    { id: 'c-alt-1', time: '18:42 IST', type: 'CROWD_SURGE', location: 'Hawa Beach Chokepoint', severity: 'HIGH', note: 'Threshold 1.8 p/m² exceeded' },
    { id: 'c-alt-2', time: '17:15 IST', type: 'DENSITY_PEAK', location: 'Lighthouse Promenade', severity: 'CRITICAL', note: 'Stampede risk buffer <15%' },
    { id: 'c-alt-3', time: '14:20 IST', type: 'BOTTLENECK_WARNING', location: 'North Steps Access', severity: 'MEDIUM', note: 'Egress rate lagging intake' },
  ]);

  // Live slight pulse
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentCount(c => {
        const delta = Math.floor(Math.random() * 21) - 10;
        const next = Math.max(800, c + delta);
        setIsIncreasing(delta >= 0);
        setDensityPpm2(parseFloat((next / 420).toFixed(2)));
        if (next > 1800) setDensityRating('CRITICAL');
        else if (next > 1300) setDensityRating('HIGH');
        else setDensityRating('MEDIUM');
        return next;
      });
    }, 4000);
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
            <option value="YOLO-Crowd">YOLOv8-Crowd Head Detector</option>
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
          <div className="text-3xl font-bold font-mono tracking-tight">{peakCount.count.toLocaleString()}</div>
          <p className="text-[11px] opacity-75 font-mono mt-1 text-amber-600 dark:text-amber-400 font-semibold">
            At {peakCount.time} (Sunset Surge)
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
        {/* Left (60% / 3 cols): Live Camera Stream with Density Heatmap overlay */}
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
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-colors',
                showHeatmap
                  ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40'
                  : 'bg-[var(--panel)] border-[var(--line)] opacity-70'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              {showHeatmap ? 'Heatmap: ACTIVE' : 'Heatmap: OFF'}
            </button>
          </div>

          {/* Video Placeholder Canvas with Heatmap Gradient */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border" style={{ borderColor: 'var(--line)' }}>
            <img
              src="/coastal_harbor_bg.png"
              alt="Live Drone View"
              className="w-full h-full object-cover"
            />

            {/* Neural Heatmap Overlay Simulation */}
            {showHeatmap && (
              <div
                className="absolute inset-0 pointer-events-none mix-blend-color-dodge transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(ellipse 65% 55% at 50% 65%, rgba(239, 68, 68, 0.75) 0%, rgba(245, 158, 11, 0.55) 45%, rgba(56, 189, 248, 0.25) 80%, transparent 100%)',
                }}
              />
            )}

            {/* Bounding box badges */}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-lg text-white font-mono text-[11px] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Model: {selectedModel}</span>
              <span className="opacity-50">|</span>
              <span>Inference: 18.4ms</span>
            </div>

            <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-xs px-3 py-1 rounded-lg text-white font-mono text-xs">
              Density Hotspot: <strong>3.42 p/m²</strong> (Alert Threshold Exceeded)
            </div>
          </div>
        </div>

        {/* Right (40% / 2 cols): Crowd Density Area Chart (24h Trend) */}
        <div
          className="lg:col-span-2 rounded-2xl p-4 border shadow-sm flex flex-col justify-between"
          style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-serif text-sm font-bold">24h Crowd Trend Curve</h3>
            <span className="text-[11px] font-mono text-red-600 font-bold">Threshold: 1,800</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="crowdAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2B7FA6" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#2B7FA6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="time" stroke="#888888" fontSize={10} />
                <YAxis stroke="#888888" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--raised)',
                    borderColor: 'var(--line)',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="#2B7FA6" strokeWidth={2.5} fillOpacity={1} fill="url(#crowdAreaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] opacity-65 font-mono text-center mt-2">
            Observed evening congregation spikes correlate with sunset tourist departures
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
                  <tr key={z.id} className="border-b transition-colors hover:bg-[var(--sand-100)]" style={{ borderColor: 'var(--line)' }}>
                    <td className="py-2.5 px-3 font-semibold">{z.name}</td>
                    <td className="py-2.5 px-3 font-mono">{z.areaM2} m²</td>
                    <td className="py-2.5 px-3 font-mono font-bold">{z.count}</td>
                    <td className="py-2.5 px-3 font-mono font-bold">{z.ppm2} p/m²</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-mono font-bold border',
                        z.status === 'HIGH' && 'bg-amber-100 text-amber-800 border-amber-300',
                        z.status === 'MEDIUM' && 'bg-sky-100 text-sky-800 border-sky-300',
                        z.status === 'LOW' && 'bg-emerald-100 text-emerald-800 border-emerald-300'
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

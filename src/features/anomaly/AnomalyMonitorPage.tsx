// ============================================================
// SmartQEye Coastal — Anomaly Monitor (/anomaly-monitor)
// As specified in Costal Police .docx
// ============================================================

import { useState } from 'react';
import {
  AlertTriangle, ShieldAlert, Play, Pause, RotateCcw,
  Download, Filter, Search, CheckCircle, Clock,
  Video, Eye, AlertOctagon, TrendingUp, Sliders
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { cn } from '@/lib/utils';
import { AnomalyRecord, AnomalyType } from '@/types';
import { HumanInterpretationNote } from '@/components/HumanInterpretationNote';
import { DroneVideoPlayer } from '@/components/DroneVideoPlayer';

// Mock anomalies
const INITIAL_ANOMALIES: AnomalyRecord[] = [
  {
    id: 'anom-01',
    category: 'PERSON',
    anomalyType: 'LOITERING',
    riskScore: 88,
    droneCode: 'UAV-KL-01',
    timestamp: '19:42:15 IST',
    clipReplaySec: 30,
    description: 'Subject lingering stationary beside fuel storage perimeter fence for >14 minutes without authorized activity.',
    status: 'NEW'
  },
  {
    id: 'anom-02',
    category: 'TRAFFIC',
    anomalyType: 'WRONG_WAY_DRIVING',
    riskScore: 94,
    droneCode: 'UAV-KL-02',
    timestamp: '19:35:40 IST',
    clipReplaySec: 20,
    description: 'Vehicle KL-16-J-8812 proceeding against one-way port exit flow at 48 km/h.',
    status: 'ESCALATED'
  },
  {
    id: 'anom-03',
    category: 'PERSON',
    anomalyType: 'SUDDEN_FALL',
    riskScore: 76,
    droneCode: 'UAV-KL-03',
    timestamp: '19:12:05 IST',
    clipReplaySec: 15,
    description: 'Pedestrian collapsed near Samudra North rocky slope. Rapid body velocity deceleration detected.',
    status: 'REVIEWED'
  },
  {
    id: 'anom-04',
    category: 'MARINE',
    anomalyType: 'ERRATIC_SPEEDING',
    riskScore: 91,
    droneCode: 'UAV-KL-02',
    timestamp: '18:55:18 IST',
    clipReplaySec: 30,
    description: 'Unidentified speedboat zig-zagging abruptly within 50m of commercial cargo fairway.',
    status: 'ESCALATED'
  },
  {
    id: 'anom-05',
    category: 'PERSON',
    anomalyType: 'FLEEING',
    riskScore: 82,
    droneCode: 'UAV-KL-01',
    timestamp: '18:20:10 IST',
    clipReplaySec: 25,
    description: 'Two individuals sprinted abruptly away upon sight of coastal patrol boat approach.',
    status: 'REVIEWED'
  },
  {
    id: 'anom-06',
    category: 'TRAFFIC',
    anomalyType: 'ABRUPT_STOP',
    riskScore: 65,
    droneCode: 'UAV-KL-01',
    timestamp: '17:40:55 IST',
    clipReplaySec: 10,
    description: 'White sedan made abrupt emergency stop on active coastal highway lane without hazard beacons.',
    status: 'FALSE_POSITIVE'
  }
];

// 24h timeline frequency
const TIMELINE_DATA = [
  { time: '04:00', count: 1, person: 1, traffic: 0, marine: 0 },
  { time: '07:00', count: 3, person: 1, traffic: 2, marine: 0 },
  { time: '10:00', count: 6, person: 4, traffic: 1, marine: 1 },
  { time: '13:00', count: 4, person: 2, traffic: 1, marine: 1 },
  { time: '16:00', count: 9, person: 5, traffic: 3, marine: 1 },
  { time: '18:00', count: 14, person: 8, traffic: 4, marine: 2 },
  { time: '19:45', count: 11, person: 6, traffic: 3, marine: 2 },
];

export default function AnomalyMonitorPage() {
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>(INITIAL_ANOMALIES);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyRecord>(INITIAL_ANOMALIES[0]);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PERSON' | 'TRAFFIC' | 'MARINE'>('ALL');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(12);

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
            <span className="font-mono text-2xl font-bold" style={{ color: 'var(--accent)' }}>48</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-[10px] text-slate-500 mt-1">28 Person · 14 Traffic · 6 Marine</div>
        </div>

        <div className="card-sand p-3.5 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            False Positive Rate
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-emerald-700">3.8%</span>
            <span className="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-50 px-1 py-0.5 rounded">
              High Precision
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">SlowFast + ST-GCN Ensembles</div>
        </div>

        <div className="card-sand p-3.5 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Avg Clip Replay Size
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-slate-800">22.5s</span>
            <Video className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Buffered in GPU ring memory</div>
        </div>
      </div>

      {/* ── Main Section: Instant Clip Replay Scrubber & 24h Area Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Instant Video Clip Replay Player & Scrubber */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="card-sand p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[var(--accent)]" />
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

            {/* Drone Video Player with Built-in Scrubber & CFS State */}
            <div className="w-full aspect-video rounded-lg overflow-hidden border border-[var(--border)] bg-slate-950 flex flex-col">
              <DroneVideoPlayer
                sceneName="vizhinjam_patrol"
                autoPlay={isPlaying}
                loop={true}
                showControls={true}
                className="w-full h-full"
              />
            </div>

            {/* Description & Action Bar */}
            <div className="p-3 bg-[var(--surface-muted)] rounded border border-[var(--border)] flex flex-col gap-2">

              {/* Description & Action Bar */}
              <div className="text-xs text-slate-700 font-sans mt-1 p-2 bg-[var(--surface)] rounded border border-[var(--border)]">
                <span className="font-bold text-slate-900">Incident Narrative: </span>
                {selectedAnomaly.description}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedAnomaly.id, 'ESCALATED')}
                    className="px-2.5 py-1 rounded bg-red-700 hover:bg-red-800 text-white font-mono text-[11px] font-bold"
                  >
                    Escalate to Police Control
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedAnomaly.id, 'FALSE_POSITIVE')}
                    className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-mono text-[11px] font-bold"
                  >
                    Mark False Positive
                  </button>
                </div>

                <button
                  onClick={() => handleUpdateStatus(selectedAnomaly.id, 'REVIEWED')}
                  className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-[11px] font-bold"
                >
                  Mark Reviewed
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): 24h Anomaly Occurrence Frequency Area Chart */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="card-sand p-4 flex flex-col gap-3">
            <div>
              <h3 className="font-serif text-sm font-bold text-[var(--text)]">
                24-Hour Anomaly Distribution Trend
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Occurrence frequency breakdown across person, vehicle, and marine categories
              </p>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TIMELINE_DATA}>
                  <defs>
                    <linearGradient id="anomGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: 'var(--text)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#anomGrad)"
                    name="Total Anomalies"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border)] text-center text-xs font-mono">
              <div className="p-2 bg-[var(--surface-muted)] rounded">
                <div className="text-slate-500 text-[10px]">PERSON</div>
                <div className="font-bold text-slate-800 text-sm">28</div>
              </div>
              <div className="p-2 bg-[var(--surface-muted)] rounded">
                <div className="text-slate-500 text-[10px]">TRAFFIC</div>
                <div className="font-bold text-slate-800 text-sm">14</div>
              </div>
              <div className="p-2 bg-[var(--surface-muted)] rounded">
                <div className="text-slate-500 text-[10px]">MARINE</div>
                <div className="font-bold text-slate-800 text-sm">6</div>
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
              Select an incident from the log to view instant forensic replay and trigger escalation actions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 bg-[var(--surface-muted)] border border-[var(--border)] rounded text-xs font-mono">
              <button
                onClick={() => setCategoryFilter('ALL')}
                className={cn("px-2.5 py-1 rounded", categoryFilter === 'ALL' ? "bg-[var(--surface)] text-[var(--accent)] font-bold" : "text-slate-600")}
              >
                All
              </button>
              <button
                onClick={() => setCategoryFilter('PERSON')}
                className={cn("px-2.5 py-1 rounded", categoryFilter === 'PERSON' ? "bg-[var(--surface)] text-[var(--accent)] font-bold" : "text-slate-600")}
              >
                Person
              </button>
              <button
                onClick={() => setCategoryFilter('TRAFFIC')}
                className={cn("px-2.5 py-1 rounded", categoryFilter === 'TRAFFIC' ? "bg-[var(--surface)] text-[var(--accent)] font-bold" : "text-slate-600")}
              >
                Traffic
              </button>
              <button
                onClick={() => setCategoryFilter('MARINE')}
                className={cn("px-2.5 py-1 rounded", categoryFilter === 'MARINE' ? "bg-[var(--surface)] text-[var(--accent)] font-bold" : "text-slate-600")}
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
                  onClick={() => setSelectedAnomaly(item)}
                  className={cn(
                    "hover:bg-[var(--surface-hover)] transition-colors cursor-pointer",
                    selectedAnomaly.id === item.id ? "bg-amber-50/60 font-medium" : ""
                  )}
                >
                  <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{item.timestamp}</td>
                  <td className="p-3 font-mono font-bold text-[var(--accent)]">{item.id}</td>
                  <td className="p-3 font-mono font-semibold text-slate-700">{item.category}</td>
                  <td className="p-3 font-sans font-bold text-slate-900">{item.anomalyType.replace('_', ' ')}</td>
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
                  <td className="p-3 font-mono text-slate-600">{item.droneCode}</td>
                  <td className="p-3 font-mono">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold",
                      item.status === 'NEW' ? "bg-red-600 text-white animate-pulse" :
                      item.status === 'ESCALATED' ? "bg-amber-100 text-amber-800 border border-amber-300" :
                      item.status === 'REVIEWED' ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                      "bg-slate-100 text-slate-600 border border-slate-300"
                    )}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 max-w-xs truncate">{item.description}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAnomaly(item);
                      }}
                      className="px-2 py-1 rounded bg-[var(--surface-muted)] hover:bg-[var(--surface)] border border-[var(--border)] font-mono text-[10px] font-semibold text-[var(--accent)] hover:underline"
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
    </div>
  );
}

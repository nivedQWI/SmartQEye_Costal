// ============================================================
// SmartQEye Coastal — Intrusion Detection & Geofencing (/intrusion-detection)
// As specified in Costal Police .docx
// ============================================================

import { useState } from 'react';
import {
  ShieldAlert, ShieldCheck, AlertOctagon, Download,
  Eye, Bell, MapPin, Radio, CheckCircle,
  Plus, Trash2, Video, Layers, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { can } from '@/lib/roleConfig';
import { IntrusionRecord } from '@/types';

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
    targetCriteria: ['PERSON'],
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

// Mock Intrusion Records
const INITIAL_INTRUSIONS: IntrusionRecord[] = [
  {
    id: 'intr-01',
    zoneId: 'zone-1',
    zoneName: 'Vizhinjam Naval Jetty & Fuel Wharf',
    breachType: 'PERSON',
    targetCode: 'TARGET-TRK-9041',
    severity: 'CRITICAL',
    dwellTimeSec: 84,
    timestamp: '19:42:10 IST',
    snapshotUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    status: 'ACTIVE'
  },
  {
    id: 'intr-02',
    zoneId: 'zone-1',
    zoneName: 'Vizhinjam Naval Jetty & Fuel Wharf',
    breachType: 'VESSEL',
    targetCode: 'VESSEL-DHOW-09',
    severity: 'HIGH',
    dwellTimeSec: 210,
    timestamp: '19:15:32 IST',
    snapshotUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=150&q=80',
    status: 'DISPATCHED'
  },
  {
    id: 'intr-03',
    zoneId: 'zone-2',
    zoneName: 'Kovalam Lighthouse Cliff Edge Barrier',
    breachType: 'PERSON',
    targetCode: 'TARGET-TRK-8812',
    severity: 'MEDIUM',
    dwellTimeSec: 45,
    timestamp: '18:50:18 IST',
    snapshotUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    status: 'RESOLVED'
  },
  {
    id: 'intr-04',
    zoneId: 'zone-3',
    zoneName: 'Coastal Police Fast Interceptor Berth',
    breachType: 'VESSEL',
    targetCode: 'VESSEL-KERALA-33',
    severity: 'HIGH',
    dwellTimeSec: 12,
    timestamp: '17:30:45 IST',
    snapshotUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=150&q=80',
    status: 'ACKNOWLEDGED'
  }
];

export default function IntrusionDetectionPage() {
  const { user, devRole } = useAuthStore();
  const activeRole = user?.role ?? devRole ?? 'OPERATOR';
  const [zones, setZones] = useState<VirtualZone[]>(INITIAL_ZONES);
  const [intrusions, setIntrusions] = useState<IntrusionRecord[]>(INITIAL_INTRUSIONS);
  const [selectedZone, setSelectedZone] = useState<VirtualZone | null>(INITIAL_ZONES[0]);
  const [isSimulatingBreach, setIsSimulatingBreach] = useState(false);
  const [inspectRecord, setInspectRecord] = useState<IntrusionRecord | null>(null);

  // Trigger simulated breach
  function handleSimulateBreach() {
    setIsSimulatingBreach(true);
    const newBreach: IntrusionRecord = {
      id: `intr-${Date.now().toString().slice(-4)}`,
      zoneId: 'zone-1',
      zoneName: 'Vizhinjam Naval Jetty & Fuel Wharf',
      breachType: 'PERSON',
      targetCode: `TARGET-TRK-${Math.floor(1000 + Math.random() * 9000)}`,
      severity: 'CRITICAL',
      dwellTimeSec: 8,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
      snapshotUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
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
            <div className="relative rounded-lg overflow-hidden border border-[var(--border)] bg-slate-950 aspect-video flex flex-col justify-between p-3 select-none">
              <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 640 400">
                  <defs>
                    <pattern id="secGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="640" height="400" fill="url(#secGrid)" />

                  {/* Port Jetty Shoreline Outline */}
                  <path d="M 0 280 L 180 260 L 320 180 L 480 180 L 640 240 L 640 400 L 0 400 Z" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
                  <text x="30" y="320" fill="#475569" fontSize="12" fontFamily="serif" fontWeight="bold">VIZHINJAM SHORELINE</text>

                  {/* Zone 1: Prohibited Naval Berth Polygon (Flashing Red) */}
                  <polygon
                    points="120,80 340,60 380,220 160,240"
                    fill="rgba(239, 68, 68, 0.25)"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    className="animate-pulse"
                  />
                  <rect x="130" y="90" width="160" height="20" fill="rgba(239, 68, 68, 0.9)" rx="3" />
                  <text x="136" y="104" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">ZONE 1: NAVAL BERTH [BREACH]</text>

                  {/* Target 9041 inside Zone 1 */}
                  <g transform="translate(240, 150)">
                    <circle cx="0" cy="0" r="16" fill="rgba(239, 68, 68, 0.4)" className="animate-ping" />
                    <circle cx="0" cy="0" r="7" fill="#ef4444" />
                    <rect x="10" y="-12" width="120" height="20" fill="#ef4444" rx="2" />
                    <text x="14" y="2" fill="#ffffff" fontSize="8.5" fontFamily="monospace" fontWeight="bold">TARGET-TRK-9041 (84s)</text>
                    <line x1="0" y1="0" x2="-20" y2="15" stroke="#ef4444" strokeWidth="2" />
                  </g>

                  {/* Zone 2: Cliff Edge Safety Polygon (Yellow) */}
                  <polygon
                    points="420,120 600,100 620,250 440,240"
                    fill="rgba(245, 158, 11, 0.15)"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <rect x="430" y="130" width="140" height="18" fill="rgba(245, 158, 11, 0.85)" rx="2" />
                  <text x="436" y="143" fill="#ffffff" fontSize="8.5" fontFamily="monospace" fontWeight="bold">ZONE 2: CLIFF EDGE BUFFER</text>
                </svg>
              </div>

              {/* HUD Header */}
              <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-300">
                <span className="bg-slate-900/90 px-2.5 py-1 rounded border border-slate-700 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  UAV-KL-01 · 30 FPS RTMP
                </span>
                <span className="bg-red-950/90 text-red-200 px-2.5 py-1 rounded border border-red-500/50 font-bold flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  ALARM: INTRUSION ACTIVE IN ZONE 1
                </span>
              </div>

              {/* HUD Footer */}
              <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-300 bg-slate-950/85 p-2 rounded border border-slate-800">
                <span className="text-emerald-400">GEOFENCE ENGINE: SHAPELY POLYGON INTERSECTION</span>
                <span className="text-slate-400">LATENCY: 12MS | POLYGON EVAL: 60 HZ</span>
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
                    <img
                      src={item.snapshotUrl}
                      alt={item.targetCode}
                      className="w-10 h-8 object-cover rounded border"
                      style={{ borderColor: 'var(--line)' }}
                    />
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
          <div className="card-sand max-w-md w-full p-5 flex flex-col gap-4 shadow-2xl border" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <h3 className="font-serif text-base font-bold" style={{ color: 'var(--text)' }}>Perimeter Breach Record</h3>
              </div>
              <button onClick={() => setInspectRecord(null)} className="text-lg font-bold hover:opacity-80 cursor-pointer" style={{ color: 'var(--text-muted)' }}>×</button>
            </div>

            <div className="flex justify-center">
              <img
                src={inspectRecord.snapshotUrl}
                alt={inspectRecord.targetCode}
                className="w-40 h-32 object-cover rounded-md border-2 border-red-500 shadow-md"
              />
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Zone Breached:</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>{inspectRecord.zoneName}</span>
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target Code:</span>
                <span className="font-bold text-red-600 dark:text-red-400">{inspectRecord.targetCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target Classification:</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>{inspectRecord.breachType}</span>
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Dwell Duration:</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>{inspectRecord.dwellTimeSec} seconds</span>
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Breach Timestamp:</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>{inspectRecord.timestamp}</span>
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Response Status:</span>
                <span className="font-bold text-[var(--sea-600)] dark:text-[var(--sea-accent)]">{inspectRecord.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
              {inspectRecord.status !== 'RESOLVED' && can(activeRole, 'RESOLVE_ALERT') ? (
                <button
                  onClick={() => handleUpdateStatus(inspectRecord.id, 'RESOLVED')}
                  className="px-3 py-1.5 rounded bg-emerald-700 text-white font-mono text-xs font-bold"
                >
                  Mark Resolved
                </button>
              ) : inspectRecord.status === 'RESOLVED' ? (
                <span className="text-xs text-emerald-700 font-bold">✓ Incident Closed</span>
              ) : null}

              <button
                onClick={() => setInspectRecord(null)}
                className="btn-navy text-xs px-4 py-2 rounded"
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

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
import { HumanInterpretationNote } from '@/components/HumanInterpretationNote';
import { DroneVideoPlayer } from '@/components/DroneVideoPlayer';
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
    snapshotUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100"><rect width="150" height="100" fill="%237f1d1d"/><text x="75" y="55" fill="%23ffffff" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">TARGET-TRK-9041</text></svg>',
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
    snapshotUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100"><rect width="150" height="100" fill="%230c4a6e"/><text x="75" y="55" fill="%23ffffff" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">VESSEL-DHOW-09</text></svg>',
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
    snapshotUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100"><rect width="150" height="100" fill="%23b45309"/><text x="75" y="55" fill="%23ffffff" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">TARGET-TRK-8812</text></svg>',
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
    snapshotUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100"><rect width="150" height="100" fill="%231e293b"/><text x="75" y="55" fill="%23ffffff" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">VESSEL-KERALA-33</text></svg>',
    status: 'ACKNOWLEDGED'
  }
];

export default function IntrusionDetectionPage() {
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
      snapshotUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100"><rect width="150" height="100" fill="%23dc2626"/><text x="75" y="55" fill="%23ffffff" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">SIMULATED BREACH</text></svg>',
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

          <button
            onClick={handleExportJson}
            className="btn-navy text-xs flex items-center gap-1.5 px-3 py-1.5 rounded"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON Audit
          </button>
        </div>
      </div>

      {/* ── Top 4 KPI Metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="card-sand p-3.5 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Active Virtual Geofences
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold" style={{ color: 'var(--accent)' }}>{zones.length}</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-[10px] text-slate-500 mt-1">2 Prohibited · 1 Safety Buffer</div>
        </div>

        <div className="card-sand p-3.5 flex flex-col justify-between border-l-4 border-l-red-600">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-red-900">
            Active Perimeter Breaches
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-red-700">
              {intrusions.filter(i => i.status === 'ACTIVE').length}
            </span>
            <span className="animate-pulse bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-300">
              LIVE ALARM
            </span>
          </div>
          <div className="text-[10px] text-red-800 font-semibold mt-1">Naval Jetty Sector</div>
        </div>

        <div className="card-sand p-3.5 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Mean Response Time
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-slate-800">18.4s</span>
            <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-1 py-0.5 rounded">
              SLA &lt;30s
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">From trigger to dispatch</div>
        </div>

        <div className="card-sand p-3.5 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Total Breaches (24h)
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-slate-800">{intrusions.length}</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-[10px] text-slate-500 mt-1">3 Neutralized / 1 Active</div>
        </div>
      </div>

      {/* ── Main Layout: Drone Video with Polygon Overlay + Geofence Zone Manager ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Drone Video Stream with Geofence Tripwire Polygons */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="card-sand p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[var(--accent)]" />
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

            {/* Live Drone Video Player with Dynamic Zone Overlay & Detections */}
            <div className="w-full aspect-video rounded-lg overflow-hidden border border-[var(--border)] bg-slate-950 flex flex-col">
              <DroneVideoPlayer
                sceneName="vizhinjam_patrol"
                autoPlay={true}
                loop={true}
                showControls={true}
                className="w-full h-full"
              />
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
              {zones.map(z => (
                <div
                  key={z.id}
                  onClick={() => setSelectedZone(z)}
                  className={cn(
                    "p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5",
                    z.activeBreaches > 0
                      ? "bg-red-50/80 border-red-300 hover:border-red-500"
                      : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xs font-bold text-slate-900">{z.name}</span>
                    {z.activeBreaches > 0 ? (
                      <span className="animate-pulse bg-red-100 text-red-800 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-300">
                        {z.activeBreaches} BREACH
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-800 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                        CLEAR
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2">{z.description}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px] font-mono text-slate-500">
                    <span>Criteria: {z.targetCriteria.join(', ')}</span>
                    <span>Max Dwell: {z.maxDwellSec}s</span>
                  </div>
                </div>
              ))}
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

        <div className="overflow-x-auto border border-[var(--border)] rounded-md">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--surface-muted)] text-[var(--text-muted)] border-b border-[var(--border)] font-mono text-[11px] uppercase">
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
            <tbody className="divide-y divide-[var(--border)]">
              {intrusions.map(item => (
                <tr key={item.id} className={cn("hover:bg-[var(--surface-hover)] transition-colors", item.status === 'ACTIVE' ? "bg-red-50/50" : "")}>
                  <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{item.timestamp}</td>
                  <td className="p-3">
                    <img
                      src={item.snapshotUrl}
                      alt={item.targetCode}
                      className="w-10 h-8 object-cover rounded border border-[var(--border)]"
                    />
                  </td>
                  <td className="p-3 font-medium text-slate-800">{item.zoneName}</td>
                  <td className="p-3 font-mono font-bold text-[var(--accent)]">{item.targetCode}</td>
                  <td className="p-3 font-mono font-bold text-slate-700">{item.breachType}</td>
                  <td className="p-3 font-mono text-slate-800">{item.dwellTimeSec}s</td>
                  <td className="p-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold font-mono",
                      item.severity === 'CRITICAL' ? "bg-red-100 text-red-800 border border-red-300" :
                      item.severity === 'HIGH' ? "bg-orange-100 text-orange-800 border border-orange-300" :
                      "bg-amber-100 text-amber-800 border border-amber-300"
                    )}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold font-mono",
                      item.status === 'ACTIVE' ? "bg-red-600 text-white animate-pulse" :
                      item.status === 'DISPATCHED' ? "bg-sky-100 text-sky-800 border border-sky-300" :
                      item.status === 'ACKNOWLEDGED' ? "bg-amber-100 text-amber-800 border border-amber-300" :
                      "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    )}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'DISPATCHED')}
                          className="px-2 py-1 rounded bg-amber-700 hover:bg-amber-800 text-white font-mono text-[10px] font-bold"
                        >
                          Recommend response
                        </button>
                      )}
                      {item.status === 'DISPATCHED' && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'RESOLVED')}
                          className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-[10px] font-bold"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => setInspectRecord(item)}
                        className="px-2 py-1 rounded bg-[var(--surface-muted)] hover:bg-[var(--surface)] border border-[var(--border)] font-mono text-[10px] font-semibold text-[var(--accent)]"
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
          <div className="card-sand max-w-md w-full p-5 flex flex-col gap-4 shadow-2xl border border-[var(--border)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <h3 className="font-serif text-base font-bold text-[var(--text)]">Perimeter Breach Record</h3>
              </div>
              <button onClick={() => setInspectRecord(null)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">×</button>
            </div>

            <div className="flex justify-center">
              <img
                src={inspectRecord.snapshotUrl}
                alt={inspectRecord.targetCode}
                className="w-40 h-32 object-cover rounded-md border-2 border-red-500 shadow-md"
              />
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Zone Breached:</span>
                <span className="font-bold text-slate-900">{inspectRecord.zoneName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Target Code:</span>
                <span className="font-bold text-red-700">{inspectRecord.targetCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Target Classification:</span>
                <span className="font-bold text-slate-800">{inspectRecord.breachType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Dwell Duration:</span>
                <span className="font-bold text-slate-800">{inspectRecord.dwellTimeSec} seconds</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Breach Timestamp:</span>
                <span className="font-bold text-slate-800">{inspectRecord.timestamp}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Response Status:</span>
                <span className="font-bold text-[var(--accent)]">{inspectRecord.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
              {inspectRecord.status !== 'RESOLVED' ? (
                <button
                  onClick={() => handleUpdateStatus(inspectRecord.id, 'RESOLVED')}
                  className="px-3 py-1.5 rounded bg-emerald-700 text-white font-mono text-xs font-bold"
                >
                  Mark Resolved
                </button>
              ) : <span className="text-xs text-emerald-700 font-bold">✓ Incident Closed</span>}

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

      {/* ── Decision-Support Legal Disclaimer Footer (Rule 7) ── */}
      <HumanInterpretationNote className="mt-4" />
    </div>
  );
}

// ============================================================
// SmartQEye Coastal — Command Center (Home page)
// Full Canvas Tactical Map focused on Kerala Coastline
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { CoastalMap } from '@/components/CoastalMap';
import { SeverityChip, SeverityDot } from '@/components/SeverityChip';
import { useAlertStore, useFeedStore, useMapStore, useMissionStore } from '@/lib/store';
import { formatIST, eventTypeLabel } from '@/lib/utils';
import { MISSIONS } from '@/lib/mockData';

// ─── Alert Queue (right panel) ────────────────────────────────

function AlertQueue() {
  const { alerts } = useAlertStore();
  const navigate = useNavigate();
  const topAlerts = alerts
    .filter(a => a.status === 'NEW' || a.status === 'ACKNOWLEDGED')
    .sort((a, b) => {
      const order = ['CRITICAL','HIGH','MEDIUM','LOW','INFO'];
      return order.indexOf(a.severity) - order.indexOf(b.severity);
    })
    .slice(0, 12);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2.5 border-b flex-shrink-0" style={{ borderColor: 'var(--line)' }}>
        <h3 className="font-serif text-base font-semibold">Alert Queue</h3>
        <button className="text-sm font-medium hover:underline opacity-80 hover:opacity-100" style={{ color: 'var(--sea-accent)' }} onClick={() => navigate('/alerts')}>
          View all →
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {topAlerts.length === 0 ? (
          <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No active alerts</div>
        ) : (
          topAlerts.map(alert => (
            <button
              key={alert.id}
              className="w-full text-left px-3 py-2.5 border-b hover:bg-[var(--sand-100)] dark:hover:bg-[var(--raised)] transition-colors"
              style={{ borderColor: 'var(--line)' }}
              onClick={() => navigate(`/alerts/${alert.id}`)}
            >
              <div className="flex items-start gap-2">
                <SeverityDot severity={alert.severity} pulse={alert.severity === 'CRITICAL'} className="mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <SeverityChip severity={alert.severity} size="sm" />
                    <span className="text-xs font-mono opacity-70 tabular">{formatIST(alert.createdAt)}</span>
                  </div>
                  <div className="text-sm font-semibold mt-0.5 truncate">{eventTypeLabel(alert.event.type)}</div>
                  <div className="text-xs opacity-75 truncate">
                    {alert.event.zone?.name ?? alert.event.uav.code}
                    {alert.event.contact && ` · ${alert.event.contact.code}`}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Mission Stats Box ────────────────────────────────────────

function MissionStats() {
  const { alerts } = useAlertStore();
  const { feeds } = useFeedStore();
  const { missions, activeMissionId } = useMissionStore();

  const activeMission = missions.find(m => m.id === activeMissionId);
  const activeAlerts = alerts.filter(a => a.status === 'NEW').length;
  const liveFeeds = feeds.filter(f => f.state === 'LIVE').length;

  return (
    <div className="p-3 border-t flex-shrink-0" style={{ borderColor: 'var(--line)' }}>
      <div className="font-serif text-sm font-semibold mb-2 truncate">
        {activeMission?.title ?? 'Active Operation'}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <StatBox label="Active Alerts" value={activeAlerts.toString()} alert={activeAlerts > 0} />
        <StatBox label="Active UAVs" value={`${liveFeeds}/${feeds.length}`} />
      </div>
    </div>
  );
}

function StatBox({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="rounded-lg p-2.5 text-center" style={{ background: 'var(--raised)', border: '1px solid var(--line)' }}>
      <div className="font-mono font-bold text-lg tabular" style={{ color: alert ? 'var(--sev-high)' : 'var(--text)' }}>
        {value}
      </div>
      <div className="text-xs opacity-75 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

// ─── Layer toggles (Zones, Drones, Alerts) ─────────────────────

function LayerToggles() {
  const { layers, toggleLayer } = useMapStore();
  const [open, setOpen] = useState(true);

  return (
    <div
      className="absolute bottom-5 left-5 rounded-xl border overflow-hidden shadow-xl z-10"
      style={{ background: 'var(--raised)', borderColor: 'var(--line)', boxShadow: 'var(--shadow-md)' }}
    >
      <button
        className="flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider w-full hover:opacity-80 transition-opacity"
        style={{ color: 'var(--text)' }}
        onClick={() => setOpen(!open)}
      >
        <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
        Map Layers
        {open ? <ChevronDown className="w-3.5 h-3.5 ml-auto" /> : <ChevronUp className="w-3.5 h-3.5 ml-auto" />}
      </button>
      {open && (
        <div className="border-t px-3 pb-2.5 pt-1.5 space-y-1.5" style={{ borderColor: 'var(--line)' }}>
          {(Object.entries(layers) as [keyof typeof layers, boolean][]).map(([key, val]) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer text-xs font-sans font-medium hover:opacity-80">
              <input
                type="checkbox"
                checked={val}
                onChange={() => toggleLayer(key)}
                className="rounded cursor-pointer"
                style={{ accentColor: 'var(--sea-600)' }}
              />
              <span className="capitalize">{key}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Command Center page ─────────────────────────────────────

export default function CommandCenter() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Map (Full main canvas replacing FeedWall) ── */}
      <div className="flex-1 relative min-w-0 h-full">
        <CoastalMap
          height="100%"
          className="absolute inset-0"
          showContacts={false}
          onAlertClick={id => navigate(`/alerts/${id}`)}
        />
        <LayerToggles />
      </div>

      {/* ── Right panel (alert queue + stats) ── */}
      <div
        className="w-80 flex-shrink-0 flex flex-col border-l chart-paper"
        style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
      >
        <div className="flex-1 overflow-hidden flex flex-col">
          <AlertQueue />
        </div>
        <MissionStats />
      </div>
    </div>
  );
}

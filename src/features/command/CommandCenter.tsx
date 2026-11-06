// ============================================================
// SmartQEye Coastal — Command Center (Home page)
// Full Canvas Tactical Map focused on Kerala Coastline
// ============================================================

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { CoastalMap, KERALA_VIEW } from '@/components/CoastalMap';
import { SeverityChip, SeverityDot } from '@/components/SeverityChip';
import { useAlertStore, useFeedStore, useMapStore, useMissionStore, useAuthStore } from '@/lib/store';
import { canAccess } from '@/lib/roleConfig';
import { cn, formatIST, eventTypeLabel } from '@/lib/utils';
import { KERALA_COASTAL_SECTORS } from '@/lib/mockData';
import type { Alert, Feed } from '@/types';

/** Mission code of the port selected in the header dropdown (null = all ports). */
function useSelectedMissionCode(): string | null {
  const { missions, activeMissionId } = useMissionStore();
  return missions.find(m => m.id === activeMissionId)?.missionCode ?? null;
}

/** Best live feed for an alert: same UAV + mission, prefer LIVE RGB. */
function feedForAlert(alert: Alert, feeds: Feed[]): Feed | undefined {
  const uav = alert.event.uav?.code;
  const msn = alert.event.mission?.code;
  const score = (f: Feed) =>
    (f.uavCode === uav ? 4 : 0) + (f.missionCode === msn ? 2 : 0) +
    (f.state === 'LIVE' ? 1 : 0) + (f.modality === 'RGB' ? 0.5 : 0);
  const candidates = feeds.filter(f => f.uavCode === uav || f.missionCode === msn);
  return candidates.sort((a, b) => score(b) - score(a))[0];
}

// ─── Alert Queue (right panel) ────────────────────────────────

function AlertQueue() {
  const { alerts } = useAlertStore();
  const navigate = useNavigate();
  const missionCode = useSelectedMissionCode();
  const topAlerts = alerts
    .filter(a => !missionCode || a.event.mission?.code === missionCode)
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
              onClick={() => navigate(`/alerts?focus=${encodeURIComponent(alert.id)}`)}
              title="Open this alert in the Alerts page"
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

function MissionStats({ borderTop = true }: { borderTop?: boolean }) {
  const { alerts } = useAlertStore();
  const { feeds } = useFeedStore();
  const { missions, activeMissionId } = useMissionStore();

  const activeMission = missions.find(m => m.id === activeMissionId);
  const missionCode = activeMission?.missionCode ?? null;

  // Scope stats to the port selected in the header dropdown
  const scopedAlerts = missionCode ? alerts.filter(a => a.event.mission?.code === missionCode) : alerts;
  const scopedFeeds = missionCode ? feeds.filter(f => f.missionCode === missionCode) : feeds;
  const activeAlerts = scopedAlerts.filter(a => a.status === 'NEW').length;
  const liveFeeds = scopedFeeds.filter(f => f.state === 'LIVE').length;

  return (
    <div className={cn("p-3 flex-shrink-0", borderTop && "border-t")} style={{ borderColor: 'var(--line)' }}>
      <div className="font-serif text-sm font-semibold mb-2 truncate">
        {activeMission?.title ?? 'All Ports · Kerala Coast'}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <StatBox label="Active Alerts" value={activeAlerts.toString()} alert={activeAlerts > 0} />
        <StatBox label="Active UAVs" value={`${liveFeeds}/${scopedFeeds.length}`} />
      </div>
      {activeMission && (
        <div className="mt-2 text-[11px] font-mono opacity-70 truncate">
          {activeMission.missionCode} · {activeMission.area}
        </div>
      )}
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
        <Layers className="w-3.5 h-3.5 text-[var(--sea-600)] dark:text-[var(--sea-accent)]" />
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
  const { user, devRole } = useAuthStore();
  const activeRole = user?.role ?? devRole ?? 'OPERATOR';
  const hasAlertsAccess = canAccess(activeRole, '/alerts');
  const hasLiveAccess = canAccess(activeRole, '/live');
  const { alerts } = useAlertStore();
  const { feeds } = useFeedStore();
  const missionCode = useSelectedMissionCode();

  // Fly the map to the selected port
  const focus = useMemo(() => {
    if (!missionCode) return { center: KERALA_VIEW.center, zoom: KERALA_VIEW.zoom };
    const sector = KERALA_COASTAL_SECTORS.find(s => s.missionCode === missionCode);
    return sector ? { center: [sector.lon, sector.lat] as [number, number], zoom: 11.5 } : null;
  }, [missionCode]);

  // UAV PATROL marker → that drone's feed in Live Monitor
  function openDroneFeed(feedId: string) {
    if (hasLiveAccess) navigate(`/live?feed=${encodeURIComponent(feedId)}`);
  }

  // COASTAL ALERT marker → the feed of the drone that raised it in Live Monitor
  function openAlertFeed(alertId: string) {
    const alert = alerts.find(a => a.id === alertId);
    const feed = alert ? feedForAlert(alert, feeds) : undefined;
    if (feed && hasLiveAccess) {
      navigate(`/live?feed=${encodeURIComponent(feed.id)}&alert=${encodeURIComponent(alertId)}`);
    } else if (hasAlertsAccess) {
      navigate(`/alerts?focus=${encodeURIComponent(alertId)}`);
    }
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Map (Full main canvas replacing FeedWall) ── */}
      <div className="flex-1 relative min-w-0 h-full">
        <CoastalMap
          height="100%"
          className="absolute inset-0"
          showContacts={false}
          focus={focus}
          onAlertClick={openAlertFeed}
          onDroneClick={openDroneFeed}
        />
        <LayerToggles />
      </div>

      {/* ── Right panel (alert queue + stats) ── */}
      <div
        className="w-80 flex-shrink-0 flex flex-col border-l chart-paper"
        style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
      >
        {hasAlertsAccess ? (
          <>
            <div className="flex-1 overflow-hidden flex flex-col">
              <AlertQueue />
            </div>
            <MissionStats />
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            <MissionStats borderTop={false} />
          </div>
        )}
      </div>
    </div>
  );
}

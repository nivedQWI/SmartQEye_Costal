// ============================================================
// SmartQEye Coastal — Command Center (Home page)
// Phase 7 Production UI Polish — 7D Upgrade
// KPI strip · Tactical mini-map · Alert timeline scrubber · Top-4 Feed Wall · Returning operator digest
// ============================================================

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, ChevronDown, ChevronUp, Bell, Shield, Radio, Video,
  CheckCircle2, Clock, AlertTriangle, ArrowRight, Eye, Play,
  Cpu, Activity, Check, X, Compass, ExternalLink
} from 'lucide-react';
import { CoastalMap } from '@/components/CoastalMap';
import { SeverityChip, SeverityDot } from '@/components/SeverityChip';
import { AttentionChip } from '@/components/AttentionChip';
import { FeedStateChip, ModalityChip } from '@/components/FeedStateChip';
import { KpiCard } from '@/components/KpiCard';
import { useToastStore } from '@/components/Toast';
import { useAlertStore, useFeedStore, useMapStore, useMissionStore, useHealthStore } from '@/lib/store';
import { cn, formatIST, timeAgo, eventTypeLabel, formatCoords } from '@/lib/utils';
import { CONTACTS, MISSIONS, UAVS } from '@/lib/mockData';
import { INCIDENTS_DATA } from '@/lib/incidentsData';
import { auditApi } from '@/lib/api';
import type { Alert, Severity } from '@/types';

// ─── Alert Timeline Scrubber Component (Last 6 Hours) ──────────

function AlertTimelineScrubber({ onSelectAlert }: { onSelectAlert: (alertId: string) => void }) {
  const { alerts } = useAlertStore();
  const [hoveredAlert, setHoveredAlert] = useState<Alert | null>(null);

  // Time buckets over last 6 hours (in 1-hour windows)
  const now = Date.now();
  const sixHoursAgo = now - 6 * 3600 * 1000;

  const relevantAlerts = useMemo(() => {
    return alerts
      .filter(a => {
        const t = new Date(a.createdAt).getTime();
        return t >= sixHoursAgo && t <= now;
      })
      .slice(0, 30);
  }, [alerts, sixHoursAgo, now]);

  const hoursMarks = [6, 5, 4, 3, 2, 1, 0];

  return (
    <div className="px-3 py-2 border-b select-none" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-[var(--sea-600)]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Alert Activity Timeline (Last 6h)
          </span>
        </div>
        <span className="text-[10px] font-mono text-[var(--text-muted)]">
          {relevantAlerts.length} events detected
        </span>
      </div>

      {/* Scrubber Track */}
      <div className="relative h-7 rounded-lg border px-2 flex items-center justify-between bg-[var(--raised)]" style={{ borderColor: 'var(--line)' }}>
        {/* Hour tick marks */}
        <div className="absolute inset-x-2 inset-y-0 flex justify-between pointer-events-none opacity-20">
          {hoursMarks.map(h => (
            <div key={h} className="h-full border-r border-[var(--text)] flex flex-col justify-end">
              <span className="text-[8px] font-mono pl-0.5 mb-0.5">{h === 0 ? 'Now' : `-${h}h`}</span>
            </div>
          ))}
        </div>

        {/* Alert event dots */}
        <div className="relative w-full h-full flex items-center">
          {relevantAlerts.map(alert => {
            const t = new Date(alert.createdAt).getTime();
            const pct = Math.min(100, Math.max(0, ((t - sixHoursAgo) / (6 * 3600 * 1000)) * 100));

            const color =
              alert.severity === 'CRITICAL' ? 'var(--sev-critical)' :
              alert.severity === 'HIGH' ? 'var(--sev-high)' :
              alert.severity === 'MEDIUM' ? 'var(--sev-medium)' :
              'var(--sev-low)';

            return (
              <button
                key={alert.id}
                onClick={() => onSelectAlert(alert.id)}
                onMouseEnter={() => setHoveredAlert(alert)}
                onMouseLeave={() => setHoveredAlert(null)}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full transition-transform hover:scale-150 focus:outline-none"
                style={{
                  left: `${pct}%`,
                  width: alert.severity === 'CRITICAL' ? '10px' : '7px',
                  height: alert.severity === 'CRITICAL' ? '10px' : '7px',
                  backgroundColor: color,
                  boxShadow: alert.severity === 'CRITICAL' ? '0 0 6px rgba(200,53,46,0.8)' : undefined,
                  zIndex: alert.severity === 'CRITICAL' ? 10 : 5,
                }}
                title={`${alert.alertCode} · ${alert.severity} · ${formatIST(alert.createdAt)}`}
              />
            );
          })}
        </div>
      </div>

      {/* Hover preview tooltip */}
      {hoveredAlert && (
        <div className="mt-1 px-2 py-0.5 rounded text-[10px] font-mono flex items-center justify-between bg-[var(--sand-200)] dark:bg-[var(--raised)] border border-[var(--line)]">
          <span className="font-bold">{hoveredAlert.alertCode}: {eventTypeLabel(hoveredAlert.event.type)}</span>
          <span className="opacity-75">{formatIST(hoveredAlert.createdAt)} · {hoveredAlert.event.zone?.name ?? hoveredAlert.event.uav.code}</span>
        </div>
      )}
    </div>
  );
}

// ─── Returning Operator "Since You Last Looked" Banner ─────────

function OperatorDigestBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { alerts, updateAlert } = useAlertStore();
  const { addToast } = useToastStore();

  if (dismissed) return null;

  const handleAcknowledgeRoutine = () => {
    const routineAlerts = alerts.filter(a => (a.severity === 'LOW' || a.severity === 'INFO') && a.status === 'NEW');
    routineAlerts.forEach(a => {
      updateAlert({ ...a, status: 'ACKNOWLEDGED' });
    });

    auditApi.append({
      userId: 'usr-001',
      userName: 'SI Menon R.',
      userRole: 'OPERATOR',
      action: 'BULK_ACKNOWLEDGE_ROUTINE',
      targetType: 'ALERT',
      targetId: 'ROUTINE_BATCH',
      outcome: 'SUCCESS',
      detail: { count: routineAlerts.length, reason: 'Shift handover routine queue clearance' },
    });

    addToast({
      title: 'Routine Alerts Acknowledged',
      message: `${routineAlerts.length} routine items moved to acknowledged state.`,
      type: 'info',
    });
    setDismissed(true);
  };

  return (
    <div
      className="flex items-center justify-between px-3.5 py-1.5 text-xs border-b select-none transition-all"
      style={{
        background: 'linear-gradient(90deg, rgba(43,127,166,0.12) 0%, rgba(224,165,38,0.10) 100%)',
        borderColor: 'var(--sea-accent)',
        color: 'var(--text)',
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase bg-[var(--sea-600)] text-white">
          Digest
        </span>
        <span className="font-mono text-[11px] truncate">
          <strong>Since you last looked:</strong> 3 alerts escalated · 1 new vessel contact in Vizhinjam Security Zone · 0 system anomalies
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        <button
          onClick={handleAcknowledgeRoutine}
          className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors flex items-center gap-1 border"
          style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
          title="Acknowledge all routine alerts with one audited click"
        >
          <Check className="w-3 h-3 text-emerald-600" />
          <span>Acknowledge Routine</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-60 hover:opacity-100"
          title="Dismiss digest"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Top-4 Priority Feed Wall ─────────────────────────────────

function PriorityFeedWall() {
  const { feeds, pinnedFeedIds, setActiveFeed } = useFeedStore();
  const navigate = useNavigate();

  // Pick top 4 feeds: prioritize feeds associated with active sorties and high attention
  const priorityFeeds = useMemo(() => {
    return feeds.slice(0, 4);
  }, [feeds]);

  const restFeeds = useMemo(() => {
    return feeds.slice(4);
  }, [feeds]);

  function openFeed(id: string) {
    setActiveFeed(id);
    navigate(`/live?feedId=${id}`);
  }

  return (
    <div className="p-3 border-t" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-sm font-semibold">Priority Feed Wall</h3>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--sand-200)] text-[var(--ink-900)] font-bold">
            Top 4 Attention
          </span>
        </div>
        <button
          className="text-xs font-mono font-semibold hover:underline flex items-center gap-1 opacity-80 hover:opacity-100"
          style={{ color: 'var(--sea-600)' }}
          onClick={() => navigate('/fleet')}
        >
          <span>All 20 Feeds</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-2">
        {priorityFeeds.map((feed, idx) => {
          // Dynamic simulated CFS and load profile for the top 4
          const cfsMode = idx === 0 ? 'FULL (0.94)' : idx === 1 ? 'FULL (0.88)' : idx === 2 ? 'LIGHT (0.42)' : 'SKIP';
          const cfsColor = idx < 2 ? 'text-emerald-400' : idx === 2 ? 'text-amber-400' : 'text-slate-400';

          return (
            <div
              key={feed.id}
              className="relative aspect-video rounded-lg overflow-hidden border text-left group bg-[var(--ink-900)] flex flex-col justify-between"
              style={{
                borderColor: feed.state === 'LIVE' ? 'rgba(46,204,113,0.6)' : 'var(--line)',
              }}
            >
              {/* Simulated camera feed visual */}
              <div
                className="absolute inset-0"
                style={{
                  background: idx % 2 === 0
                    ? 'linear-gradient(135deg, #091f2c 0%, #17384e 100%)'
                    : 'linear-gradient(135deg, #102a3a 0%, #1e455e 100%)',
                }}
              >
                {/* Visual scanline raster */}
                <div className="absolute inset-0 bg-[radial-gradient(#2ecc71_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
              </div>

              {/* Top overlay strip */}
              <div className="relative z-10 flex items-center justify-between p-1.5 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-white font-mono font-bold tracking-tight">{feed.uavCode}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ModalityChip modality={feed.modality} size="sm" />
                </div>
              </div>

              {/* Center hover expand button */}
              <button
                onClick={() => openFeed(feed.id)}
                className="relative z-10 mx-auto my-auto px-2.5 py-1 rounded bg-black/60 hover:bg-black/90 text-white text-[11px] font-mono opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 border border-white/20 backdrop-blur-xs"
              >
                <Eye className="w-3 h-3 text-[var(--sea-accent)]" />
                <span>Focus Live</span>
              </button>

              {/* Bottom overlay HUD */}
              <div className="relative z-10 px-2 py-1 bg-black/75 flex items-center justify-between border-t border-white/10">
                <div className="truncate text-[10px] text-white/90 font-mono">
                  {feed.label}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 text-[9px] font-mono">
                  <span className={cfsColor} title="Cognitive Frame Selector status">
                    CFS: {cfsMode}
                  </span>
                  <span className="text-white/60">30fps</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini thumbnail strip for remaining 16 feeds */}
      <div className="flex gap-1.5 overflow-x-auto pt-1 items-center">
        <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex-shrink-0">
          Standby:
        </span>
        {restFeeds.map(feed => (
          <button
            key={feed.id}
            onClick={() => openFeed(feed.id)}
            className="flex-shrink-0 px-2 py-1 rounded border text-[10px] font-mono flex items-center gap-1 hover:border-[var(--sea-600)] transition-colors"
            style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
            title={`${feed.label} (${feed.uavCode})`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: feed.state === 'LIVE' ? 'var(--feed-live)' :
                                 feed.state === 'NO_SIGNAL' ? 'var(--feed-no-signal)' : 'var(--feed-buffering)'
              }}
            />
            <span className="font-semibold">{feed.uavCode}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Alert Queue (Right Panel) ────────────────────────────────

function AlertQueueRightPanel() {
  const { alerts } = useAlertStore();
  const navigate = useNavigate();

  const activeAlerts = useMemo(() => {
    return alerts
      .filter(a => a.status === 'NEW' || a.status === 'ACKNOWLEDGED')
      .sort((a, b) => {
        const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
        return order.indexOf(a.severity) - order.indexOf(b.severity);
      })
      .slice(0, 10);
  }, [alerts]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b flex-shrink-0" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-[var(--sea-600)]" />
          <h3 className="font-serif text-sm font-semibold">Active Alert Queue</h3>
        </div>
        <button
          className="text-xs font-mono font-semibold hover:underline flex items-center gap-1 opacity-80 hover:opacity-100"
          style={{ color: 'var(--sea-600)' }}
          onClick={() => navigate('/alerts')}
        >
          <span>All ({alerts.length})</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--line)' }}>
        {activeAlerts.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            No pending alerts in queue.
          </div>
        ) : (
          activeAlerts.map(alert => (
            <button
              key={alert.id}
              className="w-full text-left px-3.5 py-2.5 hover:bg-[var(--sand-100)] dark:hover:bg-[var(--raised)] transition-colors group"
              onClick={() => navigate(`/alerts/${alert.id}`)}
            >
              <div className="flex items-start gap-2">
                <SeverityDot severity={alert.severity} pulse={alert.severity === 'CRITICAL'} className="mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <SeverityChip severity={alert.severity} size="sm" />
                    <span className="text-[10px] font-mono opacity-70 tabular">{timeAgo(alert.createdAt)}</span>
                    <span className="text-[10px] font-mono font-bold opacity-60 ml-auto">{alert.alertCode}</span>
                  </div>
                  <div className="text-xs font-semibold truncate group-hover:text-[var(--sea-600)] transition-colors">
                    {eventTypeLabel(alert.event.type)}
                  </div>
                  <div className="text-[11px] opacity-75 truncate mt-0.5">
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

// ─── Tactical Mini-Map Layer Controls ─────────────────────────

function LayerToggles() {
  const { layers, toggleLayer } = useMapStore();
  const [open, setOpen] = useState(false);

  return (
    <div
      className="absolute bottom-4 left-4 rounded-xl border overflow-hidden z-10 shadow-md backdrop-blur-md"
      style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
    >
      <button
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-semibold w-full hover:opacity-80 transition-opacity"
        onClick={() => setOpen(!open)}
      >
        <Layers className="w-3.5 h-3.5 text-[var(--sea-600)]" />
        <span>Map Layers</span>
        {open ? <ChevronDown className="w-3 h-3 ml-auto" /> : <ChevronUp className="w-3 h-3 ml-auto" />}
      </button>
      {open && (
        <div className="border-t px-3 py-1.5 space-y-1" style={{ borderColor: 'var(--line)' }}>
          {(Object.entries(layers) as [keyof typeof layers, boolean][]).map(([key, val]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer text-xs font-mono hover:opacity-80">
              <input
                type="checkbox"
                checked={val}
                onChange={() => toggleLayer(key)}
                className="rounded"
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

// ─── Main Command Center Component ─────────────────────────────

export default function CommandCenter() {
  const navigate = useNavigate();
  const { alerts } = useAlertStore();
  const { feeds } = useFeedStore();
  const { health } = useHealthStore();

  // Live KPI Calculations
  const activeUavs = UAVS.filter(u => u.isActive).length;
  const liveFeeds = feeds.filter(f => f.state === 'LIVE').length;
  const openAlerts = alerts.filter(a => a.status === 'NEW');
  const criticalCount = openAlerts.filter(a => a.severity === 'CRITICAL').length;
  const highCount = openAlerts.filter(a => a.severity === 'HIGH').length;

  const activeContactsCount = CONTACTS.filter(c => {
    const mins = (Date.now() - new Date(c.lastSeenAt).getTime()) / 60000;
    return mins < 60;
  }).length;

  const incidentsTodayCount = INCIDENTS_DATA.length;

  return (
    <div className="flex h-full overflow-hidden flex-col">
      {/* ── 1. Intelligence Flow Ticker (1.2 Product Pipeline) ── */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono border-b overflow-x-auto select-none flex-shrink-0"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text-muted)' }}
        title="Full Intelligence Processing Flow (Cognitive Frame Selection optimizes compute; Cognitive Keyframe Extraction captures evidence frames post-event)"
      >
        <span className="font-bold text-[var(--sea-600)] flex-shrink-0 uppercase tracking-wider">Tactical Flow:</span>
        <span className="truncate">
          Drone RGB/Thermal + Telemetry <span className="opacity-40">→</span> <strong className="text-[var(--text)]">CFS (Compute Opt)</strong> <span className="opacity-40">→</span> RTMDet/ByteTrack <span className="opacity-40">→</span> Persistent Contact <span className="opacity-40">→</span> Coastal Context <span className="opacity-40">→</span> Behaviour Intelligence <span className="opacity-40">→</span> Operational Attention <span className="opacity-40">→</span> <strong className="text-[var(--text)]">CKFE (Evidence Extraction)</strong> <span className="opacity-40">→</span> ELIR Alert <span className="opacity-40">→</span> <strong className="text-emerald-600 dark:text-emerald-400">Human Police Interpretation (Final)</strong>
        </span>
      </div>

      {/* ── 2. Returning Operator Digest Banner ── */}
      <OperatorDigestBanner />

      {/* ── 3. Live KPI Strip (6 Core Operational Cards) ── */}
      <div
        className="px-3.5 py-2.5 border-b grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 flex-shrink-0"
        style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}
      >
        <KpiCard
          title="Active UAVs"
          value={`${activeUavs} / ${UAVS.length}`}
          trend={{ value: '+1', direction: 'up', label: 'vs prev sortie' }}
          variant="primary"
          tooltip="Drones currently in airborne tactical coastal patrol"
          onClick={() => navigate('/uavs')}
          badge="▲ AIR"
        />
        <KpiCard
          title="Live Feeds"
          value={`${liveFeeds} / ${feeds.length}`}
          trend={{ value: '20 max', direction: 'neutral', label: '18 Live, 2 Buffer' }}
          variant="default"
          tooltip="Concurrent video feeds ingested into Central GPU Node"
          onClick={() => navigate('/fleet')}
          badge="● 30 FPS"
        />
        <KpiCard
          title="Open Alerts"
          value={openAlerts.length}
          trend={{
            value: `${criticalCount} Crit`,
            direction: criticalCount > 0 ? 'down' : 'neutral',
            label: `${highCount} High`
          }}
          variant={criticalCount > 0 ? 'danger' : 'default'}
          tooltip="Active alerts awaiting investigation or escalation"
          onClick={() => navigate('/alerts')}
          badge={criticalCount > 0 ? '▲ CRIT' : '● OK'}
        />
        <KpiCard
          title="Observed Contacts"
          value={activeContactsCount}
          trend={{ value: '+3', direction: 'up', label: 'past hour' }}
          variant="default"
          tooltip="Persistent vessel and small craft contacts tracked"
          onClick={() => navigate('/contacts')}
          badge="◆ AIS/OPT"
        />
        <KpiCard
          title="Incidents Today"
          value={`${incidentsTodayCount} ELIRs`}
          trend={{ value: '2 Under Review', direction: 'neutral', label: 'dossiers' }}
          variant="warning"
          tooltip="Court-admissible Evidence-Linked Incident Records generated"
          onClick={() => navigate('/incidents')}
          badge="■ SEC 65B"
        />
        <KpiCard
          title="Cluster Health"
          value="99.8%"
          trend={{ value: 'Synced', direction: 'up', label: 'Central GPU' }}
          variant="success"
          tooltip="Central GPU Node A/B and cooperative edge synchronization health"
          onClick={() => navigate('/platform/deployment')}
          badge="● NOMINAL"
        />
      </div>

      {/* ── 4. Alert Timeline Scrubber ── */}
      <AlertTimelineScrubber onSelectAlert={(id) => navigate(`/alerts/${id}`)} />

      {/* ── 5. Main Canvas: Tactical Map + Priority Feeds & Right Panel ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left / Center Section: Map & Feed Wall */}
        <div className="flex-1 relative min-w-0 flex flex-col">
          {/* Tactical Mini-Map */}
          <div className="flex-1 relative">
            <CoastalMap
              height="100%"
              className="absolute inset-0"
              onAlertClick={id => navigate(`/alerts/${id}`)}
              onContactClick={id => navigate(`/contacts/${id}`)}
            />
            <LayerToggles />
          </div>

          {/* Top-4 Priority Feed Wall */}
          <div className="flex-shrink-0">
            <PriorityFeedWall />
          </div>
        </div>

        {/* Right Section: Alert Queue & Decision-Support Footer */}
        <div
          className="w-80 flex-shrink-0 flex flex-col border-l"
          style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
        >
          <div className="flex-1 overflow-hidden flex flex-col">
            <AlertQueueRightPanel />
          </div>

          {/* Mandatory Decision-Support Disclaimer Footer */}
          <div
            className="px-3 py-2 border-t text-[10px] font-mono opacity-75 text-center flex-shrink-0"
            style={{ borderColor: 'var(--line)', color: 'var(--text-muted)' }}
          >
            Observed behaviour only. Operational interpretation and action rest with authorised Kerala Police personnel.
          </div>
        </div>
      </div>
    </div>
  );
}

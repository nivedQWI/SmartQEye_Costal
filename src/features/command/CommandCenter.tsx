// ============================================================
// SmartQEye Coastal — Command Center (Home page)
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { CoastalMap } from '@/components/CoastalMap';
import { SeverityChip, SeverityDot } from '@/components/SeverityChip';
import { FeedStateChip, ModalityChip } from '@/components/FeedStateChip';
import { useAlertStore, useFeedStore, useMapStore, useMissionStore } from '@/lib/store';
import { cn, formatIST, timeAgo, eventTypeLabel, formatCoords } from '@/lib/utils';
import { CONTACTS, MISSIONS } from '@/lib/mockData';

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

// ─── Feed Wall ────────────────────────────────────────────────

function FeedWall() {
  const { feeds, pinnedFeedIds, setActiveFeed } = useFeedStore();
  const navigate = useNavigate();
  const pinned = feeds.filter(f => pinnedFeedIds.includes(f.id)).slice(0, 4);
  const rest = feeds.filter(f => !pinnedFeedIds.includes(f.id));

  function openFeed(id: string) {
    setActiveFeed(id);
    navigate('/live');
  }

  return (
    <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-serif text-base font-semibold">Feed Wall</h3>
        <button className="text-sm font-medium hover:underline opacity-80 hover:opacity-100" style={{ color: 'var(--sea-accent)' }} onClick={() => navigate('/live')}>
          Full view →
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1.5 mb-2">
        {pinned.map(feed => (
          <button
            key={feed.id}
            className="relative aspect-video rounded-lg overflow-hidden border text-left group"
            style={{
              borderColor: feed.state === 'LIVE' ? 'var(--feed-live)' : feed.state === 'NO_SIGNAL' ? 'var(--feed-no-signal)' : 'var(--line)',
              background: 'var(--ink-900)',
            }}
            onClick={() => openFeed(feed.id)}
          >
            {/* Placeholder video frame */}
            {feed.state === 'NO_SIGNAL' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                <div className="text-xs text-red-400 font-mono font-bold">NO SIGNAL</div>
                <div className="w-8 h-0.5 bg-red-600/40 mt-1" />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, #0a2233 0%, #1a3a55 100%)` }}
              >
                {feed.state === 'LIVE' && (
                  <div className="absolute top-1 left-1.5 flex items-center gap-1 bg-black/40 px-1 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-white font-mono font-bold">LIVE</span>
                  </div>
                )}
              </div>
            )}
            {/* Label */}
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/70">
              <div className="text-[11px] text-white font-mono font-medium truncate">{feed.label}</div>
            </div>
            {/* Modality chip */}
            <div className="absolute top-1 right-1">
              <ModalityChip modality={feed.modality} size="sm" />
            </div>
          </button>
        ))}
      </div>

      {/* Thumbnail strip for remaining feeds */}
      <div className="flex gap-1 overflow-x-auto">
        {rest.slice(0, 16).map(feed => (
          <button
            key={feed.id}
            className="flex-shrink-0 w-12 h-8 rounded overflow-hidden border relative"
            style={{
              borderColor: feed.state === 'LIVE' ? 'rgba(46,204,113,0.5)' : feed.state === 'NO_SIGNAL' ? 'rgba(200,53,46,0.5)' : 'var(--line)',
              background: '#0a2233',
            }}
            onClick={() => openFeed(feed.id)}
            title={feed.label}
          >
            {feed.state === 'NO_SIGNAL' && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-950/60">
                <span className="text-[7px] text-red-400 font-mono">✕</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-[12px] bg-black/70 flex items-center px-0.5">
              <span className="text-[7px] text-white/70 font-mono truncate">{feed.uavCode}</span>
            </div>
          </button>
        ))}
        {rest.length > 16 && (
          <div className="flex-shrink-0 w-12 h-8 rounded border flex items-center justify-center text-[9px] opacity-50" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
            +{rest.length - 16}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mission Stats ────────────────────────────────────────────

function MissionStats() {
  const { alerts } = useAlertStore();
  const { feeds } = useFeedStore();
  const activeAlerts = alerts.filter(a => a.status === 'NEW').length;
  const liveFeeds = feeds.filter(f => f.state === 'LIVE').length;

  return (
    <div className="px-3.5 py-3 border-t" style={{ borderColor: 'var(--line)' }}>
      <h3 className="font-serif text-xs font-semibold mb-2.5 opacity-70 uppercase tracking-wider">Mission Stats</h3>
      <div className="grid grid-cols-3 gap-2">
        <StatBox label="Contacts" value={CONTACTS.filter(c => {
          const mins = (Date.now() - new Date(c.lastSeenAt).getTime()) / 60000;
          return mins < 30;
        }).length.toString()} />
        <StatBox label="Active Alerts" value={activeAlerts.toString()} alert={activeAlerts > 0} />
        <StatBox label="Live Feeds" value={`${liveFeeds}/${feeds.length}`} />
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

// ─── Layer toggles ────────────────────────────────────────────

function LayerToggles() {
  const { layers, toggleLayer } = useMapStore();
  const [open, setOpen] = useState(true);

  return (
    <div
      className="absolute bottom-4 left-4 rounded-xl border overflow-hidden"
      style={{ background: 'var(--raised)', borderColor: 'var(--line)', boxShadow: 'var(--shadow-md)' }}
    >
      <button
        className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold w-full hover:opacity-80 transition-opacity"
        onClick={() => setOpen(!open)}
      >
        <Layers className="w-3.5 h-3.5" />
        Layers
        {open ? <ChevronDown className="w-3 h-3 ml-auto" /> : <ChevronUp className="w-3 h-3 ml-auto" />}
      </button>
      {open && (
        <div className="border-t px-3 pb-2 pt-1 space-y-1" style={{ borderColor: 'var(--line)' }}>
          {(Object.entries(layers) as [keyof typeof layers, boolean][]).map(([key, val]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer text-sm font-medium hover:opacity-80">
              <input
                type="checkbox"
                checked={val}
                onChange={() => toggleLayer(key)}
                className="rounded"
                style={{ accentColor: 'var(--sea-600)' }}
              />
              {key.charAt(0).toUpperCase() + key.slice(1)}
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
    <div className="flex h-full overflow-hidden flex-col">
      {/* ── Intelligence Flow Ticker (1.2 Product Pipeline) ── */}
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

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Map (main canvas) ── */}
        <div className="flex-1 relative min-w-0 flex flex-col">
          <div className="flex-1 relative">
            <CoastalMap
              height="100%"
              className="absolute inset-0"
              onAlertClick={id => navigate(`/alerts/${id}`)}
              onContactClick={id => navigate(`/contacts/${id}`)}
            />
            <LayerToggles />
          </div>

          {/* Feed Wall below map */}
          <div className="flex-shrink-0 chart-paper" style={{ background: 'var(--panel)', borderTop: '1px solid var(--line)' }}>
            <FeedWall />
          </div>
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
          {/* Mandatory Decision-Support Disclaimer Footer */}
          <div className="px-3 py-2 border-t text-[10px] font-mono opacity-70 text-center" style={{ borderColor: 'var(--line)', color: 'var(--text-muted)' }}>
            Observed behaviour only. Operational interpretation and action rest with authorised Kerala Police personnel.
          </div>
        </div>
      </div>
    </div>
  );
}

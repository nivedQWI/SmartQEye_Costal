// ============================================================
// SmartQEye Coastal — Alert Queue (/alerts)
// Filterable, sortable table with right preview pane
// Keyboard: J/K to move, A to ack, E to escalate, Enter to open
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, ChevronDown, Users, CheckCheck, ArrowUpCircle, XCircle, ExternalLink } from 'lucide-react';
import { cn, formatIST, timeAgo, eventTypeLabel, formatCoords, SEV_GLYPH } from '@/lib/utils';
import { SeverityChip, SeverityDot } from '@/components/SeverityChip';
import { FeedStateChip, ModalityChip } from '@/components/FeedStateChip';
import { useAlertStore, useAuthStore } from '@/lib/store';
import { alertsApi } from '@/lib/api';
import { can } from '@/lib/roleConfig';
import type { Alert, Severity, AlertStatus, UserRole } from '@/types';

// ─── Filter bar ───────────────────────────────────────────────

const SEVERITIES: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
const STATUSES: AlertStatus[] = ['NEW', 'ACKNOWLEDGED', 'ASSIGNED', 'UNDER_REVIEW', 'ESCALATED', 'RESOLVED', 'FALSE_ALERT'];

interface Filters {
  severity: Severity[];
  status: AlertStatus[];
  groupByContact: boolean;
}

function FilterBar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  function toggleSev(s: Severity) {
    const next = filters.severity.includes(s)
      ? filters.severity.filter(x => x !== s)
      : [...filters.severity, s];
    onChange({ ...filters, severity: next });
  }
  function toggleStatus(s: AlertStatus) {
    const next = filters.status.includes(s)
      ? filters.status.filter(x => x !== s)
      : [...filters.status, s];
    onChange({ ...filters, status: next });
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b flex-wrap" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
      <Filter className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />
      
      {/* Severity filters */}
      <div className="flex items-center gap-1.5">
        {SEVERITIES.map(sev => (
          <button
            key={sev}
            onClick={() => toggleSev(sev)}
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium border transition-all',
              filters.severity.includes(sev) ? 'opacity-100' : 'opacity-35',
            )}
            style={{
              borderColor: `var(--sev-${sev.toLowerCase()})`,
              color: filters.severity.includes(sev) ? 'white' : `var(--sev-${sev.toLowerCase()})`,
              background: filters.severity.includes(sev) ? `var(--sev-${sev.toLowerCase()})` : 'transparent',
            }}
          >
            {SEV_GLYPH[sev]} {sev}
          </button>
        ))}
      </div>

      <div className="h-4 w-px flex-shrink-0" style={{ background: 'var(--line)' }} />

      {/* Status filters */}
      <div className="flex items-center gap-1">
        {(['NEW', 'ACKNOWLEDGED', 'ASSIGNED', 'ESCALATED'] as AlertStatus[]).map(st => (
          <button
            key={st}
            onClick={() => toggleStatus(st)}
            className={cn(
              'px-2 py-0.5 rounded-full text-xs border transition-all',
              filters.status.includes(st)
                ? 'font-medium'
                : 'opacity-40',
            )}
            style={{ borderColor: 'var(--line)', background: filters.status.includes(st) ? 'var(--raised)' : 'transparent' }}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Group by contact */}
        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.groupByContact}
            onChange={e => onChange({ ...filters, groupByContact: e.target.checked })}
            style={{ accentColor: 'var(--sea-600)' }}
          />
          <Users className="w-3 h-3 opacity-50" />
          Group by contact
        </label>
      </div>
    </div>
  );
}

// ─── Alert row ────────────────────────────────────────────────

function AlertRow({
  alert, isSelected, onClick, onAck, onEscalate, role,
}: {
  alert: Alert; isSelected: boolean;
  onClick: () => void; onAck: () => void; onEscalate: () => void;
  role: UserRole;
}) {
  const navigate = useNavigate();
  const canAck = can(role, 'ACK_ALERT');
  const canEscalate = can(role, 'ESCALATE_ALERT');
  
  return (
    <tr
      className={cn(
        'border-b cursor-pointer transition-colors group',
        isSelected ? 'bg-[var(--sea-100)] dark:bg-[var(--raised)]' : 'hover:bg-[var(--sand-100)] dark:hover:bg-[var(--raised)]',
        alert.status === 'NEW' && alert.severity === 'CRITICAL' && 'new-alert-pulse',
      )}
      style={{ borderColor: 'var(--line)' }}
      onClick={onClick}
    >
      {/* Severity indicator */}
      <td className="pl-4 pr-2 py-2.5 w-8">
        <SeverityDot severity={alert.severity} pulse={alert.severity === 'CRITICAL' && alert.status === 'NEW'} />
      </td>

      {/* Time */}
      <td className="pr-3 py-2.5 w-20 whitespace-nowrap">
        <span className="font-mono text-xs tabular" style={{ color: 'var(--text-muted)' }}>
          {formatIST(alert.createdAt)}
        </span>
      </td>

      {/* Severity chip */}
      <td className="pr-3 py-2.5 w-24">
        <SeverityChip severity={alert.severity} size="sm" />
      </td>

      {/* Event type + zone */}
      <td className="pr-3 py-2.5 flex-1">
        <div className="font-medium text-sm">{eventTypeLabel(alert.event.type)}</div>
        <div className="text-xs opacity-50 truncate max-w-[220px]">
          {alert.event.zone?.name ?? '—'}
        </div>
      </td>

      {/* UAV */}
      <td className="pr-3 py-2.5 w-20 text-xs font-mono">{alert.event.uav.code}</td>

      {/* Contact */}
      <td className="pr-3 py-2.5 w-20 text-xs font-mono" style={{ color: 'var(--sea-accent)' }}>
        {alert.event.contact?.code ?? '—'}
      </td>

      {/* Status */}
      <td className="pr-3 py-2.5 w-28">
        <span className="text-xs opacity-70">{alert.status.replace(/_/g, ' ')}</span>
        {alert.acknowledgedBy && (
          <div className="text-[10px] opacity-40 truncate max-w-[100px]">{alert.acknowledgedBy}</div>
        )}
      </td>

      {/* Actions */}
      <td className="pr-4 py-2.5 w-32">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="px-2 py-0.5 rounded text-xs border hover:bg-[var(--sand-200)] dark:hover:bg-[var(--raised)] transition-colors"
            style={{ borderColor: 'var(--line)' }}
            onClick={e => { e.stopPropagation(); navigate(`/alerts/${alert.id}`); }}
          >
            Open
          </button>
          {canAck && alert.status === 'NEW' && (
            <button
              className="px-2 py-0.5 rounded text-xs border hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              style={{ borderColor: 'var(--sev-low)', color: 'var(--sev-low)' }}
              onClick={e => { e.stopPropagation(); onAck(); }}
            >Ack</button>
          )}
          {canEscalate && (
            <button
              className="px-2 py-0.5 rounded text-xs border hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
              style={{ borderColor: 'var(--sev-high)', color: 'var(--sev-high)' }}
              onClick={e => { e.stopPropagation(); onEscalate(); }}
            >↑</button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Preview pane ─────────────────────────────────────────────

function PreviewPane({ alert, onClose, role }: { alert: Alert; onClose: () => void; role: UserRole }) {
  const navigate = useNavigate();
  const { updateAlert } = useAlertStore();
  const [showFalseAlertModal, setShowFalseAlertModal] = useState(false);
  const [falseAlertReason, setFalseAlertReason] = useState('');

  const canAck = can(role, 'ACK_ALERT');
  const canEscalate = can(role, 'ESCALATE_ALERT');
  const canResolve = can(role, 'RESOLVE_ALERT');

  async function handleAck() {
    const updated = await alertsApi.acknowledge(alert.id);
    updateAlert(updated);
  }

  async function handleFalseAlert() {
    if (!falseAlertReason.trim()) return;
    const updated = await alertsApi.markFalseAlert(alert.id, falseAlertReason);
    updateAlert(updated);
    setShowFalseAlertModal(false);
    setFalseAlertReason('');
  }

  return (
    <div className="flex flex-col h-full border-l" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--line)' }}>
        <div>
          <div className="font-mono text-xs opacity-50">{alert.alertCode}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <SeverityChip severity={alert.severity} size="sm" />
            <span className="text-xs opacity-60">{alert.status.replace(/_/g,' ')}</span>
          </div>
        </div>
        <button className="opacity-40 hover:opacity-100 text-lg" onClick={onClose}>×</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Keyframe carousel placeholder */}
        <div className="px-4 pt-3">
          <div className="text-xs font-medium opacity-60 mb-2 uppercase tracking-wider">Keyframes</div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border flex items-center justify-center text-xs opacity-40"
                style={{ background: '#0a2233', borderColor: 'var(--line)' }}
              >
                {i === 0 ? <span style={{ color: 'var(--sea-200)' }}>▶</span> : `KF-${i + 1}`}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="px-4 pt-3">
          <div className="text-xs font-medium opacity-60 mb-2 uppercase tracking-wider">Summary</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex gap-2">
              <span style={{ color: 'var(--text-muted)', width: '80px', flexShrink: 0 }}>Event</span>
              <span className="font-medium">{eventTypeLabel(alert.event.type)}</span>
            </div>
            <div className="flex gap-2">
              <span style={{ color: 'var(--text-muted)', width: '80px', flexShrink: 0 }}>Time</span>
              <span className="font-mono tabular">{formatIST(alert.event.occurredAt)}</span>
            </div>
            <div className="flex gap-2">
              <span style={{ color: 'var(--text-muted)', width: '80px', flexShrink: 0 }}>UAV</span>
              <span className="font-mono">{alert.event.uav.code}</span>
            </div>
            {alert.event.zone && (
              <div className="flex gap-2">
                <span style={{ color: 'var(--text-muted)', width: '80px', flexShrink: 0 }}>Zone</span>
                <span className="truncate">{alert.event.zone.name} <span className="opacity-50">v{alert.event.zone.version}</span></span>
              </div>
            )}
            {alert.event.contact && (
              <div className="flex gap-2">
                <span style={{ color: 'var(--text-muted)', width: '80px', flexShrink: 0 }}>Contact</span>
                <span className="font-mono" style={{ color: 'var(--sea-accent)' }}>{alert.event.contact.code}</span>
                <span className="opacity-50">{(alert.event.contact.classConf * 100).toFixed(0)}% conf</span>
              </div>
            )}
            <div className="flex gap-2">
              <span style={{ color: 'var(--text-muted)', width: '80px', flexShrink: 0 }}>Location</span>
              <span className="font-mono text-[10px]">{formatCoords(alert.event.location.lat, alert.event.location.lon)}</span>
            </div>
          </div>
        </div>

        {/* Why raised */}
        <div className="px-4 pt-3">
          <div className="text-xs font-medium opacity-60 mb-2 uppercase tracking-wider">Why was this raised?</div>
          <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'var(--raised)', border: '1px solid var(--line)' }}>
            {alert.event.rationale.factors.slice(0, 4).map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="opacity-40 flex-shrink-0 mt-0.5">•</span>
                <div>
                  <span className="font-medium">{f.factorName}:</span>{' '}
                  <span className="font-mono">{f.value}{f.unit ? ` ${f.unit}` : ''}</span>
                  {f.threshold !== undefined && (
                    <span className="opacity-50"> (th: {f.threshold}{f.unit ? ` ${f.unit}` : ''})</span>
                  )}
                </div>
              </div>
            ))}
            {alert.event.rationale.note && (
              <div className="text-xs opacity-60 mt-1 pt-1 border-t" style={{ borderColor: 'var(--line)' }}>
                {alert.event.rationale.note}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t space-y-2 flex-shrink-0" style={{ borderColor: 'var(--line)' }}>
        <button
          className="w-full py-2 rounded-xl text-sm font-medium transition-colors"
          style={{ background: 'var(--sea-600)', color: 'white' }}
          onClick={() => navigate(`/alerts/${alert.id}`)}
        >
          <ExternalLink className="w-3.5 h-3.5 inline mr-1.5" />
          Open Full Record
        </button>
        {(canAck || canEscalate) && (
          <div className="flex gap-2">
            {canAck && alert.status === 'NEW' && (
              <button
                className="flex-1 py-1.5 rounded-xl text-xs border font-medium transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                style={{ borderColor: 'var(--sev-low)', color: 'var(--sev-low)' }}
                onClick={handleAck}
              >
                <CheckCheck className="w-3 h-3 inline mr-1" />Acknowledge
              </button>
            )}
            {canEscalate && (
              <button
                className="flex-1 py-1.5 rounded-xl text-xs border font-medium transition-colors hover:bg-orange-50 dark:hover:bg-orange-900/20"
                style={{ borderColor: 'var(--sev-high)', color: 'var(--sev-high)' }}
                onClick={() => alert.event.type && console.log('escalate')}
              >
                <ArrowUpCircle className="w-3 h-3 inline mr-1" />Escalate
              </button>
            )}
          </div>
        )}
        {canResolve && (
          <button
            className="w-full py-1.5 rounded-xl text-xs border opacity-60 hover:opacity-100 transition-opacity"
            style={{ borderColor: 'var(--line)' }}
            onClick={() => setShowFalseAlertModal(true)}
          >
            <XCircle className="w-3 h-3 inline mr-1" />Mark False Alert
          </button>
        )}

        {/* False alert modal */}
        {showFalseAlertModal && canResolve && (
          <div className="rounded-xl p-3 border" style={{ background: 'var(--raised)', borderColor: 'var(--sev-medium)' }}>
            <div className="text-xs font-medium mb-2">Reason (required)</div>
            <textarea
              value={falseAlertReason}
              onChange={e => setFalseAlertReason(e.target.value)}
              className="w-full rounded-lg text-xs p-2 border resize-none outline-none"
              style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)', minHeight: '64px' }}
              placeholder="Explain why this alert is a false positive…"
            />
            <div className="flex gap-2 mt-2">
              <button
                className="flex-1 py-1 rounded-lg text-xs font-medium transition-colors"
                style={{ background: 'var(--sev-medium)', color: 'white' }}
                onClick={handleFalseAlert}
                disabled={!falseAlertReason.trim()}
              >Confirm</button>
              <button
                className="flex-1 py-1 rounded-lg text-xs border transition-colors"
                style={{ borderColor: 'var(--line)' }}
                onClick={() => { setShowFalseAlertModal(false); setFalseAlertReason(''); }}
              >Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Alert Queue page ─────────────────────────────────────────

export default function AlertQueue() {
  const { alerts, updateAlert } = useAlertStore();
  const { user, devRole } = useAuthStore();
  const activeRole = user?.role ?? devRole ?? 'OPERATOR';
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({ severity: [], status: [], groupByContact: false });
  const [selectedId, setSelectedId] = useState<string | null>(alerts[0]?.id ?? null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Apply filters
  const filtered = alerts.filter(a => {
    if (filters.severity.length && !filters.severity.includes(a.severity)) return false;
    if (filters.status.length && !filters.status.includes(a.status)) return false;
    return true;
  }).sort((a, b) => {
    const sevOrder = ['CRITICAL','HIGH','MEDIUM','LOW','INFO'];
    const sevDiff = sevOrder.indexOf(a.severity) - sevOrder.indexOf(b.severity);
    if (sevDiff !== 0) return sevDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const selectedAlert = filtered.find(a => a.id === selectedId) ?? filtered[selectedIndex] ?? null;

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'j' || e.key === 'ArrowDown') {
        setSelectedIndex(i => {
          const next = Math.min(i + 1, filtered.length - 1);
          setSelectedId(filtered[next]?.id ?? null);
          return next;
        });
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        setSelectedIndex(i => {
          const prev = Math.max(i - 1, 0);
          setSelectedId(filtered[prev]?.id ?? null);
          return prev;
        });
      } else if (e.key === 'Enter' && selectedAlert) {
        navigate(`/alerts/${selectedAlert.id}`);
      } else if (e.key === 'a' && selectedAlert) {
        if (can(activeRole, 'ACK_ALERT')) {
          alertsApi.acknowledge(selectedAlert.id).then(updated => updateAlert(updated));
        }
      } else if (e.key === 'e' && selectedAlert) {
        if (can(activeRole, 'ESCALATE_ALERT')) {
          alertsApi.updateStatus(selectedAlert.id, 'ESCALATED').then(updated => updateAlert(updated));
        }
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [filtered, selectedAlert, navigate, updateAlert, activeRole]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Filter bar */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Content: table + preview pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Table */}
        <div className="flex-1 overflow-auto">
          {/* Keyboard shortcuts hint */}
          <div className="px-4 py-1.5 text-[10px] border-b flex items-center gap-3" style={{ borderColor: 'var(--line)', color: 'var(--text-muted)', background: 'var(--panel)' }}>
            <span><kbd className="font-mono bg-black/10 px-1 rounded">J</kbd>/<kbd className="font-mono bg-black/10 px-1 rounded">K</kbd> navigate</span>
            {can(activeRole, 'ACK_ALERT') && (
              <span><kbd className="font-mono bg-black/10 px-1 rounded">A</kbd> acknowledge</span>
            )}
            {can(activeRole, 'ESCALATE_ALERT') && (
              <span><kbd className="font-mono bg-black/10 px-1 rounded">E</kbd> escalate</span>
            )}
            <span><kbd className="font-mono bg-black/10 px-1 rounded">↵</kbd> open</span>
            <span className="ml-auto">{filtered.length} alerts</span>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2" style={{ color: 'var(--text-muted)' }}>
              <CheckCheck className="w-8 h-8 opacity-30" />
              <span className="text-sm">No alerts match your filters</span>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider border-b sticky top-0 z-10" style={{ borderColor: 'var(--line)', background: 'var(--panel)', color: 'var(--text-muted)' }}>
                  <th className="pl-4 pr-2 py-2 w-8" />
                  <th className="pr-3 py-2 w-20">Time</th>
                  <th className="pr-3 py-2 w-24">Severity</th>
                  <th className="pr-3 py-2">Event / Zone</th>
                  <th className="pr-3 py-2 w-20">UAV</th>
                  <th className="pr-3 py-2 w-20">Contact</th>
                  <th className="pr-3 py-2 w-28">Status</th>
                  <th className="pr-4 py-2 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((alert, idx) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    role={activeRole}
                    isSelected={alert.id === selectedId}
                    onClick={() => { setSelectedId(alert.id); setSelectedIndex(idx); }}
                    onAck={() => alertsApi.acknowledge(alert.id).then(u => updateAlert(u))}
                    onEscalate={() => alertsApi.updateStatus(alert.id, 'ESCALATED').then(u => updateAlert(u))}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Preview pane */}
        {selectedAlert && (
          <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
            <PreviewPane alert={selectedAlert} role={activeRole} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </div>
    </div>
  );
}

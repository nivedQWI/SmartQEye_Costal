// ============================================================
// SmartQEye Coastal — Alert / Incident Detail (/alerts/:id)
// Evidence-Linked Incident Record (ELIR)
// ============================================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Shield, Copy, Check, Download, ChevronLeft, AlertTriangle, Clock, MapPin, Cpu } from 'lucide-react';
import { cn, formatIST, formatISTFull, formatCoords, timeAgo, eventTypeLabel, truncateSha, copyToClipboard, formatBytes } from '@/lib/utils';
import { SeverityChip } from '@/components/SeverityChip';
import { ModalityChip } from '@/components/FeedStateChip';
import { CoastalMap } from '@/components/CoastalMap';
import { alertsApi } from '@/lib/api';
import { useAlertStore } from '@/lib/store';
import type { EvidenceItem } from '@/types';

// ─── Evidence item row ────────────────────────────────────────

function EvidenceRow({ item }: { item: EvidenceItem }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await copyToClipboard(item.sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const kindIcon: Record<string, string> = {
    CLIP: '🎬', KEYFRAME: '🖼', THUMBNAIL: '🔲', SIDECAR_JSON: '{ }', TELEMETRY_EXPORT: '📡',
  };

  return (
    <div className="flex items-center gap-3 py-2 border-b text-xs" style={{ borderColor: 'var(--line)' }}>
      <span className="flex-shrink-0 text-base">{kindIcon[item.kind] ?? '📄'}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{item.kind.replace(/_/g,' ')}</div>
        {item.capturedAt && (
          <div className="opacity-50 font-mono">{formatIST(item.capturedAt)}</div>
        )}
      </div>
      <div className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{formatBytes(item.sizeBytes)}</div>
      <div
        className="font-mono text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
        style={{ borderColor: 'var(--line)', background: 'var(--raised)' }}
        onClick={handleCopy}
        title={item.sha256}
      >
        <span>SHA-256: {truncateSha(item.sha256)}</span>
        {copied ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5 opacity-50" />}
      </div>
      {item.modality && <ModalityChip modality={item.modality} size="sm" />}
    </div>
  );
}

// ─── Rationale factor ─────────────────────────────────────────

function RationaleFactor({ factor }: { factor: { factorName: string; value: string|number; threshold?: string|number; unit?: string; contribution: string } }) {
  const contribColour = factor.contribution === 'PRIMARY' ? 'var(--sev-high)' : factor.contribution === 'SUPPORTING' ? 'var(--sev-medium)' : 'var(--text-muted)';
  return (
    <div className="flex items-start gap-3 py-2 border-b text-xs" style={{ borderColor: 'var(--line)' }}>
      <span className="text-[9px] font-mono uppercase mt-0.5 px-1.5 py-0.5 rounded flex-shrink-0" style={{ color: contribColour, border: `1px solid ${contribColour}` }}>
        {factor.contribution.slice(0, 4)}
      </span>
      <div className="flex-1">
        <span className="font-medium">{factor.factorName}:</span>{' '}
        <span className="font-mono">{factor.value}{factor.unit ? ` ${factor.unit}` : ''}</span>
        {factor.threshold !== undefined && (
          <span className="opacity-50"> (threshold: {factor.threshold}{factor.unit ? ` ${factor.unit}` : ''})</span>
        )}
      </div>
    </div>
  );
}

// ─── Alert Detail page ────────────────────────────────────────

export default function AlertDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateAlert } = useAlertStore();
  const [activeTab, setActiveTab] = useState<'RGB' | 'THERMAL'>('RGB');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportReason, setExportReason] = useState('');
  const [exportCopied, setExportCopied] = useState(false);
  const [noteText, setNoteText] = useState('');

  const { data: alert, isLoading, error } = useQuery({
    queryKey: ['alert', id],
    queryFn: () => alertsApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full gap-3" style={{ color: 'var(--text-muted)' }}>
        <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        Loading incident record…
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <AlertTriangle className="w-10 h-10 opacity-30" />
        <span style={{ color: 'var(--text-muted)' }}>Incident record not found.</span>
        <button className="text-sm" style={{ color: 'var(--sea-accent)' }} onClick={() => navigate('/alerts')}>← Back to Alerts</button>
      </div>
    );
  }

  const ev = alert.event;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Disclaimer banner */}
      <div
        className="flex items-center gap-2 px-4 py-1.5 text-xs border-b flex-shrink-0"
        style={{ background: 'var(--sand-100)', borderColor: 'var(--sand-300)', color: 'var(--ink-600)' }}
      >
        <Shield className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Describes observed activity only. Interpretation rests with authorised personnel.</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b flex-shrink-0" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
        <button
          className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--sea-accent)' }}
          onClick={() => navigate('/alerts')}
        >
          <ChevronLeft className="w-4 h-4" /> Alerts
        </button>

        <div className="h-4 w-px" style={{ background: 'var(--line)' }} />

        <div>
          <div className="font-mono text-xs opacity-50">Incident {alert.alertCode}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <SeverityChip severity={alert.severity} />
            <span className="text-xs font-medium">{eventTypeLabel(ev.type)}</span>
            <span className="text-xs opacity-50">·</span>
            <span className="text-xs opacity-60">{alert.status.replace(/_/g,' ')}</span>
            {alert.assignedToName && (
              <><span className="text-xs opacity-50">·</span><span className="text-xs opacity-60">Assigned: {alert.assignedToName}</span></>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--line)' }}
            onClick={() => setShowExportModal(true)}
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'var(--sea-600)', color: 'white' }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left: clip player + map + contact history */}
        <div className="w-96 flex-shrink-0 flex flex-col border-r overflow-hidden" style={{ borderColor: 'var(--line)' }}>
          {/* Clip player */}
          <div className="border-b flex-shrink-0" style={{ borderColor: 'var(--line)' }}>
            {/* Tab: RGB | THERMAL */}
            <div className="flex border-b" style={{ borderColor: 'var(--line)' }}>
              {(['RGB', 'THERMAL'] as const).map(m => (
                <button
                  key={m}
                  className={cn('px-4 py-2 text-xs font-mono font-medium border-b-2 transition-colors', activeTab === m ? 'border-[var(--sea-600)]' : 'border-transparent opacity-50')}
                  onClick={() => setActiveTab(m)}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Video placeholder */}
            <div className="relative h-44" style={{ background: '#030C14' }}>
              <svg viewBox="0 0 400 176" className="w-full h-full opacity-40" preserveAspectRatio="xMidYMid slice">
                <rect width="400" height="176" fill="#030C14"/>
                <path d="M0 110 Q100 100 200 108 Q300 116 400 105 L400 176 L0 176 Z" fill="#0A2035"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center cursor-pointer hover:border-white/60 transition-colors">
                  <span className="text-white/60 text-lg">▶</span>
                </div>
              </div>
              <div className="absolute top-2 right-2">
                <ModalityChip modality={activeTab} size="sm" />
              </div>
            </div>

            {/* Keyframe strip */}
            <div className="flex gap-1 p-2 overflow-x-auto">
              {alert.evidence.filter(e => e.kind === 'KEYFRAME').map((kf, i) => (
                <div
                  key={kf.id}
                  className="flex-shrink-0 w-16 h-11 rounded border overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ background: '#0a2233', borderColor: 'var(--sea-400)' }}
                  title={`Keyframe ${i+1}`}
                >
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-mono opacity-40">KF{i+1}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini map */}
          <div className="h-40 flex-shrink-0 border-b" style={{ borderColor: 'var(--line)' }}>
            <CoastalMap height="100%" interactive={false} />
          </div>

          {/* Contact history timeline */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="text-xs font-medium opacity-60 uppercase tracking-wider mb-2">Contact Timeline</div>
            <div className="relative pl-4">
              <div className="absolute left-1.5 top-0 bottom-0 w-px" style={{ background: 'var(--line)' }} />
              {[
                { time: '—3 min', label: 'Zone entry Z-07', sev: 'CRITICAL' },
                { time: '—8 min', label: 'Speed change detected', sev: 'MEDIUM' },
                { time: '—15 min', label: 'Shoreline approach ×2', sev: 'HIGH' },
                { time: '—22 min', label: 'Contact first observed', sev: 'INFO' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 mb-3 text-xs relative">
                  <div
                    className="absolute -left-[14px] w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--raised)', borderColor: `var(--sev-${item.sev.toLowerCase()})` }}
                  />
                  <div>
                    <div className="font-mono opacity-50 text-[10px]">{item.time}</div>
                    <div className="font-medium">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operator actions audit */}
          <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
            <div className="text-xs font-medium opacity-60 uppercase tracking-wider mb-2">Operator Actions</div>
            {alert.auditTrail.length === 0 ? (
              <div className="text-xs opacity-40">No actions recorded yet.</div>
            ) : alert.auditTrail.map(entry => (
              <div key={entry.id} className="text-xs mb-1.5">
                <span className="font-mono opacity-50">{formatIST(entry.timestamp)}</span>{' '}
                <span className="font-medium">{entry.userName}</span>{' '}
                <span className="opacity-70">{entry.action.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: summary + rationale + evidence + versions */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-2xl">
            {/* Summary */}
            <section className="mb-6">
              <h2 className="font-serif text-lg font-semibold mb-3">Summary</h2>
              <div className="grid grid-cols-2 gap-3">
                {([
                  ['Event Type', eventTypeLabel(ev.type)],
                  ['Occurred', formatISTFull(ev.occurredAt)],
                  ['UAV', ev.uav.code],
                  ['Mission', ev.mission.code],
                  ['Location', formatCoords(ev.location.lat, ev.location.lon)],
                  ['Attention Level', ev.attention],
                  ev.zone ? ['Zone', `${ev.zone.name} (v${ev.zone.version})`] : null,
                  ev.zone ? ['Zone Profile', ev.zone.profile ?? '—'] : null,
                  ev.contact ? ['Contact', ev.contact.code] : null,
                  ev.contact ? ['Class Conf', `${(ev.contact.classConf * 100).toFixed(0)}%`] : null,
                  ev.contact ? ['Continuity Conf', `${(ev.contact.continuityConf * 100).toFixed(0)}%`] : null,
                  ev.modality ? ['Modality', ev.modality] : null,
                ] as ([string, string] | null)[]).filter((x): x is [string, string] => x !== null).map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-xs opacity-50 uppercase tracking-wider">{label}</span>
                    <span className="text-sm font-medium font-mono">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="tide-divider mb-6" />

            {/* Why raised — explainable rationale */}
            <section className="mb-6">
              <h2 className="font-serif text-lg font-semibold mb-1">Why Was This Raised?</h2>
              <p className="text-xs opacity-50 mb-3">Contributing factors and thresholds used during alert evaluation.</p>
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
                {ev.rationale.factors.map((f, i) => <RationaleFactor key={i} factor={f} />)}
                {ev.rationale.note && (
                  <div className="px-3 py-2 text-xs opacity-60 italic">{ev.rationale.note}</div>
                )}
                {ev.rationale.zoneProfileUsed && (
                  <div className="px-3 py-2 text-xs border-t" style={{ borderColor: 'var(--line)' }}>
                    <span className="opacity-50">Zone profile used: </span>
                    <span className="font-mono font-medium">{ev.rationale.zoneProfileUsed}</span>
                  </div>
                )}
              </div>
            </section>

            <div className="tide-divider mb-6" />

            {/* Evidence */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif text-lg font-semibold">Evidence</h2>
                <button
                  className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--sea-accent)' }}
                  onClick={async () => {
                    const hashes = alert.evidence.map(e => `${e.kind}: ${e.sha256}`).join('\n');
                    await copyToClipboard(hashes);
                    setExportCopied(true);
                    setTimeout(() => setExportCopied(false), 1500);
                  }}
                >
                  {exportCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  Copy all hashes
                </button>
              </div>
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
                {alert.evidence.map(item => <EvidenceRow key={item.id} item={item} />)}
              </div>
            </section>

            {/* Model / software versions */}
            <section className="mb-6">
              <h2 className="font-serif text-lg font-semibold mb-3">Versions</h2>
              <div className="rounded-xl border p-4 space-y-1.5" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
                {[
                  ['RGB Detector', ev.versions.rgbDetectorVersion],
                  ['Thermal Detector', ev.versions.thermalDetectorVersion],
                  ['Tracker', ev.versions.trackerVersion],
                  ['Contact Engine', ev.versions.contactEngineVersion],
                  ['Behaviour Engine', ev.versions.behaviourEngineVersion],
                  ['Application', ev.versions.appVersion],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="opacity-50">{label}</span>
                    <span className="font-mono font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Notes */}
            <section>
              <h2 className="font-serif text-lg font-semibold mb-3">Notes</h2>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                className="w-full rounded-xl p-3 text-sm border resize-none outline-none focus:ring-2"
                style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)', minHeight: '80px' }}
                placeholder="Add operational notes (visible to supervisors)…"
              />
              {noteText.trim() && (
                <button
                  className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: 'var(--sea-600)', color: 'white' }}
                >
                  Save Note
                </button>
              )}
            </section>
          </div>
        </div>

        {/* ── Mandatory Decision-Support Disclaimer Footer (Rule 7) ── */}
        <footer className="mt-8 pt-4 pb-2 border-t text-center text-xs font-mono opacity-70" style={{ borderColor: 'var(--line)', color: 'var(--text-muted)' }}>
          Observed behaviour only. Operational interpretation and action rest with authorised Kerala Police personnel.
        </footer>
      </div>

      {/* Export modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: 'var(--raised)', border: '1px solid var(--line)' }}
          >
            <h3 className="font-serif text-lg font-semibold mb-1">Export Evidence Package</h3>
            <p className="text-xs opacity-60 mb-4">This export will be audited and logged. A reason is required.</p>
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Reason for export <span className="text-red-500">*</span></label>
              <textarea
                value={exportReason}
                onChange={e => setExportReason(e.target.value)}
                className="w-full rounded-xl p-3 text-sm border resize-none outline-none"
                style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)', minHeight: '80px' }}
                placeholder="Investigation reference, authorisation number…"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
                style={{ background: 'var(--sea-600)', color: 'white' }}
                disabled={!exportReason.trim()}
                onClick={() => { setShowExportModal(false); setExportReason(''); }}
              >
                <Download className="w-3.5 h-3.5 inline mr-1.5" /> Download Package
              </button>
              <button
                className="px-4 py-2.5 rounded-xl text-sm border transition-colors"
                style={{ borderColor: 'var(--line)' }}
                onClick={() => { setShowExportModal(false); setExportReason(''); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

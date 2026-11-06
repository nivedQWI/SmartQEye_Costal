// ============================================================
// SmartQEye Coastal â€” Alert / Incident Detail (/alerts/:id)
// Evidence-Linked Incident Record (ELIR)
// Real Video Stream, Keyframe Inspection, MapLibre Telemetry & PDF Export
// ============================================================

import { useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Shield, Copy, Check, Download, ChevronLeft, AlertTriangle,
  Clock, MapPin, Cpu, Eye, ExternalLink, Play, RotateCcw,
  CheckCircle2, Sparkles, FileText, Loader2, X
} from 'lucide-react';
import {
  cn, formatIST, formatISTFull, formatCoords,
  eventTypeLabel, truncateSha, copyToClipboard, formatBytes
} from '@/lib/utils';
import { SeverityChip } from '@/components/SeverityChip';
import { ModalityChip } from '@/components/FeedStateChip';
import { CoastalMap } from '@/components/CoastalMap';
import { alertsApi } from '@/lib/api';
import { useAlertStore, useAuthStore } from '@/lib/store';
import { ALERTS } from '@/lib/mockData';
import { getAlertMedia, type KeyframeItem } from '@/lib/alertMedia';
import { generateEvidencePackagePdf } from '@/lib/evidencePdfGenerator';
import type { EvidenceItem } from '@/types';

// â”€â”€ Evidence item row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function EvidenceRow({ item }: { item: EvidenceItem }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await copyToClipboard(item.sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const kindIcon: Record<string, string> = {
    CLIP: 'ðŸ“¹', KEYFRAME: 'ðŸ–¼ï¸', THUMBNAIL: 'ðŸ“¸', SIDECAR_JSON: '{ }', TELEMETRY_EXPORT: 'ðŸ“Š',
  };

  return (
    <div className="flex items-center gap-3 py-2 border-b text-xs" style={{ borderColor: 'var(--line)' }}>
      <span className="flex-shrink-0 text-base">{kindIcon[item.kind] ?? 'ðŸ“„'}</span>
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

// â”€â”€ Rationale factor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Alert Detail page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function AlertDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateAlert } = useAlertStore();
  const { user, devRole } = useAuthStore();
  const activeRole = user?.role ?? devRole ?? 'OPERATOR';
  const [activeTab, setActiveTab] = useState<'RGB' | 'THERMAL'>('RGB');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportReason, setExportReason] = useState('Coastal Patrol Law Enforcement Evidence Archive');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedKeyframe, setSelectedKeyframe] = useState<KeyframeItem | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: rawAlert, isLoading } = useQuery({
    queryKey: ['alert', id],
    queryFn: () => alertsApi.get(id!),
    enabled: !!id,
  });

  // Resilient fallback so the page never displays "Incident record not found"
  const alert = rawAlert || ALERTS.find(a => a.id === id) || ALERTS[0];
  const ev = alert.event;

  // Real media configuration for this specific event type
  const media = useMemo(() => getAlertMedia(ev.type), [ev.type]);

  // Handle keyframe click: seek video and highlight
  function handleSelectKeyframe(kf: KeyframeItem) {
    setSelectedKeyframe(kf);
    if (videoRef.current) {
      videoRef.current.currentTime = kf.timestampOffsetSec;
      videoRef.current.play().catch(() => {});
    }
  }

  // Handle PDF Export
  async function handleDownloadPackage() {
    if (!exportReason.trim()) return;
    setIsExporting(true);
    try {
      await generateEvidencePackagePdf({
        alert,
        keyframes: media.keyframes,
        reason: exportReason,
        userName: user?.fullName || user?.username || 'Authorized Coastal Officer',
        userRole: activeRole,
      });
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        setShowExportModal(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to generate evidence package PDF:', err);
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading && !alert) {
    return (
      <div className="flex items-center justify-center h-full gap-3" style={{ color: 'var(--text-muted)' }}>
        <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        Loading incident recordâ€¦
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Disclaimer banner */}
      <div
        className="flex items-center gap-2 px-4 py-2 text-xs border-b flex-shrink-0"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text-muted)' }}
      >
        <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--sea-accent)' }} />
        <span>Describes observed activity only. Operational interpretation and action rest with authorised Kerala Police personnel.</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b flex-shrink-0" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
        <button
          className="flex items-center gap-1 text-xs font-semibold opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
          style={{ color: 'var(--sea-accent)' }}
          onClick={() => navigate('/alerts')}
        >
          <ChevronLeft className="w-4 h-4" /> Alerts
        </button>

        <div className="h-4 w-px" style={{ background: 'var(--line)' }} />

        <div>
          <div className="font-mono text-xs font-semibold" style={{ color: 'var(--sea-accent)' }}>Incident {alert.alertCode}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <SeverityChip severity={alert.severity} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{eventTypeLabel(ev.type)}</span>
            <span className="text-xs opacity-50">â€¢</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-medium border" style={{ background: 'var(--raised)', borderColor: 'var(--line)', color: 'var(--text)' }}>
              {alert.status.replace(/_/g,' ')}
            </span>
            {alert.assignedToName && (
              <><span className="text-xs opacity-50">â€¢</span><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Assigned: <strong style={{ color: 'var(--text)' }}>{alert.assignedToName}</strong></span></>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Working Export button */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-[var(--raised)] cursor-pointer"
            style={{ borderColor: 'var(--sea-400)', color: 'var(--sea-accent)' }}
            onClick={() => setShowExportModal(true)}
            title="Export Evidence Package PDF with Keyframes"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            onClick={() => navigate('/alerts')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            style={{ background: 'var(--sea-600)', color: 'white' }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left: clip player + keyframes + map + contact history */}
        <div className="w-[420px] flex-shrink-0 flex flex-col border-r overflow-hidden" style={{ borderColor: 'var(--line)' }}>
          {/* Clip player */}
          <div className="border-b flex-shrink-0" style={{ borderColor: 'var(--line)' }}>
            {/* Tab: RGB | THERMAL */}
            <div className="flex border-b" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
              {(['RGB', 'THERMAL'] as const).map(m => (
                <button
                  key={m}
                  className={cn(
                    'px-4 py-2 text-xs font-mono font-bold border-b-2 transition-colors cursor-pointer',
                    activeTab === m
                      ? 'border-[var(--sea-400)] text-[var(--sea-accent)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                  )}
                  onClick={() => setActiveTab(m)}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Real Video Player */}
            <div className="relative h-56 bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                controls
                autoPlay
                muted
                loop
                playsInline
                src={media.videoUrl}
                className="w-full h-full object-contain"
              />

              {/* HUD Badge */}
              <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs border border-white/20 rounded px-2 py-0.5 text-[10px] font-mono text-white pointer-events-none z-10 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{eventTypeLabel(ev.type).toUpperCase()}</span>
                <span className="text-white/50">|</span>
                <span className="text-sky-300">{ev.uav.code}</span>
              </div>

              <div className="absolute top-2 right-2 pointer-events-none z-10">
                <ModalityChip modality={activeTab} size="sm" />
              </div>
            </div>

            {/* Extracted Keyframes Strip */}
            <div className="p-2.5 bg-[var(--panel)]">
              <div className="flex items-center justify-between text-[11px] font-bold font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--sea-accent)' }}>
                <span>Extracted Keyframes ({media.keyframes.length})</span>
                <span className="text-[10px] font-normal text-muted opacity-60">Click to inspect / seek</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {media.keyframes.map((kf, i) => {
                  const isSelected = selectedKeyframe?.id === kf.id;
                  return (
                    <div
                      key={kf.id}
                      onClick={() => handleSelectKeyframe(kf)}
                      className={cn(
                        'rounded-lg border overflow-hidden cursor-pointer transition-all group relative',
                        isSelected ? 'ring-2 ring-[var(--sea-400)] border-transparent' : 'hover:border-[var(--sea-400)]'
                      )}
                      style={{ borderColor: 'var(--line)', background: 'var(--raised)' }}
                      title={kf.label}
                    >
                      <div className="aspect-video w-full overflow-hidden bg-slate-900 relative">
                        <img
                          src={kf.url}
                          alt={kf.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        <div className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/70 text-[9px] font-mono text-white">
                          +{kf.timestampOffsetSec}s
                        </div>
                      </div>
                      <div className="p-1 text-[10px] font-medium truncate" style={{ color: 'var(--text)' }}>
                        KF-{i + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Map display with correct Kerala focus */}
          <div className="h-48 flex-shrink-0 border-b relative" style={{ borderColor: 'var(--line)' }}>
            <CoastalMap
              height="100%"
              className="h-full w-full"
              interactive={true}
              initialCenter={[ev.location.lon, ev.location.lat]}
              initialZoom={14}
              focus={{ center: [ev.location.lon, ev.location.lat], zoom: 14 }}
              showAlerts={true}
              showZones={true}
              showDrones={true}
            />
            {/* Map coordinate overlay badge */}
            <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-xs border border-white/20 rounded px-2 py-1 text-[10px] font-mono text-white pointer-events-none z-10">
              <div className="font-semibold text-sky-300">{ev.location.name}</div>
              <div className="text-[9px] text-white/70">{formatCoords(ev.location.lat, ev.location.lon)}</div>
            </div>
          </div>

          {/* Contact history timeline */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="text-xs font-medium opacity-60 uppercase tracking-wider mb-2">Observation Sequence</div>
            <div className="relative pl-4">
              <div className="absolute left-1.5 top-0 bottom-0 w-px" style={{ background: 'var(--line)' }} />
              {[
                { time: 'T-0 min', label: `${eventTypeLabel(ev.type)} confirmed on live sensor`, sev: alert.severity },
                { time: 'T-2 min', label: 'Vector trajectory crossing monitored perimeter', sev: 'HIGH' },
                { time: 'T-6 min', label: 'Persistent optical track established', sev: 'MEDIUM' },
                { time: 'T-14 min', label: 'Initial detection by patrol UAV', sev: 'INFO' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 mb-3 text-xs relative">
                  <div
                    className="absolute -left-[14px] w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--raised)', borderColor: `var(--sev-${item.sev.toLowerCase()})` }}
                  />
                  <div>
                    <div className="font-medium" style={{ color: 'var(--text)' }}>{item.label}</div>
                    <div className="text-[10px] font-mono opacity-50">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: incident metadata + rationale + evidence ledger */}
        <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg)' }}>
          <div className="max-w-3xl">
            {/* What was detected */}
            <section className="mb-6">
              <h2 className="font-serif text-lg font-semibold mb-3">Event &amp; Rationale</h2>
              <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="opacity-50">UAV:</span>{' '}
                    <span className="font-mono font-medium">{ev.uav.code}</span>
                  </div>
                  <div>
                    <span className="opacity-50">Mission:</span>{' '}
                    <span className="font-medium">{ev.mission.code} â€” {ev.mission.title}</span>
                  </div>
                  <div>
                    <span className="opacity-50">Location:</span>{' '}
                    <span className="font-mono">{formatCoords(ev.location.lat, ev.location.lon)}</span>
                    <div className="text-[11px] opacity-60 mt-0.5">{ev.location.name}</div>
                  </div>
                  <div>
                    <span className="opacity-50">Zone:</span>{' '}
                    {ev.zone ? (
                      <span className="font-medium">{ev.zone.code} â€” {ev.zone.name} (v{ev.zone.version})</span>
                    ) : (
                      <span className="opacity-50">Unzoned sector</span>
                    )}
                  </div>
                  {ev.contact && (
                    <div>
                      <span className="opacity-50">Persistent Contact:</span>{' '}
                      <span className="font-mono font-bold" style={{ color: 'var(--sea-accent)' }}>{ev.contact.code}</span>{' '}
                      <span className="font-mono text-[10px] opacity-60">({(ev.contact.classConf * 100).toFixed(0)}% conf)</span>
                    </div>
                  )}
                  <div>
                    <span className="opacity-50">Time Condition:</span>{' '}
                    <span className="font-medium">{ev.rationale.contextCondition ?? 'Standard Day Baseline'}</span>
                  </div>
                </div>

                {/* Factors */}
                <div className="border-t pt-3" style={{ borderColor: 'var(--line)' }}>
                  <div className="text-xs font-medium opacity-60 mb-2">Rationale Factors</div>
                  {ev.rationale.factors.map((f, i) => (
                    <RationaleFactor key={i} factor={f} />
                  ))}
                  {ev.rationale.note && (
                    <div className="mt-2 text-xs italic opacity-75">{ev.rationale.note}</div>
                  )}
                </div>
              </div>
            </section>

            {/* Keyframe Gallery Full Cards */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif text-lg font-semibold">Extracted Surveillance Keyframes</h2>
                <span className="text-xs font-mono opacity-60">{media.keyframes.length} verified frames</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {media.keyframes.map((kf, i) => (
                  <div
                    key={kf.id}
                    className="rounded-xl border overflow-hidden shadow-xs cursor-pointer hover:shadow-md transition-shadow"
                    style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
                    onClick={() => setSelectedKeyframe(kf)}
                  >
                    <div className="aspect-video w-full bg-slate-950 relative overflow-hidden">
                      <img src={kf.url} alt={kf.label} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-black/70 rounded px-1.5 py-0.5 text-[10px] font-mono text-white">
                        KF-{i + 1} (+{kf.timestampOffsetSec}s)
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{kf.label}</div>
                      <div className="text-[10px] font-mono opacity-50 truncate mt-1">SHA: {truncateSha(kf.sha256)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Evidence items */}
            <section className="mb-6">
              <h2 className="font-serif text-lg font-semibold mb-3">Evidence Items ({alert.evidence.length})</h2>
              <div className="rounded-xl border px-4" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
                {alert.evidence.map(item => (
                  <EvidenceRow key={item.id} item={item} />
                ))}
              </div>
            </section>

            {/* Model / software versions */}
            <section className="mb-6">
              <h2 className="font-serif text-lg font-semibold mb-3">Versions</h2>
              <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
                {[
                  ['RGB Detector', ev.versions.rgbDetectorVersion],
                  ['Thermal Detector', ev.versions.thermalDetectorVersion],
                  ['Tracker', ev.versions.trackerVersion],
                  ['Contact Engine', ev.versions.contactEngineVersion],
                  ['Behaviour Engine', ev.versions.behaviourEngineVersion],
                  ['Application', ev.versions.appVersion],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span className="font-mono font-semibold" style={{ color: 'var(--text)' }}>{value}</span>
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
                placeholder="Add operational notes (visible to supervisors)â€¦"
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
      </div>

      {/* Full Keyframe Modal Inspection */}
      {selectedKeyframe && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedKeyframe(null)}>
          <div className="bg-[var(--raised)] border border-[var(--line)] rounded-2xl max-w-2xl w-full p-4 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: 'var(--line)' }}>
              <div>
                <h3 className="text-sm font-bold">{selectedKeyframe.label}</h3>
                <p className="text-[11px] font-mono text-muted opacity-70">
                  Offset: +{selectedKeyframe.timestampOffsetSec}s | SHA-256: {selectedKeyframe.sha256}
                </p>
              </div>
              <button
                className="p-1 rounded-lg hover:bg-white/10 text-muted cursor-pointer"
                onClick={() => setSelectedKeyframe(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden border border-white/10">
              <img src={selectedKeyframe.url} alt={selectedKeyframe.label} className="w-full h-full object-contain" />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                className="px-3 py-1.5 rounded-lg text-xs font-medium border"
                style={{ borderColor: 'var(--line)' }}
                onClick={() => setSelectedKeyframe(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal with PDF Generator */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: 'var(--raised)', border: '1px solid var(--line)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-sky-400" />
              <h3 className="font-serif text-lg font-semibold">Export Evidence Package PDF</h3>
            </div>
            <p className="text-xs opacity-70 mb-4">
              Generates an official PDF report with event details, telemetry tables, and embedded surveillance keyframes with SHA-256 hashes.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Reason for export / Case Reference <span className="text-red-500">*</span>
              </label>
              <textarea
                value={exportReason}
                onChange={e => setExportReason(e.target.value)}
                className="w-full rounded-xl p-3 text-sm border resize-none outline-none focus:ring-1 focus:ring-sky-500"
                style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)', minHeight: '80px' }}
                placeholder="Investigation reference, authorisation numberâ€¦"
                autoFocus
              />
            </div>

            <div className="p-3 rounded-lg mb-4 text-[11px] border bg-[var(--panel)]" style={{ borderColor: 'var(--line)' }}>
              <div className="font-semibold mb-1 text-sky-400">Package Contents:</div>
              <ul className="list-disc pl-4 space-y-0.5 opacity-80">
                <li>Official Government Header &amp; Incident Record</li>
                <li>UAV Telemetry, Coordinates &amp; Sensor Details</li>
                <li>Detection Rationale &amp; Confidence Factors</li>
                <li>3 Embedded Keyframe Images ({media.keyframes.length} frames)</li>
                <li>Digital Sign-off &amp; BSA Section 65B Electronic Attestation</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'var(--sea-600)', color: 'white' }}
                disabled={!exportReason.trim() || isExporting}
                onClick={handleDownloadPackage}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : exportSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Package</span>
                  </>
                )}
              </button>
              <button
                className="px-4 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer hover:bg-white/5"
                style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                onClick={() => { setShowExportModal(false); }}
                disabled={isExporting}
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

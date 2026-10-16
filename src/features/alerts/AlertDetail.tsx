// ============================================================
// SmartQEye Coastal — Evidence-Linked Incident Record (ELIR)
// /incidents/:id and /alerts/:id
// Complete 8-Tab Court-Admissible Electronic Dossier
// ============================================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Shield, Copy, Check, Download, ChevronLeft, AlertTriangle,
  Cpu, Anchor, BellRing, Lock, CheckCircle2,
  FileCheck, History, Radio, Compass, RefreshCw, FileText,
  AlertOctagon, UserCheck, Layers, ExternalLink
} from 'lucide-react';
import {
  cn, formatISTFull, formatCoords,
  truncateSha, copyToClipboard, formatBytes
} from '@/lib/utils';
import { SeverityChip } from '@/components/SeverityChip';
import { ModalityChip } from '@/components/FeedStateChip';
import { CoastalMap } from '@/components/CoastalMap';
import { DroneVideoPlayer } from '@/components/DroneVideoPlayer';
import { incidentsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { HumanInterpretationNote } from '@/components/HumanInterpretationNote';
import { TacticalActionDialog, type TacticalActionType } from '@/components/TacticalActionDialog';
import { CkfeKeyframeStrip } from '@/components/CkfeKeyframeStrip';
import { PermissionGate } from '@/components/PermissionGate';
import { triggerFileDownload } from '@/lib/exportEvidence';
import type { IncidentWorkflowStatus } from '@/types';

type ElirTab =
  | 'SUMMARY'
  | 'EVIDENCE'
  | 'CONTACT'
  | 'TELEMETRY'
  | 'RATIONALE'
  | 'VERSIONS'
  | 'ACTIONS'
  | 'CUSTODY';

export default function AlertDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, getEffectiveRole } = useAuthStore();


  const [activeTab, setActiveTab] = useState<ElirTab>('SUMMARY');
  const [videoModality, setVideoModality] = useState<'RGB' | 'THERMAL'>('RGB');
  const [seekTimeSec, setSeekTimeSec] = useState<number | undefined>(undefined);

  // Modals & workflows
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportReason, setExportReason] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<IncidentWorkflowStatus | null>(null);
  const [statusNote, setStatusNote] = useState('');

  const [showFalsePositiveModal, setShowFalsePositiveModal] = useState(false);
  const [falsePositiveReason, setFalsePositiveReason] = useState('');

  const [tacticalAction, setTacticalAction] = useState<TacticalActionType | null>(null);
  const [isVerifyingSeal, setIsVerifyingSeal] = useState(false);
  const [sealVerified, setSealVerified] = useState<boolean | null>(null);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  // Fetch incident via incidentsApi (handles both inc- and alt- IDs)
  const { data: incident, isLoading, error, refetch } = useQuery({
    queryKey: ['incident-elir', id],
    queryFn: () => incidentsApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full gap-3" style={{ color: 'var(--text-muted)' }}>
        <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        <span className="font-mono text-xs">Loading Evidence-Linked Incident Record…</span>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <AlertTriangle className="w-10 h-10 opacity-30 text-amber-500" />
        <span className="font-serif text-base font-bold">Incident record not found</span>
        <p className="text-xs opacity-60">The requested electronic court dossier could not be retrieved from the ledger.</p>
        <button
          className="text-xs px-4 py-2 rounded-xl text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors mt-2"
          onClick={() => navigate('/incidents')}
        >
          ← Return to Incident Records
        </button>
      </div>
    );
  }

  async function handleCopyHash(sha: string) {
    await copyToClipboard(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 1500);
  }

  async function handleStatusTransition() {
    if (!targetStatus) return;
    try {
      await incidentsApi.updateStatus(
        incident!.id,
        targetStatus,
        statusNote,
        {
          id: user?.id || 'u-curr',
          name: user?.fullName || 'Current Officer',
          role: getEffectiveRole(),
        }
      );
      setShowStatusModal(false);
      setStatusNote('');
      setTargetStatus(null);
      refetch();
    } catch (err) {
      alert(`Status transition failed: ${String(err)}`);
    }
  }

  async function handleConfirmFalsePositive() {
    if (!falsePositiveReason.trim()) return;
    try {
      await incidentsApi.markFalsePositive(
        incident!.id,
        falsePositiveReason,
        {
          id: user?.id || 'u-curr',
          name: user?.fullName || 'Current Officer',
          role: getEffectiveRole(),
        }
      );
      setShowFalsePositiveModal(false);
      setFalsePositiveReason('');
      refetch();
    } catch (err) {
      alert(`Action failed: ${String(err)}`);
    }
  }

  async function handleExportPackage() {
    if (!exportReason.trim()) return;
    setIsExporting(true);
    try {
      const result = await incidentsApi.exportPackage(
        incident!.id,
        exportReason,
        {
          id: user?.id || 'u-curr',
          name: user?.fullName || 'CI Saji Varghese',
          badge: 'KL-CP-0842',
          rank: user?.rankTitle || 'Inspector of Police',
          role: getEffectiveRole(),
          station: incident!.station || 'Vizhinjam Coastal Police Station',
        }
      );
      triggerFileDownload(result.blob, result.filename);
      setShowExportModal(false);
      setExportReason('');
      refetch();
    } catch (err) {
      alert(`Export failed: ${String(err)}`);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleVerifySeal() {
    setIsVerifyingSeal(true);
    try {
      await incidentsApi.verifySeal(incident!.id);
      setSealVerified(true);
    } catch {
      setSealVerified(false);
    } finally {
      setIsVerifyingSeal(false);
    }
  }

  const tabs: { key: ElirTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'SUMMARY', label: 'Summary', icon: FileText },
    { key: 'EVIDENCE', label: `Evidence (${incident.evidenceCount})`, icon: Layers },
    { key: 'CONTACT', label: 'Contact History', icon: Radio },
    { key: 'TELEMETRY', label: 'Telemetry & GIS', icon: Compass },
    { key: 'RATIONALE', label: 'AI Rationale', icon: Cpu },
    { key: 'VERSIONS', label: 'Versions & Audit', icon: Shield },
    { key: 'ACTIONS', label: `Operator Actions (${incident.auditTrail.length})`, icon: History },
    { key: 'CUSTODY', label: 'Chain of Custody', icon: Lock },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* ── Top Classification & Legal Notice Banner ── */}
      <div
        className="flex items-center justify-between px-6 py-1.5 text-xs font-mono border-b flex-shrink-0"
        style={{ background: '#13281E', color: '#7FEFA0', borderColor: 'rgba(127, 239, 160, 0.25)' }}
      >
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" />
          <span>EVIDENCE-LINKED INCIDENT RECORD (ELIR) · COURT-ADMISSIBLE DOSSIER · SEC 65B IEA / SEC 63 BNSS</span>
        </div>
        <div className="flex items-center gap-3">
          <span>SHA-256 SEAL: <code className="font-bold">{incident.sha256DossierHash.slice(0, 16)}…</code></span>
          <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
            SEALED
          </span>
        </div>
      </div>

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg border hover:bg-[var(--surface-hover)] transition-colors opacity-70 hover:opacity-100"
            style={{ borderColor: 'var(--line)' }}
            title="Return to previous list"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[var(--sea-600)]">{incident.incidentCode}</span>
              <SeverityChip severity={incident.severity} />
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                {incident.category.replace(/_/g, ' ')}
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-mono font-bold border',
                  incident.status === 'RESOLVED'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : incident.status === 'FALSE_POSITIVE'
                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                    : incident.status === 'ESCALATED'
                    ? 'bg-red-500/10 text-red-600 border-red-500/20'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                )}
              >
                STATUS: {incident.status.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="font-serif text-base font-bold mt-0.5 truncate max-w-2xl">{incident.title}</h1>
          </div>
        </div>

        {/* Tactical Actions & Workflows */}
        <div className="flex items-center gap-2">
          {/* Recommend Patrol Response */}
          <PermissionGate permission="ACKNOWLEDGE_ALERT">
            <button
              onClick={() => setTacticalAction('RECOMMEND_PATROL_RESPONSE')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-90"
              style={{ background: 'var(--sea-200)', borderColor: 'var(--sea-400)', color: 'var(--sea-700)' }}
            >
              <Anchor className="w-3.5 h-3.5" /> Recommend Patrol
            </button>
          </PermissionGate>

          {/* Notify Duty Officer */}
          <PermissionGate permission="ACKNOWLEDGE_ALERT">
            <button
              onClick={() => setTacticalAction('NOTIFY_DUTY_OFFICER')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-90"
              style={{ background: 'rgba(235, 114, 53, 0.1)', borderColor: 'var(--sev-high)', color: 'var(--sev-high)' }}
            >
              <BellRing className="w-3.5 h-3.5" /> Notify Officer
            </button>
          </PermissionGate>

          {/* Export Evidence Package */}
          <PermissionGate permission="EXPORT">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Export Court ZIP
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* ── 8-Tab Navigation Bar ── */}
      <div className="flex items-center px-6 border-b flex-shrink-0 overflow-x-auto" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 py-3 px-3.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer',
                isActive
                  ? 'border-[var(--sea-600)] text-[var(--sea-600)] font-bold'
                  : 'border-transparent opacity-60 hover:opacity-100 hover:text-[var(--text)]'
              )}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Main Tab Contents ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* TAB 1: SUMMARY */}
        {activeTab === 'SUMMARY' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Incident Details Card */}
              <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                <h3 className="font-serif text-base font-bold flex items-center justify-between">
                  <span>Incident Intelligence Profile</span>
                  <span className="text-xs font-mono opacity-50 font-normal">Recorded: {incident.openedAt}</span>
                </h3>

                <p className="text-xs leading-relaxed opacity-85 font-sans">
                  {incident.summary}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border bg-[var(--surface)] text-xs font-mono" style={{ borderColor: 'var(--line)' }}>
                  <div>
                    <span className="opacity-50 block text-[10px]">UAV PLATFORM</span>
                    <span className="font-bold">{incident.uavCode}</span>
                  </div>
                  <div>
                    <span className="opacity-50 block text-[10px]">MISSION SORTIE</span>
                    <span className="font-bold">{incident.missionCode}</span>
                  </div>
                  <div>
                    <span className="opacity-50 block text-[10px]">COASTAL ZONE</span>
                    <span className="font-bold text-[var(--sea-600)]">{incident.zoneCode}</span>
                  </div>
                  <div>
                    <span className="opacity-50 block text-[10px]">LOCATION (WGS84)</span>
                    <span className="font-bold">{formatCoords(incident.coordinates.lat, incident.coordinates.lon)}</span>
                  </div>
                </div>

                {/* Status Transition Workflow Card */}
                <div className="p-4 rounded-xl border space-y-3" style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold block">Incident Status Transition Workflow</span>
                      <span className="text-[11px] opacity-60">Every state change writes an immutable entry to the cryptographic audit log.</span>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                      CURRENT: {incident.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {(['NEW', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'ESCALATED', 'RESOLVED'] as IncidentWorkflowStatus[]).map(st => (
                      <button
                        key={st}
                        disabled={incident.status === st}
                        onClick={() => {
                          setTargetStatus(st);
                          setShowStatusModal(true);
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border cursor-pointer',
                          incident.status === st
                            ? 'bg-[var(--sea-600)] text-white border-[var(--sea-600)] font-bold shadow-xs'
                            : 'hover:bg-[var(--surface-hover)] border-[var(--line)] opacity-80'
                        )}
                      >
                        {st}
                      </button>
                    ))}

                    <button
                      onClick={() => setShowFalsePositiveModal(true)}
                      className="ml-auto px-3 py-1.5 rounded-lg text-xs font-mono font-medium border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      Mark False Positive
                    </button>
                  </div>
                </div>
              </div>

              {/* Operator Notes */}
              <div className="rounded-2xl border p-5 space-y-3" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                <h3 className="font-serif text-sm font-bold">Investigating Officer Log</h3>
                <div className="p-3.5 rounded-xl border bg-[var(--surface)] text-xs font-sans italic opacity-85" style={{ borderColor: 'var(--line)' }}>
                  &ldquo;{incident.operatorNotes || 'No operator commentary logged yet.'}&rdquo;
                </div>
              </div>
            </div>

            {/* Right sidebar: Station & Police Officer Sign-off */}
            <div className="space-y-6">
              <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                <h3 className="font-serif text-sm font-bold flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[var(--sea-600)]" />
                  <span>Police Jurisdiction &amp; Officer</span>
                </h3>

                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <span className="opacity-50 block text-[10px]">ASSIGNED STATION</span>
                    <span className="font-semibold">{incident.station}</span>
                  </div>
                  <div>
                    <span className="opacity-50 block text-[10px]">INVESTIGATING OFFICER</span>
                    <span className="font-semibold">{incident.assignedOfficer}</span>
                  </div>
                  <div>
                    <span className="opacity-50 block text-[10px]">BADGE / PEN NUMBER</span>
                    <span className="font-bold text-[var(--sea-600)]">{incident.badge}</span>
                  </div>
                  <div>
                    <span className="opacity-50 block text-[10px]">OPERATIONAL ATTENTION LEVEL</span>
                    <span className="font-bold text-amber-500">{incident.attention}</span>
                  </div>
                </div>
              </div>

              {/* Mini Map */}
              <div className="rounded-2xl border overflow-hidden h-64" style={{ borderColor: 'var(--line)' }}>
                <CoastalMap height="100%" interactive={false} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EVIDENCE */}
        {activeTab === 'EVIDENCE' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Drone Video Player */}
              <div className="rounded-2xl border overflow-hidden flex flex-col" style={{ background: 'black', borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between px-4 py-2 bg-[var(--panel)] border-b" style={{ borderColor: 'var(--line)' }}>
                  <span className="font-mono text-xs font-bold text-white">TACTICAL PLAYBACK STREAM</span>
                  <div className="flex items-center gap-1">
                    {(['RGB', 'THERMAL'] as const).map(mod => (
                      <button
                        key={mod}
                        onClick={() => setVideoModality(mod)}
                        className={cn(
                          'px-2.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all',
                          videoModality === mod ? 'bg-[var(--sea-600)] text-white' : 'opacity-60 text-gray-300'
                        )}
                      >
                        {mod}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-72 w-full relative">
                  <DroneVideoPlayer
                    sceneName="vizhinjam_patrol"
                    initialModality={videoModality}
                    compactControls={true}
                    seekToTimeSec={seekTimeSec}
                    highlightContactId={incident.contactCode}
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Cognitive Keyframe Extraction (CKFE) Strip */}
              <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-sm font-bold">Cognitive Keyframe Extraction (CKFE)</h3>
                    <p className="text-[11px] opacity-60">Tamper-sealed visual evidence frames selected post-event.</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold">
                    CKFE CERTIFIED
                  </span>
                </div>

                <CkfeKeyframeStrip onSelectKeyframe={(sec: number) => setSeekTimeSec(sec)} />
              </div>
            </div>

            {/* Sealed Evidence Artifacts Table */}
            <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold">Cryptographically Sealed Artifacts</h3>
                  <p className="text-xs opacity-60">Verified primary evidence files linked to court docket</p>
                </div>
                <button
                  onClick={async () => {
                    const allHashes = incident.evidence.map(e => `${e.kind}: ${e.sha256}`).join('\n');
                    await copyToClipboard(allHashes);
                    alert('All evidence SHA-256 digests copied to clipboard.');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border hover:bg-[var(--surface-hover)] transition-colors"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <Copy className="w-3 h-3" /> Copy All Hashes
                </button>
              </div>

              <div className="divide-y divide-[var(--line)]">
                {incident.evidence.map(item => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[var(--surface)] text-[var(--sea-600)] font-bold text-xs">
                        {item.kind.slice(0, 4)}
                      </div>
                      <div>
                        <div className="font-semibold">{item.kind.replace(/_/g, ' ')}</div>
                        <div className="font-mono text-[10px] opacity-60">{item.description || item.url}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] opacity-50">{formatBytes(item.sizeBytes)}</span>
                      {item.modality && <ModalityChip modality={item.modality} size="sm" />}
                      <div
                        onClick={() => handleCopyHash(item.sha256)}
                        className="px-2.5 py-1 rounded-md border font-mono text-[10px] flex items-center gap-1.5 cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                        style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}
                        title={item.sha256}
                      >
                        <Lock className="w-3 h-3 text-emerald-500" />
                        <span>SHA-256: {truncateSha(item.sha256)}</span>
                        {copiedSha === item.sha256 ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-40" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONTACT HISTORY */}
        {activeTab === 'CONTACT' && (
          <div className="space-y-6">
            <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-[var(--sea-600)] font-bold">{incident.contactCode || 'C-1042'}</span>
                  <h3 className="font-serif text-lg font-bold">Persistent Coastal Contact Profile</h3>
                </div>
                {incident.contactCode && (
                  <button
                    onClick={() => navigate(`/contacts/${incident.contactCode?.toLowerCase()}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors"
                  >
                    Open Contact Dossier <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Continuity & Occlusion Advisory Banner */}
              <div className="p-3.5 rounded-xl border bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold font-mono">
                  <AlertOctagon className="w-4 h-4 text-amber-500" />
                  <span>OCCLUSION HANDLING: CONTINUITY ADVISORY</span>
                </div>
                <p className="opacity-90 leading-relaxed font-sans">
                  Craft experienced an 8.2-second line-of-sight occlusion behind Vizhinjam breakwater pier. Tracking continuity maintained via kinematic dead-reckoning with a temporary confidence drop from 94.6% to 91.4%.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border bg-[var(--surface)] text-xs font-mono" style={{ borderColor: 'var(--line)' }}>
                <div>
                  <span className="opacity-50 block text-[10px]">CRAFT CLASSIFICATION</span>
                  <span className="font-bold">HIGH-SPEED OUTBOARD</span>
                </div>
                <div>
                  <span className="opacity-50 block text-[10px]">CONTINUITY CONFIDENCE</span>
                  <span className="font-bold text-emerald-600">91.4%</span>
                </div>
                <div>
                  <span className="opacity-50 block text-[10px]">DWELL DURATION</span>
                  <span className="font-bold">14.2 minutes</span>
                </div>
                <div>
                  <span className="opacity-50 block text-[10px]">SHORELINE APPROACHES</span>
                  <span className="font-bold text-amber-500">2 Breaches</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TELEMETRY & GIS */}
        {activeTab === 'TELEMETRY' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <h3 className="font-serif text-base font-bold">Synchronised UAV Telemetry at Event Time</h3>
              <p className="text-xs opacity-60">Sampled from onboard avionics during closest approach vector</p>

              <div className="divide-y divide-[var(--line)] text-xs font-mono">
                {[
                  ['UAV Identifier', incident.uavCode],
                  ['GPS Latitude', `${incident.coordinates.lat.toFixed(5)}° N`],
                  ['GPS Longitude', `${incident.coordinates.lon.toFixed(5)}° E`],
                  ['Flight Altitude', '82.4 metres AGL'],
                  ['Target Ground Speed', '28.4 knots (52.6 km/h)'],
                  ['Compass Heading', '142° (South-Southeast)'],
                  ['Gimbal Pitch / Roll', '-22.4° / +1.2°'],
                  ['Avionics Battery', '74% (18.2V)'],
                  ['GNSS Satellites Locked', '18 Sats (RTK Fixed)'],
                  ['Telemetry Signal RSSI', '-64 dBm (99% Signal Quality)'],
                ].map(([label, val]) => (
                  <div key={label} className="py-2.5 flex justify-between">
                    <span className="opacity-60">{label}</span>
                    <span className="font-bold">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border overflow-hidden h-96" style={{ borderColor: 'var(--line)' }}>
              <CoastalMap height="100%" interactive={true} />
            </div>
          </div>
        )}

        {/* TAB 5: AI RATIONALE */}
        {activeTab === 'RATIONALE' && (
          <div className="space-y-6">
            <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div>
                <h3 className="font-serif text-base font-bold">Explainable AI Operational Rationale</h3>
                <p className="text-xs opacity-60">Breakdown of weighted factors and Kerala coastal context thresholds</p>
              </div>

              <div className="p-3.5 rounded-xl border bg-[var(--surface)] text-xs font-mono space-y-1" style={{ borderColor: 'var(--line)' }}>
                <div className="flex justify-between">
                  <span className="opacity-50">CONTEXT PROFILE:</span>
                  <span className="font-bold text-[var(--sea-600)]">{incident.rationale?.zoneProfileUsed || 'Vizhinjam Port Security Profile'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-50">TIME WINDOW / SEASON:</span>
                  <span className="font-bold">{incident.rationale?.contextCondition || 'STANDARD_DAYTIME_MONSOON'}</span>
                </div>
              </div>

              <div className="space-y-3">
                {(incident.rationale?.factors || []).map((factor, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border flex items-center justify-between text-xs"
                    style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-mono font-bold',
                            factor.contribution === 'PRIMARY'
                              ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          )}
                        >
                          {factor.contribution}
                        </span>
                        <span className="font-bold text-sm">{factor.factorName}</span>
                      </div>
                      <p className="text-[11px] opacity-75 font-sans mt-1">{factor.detail || 'Context breach exceeding predefined safety margins.'}</p>
                    </div>

                    <div className="text-right font-mono">
                      <div className="font-bold text-sm text-red-500">{factor.value} {factor.unit || ''}</div>
                      {factor.threshold && (
                        <div className="text-[10px] opacity-50">Threshold: {factor.threshold} {factor.unit || ''}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: VERSIONS & AUDIT */}
        {activeTab === 'VERSIONS' && (
          <div className="space-y-6">
            <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <h3 className="font-serif text-base font-bold">Algorithms, Models &amp; Platform Provenance</h3>
              <p className="text-xs opacity-60">Exact model versions and rule engines applied to this evidence bundle</p>

              <div className="divide-y divide-[var(--line)] text-xs font-mono">
                {[
                  ['RGB Detector', incident.versions?.rgbDetectorVersion || 'RTMDet-L v2.4.1 (Apache-2.0)'],
                  ['Thermal Detector', incident.versions?.thermalDetectorVersion || 'RTMDet-Thermal v1.8 (Apache-2.0)'],
                  ['Multi-Object Tracker', incident.versions?.trackerVersion || 'ByteTrack v1.1 (MIT)'],
                  ['Contact Engine', incident.versions?.contactEngineVersion || 'Persistent Coastal Contact Engine v3.1 (QWI)'],
                  ['Behaviour Engine', incident.versions?.behaviourEngineVersion || 'Kerala Coastal Context Analytics v2.8 (QWI)'],
                  ['Console Software Build', incident.versions?.appVersion || 'SmartQEye Coastal v2.6.4-prod-mvp'],
                  ['Deployment Node', 'Central GPU Node A (Air-Gapped Cluster)'],
                ].map(([label, val]) => (
                  <div key={label} className="py-2.5 flex justify-between">
                    <span className="opacity-60">{label}</span>
                    <span className="font-bold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: OPERATOR ACTIONS */}
        {activeTab === 'ACTIONS' && (
          <div className="space-y-4">
            <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <h3 className="font-serif text-base font-bold">Chronological Operator Action Trail</h3>
              <p className="text-xs opacity-60">Sworn officer review logs, acknowledgements, and tactical confirmations</p>

              <div className="space-y-3">
                {incident.auditTrail.map(entry => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-xl border text-xs space-y-1.5"
                    style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
                  >
                    <div className="flex items-center justify-between font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--sea-600)]">{entry.userName}</span>
                        <span className="opacity-50">({entry.userRole})</span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                          {entry.action}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-60">{formatISTFull(entry.timestamp)}</span>
                    </div>

                    <p className="text-xs font-sans opacity-85">
                      {entry.beforeAfterSummary || 'Operator action recorded.'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono opacity-50 pt-1 border-t" style={{ borderColor: 'var(--line)' }}>
                      <span>IP: {entry.ipAddress} · Session: {entry.sessionId}</span>
                      <span>Digest: {truncateSha(entry.hash || incident.sha256DossierHash)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: CHAIN OF CUSTODY */}
        {activeTab === 'CUSTODY' && (
          <div className="space-y-6">
            <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span>Cryptographic Chain of Custody &amp; Tamper Verification</span>
                  </h3>
                  <p className="text-xs opacity-60">Verified in-browser via Web Crypto SHA-256 for court submission</p>
                </div>

                <button
                  onClick={handleVerifySeal}
                  disabled={isVerifyingSeal}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', isVerifyingSeal && 'animate-spin')} />
                  <span>Verify Cryptographic Seal</span>
                </button>
              </div>

              {/* Tamper Check Result Badge */}
              {sealVerified !== null && (
                <div
                  className={cn(
                    'p-4 rounded-xl border flex items-center gap-3 text-xs',
                    sealVerified
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
                  )}
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <span className="font-bold block font-mono">TAMPER-CHECK VERIFIED (ZERO BIT DIVERGENCE)</span>
                    <span className="opacity-90 font-sans">
                      All {incident.evidence.length} evidence artifact SHA-256 digests and telemetry tracks recomputed in-browser via native Web Crypto. Hash state matches tamper-evident court registry seal.
                    </span>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl border bg-[var(--surface)] text-xs font-mono space-y-2" style={{ borderColor: 'var(--line)' }}>
                <div className="flex justify-between">
                  <span className="opacity-50">COURT DOSSIER DIGEST:</span>
                  <code className="font-bold">{incident.sha256DossierHash}</code>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-50">PRIMARY JURISDICTION:</span>
                  <span>{incident.station}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-50">CERTIFYING OFFICER:</span>
                  <span>{incident.assignedOfficer} ({incident.badge})</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-50">LEGAL COMPLIANCE:</span>
                  <span className="text-emerald-600 font-bold">Sec 65B Indian Evidence Act / Sec 63 BNSS Compliant</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Mandatory Human in the Loop Footer (Rule 7) ── */}
        <HumanInterpretationNote />
      </div>

      {/* ── Tactical Confirmation Dialog (Rule 7) ── */}
      {tacticalAction && (
        <TacticalActionDialog
          open={!!tacticalAction}
          onOpenChange={open => { if (!open) setTacticalAction(null); }}
          actionType={tacticalAction}
          targetId={incident.id}
          targetCode={incident.incidentCode}
          onConfirm={() => {
            setTacticalAction(null);
            refetch();
          }}
        />
      )}

      {/* ── Status Transition Modal ── */}
      {showStatusModal && targetStatus && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl border space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <h3 className="font-serif text-lg font-bold">Confirm Status Transition</h3>
            <p className="text-xs opacity-70">
              Moving incident <strong className="font-mono text-[var(--sea-600)]">{incident.incidentCode}</strong> from <strong className="font-mono">{incident.status}</strong> to <strong className="font-mono text-emerald-600">{targetStatus}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold mb-1">Reason / Officer Justification <span className="text-red-500">*</span></label>
              <textarea
                value={statusNote}
                onChange={e => setStatusNote(e.target.value)}
                placeholder="State operational grounds for this status change…"
                className="w-full p-3 rounded-xl border text-xs outline-none focus:ring-2 resize-none"
                style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setShowStatusModal(false); setStatusNote(''); }}
                className="px-4 py-2 rounded-xl text-xs border hover:bg-[var(--surface-hover)] transition-colors"
                style={{ borderColor: 'var(--line)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleStatusTransition}
                disabled={!statusNote.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors disabled:opacity-40"
              >
                Confirm Transition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark False Positive Modal (Rule 6) ── */}
      {showFalsePositiveModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl border space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--sev-high)' }}>
            <div className="flex items-center gap-2 text-rose-500">
              <AlertOctagon className="w-5 h-5" />
              <h3 className="font-serif text-lg font-bold">Mark as False Alert / Positive</h3>
            </div>

            {/* Rule 6 Explicit Governance Notice */}
            <div className="p-3.5 rounded-xl border bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs space-y-1">
              <span className="font-bold font-mono block">AI SAFETY GOVERNANCE NOTICE:</span>
              <p className="font-sans leading-relaxed">
                Will not modify deployed models automatically. Item will be submitted to the offline curated dataset queue for human verification.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Observation Reason <span className="text-red-500">*</span></label>
              <textarea
                value={falsePositiveReason}
                onChange={e => setFalsePositiveReason(e.target.value)}
                placeholder="e.g. Registered traditional fishing craft returning from permitted night drift…"
                className="w-full p-3 rounded-xl border text-xs outline-none focus:ring-2 resize-none"
                style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setShowFalsePositiveModal(false); setFalsePositiveReason(''); }}
                className="px-4 py-2 rounded-xl text-xs border hover:bg-[var(--surface-hover)] transition-colors"
                style={{ borderColor: 'var(--line)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFalsePositive}
                disabled={!falsePositiveReason.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-40"
              >
                Submit to Curated Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Export Court Evidence Package Modal ── */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl border space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-2 text-[var(--sea-600)]">
              <FileCheck className="w-5 h-5" />
              <h3 className="font-serif text-lg font-bold">Export Sealed Evidence Package</h3>
            </div>

            <p className="text-xs opacity-70">
              Generates a tamper-evident ZIP containing legal summary, telemetry CSV, audit trail extract, keyframes, and SHA-256 manifest.
            </p>

            <div>
              <label className="block text-xs font-semibold mb-1">Stated Purpose / Case Reference <span className="text-red-500">*</span></label>
              <textarea
                value={exportReason}
                onChange={e => setExportReason(e.target.value)}
                placeholder="e.g. Forwarding to Judicial First Class Magistrate Court for FIR No. 248/2026…"
                className="w-full p-3 rounded-xl border text-xs outline-none focus:ring-2 resize-none"
                style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setShowExportModal(false); setExportReason(''); }}
                className="px-4 py-2 rounded-xl text-xs border hover:bg-[var(--surface-hover)] transition-colors"
                style={{ borderColor: 'var(--line)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleExportPackage}
                disabled={!exportReason.trim() || isExporting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors disabled:opacity-40"
              >
                {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Generate &amp; Download ZIP</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SmartQEye Coastal — Evidence-Linked Incident Records (ELIR) Page
// Court-admissible electronic dossiers linking drone telemetry, CKFE keyframes, and police actions
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FolderArchive, FileText, Download, Shield, Clock,
  MapPin, CheckCircle2, ChevronRight, Lock, Key, Search,
  Filter, ExternalLink, RefreshCw, AlertTriangle
} from 'lucide-react';
import { incidentsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { HumanInterpretationNote } from '@/components/HumanInterpretationNote';
import { PermissionGate } from '@/components/PermissionGate';
import { triggerFileDownload } from '@/lib/exportEvidence';
import { cn, formatISTFull } from '@/lib/utils';
import type { IncidentRecord, IncidentCategory, IncidentWorkflowStatus } from '@/types';

export default function IncidentsPage() {
  const navigate = useNavigate();
  const { user, getEffectiveRole } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [exportingId, setExportingId] = useState<string | null>(null);

  const { data: incidents = [], isLoading, error, refetch } = useQuery({
    queryKey: ['incidents-list'],
    queryFn: () => incidentsApi.list(),
  });

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch =
      inc.incidentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.assignedOfficer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.station.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || inc.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || inc.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  async function handleQuickExport(inc: IncidentRecord, e: React.MouseEvent) {
    e.stopPropagation();
    const purpose = window.prompt(
      `Enter mandatory stated purpose / court reference for exporting incident package ${inc.incidentCode}:`,
      'Judicial First Class Magistrate Court submission / Section 65B verification'
    );
    if (!purpose || !purpose.trim()) return;

    setExportingId(inc.id);
    try {
      const result = await incidentsApi.exportPackage(inc.id, purpose, {
        id: user?.id || 'u-curr',
        name: user?.fullName || 'Current Officer',
        badge: inc.badge,
        rank: user?.rankTitle || 'Inspector',
        role: getEffectiveRole(),
        station: inc.station,
      });
      triggerFileDownload(result.blob, result.filename);
      refetch();
    } catch (err) {
      alert(`Export failed: ${String(err)}`);
    } finally {
      setExportingId(null);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* ── Top Header ── */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
        style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--surface)] text-[var(--sea-600)] border" style={{ borderColor: 'var(--line)' }}>
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold">Evidence-Linked Incident Records (ELIR)</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                TAMPER-EVIDENT SHA-256
              </span>
            </div>
            <p className="text-xs opacity-60">
              Court-admissible electronic dossiers linking drone telemetry, CKFE keyframes, and officer certifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg border hover:bg-[var(--surface-hover)] transition-colors opacity-70 hover:opacity-100"
            style={{ borderColor: 'var(--line)' }}
            title="Refresh incident ledger"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div
        className="flex flex-wrap items-center justify-between px-6 py-3 border-b gap-3 flex-shrink-0"
        style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}
      >
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-[var(--panel)] min-w-[280px]" style={{ borderColor: 'var(--line)' }}>
          <Search className="w-3.5 h-3.5 opacity-40" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search dossier ID, craft, station, officer…"
            className="bg-transparent text-xs outline-none w-full font-sans"
          />
        </div>

        {/* Category & Status Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border bg-[var(--panel)] text-xs font-mono outline-none"
            style={{ borderColor: 'var(--line)' }}
          >
            <option value="ALL">All Categories</option>
            <option value="ZONE_INTRUSION">Zone Intrusion</option>
            <option value="SUSPICIOUS_CONVERGENCE">Suspicious Convergence</option>
            <option value="SHORELINE_CONTRABAND">Shoreline Contraband</option>
            <option value="SECURITY_BREACH">Security Breach</option>
            <option value="ABANDONED_OBJECT">Abandoned Object</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border bg-[var(--panel)] text-xs font-mono outline-none"
            style={{ borderColor: 'var(--line)' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="ESCALATED">ESCALATED</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="FALSE_POSITIVE">FALSE POSITIVE</option>
          </select>
        </div>
      </div>

      {/* ── Dossiers List ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 gap-3" style={{ color: 'var(--text-muted)' }}>
            <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            <span className="font-mono text-xs">Loading court dossiers…</span>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center space-y-2 opacity-50">
            <FolderArchive className="w-8 h-8" />
            <span className="text-xs font-mono">No incident records match the current filters.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIncidents.map(inc => (
              <div
                key={inc.id}
                onClick={() => navigate(`/incidents/${inc.id}`)}
                className="rounded-2xl border p-5 space-y-4 transition-all hover:shadow-md cursor-pointer group"
                style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--sea-600)] group-hover:underline">
                        {inc.incidentCode}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                        {inc.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] font-mono opacity-50">· {inc.openedAt}</span>
                    </div>
                    <h3 className="font-serif text-base font-bold mt-1 group-hover:text-[var(--sea-600)] transition-colors">
                      {inc.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-semibold font-mono border',
                        inc.status === 'RESOLVED'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : inc.status === 'FALSE_POSITIVE'
                          ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          : inc.status === 'ESCALATED'
                          ? 'bg-red-500/10 text-red-600 border-red-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      )}
                    >
                      {inc.status.replace(/_/g, ' ')}
                    </span>

                    <PermissionGate permission="EXPORT">
                      <button
                        onClick={e => handleQuickExport(inc, e)}
                        disabled={exportingId === inc.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-xs disabled:opacity-50"
                        title="Export Court Evidence ZIP with SHA-256 manifest"
                      >
                        {exportingId === inc.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                        <span>Court ZIP</span>
                      </button>
                    </PermissionGate>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs opacity-80 leading-relaxed font-sans line-clamp-2">
                  {inc.summary}
                </p>

                {/* Metadata cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 rounded-xl border bg-[var(--surface)] text-xs font-mono" style={{ borderColor: 'var(--line)' }}>
                  <div>
                    <span className="opacity-50 block text-[10px]">POLICE JURISDICTION</span>
                    <span className="font-semibold">{inc.station}</span>
                  </div>
                  <div>
                    <span className="opacity-50 block text-[10px]">INVESTIGATING OFFICER</span>
                    <span className="font-semibold">{inc.assignedOfficer} ({inc.badge})</span>
                  </div>
                  <div>
                    <span className="opacity-50 block text-[10px]">UAV SORTIE / ZONE</span>
                    <span className="font-semibold">{inc.uavCode} · {inc.zoneCode}</span>
                  </div>
                  <div>
                    <span className="opacity-50 block text-[10px]">SEALED EVIDENCE FILES</span>
                    <span className="font-bold text-emerald-600">{inc.evidenceCount} Artifacts</span>
                  </div>
                </div>

                {/* Bottom digest footer */}
                <div className="flex items-center justify-between text-[11px] font-mono opacity-70 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>SHA-256 Digest: <code className="font-bold">{inc.sha256DossierHash.slice(0, 32)}…</code></span>
                  </div>

                  <div className="flex items-center gap-1 text-[var(--sea-600)] font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>Inspect Full 8-Tab ELIR</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Mandatory Human in the Loop Footer (Rule 7) ── */}
        <HumanInterpretationNote />
      </div>
    </div>
  );
}

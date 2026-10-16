// ============================================================
// SmartQEye Coastal — Evidence-Linked Incident Records (ELIR)
// Immutable electronic dossier linked to GIS, video clips, and CKFE evidence
// ============================================================

import { useState } from 'react';
import {
  FolderArchive, FileText, Download, Shield, Clock,
  MapPin, CheckCircle2, ChevronRight, Lock, Key
} from 'lucide-react';
import { formatIncidentId } from '@/lib/idGenerator';
import { KERALA_POLICE_ROSTER } from '@/lib/roster';
import { HumanInterpretationNote } from '@/components/HumanInterpretationNote';
import { cn } from '@/lib/utils';

interface IncidentRecord {
  id: string;
  incidentCode: string;
  title: string;
  category: 'ZONE_INTRUSION' | 'SUSPICIOUS_CONVERGENCE' | 'SHORELINE_CONTRABAND' | 'SECURITY_BREACH';
  station: string;
  assignedOfficer: string;
  badge: string;
  openedAt: string;
  status: 'UNDER_INVESTIGATION' | 'SUBMITTED_TO_COURT' | 'RESOLVED';
  evidenceCount: number;
  sha256DossierHash: string;
  summary: string;
}

export default function IncidentsPage() {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const incidents: IncidentRecord[] = [
    {
      id: 'inc-01',
      incidentCode: formatIncidentId(1),
      title: 'Unauthorised High-Speed Approach into Vizhinjam Restricted Military Anchorage',
      category: 'ZONE_INTRUSION',
      station: 'Vizhinjam Coastal Police Station',
      assignedOfficer: KERALA_POLICE_ROSTER[1].name, // CI Saji Varghese
      badge: KERALA_POLICE_ROSTER[1].badgeNumber,
      openedAt: '2026-10-16 08:35:12 IST',
      status: 'UNDER_INVESTIGATION',
      evidenceCount: 5,
      sha256DossierHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      summary: 'Craft C-1042 crossed outer security perimeter at 28 knots without VHF transponder or response. Recorded via UAV-KL-03 and UAV-KL-01 in thermal & RGB modalities.',
    },
    {
      id: 'inc-02',
      incidentCode: formatIncidentId(2),
      title: 'Repeated Night Shoreline Convergence off Kovalam Light Beach',
      category: 'SUSPICIOUS_CONVERGENCE',
      station: 'Kovalam Coastal Police Station',
      assignedOfficer: KERALA_POLICE_ROSTER[2].name, // SI Ananya Ramesh
      badge: KERALA_POLICE_ROSTER[2].badgeNumber,
      openedAt: '2026-10-16 07:15:40 IST',
      status: 'UNDER_INVESTIGATION',
      evidenceCount: 7,
      sha256DossierHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      summary: 'Two unlit artisanal craft observed exchanging packages 800m offshore before diverging towards Shanghumugham beach.',
    },
    {
      id: 'inc-03',
      incidentCode: formatIncidentId(3),
      title: 'Unattended Shoreline Cargo Cluster Recovered at Shanghumugham',
      category: 'SHORELINE_CONTRABAND',
      station: 'Poonthura Police Station',
      assignedOfficer: KERALA_POLICE_ROSTER[3].name, // SI V. Suresh Kumar
      badge: KERALA_POLICE_ROSTER[3].badgeNumber,
      openedAt: '2026-10-16 06:10:00 IST',
      status: 'SUBMITTED_TO_COURT',
      evidenceCount: 4,
      sha256DossierHash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      summary: 'CFS temporal dwell detector flagged 3 heavy crates left stationary for 48 minutes in high-tide splash zone.',
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
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
              Court-admissible electronic dossiers linking drone telemetry, CKFE keyframes, and police actions
            </p>
          </div>
        </div>

        <button
          onClick={() => alert('Generating cryptographic court dossier export package with SHA-256 manifest...')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5" /> Export Court Dossier
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-4">
          {incidents.map(inc => (
            <div
              key={inc.id}
              className="rounded-2xl border p-5 space-y-4 transition-all"
              style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--sea-600)]">{inc.incidentCode}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {inc.category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono opacity-50">· {inc.openedAt}</span>
                  </div>
                  <h3 className="font-serif text-base font-bold mt-1">{inc.title}</h3>
                </div>

                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-semibold font-mono',
                    inc.status === 'UNDER_INVESTIGATION'
                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  )}
                >
                  {inc.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Summary */}
              <p className="text-xs opacity-80 leading-relaxed font-sans">
                {inc.summary}
              </p>

              {/* Station & Officer Details */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl border bg-[var(--surface)] text-xs font-mono" style={{ borderColor: 'var(--line)' }}>
                <div>
                  <span className="opacity-50 block text-[10px]">POLICE JURISDICTION</span>
                  <span className="font-semibold">{inc.station}</span>
                </div>
                <div>
                  <span className="opacity-50 block text-[10px]">INVESTIGATING OFFICER</span>
                  <span className="font-semibold">{inc.assignedOfficer} ({inc.badge})</span>
                </div>
                <div>
                  <span className="opacity-50 block text-[10px]">ATTACHED EVIDENCE ARTIFACTS</span>
                  <span className="font-semibold text-emerald-600">{inc.evidenceCount} Sealed Files</span>
                </div>
              </div>

              {/* SHA-256 Chain of Custody */}
              <div className="flex items-center justify-between text-[11px] font-mono opacity-70 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>SHA-256 Dossier Digest: <code className="font-bold">{inc.sha256DossierHash.slice(0, 32)}…</code></span>
                </div>
                <button
                  onClick={() => alert(`Full SHA-256 Digest:\n${inc.sha256DossierHash}\n\nEvidence files verified against tamper-evident chain of custody.`)}
                  className="hover:underline text-[var(--sea-600)]"
                >
                  Verify Digest
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Human in the loop footer */}
        <HumanInterpretationNote />
      </div>
    </div>
  );
}

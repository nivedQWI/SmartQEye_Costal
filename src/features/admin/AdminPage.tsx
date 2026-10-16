// ============================================================
// SmartQEye Coastal — Administration Console
// User & role management, RBAC, retention policies, and station assignments
// ============================================================

import { useState } from 'react';
import { Shield, Users, Key, Lock, CheckCircle2, UserCheck, Plus } from 'lucide-react';
import { KERALA_POLICE_ROSTER, KERALA_COASTAL_STATIONS } from '@/lib/roster';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

export default function AdminPage() {
  const [selectedTab, setSelectedTab] = useState<'USERS' | 'ROLES' | 'STATIONS' | 'SECURITY'>('USERS');

  const roles: { role: UserRole; label: string; desc: string; count: number }[] = [
    { role: 'OPERATOR', label: 'Tactical Drone Operator', desc: 'Real-time multi-feed surveillance, alert acknowledgement, manual target tracking', count: 8 },
    { role: 'ANALYST', label: 'Coastal Intelligence Analyst', desc: 'Forensic playback, pattern analysis, contact trajectory assessment, reports', count: 4 },
    { role: 'SUPERVISOR', label: 'Duty Officer / Station SHO', desc: 'Incident triage, officer assignment, patrol recommendation confirmation', count: 3 },
    { role: 'ZONE_ADMIN', label: 'Zone & Context Administrator', desc: 'Geofence definitions, restricted approach boundaries, temporal schedule rules', count: 2 },
    { role: 'SYS_ADMIN', label: 'System & Platform Administrator', desc: 'Hardware node management, service orchestration, network gateway controls', count: 2 },
    { role: 'MODEL_CUSTODIAN', label: 'AI Model Custodian (QWI)', desc: 'Model registry lifecycle, weights verification, candidate benchmarking', count: 2 },
    { role: 'AUDITOR', label: 'Police Cyber Division Auditor', desc: 'Read-only immutable audit trail review, court dossier compliance checks', count: 2 },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--surface)] text-[var(--sea-600)] border" style={{ borderColor: 'var(--line)' }}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold">Platform Administration &amp; Governance</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                RBAC ENFORCED
              </span>
            </div>
            <p className="text-xs opacity-60">
              Kerala Police personnel authorization, role matrices, coastal stations, and security policies
            </p>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center p-0.5 rounded-lg border text-xs font-medium" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          {(['USERS', 'ROLES', 'STATIONS', 'SECURITY'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={cn(
                'px-3 py-1 rounded-md transition-all text-xs font-mono',
                selectedTab === tab
                  ? 'bg-[var(--sea-600)] text-white shadow-xs font-bold'
                  : 'opacity-70 hover:opacity-100 hover:bg-[var(--surface-hover)]'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {selectedTab === 'USERS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-base font-bold">Authorised Police Personnel Roster</h2>
              <button
                onClick={() => alert('New officer enrollment requires Kerala Police SSO authorization token.')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Enrol Officer
              </button>
            </div>

            <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b text-[10px] font-mono uppercase opacity-60" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
                    <th className="py-3 px-4 font-bold">Officer Name</th>
                    <th className="py-3 px-4 font-bold">Designation &amp; Rank</th>
                    <th className="py-3 px-4 font-bold">Badge / PEN</th>
                    <th className="py-3 px-4 font-bold">Station / Division</th>
                    <th className="py-3 px-4 font-bold">Active Role</th>
                    <th className="py-3 px-4 font-bold">Clearance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {KERALA_POLICE_ROSTER.map(officer => (
                    <tr key={officer.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="py-3 px-4 font-semibold text-xs">
                        {officer.name}
                      </td>
                      <td className="py-3 px-4 opacity-75">
                        {officer.rank}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[var(--sea-600)]">
                        {officer.badgeNumber}
                      </td>
                      <td className="py-3 px-4">
                        {officer.stationName}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 font-bold">
                          {officer.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'ROLES' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map(r => (
              <div
                key={r.role}
                className="p-5 rounded-2xl border space-y-2"
                style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--sea-600)]">{r.role}</span>
                  <span className="text-xs font-mono opacity-60">{r.count} Assigned Officers</span>
                </div>
                <h3 className="font-serif text-base font-bold">{r.label}</h3>
                <p className="text-xs opacity-75 leading-relaxed font-sans">{r.desc}</p>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'STATIONS' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {KERALA_COASTAL_STATIONS.map(stn => (
              <div
                key={stn.id}
                className="p-5 rounded-2xl border space-y-2"
                style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--sea-600)]">{stn.id}</span>
                  <span className="text-[10px] font-mono opacity-50">{stn.district}</span>
                </div>
                <h3 className="font-serif text-sm font-bold">{stn.name}</h3>
                <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                  Jurisdiction: {stn.jurisdictionNm} NM ({stn.code})
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'SECURITY' && (
          <div className="p-5 rounded-2xl border space-y-4 max-w-2xl" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <h3 className="font-serif text-base font-bold">Platform Security &amp; Air-Gap Safeguards</h3>
            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between p-3 rounded-xl border bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
                <span>AIR-GAP ENFORCEMENT</span>
                <span className="text-emerald-600 font-bold">STRICT (Zero Outbound Egress)</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
                <span>SESSION IDLE TIMEOUT</span>
                <span className="font-bold">15 Minutes (Station Lock)</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
                <span>MANDATORY 2FA / SMARTCARD</span>
                <span className="text-emerald-600 font-bold">ENFORCED</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
                <span>EVIDENCE RETENTION PERIOD</span>
                <span className="font-bold">365 Days (Court Tamper-Evident)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

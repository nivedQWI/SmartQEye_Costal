// ============================================================
// SmartQEye Coastal — Cryptographic Audit Log
// Immutable ledger of all operator confirmations, tactical recommendations, and alert state transitions
// ============================================================

import { useState } from 'react';
import { ScrollText, Shield, Search, Lock, User, CheckCircle2, Download } from 'lucide-react';
import { KERALA_POLICE_ROSTER } from '@/lib/roster';
import { formatAlertId, minutesAgoIso } from '@/lib/idGenerator';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

interface AuditItem {
  id: string;
  timestamp: string;
  officerName: string;
  officerRole: UserRole;
  action: string;
  targetType: 'ALERT' | 'CONTACT' | 'MISSION' | 'ZONE' | 'SYSTEM';
  targetId: string;
  reason: string;
  ipAddress: string;
  hash: string;
}

export default function AuditLogPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const auditItems: AuditItem[] = [
    {
      id: 'aud-001',
      timestamp: minutesAgoIso(2),
      officerName: KERALA_POLICE_ROSTER[2].name, // SI Ananya Ramesh
      officerRole: 'OPERATOR',
      action: 'RECOMMENDED_PATROL_RESPONSE',
      targetType: 'ALERT',
      targetId: formatAlertId(1),
      reason: 'Vessel C-1042 crossed military security perimeter without AIS or answering VHF ch 16.',
      ipAddress: '10.200.4.15',
      hash: '3f5a8c9b2d1e0f4a6c8e9b1d3f5a7c9e0b2d4f6a8c1e3b5d7f9a1c3e5b7d9f1a',
    },
    {
      id: 'aud-002',
      timestamp: minutesAgoIso(10),
      officerName: KERALA_POLICE_ROSTER[1].name, // CI Saji Varghese
      officerRole: 'SUPERVISOR',
      action: 'ASSIGNED',
      targetType: 'ALERT',
      targetId: formatAlertId(4),
      reason: 'High-speed marine convergence offshore Vizhinjam assigned to Harbour patrol team.',
      ipAddress: '10.200.4.12',
      hash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    },
    {
      id: 'aud-003',
      timestamp: minutesAgoIso(18),
      officerName: KERALA_POLICE_ROSTER[0].name, // DySP K. R. Harikrishnan
      officerRole: 'SYS_ADMIN',
      action: 'ZONE_POLICY_UPDATED',
      targetType: 'ZONE',
      targetId: 'Z-07',
      reason: 'Adjusted military approach dwell threshold from 30s to 15s during high alert exercise.',
      ipAddress: '10.200.4.2',
      hash: '9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d',
    },
    {
      id: 'aud-004',
      timestamp: minutesAgoIso(42),
      officerName: KERALA_POLICE_ROSTER[2].name, // SI Ananya Ramesh
      officerRole: 'OPERATOR',
      action: 'ACKNOWLEDGED',
      targetType: 'ALERT',
      targetId: formatAlertId(2),
      reason: 'Standard review of repeated shoreline approach pattern at Kovalam.',
      ipAddress: '10.200.4.15',
      hash: '7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b',
    },
    {
      id: 'aud-005',
      timestamp: minutesAgoIso(65),
      officerName: KERALA_POLICE_ROSTER[5].name, // Inspector Rahul Menon
      officerRole: 'AUDITOR',
      action: 'DOSSIER_VERIFIED',
      targetType: 'MISSION',
      targetId: 'INC-20261016-0001',
      reason: 'Cryptographic SHA-256 seal verified against court submission ledger.',
      ipAddress: '10.200.4.30',
      hash: '4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a',
    },
  ];

  const filtered = auditItems.filter(item =>
    item.officerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.targetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--surface)] text-[var(--sea-600)] border" style={{ borderColor: 'var(--line)' }}>
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold">Cryptographic Audit Trail</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                APPEND-ONLY LEDGER
              </span>
            </div>
            <p className="text-xs opacity-60">
              Immutable log of operator actions, decision rationale, and security changes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              type="text"
              placeholder="Search officer, action, ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg border text-xs font-mono w-56 focus:outline-hidden"
              style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
            />
          </div>

          <button
            onClick={() => alert('Exporting signed audit package for Cyber Division inspection...')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-hover)] transition-colors"
            style={{ borderColor: 'var(--line)' }}
          >
            <Download className="w-3.5 h-3.5" /> Export Ledger
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b text-[10px] font-mono uppercase opacity-60" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
                <th className="py-3 px-4 font-bold">Timestamp (IST)</th>
                <th className="py-3 px-4 font-bold">Authorised Officer</th>
                <th className="py-3 px-4 font-bold">Action</th>
                <th className="py-3 px-4 font-bold">Target</th>
                <th className="py-3 px-4 font-bold">Mandatory Rationale</th>
                <th className="py-3 px-4 font-bold">SHA-256 Block Digest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] opacity-70 whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })} IST
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-xs">{entry.officerName}</div>
                    <div className="text-[10px] font-mono opacity-50">{entry.officerRole} · {entry.ipAddress}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                      {entry.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[var(--sea-600)]">
                    {entry.targetId}
                  </td>
                  <td className="py-3 px-4 text-xs font-sans max-w-xs">
                    {entry.reason}
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] opacity-60 whitespace-nowrap">
                    <code>{entry.hash.slice(0, 16)}…</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

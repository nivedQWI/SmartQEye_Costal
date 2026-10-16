// ============================================================
// SmartQEye Coastal — Cryptographic Audit Log
// Immutable SHA-256 Ledger of All Operator Actions, Status Transitions & Tactical Responses
// ============================================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ScrollText, Shield, Search, Lock, User, CheckCircle2,
  Download, RefreshCw, AlertTriangle, ShieldAlert,
  ChevronLeft, ChevronRight, Copy, Check, Filter
} from 'lucide-react';
import { auditApi, type AuditFilters } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { PermissionGate } from '@/components/PermissionGate';
import { formatISTFull, truncateSha, copyToClipboard } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { AuditEntry } from '@/types';

export default function AuditLogPage() {
  const { hasPermission } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedOutcome, setSelectedOutcome] = useState('ALL');
  const [selectedTargetType, setSelectedTargetType] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    total: number;
    checked: number;
  } | null>(null);

  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filters: AuditFilters = {
    search: searchTerm || undefined,
    userRole: selectedRole !== 'ALL' ? selectedRole : undefined,
    outcome: selectedOutcome !== 'ALL' ? selectedOutcome : undefined,
    targetType: selectedTargetType !== 'ALL' ? selectedTargetType : undefined,
    page,
    pageSize,
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => auditApi.list(filters),
  });

  async function handleVerifyChain() {
    setIsVerifying(true);
    try {
      const res = await auditApi.verifyChain();
      setVerificationResult({
        verified: res.valid,
        total: res.totalBlocks,
        checked: res.verifiedBlocks,
      });
    } catch {
      setVerificationResult({ verified: false, total: 0, checked: 0 });
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleExportCsv() {
    try {
      const csv = await auditApi.exportCsv(filters);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SMARTQEYE_AUDIT_LEDGER_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${String(err)}`);
    }
  }

  async function handleCopy(hash: string) {
    await copyToClipboard(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1500);
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* ── Top Header ── */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
        style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--surface)] text-[var(--sea-600)] border" style={{ borderColor: 'var(--line)' }}>
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold">Cryptographic Audit Ledger</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                HASH-CHAIN INTEGRITY
              </span>
            </div>
            <p className="text-xs opacity-60">
              Immutable SHA-256 block chain recording all operator actions, tactical responses, and administrative changes
            </p>
          </div>
        </div>

        {/* Chain verification button + CSV export */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isVerifying && 'animate-spin')} />
            <span>Verify Hash Chain</span>
          </button>

          <PermissionGate permission="EXPORT">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border hover:bg-[var(--surface-hover)] transition-colors"
              style={{ borderColor: 'var(--line)' }}
              title="Download filtered audit trail as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* ── Hash Chain Verification Banner ── */}
      {verificationResult && (
        <div
          className={cn(
            'flex items-center justify-between px-6 py-2.5 text-xs border-b flex-shrink-0 animate-in fade-in duration-150',
            verificationResult.verified
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
          )}
        >
          <div className="flex items-center gap-2 font-mono">
            {verificationResult.verified ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0" />
            )}
            <span className="font-bold">
              {verificationResult.verified
                ? `CRYPTOGRAPHIC CHAIN VERIFIED: ${verificationResult.checked} / ${verificationResult.total} blocks validated (Genesis to Head). Zero tampering detected.`
                : 'INTEGRITY ALERT: Block hash divergence detected in audit ledger.'}
            </span>
          </div>

          <button
            onClick={() => setVerificationResult(null)}
            className="text-[10px] uppercase font-mono opacity-60 hover:opacity-100 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div
        className="flex flex-wrap items-center justify-between px-6 py-3 border-b gap-3 flex-shrink-0"
        style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}
      >
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-[var(--panel)] min-w-[260px]" style={{ borderColor: 'var(--line)' }}>
          <Search className="w-3.5 h-3.5 opacity-40" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            placeholder="Search officer, action, target ID, summary…"
            className="bg-transparent text-xs outline-none w-full font-sans"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <select
            value={selectedRole}
            onChange={e => { setSelectedRole(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-xl border bg-[var(--panel)] outline-none"
            style={{ borderColor: 'var(--line)' }}
          >
            <option value="ALL">All Roles</option>
            <option value="OPERATOR">OPERATOR</option>
            <option value="ANALYST">ANALYST</option>
            <option value="SUPERVISOR">SUPERVISOR</option>
            <option value="ZONE_ADMIN">ZONE ADMIN</option>
            <option value="MODEL_CUSTODIAN">MODEL CUSTODIAN</option>
            <option value="AUDITOR">AUDITOR</option>
            <option value="SYS_ADMIN">SYS ADMIN</option>
          </select>

          <select
            value={selectedOutcome}
            onChange={e => { setSelectedOutcome(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-xl border bg-[var(--panel)] outline-none"
            style={{ borderColor: 'var(--line)' }}
          >
            <option value="ALL">All Outcomes</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FLAGGED">FLAGGED</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>

          <select
            value={selectedTargetType}
            onChange={e => { setSelectedTargetType(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-xl border bg-[var(--panel)] outline-none"
            style={{ borderColor: 'var(--line)' }}
          >
            <option value="ALL">All Targets</option>
            <option value="ALERT">ALERT</option>
            <option value="INCIDENT">INCIDENT</option>
            <option value="CONTACT">CONTACT</option>
            <option value="ZONE">ZONE</option>
            <option value="EVIDENCE">EVIDENCE</option>
            <option value="FEED">FEED</option>
            <option value="USER">USER</option>
            <option value="SYSTEM">SYSTEM</option>
          </select>
        </div>
      </div>

      {/* ── Table Area ── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 gap-3" style={{ color: 'var(--text-muted)' }}>
            <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            <span className="font-mono text-xs">Querying cryptographic audit blocks…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-2 opacity-50">
            <ScrollText className="w-8 h-8" />
            <span className="text-xs font-mono">No audit blocks match the selected filters.</span>
          </div>
        ) : (
          <div className="min-w-[900px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b text-[10px] font-mono uppercase opacity-60 sticky top-0 z-10" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
                  <th className="py-2.5 px-4 font-bold">Block ID &amp; Time (IST)</th>
                  <th className="py-2.5 px-4 font-bold">Officer / Role</th>
                  <th className="py-2.5 px-4 font-bold">Action &amp; Outcome</th>
                  <th className="py-2.5 px-4 font-bold">Target</th>
                  <th className="py-2.5 px-4 font-bold">IP &amp; Session</th>
                  <th className="py-2.5 px-4 font-bold">Summary</th>
                  <th className="py-2.5 px-4 font-bold">Block Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {items.map(entry => (
                  <tr key={entry.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    {/* ID & Time */}
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-[var(--sea-600)]">{entry.id}</div>
                      <div className="opacity-50 text-[10px]">{formatISTFull(entry.timestamp)}</div>
                    </td>

                    {/* Officer & Role */}
                    <td className="py-3 px-4">
                      <div className="font-semibold">{entry.userName}</div>
                      <div className="font-mono opacity-50 text-[10px]">{entry.userRole}</div>
                    </td>

                    {/* Action & Outcome */}
                    <td className="py-3 px-4 font-mono">
                      <div className="font-semibold text-xs">{entry.action.replace(/_/g, ' ')}</div>
                      <span
                        className={cn(
                          'inline-block px-1.5 py-0.2 rounded text-[9px] font-bold mt-0.5 border',
                          entry.outcome === 'BLOCKED'
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : entry.outcome === 'FLAGGED'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        )}
                      >
                        {entry.outcome || 'SUCCESS'}
                      </span>
                    </td>

                    {/* Target */}
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold">{entry.targetId}</div>
                      <div className="opacity-50 text-[10px]">{entry.targetType}</div>
                    </td>

                    {/* IP & Session */}
                    <td className="py-3 px-4 font-mono text-[11px] opacity-75">
                      <div>{entry.ipAddress || '10.200.4.15'}</div>
                      <div className="opacity-50 text-[10px]">{entry.sessionId || 'sess-live'}</div>
                    </td>

                    {/* Summary */}
                    <td className="py-3 px-4 max-w-xs font-sans text-xs opacity-85">
                      {entry.beforeAfterSummary || 'System event recorded.'}
                    </td>

                    {/* Hash */}
                    <td className="py-3 px-4 font-mono text-[10px]">
                      {entry.hash && (
                        <div
                          onClick={() => handleCopy(entry.hash!)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded border cursor-pointer hover:bg-[var(--surface-hover)] transition-colors w-fit"
                          style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}
                          title={`Block Hash: ${entry.hash}\nPrev Hash: ${entry.prevHash || 'GENESIS'}`}
                        >
                          <Lock className="w-2.5 h-2.5 text-emerald-500" />
                          <span>{truncateSha(entry.hash)}</span>
                          {copiedHash === entry.hash ? (
                            <Check className="w-2.5 h-2.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 opacity-40" />
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination Footer ── */}
      <div
        className="flex items-center justify-between px-6 py-3 border-t flex-shrink-0 text-xs font-mono"
        style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
      >
        <span className="opacity-60">
          Showing {items.length} of {total} chained blocks (Page {page} of {totalPages})
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg border hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-40"
            style={{ borderColor: 'var(--line)' }}
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-40"
            style={{ borderColor: 'var(--line)' }}
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

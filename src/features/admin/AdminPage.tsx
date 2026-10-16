// ============================================================
// SmartQEye Coastal — Platform Administration & Governance
// 6 Tabs: Users, Roles & Permissions, Data Retention, Backup & Recovery, Security Posture, Sessions
// ============================================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Shield, Users, Key, Lock, CheckCircle2, UserCheck, Plus,
  Database, RefreshCw, HardDrive, ShieldAlert, Laptop, Eye,
  Clock, AlertTriangle, ArrowRight, UserX, Check, X, ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { PERMISSION_LIST, ALL_ROLES, DEFAULT_ROLE_PERMISSIONS } from '@/lib/permissions';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { cn, formatISTFull } from '@/lib/utils';
import type { UserRole, Permission, AdminUser, DataRetentionPolicy, BackupDrillRecord, ActiveSession } from '@/types';

type AdminTab = 'USERS' | 'ROLES' | 'RETENTION' | 'BACKUP' | 'SECURITY' | 'SESSIONS';

export default function AdminPage() {
  const { user, devRole, viewAsRole, setViewAsRole, hasPermission, getEffectiveRole, setCustomPermissions } = useAuthStore();
  const effectiveRole = getEffectiveRole();
  const isSysAdmin = hasPermission('SYSTEM_ADMIN');

  const [selectedTab, setSelectedTab] = useState<AdminTab>('USERS');
  const [killSessionTarget, setKillSessionTarget] = useState<string | null>(null);

  // Queries
  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.listUsers(),
  });

  const { data: permissionsMatrix = DEFAULT_ROLE_PERMISSIONS, refetch: refetchMatrix } = useQuery<Record<UserRole, Permission[]>>({
    queryKey: ['admin-permissions-matrix'],
    queryFn: () => adminApi.getPermissionsMatrix(),
  });


  const { data: retentionPolicies = [], refetch: refetchRetention } = useQuery({
    queryKey: ['admin-retention-policies'],
    queryFn: () => adminApi.getDataRetentionPolicies(),
  });

  const { data: backupDrills = [], refetch: refetchDrills } = useQuery({
    queryKey: ['admin-backup-drills'],
    queryFn: () => adminApi.getBackupDrills(),
  });

  const { data: activeSessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ['admin-active-sessions'],
    queryFn: () => adminApi.getActiveSessions(),
  });

  // User Drawer State
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Matrix edit state
  const [matrixJustification, setMatrixJustification] = useState('');
  const [pendingMatrixChange, setPendingMatrixChange] = useState<{
    role: UserRole;
    permission: Permission;
    enabled: boolean;
  } | null>(null);

  // Storage projection mock data for 12 months
  const storageProjectionData = [
    { month: 'M1', withPruning: 2.1, withoutPruning: 4.2 },
    { month: 'M2', withPruning: 3.4, withoutPruning: 8.5 },
    { month: 'M3', withPruning: 4.6, withoutPruning: 12.8 },
    { month: 'M4', withPruning: 5.2, withoutPruning: 17.1 },
    { month: 'M5', withPruning: 5.9, withoutPruning: 21.4 },
    { month: 'M6', withPruning: 6.4, withoutPruning: 25.8 },
    { month: 'M7', withPruning: 6.8, withoutPruning: 30.2 },
    { month: 'M8', withPruning: 7.2, withoutPruning: 34.6 },
    { month: 'M9', withPruning: 7.5, withoutPruning: 39.0 },
    { month: 'M10', withPruning: 7.9, withoutPruning: 43.4 },
    { month: 'M11', withPruning: 8.1, withoutPruning: 47.8 },
    { month: 'M12', withPruning: 8.4, withoutPruning: 52.2 },
  ];

  async function handleTogglePermission(role: UserRole, permission: Permission) {
    if (!isSysAdmin) {
      alert('Access Restricted: Only SYSTEM_ADMIN can modify the RBAC permissions matrix.');
      return;
    }
    const currentList = permissionsMatrix[role] || [];
    const hasIt = currentList.includes(permission);
    setPendingMatrixChange({ role, permission, enabled: !hasIt });
  }

  async function handleConfirmMatrixChange() {
    if (!pendingMatrixChange || !matrixJustification.trim()) return;
    const { role, permission, enabled } = pendingMatrixChange;

    const currentList = permissionsMatrix[role] || [];
    const updatedList = enabled
      ? [...currentList, permission]
      : currentList.filter((p: Permission) => p !== permission);

    const newMatrix = {
      ...permissionsMatrix,
      [role]: updatedList,
    };

    try {
      await adminApi.updatePermissionsMatrix(
        newMatrix,
        matrixJustification,
        { id: user?.id || 'u-curr', name: user?.fullName || 'Current Admin' }
      );
      setCustomPermissions(newMatrix);
      setPendingMatrixChange(null);
      setMatrixJustification('');
      refetchMatrix();
    } catch (err) {
      alert(`Matrix update failed: ${String(err)}`);
    }
  }

  async function handleToggleLegalHold(policy: DataRetentionPolicy) {
    if (!isSysAdmin) {
      alert('Access Restricted: Only SYSTEM_ADMIN can modify legal hold status.');
      return;
    }
    try {
      await adminApi.toggleLegalHold(
        policy.id,
        !policy.isLegalHoldActive,
        { id: user?.id || 'u-curr', name: user?.fullName || 'Current Admin' }
      );
      refetchRetention();
    } catch (err) {
      alert(`Failed to update legal hold: ${String(err)}`);
    }
  }

  async function handleTriggerDrill() {
    try {
      await adminApi.triggerBackupDrill({
        id: user?.id || 'u-curr',
        name: user?.fullName || 'Current Admin',
      });
      refetchDrills();
    } catch (err) {
      alert(`Drill failed: ${String(err)}`);
    }
  }

  function handleKillSession(sessionId: string) {
    setKillSessionTarget(sessionId);
  }

  async function handleSaveUser() {
    if (!editingUser) return;
    try {
      await adminApi.updateUser(
        editingUser.id,
        editingUser,
        { id: user?.id || 'u-curr', name: user?.fullName || 'Current Admin' }
      );
      setEditingUser(null);
      refetchUsers();
    } catch (err) {
      alert(`Failed to update officer: ${String(err)}`);
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
              Kerala Police personnel authorization, 15x7 permissions matrix, data retention schedules, and security posture
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-0.5 rounded-lg border text-xs font-medium" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          {(['USERS', 'ROLES', 'RETENTION', 'BACKUP', 'SECURITY', 'SESSIONS'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={cn(
                'px-3 py-1 rounded-md transition-all text-xs font-mono cursor-pointer',
                selectedTab === tab
                  ? 'bg-[var(--sea-600)] text-white shadow-xs font-bold'
                  : 'opacity-70 hover:opacity-100 hover:bg-[var(--surface-hover)]'
              )}
            >
              {tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Tab Contents ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* TAB 1: USERS */}
        {selectedTab === 'USERS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-base font-bold">Authorised Police Personnel Roster</h2>
                <p className="text-xs opacity-60">Active police officer accounts, designations, stations, and MFA credentials</p>
              </div>
              <button
                onClick={() => alert('New officer enrollment requires Kerala Police SSO & Cyber Division cryptographic authorization.')}
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
                    <th className="py-3 px-4 font-bold">MFA Type</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {users.map(officer => (
                    <tr key={officer.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="py-3 px-4 font-semibold text-xs">{officer.fullName}</td>
                      <td className="py-3 px-4 opacity-75">{officer.rankTitle}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[var(--sea-600)]">{officer.badgeNumber}</td>
                      <td className="py-3 px-4 opacity-80">{officer.station}</td>
                      <td className="py-3 px-4 font-mono font-bold">{officer.role}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-emerald-600">{officer.mfaType}</td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-mono font-bold border',
                            officer.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          )}
                        >
                          {officer.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setEditingUser(officer)}
                          className="px-2.5 py-1 rounded-md text-xs font-semibold border hover:bg-[var(--surface-hover)] transition-colors"
                          style={{ borderColor: 'var(--line)' }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ROLES & PERMISSIONS MATRIX */}
        {selectedTab === 'ROLES' && (
          <div className="space-y-6">
            {/* View As Role Preview Switcher Bar */}
            <div className="rounded-2xl border p-4 space-y-3" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-sm font-bold flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[var(--sea-600)]" />
                    <span>&ldquo;View As Role&rdquo; Interactive Preview Switcher</span>
                  </h3>
                  <p className="text-xs opacity-60">
                    Switch active role preview dynamically to audit UI behavior, route guards, and action gating in real time
                  </p>
                </div>

                {viewAsRole && (
                  <button
                    onClick={() => setViewAsRole(null)}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors"
                  >
                    Reset to Base Role ({user?.role || devRole})
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {ALL_ROLES.map(r => (
                  <button
                    key={r}
                    onClick={() => setViewAsRole(viewAsRole === r ? null : r)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border cursor-pointer',
                      effectiveRole === r
                        ? 'bg-[var(--sea-600)] text-white border-[var(--sea-600)] shadow-xs'
                        : 'hover:bg-[var(--surface-hover)] border-[var(--line)] opacity-70'
                    )}
                  >
                    {r} {effectiveRole === r && '✓'}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix Grid */}
            <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold">15 Permissions &times; 7 Roles Matrix</h3>
                  <p className="text-xs opacity-60">
                    Editable only by SYS_ADMIN with mandatory justification reason written to the audit log
                  </p>
                </div>
                {!isSysAdmin && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    <Lock className="w-3 h-3" /> READ-ONLY (Requires SYS_ADMIN)
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b text-[10px] font-mono uppercase opacity-60" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
                      <th className="py-3 px-3 font-bold min-w-[200px]">Permission</th>
                      {ALL_ROLES.map(role => (
                        <th key={role} className="py-3 px-2 font-bold text-center">
                          <span className={cn(effectiveRole === role && 'text-[var(--sea-600)] font-black underline')}>
                            {role.replace(/_/g, '\n')}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {PERMISSION_LIST.map(p => (
                      <tr key={p.code} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-xs">{p.label}</div>
                          <div className="font-mono text-[10px] opacity-50">{p.code}</div>
                        </td>

                        {ALL_ROLES.map(role => {
                          const perms = permissionsMatrix[role] || [];
                          const granted = perms.includes(p.code);

                          return (
                            <td key={role} className="py-2.5 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={granted}
                                disabled={!isSysAdmin}
                                onChange={() => handleTogglePermission(role, p.code)}
                                className={cn(
                                  'w-4 h-4 rounded text-[var(--sea-600)] focus:ring-0',
                                  !isSysAdmin ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                )}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DATA RETENTION */}
        {selectedTab === 'RETENTION' && (
          <div className="space-y-6">
            {/* Storage projection chart */}
            <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div>
                <h3 className="font-serif text-base font-bold">Storage Growth Projection (12 Months)</h3>
                <p className="text-xs opacity-60">Comparison of controlled storage growth with automatic FIFO pruning versus unmanaged video retention</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={storageProjectionData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis unit=" TB" stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--panel)',
                        border: '1px solid var(--line)',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                    />
                    <Area type="monotone" dataKey="withoutPruning" name="Runaway Growth (No Pruning)" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="withPruning" name="Managed Storage (With Pruning)" stroke="#0e7490" fill="#0e7490" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Retention Policies Table */}
            <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <h3 className="font-serif text-base font-bold">Statutory Data Retention Policies</h3>

              <div className="divide-y divide-[var(--line)]">
                {retentionPolicies.map(pol => (
                  <div key={pol.id} className="py-3.5 flex items-center justify-between text-xs">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{pol.dataType}</span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--surface)] border" style={{ borderColor: 'var(--line)' }}>
                          {pol.retentionDays === 0 ? 'PERMANENT (7+ YRS)' : `${pol.retentionDays} DAYS`}
                        </span>
                        {pol.isLegalHoldActive && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            LEGAL HOLD ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] opacity-70 font-sans">{pol.description}</p>
                      <div className="text-[10px] font-mono opacity-50">Storage: {pol.storageLocation} · Schedule: {pol.purgeSchedule}</div>
                    </div>

                    {pol.legalHoldEligible && (
                      <button
                        onClick={() => handleToggleLegalHold(pol)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border cursor-pointer',
                          pol.isLegalHoldActive
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                            : 'hover:bg-[var(--surface-hover)] border-[var(--line)] opacity-80'
                        )}
                      >
                        {pol.isLegalHoldActive ? 'Release Hold' : 'Engage Hold'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BACKUP & RECOVERY */}
        {selectedTab === 'BACKUP' && (
          <div className="space-y-6">
            {/* RPO / RTO Target vs Actual */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border bg-[var(--panel)] space-y-1" style={{ borderColor: 'var(--line)' }}>
                <span className="text-[10px] font-mono uppercase opacity-50 block">RECOVERY POINT OBJECTIVE (RPO)</span>
                <div className="text-2xl font-serif font-bold text-emerald-600">3.6 min</div>
                <span className="text-xs opacity-60 font-mono">Target: &lt; 15.0 min (PASSED)</span>
              </div>
              <div className="p-4 rounded-2xl border bg-[var(--panel)] space-y-1" style={{ borderColor: 'var(--line)' }}>
                <span className="text-[10px] font-mono uppercase opacity-50 block">RECOVERY TIME OBJECTIVE (RTO)</span>
                <div className="text-2xl font-serif font-bold text-emerald-600">19.4 min</div>
                <span className="text-xs opacity-60 font-mono">Target: &lt; 60.0 min (PASSED)</span>
              </div>
              <div className="p-4 rounded-2xl border bg-[var(--panel)] space-y-1" style={{ borderColor: 'var(--line)' }}>
                <span className="text-[10px] font-mono uppercase opacity-50 block">OFFSITE DISASTER MIRROR</span>
                <div className="text-base font-serif font-bold text-[var(--sea-600)]">KSDC-Kochi</div>
                <span className="text-xs opacity-60 font-mono">Optical Air-Gap Unidirectional Ring</span>
              </div>
            </div>

            {/* Drill History Table */}
            <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold">Disaster Recovery Restore Drills</h3>
                  <p className="text-xs opacity-60">Simulated database and evidence restore audits per Kerala Police security guidelines</p>
                </div>
                <button
                  onClick={handleTriggerDrill}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Execute Live Drill
                </button>
              </div>

              <div className="divide-y divide-[var(--line)]">
                {backupDrills.map(drill => (
                  <div key={drill.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{drill.target}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {drill.status}
                        </span>
                      </div>
                      <div className="text-[11px] opacity-75 font-sans mt-0.5">{drill.notes}</div>
                      <div className="text-[10px] font-mono opacity-50 mt-0.5">
                        {drill.drillDate} · Destination: {drill.destinationMirror} · Verified by: {drill.verifiedBy}
                      </div>
                    </div>

                    <div className="text-right font-mono text-[11px]">
                      <div>RPO: <strong className="text-emerald-600">{drill.rpoMinutesActual}m</strong> / {drill.rpoMinutesTarget}m</div>
                      <div>RTO: <strong className="text-emerald-600">{drill.rtoMinutesActual}m</strong> / {drill.rtoMinutesTarget}m</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SECURITY POSTURE */}
        {selectedTab === 'SECURITY' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border bg-[var(--panel)] space-y-2" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs font-mono">
                  <ShieldCheck className="w-4 h-4" />
                  <span>TLS 1.3 STRICT TRANSPORT SECURITY</span>
                </div>
                <p className="text-xs opacity-75 leading-relaxed font-sans">
                  All REST API endpoints and WebRTC/WSS video streams strictly mandate TLS 1.3 with AES-256-GCM cipher suites. Non-TLS traffic is dropped at the ingress firewall.
                </p>
              </div>

              <div className="p-5 rounded-2xl border bg-[var(--panel)] space-y-2" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs font-mono">
                  <Clock className="w-4 h-4" />
                  <span>15-MINUTE WORKSTATION IDLE TIMEOUT</span>
                </div>
                <p className="text-xs opacity-75 leading-relaxed font-sans">
                  Workstation inactivity warning triggers at 14 minutes with a 60-second visual countdown. Unattended consoles are securely terminated per Kerala Police station rules.
                </p>
              </div>

              <div className="p-5 rounded-2xl border bg-[var(--panel)] space-y-2" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs font-mono">
                  <Key className="w-4 h-4" />
                  <span>MFA ENFORCEMENT (TOTP / FIDO2)</span>
                </div>
                <p className="text-xs opacity-75 leading-relaxed font-sans">
                  All officer roles require two-factor authentication via hardware security keys or authenticator apps before accessing video feeds or incident dossiers.
                </p>
              </div>

              <div className="p-5 rounded-2xl border bg-[var(--panel)] space-y-2" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs font-mono">
                  <Lock className="w-4 h-4" />
                  <span>AIR-GAPPED READY ARCHITECTURE</span>
                </div>
                <p className="text-xs opacity-75 leading-relaxed font-sans">
                  Zero external CDN dependencies. All neural models, fonts, assets, and libraries run locally on-premises on the Central GPU node.
                </p>
              </div>
            </div>

            {/* Compliance Frameworks */}
            <div className="p-5 rounded-2xl border bg-[var(--panel)] space-y-3" style={{ borderColor: 'var(--line)' }}>
              <h3 className="font-serif text-sm font-bold">Statutory &amp; Regulatory Compliance Certifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl border bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
                  <span className="font-bold text-[var(--sea-600)] block">CERT-In Directives 2022</span>
                  <span className="text-[10px] opacity-60">Immutable 180-day audit log retention &amp; NTP sync</span>
                </div>
                <div className="p-3 rounded-xl border bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
                  <span className="font-bold text-[var(--sea-600)] block">DPDP Act 2023</span>
                  <span className="text-[10px] opacity-60">Restricted facial re-ID access &amp; purpose limitation</span>
                </div>
                <div className="p-3 rounded-xl border bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
                  <span className="font-bold text-[var(--sea-600)] block">Sec 63 BNSS (2023)</span>
                  <span className="text-[10px] opacity-60">Cryptographic hash chain electronic court admissibility</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SESSIONS & DEVICES */}
        {selectedTab === 'SESSIONS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-base font-bold">Active Station Workstation Sessions</h2>
                <p className="text-xs opacity-60">Active authenticated sessions across Kerala Coastal Police stations</p>
              </div>
              <button
                onClick={() => refetchSessions()}
                className="p-1.5 rounded-lg border hover:bg-[var(--surface-hover)] transition-colors opacity-70 hover:opacity-100"
                style={{ borderColor: 'var(--line)' }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b text-[10px] font-mono uppercase opacity-60" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
                    <th className="py-3 px-4 font-bold">Officer &amp; Role</th>
                    <th className="py-3 px-4 font-bold">Station / Location</th>
                    <th className="py-3 px-4 font-bold">Client IP Address</th>
                    <th className="py-3 px-4 font-bold">Browser / Terminal</th>
                    <th className="py-3 px-4 font-bold">Session Established</th>
                    <th className="py-3 px-4 font-bold">Active Route</th>
                    <th className="py-3 px-4 font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {activeSessions.map(sess => (
                    <tr key={sess.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold">{sess.userName}</div>
                        <div className="font-mono opacity-50 text-[10px]">{sess.role}</div>
                      </td>
                      <td className="py-3 px-4 opacity-80">{sess.station}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[var(--sea-600)]">{sess.ipAddress}</td>
                      <td className="py-3 px-4 text-xs opacity-75">{sess.browser}</td>
                      <td className="py-3 px-4 font-mono text-[11px] opacity-60">{formatISTFull(sess.loginAt)}</td>
                      <td className="py-3 px-4 font-mono text-xs">{sess.currentRoute}</td>
                      <td className="py-3 px-4">
                        {sess.isCurrentSession ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 font-bold">
                            CURRENT
                          </span>
                        ) : (
                          <button
                            onClick={() => handleKillSession(sess.id)}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold text-rose-600 border border-rose-500/30 hover:bg-rose-500/10 transition-colors"
                          >
                            Remote Kill
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── User Edit Drawer Modal ── */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-lg shadow-2xl border space-y-4 bg-[var(--raised)] text-[var(--text)]" style={{ borderColor: 'var(--line)' }}>
            <h3 className="font-serif text-lg font-bold">Manage Officer Account</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text)' }}>Full Name</label>
                <input
                  type="text"
                  value={editingUser.fullName}
                  onChange={e => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-[var(--surface)] text-[var(--text)] outline-none"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text)' }}>Rank / Designation</label>
                  <input
                    type="text"
                    value={editingUser.rankTitle}
                    onChange={e => setEditingUser({ ...editingUser, rankTitle: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-[var(--surface)] text-[var(--text)] outline-none"
                    style={{ borderColor: 'var(--line)' }}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text)' }}>Badge Number</label>
                  <input
                    type="text"
                    value={editingUser.badgeNumber}
                    onChange={e => setEditingUser({ ...editingUser, badgeNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-[var(--surface)] text-[var(--text)] outline-none font-mono"
                    style={{ borderColor: 'var(--line)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text)' }}>Active Role</label>
                  <select
                    value={editingUser.role}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full p-2.5 rounded-xl border bg-[var(--surface)] text-[var(--text)] outline-none font-mono"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    {ALL_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text)' }}>Account Status</label>
                  <select
                    value={editingUser.status}
                    onChange={e => setEditingUser({ ...editingUser, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border bg-[var(--surface)] text-[var(--text)] outline-none font-mono"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="LOCKED">LOCKED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text)' }}>Station Jurisdiction</label>
                <input
                  type="text"
                  value={editingUser.station}
                  onChange={e => setEditingUser({ ...editingUser, station: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-[var(--surface)] text-[var(--text)] outline-none"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl text-xs border hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                style={{ borderColor: 'var(--line)', color: 'var(--text)', background: 'var(--surface)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Matrix Justification Modal ── */}
      {pendingMatrixChange && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl border space-y-4 bg-[var(--raised)] text-[var(--text)]" style={{ borderColor: 'var(--line)' }}>
            <h3 className="font-serif text-lg font-bold">Modify Permissions Matrix</h3>
            <p className="text-xs opacity-70">
              {pendingMatrixChange.enabled ? 'Granting' : 'Revoking'} <strong className="font-mono text-[var(--sea-600)] dark:text-[var(--sea-accent)]">{pendingMatrixChange.permission}</strong> for role <strong className="font-mono">{pendingMatrixChange.role}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>Administrative Justification <span className="text-red-500">*</span></label>
              <textarea
                value={matrixJustification}
                onChange={e => setMatrixJustification(e.target.value)}
                placeholder="State security policy or operational rationale (recorded in audit log)…"
                className="w-full p-3 rounded-xl border text-xs outline-none focus:ring-2 resize-none"
                style={{ background: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--text)' }}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setPendingMatrixChange(null); setMatrixJustification(''); }}
                className="px-4 py-2 rounded-xl text-xs border hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                style={{ borderColor: 'var(--line)', color: 'var(--text)', background: 'var(--surface)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMatrixChange}
                disabled={!matrixJustification.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors disabled:opacity-40 cursor-pointer"
              >
                Confirm &amp; Write Audit Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forcible Session Termination Audited Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(killSessionTarget)}
        onOpenChange={(open) => !open && setKillSessionTarget(null)}
        title="Forcibly Terminate Active Station Session"
        description="Terminating this session will immediately revoke the workstation bearer token and disconnect the remote terminal. An operational reason must be supplied for Kerala Police audit compliance."
        confirmLabel="Forcibly Kill Session"
        variant="danger"
        requireReason={true}
        reasonPlaceholder="Mandatory operational justification (e.g. unauthorized terminal relocation, unverified session anomaly)..."
        auditActionName="KILL_SESSION"
        targetType="SESSION"
        targetId={killSessionTarget || ''}
        onConfirm={async (_reason) => {
          if (killSessionTarget) {
            await adminApi.killSession(killSessionTarget, {
              id: user?.id || 'u-curr',
              name: user?.fullName || 'Current Admin',
            });
            refetchSessions();
            setKillSessionTarget(null);
          }
        }}
      />
    </div>
  );
}

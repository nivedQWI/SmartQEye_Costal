// ============================================================
// SmartQEye Coastal — Route Permission Guard (403 Forbidden)
// ============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import type { Permission } from '@/types';
import { PERMISSION_LIST } from '@/lib/permissions';

interface RequirePermissionProps {
  permission: Permission;
  children: React.ReactNode;
}

export function RequirePermission({ permission, children }: RequirePermissionProps) {
  const navigate = useNavigate();
  const { hasPermission, getEffectiveRole, user } = useAuthStore();

  const allowed = hasPermission(permission);

  if (allowed) {
    return <>{children}</>;
  }

  const effectiveRole = getEffectiveRole();
  const meta = PERMISSION_LIST.find(p => p.code === permission);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-5" style={{ background: 'var(--bg)' }}>
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
        <ShieldAlert className="w-12 h-12" />
      </div>

      <div className="max-w-md space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <Lock className="w-3 h-3" /> 403 ACCESS RESTRICTED
        </div>
        <h1 className="font-serif text-xl font-bold">Authorisation Required</h1>
        <p className="text-xs opacity-70 leading-relaxed font-sans">
          Your active role (<strong className="font-mono text-[var(--sea-600)]">{effectiveRole}</strong>) does not have authorization to access this operational module.
        </p>
      </div>

      <div className="p-4 rounded-xl border bg-[var(--panel)] text-left text-xs font-mono max-w-md w-full space-y-1.5" style={{ borderColor: 'var(--line)' }}>
        <div className="flex justify-between">
          <span className="opacity-50">REQUIRED PERMISSION:</span>
          <span className="font-bold text-amber-600">{permission}</span>
        </div>
        {meta && (
          <div className="text-[11px] opacity-75 font-sans">
            {meta.description}
          </div>
        )}
        <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
          <span className="opacity-50">LOGGED-IN OFFICER:</span>
          <span className="font-semibold">{user?.fullName || 'Current Officer'} ({user?.rankTitle || 'Operator'})</span>
        </div>
      </div>

      <p className="text-[11px] font-mono opacity-50 max-w-sm">
        All unauthorized access attempts are cryptographically recorded in the platform audit ledger per Kerala Police Cyber Division regulations.
      </p>

      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Operations Dashboard
      </button>
    </div>
  );
}

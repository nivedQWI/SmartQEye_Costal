// ============================================================
// SmartQEye Coastal — OptionalModuleBanner Shared Component
// Rule 9 Compliance: Biometric / Person Re-ID / ANPR Governance
// ============================================================

import React from 'react';
import { ShieldAlert, Lock, AlertTriangle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';

export interface OptionalModuleBannerProps {
  moduleName: string;
  legalNotice?: string;
  className?: string;
}

export function OptionalModuleBanner({
  moduleName,
  legalNotice = 'Statutory Authorization Required (Rule 9): Person Re-ID and Plate Watchlists are outside baseline RFP core. Restricted to SUPERVISOR / SYS_ADMIN roles with stated purpose.',
  className,
}: OptionalModuleBannerProps) {
  const { user } = useAuthStore();
  const isAuthorized = user?.role === 'SUPERVISOR' || user?.role === 'SYS_ADMIN';

  return (
    <div
      role="alert"
      className={cn(
        'p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs leading-relaxed',
        isAuthorized
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
          : 'bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-200',
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <ShieldAlert className={cn('w-4 h-4 flex-shrink-0 mt-0.5', isAuthorized ? 'text-amber-600' : 'text-red-600')} />
        <div>
          <div className="font-bold flex items-center gap-1.5">
            <span>{moduleName} — Optional Module</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-black/10 border border-current">
              AUDITED ACCESS
            </span>
          </div>
          <p className="text-[11px] opacity-85 mt-0.5">{legalNotice}</p>
        </div>
      </div>

      <div className="text-right flex-shrink-0 hidden sm:block font-mono text-[10px]">
        <span className={cn('font-bold', isAuthorized ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400')}>
          {isAuthorized ? 'AUTHORIZED ACCESS' : 'RESTRICTED PRIVILEGE'}
        </span>
        <div className="opacity-60">All queries logged to ledger</div>
      </div>
    </div>
  );
}

// ============================================================
// SmartQEye Coastal — LicenceBadge Shared Component
// Rule 5 Compliance: License-Conscious AI Framework Badging
// ============================================================

import React from 'react';
import { ShieldCheck, Lock, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LicenceBadgeProps {
  licence: string;
  size?: 'sm' | 'md';
  className?: string;
  showTooltip?: boolean;
}

export function LicenceBadge({
  licence,
  size = 'md',
  className,
  showTooltip = true,
}: LicenceBadgeProps) {
  const norm = licence.toUpperCase();

  let variant: 'permissive' | 'mit' | 'proprietary' | 'tbc' = 'permissive';
  let description = 'Permissive open-source license approved for government deployment.';

  if (norm.includes('MIT')) {
    variant = 'mit';
    description = 'MIT License — fully permissive, commercial & government deployment approved.';
  } else if (norm.includes('APACHE')) {
    variant = 'permissive';
    description = 'Apache-2.0 License — permissive open source with explicit patent grant.';
  } else if (norm.includes('PROPRIETARY') || norm.includes('QWI')) {
    variant = 'proprietary';
    description = 'Proprietary Quantumweave Intelligence IP developed for Kerala Police.';
  } else {
    variant = 'tbc';
    description = 'Permissive licence to be verified on deployment baseline.';
  }

  const styles = {
    permissive: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
    mit: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    proprietary: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
    tbc: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  }[variant];

  const sizeClasses = {
    sm: 'px-1.5 py-0.2 text-[9px] gap-1',
    md: 'px-2 py-0.5 text-[10px] gap-1.5',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center font-mono font-bold rounded-md border leading-tight select-none',
        sizeClasses,
        styles,
        className
      )}
      title={showTooltip ? description : undefined}
    >
      {variant === 'proprietary' ? (
        <Lock className="w-3 h-3 flex-shrink-0" />
      ) : (
        <ShieldCheck className="w-3 h-3 flex-shrink-0" />
      )}
      <span>{licence}</span>
    </span>
  );
}

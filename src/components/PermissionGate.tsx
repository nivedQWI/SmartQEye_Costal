// ============================================================
// SmartQEye Coastal — PermissionGate Component
// Disables action buttons with tooltip when permission is missing
// ============================================================

import React from 'react';
import { useAuthStore } from '@/lib/store';
import type { Permission } from '@/types';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

interface PermissionGateProps {
  permission: Permission;
  children: React.ReactElement<{
    disabled?: boolean;
    className?: string;
    title?: string;
    onClick?: React.MouseEventHandler;
  }>;
  fallbackMessage?: string;
  hideIfDenied?: boolean;
}

export function PermissionGate({
  permission,
  children,
  fallbackMessage,
  hideIfDenied = false,
}: PermissionGateProps) {
  const { hasPermission, getEffectiveRole } = useAuthStore();
  const allowed = hasPermission(permission);

  if (allowed) {
    return children;
  }

  if (hideIfDenied) {
    return null;
  }

  const effectiveRole = getEffectiveRole();
  const title =
    fallbackMessage ||
    `Requires permission [${permission}]. Current active role: [${effectiveRole}]. Contact Platform Administrator.`;

  return React.cloneElement(children, {
    disabled: true,
    title,
    className: cn(
      children.props.className,
      'opacity-40 cursor-not-allowed pointer-events-auto filter grayscale'
    ),
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      alert(`Access Restricted:\n${title}`);
    },
  });
}

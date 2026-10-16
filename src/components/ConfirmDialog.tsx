// ============================================================
// SmartQEye Coastal — ConfirmDialog Shared Component
// Phase 7B & 7C: Mandatory Reason Capture & Audit Logging
// Built on @radix-ui/react-alert-dialog
// ============================================================

import React, { useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertTriangle, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { auditApi } from '@/lib/api';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  requireReason?: boolean;
  reasonPlaceholder?: string;
  minReasonLength?: number;
  auditActionName?: string;
  targetId?: string;
  targetType?: string;
  onConfirm: (reason: string) => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'warning',
  requireReason = true,
  reasonPlaceholder = 'State operational justification (required for Section 65B audit)...',
  minReasonLength = 5,
  auditActionName,
  targetId = 'SYSTEM',
  targetType = 'ACTION',
  onConfirm,
}: ConfirmDialogProps) {
  const { user } = useAuthStore();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOfficer, setConfirmedOfficer] = useState(false);

  const isReasonValid = !requireReason || reason.trim().length >= minReasonLength;
  const canSubmit = isReasonValid && (!requireReason || confirmedOfficer);

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onConfirm(reason);

      if (auditActionName) {
        await auditApi.append({
          userId: user?.username || 'officer',
          userName: user?.fullName || 'Kerala Police Officer',
          userRole: user?.role || 'OPERATOR',
          action: auditActionName,
          targetType,
          targetId,
          outcome: 'SUCCESS',
          beforeAfterSummary: `Officer confirmed action: "${title}". Reason: "${reason}".`,
        });
      }

      onOpenChange(false);
      setReason('');
      setConfirmedOfficer(false);
    } catch (err) {
      console.error('Confirmation action failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const variantStyles = {
    danger: {
      icon: <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />,
      button: 'bg-red-600 hover:bg-red-700 text-white',
      accentBg: 'bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-300',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
      accentBg: 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300',
    },
    primary: {
      icon: <CheckCircle2 className="w-5 h-5 text-[var(--sea-600)]" />,
      button: 'bg-[var(--sea-600)] hover:opacity-90 text-white',
      accentBg: 'bg-[var(--sea-600)]/10 border-[var(--sea-600)]/20 text-[var(--sea-600)]',
    },
  }[variant];

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity" />
        <AlertDialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-[var(--raised)] text-[var(--text)] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          style={{ borderColor: 'var(--line)' }}
        >
          <div className="flex items-start gap-3">
            <div className={cn('p-2.5 rounded-xl border flex-shrink-0', variantStyles.accentBg)}>
              {variantStyles.icon}
            </div>
            <div>
              <AlertDialog.Title className="text-base font-bold font-serif leading-tight">
                {title}
              </AlertDialog.Title>
              <AlertDialog.Description className="text-xs opacity-70 mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {description}
              </AlertDialog.Description>
            </div>
          </div>

          {/* Reason Capture Input */}
          {requireReason && (
            <div className="space-y-2 pt-1 text-xs">
              <label className="block font-semibold opacity-80 flex items-center justify-between" style={{ color: 'var(--text)' }}>
                <span>Operational Justification</span>
                <span className="text-[10px] font-mono opacity-50">Min {minReasonLength} chars</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] text-[var(--text)] text-xs outline-none focus:ring-1 focus:ring-[var(--sea-600)] transition-all"
                style={{ borderColor: 'var(--line)' }}
              />

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="officerConfirm"
                  checked={confirmedOfficer}
                  onChange={e => setConfirmedOfficer(e.target.checked)}
                  className="rounded mt-0.5"
                />
                <label htmlFor="officerConfirm" className="text-[11px] opacity-80 cursor-pointer select-none">
                  I confirm this action complies with Kerala Police coastal surveillance standard operating procedures.
                </label>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
            <AlertDialog.Cancel asChild>
              <button
                disabled={isSubmitting}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border hover:bg-[var(--surface)] transition-colors cursor-pointer"
                style={{ borderColor: 'var(--line)' }}
              >
                {cancelLabel}
              </button>
            </AlertDialog.Cancel>

            <button
              onClick={handleConfirm}
              disabled={!canSubmit || isSubmitting}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed',
                variantStyles.button
              )}
            >
              {isSubmitting ? 'Recording Action...' : confirmLabel}
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

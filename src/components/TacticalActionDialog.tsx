// ============================================================
// SmartQEye Coastal — Tactical Action Confirmation Dialog
// Implements mandatory reason requirement and writes audit log entries
// for "Recommend patrol response" and "Notify duty officer" (Rule 7)
// ============================================================

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ShieldAlert, AlertTriangle, X, Check, Anchor, BellRing } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import type { AuditEntry } from '@/types';

export type TacticalActionType = 'RECOMMEND_PATROL_RESPONSE' | 'NOTIFY_DUTY_OFFICER';

interface TacticalActionDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  actionType: TacticalActionType | null;
  targetId: string;
  targetCode?: string;
  targetType?: string;
  onClose?: () => void;
  onConfirm?: (auditEntry: AuditEntry) => void;
}

export function TacticalActionDialog({
  open,
  onOpenChange,
  actionType,
  targetId,
  targetCode,
  targetType,
  onClose,
  onConfirm,
}: TacticalActionDialogProps) {
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'STANDARD' | 'URGENT'>('STANDARD');
  const { user, devRole } = useAuthStore();

  const isOpen = open !== undefined ? open : !!actionType;
  if (!isOpen || !actionType) return null;

  const isPatrol = actionType === 'RECOMMEND_PATROL_RESPONSE';
  const title = isPatrol ? 'Recommend Patrol Response' : 'Notify Duty Officer';
  const actionLabel = isPatrol ? 'Submit Patrol Recommendation' : 'Send Duty Officer Notification';
  const displayCode = targetCode || targetId;

  function handleClose() {
    setReason('');
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  }

  function handleConfirm() {
    if (!reason.trim() || !actionType) return;

    const entry: AuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user?.id ?? 'usr-local',
      userName: user?.fullName ?? 'Kerala Police Officer',
      userRole: devRole,
      action: actionType,
      targetType: (targetType as any) ?? 'ALERT',
      targetId,
      detail: {
        targetCode: displayCode,
        reason: reason.trim(),
        priority,
        legalNotice: 'Observed behaviour only. Operational action rests with authorised Kerala Police personnel.',
      },
    };

    if (onConfirm) onConfirm(entry);
    handleClose();
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-2xl p-6 shadow-2xl z-50 animate-in zoom-in-95 border"
          style={{ background: 'var(--raised)', borderColor: 'var(--line)', color: 'var(--text)' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: isPatrol ? 'rgba(43, 127, 166, 0.15)' : 'rgba(235, 114, 53, 0.15)',
                  color: isPatrol ? 'var(--sea-600)' : 'var(--sev-high)',
                }}
              >
                {isPatrol ? <Anchor className="w-5 h-5" /> : <BellRing className="w-5 h-5" />}
              </div>
              <div>
                <Dialog.Title className="font-serif text-base font-bold">
                  {title}
                </Dialog.Title>
                <Dialog.Description className="text-xs opacity-60 font-mono">
                  Target: {targetCode} · Station Log Entry
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors opacity-70 hover:opacity-100"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Legal Decision-Support Notice */}
          <div className="my-4 p-3 rounded-xl border bg-amber-500/10 border-amber-500/30 text-xs font-medium text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
            <span>
              <strong>Rule 7 Decision Support:</strong> AI models provide behavioral recommendations only. Patrol dispatch or field interception rests solely upon authorized Kerala Police command verification.
            </span>
          </div>

          {/* Form */}
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-medium mb-1.5 text-[var(--text-muted)]">
                Operational Justification / Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="State observed contact dynamics, zone breach context, or supervisory directive..."
                className="w-full rounded-xl p-3 text-xs border resize-none outline-none focus:ring-2 focus:ring-[var(--sea-600)]"
                style={{
                  background: 'var(--panel)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                  minHeight: '80px',
                }}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1 text-[var(--text-muted)]">Response Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as 'STANDARD' | 'URGENT')}
                  className="w-full rounded-lg px-2.5 py-1.5 border bg-[var(--panel)] text-xs font-mono outline-none"
                  style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                >
                  <option value="STANDARD">STANDARD DISPATCH</option>
                  <option value="URGENT">URGENT INTERCEPT</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1 text-[var(--text-muted)]">Authorising Officer</label>
                <input
                  type="text"
                  disabled
                  value={`${user?.fullName ?? 'Duty Officer'} (${devRole})`}
                  className="w-full rounded-lg px-2.5 py-1.5 border bg-[var(--panel)] text-xs font-mono opacity-70 outline-none"
                  style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-5 border-t mt-5" style={{ borderColor: 'var(--line)' }}>
            <button
              onClick={handleConfirm}
              disabled={!reason.trim()}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 text-white"
              style={{ background: isPatrol ? 'var(--sea-600)' : 'var(--sev-high)' }}
            >
              <Check className="w-4 h-4" />
              {actionLabel}
            </button>
            <Dialog.Close asChild>
              <button
                className="px-4 py-2.5 rounded-xl text-xs font-medium border transition-colors hover:bg-[var(--surface-hover)]"
                style={{ borderColor: 'var(--line)' }}
              >
                Cancel
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default TacticalActionDialog;

// ============================================================
// SmartQEye Coastal — Toast Notification System
// Phase 7B Shared Component Library
// Accessible, Auto-dismiss, Stacked Alerts with Severity Glyph
// ============================================================

import React, { useEffect } from 'react';
import { create } from 'zustand';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { ...toast, id };
    set(state => ({ toasts: [...state.toasts, newToast] }));
    return id;
  },
  removeToast: (id) =>
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
}));

// Quick helper
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'success', title, message }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'warning', title, message }),
  error: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'error', title, message }),
  info: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'info', title, message }),
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-12 left-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, toast.durationMs || 5000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const typeConfig = {
    success: {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      border: 'border-emerald-500/40 bg-[var(--panel)] text-emerald-900 dark:text-emerald-100',
    },
    warning: {
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      border: 'border-amber-500/40 bg-[var(--panel)] text-amber-900 dark:text-amber-100',
    },
    error: {
      icon: <XCircle className="w-4 h-4 text-red-500" />,
      border: 'border-red-500/40 bg-[var(--panel)] text-red-900 dark:text-red-100',
    },
    info: {
      icon: <Info className="w-4 h-4 text-[var(--sea-600)]" />,
      border: 'border-[var(--sea-600)]/40 bg-[var(--panel)] text-[var(--text)]',
    },
  }[toast.type];

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl animate-in slide-in-from-left-4 fade-in duration-200',
        typeConfig.border
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{typeConfig.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold leading-tight">{toast.title}</div>
        {toast.message && (
          <div className="text-[11px] opacity-75 mt-0.5 leading-relaxed">{toast.message}</div>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="opacity-50 hover:opacity-100 p-0.5 rounded cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

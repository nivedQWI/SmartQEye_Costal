// ============================================================
// SmartQEye Coastal — EmptyState & ErrorState Shared Components
// Phase 7B Shared Component Library
// ============================================================

import React from 'react';
import { Inbox, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title = 'No items found',
  description = 'There are no records matching your current filter criteria.',
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center space-y-3', className)}>
      <div className="p-3 rounded-2xl bg-[var(--surface)] text-[var(--text-muted)] border" style={{ borderColor: 'var(--line)' }}>
        <Icon className="w-6 h-6 opacity-60" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-bold font-serif">{title}</h4>
        <p className="text-xs opacity-70 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--sea-600)] text-white hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Failed to load records',
  message = 'An unexpected error occurred while communicating with the coastal telemetry node.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center space-y-3 border rounded-xl bg-red-500/5', className)} style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
      <div className="p-3 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="space-y-1 max-w-md">
        <h4 className="text-sm font-bold font-serif text-red-900 dark:text-red-200">{title}</h4>
        <p className="text-xs opacity-80 text-red-800 dark:text-red-300 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Request
        </button>
      )}
    </div>
  );
}

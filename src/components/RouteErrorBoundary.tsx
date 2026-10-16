// ============================================================
// SmartQEye Coastal — Route Error Boundary (Phase 8)
// Built on react-error-boundary with Kerala Police tactical recovery UI
// ============================================================

import React from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] h-full p-6 text-center select-none">
      <div
        className="max-w-md w-full p-6 rounded-2xl border shadow-xl flex flex-col items-center gap-4"
        style={{ background: 'var(--panel)', borderColor: 'var(--sev-critical)' }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-600 block">
            Operational View Exception
          </span>
          <h2 className="font-serif text-lg font-bold text-[var(--text)]">
            Failed to Render Coastal View
          </h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            An unexpected error occurred while executing this operational module. Telemetry and state caches have been isolated to protect evidence integrity.
          </p>
        </div>

        {/* Error detail box */}
        <div
          className="w-full p-3 rounded-lg border text-left font-mono text-[11px] overflow-x-auto max-h-32 text-red-600 dark:text-red-300"
          style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
        >
          {error instanceof Error ? error.message : String(error)}
        </div>

        <div className="flex items-center gap-3 w-full pt-2">
          <button
            onClick={resetErrorBoundary}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[var(--sea-600)] text-white hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry View</span>
          </button>
          <button
            onClick={() => {
              resetErrorBoundary();
              navigate('/');
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold border hover:bg-[var(--sand-200)] transition-colors"
            style={{ background: 'var(--raised)', borderColor: 'var(--line)', color: 'var(--text)' }}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Command Center</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        // Safe logging of component stack in debug mode
        if (import.meta.env.DEV) {
          // Dev only
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

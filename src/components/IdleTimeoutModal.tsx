// ============================================================
// SmartQEye Coastal — Idle Session Timeout Modal (15 Minutes)
// Enforces CERT-In & Kerala Police Station Security Guidelines
// ============================================================

import { useEffect, useState } from 'react';
import { ShieldAlert, Clock, LogOut, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

const IDLE_LIMIT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_THRESHOLD_MS = 14 * 60 * 1000; // 14 minutes (60 seconds countdown)

export function IdleTimeoutModal() {
  const { isAuthenticated, logout, lastActiveAt, recordActivity, isIdleModalOpen, setIdleModalOpen } = useAuthStore();
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  // Activity listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    function handleActivity() {
      // If modal is not open, bump activity timestamp
      if (!isIdleModalOpen) {
        recordActivity();
      }
    }

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
    };
  }, [isAuthenticated, isIdleModalOpen, recordActivity]);

  // Timer ticker
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActiveAt;

      if (elapsed >= IDLE_LIMIT_MS) {
        setIdleModalOpen(false);
        logout();
      } else if (elapsed >= WARNING_THRESHOLD_MS) {
        const left = Math.max(0, Math.ceil((IDLE_LIMIT_MS - elapsed) / 1000));
        setSecondsRemaining(left);
        if (!isIdleModalOpen) {
          setIdleModalOpen(true);
        }
      } else if (isIdleModalOpen) {
        setIdleModalOpen(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, lastActiveAt, isIdleModalOpen, logout, setIdleModalOpen]);

  if (!isAuthenticated || !isIdleModalOpen) {
    return null;
  }

  function handleExtend() {
    recordActivity();
    setIdleModalOpen(false);
  }

  function handleLogoutNow() {
    setIdleModalOpen(false);
    logout();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        className="w-full max-w-md rounded-2xl border p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        style={{ background: 'var(--panel)', borderColor: 'var(--sev-high)' }}
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex-shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold">Session Security Timeout</h3>
            <p className="text-xs opacity-70 mt-0.5">
              Workstation inactivity detected (Kerala Police 15m Policy)
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-[var(--surface)] text-center space-y-2" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-center gap-2 text-2xl font-mono font-bold text-amber-500">
            <Clock className="w-5 h-5 animate-pulse" />
            <span>00:{String(secondsRemaining).padStart(2, '0')}</span>
          </div>
          <p className="text-xs opacity-75 font-sans leading-relaxed">
            Your authenticated session will be securely terminated in <strong className="font-mono text-amber-600">{secondsRemaining} seconds</strong> due to inactivity. All operational video buffers will be flushed.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleLogoutNow}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border hover:bg-[var(--surface-hover)] transition-colors"
            style={{ borderColor: 'var(--line)' }}
          >
            <LogOut className="w-3.5 h-3.5" /> Logout Now
          </button>
          <button
            onClick={handleExtend}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-sm font-sans"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Extend Session
          </button>
        </div>
      </div>
    </div>
  );
}

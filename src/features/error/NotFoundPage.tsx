// ============================================================
// SmartQEye Coastal — 404 Route Not Found Component
// Proposal §5.1 & RFP §5 Compliant
// Graceful recovery screen routing back to Live Monitor with breadcrumb context
// ============================================================

import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Compass, Radio, ArrowLeft, ShieldAlert, Home, ChevronRight } from 'lucide-react';

export default function NotFoundPage() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center space-y-6" style={{ background: 'var(--bg)' }}>
      {/* Breadcrumb Context */}
      <div className="flex items-center gap-2 text-xs font-mono opacity-70 px-4 py-2 rounded-full border bg-[var(--panel)]" style={{ borderColor: 'var(--line)' }}>
        <Link to="/" className="hover:underline flex items-center gap-1">
          <Home className="w-3.5 h-3.5" /> Command Center
        </Link>
        <ChevronRight className="w-3 h-3 opacity-40" />
        <span className="opacity-60">Tactical Navigation</span>
        <ChevronRight className="w-3 h-3 opacity-40" />
        <span className="text-red-500 font-bold">{location.pathname}</span>
      </div>

      {/* Main 404 Icon & Alert */}
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500">
        <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: '8s' }} />
      </div>

      <div className="max-w-md space-y-2">
        <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/15 text-red-600 border border-red-500/30">
          HTTP 404 — SECTOR COORDINATES NOT MAPPED
        </div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">Tactical Route Unregistered</h1>
        <p className="text-xs opacity-75 font-sans leading-relaxed">
          The requested path <code className="px-1.5 py-0.5 rounded bg-[var(--surface)] border font-mono text-red-600 font-bold" style={{ borderColor: 'var(--line)' }}>{location.pathname}</code> does not match any authorized surveillance route or police service endpoint in this deployment.
        </p>
      </div>

      {/* Recovery Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border hover:bg-[var(--surface)] transition-colors"
          style={{ borderColor: 'var(--line)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Previous Screen
        </button>
        <button
          onClick={() => navigate('/live')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-md"
        >
          <Radio className="w-3.5 h-3.5" />
          Return to Live Monitor
        </button>
      </div>

      <div className="pt-6 border-t w-full max-w-sm text-[11px] font-mono opacity-50 space-y-1" style={{ borderColor: 'var(--line)' }}>
        <div>Kerala Police Coastal Drone Operations Matrix</div>
        <div>Cyber Division · Drone Forensic Lab (Thiruvananthapuram)</div>
      </div>
    </div>
  );
}

// ============================================================
// SmartQEye Coastal — Alert Configuration (RFP §7)
// Multi-modal alert rules, CFS inference policies, and CKFE evidence capture
// ============================================================

import { useState } from 'react';
import { Settings2, Bell, Cpu, Camera, Shield, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Severity } from '@/types';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  defaultSeverity: Severity;
  detector: 'RTMDet-L' | 'RTMDet-Thermal' | 'ByteTrack' | 'Density Estimator' | 'Temporal Engine';
  thresholdText: string;
  ckfeCapturePrePostSec: number;
  enabled: boolean;
}

export default function AlertConfigPage() {
  const [rules, setRules] = useState<AlertRule[]>([
    {
      id: 'rule-01',
      name: 'Unauthorised Perimeter Intrusion',
      description: 'Triggered when any marine craft or unidentified target crosses designated restricted zone boundary.',
      defaultSeverity: 'CRITICAL',
      detector: 'RTMDet-L',
      thresholdText: 'Detector Conf ≥ 0.70, In-Zone Dwell ≥ 15s',
      ckfeCapturePrePostSec: 90,
      enabled: true,
    },
    {
      id: 'rule-02',
      name: 'Repeated Shoreline Approach Pattern',
      description: 'Contact repeatedly approaches coastal shore within defined observation window, indicating beach landing.',
      defaultSeverity: 'HIGH',
      detector: 'ByteTrack',
      thresholdText: 'Approach Count ≥ 3 within 15 minutes',
      ckfeCapturePrePostSec: 60,
      enabled: true,
    },
    {
      id: 'rule-03',
      name: 'High-Speed Marine Convergence',
      description: 'Two or more tracked vessels converging at relative speed exceeding typical trolling or transit rate.',
      defaultSeverity: 'HIGH',
      detector: 'Temporal Engine',
      thresholdText: 'Relative Velocity ≥ 2.5 knots, Distance ≤ 50m',
      ckfeCapturePrePostSec: 90,
      enabled: true,
    },
    {
      id: 'rule-04',
      name: 'Crowd Density Threshold Exceeded',
      description: 'Rapid congregation of persons along beach promenade or coastal landing strip.',
      defaultSeverity: 'MEDIUM',
      detector: 'Density Estimator',
      thresholdText: 'Headcount ≥ 40 persons in 200m² sector',
      ckfeCapturePrePostSec: 45,
      enabled: true,
    },
    {
      id: 'rule-05',
      name: 'Unattended Shoreline Cargo / Baggage',
      description: 'Stationary object isolated on sandbar or splash zone with no associated tracked person nearby.',
      defaultSeverity: 'MEDIUM',
      detector: 'RTMDet-Thermal',
      thresholdText: 'Dwell Time ≥ 20 minutes, Separation ≥ 30m',
      ckfeCapturePrePostSec: 60,
      enabled: true,
    },
    {
      id: 'rule-06',
      name: 'Anomalous Vessel Loitering',
      description: 'Vessel maintaining stationary drift or slow rotational pattern outside designated anchorage.',
      defaultSeverity: 'LOW',
      detector: 'Temporal Engine',
      thresholdText: 'Dwell Time ≥ 300 seconds, Speed ≤ 1.0 knot',
      ckfeCapturePrePostSec: 30,
      enabled: true,
    },
  ]);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--surface)] text-[var(--sea-600)] border" style={{ borderColor: 'var(--line)' }}>
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold">Alert Configuration &amp; Policies</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                RFP §7 COMPLIANT
              </span>
            </div>
            <p className="text-xs opacity-60">
              Configure detection thresholds, Cognitive Frame Selection (CFS) policies, and CKFE evidence capture
            </p>
          </div>
        </div>

        <button
          onClick={() => alert('Alert thresholds and evidence retention parameters saved to central node.')}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-xs"
        >
          Save Configuration
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Policy Summary Card */}
        <div className="p-4 rounded-xl border grid grid-cols-3 gap-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <div>
            <span className="text-[10px] font-mono uppercase opacity-50 block">CFS Compute Policy</span>
            <span className="text-sm font-bold text-emerald-600">Adaptive Dynamic Rate (8 - 25 FPS)</span>
            <span className="text-[11px] opacity-60 block mt-1">Preserves central GPU capacity by ~65%</span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase opacity-50 block">CKFE Evidence Retention</span>
            <span className="text-sm font-bold text-cyan-600">Pre/Post Keyframe Extractor</span>
            <span className="text-[11px] opacity-60 block mt-1">Extracts 3 keyframes + sidecar JSON per alert</span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase opacity-50 block">Integrity Safeguard</span>
            <span className="text-sm font-bold text-[var(--sea-600)]">SHA-256 Immutable Hash</span>
            <span className="text-[11px] opacity-60 block mt-1">Tamper-evident chain of custody</span>
          </div>
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          {rules.map(rule => (
            <div
              key={rule.id}
              className={cn(
                'rounded-2xl border p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4',
                rule.enabled ? 'border-[var(--line)] bg-[var(--panel)]' : 'border-dashed opacity-50 bg-[var(--surface)]'
              )}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[var(--sea-600)]">{rule.id}</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase',
                      rule.defaultSeverity === 'CRITICAL' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                      rule.defaultSeverity === 'HIGH' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                      'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20'
                    )}
                  >
                    {rule.defaultSeverity}
                  </span>
                  <span className="text-[10px] font-mono opacity-50">· {rule.detector}</span>
                </div>

                <h3 className="font-serif text-base font-bold">{rule.name}</h3>
                <p className="text-xs opacity-70 font-sans">{rule.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
                  <div className="px-2 py-1 rounded bg-[var(--surface)] border text-[11px]" style={{ borderColor: 'var(--line)' }}>
                    <span className="opacity-60">Rule Trigger: </span>
                    <strong>{rule.thresholdText}</strong>
                  </div>
                  <div className="px-2 py-1 rounded bg-[var(--surface)] border text-[11px]" style={{ borderColor: 'var(--line)' }}>
                    <span className="opacity-60">CKFE Window: </span>
                    <strong>±{rule.ckfeCapturePrePostSec}s pre/post roll</strong>
                  </div>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => toggleRule(rule.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors',
                  rule.enabled
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                )}
              >
                {rule.enabled ? 'RULE ACTIVE' : 'DISABLED'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

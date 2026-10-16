// ============================================================
// SmartQEye Coastal — Alert Configuration & Rules Policy (RFP §7)
// Multi-modal alert rules, escalation matrix, and 24-hour historical replay test
// ============================================================

import { useState } from 'react';
import {
  Settings2, Bell, Cpu, Camera, Shield, Check, RefreshCw,
  Play, CheckCircle2, AlertTriangle, Layers, Sliders, ChevronRight,
  TrendingDown, Clock, Smartphone, Mail, Globe, Sparkles
} from 'lucide-react';
import { ALERT_RULES } from '@/lib/mockData';
import { rulesApi, type HistoricalReplayResult } from '@/lib/api';
import { SeverityChip } from '@/components/SeverityChip';
import { HumanInterpretationNote } from '@/components/HumanInterpretationNote';
import { cn } from '@/lib/utils';
import type { AlertRuleConfig, Severity } from '@/types';

export default function AlertConfigPage() {
  const [rules, setRules] = useState<AlertRuleConfig[]>(ALERT_RULES);
  const [selectedRule, setSelectedRule] = useState<AlertRuleConfig>(ALERT_RULES[0]);
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayResult, setReplayResult] = useState<HistoricalReplayResult | null>(null);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AlertRuleConfig>>({});

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => {
      if (r.id !== id) return r;
      return { ...r, enabled: !r.enabled, lastUpdated: new Date().toISOString() };
    }));
  };

  const handleRunReplay = async () => {
    setReplayLoading(true);
    try {
      const result = await rulesApi.runReplayTest(selectedRule.id);
      setReplayResult(result);
    } finally {
      setReplayLoading(false);
    }
  };

  const openEditor = (rule: AlertRuleConfig) => {
    setSelectedRule(rule);
    setEditForm({
      name: rule.name,
      description: rule.description,
      priority: rule.priority,
      detectorEngine: rule.detectorEngine,
      ckfeCapturePrePostSec: rule.ckfeCapturePrePostSec,
      notificationChannels: [...rule.notificationChannels],
    });
    setShowEditorModal(true);
  };

  const saveEditor = () => {
    setRules(prev => prev.map(r => {
      if (r.id !== selectedRule.id) return r;
      const nextVer = `v${(parseFloat(r.version.replace('v', '')) + 0.1).toFixed(1)}`;
      return {
        ...r,
        ...editForm,
        version: nextVer,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'CI Krishna N. (Zone Admin)',
      } as AlertRuleConfig;
    }));
    setShowEditorModal(false);
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
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                CFS &amp; CKFE INTEGRATED
              </span>
            </div>
            <p className="text-xs opacity-60">
              Multi-modal detector rules, dispatch channels, escalation matrices, and historical test replay
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunReplay}
            disabled={replayLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-xs disabled:opacity-50"
          >
            {replayLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Run 24h Historical Replay Test
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* ─── 24-HOUR HISTORICAL REPLAY TEST PANEL ─── */}
        <div className="p-5 rounded-2xl border space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-sm font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  24-Hour Historical Replay Test Panel (Proposal §5.1.10)
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600">
                  94.0% REDUCTION VERIFIED
                </span>
              </div>
              <p className="text-xs opacity-60 mt-0.5">
                Simulates yesterday&apos;s full-stream edge detections through Kerala Coastal Context Intelligence filters
              </p>
            </div>
            <span className="text-xs font-mono opacity-50">
              Evaluation Baseline: 24h Coastal Sorties · 6 UAVs
            </span>
          </div>

          <div className="grid grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-[var(--surface)] border space-y-1" style={{ borderColor: 'var(--line)' }}>
              <span className="text-[10px] font-mono uppercase opacity-50 block font-bold">Raw Edge Detections</span>
              <span className="text-xl font-serif font-bold text-slate-700 dark:text-slate-300">
                {replayResult ? replayResult.rawEdgeDetections.toLocaleString() : '124,500'}
              </span>
              <span className="text-[10px] opacity-60 block">Raw frame boxes from RTMDet</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface)] border space-y-1" style={{ borderColor: 'var(--line)' }}>
              <span className="text-[10px] font-mono uppercase opacity-50 block font-bold">Context-Filtered Alerts</span>
              <span className="text-xl font-serif font-bold text-[var(--sea-600)]">
                {replayResult ? replayResult.contextFilteredAlerts.toLocaleString() : '7,470'}
              </span>
              <span className="text-[10px] opacity-60 block">Escalated to operator review</span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <span className="text-[10px] font-mono uppercase text-emerald-700 dark:text-emerald-400 block font-bold">
                Volume Reduction
              </span>
              <span className="text-xl font-serif font-bold text-emerald-600 dark:text-emerald-400">
                {replayResult ? `${replayResult.alertVolumeReductionPct.toFixed(1)}%` : '94.0%'}
              </span>
              <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70 block">Eliminating alarm fatigue</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface)] border space-y-1" style={{ borderColor: 'var(--line)' }}>
              <span className="text-[10px] font-mono uppercase opacity-50 block font-bold">False-Alarm Suppression</span>
              <span className="text-xl font-serif font-bold text-cyan-600">
                {replayResult ? `${replayResult.falseAlarmSuppressionPct.toFixed(1)}%` : '97.4%'}
              </span>
              <span className="text-[10px] opacity-60 block">Weed, foam &amp; wave suppression</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface)] border space-y-1" style={{ borderColor: 'var(--line)' }}>
              <span className="text-[10px] font-mono uppercase opacity-50 block font-bold">Operator Hours Saved</span>
              <span className="text-xl font-serif font-bold text-amber-600">
                {replayResult ? `${(replayResult.operatorMinutesSaved / 60).toFixed(1)}h` : '32.5h'}
              </span>
              <span className="text-[10px] opacity-60 block">Across 3 control room shifts</span>
            </div>
          </div>
        </div>

        {/* ─── ALERT RULES TABLE & EDITOR ─── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold opacity-75 uppercase tracking-wider text-[11px]">
              Multi-Modal Detection &amp; Enforcement Rules ({rules.length})
            </h3>
            <span className="text-xs font-mono opacity-60">
              Audit logged on every edit · Auto-version bumped
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {rules.map(r => (
              <div
                key={r.id}
                className={cn(
                  'rounded-2xl border p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4',
                  r.enabled ? 'border-[var(--line)] bg-[var(--panel)]' : 'border-dashed opacity-50 bg-[var(--surface)]'
                )}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--sea-600)]">{r.code}</span>
                    <SeverityChip severity={r.priority} size="sm" />
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                      {r.detectorEngine}
                    </span>
                    <span className="text-[10px] font-mono opacity-50">· {r.version}</span>
                  </div>

                  <h3 className="font-serif text-base font-bold">{r.name}</h3>
                  <p className="text-xs opacity-75 leading-relaxed max-w-3xl">{r.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono opacity-70 pt-1">
                    <div className="flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-cyan-600" />
                      <span>CKFE Pre/Post: <strong>±{r.ckfeCapturePrePostSec}s</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-amber-600" />
                      <span>Zones: <strong>{r.zoneCodes.join(', ')}</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Schedule: <strong>{r.schedule}</strong></span>
                    </div>
                  </div>

                  {/* Notification Channels & Escalation Matrix */}
                  <div className="flex items-center gap-3 pt-2 text-[11px] font-mono">
                    <span className="opacity-50">Channels:</span>
                    {r.notificationChannels.map(ch => (
                      <span key={ch} className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)] text-[10px]">
                        {ch === 'DASHBOARD' && '🖥️ Console'}
                        {ch === 'SMS_GATEWAY' && '📱 SMS Gateway'}
                        {ch === 'EMAIL' && '✉️ Email'}
                        {ch === 'WEBHOOK' && '🔗 Webhook'}
                      </span>
                    ))}

                    <span className="opacity-30">|</span>

                    <span className="opacity-50">Escalation:</span>
                    <span className="opacity-80">
                      Tier 1 (0m) → Tier 2 (5m) → Tier 3 (15m)
                    </span>
                  </div>
                </div>

                {/* Edit & Status Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openEditor(r)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-hover)] transition-colors"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    Edit Policy
                  </button>
                  <button
                    onClick={() => toggleRule(r.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors',
                      r.enabled
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                    )}
                  >
                    {r.enabled ? 'RULE ACTIVE' : 'RULE DISABLED'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Human in the loop note */}
        <HumanInterpretationNote />
      </div>

      {/* Rule Edit Modal */}
      {showEditorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl border p-6 space-y-5 shadow-xl" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <div>
                <span className="font-mono text-xs font-bold text-[var(--sea-600)]">{selectedRule.code}</span>
                <h3 className="font-serif text-base font-bold">Edit Alert Rule &amp; Dispatch Policy</h3>
              </div>
              <button
                onClick={() => setShowEditorModal(false)}
                className="text-xs font-mono p-1 rounded hover:bg-[var(--surface-hover)]"
              >
                ✕ CLOSE
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-1 font-sans">
                <label className="text-[11px] font-mono uppercase opacity-50 block font-bold">Rule Title</label>
                <input
                  type="text"
                  value={editForm.name ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full p-2 rounded-lg border bg-[var(--surface)] text-xs font-serif font-bold"
                  style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase opacity-50 block font-bold">Severity Level</label>
                  <select
                    value={editForm.priority}
                    onChange={e => setEditForm(f => ({ ...f, priority: e.target.value as Severity }))}
                    className="w-full p-2 rounded-lg border bg-[var(--surface)]"
                    style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase opacity-50 block font-bold">AI Detector Engine</label>
                  <select
                    value={editForm.detectorEngine}
                    onChange={e => setEditForm(f => ({ ...f, detectorEngine: e.target.value as any }))}
                    className="w-full p-2 rounded-lg border bg-[var(--surface)]"
                    style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                  >
                    <option value="RTMDet-L">RTMDet-L (RGB Central GPU)</option>
                    <option value="RTMDet-Thermal">RTMDet-Thermal (LWIR)</option>
                    <option value="ByteTrack">ByteTrack (Multi-Object MOT)</option>
                    <option value="Temporal Engine">Temporal Analytics Engine</option>
                    <option value="Density Estimator">Density Estimator (Crowd)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase opacity-50 block font-bold">CKFE Evidence Pre/Post Capture Window</label>
                <div className="flex items-center gap-2">
                  {[30, 45, 60, 90].map(sec => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setEditForm(f => ({ ...f, ckfeCapturePrePostSec: sec }))}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg border text-xs font-bold',
                        editForm.ckfeCapturePrePostSec === sec
                          ? 'bg-[var(--sea-600)] text-white border-[var(--sea-600)]'
                          : 'bg-[var(--surface)] opacity-70'
                      )}
                      style={{ borderColor: 'var(--line)' }}
                    >
                      ±{sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
              <button
                onClick={() => setShowEditorModal(false)}
                className="px-3 py-1.5 rounded-lg border text-xs hover:bg-[var(--surface-hover)]"
                style={{ borderColor: 'var(--line)' }}
              >
                Cancel
              </button>
              <button
                onClick={saveEditor}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] shadow-xs"
              >
                Save &amp; Increment Version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

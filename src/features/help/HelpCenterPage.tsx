// ============================================================
// SmartQEye Coastal — Help Centre & Operator Training (/help)
// RFP §13 & Proposal 5.1.35 Compliance
// 5 Tabs:
// Training Modules | Operational Manuals | Keyboard Shortcuts | Troubleshooting | Glossary
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, BookOpen, Keyboard, HelpCircle, FileText,
  CheckCircle2, Play, RotateCcw, AlertTriangle, Shield,
  Radio, Compass, Cpu, ExternalLink, Sparkles, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTrainingStore, TRAINING_MODULES } from '@/lib/store';

type HelpTab = 'modules' | 'manuals' | 'shortcuts' | 'troubleshooting' | 'glossary';

export default function HelpCenterPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HelpTab>('modules');
  const {
    isTrainingMode,
    completedModuleIds,
    toggleTrainingMode,
    markModuleComplete,
    resetTrainingProgress,
    startTour,
  } = useTrainingStore();

  // Listen for '?' key to jump to keyboard shortcuts tab
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setActiveTab('shortcuts');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalModules = TRAINING_MODULES.length;
  const completedCount = completedModuleIds.length;
  const progressPct = Math.round((completedCount / totalModules) * 100);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--surface)] text-[var(--sea-600)] border" style={{ borderColor: 'var(--line)' }}>
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold">Help Centre & Training Academy</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                RFP §13 · Proposal 5.1.35
              </span>
            </div>
            <p className="text-xs opacity-70">
              Interactive operational training, Kerala Police system manuals, shortcut cheatsheets, and maritime taxonomy glossary.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTrainingMode}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer',
              isTrainingMode
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md animate-pulse'
                : 'bg-[var(--surface)] border-[var(--line)] hover:bg-[var(--surface)]/80'
            )}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{isTrainingMode ? 'Training Sandbox: ACTIVE' : 'Enable Training Sandbox'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 px-6 pt-3 border-b flex-shrink-0 overflow-x-auto" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        {(
          [
            ['modules', 'Training Modules & Checklist', GraduationCap],
            ['manuals', 'Operational Manuals', BookOpen],
            ['shortcuts', 'Keyboard Shortcuts (?)', Keyboard],
            ['troubleshooting', 'Troubleshooting & Support', HelpCircle],
            ['glossary', 'Maritime Intelligence Glossary', FileText],
          ] as const
        ).map(([tabKey, tabLabel, Icon]) => (
          <button
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer',
              activeTab === tabKey
                ? 'border-[var(--sea-600)] text-[var(--sea-600)] bg-[var(--surface)] font-bold'
                : 'border-transparent opacity-70 hover:opacity-100 hover:bg-[var(--surface)]/50'
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{tabLabel}</span>
            {tabKey === 'modules' && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[var(--sea-600)]/15 text-[var(--sea-600)]">
                {completedCount}/{totalModules}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ══════════════════════════════════════════════════════════
            TAB 1: TRAINING MODULES & CHECKLIST
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'modules' && (
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="p-5 rounded-xl border bg-[var(--panel)] flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200 dark:text-gray-700"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[var(--sea-600)] transition-all duration-500"
                      strokeDasharray={`${progressPct}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-xs font-bold font-mono">{progressPct}%</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold font-serif">Operator Certification Curriculum</h3>
                  <p className="text-xs opacity-70">
                    {completedCount} of {totalModules} operational competencies verified for Kerala Coastal Police deployment.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={resetTrainingProgress}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border hover:bg-[var(--surface)] transition-colors opacity-70 hover:opacity-100 cursor-pointer"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Curriculum
                </button>
              </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TRAINING_MODULES.map((mod, index) => {
                const isDone = completedModuleIds.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    className={cn(
                      'p-4 rounded-xl border transition-all space-y-3 bg-[var(--panel)]',
                      isDone && 'border-emerald-500/40 bg-emerald-500/5'
                    )}
                    style={{ borderColor: !isDone ? 'var(--line)' : undefined }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-[var(--surface)] flex items-center justify-center text-xs font-mono font-bold text-[var(--sea-600)] border" style={{ borderColor: 'var(--line)' }}>
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold">{mod.name}</h4>
                          <span className="text-[10px] opacity-60 font-mono">Est: {mod.estimatedMinutes} mins · Route: {mod.targetRoute}</span>
                        </div>
                      </div>

                      {isDone ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Completed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono opacity-60 border" style={{ borderColor: 'var(--line)' }}>
                          Pending
                        </span>
                      )}
                    </div>

                    <p className="text-xs opacity-75 leading-relaxed">
                      {mod.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                      <button
                        onClick={() => {
                          navigate(mod.targetRoute);
                          startTour(mod.tourId);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--sea-600)] text-white hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-white" /> Start Guided Tour
                      </button>

                      <button
                        onClick={() => markModuleComplete(mod.id)}
                        className={cn(
                          'text-xs font-semibold hover:underline cursor-pointer',
                          isDone ? 'text-gray-400' : 'text-emerald-600'
                        )}
                      >
                        {isDone ? 'Mark as Incomplete' : 'Mark as Verified'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2: OPERATIONAL MANUALS
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'manuals' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl border bg-[var(--panel)] space-y-3" style={{ borderColor: 'var(--line)' }}>
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 w-fit">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold font-serif">1. Coastal Operator Field Manual</h3>
                <p className="text-xs opacity-70 leading-relaxed">
                  Step-by-step procedures for live drone sortie monitoring, Cognitive Frame Selection (CFS) adjustment, thermal camera ironbow interpretation, and preliminary alert acknowledgement.
                </p>
                <div className="pt-2 text-xs font-mono text-[var(--sea-600)]">
                  Sections: SOP-01 Ingestion · SOP-02 Night Flir · SOP-03 Incident Marking
                </div>
              </div>

              <div className="p-5 rounded-xl border bg-[var(--panel)] space-y-3" style={{ borderColor: 'var(--line)' }}>
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 w-fit">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold font-serif">2. Cyber Division Admin Guide</h3>
                <p className="text-xs opacity-70 leading-relaxed">
                  System administrators guide covering Kerala Police officer role provisioning, Section 65B audit log verification, legal hold configuration, and disaster recovery drill execution.
                </p>
                <div className="pt-2 text-xs font-mono text-purple-600">
                  Sections: ADM-01 RBAC Matrix · ADM-02 Tamper Seal · ADM-03 Failover
                </div>
              </div>

              <div className="p-5 rounded-xl border bg-[var(--panel)] space-y-3" style={{ borderColor: 'var(--line)' }}>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 w-fit">
                  <Radio className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold font-serif">3. C4I & CAD Integration Manual</h3>
                <p className="text-xs opacity-70 leading-relaxed">
                  OpenAPI 3.1 specifications for external coastal police CAD dispatch, Indian Coast Guard maritime radar cross-correlation, and REST telemetry ingestion endpoints.
                </p>
                <div className="pt-2 text-xs font-mono text-emerald-600">
                  Sections: API-01 Webhooks · API-02 CAD GeoJSON · API-03 ELIR Export
                </div>
              </div>
            </div>

            {/* Standard Operating Procedure (SOP) Highlight */}
            <div className="p-5 rounded-xl border bg-[var(--panel)] space-y-3" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--line)' }}>
                <Sparkles className="w-4 h-4 text-[var(--sea-600)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Operational Protocol: Human-in-the-Loop Decision Cycle</h3>
              </div>
              <ol className="list-decimal list-inside text-xs opacity-80 space-y-2 leading-relaxed">
                <li><span className="font-bold">Detection & Tracking:</span> AI detector tracks maritime target. If confidence drops below 0.70, contact remains classified as UNKNOWN_VESSEL.</li>
                <li><span className="font-bold">Context Evaluation:</span> Kerala Coastal Context Engine evaluates zone rules (e.g. 5 NM boundary, dwell time &gt;180s, speed vector).</li>
                <li><span className="font-bold">Attention Level Assignment:</span> If breach occurs, an incident is registered with calculated attention level (ROUTINE, ATTENTION, ELEVATED, CRITICAL).</li>
                <li><span className="font-bold">Evidence Packaging:</span> Cognitive Keyframe Extractor (CKFE) selects 3 evidence frames and computes SHA-256 seal.</li>
                <li><span className="font-bold">Human Police Determination (Final):</span> Only authorised police officers can escalate, dispatch interceptors, or classify as false positive. AI never auto-dispatches.</li>
              </ol>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 3: KEYBOARD SHORTCUTS
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'shortcuts' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl border bg-[var(--panel)] space-y-4" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--line)' }}>
                <h3 className="text-sm font-bold font-serif">Kerala Police Tactical Keyboard Shortcuts</h3>
                <span className="text-xs opacity-60 font-mono">Press ? from any page to open this cheat sheet</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[var(--sea-600)]">Workspace Navigation</h4>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { key: '1', action: 'Single Feed Focused View (Live Monitor)' },
                      { key: '4', action: '2x2 Quad Grid Layout (Live Monitor)' },
                      { key: '9', action: '3x3 Fleet Matrix Layout' },
                      { key: 'G then M', action: 'Go to GIS Maritime Map (/map)' },
                      { key: 'G then L', action: 'Go to Live Drone Feeds (/live)' },
                      { key: 'G then A', action: 'Go to Alert Queue (/alerts)' },
                      { key: 'G then I', action: 'Go to Incident Records (/incidents)' },
                    ].map(s => (
                      <div key={s.key} className="flex items-center justify-between py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                        <span className="opacity-80">{s.action}</span>
                        <kbd className="px-2 py-0.5 rounded bg-[var(--surface)] border font-mono font-bold text-[10px]" style={{ borderColor: 'var(--line)' }}>
                          {s.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[var(--sea-600)]">Video Player & Tactical Controls</h4>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { key: 'Space', action: 'Play / Pause Video Feed' },
                      { key: 'T', action: 'Toggle Thermal LWIR / RGB Modality' },
                      { key: 'O', action: 'Toggle AI Overlays (Bounding Boxes & Tracks)' },
                      { key: 'H', action: 'Toggle Burn-in HUD Telemetry Layer' },
                      { key: 'J / L', action: 'Jump -10s / +10s on Timeline' },
                      { key: 'Esc', action: 'Dismiss Open Modals & Drawers' },
                      { key: '?', action: 'Show Help & Keyboard Shortcuts' },
                    ].map(s => (
                      <div key={s.key} className="flex items-center justify-between py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                        <span className="opacity-80">{s.action}</span>
                        <kbd className="px-2 py-0.5 rounded bg-[var(--surface)] border font-mono font-bold text-[10px]" style={{ borderColor: 'var(--line)' }}>
                          {s.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 4: TROUBLESHOOTING & SUPPORT
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'troubleshooting' && (
          <div className="space-y-4">
            {[
              {
                title: 'RTSP Video Stream Loss or Freezing (UAV Signal Dropped)',
                severity: 'CRITICAL',
                cause: 'Drone has moved beyond 4G/5G line-of-sight gateway or local RF relay interference.',
                solution: 'The platform automatically displays EDGE_SYNC_LAG and buffers incoming telemetry on local edge laptop. Verify GCS antenna pointing angle or command UAV to return to high-altitude relay hover.',
              },
              {
                title: 'Edge Laptop Queue Depth Exceeds Threshold (> 150 frames)',
                severity: 'WARNING',
                cause: 'High sea-state or complex shoreline traffic saturating local laptop inference throughput.',
                solution: 'Cognitive Frame Selection (CFS) automatically scales processing to 8 FPS. If backlog persists, switch node compute placement to Central GPU Node A via /platform/deployment.',
              },
              {
                title: 'High Central GPU VRAM Usage Warning (> 85%)',
                severity: 'WARNING',
                cause: 'Concurrent multi-model execution (RTMDet-L + RT-DETRv2 candidate + InsightFace).',
                solution: 'Deallocate inactive candidate models from /models registry or adjust concurrent live feed allocations on the Fleet Wall.',
              },
              {
                title: 'GPS Coordinate Spoofing / Barometric Discrepancy Alert',
                severity: 'CRITICAL',
                cause: 'Telemetry packet timestamp jitter or coordinate jump greater than drone maximum velocity (80 km/h).',
                solution: 'System flags telemetry sample with TAMPER_FLAGGED. Inspect raw DJI sidecar logs in /history and revert to visual landmarks on GIS Map.',
              },
            ].map((t, idx) => (
              <div key={idx} className="p-4 rounded-xl border bg-[var(--panel)] space-y-2" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={cn('w-4 h-4', t.severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-500')} />
                    <h4 className="text-xs font-bold">{t.title}</h4>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-mono font-bold border',
                      t.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-600 border-red-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                    )}
                  >
                    {t.severity}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="opacity-60 font-semibold">Root Cause: </span>
                  <span className="opacity-80">{t.cause}</span>
                </div>
                <div className="text-xs p-2.5 rounded-lg bg-[var(--surface)] border" style={{ borderColor: 'var(--line)' }}>
                  <span className="font-bold text-[var(--sea-600)]">Action Plan: </span>
                  <span className="opacity-90">{t.solution}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 5: MARITIME INTELLIGENCE GLOSSARY
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'glossary' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                term: 'Cognitive Frame Selection (CFS)',
                category: 'COMPUTE OPTIMISATION',
                def: 'Intelligent front-end filter that evaluates zero-copy optical flow and spatial motion. Reduces frame processing from 25 FPS to 8 FPS during quiescent sea periods, saving up to 68% GPU compute.',
              },
              {
                term: 'Cognitive Keyframe Extraction (CKFE)',
                category: 'EVIDENCE PIPELINE',
                def: 'Post-event extraction algorithm that selects the three most informative frames (pre-incident context, peak salient breach, post-incident outcome) with burn-in HUD telemetry for legal dossiers.',
              },
              {
                term: 'Evidence-Linked Incident Record (ELIR)',
                category: 'FORENSIC DOSSIER',
                def: 'Court-admissible electronic dossier binding video clips, CKFE keyframes, GPS telemetry, AI rationale, and investigating officer actions under Indian Evidence Act Section 65B certification.',
              },
              {
                term: 'Persistent Coastal Contact',
                category: 'TRACKING & RE-ID',
                def: 'Unified maritime entity tracked across camera pans, breaking surf occlusions, and multi-sortie drone handovers using ByteTrack and spatial-temporal appearance models.',
              },
              {
                term: 'Context-Aware Operational Attention',
                category: 'DECISION SUPPORT',
                def: 'Four-tier operational classification (ROUTINE, ATTENTION, ELEVATED, CRITICAL) derived from vessel class, geographic zone sensitivity, shoreline dwell time, and rendezvous behaviour.',
              },
              {
                term: 'Section 65B Integrity Seal',
                category: 'LEGAL ADMISSIBILITY',
                def: 'Cryptographic SHA-256 fingerprint generated client-side across video files, metadata sidecars, and operator audit trails, ensuring tamper-evident submission in criminal court proceedings.',
              },
            ].map(item => (
              <div key={item.term} className="p-4 rounded-xl border bg-[var(--panel)] space-y-2" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[var(--sea-600)]">{item.term}</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[var(--surface)] border" style={{ borderColor: 'var(--line)' }}>
                    {item.category}
                  </span>
                </div>
                <p className="text-xs opacity-80 leading-relaxed">{item.def}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

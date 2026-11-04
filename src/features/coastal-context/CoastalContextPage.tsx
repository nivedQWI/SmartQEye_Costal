// ============================================================
// SmartQEye Coastal — Persistent Coastal Contact & Context Intelligence Page
// Phase integration of SmartQEye-Coastal-Context-MVP
// ============================================================

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Anchor, Radio, Shield, Activity, ChevronRight,
  Eye, AlertTriangle, CheckCircle2, Clock, Layers,
  PlayCircle, RotateCcw, FileText, UserCheck, BookOpen
} from 'lucide-react';
import { contextEngineApi } from '@/lib/contextEngineApi';
import type {
  ContextResult,
  CoastalScenario,
  ScenarioKey,
  ScenarioEvent,
} from '@/types/contextIntelligence';

// ─── Scenario Definitions (ported from Context MVP) ──────────

const SCENARIOS: Record<ScenarioKey, CoastalScenario> = {
  Day: {
    title: 'Daytime — Kovalam Water-Sports Context',
    video: '/videos/kerala_coastal_surveillance_v4.mp4',
    contact: 'VESSEL-A01',
    zone: 'KOVALAM_WATERSPORTS',
    hour: 15,
    sensor: 'RGB / EO',
    condition: 'Clear daylight',
    events: [
      { at: 1,  code: 'contact_established',  label: 'Contact established' },
      { at: 4,  code: 'parallel_travel',       label: 'Parallel coastal movement' },
      { at: 10, code: 'heading_change',         label: 'Heading change observed' },
      { at: 14, code: 'shoreline_approach',     label: 'Reduced distance to shoreline' },
      { at: 19, code: 'movement_away',          label: 'Movement away' },
    ],
    doNotClaim: ['No prolonged dwell', 'No repeated sharp turns'],
  },
  Cloudy: {
    title: 'Cloudy — Fishing / Landing Activity Context',
    video: '/videos/kerala_coastal_cloudy.mp4',
    contact: 'VESSEL-C03',
    zone: 'FISHING_ZONE',
    hour: 11,
    sensor: 'RGB / EO',
    condition: 'Overcast / diffused light',
    events: [
      { at: 1,  code: 'contact_established',       label: 'Contact established' },
      { at: 4,  code: 'parallel_travel',            label: 'Parallel coastal movement' },
      { at: 9,  code: 'reduced_distance_to_shore',  label: 'Reduced distance to shoreline' },
      { at: 12, code: 'slower_movement',            label: 'Reduced movement observed' },
    ],
    doNotClaim: ['No strong turning claim', 'No long stationary dwell'],
  },
  Night: {
    title: 'Night — Police Monitored Coastal Zone',
    video: '/videos/kerala_coastal_night.mp4',
    contact: 'VESSEL-N17',
    zone: 'MONITORED_COASTAL_ZONE',
    hour: 23,
    sensor: 'RGB / Low-light',
    condition: 'Night with coastal lights',
    events: [
      { at: 1, code: 'contact_established', label: 'Contact established under low light' },
      { at: 5, code: 'parallel_travel',     label: 'Continued parallel coastal movement' },
      { at: 9, code: 'night_time_presence', label: 'Night-time presence retained as context' },
    ],
    doNotClaim: ['No clear shoreline approach', 'No dwell-near-shore claim'],
  },
  Thermal: {
    title: 'Thermal — Monitored Coastal Observation',
    video: '/videos/kerala_coastal_thermal.mp4',
    contact: 'VESSEL-T04',
    zone: 'MONITORED_COASTAL_ZONE',
    hour: 20,
    sensor: 'THERMAL / LWIR',
    condition: 'Reduced visible-light conditions',
    events: [
      { at: 1, code: 'thermal_detection',         label: 'Thermal vessel signature detected' },
      { at: 4, code: 'continued_track',            label: 'Contact continuity maintained' },
      { at: 9, code: 'reduced_distance_to_shore',  label: 'Reduced distance to shoreline' },
    ],
    doNotClaim: ['No hull-colour inference', 'No occupant inference', 'No precise-speed inference'],
  },
};

const SCENARIO_KEYS: ScenarioKey[] = ['Day', 'Cloudy', 'Night', 'Thermal'];

const SCENARIO_TAB_LABELS: Record<ScenarioKey, string> = {
  Day: 'Daytime Clear',
  Cloudy: 'Cloudy Sky',
  Night: 'Night / Low-Light',
  Thermal: 'Thermal / LWIR',
};

// ─── Helpers ─────────────────────────────────────────────────

function attentionColor(level: string): string {
  if (level === 'ATTENTION') return '#ef4444';
  if (level === 'MONITOR')   return '#f59e0b';
  return '#22c55e';
}

function attentionBg(level: string): string {
  if (level === 'ATTENTION') return 'rgba(239,68,68,0.12)';
  if (level === 'MONITOR')   return 'rgba(245,158,11,0.12)';
  return 'rgba(34,197,94,0.12)';
}

function beep() {
  try {
    type AnyAudioCtx = typeof AudioContext;
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: AnyAudioCtx }).webkitAudioContext);
    const ctx = new AC();
    [740, 980].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.value = 0.1;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.24);
      osc.stop(ctx.currentTime + i * 0.24 + 0.18);
    });
  } catch { /* ignore */ }
}

// ─── Sub-components ───────────────────────────────────────────

function AttentionBadge({ level }: { level: string }) {
  const color = attentionColor(level);
  const bg = attentionBg(level);
  const Icon = level === 'ATTENTION' ? AlertTriangle : level === 'MONITOR' ? Eye : CheckCircle2;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.75rem 1rem', borderRadius: '0.5rem',
      border: `1px solid ${color}`, background: bg,
    }}>
      <Icon style={{ color, width: 20, height: 20, flexShrink: 0 }} strokeWidth={2} />
      <div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Operational Attention
        </div>
        <div style={{ fontWeight: 700, fontSize: '1rem', color, letterSpacing: '0.05em' }}>
          {level}
        </div>
      </div>
    </div>
  );
}

function EventChip({ event, seen }: { event: ScenarioEvent; seen: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.4rem 0.75rem', borderRadius: 999,
      background: seen ? 'rgba(59,130,246,0.15)' : 'var(--surface-2, rgba(255,255,255,0.04))',
      border: `1px solid ${seen ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
      transition: 'all 0.3s ease',
      fontSize: '0.78rem',
      color: seen ? '#93c5fd' : 'var(--text-muted)',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: seen ? '#3b82f6' : 'var(--text-muted)',
        flexShrink: 0,
      }} />
      {event.label}
      {seen && <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>T+{event.at}s</span>}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function CoastalContextPage() {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('Day');
  const scenario = SCENARIOS[scenarioKey];
  const videoRef = useRef<HTMLVideoElement>(null);

  const [t, setT] = useState(0);
  const [result, setResult] = useState<ContextResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [evidence, setEvidence] = useState(false);
  const [operator, setOperator] = useState('');
  const [autoStarted, setAutoStarted] = useState(false);
  const [alerted, setAlerted] = useState(false);
  const [engineOnline, setEngineOnline] = useState<boolean | null>(null);

  // Active events (elapsed)
  const activeEvents = useMemo(
    () => scenario.events.filter(e => t >= e.at),
    [scenario, t]
  );

  // Reset state on scenario change
  useEffect(() => {
    setT(0);
    setResult(null);
    setEvidence(false);
    setOperator('');
    setAutoStarted(false);
    setAlerted(false);
    const v = videoRef.current;
    if (v) { v.load(); v.play().catch(() => {}); }
  }, [scenarioKey]);

  // Check engine health on mount
  useEffect(() => {
    contextEngineApi.health().then(h => setEngineOnline(h?.status === 'ok'));
  }, []);

  const evaluate = useCallback(async () => {
    setBusy(true);
    try {
      const res = await contextEngineApi.evaluateObservations({
        zone_id: scenario.zone,
        hour: scenario.hour,
        contact_id: scenario.contact,
        sensor: scenario.sensor,
        observations: scenario.events.map(e => e.code),
      });
      setResult(res);
      if (res.attention_level === 'ATTENTION' && !alerted) {
        setAlerted(true);
        beep();
      }
    } catch (err) {
      console.error('Context Engine unavailable:', err);
    } finally {
      setBusy(false);
    }
  }, [scenario, alerted]);

  function handleTimeUpdate(e: React.SyntheticEvent<HTMLVideoElement>) {
    const now = e.currentTarget.currentTime;
    setT(now);
    const lastAt = scenario.events[scenario.events.length - 1]?.at ?? 0;
    if (autoStarted && now >= lastAt && !result && !busy) {
      evaluate();
    }
  }

  function handleStartScenario() {
    setAutoStarted(true);
    setResult(null);
    setAlerted(false);
    setOperator('');
    setEvidence(false);
    const v = videoRef.current;
    if (v) { v.currentTime = 0; v.play().catch(() => {}); }
  }

  return (
    <div className="page-root" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem', minHeight: 0, overflowY: 'auto' }}>

      {/* ── Page Header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '0.5rem', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Anchor style={{ width: 20, height: 20, color: '#60a5fa' }} strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Persistent Coastal Contact &amp; Context Intelligence
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Continuous UAV observation → contact history → contextual attention → Police review
            </p>
          </div>
        </div>

        {/* Engine status pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.35rem 0.85rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
          letterSpacing: '0.07em', textTransform: 'uppercase',
          background: engineOnline === null ? 'rgba(255,255,255,0.05)'
            : engineOnline ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${engineOnline === null ? 'var(--border)'
            : engineOnline ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
          color: engineOnline === null ? 'var(--text-muted)' : engineOnline ? '#4ade80' : '#f87171',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
          {engineOnline === null ? 'Checking...' : engineOnline ? 'Context Engine Online' : 'Context Engine Offline'}
        </div>
      </div>

      {/* ── Scenario Tabs ────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {SCENARIO_KEYS.map(k => (
          <button key={k} onClick={() => setScenarioKey(k)} style={{
            padding: '0.45rem 1rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${k === scenarioKey ? 'rgba(59,130,246,0.6)' : 'var(--border)'}`,
            background: k === scenarioKey ? 'rgba(59,130,246,0.15)' : 'transparent',
            color: k === scenarioKey ? '#93c5fd' : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}>
            {SCENARIO_TAB_LABELS[k]}
          </button>
        ))}
      </div>

      {/* ── Main Content Grid ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>

        {/* LEFT — Video & Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Video card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Card header */}
            <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Controlled Synthetic Development Footage
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {scenario.title}
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                <div>{scenario.sensor}</div>
                <div>{scenario.condition}</div>
              </div>
            </div>

            {/* Video player */}
            <div style={{ position: 'relative', background: '#000', aspectRatio: '16/9' }}>
              <video
                ref={videoRef}
                controls
                autoPlay
                muted
                loop
                src={scenario.video}
                onTimeUpdate={handleTimeUpdate}
                style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
              />
              {/* HUD overlay */}
              <div style={{
                position: 'absolute', top: 10, left: 10,
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.375rem',
                padding: '0.3rem 0.6rem',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#fff', letterSpacing: '0.05em' }}>
                  {scenario.contact}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#93c5fd', letterSpacing: '0.08em' }}>
                  PERSISTENT CONTACT
                </div>
              </div>
              {/* Timer */}
              <div style={{
                position: 'absolute', top: 10, right: 10,
                background: 'rgba(0,0,0,0.65)', borderRadius: '0.375rem',
                padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: '#d1d5db', fontFamily: 'monospace',
              }}>
                T+{t.toFixed(1)}s
              </div>
            </div>
          </div>

          {/* Timeline card */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock style={{ width: 13, height: 13 }} />
              Observation Timeline
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {scenario.events.map((ev, i) => {
                const seen = t >= ev.at;
                return (
                  <div key={ev.code} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
                    background: seen ? 'rgba(59,130,246,0.08)' : 'transparent',
                    border: `1px solid ${seen ? 'rgba(59,130,246,0.25)' : 'var(--border)'}`,
                    transition: 'all 0.3s ease',
                  }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: seen ? '#3b82f6' : 'var(--text-muted)', fontWeight: 700, minWidth: 20 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span style={{ flex: 1, fontSize: '0.82rem', color: seen ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {ev.label}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      T+{ev.at}s
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Start button */}
            <button
              onClick={handleStartScenario}
              disabled={busy}
              style={{
                marginTop: '1rem', width: '100%', padding: '0.6rem 1rem',
                borderRadius: '0.5rem', border: '1px solid rgba(59,130,246,0.4)',
                background: 'rgba(59,130,246,0.15)', color: '#93c5fd',
                fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.07em',
                cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
            >
              {autoStarted
                ? <><RotateCcw style={{ width: 14, height: 14 }} /> RESTART AUTOMATIC SCENARIO</>
                : <><PlayCircle style={{ width: 14, height: 14 }} /> START AUTOMATIC SCENARIO</>
              }
            </button>
          </div>
        </div>

        {/* RIGHT — Contact Intelligence Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Contact facts card */}
          <div className="card" style={{ padding: '1rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Persistent Coastal Contact
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {scenario.contact}
                </div>
              </div>
              <span style={{
                padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700,
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                color: '#a5b4fc', letterSpacing: '0.07em',
              }}>
                AUTOMATED
              </span>
            </div>

            {/* Facts grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.875rem' }}>
              {[
                { label: 'Sensor', val: scenario.sensor },
                { label: 'Configured Hour', val: `${String(scenario.hour).padStart(2, '0')}:00` },
                { label: 'Observed Events', val: `${activeEvents.length} / ${scenario.events.length}` },
                { label: 'Continuity', val: activeEvents.length ? 'MAINTAINED' : 'ACQUIRING' },
              ].map(f => (
                <div key={f.label} style={{ padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: 'var(--surface-2, rgba(255,255,255,0.03))', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2 }}>{f.label}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{f.val}</div>
                </div>
              ))}
            </div>

            {/* Observable evidence chips */}
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Observable Evidence
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.875rem', minHeight: 32 }}>
              {activeEvents.length === 0
                ? <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Acquiring contact…</span>
                : activeEvents.map(ev => <EventChip key={ev.code} event={ev} seen />)
              }
            </div>

            {/* Evidence discipline */}
            <div style={{ padding: '0.6rem 0.75rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Shield style={{ width: 12, height: 12 }} /> Evidence Discipline
              </div>
              {scenario.doNotClaim.map(x => (
                <div key={x} style={{ fontSize: '0.75rem', color: '#86efac', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 style={{ width: 11, height: 11 }} /> {x}
                </div>
              ))}
            </div>
          </div>

          {/* Context assessment card */}
          <div className="card" style={{ padding: '1rem' }}>
            {!result ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-muted)' }}>
                <Activity style={{ width: 32, height: 32, margin: '0 auto 0.5rem', opacity: 0.4 }} strokeWidth={1.5} />
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
                  Context Assessment Pending
                </div>
                <div style={{ fontSize: '0.75rem' }}>
                  {autoStarted ? 'Evaluating when all events are observed…' : 'Start the automatic scenario to begin evaluation.'}
                </div>
              </div>
            ) : (
              <>
                <AttentionBadge level={result.attention_level} />

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.875rem 0', lineHeight: 1.6 }}>
                  {result.context_summary}
                </p>

                {/* Zone info */}
                <div style={{ padding: '0.6rem 0.75rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', marginBottom: '0.875rem' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2 }}>Police-defined context</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{result.zone_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{result.location}</div>
                </div>

                {/* Reasons */}
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <BookOpen style={{ width: 12, height: 12 }} /> Why?
                </div>
                <ol style={{ margin: '0 0 0.875rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {result.reasons.map((r, i) => (
                    <li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r}</li>
                  ))}
                </ol>

                {/* Recommended action bar */}
                <div style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.08)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                    Recommended System Action
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#93c5fd', marginBottom: '0.6rem' }}>
                    {result.recommended_action.replaceAll('_', ' ')}
                  </div>
                  <button
                    onClick={() => setEvidence(true)}
                    style={{
                      width: '100%', padding: '0.4rem', borderRadius: '0.375rem',
                      border: '1px solid rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.15)',
                      color: '#93c5fd', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    }}
                  >
                    <FileText style={{ width: 13, height: 13 }} /> VIEW EVIDENCE PACKAGE
                    <ChevronRight style={{ width: 13, height: 13 }} />
                  </button>
                </div>

                {/* Interpretation notice */}
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic', lineHeight: 1.5 }}>
                  {result.interpretation_notice}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Evidence Package Section ─────────────────────────── */}
      {result && evidence && (
        <div className="card" style={{ padding: '1.25rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Evidence-Linked Review
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                {scenario.contact} — Evidence Package
              </div>
            </div>
            <button
              onClick={() => setEvidence(false)}
              style={{ padding: '0.3rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Close
            </button>
          </div>

          {/* Evidence grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>

            {/* Contact history */}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.6rem' }}>Contact History</div>
              {scenario.events.map(ev => (
                <div key={ev.code} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  <span style={{ fontFamily: 'monospace', color: '#93c5fd', flexShrink: 0 }}>T+{ev.at}s</span>
                  {ev.label}
                </div>
              ))}
            </div>

            {/* Context explanation */}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.6rem' }}>Context Explanation</div>
              {result.reasons.map((r, i) => (
                <p key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 0.4rem', lineHeight: 1.5 }}>
                  • {r}
                </p>
              ))}
            </div>

            {/* Human decision */}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserCheck style={{ width: 15, height: 15 }} /> Human Decision
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { label: 'Acknowledge & Monitor', action: 'ACKNOWLEDGED & MONITORING', color: '#22c55e' },
                  { label: 'Mark as Normal', action: 'MARKED AS NORMAL', color: 'var(--text-muted)' },
                  { label: 'Forward for Supervisory Review', action: 'FORWARDED FOR SUPERVISORY REVIEW', color: '#f59e0b' },
                ].map(btn => (
                  <button
                    key={btn.action}
                    onClick={() => setOperator(btn.action)}
                    style={{
                      padding: '0.5rem 0.75rem', borderRadius: '0.375rem', cursor: 'pointer',
                      border: `1px solid ${operator === btn.action ? btn.color : 'var(--border)'}`,
                      background: operator === btn.action ? `${btn.color}20` : 'transparent',
                      color: operator === btn.action ? btn.color : 'var(--text-secondary)',
                      fontWeight: 600, fontSize: '0.78rem', textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
                {operator && (
                  <div style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                    <CheckCircle2 style={{ width: 14, height: 14 }} /> {operator}
                  </div>
                )}
              </div>

              {/* Interpretation notice */}
              <div style={{
                marginTop: '1rem', padding: '0.6rem 0.75rem', borderRadius: '0.375rem',
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              }}>
                <p style={{ fontSize: '0.68rem', color: '#fbbf24', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
                  {result.interpretation_notice}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer disclaimer ────────────────────────────────── */}
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', lineHeight: 1.6 }}>
        <strong>Demo boundary:</strong> synthetic video is controlled source material; displayed observations are limited to the supplied evidence manifest. Operational and legal interpretation remains with authorized Kerala Police personnel.
      </div>
    </div>
  );
}

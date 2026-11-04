// ============================================================
// SmartQEye Coastal — Contact Context Panel
// Embeddable widget for the Contact Detail page.
// Allows per-contact context evaluation against Police-defined zones.
// ============================================================

import { useState, useEffect } from 'react';
import { Anchor, AlertTriangle, Eye, CheckCircle2, Loader2 } from 'lucide-react';
import { contextEngineApi } from '@/lib/contextEngineApi';
import type {
  ContextResult,
  ContextZoneProfiles,
  ContextAttentionLevel,
} from '@/types/contextIntelligence';

const BEHAVIOUR_OPTIONS = [
  { code: 'shoreline_approach',    label: 'Shoreline Approach' },
  { code: 'repeated_turns',        label: 'Repeated Manoeuvres' },
  { code: 'high_speed',            label: 'High-Speed Movement' },
  { code: 'loitering',             label: 'Prolonged Loitering' },
  { code: 'abrupt_heading_change', label: 'Abrupt Heading Change' },
  { code: 'vessel_clustering',     label: 'Vessel Clustering' },
  { code: 'low_speed_dwell',       label: 'Low-Speed Dwell' },
  { code: 'repeated_approach',     label: 'Repeated Approach Pattern' },
];

function levelColor(level: ContextAttentionLevel): string {
  if (level === 'ATTENTION') return '#ef4444';
  if (level === 'MONITOR')   return '#f59e0b';
  return '#22c55e';
}

interface Props {
  contactId: string;
}

export function ContactContextPanel({ contactId }: Props) {
  const [profiles, setProfiles] = useState<ContextZoneProfiles | null>(null);
  const [selectedZone, setSelectedZone] = useState('');
  const [hour, setHour] = useState(new Date().getHours());
  const [behaviours, setBehaviours] = useState<string[]>([]);
  const [dwell, setDwell] = useState(0);
  const [result, setResult] = useState<ContextResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Load zone profiles
  useEffect(() => {
    contextEngineApi.profiles().then(p => {
      setProfiles(p);
      const first = Object.keys(p)[0];
      if (first) setSelectedZone(first);
    }).catch(() => setError('Context Engine unavailable'));
  }, []);

  function toggleBehaviour(code: string) {
    setBehaviours(prev =>
      prev.includes(code) ? prev.filter(b => b !== code) : [...prev, code]
    );
  }

  async function handleEvaluate() {
    if (!selectedZone) return;
    setBusy(true);
    setError('');
    try {
      const res = await contextEngineApi.evaluate({
        zone_id: selectedZone,
        hour,
        behaviours,
        dwell_seconds: dwell,
        contact_id: contactId,
      });
      setResult(res);
    } catch (e) {
      setError('Context Engine unavailable. Ensure the service is running on port 8765.');
    } finally {
      setBusy(false);
    }
  }

  if (error && !profiles) {
    return (
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontSize: '0.82rem' }}>
          <AlertTriangle style={{ width: 15, height: 15 }} /> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Anchor style={{ width: 16, height: 16, color: '#60a5fa' }} strokeWidth={2} />
        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
          Context Intelligence Evaluation
        </span>
      </div>

      {!profiles ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Loading zone profiles…
        </div>
      ) : (
        <>
          {/* Controls row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: '0.75rem', marginBottom: '0.75rem' }}>
            {/* Zone selector */}
            <div>
              <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Police Zone
              </label>
              <select
                value={selectedZone}
                onChange={e => setSelectedZone(e.target.value)}
                style={{
                  width: '100%', padding: '0.4rem 0.6rem', borderRadius: '0.375rem',
                  border: '1px solid var(--border)', background: 'var(--surface-2, #1a1a2e)',
                  color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer',
                }}
              >
                {Object.entries(profiles).map(([id, z]) => (
                  <option key={id} value={id}>{z.name}</option>
                ))}
              </select>
            </div>

            {/* Hour */}
            <div>
              <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Hour (0–23)
              </label>
              <input
                type="number" min={0} max={23} value={hour}
                onChange={e => setHour(Number(e.target.value))}
                style={{
                  width: '100%', padding: '0.4rem 0.6rem', borderRadius: '0.375rem',
                  border: '1px solid var(--border)', background: 'var(--surface-2, #1a1a2e)',
                  color: 'var(--text-primary)', fontSize: '0.8rem',
                }}
              />
            </div>

            {/* Dwell */}
            <div>
              <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Dwell (sec)
              </label>
              <input
                type="number" min={0} value={dwell}
                onChange={e => setDwell(Number(e.target.value))}
                style={{
                  width: '100%', padding: '0.4rem 0.6rem', borderRadius: '0.375rem',
                  border: '1px solid var(--border)', background: 'var(--surface-2, #1a1a2e)',
                  color: 'var(--text-primary)', fontSize: '0.8rem',
                }}
              />
            </div>
          </div>

          {/* Behaviour flags */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Observed Behaviours
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {BEHAVIOUR_OPTIONS.map(b => {
                const active = behaviours.includes(b.code);
                return (
                  <button
                    key={b.code}
                    onClick={() => toggleBehaviour(b.code)}
                    style={{
                      padding: '0.3rem 0.65rem', borderRadius: 999, fontSize: '0.75rem', cursor: 'pointer',
                      border: `1px solid ${active ? 'rgba(59,130,246,0.5)' : 'var(--border)'}`,
                      background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                      color: active ? '#93c5fd' : 'var(--text-muted)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Evaluate button */}
          <button
            onClick={handleEvaluate}
            disabled={busy || !selectedZone}
            style={{
              width: '100%', padding: '0.5rem', borderRadius: '0.375rem',
              border: '1px solid rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.15)',
              color: '#93c5fd', fontWeight: 700, fontSize: '0.8rem', cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.6 : 1, letterSpacing: '0.07em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            {busy && <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
            EVALUATE CONTEXT
          </button>

          {error && (
            <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.5rem' }}>{error}</p>
          )}

          {/* Result */}
          {result && (
            <div style={{
              marginTop: '0.875rem', padding: '0.75rem', borderRadius: '0.5rem',
              border: `1px solid ${levelColor(result.attention_level)}40`,
              background: `${levelColor(result.attention_level)}10`,
            }}>
              {/* Level */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {result.attention_level === 'ATTENTION'
                  ? <AlertTriangle style={{ width: 15, height: 15, color: levelColor(result.attention_level) }} />
                  : result.attention_level === 'MONITOR'
                  ? <Eye style={{ width: 15, height: 15, color: levelColor(result.attention_level) }} />
                  : <CheckCircle2 style={{ width: 15, height: 15, color: levelColor(result.attention_level) }} />
                }
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: levelColor(result.attention_level) }}>
                  {result.attention_level}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  Score: {result.attention_score}/100
                </span>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem', lineHeight: 1.5 }}>
                {result.context_summary}
              </p>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.07em', marginBottom: '0.3rem' }}>
                RECOMMENDED ACTION
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#93c5fd' }}>
                {result.recommended_action.replaceAll('_', ' ')}
              </div>

              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '0.5rem 0 0', fontStyle: 'italic', lineHeight: 1.5 }}>
                {result.interpretation_notice}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

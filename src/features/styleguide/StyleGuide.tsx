// ============================================================
// SmartQEye Coastal — Living Style Guide (/styleguide)
// Palette · Type scale · Severity chips · Feed rings · Buttons
// ============================================================

import { SeverityChip, SeverityDot } from '@/components/SeverityChip';
import { FeedStateChip, ModalityChip, StatusDot } from '@/components/FeedStateChip';
import { cn } from '@/lib/utils';
import type { Severity, FeedState } from '@/types';

const SEVERITIES: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
const FEED_STATES: FeedState[] = ['LIVE', 'BUFFERING', 'NO_SIGNAL', 'RECORDED', 'EDGE_SYNC_LAG'];

// ─── Section wrapper ──────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-serif text-lg font-semibold mb-4 pb-2 border-b" style={{ borderColor: 'var(--line)', color: 'var(--text)' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

// ─── Colour swatch ────────────────────────────────────────────

function Swatch({ name, value, dark = false }: { name: string; value: string; dark?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-14 h-14 rounded-xl border-2"
        style={{ background: value, borderColor: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }}
      />
      <span className="text-[10px] font-medium opacity-70 text-center leading-tight">{name}</span>
      <span className="text-[9px] font-mono opacity-40">{value}</span>
    </div>
  );
}

// ─── Buoy marker demo ─────────────────────────────────────────

function BuoyMarker({ severity }: { severity: Severity }) {
  const colours: Record<Severity, string> = {
    CRITICAL: '#C8352E', HIGH: '#E06A3B', MEDIUM: '#E0A526', LOW: '#3FAE9A', INFO: '#2B7FA6',
  };
  const glyphs: Record<Severity, string> = {
    CRITICAL: '⬛', HIGH: '⬟', MEDIUM: '◆', LOW: '▲', INFO: '●',
  };
  const colour = colours[severity];

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Buoy body */}
      <div className="relative" style={{ width: 28, height: 44 }}>
        {/* Stem */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-3" style={{ background: colour + '80' }} />
        {/* Float body */}
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center"
          style={{ width: 22 }}
        >
          {/* Top dome */}
          <div style={{ width: 16, height: 8, background: colour, borderRadius: '50% 50% 0 0' }} />
          {/* Mid band */}
          <div style={{ width: 22, height: 12, background: colour, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 8, color: 'white', fontWeight: 'bold' }}>{glyphs[severity]}</span>
          </div>
          {/* Bottom dome */}
          <div style={{ width: 16, height: 8, background: colour + 'CC', borderRadius: '0 0 50% 50%' }} />
        </div>
      </div>
      <span className="text-[9px] font-mono opacity-60">{severity}</span>
    </div>
  );
}

// ─── Style Guide page ─────────────────────────────────────────

export default function StyleGuide() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white p-2 border shadow-xs flex items-center justify-center flex-shrink-0" style={{ borderColor: 'var(--line)' }}>
            <img src="/QW_logo.png" alt="Quantumweave Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold mb-1">SmartQEye Coastal</h1>
            <p className="text-sm opacity-50">Living Style Guide — Quantumweave Intelligence · Chart Table design system</p>
            <div className="mt-1 text-xs font-mono opacity-40">Light theme ↔ Dark theme · Both must pass WCAG 2.1 AA</div>
          </div>
        </div>

        {/* Colour palette */}
        <Section title="Colour Palette">
          <div className="mb-4">
            <p className="text-xs opacity-50 mb-3">Sand palette (light theme base)</p>
            <div className="flex flex-wrap gap-4">
              <Swatch name="sand-50" value="#FBF7EC" />
              <Swatch name="sand-100" value="#F5ECD3" />
              <Swatch name="sand-200" value="#EEDFB5" />
              <Swatch name="sand-300" value="#E3CD93" />
              <Swatch name="sand-400" value="#CDB872" />
            </div>
          </div>
          <div className="mb-4">
            <p className="text-xs opacity-50 mb-3">Sea palette</p>
            <div className="flex flex-wrap gap-4">
              <Swatch name="sea-100" value="#E3F3FA" />
              <Swatch name="sea-200" value="#BFE3F2" />
              <Swatch name="sea-400" value="#6FB7D6" />
              <Swatch name="sea-600" value="#2B7FA6" />
              <Swatch name="sea-700" value="#1B5E7D" />
            </div>
          </div>
          <div className="mb-4">
            <p className="text-xs opacity-50 mb-3">Ink palette</p>
            <div className="flex flex-wrap gap-4">
              <Swatch name="ink-900" value="#12303F" />
              <Swatch name="ink-700" value="#2E566E" />
              <Swatch name="ink-600" value="#4B6572" />
              <Swatch name="ink-400" value="#8EA5B3" />
            </div>
          </div>
          <div>
            <p className="text-xs opacity-50 mb-3">Severity colours (+ shape glyphs, never colour alone)</p>
            <div className="flex flex-wrap gap-4">
              <Swatch name="CRITICAL" value="#C8352E" />
              <Swatch name="HIGH" value="#E06A3B" />
              <Swatch name="MEDIUM" value="#E0A526" />
              <Swatch name="LOW" value="#3FAE9A" />
              <Swatch name="INFO" value="#2B7FA6" />
            </div>
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div className="space-y-4">
            <div>
              <p className="text-xs opacity-40 mb-1 uppercase tracking-wider">Fraunces (Serif) — Headings</p>
              <div className="font-serif">
                <div className="text-4xl font-bold leading-tight">SmartQEye Coastal</div>
                <div className="text-2xl font-semibold mt-1">Coastal Surveillance Platform</div>
                <div className="text-lg mt-1">Alert Queue · Incident Detail</div>
              </div>
            </div>
            <div>
              <p className="text-xs opacity-40 mb-1 uppercase tracking-wider">Manrope (Sans) — Body</p>
              <p className="text-sm leading-relaxed" style={{ maxWidth: '480px' }}>
                Describes observed activity only. Interpretation rests with authorised personnel. All access is audited and logged per Kerala Police IT security policy.
              </p>
              <p className="text-xs opacity-60 mt-1">12px body text · 14px default · 16px lead</p>
            </div>
            <div>
              <p className="text-xs opacity-40 mb-1 uppercase tracking-wider">JetBrains Mono — Coordinates / IDs / Timestamps</p>
              <div className="font-mono text-sm space-y-1">
                <div className="tabular">8.3800°N 76.9820°E · Alt 120 m · Hdg 042°</div>
                <div className="tabular">14:31:09 IST  ·  SHA-256: 9f3a2c8d1e4f…</div>
                <div className="tabular">C-1042  ·  ALR-20261016-0001  ·  MSN-20261016-0830-01-VIZHINJAM</div>
              </div>
            </div>
          </div>
        </Section>

        {/* Severity chips */}
        <Section title="Severity Chips & Dots">
          <div className="space-y-4">
            <div>
              <p className="text-xs opacity-40 mb-2 uppercase tracking-wider">Chips (shape glyph + label — never colour alone)</p>
              <div className="flex flex-wrap items-center gap-3">
                {SEVERITIES.map(sev => (
                  <div key={sev} className="flex flex-col items-center gap-1.5">
                    <SeverityChip severity={sev} size="lg" />
                    <SeverityChip severity={sev} size="md" />
                    <SeverityChip severity={sev} size="sm" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs opacity-40 mb-2 uppercase tracking-wider">Dots</p>
              <div className="flex items-center gap-4">
                {SEVERITIES.map(sev => (
                  <div key={sev} className="flex flex-col items-center gap-1.5">
                    <SeverityDot severity={sev} pulse={sev === 'CRITICAL'} />
                    <span className="text-[10px] opacity-50">{sev.slice(0,4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Feed state rings */}
        <Section title="Feed State Chips & Porthole Rings">
          <div className="space-y-4">
            <div>
              <p className="text-xs opacity-40 mb-2 uppercase tracking-wider">State chips</p>
              <div className="flex flex-wrap gap-3">
                {FEED_STATES.map(state => <FeedStateChip key={state} state={state} />)}
              </div>
            </div>
            <div>
              <p className="text-xs opacity-40 mb-2 uppercase tracking-wider">Porthole rings (feed tiles)</p>
              <div className="flex gap-3">
                {FEED_STATES.map(state => {
                  const colours: Record<FeedState, string> = {
                    LIVE: '#2ECC71', BUFFERING: '#E0A526', NO_SIGNAL: '#C8352E', RECORDED: '#2B7FA6', EDGE_SYNC_LAG: '#9B59B6',
                  };
                  return (
                    <div
                      key={state}
                      className="w-24 h-16 rounded-xl flex items-center justify-center text-xs font-mono opacity-60"
                      style={{
                        background: '#030C14',
                        outline: `2px solid ${colours[state]}`,
                        color: 'white',
                        fontSize: '9px',
                        textAlign: 'center',
                      }}
                    >
                      {state.replace(/_/g, '\n')}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-xs opacity-40 mb-2 uppercase tracking-wider">Modality chips</p>
              <div className="flex gap-2">
                <ModalityChip modality="RGB" />
                <ModalityChip modality="THERMAL" />
              </div>
            </div>
          </div>
        </Section>

        {/* Buoy markers */}
        <Section title="Buoy Alert Markers">
          <p className="text-xs opacity-50 mb-4">Map alert pins — severity-coloured buoy shape + shape glyph</p>
          <div className="flex items-end gap-8">
            {SEVERITIES.map(sev => <BuoyMarker key={sev} severity={sev} />)}
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons & Inputs">
          <div className="space-y-4">
            <div>
              <p className="text-xs opacity-40 mb-2 uppercase tracking-wider">Primary actions</p>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'var(--sea-600)', color: 'white' }}>
                  Primary Action
                </button>
                <button className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'var(--sand-200)', color: 'var(--ink-900)' }}>
                  Sand Action
                </button>
                <button className="px-4 py-2 rounded-xl text-sm font-medium border" style={{ borderColor: 'var(--line)', color: 'var(--text)' }}>
                  Outline
                </button>
                <button className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: 'var(--sea-100)', color: 'var(--sea-600)' }}>
                  Pill Button
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs opacity-40 mb-2 uppercase tracking-wider">Severity action buttons</p>
              <div className="flex flex-wrap gap-3">
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium border" style={{ borderColor: 'var(--sev-low)', color: 'var(--sev-low)' }}>Acknowledge</button>
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium border" style={{ borderColor: 'var(--sev-high)', color: 'var(--sev-high)' }}>Escalate</button>
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium border" style={{ borderColor: 'var(--sev-critical)', color: 'var(--sev-critical)' }}>Critical Action</button>
              </div>
            </div>
            <div>
              <p className="text-xs opacity-40 mb-2 uppercase tracking-wider">Input fields</p>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <input type="text" placeholder="Text input…" className="px-3 py-2 rounded-xl text-sm border outline-none" style={{ background: 'var(--raised)', borderColor: 'var(--line)', color: 'var(--text)' }} />
                <input type="text" placeholder="Focused…" className="px-3 py-2 rounded-xl text-sm border outline-none ring-2 ring-[var(--sea-400)]" style={{ background: 'var(--raised)', borderColor: 'var(--sea-400)', color: 'var(--text)' }} />
              </div>
            </div>
          </div>
        </Section>

        {/* Surface panels */}
        <Section title="Surface Panels">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="panel p-4">
              <div className="text-xs font-medium mb-1">.panel</div>
              <div className="text-xs opacity-50">Sand-100 bg + chart grid texture</div>
            </div>
            <div className="raised p-4">
              <div className="text-xs font-medium mb-1">.raised</div>
              <div className="text-xs opacity-50">White / raised surface</div>
            </div>
            <div className="chart-paper p-4 rounded-xl border" style={{ borderColor: 'var(--line)' }}>
              <div className="text-xs font-medium mb-1">.chart-paper</div>
              <div className="text-xs opacity-50">Grid texture overlay, visible at low opacity</div>
            </div>
          </div>
        </Section>

        {/* Tide divider */}
        <Section title="Tide Divider">
          <p className="text-xs opacity-50 mb-3">Wavy SVG line replaces plain borders between sections</p>
          <div className="tide-divider" />
          <p className="text-xs opacity-50 mt-3">Content below the tide divider</p>
        </Section>

        {/* Status dots */}
        <Section title="Service Status Dots">
          <div className="flex items-center gap-6">
            <StatusDot status="OK" label="OK" />
            <StatusDot status="DEGRADED" label="Degraded" />
            <StatusDot status="DOWN" label="Down" />
            <StatusDot status="UNKNOWN" label="Unknown" />
          </div>
        </Section>
      </div>
    </div>
  );
}

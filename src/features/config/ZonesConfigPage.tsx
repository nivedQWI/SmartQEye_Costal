// ============================================================
// SmartQEye Coastal — Zones & Kerala Coastal Context Intelligence (Proposal 5.1.16, 5.1.10)
// Zone perimeter definition, seasonal context profile editor, and "Same movement, different context" comparison
// ============================================================

import { useState } from 'react';
import {
  Sliders, Shield, MapPin, Clock, Plus, Edit, Check, Bell,
  Calendar, Anchor, FileText, ArrowRight, Eye, RefreshCw,
  AlertTriangle, History, CheckCircle2, ChevronRight, Scale
} from 'lucide-react';
import { CONTEXT_PROFILES, ZONES } from '@/lib/mockData';
import { AttentionBadge } from '@/components/AttentionBadge';
import { HumanInterpretationNote } from '@/components/HumanInterpretationNote';
import { cn } from '@/lib/utils';
import type { ContextProfileDetail, CoastalSeason, ApprovalState, AttentionLevel } from '@/types';

export default function ZonesConfigPage() {
  const [profiles, setProfiles] = useState<ContextProfileDetail[]>(CONTEXT_PROFILES);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(CONTEXT_PROFILES[0].id);
  const [activeSection, setActiveSection] = useState<'profiles' | 'comparison' | 'zones'>('profiles');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Comparison panel state
  const [compareProfileAId, setCompareProfileAId] = useState<string>('cp-02'); // Fishing Daytime
  const [compareProfileBId, setCompareProfileBId] = useState<string>('cp-01'); // Restricted Jetty Monsoon

  const activeProfile = profiles.find(p => p.id === selectedProfileId) ?? profiles[0];
  const compareA = profiles.find(p => p.id === compareProfileAId) ?? profiles[1];
  const compareB = profiles.find(p => p.id === compareProfileBId) ?? profiles[0];

  const updateActiveThreshold = (key: keyof ContextProfileDetail['thresholds'], val: number) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== activeProfile.id) return p;
      return {
        ...p,
        thresholds: {
          ...p.thresholds,
          [key]: val,
        },
        version: `v${(parseFloat(p.version.replace('v', '')) + 0.1).toFixed(1)}`,
      };
    }));
  };

  const updateActiveSensitivity = (sensitivity: ContextProfileDetail['sensitivity']) => {
    setProfiles(prev => prev.map(p => p.id === activeProfile.id ? { ...p, sensitivity } : p));
  };

  const updateActiveSeason = (season: CoastalSeason) => {
    setProfiles(prev => prev.map(p => p.id === activeProfile.id ? { ...p, season } : p));
  };

  const advanceApprovalState = () => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== activeProfile.id) return p;
      const nextState: ApprovalState =
        p.approvalState === 'DRAFT' ? 'APPROVED_BY_ZONE_ADMIN' :
        p.approvalState === 'APPROVED_BY_ZONE_ADMIN' ? 'ACTIVE' : 'DRAFT';
      return {
        ...p,
        approvalState: nextState,
        history: [
          {
            version: p.version,
            changedAt: new Date().toISOString(),
            changedBy: 'CI Krishna N. (Zone Admin)',
            summary: `Approval state transitioned to ${nextState}`,
          },
          ...p.history,
        ],
      };
    }));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--surface)] text-[var(--sea-600)] border" style={{ borderColor: 'var(--line)' }}>
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold">Zones &amp; Kerala Coastal Context Intelligence</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                PROPOSAL 5.1.16 &amp; 5.1.10
              </span>
            </div>
            <p className="text-xs opacity-60">
              Per-zone operational context profiles, seasonal thresholds (trawling ban / tourist peak), and multi-criteria attention policies
            </p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface)] border" style={{ borderColor: 'var(--line)' }}>
          <button
            onClick={() => setActiveSection('profiles')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeSection === 'profiles'
                ? 'bg-[var(--panel)] text-[var(--sea-600)] shadow-xs'
                : 'opacity-60 hover:opacity-100'
            )}
          >
            Context Profiles Editor
          </button>
          <button
            onClick={() => setActiveSection('comparison')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
              activeSection === 'comparison'
                ? 'bg-[var(--panel)] text-[var(--sea-600)] shadow-xs'
                : 'opacity-60 hover:opacity-100'
            )}
          >
            <Scale className="w-3.5 h-3.5" />
            Same Movement / Different Context
          </button>
          <button
            onClick={() => setActiveSection('zones')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeSection === 'zones'
                ? 'bg-[var(--panel)] text-[var(--sea-600)] shadow-xs'
                : 'opacity-60 hover:opacity-100'
            )}
          >
            Zone Geofences ({ZONES.length})
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* ─── SECTION 1: CONTEXT PROFILES EDITOR ─── */}
        {activeSection === 'profiles' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column: Profile Selector */}
            <div className="col-span-4 space-y-3">
              <h3 className="font-serif text-sm font-bold opacity-75 uppercase tracking-wider text-[11px]">
                Configured Context Profiles
              </h3>

              <div className="space-y-2">
                {profiles.map(p => {
                  const isSelected = p.id === activeProfile.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProfileId(p.id)}
                      className={cn(
                        'p-3.5 rounded-xl border text-left cursor-pointer transition-all',
                        isSelected
                          ? 'border-[var(--sea-600)] bg-[var(--surface-hover)] shadow-xs'
                          : 'border-[var(--line)] bg-[var(--panel)] hover:border-slate-400'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] font-bold text-[var(--sea-600)]">{p.code}</span>
                        <span className={cn(
                          'px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase',
                          p.approvalState === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : p.approvalState === 'APPROVED_BY_ZONE_ADMIN'
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-amber-500/10 text-amber-600'
                        )}>
                          {p.approvalState.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="font-serif text-xs font-bold leading-tight">{p.name}</h4>
                      <div className="flex items-center gap-2 mt-2 text-[10px] font-mono opacity-60">
                        <span>{p.zoneType}</span>
                        <span>•</span>
                        <span>{p.season.replace(/_/g, ' ')}</span>
                        <span>•</span>
                        <span>{p.version}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Detailed Policy Editor */}
            <div className="col-span-8 space-y-5 p-6 rounded-2xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              {/* Profile Card Header */}
              <div className="flex items-start justify-between border-b pb-4" style={{ borderColor: 'var(--line)' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--sea-600)]">{activeProfile.code}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600">
                      VERSION {activeProfile.version}
                    </span>
                    <AttentionBadge level={activeProfile.defaultAttentionLevel} size="sm" showWhyButton={false} />
                  </div>
                  <h2 className="font-serif text-base font-bold mt-1">{activeProfile.name}</h2>
                  <p className="text-xs opacity-60 mt-0.5">
                    Mission Profile: {activeProfile.missionProfile} · Owner: {activeProfile.owner}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="px-2.5 py-1.5 rounded-lg border text-xs font-mono hover:bg-[var(--surface-hover)] flex items-center gap-1"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <History className="w-3.5 h-3.5" /> History ({activeProfile.history.length})
                  </button>
                  <button
                    onClick={advanceApprovalState}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors shadow-xs',
                      activeProfile.approvalState === 'ACTIVE'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : activeProfile.approvalState === 'APPROVED_BY_ZONE_ADMIN'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-amber-600 hover:bg-amber-700'
                    )}
                  >
                    {activeProfile.approvalState === 'ACTIVE'
                      ? 'Active (Re-Draft)'
                      : activeProfile.approvalState === 'APPROVED_BY_ZONE_ADMIN'
                      ? 'Activate Profile'
                      : 'Submit for Zone Admin Approval'}
                  </button>
                </div>
              </div>

              {/* Season & Time Window Matrix */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-[var(--surface)] border space-y-1.5" style={{ borderColor: 'var(--line)' }}>
                  <span className="text-[10px] font-mono uppercase opacity-50 block font-bold">Kerala Coastal Season</span>
                  <select
                    value={activeProfile.season}
                    onChange={(e) => updateActiveSeason(e.target.value as CoastalSeason)}
                    className="w-full text-xs font-semibold rounded p-1 border bg-[var(--panel)]"
                    style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                  >
                    <option value="STANDARD">Standard Season</option>
                    <option value="TRAWLING_BAN_MONSOON">Monsoon Trawling Ban</option>
                    <option value="TOURIST_PEAK">Peak Tourist Season</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-[var(--surface)] border space-y-1.5" style={{ borderColor: 'var(--line)' }}>
                  <span className="text-[10px] font-mono uppercase opacity-50 block font-bold">Operational Time Window</span>
                  <div className="text-xs font-mono font-bold text-[var(--sea-600)] pt-1">
                    {activeProfile.timeWindow.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--surface)] border space-y-1.5" style={{ borderColor: 'var(--line)' }}>
                  <span className="text-[10px] font-mono uppercase opacity-50 block font-bold">Sensitivity Profile</span>
                  <div className="flex items-center gap-1 pt-1">
                    {(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'] as const).map(sens => (
                      <button
                        key={sens}
                        onClick={() => updateActiveSensitivity(sens)}
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all',
                          activeProfile.sensitivity === sens
                            ? 'bg-red-500 text-white'
                            : 'bg-[var(--panel)] border text-[var(--text)] opacity-60'
                        )}
                        style={{ borderColor: 'var(--line)' }}
                      >
                        {sens[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Threshold Sliders */}
              <div className="space-y-4 pt-2">
                <h3 className="font-serif text-sm font-bold">Behavioural &amp; Kinematic Threshold Matrix</h3>

                <div className="space-y-4">
                  {/* Dwell Minutes */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span>Max In-Zone Dwell Allowance:</span>
                      <span className="font-bold text-[var(--sea-600)]">{activeProfile.thresholds.dwellMinutes} minutes</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="30"
                      step="0.5"
                      value={activeProfile.thresholds.dwellMinutes}
                      onChange={(e) => updateActiveThreshold('dwellMinutes', parseFloat(e.target.value))}
                      className="w-full accent-[var(--sea-600)]"
                    />
                    <span className="text-[10px] opacity-50 font-mono block">
                      Target exceeding this dwell inside zone triggers operational attention elevation.
                    </span>
                  </div>

                  {/* Max Speed */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span>Max Speed Threshold (Non-transit):</span>
                      <span className="font-bold text-[var(--sea-600)]">{activeProfile.thresholds.maxSpeedKnots} knots</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="25.0"
                      step="0.5"
                      value={activeProfile.thresholds.maxSpeedKnots}
                      onChange={(e) => updateActiveThreshold('maxSpeedKnots', parseFloat(e.target.value))}
                      className="w-full accent-[var(--sea-600)]"
                    />
                  </div>

                  {/* Shoreline Approach Count */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span>Repeated Shoreline Approaches in Window:</span>
                      <span className="font-bold text-[var(--sea-600)]">{activeProfile.thresholds.shorelineApproachCount} incursions</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={activeProfile.thresholds.shorelineApproachCount}
                      onChange={(e) => updateActiveThreshold('shorelineApproachCount', parseInt(e.target.value))}
                      className="w-full accent-[var(--sea-600)]"
                    />
                  </div>

                  {/* Proximity Separation */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span>Vessel Proximity Separation Threshold:</span>
                      <span className="font-bold text-[var(--sea-600)]">{activeProfile.thresholds.proximitySeparationMetres} metres</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={activeProfile.thresholds.proximitySeparationMetres}
                      onChange={(e) => updateActiveThreshold('proximitySeparationMetres', parseInt(e.target.value))}
                      className="w-full accent-[var(--sea-600)]"
                    />
                  </div>

                  {/* Crowd Count */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span>Promenade / Landing Beach Crowd Surge Threshold:</span>
                      <span className="font-bold text-[var(--sea-600)]">{activeProfile.thresholds.crowdCount} persons</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={activeProfile.thresholds.crowdCount}
                      onChange={(e) => updateActiveThreshold('crowdCount', parseInt(e.target.value))}
                      className="w-full accent-[var(--sea-600)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── SECTION 2: SAME MOVEMENT, DIFFERENT CONTEXT ─── */}
        {activeSection === 'comparison' && (
          <div className="space-y-6">
            {/* Scenario Header Banner */}
            <div className="p-5 rounded-2xl border bg-[var(--panel)] space-y-2" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  EMPIRICAL COMPARISON EXPERIMENT · PROPOSAL 5.1.10
                </span>
                <span className="text-xs font-mono opacity-60">
                  Fixed Kinematic Input: 1 Track · 2 Different Kerala Context Profiles
                </span>
              </div>
              <h2 className="font-serif text-lg font-bold">Same Movement, Different Context Comparison</h2>
              <p className="text-xs opacity-75 max-w-3xl leading-relaxed">
                Demonstrating why rigid rule-based systems fail in coastal policing. An identical kinematic pattern (an artisanal craft drifting stationary for 15 minutes at 02:30 IST) is evaluated concurrently under two distinct Kerala coastal profiles.
              </p>
            </div>

            {/* Test Movement Description Card */}
            <div className="p-4 rounded-xl border bg-[var(--surface)] font-mono text-xs space-y-2" style={{ borderColor: 'var(--line)' }}>
              <div className="font-bold text-[var(--sea-600)] flex items-center gap-2">
                <Clock className="w-4 h-4" /> TEST MOVEMENT CASE #TM-20261016-042
              </div>
              <div className="grid grid-cols-4 gap-4 opacity-80 pt-1 text-[11px]">
                <div>CRAFT: Motorised Country Craft (1.8m beam)</div>
                <div>OBSERVED DWELL: 15 minutes stationary drift</div>
                <div>TIMESTAMP: 02:30 IST (Night-time monsoon)</div>
                <div>TRANSPONDER: AIS Non-transmitting (Dark craft)</div>
              </div>
            </div>

            {/* Side-by-Side Comparison Columns */}
            <div className="grid grid-cols-2 gap-6">
              {/* Profile A Column */}
              <div className="p-5 rounded-2xl border space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase opacity-50 block font-bold">Profile A</span>
                  <h3 className="font-serif text-base font-bold text-teal-600 dark:text-teal-400">{compareA.name}</h3>
                  <div className="flex items-center gap-2 text-xs font-mono opacity-60">
                    <span>{compareA.zoneType}</span>
                    <span>•</span>
                    <span>{compareA.season.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-slate-500/5 space-y-3" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase font-bold opacity-70">Automated Verdict</span>
                    <AttentionBadge level="RECORD_ONLY" size="md" showWhyButton={false} />
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-[var(--text)] block">Context Reasoning:</span>
                    <p className="opacity-75 leading-relaxed">
                      Evaluated as standard artisanal gillnet drift pattern. Within designated artisanal fishing grounds, stationary drift up to 20 minutes is routine maritime practice during licensed daytime/evening cycles.
                    </p>
                  </div>

                  <div className="pt-2 border-t text-[11px] font-mono space-y-1" style={{ borderColor: 'var(--line)' }}>
                    <div className="flex items-center justify-between text-emerald-600">
                      <span>Operator Alert Raised:</span>
                      <strong>NO (0 alerts)</strong>
                    </div>
                    <div className="flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
                      <span>Action Recommended:</span>
                      <span>Passive observation ledger</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile B Column */}
              <div className="p-5 rounded-2xl border space-y-4 border-red-500/40" style={{ background: 'var(--panel)' }}>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-red-500 block font-bold">Profile B</span>
                  <h3 className="font-serif text-base font-bold text-red-600 dark:text-red-400">{compareB.name}</h3>
                  <div className="flex items-center gap-2 text-xs font-mono opacity-60">
                    <span>{compareB.zoneType}</span>
                    <span>•</span>
                    <span>{compareB.season.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-red-500/5 space-y-3 border-red-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase font-bold text-red-600">Automated Verdict</span>
                    <AttentionBadge level="CRITICAL" size="md" showWhyButton={false} />
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-[var(--text)] block">Context Reasoning:</span>
                    <p className="opacity-75 leading-relaxed">
                      Severe breach of prohibited perimeter during active Monsoon Trawling Ban. Zero-tolerance 30-second dwell threshold exceeded by 14.5 minutes inside high-security fuel terminal approach channel.
                    </p>
                  </div>

                  <div className="pt-2 border-t text-[11px] font-mono space-y-1" style={{ borderColor: 'var(--line)' }}>
                    <div className="flex items-center justify-between text-red-600">
                      <span>Operator Alert Raised:</span>
                      <strong>CRITICAL (SMS + Webhook)</strong>
                    </div>
                    <div className="flex items-center justify-between text-red-600 font-bold">
                      <span>Action Recommended:</span>
                      <span>Recommend patrol response</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── SECTION 3: ZONE GEOFENCES ─── */}
        {activeSection === 'zones' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border flex items-center justify-between" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div>
                <h3 className="font-serif text-sm font-bold">Active Coastal Geofence Polygons ({ZONES.length})</h3>
                <p className="text-xs opacity-60">Versioned spatial polygons linked to context profiles across the Thiruvananthapuram coastline</p>
              </div>
              <button
                onClick={() => alert('Polygon geometry editing available in GIS Map view')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Draw New Geofence
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ZONES.map(z => (
                <div key={z.id} className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--sea-600)]">{z.code}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase bg-[var(--surface)] border border-[var(--line)]">
                        {z.type}
                      </span>
                    </div>
                    <span className="text-xs font-mono opacity-50">Version {z.version}</span>
                  </div>
                  <h4 className="font-serif text-sm font-bold">{z.name}</h4>
                  <div className="text-[11px] font-mono opacity-60">
                    Profile Linked: {z.profileId} · Color: {z.color}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Human in the loop note */}
        <HumanInterpretationNote />
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl bg-[var(--raised)] text-[var(--text)]" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-bold">Profile Audit &amp; Version History</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-xs font-mono p-1 rounded hover:bg-[var(--surface-hover)] cursor-pointer"
              >
                ✕ CLOSE
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {activeProfile.history.map((h, idx) => (
                <div key={idx} className="p-3 rounded-lg border text-xs font-mono space-y-1" style={{ background: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--text)' }}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-[var(--sea-600)] dark:text-[var(--sea-accent)]">{h.version}</span>
                    <span className="opacity-70" style={{ color: 'var(--text-muted)' }}>{new Date(h.changedAt).toLocaleDateString()}</span>
                  </div>
                  <p className="opacity-90">{h.summary}</p>
                  <span className="text-[10px] opacity-70 block pt-0.5" style={{ color: 'var(--text-muted)' }}>Signed by: {h.changedBy}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

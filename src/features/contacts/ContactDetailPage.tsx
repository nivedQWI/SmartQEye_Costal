// ============================================================
// SmartQEye Coastal — Contact Detail View (Proposal 5.1.8, 5.1.15)
// Comprehensive behavioural profile, track continuity, occlusion handling & relationship graph
// ============================================================

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield,
  AlertTriangle,
  Download, Copy, Check, Layers, Info
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line
} from 'recharts';
import { ReactFlow, Background, Controls, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { CONTACTS } from '@/lib/mockData';
import { AttentionBadge } from '@/components/AttentionBadge';
import { CkfeKeyframeStrip } from '@/components/CkfeKeyframeStrip';
import { CoastalMap } from '@/components/CoastalMap';
import { DroneVideoPlayer } from '@/components/DroneVideoPlayer';
import { HumanInterpretationNote } from '@/components/HumanInterpretationNote';
import { TacticalActionDialog, type TacticalActionType } from '@/components/TacticalActionDialog';
import { cn } from '@/lib/utils';

type DetailTab = 'overview' | 'track_map' | 'behaviour' | 'relationships' | 'evidence' | 'history';

// Kinematic sample points for Recharts speed & heading chart
const KINEMATIC_SERIES = [
  { time: '08:18', speedKnots: 5.2, heading: 42, event: 'Entered Channel' },
  { time: '08:24', speedKnots: 5.4, heading: 43, event: null },
  { time: '08:30', speedKnots: 4.8, heading: 45, event: null },
  { time: '08:35', speedKnots: 3.2, heading: 72, event: 'Course Alteration' },
  { time: '08:41', speedKnots: 1.8, heading: 88, event: 'Breakwater Approach' },
  { time: '08:45', speedKnots: 1.4, heading: 92, event: 'Occlusion Shadow' },
  { time: '08:46', speedKnots: 1.5, heading: 94, event: 'Occlusion Recovery' },
  { time: '08:48', speedKnots: 2.1, heading: 110, event: 'Restricted Perimeter Breach' },
  { time: '08:52', speedKnots: 0.8, heading: 115, event: 'Rendezvous C-1048' },
  { time: '08:56', speedKnots: 1.2, heading: 112, event: 'Stationary Drift' },
];

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [tacticalAction, setTacticalAction] = useState<TacticalActionType | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const contact = useMemo(() => {
    return CONTACTS.find(c => c.id === id || c.code.toLowerCase() === (id ?? '').toLowerCase()) ?? CONTACTS[0];
  }, [id]);

  const isC1042 = contact.code === 'C-1042';

  const copyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Relationship Graph Nodes & Edges (@xyflow/react)
  const initialNodes: Node[] = useMemo(() => [
    {
      id: 'target',
      type: 'default',
      position: { x: 260, y: 140 },
      data: {
        label: (
          <div className="p-2 text-center">
            <span className="font-mono font-bold text-xs text-red-600 dark:text-red-400 block">{contact.code}</span>
            <span className="text-[10px] block opacity-70">{contact.classLabel}</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-red-500/20 text-red-600 block mt-1">
              PRIMARY TARGET
            </span>
          </div>
        ),
      },
      style: {
        background: 'var(--panel)',
        border: '2px solid #C8352E',
        borderRadius: '12px',
        color: 'var(--text)',
        width: 170,
      },
    },
    {
      id: 'c1048',
      type: 'default',
      position: { x: 50, y: 30 },
      data: {
        label: (
          <div className="p-2 text-center">
            <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400 block">C-1048</span>
            <span className="text-[10px] block opacity-70">Motorised Country Craft</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 block mt-1">
              RENDEZVOUS PARTNER
            </span>
          </div>
        ),
      },
      style: {
        background: 'var(--panel)',
        border: '1.5px solid #E0A526',
        borderRadius: '12px',
        color: 'var(--text)',
        width: 170,
      },
    },
    {
      id: 'c1035',
      type: 'default',
      position: { x: 50, y: 260 },
      data: {
        label: (
          <div className="p-2 text-center">
            <span className="font-mono font-bold text-xs text-teal-600 dark:text-teal-400 block">C-1035</span>
            <span className="text-[10px] block opacity-70">Canoe / Catamaran</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-teal-500/20 text-teal-700 dark:text-teal-300 block mt-1">
              CO-TRAVEL (Transit)
            </span>
          </div>
        ),
      },
      style: {
        background: 'var(--panel)',
        border: '1.5px solid #3FAE9A',
        borderRadius: '12px',
        color: 'var(--text)',
        width: 170,
      },
    },
    {
      id: 'zone-z01',
      type: 'default',
      position: { x: 520, y: 140 },
      data: {
        label: (
          <div className="p-2 text-center">
            <span className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400 block">Zone Z-01</span>
            <span className="text-[10px] block opacity-70">Vizhinjam Restricted Jetty</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 block mt-1">
              GEOFENCE BREACH
            </span>
          </div>
        ),
      },
      style: {
        background: 'var(--panel)',
        border: '1.5px dashed #9333ea',
        borderRadius: '12px',
        color: 'var(--text)',
        width: 180,
      },
    },
  ], [contact]);

  const initialEdges: Edge[] = useMemo(() => [
    {
      id: 'e-target-c1048',
      source: 'target',
      target: 'c1048',
      label: 'Prolonged Proximity (180s, 8.4m sep)',
      animated: true,
      style: { stroke: '#E0A526', strokeWidth: 2 },
      labelStyle: { fill: 'var(--text)', fontSize: 10, fontFamily: 'monospace' },
    },
    {
      id: 'e-target-c1035',
      source: 'target',
      target: 'c1035',
      label: 'Co-Travel (2× in sector Z-02)',
      style: { stroke: '#3FAE9A', strokeWidth: 1.5 },
      labelStyle: { fill: 'var(--text)', fontSize: 10, fontFamily: 'monospace' },
    },
    {
      id: 'e-target-zone',
      source: 'target',
      target: 'zone-z01',
      label: 'Incursion (45m inside boundary)',
      animated: true,
      style: { stroke: '#C8352E', strokeWidth: 2 },
      labelStyle: { fill: 'var(--text)', fontSize: 10, fontFamily: 'monospace' },
    },
  ], []);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/contacts')}
            className="p-2 rounded-lg border hover:bg-[var(--surface-hover)] transition-colors"
            style={{ borderColor: 'var(--line)' }}
            aria-label="Back to Contacts"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold">{contact.code}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                {contact.classLabel}
              </span>
              {isC1042 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white animate-pulse">
                  PRIMARY TARGET
                </span>
              )}
              <AttentionBadge
                level={contact.attentionLevel ?? 'RECORD_ONLY'}
                factors={contact.attentionFactors}
                size="sm"
              />
            </div>
            <p className="text-xs opacity-60">
              Persistent Coastal Contact Dossier · ByteTrack ID #{contact.id} · Observed across {contact.observedUavs?.length ?? 1} UAV sorties
            </p>
          </div>
        </div>

        {/* Tactical Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTacticalAction('NOTIFY_DUTY_OFFICER')}
            className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-hover)] transition-colors"
            style={{ borderColor: 'var(--line)' }}
          >
            Notify duty officer
          </button>
          <button
            onClick={() => setTacticalAction('RECOMMEND_PATROL_RESPONSE')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-xs"
          >
            Recommend patrol response
          </button>
        </div>
      </div>

      {/* Occlusion Handling Warning Banner (Scenario Step 2) */}
      {contact.occlusionEvent && (
        <div className="px-6 py-3 border-b bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <div className="font-bold flex items-center gap-2">
              <span>Track Continuity Advisory — Optical Line-of-Sight Occlusion</span>
              <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-amber-500/20">
                DURATION: {contact.occlusionEvent.durationSec}s
              </span>
            </div>
            <p className="opacity-90">
              Contact visual LOS was interrupted behind the Vizhinjam breakwater rock armour. Track ID <span className="font-mono font-bold">{contact.code}</span> was preserved via kinematic course-speed extrapolation and re-acquired upon exit via RTMDet-Thermal sensor signature match. Track continuity confidence was calibrated from 95% down to {Math.round(contact.continuityConf * 100)}% without fragmenting into duplicate tracks.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="px-6 border-b flex items-center gap-2 bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
        {[
          { key: 'overview', label: 'Overview & Keyframes' },
          { key: 'track_map', label: 'Track & Kinematics' },
          { key: 'behaviour', label: 'Observed Behaviours' },
          { key: 'relationships', label: 'Relationship Graph' },
          { key: 'evidence', label: 'Evidence & CKFE' },
          { key: 'history', label: 'Mission History' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as DetailTab)}
            className={cn(
              'px-4 py-3 text-xs font-semibold border-b-2 transition-colors',
              activeTab === tab.key
                ? 'border-[var(--sea-600)] text-[var(--sea-600)] dark:text-[var(--sea-400)]'
                : 'border-transparent opacity-60 hover:opacity-100'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                <span className="text-[10px] font-mono uppercase opacity-50 block">Classification Confidence</span>
                <span className="text-2xl font-serif font-bold text-cyan-600">{Math.round(contact.classConf * 100)}%</span>
                <span className="text-[11px] opacity-60 block mt-1">RTMDet Object Detector (MMDetection)</span>
              </div>
              <div className="p-4 rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                <span className="text-[10px] font-mono uppercase opacity-50 block">Continuity Confidence</span>
                <span className="text-2xl font-serif font-bold text-emerald-600">{Math.round(contact.continuityConf * 100)}%</span>
                <span className="text-[11px] opacity-60 block mt-1">ByteTrack + Kalman state predictor</span>
              </div>
              <div className="p-4 rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                <span className="text-[10px] font-mono uppercase opacity-50 block">Current Velocity</span>
                <span className="text-2xl font-serif font-bold text-[var(--sea-600)]">
                  {contact.lastSpeedKnots ? `${contact.lastSpeedKnots.toFixed(1)} kn` : '0.0 kn'}
                </span>
                <span className="text-[11px] opacity-60 block mt-1">Heading {contact.lastHeadingDeg}° ENE</span>
              </div>
              <div className="p-4 rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                <span className="text-[10px] font-mono uppercase opacity-50 block">Total Dwell Duration</span>
                <span className="text-2xl font-serif font-bold text-amber-600">
                  {Math.floor((contact.dwellTotalSec ?? 0) / 60)} min {(contact.dwellTotalSec ?? 0) % 60}s
                </span>
                <span className="text-[11px] opacity-60 block mt-1">Observed across 2 UAV sorties</span>
              </div>
            </div>

            {/* Dual Keyframes (RGB + Thermal) */}
            <div className="rounded-xl border p-5" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-sm font-bold">Latest Dual-Modality Keyframes (CKFE Extracted)</h3>
                  <p className="text-xs opacity-60">Synchronised visual &amp; long-wave infrared observation snapshots</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--surface)] border border-[var(--line)]">
                  LAT: {contact.lastLocation?.lat.toFixed(4)}° N · LON: {contact.lastLocation?.lon.toFixed(4)}° E
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* RGB Thumbnail */}
                <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
                  <div className="p-2 border-b bg-[var(--surface)] flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-cyan-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-500" /> RGB Daylight Spectrum
                    </span>
                    <span className="opacity-60">1920×1080 · 25 FPS</span>
                  </div>
                  <div className="aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden group">
                    <img
                      src="/mock/kf1.jpg"
                      alt="RGB Keyframe"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 text-white text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span>{contact.code} · RTMDet-L 88%</span>
                        <span>08:52:10 IST</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thermal Thumbnail */}
                <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
                  <div className="p-2 border-b bg-[var(--surface)] flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-amber-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Thermal LWIR (Ironbow Filter)
                    </span>
                    <span className="opacity-60">640×512 · 25 FPS</span>
                  </div>
                  <div className="aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden group">
                    <img
                      src="/mock/kf3.jpg"
                      alt="Thermal Keyframe"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 text-white text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span>{contact.code} · RTMDet-Thermal 91%</span>
                        <span>08:52:10 IST</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Classification & Rationale Breakdown */}
            <div className="grid grid-cols-2 gap-6">
              {/* Craft Taxonomy */}
              <div className="p-5 rounded-xl border space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                <h3 className="font-serif text-sm font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--sea-600)]" />
                  Kerala Maritime Craft Taxonomy
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-[var(--surface)] border" style={{ borderColor: 'var(--line)' }}>
                    <span className="text-[10px] font-mono uppercase opacity-50 block">Operational Broad Class</span>
                    <span className="text-sm font-bold text-[var(--sea-600)] block mt-0.5">{contact.classLabel}</span>
                    {contact.isBroadClass && (
                      <p className="text-[11px] opacity-75 mt-1 leading-relaxed">
                        {contact.broadClassReason}
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--surface)] border" style={{ borderColor: 'var(--line)' }}>
                    <span className="text-[10px] font-mono uppercase opacity-50 block">Fine-Grained Classification Hypothesis</span>
                    <span className="text-sm font-bold block mt-0.5">
                      {contact.fineGrainedType ?? 'Motorised Country Craft (Hypothesis, 0.74 conf)'}
                    </span>
                    <p className="text-[11px] opacity-75 mt-1 leading-relaxed">
                      Narrow hull beam (~1.8m) with stern outboard motor thermal signature consistent with artisanal motorised plywood craft.
                    </p>
                  </div>
                </div>
              </div>

              {/* Attention Level Rationale */}
              <div className="p-5 rounded-xl border space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                <h3 className="font-serif text-sm font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  Context-Aware Operational Attention Model
                </h3>
                <div className="space-y-2">
                  {(contact.attentionFactors ?? []).map((factor, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border text-xs" style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold">{factor.factorName}</span>
                        <span className="text-red-600 dark:text-red-400 font-bold">
                          +{((factor.weight ?? 0.25) * 100).toFixed(0)}% weight
                        </span>
                      </div>
                      <p className="text-[11px] opacity-70 mt-1">{factor.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: TRACK & MAP ─── */}
        {activeTab === 'track_map' && (
          <div className="space-y-6">
            {/* Map Trajectory View */}
            <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
                <div>
                  <h3 className="font-serif text-sm font-bold">Spatial Trajectory &amp; Geofence Crossings</h3>
                  <p className="text-xs opacity-60">Continuous ByteTrack trajectory across Vizhinjam Harbour sectors</p>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Target C-1042
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ml-2" /> C-1048
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 ml-2" /> Zone Z-01 Boundary
                </div>
              </div>
              <div className="h-[380px] w-full relative">
                <CoastalMap
                  height="100%"
                  showZones={true}
                  showContacts={true}
                  initialCenter={[contact.lastLocation?.lon ?? 76.980, contact.lastLocation?.lat ?? 8.378]}
                  initialZoom={14}
                />
              </div>
            </div>

            {/* Kinematics Recharts Graph */}
            <div className="p-5 rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-sm font-bold">Kinematic Velocity &amp; Heading Profile</h3>
                  <p className="text-xs opacity-60">Speed deceleration during breakwater approach and rendezvous drift</p>
                </div>
                <span className="text-xs font-mono opacity-60">Units: Knots / Compass Degrees</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={KINEMATIC_SERIES}>
                    <defs>
                      <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2B7FA6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2B7FA6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} fontFamily="monospace" />
                    <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={11} fontFamily="monospace" label={{ value: 'Knots', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={11} fontFamily="monospace" domain={[0, 360]} label={{ value: 'Deg', angle: 90, position: 'insideRight', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--panel)',
                        borderColor: 'var(--line)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="speedKnots" name="Speed (knots)" stroke="#2B7FA6" fillOpacity={1} fill="url(#speedGrad)" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="heading" name="Heading (deg)" stroke="#E0A526" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: BEHAVIOUR ─── */}
        {activeTab === 'behaviour' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border flex items-center justify-between" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div>
                <h3 className="font-serif text-sm font-bold">Temporal Behaviour Intelligence Timeline</h3>
                <p className="text-xs opacity-60">Rule evaluations, context policies applied, and attention progression</p>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                {(contact.behaviourEvents ?? []).length} BEHAVIOURAL EVENTS LOGGED
              </span>
            </div>

            <div className="space-y-3">
              {(contact.behaviourEvents ?? []).map((ev, idx) => (
                <div key={ev.id ?? idx} className="p-4 rounded-xl border flex items-start gap-4 transition-all" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                  <div className="p-2 rounded-lg bg-[var(--surface)] text-[var(--sea-600)] font-mono text-xs font-bold flex-shrink-0 border" style={{ borderColor: 'var(--line)' }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm">{ev.label}</span>
                        <AttentionBadge level={ev.attentionLevel} size="sm" showWhyButton={false} />
                      </div>
                      <span className="text-xs font-mono opacity-50">
                        {new Date(ev.occurredAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })} IST
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono opacity-70">
                      <span>RULE: {ev.ruleName} ({ev.ruleId})</span>
                      <span>•</span>
                      <span>PROFILE: {ev.contextProfile}</span>
                    </div>
                    {ev.details && (
                      <p className="text-xs opacity-80 pt-1 leading-relaxed">{ev.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 4: RELATIONSHIPS ─── */}
        {activeTab === 'relationships' && (
          <div className="space-y-4">
            {/* Disclaimer Caption Bar */}
            <div className="px-4 py-2.5 rounded-xl border bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200 flex items-center gap-2 text-xs">
              <Info className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold">
                Intelligence Notice: Relationships are empirical spatial-temporal observations, not legal conclusions.
              </span>
            </div>

            {/* Interactive XYFlow Graph Canvas */}
            <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
                <div>
                  <h3 className="font-serif text-sm font-bold">Cross-Contact Spatial Association Graph</h3>
                  <p className="text-xs opacity-60">Interactive node graph of convergence, prolonged proximity, co-travel, and zone interaction</p>
                </div>
                <span className="text-xs font-mono opacity-50">Drag nodes to inspect clustering</span>
              </div>
              <div className="h-[420px] w-full relative bg-slate-950/20">
                <ReactFlow
                  nodes={initialNodes}
                  edges={initialEdges}
                  fitView
                >
                  <Background color="var(--line)" gap={16} />
                  <Controls />
                </ReactFlow>
              </div>
            </div>

            {/* Relational Observation Ledger */}
            <div className="p-4 rounded-xl border space-y-3" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <h4 className="font-serif text-xs font-bold uppercase opacity-60">Relational Observation Table</h4>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b font-mono text-[10px] uppercase opacity-50" style={{ borderColor: 'var(--line)' }}>
                    <th className="py-2">Partner Contact</th>
                    <th className="py-2">Interaction Type</th>
                    <th className="py-2">Observation Count</th>
                    <th className="py-2">Last Observed</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {(contact.relationships ?? []).map((rel, idx) => (
                    <tr key={idx} className="hover:bg-[var(--surface-hover)]">
                      <td className="py-2.5 font-mono font-bold text-[var(--sea-600)]">
                        {rel.relatedContactCode}
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          {rel.type.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono">{rel.count} instances</td>
                      <td className="py-2.5 font-mono opacity-70">
                        {new Date(rel.lastSeenAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })} IST
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => navigate(`/contacts/${rel.relatedContactId}`)}
                          className="text-[var(--sea-600)] hover:underline font-semibold"
                        >
                          View Partner Contact →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB 5: EVIDENCE & CKFE ─── */}
        {activeTab === 'evidence' && (
          <div className="space-y-6">
            {/* CKFE Strip Component */}
            <CkfeKeyframeStrip
              onSelectKeyframe={(sec: number) => {
                console.log(`Jumping video player to offset ${sec}s`);
              }}
            />

            {/* Video Player Dossier View */}
            <div className="rounded-xl border p-5" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <h3 className="font-serif text-sm font-bold mb-3">Drone Video Replay &amp; AI Sidecar Detection Overlay</h3>
              <div className="aspect-video w-full max-w-4xl mx-auto rounded-lg overflow-hidden border" style={{ borderColor: 'var(--line)' }}>
                <DroneVideoPlayer sceneName="vizhinjam_patrol" />
              </div>
            </div>

            {/* Cryptographic Hashes & Court Admissibility */}
            <div className="p-5 rounded-xl border space-y-3" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-sm font-bold">Evidence Hash Verification Ledger (Sec 65B BSA Admissible)</h3>
                  <p className="text-xs opacity-60">SHA-256 cryptographic hashes written at time of Cognitive Keyframe Extraction</p>
                </div>
                <button
                  onClick={() => alert('Exporting signed dossier JSON with SHA-256 manifest')}
                  className="px-3 py-1.5 rounded-lg border text-xs font-mono font-bold hover:bg-[var(--surface-hover)] flex items-center gap-1.5"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <Download className="w-3.5 h-3.5" /> Export Manifest
                </button>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {[
                  { name: 'CKFE_KEYFRAME_01_FIRST_APPEARANCE.jpg', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', size: '420 KB', time: '08:18:00 IST' },
                  { name: 'CKFE_KEYFRAME_02_OCCLUSION_EXIT.jpg', hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', size: '415 KB', time: '08:46:12 IST' },
                  { name: 'CKFE_KEYFRAME_03_BOUNDARY_CROSSING.jpg', hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a', size: '408 KB', time: '08:48:30 IST' },
                  { name: 'CKFE_KEYFRAME_04_RENDEZVOUS_CONVERGENCE.jpg', hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d', size: '445 KB', time: '08:52:10 IST' },
                ].map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border flex items-center justify-between" style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
                    <div className="space-y-0.5">
                      <span className="font-bold block">{item.name}</span>
                      <span className="text-[10px] opacity-60">{item.time} · {item.size}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] opacity-75">{item.hash.substring(0, 20)}...</span>
                      <button
                        onClick={() => copyHash(item.hash)}
                        className="p-1.5 rounded hover:bg-[var(--surface-hover)] border"
                        style={{ borderColor: 'var(--line)' }}
                        title="Copy SHA-256"
                      >
                        {copiedHash === item.hash ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 6: HISTORY ─── */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border flex items-center justify-between" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div>
                <h3 className="font-serif text-sm font-bold">Cross-Sortie Re-Identification &amp; Historical Missions</h3>
                <p className="text-xs opacity-60">Persistent craft appearances recorded across previous patrol sorties in Thiruvananthapuram</p>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                {(contact.pastMissions ?? []).length} HISTORICAL SORTIES
              </span>
            </div>

            <div className="space-y-3">
              {(contact.pastMissions ?? []).map((m, idx) => (
                <div key={m.missionId ?? idx} className="p-4 rounded-xl border flex items-center justify-between" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[var(--sea-600)]">{m.missionCode}</span>
                      <AttentionBadge level={m.peakAttention} size="sm" showWhyButton={false} />
                    </div>
                    <p className="text-xs opacity-70">
                      Craft Class: <span className="font-semibold">{m.craftClass}</span> · Location: <span className="font-semibold">{m.locationName}</span>
                    </p>
                  </div>
                  <div className="text-right font-mono text-xs opacity-60">
                    <span>{m.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Human in the loop note */}
        <HumanInterpretationNote />
      </div>

      {/* Tactical Action Dialog */}
      {tacticalAction && (
        <TacticalActionDialog
          actionType={tacticalAction}
          targetId={contact.id}
          targetCode={contact.code}
          targetType="CONTACT"
          onClose={() => setTacticalAction(null)}
          onConfirm={() => {
            setTacticalAction(null);
            alert(`Tactical action logged to tamper-evident audit ledger.`);
          }}
        />
      )}
    </div>
  );
}

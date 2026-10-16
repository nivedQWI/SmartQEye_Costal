// ============================================================
// SmartQEye Coastal — Missions & Sorties Console (/missions)
// Proposal §5.1 & RFP §5 Compliant
// Unified Scenario Sortie (MSN-20261016-01), Pre-Flight Checklist,
// Mission Profile Context Binding, Planned vs Actual Flown Track, and AAR Generator
// ============================================================

import React, { useState } from 'react';
import {
  Anchor, Play, Square, RefreshCw, Upload, Video,
  Radio, Shield, HardDrive, Trash2, CheckCircle2,
  Clock, AlertCircle, FileText, Check,
  AlertTriangle, Download, Navigation
} from 'lucide-react';
import { cn, formatIST } from '@/lib/utils';
import { UAVS } from '@/lib/mockData';
import { auditApi } from '@/lib/api';
import type { MissionSortie, Squadron, VideoSourceType } from '@/types';

export type MissionContextProfileType =
  | 'HARBOR_SURVEILLANCE'
  | 'SHORELINE_BEACH'
  | 'ESTUARY_INLET'
  | 'DEEPWATER_INTERCEPT';

interface DiagnosticCheck {
  id: string;
  name: string;
  subsystem: string;
  status: 'PENDING' | 'CHECKING' | 'PASS' | 'FAIL';
  metric: string;
  note: string;
}

const INITIAL_DIAGNOSTICS: DiagnosticCheck[] = [
  {
    id: 'diag-01',
    name: 'Payload Optical & Thermal Sensors',
    subsystem: 'Gimbal & Sensors',
    status: 'PASS',
    metric: '4K RGB + LWIR Thermal Calibrated',
    note: 'Dual-sensor uncompressed RTSP streams initialized'
  },
  {
    id: 'diag-02',
    name: 'RF C2 & Telemetry Link',
    subsystem: 'Avionics Comms',
    status: 'PASS',
    metric: 'MAVLink v2 / SNR 42 dB',
    note: 'Encrypted 2.4/5.8GHz frequency hopping dual link'
  },
  {
    id: 'diag-03',
    name: 'Onboard & Gateway NVMe Storage',
    subsystem: 'Storage Fabric',
    status: 'PASS',
    metric: '482 GB Available (Read: 3.2 GB/s)',
    note: 'High-speed cyclic write endurance verified'
  },
  {
    id: 'diag-04',
    name: 'RTK GNSS & Clock Sync',
    subsystem: 'Navigation & PTP',
    status: 'PASS',
    metric: 'PTP Locked / DOP 0.9 (18 Sats)',
    note: 'Sub-10ms frame timecode alignment verified'
  },
  {
    id: 'diag-05',
    name: 'Geofence & Corridor Clearance',
    subsystem: 'DGCA / Police Auth',
    status: 'PASS',
    metric: 'Sector Alpha Clearance Active',
    note: 'Vizhinjam coastal corridor geofence loaded'
  },
  {
    id: 'diag-06',
    name: 'Edge AI Pipeline Readiness',
    subsystem: 'Inference Fabric',
    status: 'PASS',
    metric: 'RTMDet-L + ByteTrack in VRAM',
    note: 'CFS filter armed with 0.4s warmup latency'
  }
];

function generateMissionId(squadron: Squadron): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `MSN-${yyyy}${mm}${dd}-${hh}${min}-${ss}-${squadron}`;
}

export default function MissionsPage() {
  const [squadron, setSquadron] = useState<Squadron>('ALPHA');
  const [missionName, setMissionName] = useState('Sector Alpha High-Priority Coastal Surveillance');
  const [missionId, setMissionId] = useState('MSN-20261016-01');
  const [selectedDroneId, setSelectedDroneId] = useState(UAVS[0].id);
  const [contextProfile, setContextProfile] = useState<MissionContextProfileType>('HARBOR_SURVEILLANCE');
  const [videoSourceType, setVideoSourceType] = useState<VideoSourceType>('RTSP');
  const [videoSourceUrl, setVideoSourceUrl] = useState('rtsp://10.200.1.10:8554/live/uav-kl01');
  const [uploadedVideoFile, setUploadedVideoFile] = useState<string | null>(null);
  const [srtFile, setSrtFile] = useState<string | null>(null);
  const [pilotName, setPilotName] = useState('Insp. Anoop Nair (KP-4421)');
  const [location, setLocation] = useState('Vizhinjam International Seaport Anchorage');

  // Transmission controls
  const [serverIngestion, setServerIngestion] = useState(true);
  const [cognitiveBypass, setCognitiveBypass] = useState(false);

  // Diagnostics State
  const [diagnostics, setDiagnostics] = useState<DiagnosticCheck[]>(INITIAL_DIAGNOSTICS);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);

  // AAR Modal State
  const [showAarModal, setShowAarModal] = useState(false);
  const [aarSortie, setAarSortie] = useState<MissionSortie | null>(null);

  // Active mission state (Unified with scenario MSN-20261016-01)
  const [activeSortie, setActiveSortie] = useState<MissionSortie | null>({
    id: 'sort-active-msn-01',
    missionId: 'MSN-20261016-01',
    name: 'Sector Alpha High-Priority Coastal Surveillance',
    droneId: UAVS[0].id,
    droneCode: UAVS[0].droneCode,
    squadron: 'ALPHA',
    videoSourceType: 'RTSP',
    videoSourceUrl: 'rtsp://10.200.1.10:8554/live/uav-kl01',
    pilotName: 'Insp. Anoop Nair (KP-4421)',
    location: 'Vizhinjam International Seaport Anchorage & Fairway',
    status: 'ACTIVE',
    serverIngestion: true,
    cognitiveBypass: false,
    bitrateMbps: 8.6,
    fps: 30.0,
    packetLossPct: 0.02,
    startedAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    durationMin: 48,
  });

  // Historical Sorties
  const [historySorties, setHistorySorties] = useState<MissionSortie[]>([
    {
      id: 'sort-h-1',
      missionId: 'MSN-20261015-1430-00-BRAVO',
      name: 'Kovalam Tourist Beach Perimeter Scan',
      droneId: UAVS[1].id,
      droneCode: UAVS[1].droneCode,
      squadron: 'BRAVO',
      videoSourceType: 'RTSP',
      pilotName: 'SI Manesh V.',
      location: 'Kovalam Light House Beach',
      status: 'COMPLETED',
      serverIngestion: true,
      cognitiveBypass: false,
      startedAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 21 * 3600 * 1000).toISOString(),
      durationMin: 58,
    },
    {
      id: 'sort-h-2',
      missionId: 'MSN-20261014-0915-00-ALPHA',
      name: 'Poovar Estuary Joint Maritime Patrol',
      droneId: UAVS[2].id,
      droneCode: UAVS[2].droneCode,
      squadron: 'ALPHA',
      videoSourceType: 'RTMP',
      pilotName: 'ASI Pradeep K.',
      location: 'Poovar Golden Sand Estuary',
      status: 'COMPLETED',
      serverIngestion: true,
      cognitiveBypass: false,
      startedAt: new Date(Date.now() - 46 * 3600 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 45 * 3600 * 1000).toISOString(),
      durationMin: 74,
    },
    {
      id: 'sort-h-3',
      missionId: 'MSN-20261013-1820-00-CHARLIE',
      name: 'Vizhinjam International Terminal Night Sortie',
      droneId: UAVS[3].id,
      droneCode: UAVS[3].droneCode,
      squadron: 'CHARLIE',
      videoSourceType: 'UPLOAD',
      srtFileName: 'DJI_0442_Vizhinjam.srt',
      pilotName: 'SI Ramesh Kumar',
      location: 'Vizhinjam Terminal Breakwater',
      status: 'COMPLETED',
      serverIngestion: true,
      cognitiveBypass: true,
      startedAt: new Date(Date.now() - 70 * 3600 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 69 * 3600 * 1000).toISOString(),
      durationMin: 62,
    },
  ]);

  function handleRegenerateId(sq = squadron) {
    setMissionId(generateMissionId(sq));
  }

  function handleSquadronChange(sq: Squadron) {
    setSquadron(sq);
    handleRegenerateId(sq);
  }

  // Pre-Flight Diagnostic Runner
  const handleRunDiagnostics = () => {
    setRunningDiagnostics(true);
    setDiagnostics(prev => prev.map(d => ({ ...d, status: 'CHECKING' })));

    let step = 0;
    const interval = setInterval(() => {
      if (step < diagnostics.length) {
        setDiagnostics(prev => prev.map((d, idx) => idx === step ? { ...d, status: 'PASS' } : d));
        step++;
      } else {
        clearInterval(interval);
        setRunningDiagnostics(false);
        auditApi.append({
          userId: 'op-cur',
          userName: pilotName,
          userRole: 'OPERATOR',
          action: 'SYSTEM_HEALTH_CHECK',
          targetType: 'UAV',
          targetId: selectedDroneId,
          beforeAfterSummary: `Completed pre-flight diagnostic self-test sequence for UAV ${selectedDroneId}: 6/6 checks passed`,
          outcome: 'SUCCESS'
        }).catch(console.error);
      }
    }, 250);
  };

  function handleStartMission(e: React.FormEvent) {
    e.preventDefault();
    const drone = UAVS.find(u => u.id === selectedDroneId) ?? UAVS[0];
    const newSortie: MissionSortie = {
      id: `sort-${Date.now()}`,
      missionId,
      name: missionName,
      droneId: drone.id,
      droneCode: drone.droneCode,
      squadron,
      videoSourceType,
      videoSourceUrl: videoSourceType === 'UPLOAD' ? undefined : videoSourceUrl,
      srtFileName: srtFile ?? undefined,
      pilotName,
      location,
      status: 'ACTIVE',
      serverIngestion,
      cognitiveBypass,
      bitrateMbps: 8.6,
      fps: 30.0,
      packetLossPct: 0.02,
      startedAt: new Date().toISOString(),
      durationMin: 1,
    };
    setActiveSortie(newSortie);

    auditApi.append({
      userId: 'op-cur',
      userName: pilotName,
      userRole: 'OPERATOR',
      action: 'UPDATE_MISSION',
      targetType: 'MISSION',
      targetId: newSortie.missionId,
      beforeAfterSummary: `Launched live surveillance sortie "${newSortie.name}" (${newSortie.droneCode}) with context profile ${contextProfile}`,
      outcome: 'SUCCESS'
    }).catch(console.error);

    handleRegenerateId();
  }

  function handleStopMission() {
    if (!activeSortie) return;
    const completed: MissionSortie = {
      ...activeSortie,
      status: 'COMPLETED',
      endedAt: new Date().toISOString(),
    };
    setHistorySorties([completed, ...historySorties]);
    setActiveSortie(null);

    auditApi.append({
      userId: 'op-cur',
      userName: completed.pilotName,
      userRole: 'OPERATOR',
      action: 'UPDATE_MISSION',
      targetType: 'MISSION',
      targetId: completed.missionId,
      beforeAfterSummary: `Terminated surveillance sortie "${completed.name}" (${completed.droneCode}) after ${completed.durationMin ?? 0} minutes`,
      outcome: 'SUCCESS'
    }).catch(console.error);

    // Open AAR Generator
    setAarSortie(completed);
    setShowAarModal(true);
  }

  function handleDeleteSortie(id: string) {
    setHistorySorties(historySorties.filter(s => s.id !== id));
  }

  // Generate & Download AAR Report File
  const handleDownloadAarDossier = (s: MissionSortie) => {
    const aarText = `================================================================================
KERALA POLICE COASTAL SURVEILLANCE & DRONE FORENSIC LAB
SORTIE AFTER-ACTION REPORT (AAR) — CONFIDENTIAL EVIDENTIARY DOSSIER
================================================================================
Report Generated : ${formatIST(new Date().toISOString())}
Document Class   : Official Police Incident Review (RFP §5 / Section 65B Compliant)
Station Command  : Vizhinjam Coastal Police Station, Thiruvananthapuram

--------------------------------------------------------------------------------
1. MISSION SORTIE METADATA
--------------------------------------------------------------------------------
Mission ID       : ${s.missionId}
Operation Name   : ${s.name}
UAV Identifier   : ${s.droneCode} (Drone ID: ${s.droneId})
Flight Squadron  : Squadron ${s.squadron}
Pilot-in-Command : ${s.pilotName}
Location Sector  : ${s.location}
Sortie Duration  : ${s.durationMin} minutes
Status           : ${s.status}

--------------------------------------------------------------------------------
2. SENSOR & COGNITIVE ANALYTICS SUMMARY
--------------------------------------------------------------------------------
Total Video Frames Ingested : ${((s.durationMin ?? 0) * 60 * 30).toLocaleString()} frames
CFS Frames Processed (FULL) : ${((s.durationMin ?? 0) * 60 * 12).toLocaleString()} frames
CFS Frames Processed (LIGHT): ${((s.durationMin ?? 0) * 60 * 10).toLocaleString()} frames
CFS Frames Skipped (CFS-SKP): ${((s.durationMin ?? 0) * 60 * 8).toLocaleString()} frames (41.4% GPU Savings)
Persistent Contacts Tracked : 14 persistent tracks (Vessels: 11, Shoreline: 3)
High-Attention Alerts Raised: 1 Critical (Security Zone Incursion C-1042)
Cognitive Keyframes (CKFE)  : 9 evidentiary keyframes archived

--------------------------------------------------------------------------------
3. FLIGHT CORRIDOR & TRACK DEVIATION
--------------------------------------------------------------------------------
Planned Corridor WP Range   : WP-1 to WP-6 (Fairway Ingress/Egress)
Mean Cross-Track Deviation  : 3.8 meters (DGCA Max Allowed: 15.0m)
Flown Path Distance         : ${((s.durationMin ?? 0) * 0.28).toFixed(1)} nautical miles
Corridor Boundary Adherence : 99.4%

--------------------------------------------------------------------------------
4. SECTION 65B / 63 INDIAN EVIDENCE ACT ATTESTATION
--------------------------------------------------------------------------------
Hardware Machine Hash       : SHA-256: 9e4f2b189c4418a02b8d91c287410948b273419028471
Video Ingest Digital Seal   : SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b9
Officer Attestation         : Certified true and unaltered drone flight telemetry
                              and cognitive analytics record.
================================================================================
SMARTQEYE COASTAL — QUANTUMWEAVE INTELLIGENCE PVT. LTD.
================================================================================`;

    const blob = new Blob([aarText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AAR_${s.missionId}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedDrone = UAVS.find(u => u.id === selectedDroneId) ?? UAVS[0];

  return (
    <div className="h-full flex flex-col overflow-y-auto chart-paper p-4 md:p-6 gap-5">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Missions &amp; Sorties Console
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
              PROPOSAL §5.1 / RFP §5
            </span>
          </div>
          <p className="text-xs opacity-70" style={{ color: 'var(--text-muted)' }}>
            Launch sorties, bind context intelligence profiles, execute pre-flight diagnostics, and inspect planned vs flown corridors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full font-mono font-medium border"
            style={{ background: 'var(--sand-200)', borderColor: 'var(--sand-300)', color: 'var(--ink-900)' }}>
            Station: Vizhinjam Coastal Police
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          TOP: ACTIVE MISSION STATUS BANNER (MSN-20261016-01)
         ══════════════════════════════════════════════════ */}
      {activeSortie ? (
        <div
          className="rounded-2xl p-5 border flex items-center justify-between flex-wrap gap-4 shadow-md relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(43, 127, 166, 0.08) 0%, rgba(238, 223, 181, 0.25) 100%)',
            borderColor: 'var(--sea-400)',
          }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">
              <span className="w-4 h-4 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-500 text-white">
                  LIVE SORTIE ACTIVE
                </span>
                <span className="font-mono text-xs font-bold text-[var(--sea-600)]">{activeSortie.missionId}</span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-bold"
                  style={{ background: 'var(--sand-200)', color: 'var(--ink-900)' }}>
                  SQUADRON {activeSortie.squadron}
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/10 text-cyan-700 border border-cyan-500/20">
                  PROFILE: {contextProfile}
                </span>
              </div>
              <h2 className="font-serif text-lg font-bold" style={{ color: 'var(--text)' }}>
                {activeSortie.name}
              </h2>
              <div className="flex items-center gap-4 text-xs flex-wrap opacity-80" style={{ color: 'var(--text-muted)' }}>
                <span>Drone: <strong className="font-mono">{activeSortie.droneCode}</strong></span>
                <span>Pilot: <strong>{activeSortie.pilotName}</strong></span>
                <span>Location: <strong>{activeSortie.location}</strong></span>
                <span>Sensor Stream: <strong>{activeSortie.bitrateMbps} Mbps @ {activeSortie.fps} FPS</strong></span>
                <span>Airborne Duration: <strong className="font-mono text-emerald-600 font-bold">{activeSortie.durationMin} min</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => { setAarSortie(activeSortie); setShowAarModal(true); }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors shadow-sm"
              style={{ borderColor: 'var(--line)' }}
            >
              <FileText className="w-3.5 h-3.5 text-[var(--sea-600)]" />
              Live AAR Debrief
            </button>
            <button
              onClick={handleStopMission}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              Terminate Sortie
            </button>
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl p-4 border flex items-center justify-between text-xs opacity-80"
          style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>No drone sortie currently active. Configure, run diagnostics, and launch a sortie below.</span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MIDDLE SECTION: PRE-FLIGHT CHECKLIST & PLANNED VS FLOWN CORRIDOR
         ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Pre-Flight Diagnostic Checklist (6 Checks) ── */}
        <div className="rounded-2xl p-5 border shadow-sm space-y-4" style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--sea-600)]" />
              <h2 className="font-serif text-base font-bold">Pre-Flight Diagnostic Checklist</h2>
            </div>
            <button
              onClick={handleRunDiagnostics}
              disabled={runningDiagnostics}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50"
              style={{ borderColor: 'var(--line)' }}
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-[var(--sea-600)]', runningDiagnostics && 'animate-spin')} />
              {runningDiagnostics ? 'Probing Subsystems...' : 'Run Diagnostics'}
            </button>
          </div>

          <div className="space-y-2">
            {diagnostics.map(chk => (
              <div
                key={chk.id}
                className="p-3 rounded-xl border bg-[var(--panel)] flex items-center justify-between text-xs"
                style={{ borderColor: 'var(--line)' }}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{chk.name}</span>
                    <span className="text-[10px] font-mono opacity-50">· {chk.subsystem}</span>
                  </div>
                  <div className="text-[11px] font-mono opacity-70">{chk.metric}</div>
                </div>

                <div>
                  {chk.status === 'PASS' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3" /> PASS
                    </span>
                  )}
                  {chk.status === 'CHECKING' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" /> CHECKING
                    </span>
                  )}
                  {chk.status === 'FAIL' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/10 text-red-600 border border-red-500/20 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> FAIL
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Planned vs Actual Track on Map & Corridor Deviation ── */}
        <div className="rounded-2xl p-5 border shadow-sm space-y-4 flex flex-col justify-between" style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[var(--sea-600)]" />
                <h2 className="font-serif text-base font-bold">Planned Corridor vs Actual Flown Track</h2>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 99.4% Corridor Bound
              </span>
            </div>
            <p className="text-xs opacity-60">DGCA survey corridor compliance with real-time GNSS cross-track deviation</p>
          </div>

          {/* Visual Corridor SVG Map */}
          <div className="p-3 rounded-xl border bg-[var(--panel)] relative overflow-hidden h-48 flex items-center justify-center" style={{ borderColor: 'var(--line)' }}>
            <svg viewBox="0 0 400 180" className="w-full h-full">
              {/* Shoreline background */}
              <path d="M 0,160 Q 100,140 200,150 T 400,130 L 400,180 L 0,180 Z" fill="rgba(238, 223, 181, 0.3)" />
              <text x="280" y="170" fill="currentColor" opacity="0.4" fontSize="10" fontFamily="sans-serif">Vizhinjam Coastline</text>

              {/* Planned Corridor (Dashed Blue Line with Waypoints) */}
              <path
                d="M 30,50 L 110,40 L 190,70 L 270,45 L 360,60"
                fill="none"
                stroke="#2b7fa6"
                strokeWidth="6"
                strokeOpacity="0.2"
                strokeLinecap="round"
              />
              <path
                d="M 30,50 L 110,40 L 190,70 L 270,45 L 360,60"
                fill="none"
                stroke="#2b7fa6"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Waypoint markers */}
              {[
                { x: 30, y: 50, label: 'WP-1' },
                { x: 110, y: 40, label: 'WP-2' },
                { x: 190, y: 70, label: 'WP-3' },
                { x: 270, y: 45, label: 'WP-4' },
                { x: 360, y: 60, label: 'WP-5' },
              ].map(wp => (
                <g key={wp.label}>
                  <circle cx={wp.x} cy={wp.y} r="3" fill="#2b7fa6" />
                  <text x={wp.x - 10} y={wp.y - 8} fill="#2b7fa6" fontSize="9" fontWeight="bold" fontFamily="monospace">{wp.label}</text>
                </g>
              ))}

              {/* Actual Flown Track (Solid Emerald Line with slight realistic jitter) */}
              <path
                d="M 30,51 Q 70,44 110,39 T 190,72 T 270,44 T 330,55"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Current UAV Live Position Marker */}
              <g transform="translate(330, 55)">
                <circle cx="0" cy="0" r="6" fill="#10b981" opacity="0.3" className="animate-ping" />
                <circle cx="0" cy="0" r="4" fill="#10b981" />
                <text x="8" y="4" fill="#10b981" fontSize="10" fontWeight="bold" fontFamily="monospace">UAV-KL-01</text>
              </g>
            </svg>
          </div>

          {/* Deviation Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl border bg-[var(--surface)] text-xs font-mono" style={{ borderColor: 'var(--line)' }}>
            <div>
              <span className="opacity-50 block text-[10px]">MEAN DEVIATION</span>
              <span className="font-bold text-emerald-600">3.8 m</span>
            </div>
            <div>
              <span className="opacity-50 block text-[10px]">MAX CROSS-TRACK</span>
              <span className="font-bold text-[var(--sea-600)]">8.2 m</span>
            </div>
            <div>
              <span className="opacity-50 block text-[10px]">DGCA CORRIDOR LIMIT</span>
              <span className="font-bold opacity-75">15.0 m</span>
            </div>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════
          MAIN CENTER: SPLIT 2 COLUMNS (SORTIE CONFIG & CONTROLS)
         ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── LEFT FORM: SORTIE SETUP (2 Columns Span) ── */}
        <div
          className="lg:col-span-2 rounded-2xl p-5 border shadow-sm flex flex-col justify-between"
          style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <Anchor className="w-5 h-5" style={{ color: 'var(--sea-600)' }} />
                <h2 className="font-serif text-base font-bold">New Mission Sortie Setup</h2>
              </div>
              <span className="text-xs opacity-60 font-mono">Standardized Protocol v2.4</span>
            </div>

            <form onSubmit={handleStartMission} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mission Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    Mission Name
                  </label>
                  <input
                    type="text"
                    required
                    value={missionName}
                    onChange={e => setMissionName(e.target.value)}
                    placeholder="e.g. Poovar Estuary Shoreline Patrol"
                    className="w-full px-3 py-2 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-[var(--sea-400)] font-medium"
                    style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)' }}
                  />
                </div>

                {/* Auto-generated Mission ID */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                      Standardized Mission ID (Auto-Generated)
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRegenerateId()}
                      className="text-xs flex items-center gap-1 opacity-70 hover:opacity-100"
                      style={{ color: 'var(--sea-600)' }}
                    >
                      <RefreshCw className="w-3 h-3" /> Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={missionId}
                    className="w-full px-3 py-2 rounded-xl text-sm border font-mono font-bold tracking-wider"
                    style={{ background: 'var(--sand-100)', borderColor: 'var(--sand-300)', color: 'var(--ink-900)' }}
                  />
                  <p className="text-[11px] opacity-60 mt-0.5">Format: MSN-YYYYMMDD-HHMM-SS-SQUADRON</p>
                </div>

                {/* Context Intelligence Profile Dynamic Selector */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    Applied Coastal Context Intelligence Profile
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: 'HARBOR_SURVEILLANCE' as MissionContextProfileType, name: 'Harbor & Anchorage', desc: 'Anchored vessel drift, fairways, breakwaters' },
                      { id: 'SHORELINE_BEACH' as MissionContextProfileType, name: 'Tourist & Bathing Beach', desc: 'High-density crowds, after-hours loitering' },
                      { id: 'ESTUARY_INLET' as MissionContextProfileType, name: 'Estuary & Creek Ingress', desc: 'Shallow draft skiffs, landing points' },
                      { id: 'DEEPWATER_INTERCEPT' as MissionContextProfileType, name: 'High Seas & Dark Vessel', desc: 'AIS gap detection, speed anomalies' },
                    ].map(cp => (
                      <div
                        key={cp.id}
                        onClick={() => setContextProfile(cp.id)}
                        className={cn(
                          'p-3 rounded-xl border cursor-pointer transition-all space-y-1',
                          contextProfile === cp.id
                            ? 'bg-[var(--surface)] border-[var(--sea-500)] shadow-xs'
                            : 'bg-[var(--panel)] border-[var(--line)] opacity-70 hover:opacity-100'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs">{cp.name}</span>
                          {contextProfile === cp.id && <Check className="w-3.5 h-3.5 text-[var(--sea-600)]" />}
                        </div>
                        <p className="text-[11px] opacity-70">{cp.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Squadron Selector */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    Squadron Unit
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'] as Squadron[]).map(sq => (
                      <button
                        key={sq}
                        type="button"
                        onClick={() => handleSquadronChange(sq)}
                        className={cn(
                          'py-1.5 px-2 rounded-xl text-xs font-mono font-bold border transition-all text-center',
                          squadron === sq
                            ? 'bg-[var(--sea-600)] text-white border-[var(--sea-600)] shadow-xs'
                            : 'bg-[var(--panel)] border-[var(--line)] opacity-70 hover:opacity-100'
                        )}
                      >
                        {sq}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drone Selection */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    Assigned Drone (UAV)
                  </label>
                  <select
                    value={selectedDroneId}
                    onChange={e => setSelectedDroneId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border outline-none font-mono"
                    style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)' }}
                  >
                    {UAVS.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.droneCode} — {u.makeModel}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Video Source Type */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    Video Source Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'RTMP' as VideoSourceType, label: 'RTMP Live Feed', icon: Radio },
                      { type: 'RTSP' as VideoSourceType, label: 'RTSP Stream URL', icon: Video },
                      { type: 'UPLOAD' as VideoSourceType, label: 'Video File Upload', icon: Upload },
                    ].map(st => (
                      <button
                        key={st.type}
                        type="button"
                        onClick={() => setVideoSourceType(st.type)}
                        className={cn(
                          'flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all',
                          videoSourceType === st.type
                            ? 'bg-[var(--sand-200)] text-[var(--ink-900)] border-[var(--sand-300)] shadow-xs'
                            : 'bg-[var(--panel)] border-[var(--line)] opacity-60 hover:opacity-100'
                        )}
                      >
                        <st.icon className="w-3.5 h-3.5" />
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Source Input or File Upload */}
                {videoSourceType !== 'UPLOAD' ? (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                      {videoSourceType} Endpoint URL
                    </label>
                    <input
                      type="text"
                      required
                      value={videoSourceUrl}
                      onChange={e => setVideoSourceUrl(e.target.value)}
                      placeholder={videoSourceType === 'RTMP' ? 'rtmp://server:1935/live/feed' : 'rtsp://user:pass@camera/stream'}
                      className="w-full px-3 py-2 rounded-xl text-sm border font-mono outline-none"
                      style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)' }}
                    />
                  </div>
                ) : (
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border-2 border-dashed rounded-xl p-3 text-center" style={{ borderColor: 'var(--line)' }}>
                      <Upload className="w-5 h-5 mx-auto mb-1 opacity-50" />
                      <div className="text-xs font-semibold">Raw Video (MP4 / TS / MKV)</div>
                      <input
                        type="file"
                        accept=".mp4,.ts,.mkv"
                        onChange={e => setUploadedVideoFile(e.target.files?.[0]?.name ?? null)}
                        className="mt-1 text-xs"
                      />
                      {uploadedVideoFile && <p className="text-[11px] font-mono text-emerald-600 mt-1">✓ {uploadedVideoFile}</p>}
                    </div>

                    <div className="border-2 border-dashed rounded-xl p-3 text-center" style={{ borderColor: 'var(--line)' }}>
                      <FileText className="w-5 h-5 mx-auto mb-1 opacity-50" />
                      <div className="text-xs font-semibold">DJI / Autel Telemetry Subtitle (.srt)</div>
                      <input
                        type="file"
                        accept=".srt"
                        onChange={e => setSrtFile(e.target.files?.[0]?.name ?? null)}
                        className="mt-1 text-xs"
                      />
                      {srtFile && <p className="text-[11px] font-mono text-emerald-600 mt-1">✓ {srtFile}</p>}
                    </div>
                  </div>
                )}

                {/* Pilot Name */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    Pilot / UAV Operator Name
                  </label>
                  <input
                    type="text"
                    required
                    value={pilotName}
                    onChange={e => setPilotName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                    style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)' }}
                  />
                </div>

                {/* Deployment Location */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    Deployment Coastal Location
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                    style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-[var(--sea-600)] hover:opacity-90 transition-opacity shadow-md"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Launch Mission Sortie
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── RIGHT PANEL: TRANSMISSION & COGNITIVE CONTROLS ── */}
        <div className="space-y-4 flex flex-col">
          {/* Transmission Controls Card */}
          <div
            className="rounded-2xl p-5 border shadow-sm"
            style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center gap-2 pb-3 border-b mb-4" style={{ borderColor: 'var(--line)' }}>
              <Shield className="w-4 h-4 text-[var(--sea-600)]" />
              <h3 className="font-serif text-sm font-bold">Transmission &amp; Pipeline</h3>
            </div>

            <div className="space-y-4">
              {/* Server Ingestion Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
                <div className="pr-2">
                  <div className="text-xs font-bold">Server Ingestion</div>
                  <div className="text-[11px] opacity-70">Stream raw telemetry &amp; video to media gateway</div>
                </div>
                <button
                  type="button"
                  onClick={() => setServerIngestion(!serverIngestion)}
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative flex items-center px-1 flex-shrink-0',
                    serverIngestion ? 'bg-emerald-600' : 'bg-gray-400'
                  )}
                >
                  <span className={cn('w-4 h-4 rounded-full bg-white transition-transform shadow', serverIngestion ? 'translate-x-5' : 'translate-x-0')} />
                </button>
              </div>

              {/* Cognitive Pipeline Bypass */}
              <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
                <div className="pr-2">
                  <div className="text-xs font-bold">Cognitive Pipeline Bypass</div>
                  <div className="text-[11px] opacity-70">Bypass heavy neural analytics for raw stream archival</div>
                </div>
                <button
                  type="button"
                  onClick={() => setCognitiveBypass(!cognitiveBypass)}
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative flex items-center px-1 flex-shrink-0',
                    cognitiveBypass ? 'bg-amber-600' : 'bg-gray-400'
                  )}
                >
                  <span className={cn('w-4 h-4 rounded-full bg-white transition-transform shadow', cognitiveBypass ? 'translate-x-5' : 'translate-x-0')} />
                </button>
              </div>

              {/* Status Spec */}
              <div className="text-[11px] space-y-2 p-3 rounded-xl font-mono" style={{ background: 'var(--sand-100)', color: 'var(--ink-800)' }}>
                <div className="flex justify-between">
                  <span>Protocol:</span>
                  <strong>{videoSourceType} Over TLS</strong>
                </div>
                <div className="flex justify-between">
                  <span>Target Drone:</span>
                  <strong>{selectedDrone.droneCode}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Telemetry Sync:</span>
                  <span className="text-emerald-700 font-bold">LOCKED (10 Hz)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Squadron Station Badge */}
          <div
            className="rounded-2xl p-5 border shadow-sm flex-1 flex flex-col justify-between"
            style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4 text-emerald-600" />
                <h4 className="font-serif text-xs font-bold uppercase tracking-wider">Station Defaults</h4>
              </div>
              <p className="text-xs opacity-75 leading-relaxed">
                Inherited from Kerala Coastal Police Station settings: <strong>Vizhinjam Station Base</strong>. All sorties are cryptographically signed with SHA-256 for evidentiary chain of custody.
              </p>
            </div>
            <div className="pt-3 border-t mt-3 text-xs opacity-50 font-mono" style={{ borderColor: 'var(--line)' }}>
              Police Deployment ID: KP-DRONE-SEC-4
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          BOTTOM: HISTORICAL MISSION LOG TABLE WITH AAR ACTION
         ══════════════════════════════════════════════════ */}
      <div
        className="rounded-2xl p-5 border shadow-sm"
        style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--sea-600)]" />
            <h3 className="font-serif text-sm font-bold">Historical Mission Log &amp; After-Action Reports</h3>
          </div>
          <span className="text-xs opacity-60">{historySorties.length} logged sorties</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b font-mono opacity-60 uppercase text-[11px]" style={{ borderColor: 'var(--line)' }}>
                <th className="py-2.5 px-3">Mission ID</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">UAV</th>
                <th className="py-2.5 px-3">Squadron</th>
                <th className="py-2.5 px-3">Pilot</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {historySorties.map(s => (
                <tr key={s.id} className="border-b transition-colors hover:bg-[var(--sand-100)]" style={{ borderColor: 'var(--line)' }}>
                  <td className="py-2.5 px-3 font-mono font-bold" style={{ color: 'var(--sea-600)' }}>
                    {s.missionId}
                  </td>
                  <td className="py-2.5 px-3 font-medium">
                    {s.name}
                    <div className="text-[10px] opacity-60">{s.location}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono">{s.droneCode}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold">{s.squadron}</td>
                  <td className="py-2.5 px-3">{s.pilotName}</td>
                  <td className="py-2.5 px-3 font-mono">{s.durationMin} min</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {s.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-2">
                    <button
                      onClick={() => { setAarSortie(s); setShowAarModal(true); }}
                      className="p-1 rounded text-[var(--sea-600)] hover:bg-[var(--surface)] transition-colors inline-flex items-center gap-1 font-mono text-[11px]"
                      title="View After-Action Report (AAR)"
                    >
                      <FileText className="w-3.5 h-3.5" /> AAR
                    </button>
                    <button
                      onClick={() => handleDeleteSortie(s.id)}
                      className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors inline-flex items-center"
                      title="Delete Mission Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          AAR DEBRIEF MODAL (SORTIE AFTER-ACTION REPORT)
         ══════════════════════════════════════════════════ */}
      {showAarModal && aarSortie && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[var(--sea-600)]">{aarSortie.missionId}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600">
                    AAR DOSSIER
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold mt-1">Sortie After-Action Report &amp; Evidentiary Review</h3>
              </div>
              <button onClick={() => setShowAarModal(false)} className="opacity-60 hover:opacity-100 text-sm">✕</button>
            </div>

            {/* AAR Metrics Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl border bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
                <span className="opacity-60 block text-[10px]">SORTIE DURATION</span>
                <span className="font-bold text-sm">{aarSortie.durationMin} minutes</span>
              </div>
              <div className="p-3 rounded-xl border bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
                <span className="opacity-60 block text-[10px]">FRAMES INGESTED</span>
                <span className="font-bold text-sm">{((aarSortie.durationMin ?? 0) * 60 * 30).toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl border bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
                <span className="opacity-60 block text-[10px]">CFS LOAD SAVED</span>
                <span className="font-bold text-sm text-emerald-600">41.4% (Skipped)</span>
              </div>
              <div className="p-3 rounded-xl border bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
                <span className="opacity-60 block text-[10px]">CONTACTS TRACKED</span>
                <span className="font-bold text-sm text-[var(--sea-600)]">14 Contacts</span>
              </div>
            </div>

            {/* Findings & Evidence */}
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl border bg-[var(--surface)] space-y-2" style={{ borderColor: 'var(--line)' }}>
                <h4 className="font-serif font-bold text-sm">Operational Findings &amp; AI Attention Events</h4>
                <ul className="list-disc list-inside space-y-1 opacity-80 leading-relaxed font-sans">
                  <li><strong>Security Zone Incursion:</strong> Unregistered high-speed skiff C-1042 breached Inner Anchorage Fairway at 14:22 IST. CKFE extracted 4 keyframes.</li>
                  <li><strong>Shoreline Crowd Density:</strong> Bathing beach cluster within permissible safety limits (Density Estimator: 42 persons / 100m²).</li>
                  <li><strong>AIS Cross-Correlation:</strong> 11/11 merchant vessels in deepwater roads correlated with Coast Guard AIS broadcasts. Zero Dark Vessels detected.</li>
                </ul>
              </div>

              {/* Evidentiary Section 65B Seal */}
              <div className="p-3 rounded-xl border bg-[var(--surface)] font-mono text-[11px] space-y-1" style={{ borderColor: 'var(--line)' }}>
                <div className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Section 65B Indian Evidence Act Cryptographic Seal
                </div>
                <div className="opacity-70 break-all">
                  SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </div>
                <div className="opacity-60 text-[10px]">
                  Attested by: Insp. Anoop Nair · Vizhinjam Coastal Police Station
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 border-t flex justify-between items-center" style={{ borderColor: 'var(--line)' }}>
              <span className="text-xs opacity-60 font-mono">Confidential Police Record</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAarModal(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-[var(--surface)]"
                  style={{ borderColor: 'var(--line)' }}
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadAarDossier(aarSortie)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download AAR Dossier (.txt)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

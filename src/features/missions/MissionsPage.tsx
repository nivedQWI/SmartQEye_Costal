// ============================================================
// SmartQEye Coastal — Missions & Sorties Page (/missions)
// As specified in Costal Police .docx
// ============================================================

import { useState, useEffect } from 'react';
import {
  Anchor, Play, Square, RefreshCw, Upload, Video,
  Radio, Shield, HardDrive, Cpu, Trash2, CheckCircle2,
  Clock, AlertCircle, FileText, ChevronRight
} from 'lucide-react';
import { cn, formatIST } from '@/lib/utils';
import { UAVS } from '@/lib/mockData';
import type { MissionSortie, Squadron, VideoSourceType } from '@/types';

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
  const [missionName, setMissionName] = useState('Vizhinjam Harbor Dawn Patrol');
  const [missionId, setMissionId] = useState(generateMissionId('ALPHA'));
  const [selectedDroneId, setSelectedDroneId] = useState(UAVS[0].id);
  const [videoSourceType, setVideoSourceType] = useState<VideoSourceType>('RTMP');
  const [videoSourceUrl, setVideoSourceUrl] = useState('rtmp://192.168.1.120:1935/live/uav_kl01');
  const [uploadedVideoFile, setUploadedVideoFile] = useState<string | null>(null);
  const [srtFile, setSrtFile] = useState<string | null>(null);
  const [pilotName, setPilotName] = useState('SI Ramesh Kumar (KP-8842)');
  const [location, setLocation] = useState('Vizhinjam Coastal Police Station');

  // Transmission controls
  const [serverIngestion, setServerIngestion] = useState(true);
  const [cognitiveBypass, setCognitiveBypass] = useState(false);

  // Active mission state
  const [activeSortie, setActiveSortie] = useState<MissionSortie | null>({
    id: 'sort-active-1',
    missionId: 'MSN-20261013-0940-12-ALPHA',
    name: 'Sector Charlie Shoreline Surveillance',
    droneId: UAVS[0].id,
    droneCode: UAVS[0].droneCode,
    squadron: 'ALPHA',
    videoSourceType: 'RTMP',
    videoSourceUrl: 'rtmp://10.12.0.4/live/uav_kl01',
    pilotName: 'Insp. Anoop Nair',
    location: 'Vizhinjam Deepwater Harbor',
    status: 'ACTIVE',
    serverIngestion: true,
    cognitiveBypass: false,
    bitrateMbps: 8.4,
    fps: 29.8,
    packetLossPct: 0.04,
    startedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    durationMin: 42,
  });

  // Historical Sorties
  const [historySorties, setHistorySorties] = useState<MissionSortie[]>([
    {
      id: 'sort-h-1',
      missionId: 'MSN-20261012-1430-00-BRAVO',
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
      missionId: 'MSN-20261012-0915-00-ALPHA',
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
      startedAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 27 * 3600 * 1000).toISOString(),
      durationMin: 74,
    },
    {
      id: 'sort-h-3',
      missionId: 'MSN-20261011-1820-00-CHARLIE',
      name: 'Vizhinjam International Terminal Basin Night Sortie',
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
      startedAt: new Date(Date.now() - 44 * 3600 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 43 * 3600 * 1000).toISOString(),
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
  }

  function handleDeleteSortie(id: string) {
    setHistorySorties(historySorties.filter(s => s.id !== id));
  }

  const selectedDrone = UAVS.find(u => u.id === selectedDroneId) ?? UAVS[0];

  return (
    <div className="h-full flex flex-col overflow-y-auto chart-paper p-4 md:p-6 gap-5">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Missions &amp; Sorties
          </h1>
          <p className="text-xs opacity-70" style={{ color: 'var(--text-muted)' }}>
            Start and terminate drone surveillance sorties, configure ingestion, and manage mission flight logs
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
          TOP: ACTIVE MISSION STATUS BANNER
         ══════════════════════════════════════════════════ */}
      {activeSortie ? (
        <div
          className="rounded-2xl p-4 border flex items-center justify-between flex-wrap gap-4 shadow-md"
          style={{
            background: 'linear-gradient(135deg, rgba(43, 127, 166, 0.08) 0%, rgba(238, 223, 181, 0.25) 100%)',
            borderColor: 'var(--sea-400)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500/15 border border-emerald-500 text-emerald-600 dark:text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500 text-white">
                  LIVE SORTIE ACTIVE
                </span>
                <span className="font-mono text-xs font-semibold opacity-75">{activeSortie.missionId}</span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-bold"
                  style={{ background: 'var(--sand-200)', color: 'var(--ink-900)' }}>
                  SQUADRON {activeSortie.squadron}
                </span>
              </div>
              <h2 className="font-serif text-lg font-bold mt-0.5" style={{ color: 'var(--text)' }}>
                {activeSortie.name}
              </h2>
              <div className="flex items-center gap-4 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                <span>Drone: <strong className="font-mono">{activeSortie.droneCode}</strong></span>
                <span>Pilot: <strong>{activeSortie.pilotName}</strong></span>
                <span>Location: <strong>{activeSortie.location}</strong></span>
                <span>Stream: <strong>{activeSortie.bitrateMbps} Mbps @ {activeSortie.fps} FPS</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={handleStopMission}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
            >
              <Square className="w-4 h-4 fill-white" />
              Stop Mission
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
            <span>No drone sortie currently active. Configure and launch a sortie below.</span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MAIN CENTER: SPLIT 2 COLUMNS
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
                  Start Mission Sortie
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
          BOTTOM: HISTORICAL MISSION LOG TABLE
         ══════════════════════════════════════════════════ */}
      <div
        className="rounded-2xl p-5 border shadow-sm"
        style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--sea-600)]" />
            <h3 className="font-serif text-sm font-bold">Historical Mission Log</h3>
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
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleDeleteSortie(s.id)}
                      className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
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
    </div>
  );
}

// ============================================================
// SmartQEye Coastal — Mission Control Page (/missions)
// Multi-Mission Concurrent UAV Deployment & Real-Time Stream Ingestion
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Anchor, Play, Square, RefreshCw, Upload, Video,
  Radio, Shield, Trash2, Clock, AlertCircle, FileText,
  Grid, ExternalLink, CheckCircle2, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UAVS } from '@/lib/mockData';
import { useAuthStore, useMissionStore, useFeedStore } from '@/lib/store';
import { saveUploadedVideo, removeUploadedVideo } from '@/lib/videoStorage';
import { can } from '@/lib/roleConfig';
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
  const navigate = useNavigate();
  const { user, devRole } = useAuthStore();
  const activeRole = user?.role ?? devRole ?? 'OPERATOR';

  // Global Multi-Mission Store
  const {
    activeMissions,
    historyMissions,
    startMission,
    stopMission,
    deleteHistoryMission,
  } = useMissionStore();

  const { feeds } = useFeedStore();

  const [squadron, setSquadron] = useState<Squadron>('ALPHA');
  const [missionName, setMissionName] = useState('Monitoring');
  const [missionId, setMissionId] = useState(generateMissionId('ALPHA'));
  const [selectedDroneId, setSelectedDroneId] = useState(UAVS[0].id);
  const [videoSourceType, setVideoSourceType] = useState<VideoSourceType>('RTMP');
  const [videoSourceUrl, setVideoSourceUrl] = useState('');
  const [stagedRawFile, setStagedRawFile] = useState<File | null>(null);
  const [stagedVideoFile, setStagedVideoFile] = useState<string | null>(null);
  const [stagedVideoUrl, setStagedVideoUrl] = useState<string | null>(null);
  const [srtFile, setSrtFile] = useState<string | null>(null);
  const [pilotName, setPilotName] = useState('Viswanath');
  const [location, setLocation] = useState('Trivandrum');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Selected preview mission from active missions
  const [selectedPreviewMissionId, setSelectedPreviewMissionId] = useState<string | null>(null);
  const previewMission = activeMissions.find(m => m.id === selectedPreviewMissionId) ?? activeMissions[0] ?? null;

  // Refs for video management and safe object URL lifecycle
  const objectUrlRef = useRef<string | null>(null);
  const formFileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Transmission controls
  const [serverIngestion, setServerIngestion] = useState(true);
  const [cognitiveBypass, setCognitiveBypass] = useState(false);

  // Video file selected in the New Mission form
  function handleFormFileSelect(file: File) {
    setStagedRawFile(file);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setStagedVideoFile(file.name);
    setStagedVideoUrl(url);
  }

  function handleClearFormVideo() {
    setStagedRawFile(null);
    setStagedVideoFile(null);
    setStagedVideoUrl(null);
    if (formFileInputRef.current) formFileInputRef.current.value = '';
  }

  function handleRegenerateId(sq = squadron) {
    setMissionId(generateMissionId(sq));
  }

  function handleSquadronChange(sq: Squadron) {
    setSquadron(sq);
    handleRegenerateId(sq);
  }

  async function handleStartMission(e: React.FormEvent) {
    e.preventDefault();
    const drone = UAVS.find(u => u.id === selectedDroneId) ?? UAVS[0];
    const sortieId = `msn-${Date.now()}`;

    let resolvedVideoUrl: string | undefined = undefined;
    if (videoSourceType === 'UPLOAD') {
      if (stagedRawFile) {
        resolvedVideoUrl = await saveUploadedVideo(sortieId, stagedRawFile);
      } else if (stagedVideoUrl) {
        resolvedVideoUrl = stagedVideoUrl;
      }
    } else if (videoSourceUrl.trim()) {
      resolvedVideoUrl = videoSourceUrl.trim();
    }

    const newSortie: MissionSortie = {
      id: sortieId,
      missionId,
      name: missionName.trim() || `${drone.droneCode} Coastal Surveillance Sortie`,
      droneId: drone.id,
      droneCode: drone.droneCode,
      squadron,
      videoSourceType,
      videoSourceUrl: resolvedVideoUrl,
      srtFileName: srtFile ?? undefined,
      pilotName: pilotName.trim() || 'Officer In-Charge',
      location: location.trim() || 'Kerala Coastal Sector',
      status: 'ACTIVE',
      serverIngestion,
      cognitiveBypass,
      bitrateMbps: 8.6,
      fps: 30.0,
      packetLossPct: 0.02,
      startedAt: new Date().toISOString(),
      durationMin: 1,
    };

    startMission(newSortie);
    setSelectedPreviewMissionId(newSortie.id);

    // Show temporary confirmation
    setSuccessToast(`Mission ${newSortie.missionId} successfully deployed! Video feed active on Fleet Wall.`);
    setTimeout(() => setSuccessToast(null), 6000);

    // Reset form for next mission
    setMissionName('Monitoring');
    setPilotName('Viswanath');
    setLocation('Trivandrum');
    setVideoSourceUrl('');
    setStagedRawFile(null);
    setStagedVideoFile(null);
    setStagedVideoUrl(null);
    objectUrlRef.current = null;
    if (formFileInputRef.current) formFileInputRef.current.value = '';
    handleRegenerateId();
  }

  const selectedDrone = UAVS.find(u => u.id === selectedDroneId) ?? UAVS[0];

  return (
    <div className="h-full flex flex-col overflow-y-auto chart-paper p-4 md:p-6 gap-5">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Anchor className="w-5 h-5 text-sky-500" />
            <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Mission Control &amp; Deployment
            </h1>
          </div>
          <p className="text-xs opacity-70 mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Deploy concurrent drone surveillance sorties · Ingest RTMP, RTSP &amp; MP4 video feeds directly to Tactical Fleet Wall
          </p>
        </div>

        {/* Fleet Wall Shortcut Link */}
        <button
          onClick={() => navigate('/fleet')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Grid className="w-4 h-4" />
          <span>Go to Fleet Wall ({feeds.length} Streams Active)</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => navigate('/fleet')}
            className="underline font-bold hover:text-white cursor-pointer ml-3 flex items-center gap-1"
          >
            <span>View Feeds</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          ACTIVE MISSIONS PANEL (Supports Multiple Concurrent Sorties)
         ══════════════════════════════════════════════════ */}
      <div
        className="rounded-2xl p-4 border shadow-sm flex flex-col gap-3"
        style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-2" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="font-serif text-sm font-bold" style={{ color: 'var(--text)' }}>
              Active Concurrent Missions ({activeMissions.length})
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
              ALL FEEDS STREAMED TO FLEET WALL
            </span>
          </div>

          {activeMissions.length > 0 && (
            <button
              onClick={() => navigate('/fleet')}
              className="text-xs font-mono text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All on Fleet Wall</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {activeMissions.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center text-center text-xs opacity-70">
            <AlertCircle className="w-8 h-8 text-amber-500 mb-2 opacity-80" />
            <p className="font-semibold text-slate-300">No UAV missions currently active</p>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-md">
              Configure mission parameters and provide an RTMP, RTSP, or MP4 video feed below, then click &ldquo;Deploy Mission&rdquo; to start streaming.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {activeMissions.map(m => {
              const hasVideo = Boolean(m.videoSourceUrl && m.videoSourceUrl.trim());
              const isSelected = previewMission?.id === m.id;

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedPreviewMissionId(m.id)}
                  className={cn(
                    'p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all cursor-pointer relative shadow-xs',
                    isSelected
                      ? 'border-sky-500 bg-sky-950/20 ring-1 ring-sky-500'
                      : 'border-white/10 hover:border-white/30 bg-black/30'
                  )}
                >
                  <div>
                    {/* Header: Drone Code & Status */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-extrabold text-sky-400">
                          {m.droneCode}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sand-200 text-ink-900 font-bold"
                          style={{ background: 'var(--sand-200)', color: 'var(--ink-900)' }}>
                          SQ {m.squadron}
                        </span>
                      </div>

                      {hasVideo ? (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          LIVE {m.videoSourceType}
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          NO SIGNAL
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-xs font-bold truncate text-slate-100" title={m.name}>
                      {m.name}
                    </h3>
                    <div className="text-[10px] font-mono text-slate-400 mt-1 space-y-0.5">
                      <div className="truncate"><b>Loc:</b> {m.location}</div>
                      <div><b>Pilot:</b> {m.pilotName}</div>
                      <div className="truncate opacity-75 font-mono text-[9px]">{m.missionId}</div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/fleet`);
                      }}
                      className="text-[11px] font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Grid className="w-3 h-3" />
                      <span>View Stream</span>
                    </button>

                    {can(activeRole, 'START_STOP_MISSION') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          stopMission(m.id);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono font-bold text-red-300 hover:bg-red-950/60 border border-red-500/30 transition-colors cursor-pointer"
                        title="Stop and terminate this mission"
                      >
                        <Square className="w-3 h-3 fill-red-400" />
                        <span>Stop</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          MAIN CENTER: SPLIT 2 COLUMNS (DEPLOY FORM + PREVIEW)
         ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── LEFT FORM: DEPLOY NEW MISSION (2 Columns Span) ── */}
        <div
          className="lg:col-span-2 rounded-2xl p-5 border shadow-sm flex flex-col justify-between"
          style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <Anchor className="w-5 h-5 text-sky-500" />
                <h2 className="font-serif text-base font-bold">Deploy New Mission Sortie</h2>
              </div>
              <span className="text-xs opacity-60 font-mono">Standardized Protocol v2.5</span>
            </div>

            <form onSubmit={handleStartMission} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mission Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    Mission Name / Operation Title
                  </label>
                  <input
                    type="text"
                    required
                    value={missionName}
                    onChange={e => setMissionName(e.target.value)}
                    placeholder="Enter mission title (e.g. Cochin Coastal Sector Patrol)..."
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
                      className="text-xs flex items-center gap-1 opacity-70 hover:opacity-100 cursor-pointer"
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
                          'py-1.5 px-2 rounded-xl text-xs font-mono font-bold border transition-all text-center cursor-pointer',
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
                    Video Stream Source Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { type: 'RTMP' as VideoSourceType, label: 'RTMP Live Feed', icon: Radio },
                      { type: 'RTSP' as VideoSourceType, label: 'RTSP Stream URL', icon: Video },
                      { type: 'HLS' as VideoSourceType, label: 'HLS Stream (.m3u8)', icon: Video },
                      { type: 'UPLOAD' as VideoSourceType, label: 'Video File Upload', icon: Upload },
                    ].map(st => (
                      <button
                        key={st.type}
                        type="button"
                        onClick={() => setVideoSourceType(st.type)}
                        className={cn(
                          'flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer',
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
                      {videoSourceType} Endpoint URL (Leave blank to deploy with NO SIGNAL)
                    </label>
                    <input
                      type="text"
                      value={videoSourceUrl}
                      onChange={e => setVideoSourceUrl(e.target.value)}
                      placeholder={
                        videoSourceType === 'RTMP'
                          ? 'e.g. rtmp://localhost:1935/live/dronefeed'
                          : videoSourceType === 'HLS'
                          ? 'e.g. http://localhost:8888/live/dronefeed/index.m3u8'
                          : 'e.g. rtsp://user:pass@camera.coastal.gov.in:554/live'
                      }
                      className="w-full px-3 py-2 rounded-xl text-sm border font-mono outline-none"
                      style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)' }}
                    />
                    <p className="text-[11px] opacity-60 mt-1">
                      Tip: RTMP &amp; RTSP streams published to MediaMTX are automatically converted to browser HLS streams.
                    </p>
                  </div>
                ) : (
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border-2 border-dashed rounded-xl p-3 text-center" style={{ borderColor: 'var(--line)' }}>
                      <Upload className="w-5 h-5 mx-auto mb-1 opacity-50" />
                      <div className="text-xs font-semibold">Raw Video (MP4 / WebM / MOV)</div>
                      <input
                        ref={formFileInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleFormFileSelect(file);
                        }}
                        className="mt-1 text-xs cursor-pointer"
                      />
                      {stagedVideoFile && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <p className="text-[11px] font-mono text-emerald-600 font-semibold truncate max-w-[200px]" title={stagedVideoFile}>
                            ✓ {stagedVideoFile}
                          </p>
                          <button
                            type="button"
                            onClick={handleClearFormVideo}
                            className="text-[10px] text-red-500 hover:underline cursor-pointer font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="border-2 border-dashed rounded-xl p-3 text-center" style={{ borderColor: 'var(--line)' }}>
                      <FileText className="w-5 h-5 mx-auto mb-1 opacity-50" />
                      <div className="text-xs font-semibold">DJI / Autel Telemetry Subtitle (.srt)</div>
                      <input
                        type="file"
                        accept=".srt"
                        onChange={e => setSrtFile(e.target.files?.[0]?.name ?? null)}
                        className="mt-1 text-xs cursor-pointer"
                      />
                      {srtFile && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <p className="text-[11px] font-mono text-emerald-600 font-semibold truncate max-w-[200px]" title={srtFile}>
                            ✓ {srtFile}
                          </p>
                          <button
                            type="button"
                            onClick={() => setSrtFile(null)}
                            className="text-[10px] text-red-500 hover:underline cursor-pointer font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      )}
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
                    placeholder="Enter pilot / operator name..."
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
                    placeholder="Enter coastal deployment location (e.g. Alappuzha Beach)..."
                    className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                    style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              {can(activeRole, 'START_STOP_MISSION') && (
                <div className="pt-3 flex items-center justify-between border-t border-white/10">
                  <span className="text-xs font-mono opacity-60">
                    Active Sorties: {activeMissions.length}
                  </span>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-[var(--sea-600)] hover:opacity-90 transition-opacity shadow-md cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Deploy Mission &amp; Ingest Stream
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* ── RIGHT PANEL: MISSION PREVIEW & TRANSMISSION CONTROLS ── */}
        <div className="space-y-4 flex flex-col">
          {/* Active Preview Card */}
          <div
            className="rounded-2xl p-4 border shadow-sm flex flex-col justify-between"
            style={{ background: 'var(--raised)', borderColor: 'var(--line)', minHeight: '260px' }}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-sky-500" />
                <h4 className="font-serif text-xs font-bold uppercase tracking-wider">
                  {previewMission ? `Stream Monitor (${previewMission.droneCode})` : 'Mission Monitor'}
                </h4>
              </div>

              {previewMission?.videoSourceUrl ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  FEED LIVE
                </span>
              ) : previewMission ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  NO SIGNAL
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded opacity-60" style={{ background: 'var(--sand-200)', color: 'var(--ink-800)' }}>
                  STANDBY
                </span>
              )}
            </div>

            {/* Video Viewport */}
            <div
              className="flex-1 rounded-xl overflow-hidden relative flex flex-col items-center justify-center border bg-black/95 min-h-[160px]"
              style={{ borderColor: 'var(--line)' }}
            >
              {previewMission && previewMission.videoSourceUrl ? (
                <video
                  ref={videoRef}
                  key={previewMission.videoSourceUrl}
                  src={previewMission.videoSourceUrl}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full max-h-[220px] object-contain rounded-xl"
                />
              ) : previewMission ? (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <Radio className="w-8 h-8 text-amber-400 animate-pulse mb-2" />
                  <p className="text-xs text-amber-300 font-bold">NO CAMERA SIGNAL DETECTED</p>
                  <p className="text-[11px] font-mono text-slate-400 max-w-[220px] mt-1">
                    No stream URL provided for {previewMission.droneCode}. Tile on Fleet Wall displays tactical NO SIGNAL.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <Video className="w-8 h-8 opacity-40 text-sky-400 mb-2" />
                  <p className="text-xs text-white/90 font-semibold">Awaiting Mission Launch</p>
                  <p className="text-[11px] text-white/50 max-w-[230px] mt-1 leading-normal">
                    Uploaded video or stream link will play here once you deploy a mission.
                  </p>
                </div>
              )}
            </div>

            {previewMission && (
              <div className="pt-2 mt-2 border-t text-[11px] font-mono flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
                <span className="truncate max-w-[200px] text-emerald-400 font-semibold" title={previewMission.name}>
                  {previewMission.name}
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/fleet')}
                  className="text-sky-400 hover:underline flex items-center gap-1 font-bold"
                >
                  Fleet Wall →
                </button>
              </div>
            )}
          </div>

          {/* Transmission Controls Card */}
          <div
            className="rounded-2xl p-4 border shadow-sm"
            style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center gap-2 pb-2 border-b mb-3" style={{ borderColor: 'var(--line)' }}>
              <Shield className="w-4 h-4 text-sky-500" />
              <h3 className="font-serif text-xs font-bold uppercase tracking-wider">Transmission &amp; Gateway</h3>
            </div>

            <div className="space-y-3">
              {/* Server Ingestion Toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
                <div>
                  <div className="text-xs font-bold">MediaMTX Server Ingestion</div>
                  <div className="text-[10px] opacity-70">Push stream to low-latency media gateway</div>
                </div>
                <button
                  type="button"
                  onClick={() => setServerIngestion(!serverIngestion)}
                  className={cn(
                    'w-10 h-5 rounded-full transition-colors relative flex items-center px-1 flex-shrink-0 cursor-pointer',
                    serverIngestion ? 'bg-emerald-600' : 'bg-gray-400'
                  )}
                >
                  <span className={cn('w-3.5 h-3.5 rounded-full bg-white transition-transform shadow', serverIngestion ? 'translate-x-4' : 'translate-x-0')} />
                </button>
              </div>

              {/* Status Spec */}
              <div className="text-[11px] space-y-1.5 p-2.5 rounded-xl font-mono" style={{ background: 'var(--sand-100)', color: 'var(--ink-800)' }}>
                <div className="flex justify-between">
                  <span>Selected Drone:</span>
                  <strong>{selectedDrone.droneCode}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Squadron:</span>
                  <strong>{squadron}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Telemetry Sync:</span>
                  <span className="text-emerald-700 font-bold">LOCKED (10 Hz)</span>
                </div>
              </div>
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
            <Clock className="w-4 h-4 text-sky-500" />
            <h3 className="font-serif text-sm font-bold">Historical Mission Log</h3>
          </div>
          <span className="text-xs opacity-60 font-mono">{historyMissions.length} completed missions logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b font-mono opacity-60 uppercase text-[11px]" style={{ borderColor: 'var(--line)' }}>
                <th className="py-2.5 px-3">Mission ID</th>
                <th className="py-2.5 px-3">Operation Name</th>
                <th className="py-2.5 px-3">UAV</th>
                <th className="py-2.5 px-3">Squadron</th>
                <th className="py-2.5 px-3">Pilot</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Status</th>
                {can(activeRole, 'DELETE_MISSION') && (
                  <th className="py-2.5 px-3 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {historyMissions.map(s => (
                <tr key={s.id} className="border-b transition-colors hover:bg-[var(--sand-100)]" style={{ borderColor: 'var(--line)' }}>
                  <td className="py-2.5 px-3 font-mono font-bold text-sky-600">
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
                  {can(activeRole, 'DELETE_MISSION') && (
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => deleteHistoryMission(s.id)}
                        className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Mission Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SmartQEye Coastal — Recorded Drone Video Analysis & Forensics
// Dedicated module for post-mission forensic examination (Demo Step 3)
// Features Muthalapozhi Breakwater Channel & real Kerala Police sectors
// ============================================================

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Pause, SkipBack, SkipForward, RotateCcw,
  Sliders, Shield, Anchor, Eye, Flame, Moon, Award,
  Download, FileText, CheckCircle2, AlertTriangle,
  Upload, Clock, Compass, Navigation, Crosshair, ChevronRight,
  Sparkles, Layers, Video, Maximize2, Minimize2, ExternalLink
} from 'lucide-react';
import { cn, formatIST } from '@/lib/utils';
import { FILTER_PRESETS } from '@/lib/videoCatalog';
import { renderProceduralSea } from '@/lib/proceduralSea';
import type { Modality } from '@/types';

// ─── Sector Definition ────────────────────────────────────────

export interface CoastalSector {
  id: string;
  name: string;
  code: string;
  station: string;
  district: string;
  uavCode: string;
  pilot: string;
  videoSrc: string;
  modality: Modality;
  coords: { lat: number; lon: number };
  heading: number;
  altitudeM: number;
  hazardLevel: 'HIGH' | 'CRITICAL' | 'MODERATE' | 'LOW';
  operationalNote: string;
  primaryTarget: {
    trackId: string;
    craftName: string;
    classLabel: string;
    registrationNo: string;
    speedKnots: number;
    driftAngleDeg: number;
    distToRocksM: number;
    dwellSec: number;
  };
  milestones: { timeSec: number; label: string; severity: 'INFO' | 'CAUTION' | 'CRITICAL' }[];
}

export const KERALA_SECTORS: CoastalSector[] = [
  {
    id: 'sec-muthalapozhi',
    name: 'Muthalapozhi Breakwater Channel',
    code: 'SECTOR-KL-07',
    station: 'Anchuthengu / Muthalapozhi Coastal Police Station',
    district: 'Thiruvananthapuram Rural',
    uavCode: 'UAV-KL-01',
    pilot: 'SI Ramesh Kumar (KP-8842)',
    videoSrc: '/videos/RGB_7.mp4',
    modality: 'RGB',
    coords: { lat: 8.6342, lon: 76.7928 },
    heading: 248,
    altitudeM: 84,
    hazardLevel: 'CRITICAL',
    operationalNote: 'Hazardous sandbar bar mouth; heavy surf wave capsizing risk for artisanal motorized country craft.',
    primaryTarget: {
      trackId: 'TRK-MUTH-104',
      craftName: 'St. Mary (Kettuvalam)',
      classLabel: 'Motorised Country Craft (Valam)',
      registrationNo: 'KL-04-MM-2294',
      speedKnots: 8.4,
      driftAngleDeg: 14.2,
      distToRocksM: 26,
      dwellSec: 42,
    },
    milestones: [
      { timeSec: 15, label: 'Bar Mouth Approach', severity: 'INFO' },
      { timeSec: 42, label: 'Heavy Surf Wave Ingress', severity: 'CRITICAL' },
      { timeSec: 85, label: 'Channel Berth Clearance', severity: 'CAUTION' },
    ],
  },
  {
    id: 'sec-vizhinjam',
    name: 'Vizhinjam International Seaport Basin',
    code: 'SECTOR-KL-01',
    station: 'Vizhinjam Coastal Police Station',
    district: 'Thiruvananthapuram City',
    uavCode: 'UAV-KL-02',
    pilot: 'ASI Pradeep K. (KP-7190)',
    videoSrc: '/videos/RGB_1.mp4',
    modality: 'RGB',
    coords: { lat: 8.3756, lon: 76.9912 },
    heading: 195,
    altitudeM: 110,
    hazardLevel: 'HIGH',
    operationalNote: 'Deep-water container berth approach; unauthorized artisanal vessel buffer zone enforcement.',
    primaryTarget: {
      trackId: 'TRK-VIZH-208',
      craftName: 'Sea Lord VII',
      classLabel: 'Mechanised Trawler',
      registrationNo: 'KL-01-TR-4481',
      speedKnots: 11.2,
      driftAngleDeg: 5.8,
      distToRocksM: 88,
      dwellSec: 18,
    },
    milestones: [
      { timeSec: 10, label: 'Port Fairway Transit', severity: 'INFO' },
      { timeSec: 50, label: 'Outer Breakwater Turn', severity: 'CAUTION' },
    ],
  },
  {
    id: 'sec-kovalam',
    name: 'Kovalam Light House Beach Perimeter',
    code: 'SECTOR-KL-02',
    station: 'Kovalam Coastal Police Station',
    district: 'Thiruvananthapuram City',
    uavCode: 'UAV-KL-03',
    pilot: 'SI Manesh V. (KP-9021)',
    videoSrc: '/videos/RGB_2.mp4',
    modality: 'RGB',
    coords: { lat: 8.3988, lon: 76.9804 },
    heading: 310,
    altitudeM: 75,
    hazardLevel: 'MODERATE',
    operationalNote: 'Tourist zone perimeter; unauthorized water-sports demarcation line and night bather safety watch.',
    primaryTarget: {
      trackId: 'TRK-KOVL-019',
      craftName: 'Speedline Delta',
      classLabel: 'Commercial Speed Boat',
      registrationNo: 'KL-01-SP-1102',
      speedKnots: 16.5,
      driftAngleDeg: 2.1,
      distToRocksM: 140,
      dwellSec: 8,
    },
    milestones: [
      { timeSec: 20, label: 'Beach Boundary Scan', severity: 'INFO' },
      { timeSec: 65, label: 'Tourist Corridor Sweep', severity: 'INFO' },
    ],
  },
  {
    id: 'sec-neendakara',
    name: 'Neendakara Deep Harbor Outer Basin',
    code: 'SECTOR-KL-04',
    station: 'Neendakara Coastal Police Station',
    district: 'Kollam',
    uavCode: 'UAV-KL-04',
    pilot: 'HC Suresh M. (KP-6534)',
    videoSrc: '/videos/RGB_8.mp4',
    modality: 'RGB',
    coords: { lat: 8.9378, lon: 76.5367 },
    heading: 275,
    altitudeM: 95,
    hazardLevel: 'HIGH',
    operationalNote: 'Ashtamudi Lake bar mouth; high traffic mechanised trawler fleet navigation & night curfew monitoring.',
    primaryTarget: {
      trackId: 'TRK-NDK-312',
      craftName: 'Kadal Kanyaka',
      classLabel: 'Mechanised Gillnetter',
      registrationNo: 'KL-02-MM-8839',
      speedKnots: 7.9,
      driftAngleDeg: 8.4,
      distToRocksM: 52,
      dwellSec: 64,
    },
    milestones: [
      { timeSec: 25, label: 'Bridge Passage Sweep', severity: 'INFO' },
      { timeSec: 70, label: 'Bar Mouth Outflow', severity: 'CAUTION' },
    ],
  },
  {
    id: 'sec-kochi',
    name: 'Fort Kochi Port Channel & Naval Sector',
    code: 'SECTOR-KL-05',
    station: 'Fort Kochi Coastal Police Station',
    district: 'Ernakulam City',
    uavCode: 'UAV-KL-05',
    pilot: 'CI George Thomas (KP-5512)',
    videoSrc: '/videos/RGB_10.mp4',
    modality: 'RGB',
    coords: { lat: 9.9672, lon: 76.2415 },
    heading: 15,
    altitudeM: 120,
    hazardLevel: 'HIGH',
    operationalNote: 'Naval base approach channel; strict restriction on unmanifested country boats in fairway.',
    primaryTarget: {
      trackId: 'TRK-KCH-551',
      craftName: 'Periyar Queen',
      classLabel: 'Inland Passenger Launch',
      registrationNo: 'KL-07-PS-3011',
      speedKnots: 9.1,
      driftAngleDeg: 1.5,
      distToRocksM: 180,
      dwellSec: 15,
    },
    milestones: [
      { timeSec: 30, label: 'Naval Channel Approach', severity: 'INFO' },
      { timeSec: 75, label: 'Fairway Clearance', severity: 'INFO' },
    ],
  },
  {
    id: 'sec-beypore',
    name: 'Beypore Deep Harbour & Chaliyar Estuary',
    code: 'SECTOR-KL-06',
    station: 'Beypore Coastal Police Station',
    district: 'Kozhikode',
    uavCode: 'UAV-KL-06',
    pilot: 'ASI Vinod R. (KP-7823)',
    videoSrc: '/videos/RGB_11.mp4',
    modality: 'RGB',
    coords: { lat: 11.1642, lon: 75.8034 },
    heading: 180,
    altitudeM: 90,
    hazardLevel: 'MODERATE',
    operationalNote: 'Traditional Uru shipbuilding quays and cargo barge littoral zone surveillance.',
    primaryTarget: {
      trackId: 'TRK-BYP-702',
      craftName: 'Malabar Pride',
      classLabel: 'Cargo Barge / Dhow',
      registrationNo: 'KL-11-CB-0941',
      speedKnots: 5.6,
      driftAngleDeg: 3.2,
      distToRocksM: 74,
      dwellSec: 50,
    },
    milestones: [
      { timeSec: 18, label: 'Estuary Ingress', severity: 'INFO' },
      { timeSec: 60, label: 'Quay Berth Check', severity: 'INFO' },
    ],
  },
  {
    id: 'sec-azhikkal',
    name: 'Kannur Azhikkal Port Littoral Zone',
    code: 'SECTOR-KL-07-KNR',
    station: 'Azhikkal Coastal Police Station',
    district: 'Kannur',
    uavCode: 'UAV-KL-07',
    pilot: 'SI Shaji Kumar (KP-8144)',
    videoSrc: '/videos/RGB_12.mp4',
    modality: 'RGB',
    coords: { lat: 11.9312, lon: 75.3021 },
    heading: 260,
    altitudeM: 100,
    hazardLevel: 'MODERATE',
    operationalNote: 'Northern Valapattanam river mouth sandbar; illegal sand dredger and unlicensed boat sweep.',
    primaryTarget: {
      trackId: 'TRK-AZH-880',
      craftName: 'Dolphin 02',
      classLabel: 'Fiber Fishing Boat',
      registrationNo: 'KL-13-FB-6211',
      speedKnots: 6.8,
      driftAngleDeg: 4.5,
      distToRocksM: 45,
      dwellSec: 35,
    },
    milestones: [
      { timeSec: 20, label: 'River Mouth Transit', severity: 'INFO' },
      { timeSec: 55, label: 'Sandbar Perimeter', severity: 'INFO' },
    ],
  },
];

// ─── Keyframe Extraction Item ─────────────────────────────────

interface ExtractedKeyframe {
  id: string;
  timeSec: number;
  timestampIst: string;
  thumbnailUrl: string;
  sha256Hash: string;
  targetTrackId: string;
  craftName: string;
  classLabel: string;
  speedKnots: number;
  status: 'SEALED' | 'EVIDENCE_READY';
}

// ─── Main Component ──────────────────────────────────────────

export default function RecordedAnalysisPage() {
  const navigate = useNavigate();

  // Selected Coastal Sector (Default to Muthalapozhi Breakwater Channel)
  const [selectedSectorId, setSelectedSectorId] = useState<string>('sec-muthalapozhi');
  const sector = useMemo(() => KERALA_SECTORS.find(s => s.id === selectedSectorId) ?? KERALA_SECTORS[0], [selectedSectorId]);

  // Video & Playback State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(90);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [activeModality, setActiveModality] = useState<Modality>('RGB');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const [showTelemetryHud, setShowTelemetryHud] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Extracted Evidence Keyframes (CKFE)
  const [keyframes, setKeyframes] = useState<ExtractedKeyframe[]>([]);

  // Modals
  const [showSec65bModal, setShowSec65bModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedKeyframeForCert, setSelectedKeyframeForCert] = useState<ExtractedKeyframe | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-clear toast
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Apply active filter style based on sensor modality
  const filterStyle = FILTER_PRESETS[activeModality] ?? FILTER_PRESETS.RGB;

  // Sync playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Switch sector video
  useEffect(() => {
    setVideoLoaded(false);
    setVideoError(false);
    setCurrentTimeSec(0);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, [selectedSectorId]);

  // Handle Play/Pause
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // Frame Stepping (0.04s per frame at 25 FPS)
  const stepFrame = useCallback((forward: boolean) => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
    const step = 0.04;
    const newTime = forward
      ? Math.min(video.duration || 90, video.currentTime + step)
      : Math.max(0, video.currentTime - step);
    video.currentTime = newTime;
    setCurrentTimeSec(newTime);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepFrame(true);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepFrame(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stepFrame]);

  // Render Canvas Overlays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // If video failed or missing, render procedural sea as graceful backup
      if (videoError || !videoLoaded) {
        renderProceduralSea(ctx, width, height, currentTimeSec, activeModality);
      }

      if (showOverlays && (videoLoaded || videoError)) {
        // Draw Dynamic AI Bounding Box for Primary Target
        const t = currentTimeSec;
        // Synthesize realistic trajectory across the channel
        const normX = 0.35 + Math.sin(t * 0.12) * 0.18;
        const normY = 0.42 + Math.cos(t * 0.08) * 0.12;

        const boxW = width * 0.16;
        const boxH = height * 0.11;
        const boxX = (width * normX) - (boxW / 2);
        const boxY = (height * normY) - (boxH / 2);

        // Motion vector trail
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.45)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let i = 5; i >= 0; i--) {
          const pastT = Math.max(0, t - i * 0.6);
          const px = (width * (0.35 + Math.sin(pastT * 0.12) * 0.18));
          const py = (height * (0.42 + Math.cos(pastT * 0.08) * 0.12));
          if (i === 5) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Main Bounding Box
        ctx.strokeStyle = sector.hazardLevel === 'CRITICAL' ? '#EF4444' : '#00E5FF';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Corner reticles
        const cornerLen = 12;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + cornerLen);
        ctx.lineTo(boxX, boxY);
        ctx.lineTo(boxX + cornerLen, boxY);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - cornerLen, boxY);
        ctx.lineTo(boxX + boxW, boxY);
        ctx.lineTo(boxX + boxW, boxY + cornerLen);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + boxH - cornerLen);
        ctx.lineTo(boxX, boxY + boxH);
        ctx.lineTo(boxX + cornerLen, boxY + boxH);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - cornerLen, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH - cornerLen);
        ctx.stroke();

        // Label Pill above target
        const labelText = `${sector.primaryTarget.classLabel} (${sector.primaryTarget.speedKnots} kts)`;
        ctx.font = 'bold 11px monospace';
        const textWidth = ctx.measureText(labelText).width;

        ctx.fillStyle = sector.hazardLevel === 'CRITICAL' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(0, 150, 214, 0.9)';
        ctx.fillRect(boxX, boxY - 22, textWidth + 14, 20);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(labelText, boxX + 7, boxY - 8);

        // Craft Registration Sub-pill
        const regText = `${sector.primaryTarget.craftName} · ${sector.primaryTarget.registrationNo}`;
        ctx.font = '10px monospace';
        const regWidth = ctx.measureText(regText).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(boxX, boxY + boxH + 3, regWidth + 12, 18);
        ctx.fillStyle = '#E2E8F0';
        ctx.fillText(regText, boxX + 6, boxY + boxH + 16);

        // Breakwater proximity warning line if in Muthalapozhi
        if (sector.id === 'sec-muthalapozhi') {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(boxX + boxW / 2, boxY + boxH / 2);
          ctx.lineTo(width * 0.75, height * 0.65); // virtual tetrapod breakwater wall
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#FCA5A5';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`BREAKWATER DIST: ${sector.primaryTarget.distToRocksM}m [CAUTION]`, boxX + boxW / 2 + 10, boxY + boxH / 2 - 10);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [currentTimeSec, showOverlays, sector, activeModality, videoLoaded, videoError]);

  // Extract CKFE Keyframe
  const handleExtractKeyframe = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Snapshot image from canvas
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Deterministic pseudo SHA-256 for legal seal demo
    const rawStamp = `${sector.code}_${currentTimeSec.toFixed(2)}_${sector.primaryTarget.trackId}`;
    const pseudoHash = Array.from(rawStamp)
      .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0)
      .toString(16)
      .padStart(16, '0') + 'e4b98c7103dfa1789c6291a84f0';

    const newKeyframe: ExtractedKeyframe = {
      id: `kf-${Date.now()}`,
      timeSec: currentTimeSec,
      timestampIst: formatIST(new Date().toISOString()),
      thumbnailUrl: dataUrl,
      sha256Hash: pseudoHash,
      targetTrackId: sector.primaryTarget.trackId,
      craftName: sector.primaryTarget.craftName,
      classLabel: sector.primaryTarget.classLabel,
      speedKnots: sector.primaryTarget.speedKnots,
      status: 'SEALED',
    };

    setKeyframes(prev => [newKeyframe, ...prev]);
    setToastMessage(`Keyframe sealed at ${formatTime(currentTimeSec)} (SHA-256: ${pseudoHash.slice(0, 10)}...)`);
  };

  // Format seconds into mm:ss.ms
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      {/* ══════════════════════════════════════════════════
          PAGE HEADER & POLICE COMMAND BAR
         ══════════════════════════════════════════════════ */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between flex-wrap gap-3 flex-shrink-0"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-xs bg-[var(--sea-600)] text-white">
            <Anchor className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/15 text-sky-600 border border-sky-500/30">
                Kerala Police Coastal Security Wing
              </span>
              <span className="font-mono text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                POST-MISSION FORENSICS
              </span>
            </div>
            <h1 className="font-serif text-lg font-bold tracking-tight mt-0.5">
              Recorded Drone Video Analysis &amp; Investigation
            </h1>
          </div>
        </div>

        {/* Legal Seal Chip & Quick Nav */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs bg-[var(--raised)] border-[var(--line)]">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] font-semibold text-[var(--text)]">Sec 65B IEA / Sec 63 BNSS Ready</span>
          </div>

          <button
            onClick={() => navigate('/live')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--raised)] transition-all cursor-pointer border-[var(--line)]"
          >
            <Video className="w-3.5 h-3.5 text-sky-600" />
            Switch to Live Monitor
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          KERALA COASTAL SECTOR SELECTION CAROUSEL
         ══════════════════════════════════════════════════ */}
      <div
        className="px-4 py-2.5 border-b overflow-x-auto flex items-center gap-2.5 flex-shrink-0 scrollbar-none"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        <span className="text-[11px] font-mono uppercase tracking-wider font-semibold opacity-60 flex-shrink-0 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" /> Sector:
        </span>

        {KERALA_SECTORS.map(sec => {
          const isSelected = sec.id === selectedSectorId;
          const isFeatured = sec.id === 'sec-muthalapozhi';
          return (
            <button
              key={sec.id}
              onClick={() => setSelectedSectorId(sec.id)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer',
                isSelected
                  ? 'bg-[var(--sea-600)] text-white border-[var(--sea-600)] shadow-xs font-bold'
                  : 'bg-[var(--raised)] hover:bg-[var(--panel)] border-[var(--line)] opacity-80 hover:opacity-100'
              )}
            >
              {isFeatured && (
                <span className={cn('text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold', isSelected ? 'bg-amber-400 text-black' : 'bg-amber-500/20 text-amber-600')}>
                  Demo Step 3
                </span>
              )}
              <span>{sec.name}</span>
              <span className={cn('text-[10px] font-mono', isSelected ? 'text-white/80' : 'opacity-60')}>
                ({sec.code})
              </span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════
          MAIN BODY: FORENSIC WORKSPACE & SIDEBAR
         ══════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ── LEFT: Forensic Video Viewport & Scrubber Controls ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-black relative">
          {/* Top In-Video HUD Strip */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
            {/* Sector / Station Tag */}
            <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <div className="leading-tight">
                <div className="font-mono text-xs font-bold text-white uppercase">{sector.name}</div>
                <div className="font-mono text-[10px] text-white/70">{sector.station}</div>
              </div>
            </div>

            {/* Sensor Modality Toggle Pills */}
            <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md p-1 rounded-lg border border-white/20 pointer-events-auto">
              {(['RGB', 'THERMAL', 'NIGHT_VISION'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setActiveModality(m)}
                  className={cn(
                    'px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1',
                    activeModality === m
                      ? m === 'THERMAL'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : m === 'NIGHT_VISION'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-sky-600 text-white shadow-xs'
                      : 'text-white/70 hover:text-white'
                  )}
                >
                  {m === 'RGB' && <Eye className="w-3 h-3" />}
                  {m === 'THERMAL' && <Flame className="w-3 h-3" />}
                  {m === 'NIGHT_VISION' && <Moon className="w-3 h-3" />}
                  {m === 'NIGHT_VISION' ? 'NIGHT VISION' : m}
                </button>
              ))}
            </div>

            {/* Overlays / Fullscreen toggles */}
            <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md p-1 rounded-lg border border-white/20 pointer-events-auto">
              <button
                onClick={() => setShowOverlays(!showOverlays)}
                className={cn('px-2 py-1 rounded text-xs font-mono font-semibold transition-colors', showOverlays ? 'bg-sky-600 text-white' : 'text-white/60 hover:text-white')}
                title="Toggle AI Bounding Box Overlays"
              >
                AI Overlays
              </button>
              <button
                onClick={() => setShowTelemetryHud(!showTelemetryHud)}
                className={cn('px-2 py-1 rounded text-xs font-mono font-semibold transition-colors', showTelemetryHud ? 'bg-cyan-600 text-white' : 'text-white/60 hover:text-white')}
                title="Toggle Telemetry HUD"
              >
                HUD
              </button>
            </div>
          </div>

          {/* Telemetry OSD (Top Right Overlay) */}
          {showTelemetryHud && (
            <div className="absolute top-16 right-3 bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl border border-white/15 z-20 pointer-events-none font-mono text-[11px] space-y-1">
              <div className="flex justify-between gap-4 text-white/60">
                <span>GPS:</span>
                <span className="text-white font-bold">{sector.coords.lat.toFixed(4)}°N, {sector.coords.lon.toFixed(4)}°E</span>
              </div>
              <div className="flex justify-between gap-4 text-white/60">
                <span>ALTITUDE:</span>
                <span className="text-cyan-400 font-bold">{sector.altitudeM} m AGL</span>
              </div>
              <div className="flex justify-between gap-4 text-white/60">
                <span>HEADING:</span>
                <span className="text-amber-400 font-bold">{sector.heading}° WSW</span>
              </div>
              <div className="flex justify-between gap-4 text-white/60">
                <span>UAV / PILOT:</span>
                <span className="text-emerald-400 font-bold">{sector.uavCode}</span>
              </div>
            </div>
          )}

          {/* Video Container & Canvas Overlay */}
          <div ref={containerRef} className="flex-1 relative overflow-hidden flex items-center justify-center">
            {/* HTML5 Video Element */}
            <video
              ref={videoRef}
              key={sector.videoSrc}
              src={sector.videoSrc}
              muted
              playsInline
              preload="auto"
              style={filterStyle}
              className="absolute inset-0 w-full h-full object-contain"
              onLoadedMetadata={() => {
                setVideoLoaded(true);
                setVideoError(false);
                if (videoRef.current) {
                  setDurationSec(videoRef.current.duration || 90);
                }
              }}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentTimeSec(videoRef.current.currentTime);
                }
              }}
              onEnded={() => setIsPlaying(false)}
              onError={() => {
                setVideoError(true);
                setVideoLoaded(false);
              }}
            />

            {/* Synchronized Canvas HUD Overlay */}
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
            />
          </div>

          {/* ── Scrubber & Transport Control Bar ── */}
          <div className="p-3 border-t bg-[#08121E] border-white/15 flex flex-col gap-2 z-20">
            {/* Scrubber Track with Milestones */}
            <div className="relative flex items-center">
              <input
                type="range"
                min={0}
                max={durationSec}
                step={0.04}
                value={currentTimeSec}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  setCurrentTimeSec(val);
                  if (videoRef.current) {
                    videoRef.current.currentTime = val;
                  }
                }}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/20 accent-[var(--sea-accent)]"
              />

              {/* Milestone Dots on Scrubber */}
              {sector.milestones.map((m, idx) => {
                const leftPct = (m.timeSec / durationSec) * 100;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentTimeSec(m.timeSec);
                      if (videoRef.current) videoRef.current.currentTime = m.timeSec;
                    }}
                    style={{ left: `${leftPct}%` }}
                    className={cn(
                      'absolute -top-1 w-3 h-3 rounded-full border-2 border-black transform -translate-x-1/2 cursor-pointer transition-transform hover:scale-150',
                      m.severity === 'CRITICAL' ? 'bg-red-500' : m.severity === 'CAUTION' ? 'bg-amber-400' : 'bg-sky-400'
                    )}
                    title={`${m.label} (${formatTime(m.timeSec)})`}
                  />
                );
              })}
            </div>

            {/* Controls Strip */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-white font-mono text-xs">
              <div className="flex items-center gap-2">
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--sea-600)] text-white hover:bg-[var(--sea-500)] transition-colors cursor-pointer"
                  title="Play / Pause (Space)"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                {/* Step Back 1 Frame */}
                <button
                  onClick={() => stepFrame(false)}
                  className="px-2 py-1 rounded border border-white/20 hover:bg-white/10 transition-colors cursor-pointer text-[11px]"
                  title="Previous Frame (Arrow Left)"
                >
                  <SkipBack className="w-3.5 h-3.5 inline mr-1" />
                  -1 Frm
                </button>

                {/* Step Forward 1 Frame */}
                <button
                  onClick={() => stepFrame(true)}
                  className="px-2 py-1 rounded border border-white/20 hover:bg-white/10 transition-colors cursor-pointer text-[11px]"
                  title="Next Frame (Arrow Right)"
                >
                  +1 Frm
                  <SkipForward className="w-3.5 h-3.5 inline ml-1" />
                </button>

                {/* Reset to Start */}
                <button
                  onClick={() => {
                    setCurrentTimeSec(0);
                    if (videoRef.current) videoRef.current.currentTime = 0;
                  }}
                  className="p-1.5 rounded border border-white/20 hover:bg-white/10 transition-colors cursor-pointer"
                  title="Rewind to Start"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Time Display */}
                <div className="px-2 py-1 rounded bg-black/50 border border-white/15 text-cyan-400 font-bold tabular-nums">
                  {formatTime(currentTimeSec)} <span className="text-white/40 font-normal">/ {formatTime(durationSec)}</span>
                </div>
              </div>

              {/* Speed Pills */}
              <div className="flex items-center gap-1 border border-white/20 rounded-lg p-0.5 bg-black/40">
                <span className="text-[10px] text-white/50 px-1 uppercase">Speed:</span>
                {[0.25, 0.5, 1, 2, 5].map(spd => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer',
                      playbackSpeed === spd ? 'bg-sky-500 text-white' : 'text-white/70 hover:text-white'
                    )}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExtractKeyframe}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-xs cursor-pointer text-xs"
                >
                  <Award className="w-3.5 h-3.5" />
                  Mark Keyframe (CKFE)
                </button>
                <button
                  onClick={() => setShowSec65bModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-600 text-white font-medium transition-all cursor-pointer text-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Sec 65B Certificate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Forensic Intelligence & Target Dossier Sidebar ── */}
        <div
          className="w-80 md:w-96 flex flex-col border-l overflow-y-auto flex-shrink-0"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
        >
          {/* Active Target Card */}
          <div className="p-4 border-b space-y-3" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/15 text-sky-600 border border-sky-500/30">
                Primary Target Dossier
              </span>
              <span className="font-mono text-xs font-bold text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {sector.hazardLevel} RISK
              </span>
            </div>

            <div>
              <h3 className="font-serif text-base font-bold">{sector.primaryTarget.craftName}</h3>
              <p className="text-xs text-[var(--text-muted)] font-mono">{sector.primaryTarget.classLabel}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg border bg-[var(--raised)] border-[var(--line)]">
                <span className="text-[10px] opacity-60 block uppercase">Registration:</span>
                <span className="font-bold text-[var(--text)]">{sector.primaryTarget.registrationNo}</span>
              </div>
              <div className="p-2 rounded-lg border bg-[var(--raised)] border-[var(--line)]">
                <span className="text-[10px] opacity-60 block uppercase">Track ID:</span>
                <span className="font-bold text-[var(--sea-accent)]">{sector.primaryTarget.trackId}</span>
              </div>
              <div className="p-2 rounded-lg border bg-[var(--raised)] border-[var(--line)]">
                <span className="text-[10px] opacity-60 block uppercase">Speed:</span>
                <span className="font-bold text-amber-600">{sector.primaryTarget.speedKnots} Knots</span>
              </div>
              <div className="p-2 rounded-lg border bg-[var(--raised)] border-[var(--line)]">
                <span className="text-[10px] opacity-60 block uppercase">Breakwater Dist:</span>
                <span className="font-bold text-red-600">{sector.primaryTarget.distToRocksM} m</span>
              </div>
            </div>

            <div className="text-[11px] p-2.5 rounded-lg border bg-[var(--raised)] border-[var(--line)] leading-relaxed">
              <strong className="text-[var(--text)] block mb-1">Sector Police Assessment:</strong>
              {sector.operationalNote}
            </div>

            <button
              onClick={() => setShowPromoteModal(true)}
              className="w-full py-2 rounded-xl bg-[var(--sea-600)] hover:bg-[var(--sea-500)] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              Promote to Formal Incident (ELIR)
            </button>
          </div>

          {/* Timeline Milestones in Selected Sector */}
          <div className="p-4 border-b space-y-2" style={{ borderColor: 'var(--line)' }}>
            <h4 className="font-serif text-xs font-bold uppercase tracking-wider opacity-70">
              Sector Event Milestones
            </h4>
            <div className="space-y-1.5">
              {sector.milestones.map((m, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentTimeSec(m.timeSec);
                    if (videoRef.current) videoRef.current.currentTime = m.timeSec;
                  }}
                  className="flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors hover:bg-[var(--raised)] bg-[var(--bg)] border-[var(--line)]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        m.severity === 'CRITICAL' ? 'bg-red-500' : m.severity === 'CAUTION' ? 'bg-amber-500' : 'bg-sky-500'
                      )}
                    />
                    <span className="font-medium text-[11px]">{m.label}</span>
                  </div>
                  <span className="font-mono text-[10px] opacity-60">{formatTime(m.timeSec)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Extracted CKFE Evidence Keyframes Strip */}
          <div className="p-4 flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-serif text-xs font-bold uppercase tracking-wider opacity-70">
                Sealed Evidence Keyframes ({keyframes.length})
              </h4>
              <span className="text-[10px] font-mono text-emerald-600 font-semibold">CKFE Active</span>
            </div>

            {keyframes.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl border border-dashed border-[var(--line)] text-xs text-[var(--text-muted)] space-y-2">
                <Award className="w-6 h-6 mx-auto opacity-40 text-emerald-600" />
                <p>No keyframes extracted yet.</p>
                <p className="text-[10px] opacity-70">
                  Click <strong>Mark Keyframe (CKFE)</strong> during playback to seal timestamped forensic evidence.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {keyframes.map(kf => (
                  <div
                    key={kf.id}
                    className="p-2.5 rounded-xl border space-y-2 bg-[var(--raised)] border-[var(--line)] shadow-xs"
                  >
                    <div className="relative rounded-lg overflow-hidden border border-black/20 bg-black aspect-video">
                      <img src={kf.thumbnailUrl} alt="Keyframe" className="w-full h-full object-cover" />
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-cyan-400 font-mono text-[9px] font-bold">
                        {formatTime(kf.timeSec)}
                      </div>
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono text-[8px] font-bold uppercase">
                        {kf.status}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="font-bold text-[var(--text)]">{kf.targetTrackId}</span>
                        <span className="opacity-60">{kf.timestampIst}</span>
                      </div>
                      <div className="font-mono text-[9px] text-[var(--text-muted)] truncate" title={kf.sha256Hash}>
                        SHA-256: {kf.sha256Hash.slice(0, 16)}...
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => {
                          setSelectedKeyframeForCert(kf);
                          setShowSec65bModal(true);
                        }}
                        className="flex-1 py-1 rounded text-[10px] font-mono font-semibold border text-center transition-colors hover:bg-[var(--panel)] border-[var(--line)]"
                      >
                        Sec 65B Cert
                      </button>
                      <button
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = kf.thumbnailUrl;
                          a.download = `${kf.targetTrackId}_${formatTime(kf.timeSec)}.jpg`;
                          a.click();
                        }}
                        className="p-1 rounded text-[10px] border transition-colors hover:bg-[var(--panel)] border-[var(--line)]"
                        title="Download JPG"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          TOAST NOTIFICATION NOTIFIER
         ══════════════════════════════════════════════════ */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-mono text-xs shadow-xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MODAL: SECTION 65B INDIAN EVIDENCE ACT CERTIFICATE
         ══════════════════════════════════════════════════ */}
      {showSec65bModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-2xl rounded-2xl border shadow-2xl p-6 flex flex-col max-h-[90vh] overflow-hidden"
            style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-serif text-base font-bold">Certificate of Electronic Record Under Section 65B</h3>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono">
                    Indian Evidence Act 1872 / Section 63 Bharatiya Sakshya Adhiniyam 2023
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSec65bModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--raised)] text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 font-mono text-xs leading-relaxed text-[var(--text)]">
              <div className="p-3 rounded-xl border bg-[var(--raised)] border-[var(--line)] space-y-1">
                <div><strong>POLICE STATION:</strong> {sector.station}</div>
                <div><strong>DISTRICT:</strong> {sector.district}, Kerala</div>
                <div><strong>SECTOR:</strong> {sector.name} ({sector.code})</div>
                <div><strong>DRONE SORTIE:</strong> {sector.uavCode} (Pilot: {sector.pilot})</div>
                <div><strong>INCIDENT TARGET:</strong> {sector.primaryTarget.craftName} ({sector.primaryTarget.registrationNo})</div>
                <div><strong>GENERATED AT:</strong> {formatIST(new Date().toISOString())}</div>
                <div><strong>CRYPTOGRAPHIC DIGEST:</strong> {selectedKeyframeForCert?.sha256Hash || 'b78a9c1482f09918df20914e6b19a089cf29188a'} (SHA-256)</div>
              </div>

              <div className="space-y-2 text-[11px] text-[var(--text-muted)]">
                <p>
                  1. I, the undersigned Drone Operation In-Charge, hereby certify that the electronic video record
                  and extracted keyframe images referred to above were captured during lawful coastal surveillance operations
                  conducted under the mandate of the Kerala Police Coastal Security Wing.
                </p>
                <p>
                  2. The SmartQEye Coastal Computer-Vision Processing Cluster operated continuously in normal operational status
                  without technical corruption or unauthorized interference throughout the mission recording window.
                </p>
                <p>
                  3. The extracted frames were sealed with SHA-256 cryptographic signatures directly upon extraction to ensure
                  complete legal chain-of-custody integrity as required under Section 65B(4) of the Indian Evidence Act.
                </p>
              </div>

              <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
                <div>
                  <div className="font-bold text-[var(--text)]">{sector.pilot}</div>
                  <div className="text-[10px] opacity-60">Sub-Inspector / Drone Pilot, Kerala Police</div>
                </div>
                <div className="w-24 h-10 border border-dashed rounded flex items-center justify-center text-[10px] opacity-40">
                  DIGITALLY SEALED
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex items-center justify-end gap-2" style={{ borderColor: 'var(--line)' }}>
              <button
                onClick={() => setShowSec65bModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-[var(--raised)] cursor-pointer"
                style={{ borderColor: 'var(--line)' }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setToastMessage('Section 65B Certificate generated and saved to evidence vault.');
                  setShowSec65bModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Export Signed Affidavit (.PDF)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MODAL: PROMOTE TO FORMAL INCIDENT (ELIR)
         ══════════════════════════════════════════════════ */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg rounded-2xl border shadow-2xl p-6 flex flex-col"
            style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-serif text-base font-bold">Promote to Evidence-Linked Incident Record</h3>
              </div>
              <button
                onClick={() => setShowPromoteModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--raised)] text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs mb-5">
              <div className="p-3 rounded-xl border bg-[var(--raised)] border-[var(--line)] space-y-1">
                <div><strong>INCIDENT TYPE:</strong> Hazardous Breakwater Bar Crossing &amp; Ingress</div>
                <div><strong>TARGET CRAFT:</strong> {sector.primaryTarget.craftName} ({sector.primaryTarget.registrationNo})</div>
                <div><strong>SECTOR:</strong> {sector.name}</div>
                <div><strong>SEVERITY:</strong> <span className="text-red-500 font-bold">CRITICAL</span></div>
                <div><strong>RECOMMENDED ACTION:</strong> Dispatch Kerala Marine Police Interceptor Boat</div>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Promoting this recorded footage will seal the 90-second video buffer, GPS flight track, and CKFE keyframes into an immutable Evidence Record linked directly to the Police Incidents Register.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowPromoteModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-[var(--raised)] cursor-pointer"
                style={{ borderColor: 'var(--line)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPromoteModal(false);
                  setToastMessage('Incident promoted to ELIR Vault (Ref: INC-KL-2026-0884). Redirecting...');
                  setTimeout(() => navigate('/incidents'), 1200);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                Confirm &amp; Create Formal Incident
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

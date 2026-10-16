// ============================================================
// SmartQEye Coastal — Drone Video Player Component (Phase 2A)
// Real video playback with letterbox-aware canvas overlay, sidecar tracking,
// Cognitive Frame Selection (CFS) badge, thermal modality, and procedural fallback
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward,
  Sliders, Flame
} from 'lucide-react';
import { cn, formatCoords, formatDeg } from '@/lib/utils';
import { renderProceduralSea, getSimulatedBoxes, getSimulatedCfsState } from '@/lib/proceduralSea';
import { scenarioDirector, VIZHINJAM_SCENARIO_MILESTONES } from '@/lib/scenario';
import { useTelemetry } from '@/lib/telemetry';
import { findFrameAtTime, loadSidecarData } from '@/lib/replay';
import type { SidecarData, BoundingBox, CfsState, PlayerOverlayConfig } from '@/types/sidecar';
import { DEFAULT_OVERLAY_CONFIG } from '@/types/sidecar';
import type { Modality } from '@/types';

interface DroneVideoPlayerProps {
  sceneName?: string;
  autoPlay?: boolean;
  loop?: boolean;
  showControls?: boolean;
  initialModality?: Modality;
  className?: string;
  onTimeUpdate?: (timeSec: number) => void;
  onAlertTrigger?: (alertCode: string) => void;
  highlightContactId?: string;
  compactControls?: boolean;
  seekToTimeSec?: number;
}

export function DroneVideoPlayer({
  sceneName = 'vizhinjam_patrol',
  autoPlay = true,
  loop = true,
  showControls = true,
  initialModality = 'RGB',
  className,
  onTimeUpdate,
  highlightContactId,
  compactControls = false,
  seekToTimeSec,
}: DroneVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(90); // default 90s scenario
  const [playbackRate, setPlaybackRate] = useState<0.5 | 1 | 2>(1);
  const [modality, setModality] = useState<Modality>(initialModality);
  const [isThermalSimulated] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [overlayConfig, setOverlayConfig] = useState<PlayerOverlayConfig>(DEFAULT_OVERLAY_CONFIG);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [sidecar, setSidecar] = useState<SidecarData | null>(null);

  const telemetry = useTelemetry();

  // Load sidecar data on mount
  useEffect(() => {
    let active = true;
    loadSidecarData(sceneName).then(data => {
      if (active && data) {
        setSidecar(data);
        if (data.durationSec) setDurationSec(data.durationSec);
      }
    });
    return () => { active = false; };
  }, [sceneName]);

  // Synchronise playback rate to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Determine video sources
  const rgbVideoSrc = `/demo/${sceneName}.mp4`;
  const thermalVideoSrc = `/demo/${sceneName}_thermal.mp4`;
  const activeVideoSrc = modality === 'THERMAL' && !isThermalSimulated ? thermalVideoSrc : rgbVideoSrc;

  // Handle thermal toggle
  const toggleModality = () => {
    const nextModality = modality === 'RGB' ? 'THERMAL' : 'RGB';
    setModality(nextModality);
  };

  // Play / Pause
  const togglePlay = () => {
    if (videoRef.current && isVideoLoaded) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
    setIsPlaying(p => !p);
  };

  // Seek
  const handleSeek = (newTimeSec: number) => {
    const clamped = Math.max(0, Math.min(durationSec, newTimeSec));
    setCurrentTimeSec(clamped);
    if (videoRef.current && isVideoLoaded) {
      videoRef.current.currentTime = clamped;
    }
    scenarioDirector.advanceToTime(clamped);
    if (onTimeUpdate) onTimeUpdate(clamped);
  };

  // Synchronise external seekToTimeSec prop
  useEffect(() => {
    if (seekToTimeSec !== undefined && !isNaN(seekToTimeSec)) {
      handleSeek(seekToTimeSec);
    }
  }, [seekToTimeSec]);

  // Jump ±10s
  const skip = (deltaSec: number) => {
    handleSeek(currentTimeSec + deltaSec);
  };

  // Main render & sync loop
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Get current time
    let time = currentTimeSec;
    if (videoRef.current && isVideoLoaded && !videoRef.current.paused) {
      time = videoRef.current.currentTime;
      setCurrentTimeSec(time);
    } else if (isPlaying && (!isVideoLoaded || videoError)) {
      // Procedural sea clock advancement
      time = (time + 0.033 * playbackRate) % durationSec;
      setCurrentTimeSec(time);
    }

    // Advance Scenario Director & Telemetry
    scenarioDirector.advanceToTime(time);
    if (onTimeUpdate) onTimeUpdate(time);

    // 1. Draw Background (Video or Procedural Fallback)
    ctx.clearRect(0, 0, width, height);

    if (isVideoLoaded && videoRef.current && !videoError) {
      // Draw video frame with aspect-ratio letterboxing calculation
      const vid = videoRef.current;
      const vidAspect = (vid.videoWidth || 16) / (vid.videoHeight || 9);
      const canvasAspect = width / height;

      let drawW = width;
      let drawH = height;
      let drawX = 0;
      let drawY = 0;

      if (canvasAspect > vidAspect) {
        drawW = height * vidAspect;
        drawX = (width - drawW) / 2;
      } else {
        drawH = width / vidAspect;
        drawY = (height - drawH) / 2;
      }

      ctx.drawImage(vid, drawX, drawY, drawW, drawH);

      // If simulated thermal, apply ironbow post-process color overlay
      if (modality === 'THERMAL' && isThermalSimulated) {
        ctx.save();
        ctx.globalCompositeOperation = 'color';
        ctx.fillStyle = 'rgba(235, 75, 30, 0.65)';
        ctx.fillRect(drawX, drawY, drawW, drawH);
        ctx.restore();
      }
    } else {
      // Render procedural realistic ocean surveillance
      renderProceduralSea(ctx, width, height, time, modality);
    }

    // 2. Fetch synchronised detections & CFS state
    let boxes: BoundingBox[] = [];
    let cfs: CfsState = {
      status: 'FULL',
      rateFps: 25,
      reasonCode: 'CFS-01: Active Target Attention',
      vramSavingsPct: 0,
    };

    if (sidecar && sidecar.frames.length > 0) {
      const frame = findFrameAtTime(sidecar.frames, time);
      if (frame) {
        boxes = frame.boxes;
        cfs = frame.cfs;
      }
    } else {
      boxes = getSimulatedBoxes(time, modality);
      cfs = getSimulatedCfsState(time);
    }

    // 3. Render Overlays
    // Bounding Boxes, Tracks, Labels, Trails
    if (overlayConfig.showBoundingBoxes) {
      boxes.forEach(b => {
        const [x1, y1, x2, y2] = b.bbox;
        const bx = x1 * width;
        const by = y1 * height;
        const bw = (x2 - x1) * width;
        const bh = (y2 - y1) * height;

        const isHighlighted = highlightContactId && b.contactId === highlightContactId;
        const isBreach = b.inZoneBreach;

        // Colors
        let strokeColor = isBreach ? '#ef4444' : isHighlighted ? '#f59e0b' : '#0ea5e9';
        if (modality === 'THERMAL') {
          strokeColor = isBreach ? '#ff3b30' : '#ff9500';
        }

        // Motion Trail
        if (overlayConfig.showMotionTrails && b.trail && b.trail.length > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(b.trail[0][0] * width, b.trail[0][1] * height);
          for (let i = 1; i < b.trail.length; i++) {
            ctx.lineTo(b.trail[i][0] * width, b.trail[i][1] * height);
          }
          ctx.lineTo(bx + bw / 2, by + bh);
          ctx.strokeStyle = strokeColor + '80';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.restore();
        }

        // Bounding Box Rect
        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = isHighlighted || isBreach ? 2.5 : 1.8;
        ctx.strokeRect(bx, by, bw, bh);

        // Corner reticle accents
        const retLen = Math.min(8, bw * 0.25);
        ctx.lineWidth = 3;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(bx, by + retLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + retLen, by);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(bx + bw - retLen, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by + retLen);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(bx, by + bh - retLen);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + retLen, by + bh);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(bx + bw - retLen, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - retLen);
        ctx.stroke();

        // Label Tag
        if (overlayConfig.showLabels) {
          const contactTag = b.contactId ? `${b.contactId} · ` : '';
          const confTag = overlayConfig.showConfidence ? ` ${(b.conf * 100).toFixed(0)}%` : '';
          const labelText = `${contactTag}${b.label}${confTag}`;

          ctx.font = '10px JetBrains Mono, monospace';
          const textW = ctx.measureText(labelText).width;
          ctx.fillStyle = strokeColor + 'dd';
          ctx.fillRect(bx, by - 16, textW + 8, 16);

          ctx.fillStyle = '#ffffff';
          ctx.fillText(labelText, bx + 4, by - 4);
        }

        // Heading / Speed Vector
        if (overlayConfig.showTargetVectors && b.speedKnots !== undefined && b.speedKnots > 0) {
          const speedText = `${b.speedKnots.toFixed(1)} kn · ${formatDeg(b.headingDeg ?? 0)}`;
          ctx.font = '9px JetBrains Mono, monospace';
          const subW = ctx.measureText(speedText).width;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
          ctx.fillRect(bx, by + bh, subW + 6, 14);
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(speedText, bx + 3, by + bh + 10);
        }

        ctx.restore();
      });
    }

    // 4. Burn-in HUD Overlay (Top-Left)
    if (overlayConfig.showTelemetryHud) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(10, 10, 260, 68);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.strokeRect(10, 10, 260, 68);

      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`${telemetry.uavCode ?? 'UAV-KL-03'} · ${telemetry.missionCode ?? 'MSN-20261016-0830-01-VIZHINJAM'}`, 18, 26);

      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(`POS: ${formatCoords(telemetry.lat, telemetry.lon)}`, 18, 42);
      ctx.fillText(`ALT: ${telemetry.altM.toFixed(1)}m · GND: ${telemetry.speedMs.toFixed(1)} m/s · HDG: ${formatDeg(telemetry.headingDeg)}`, 18, 56);
      ctx.fillText(`GIMBAL: P ${telemetry.gimbalPitchDeg ?? -35}° · SENSOR: ${modality === 'THERMAL' ? 'THERMAL LWIR' : 'RGB 4K OPTICAL'}`, 18, 70);
      ctx.restore();
    }

    // 5. Cognitive Frame Selection (CFS) Badge (Top-Right)
    if (overlayConfig.showCfsBadge) {
      ctx.save();
      const cfsW = 220;
      const cfsX = width - cfsW - 10;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(cfsX, 10, cfsW, 46);
      ctx.strokeStyle = cfs.status === 'FULL' ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cfsX, 10, cfsW, 46);

      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.fillStyle = cfs.status === 'FULL' ? '#34d399' : '#fbbf24';
      ctx.fillText(`CFS: ${cfs.status} (${cfs.rateFps} FPS)`, cfsX + 10, 25);

      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(cfs.reasonCode.slice(0, 32), cfsX + 10, 38);
      ctx.fillText(`Compute Savings: ${cfs.vramSavingsPct}% VRAM`, cfsX + 10, 50);
      ctx.restore();
    }

    // 6. Thermal Mode Banner (if simulated)
    if (modality === 'THERMAL') {
      ctx.save();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
      ctx.fillRect(width / 2 - 80, 10, 160, 20);
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText('THERMAL SENSOR (IRONBOW)', width / 2, 24);
      ctx.restore();
    }

    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(renderFrame);
    }
  }, [
    currentTimeSec, durationSec, isPlaying, isVideoLoaded, videoError,
    modality, isThermalSimulated, playbackRate, overlayConfig,
    sidecar, telemetry, highlightContactId, onTimeUpdate
  ]);

  // Animation frame kickoff
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [renderFrame]);

  // Handle ResizeObserver for canvas resolution
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (canvasRef.current && width > 0 && height > 0) {
          canvasRef.current.width = Math.round(width);
          canvasRef.current.height = Math.round(height);
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex flex-col bg-slate-950 rounded-xl overflow-hidden select-none border group',
        className
      )}
      style={{ borderColor: 'var(--line)' }}
    >
      {/* Visual Canvas (Video render & overlays) */}
      <div className="relative flex-1 min-h-0 aspect-video overflow-hidden">
        {/* Hidden video tag for real media playback */}
        <video
          ref={videoRef}
          src={activeVideoSrc}
          muted
          playsInline
          loop={loop}
          onLoadedData={() => {
            setIsVideoLoaded(true);
            setVideoError(false);
            if (videoRef.current?.duration) {
              setDurationSec(videoRef.current.duration);
            }
            if (autoPlay) videoRef.current?.play().catch(() => {});
          }}
          onError={() => {
            setIsVideoLoaded(false);
            setVideoError(true);
          }}
          className="hidden"
        />

        {/* Render Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair"
          width={1280}
          height={720}
        />
      </div>

      {/* Playback Controls Bar */}
      {showControls && (
        <div
          className="flex flex-col gap-1.5 px-3 py-2 border-t z-20 flex-shrink-0"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
        >
          {/* Scrubber Timeline with Milestone Markers */}
          <div className="relative flex items-center h-4 group/scrub cursor-pointer">
            <input
              type="range"
              min={0}
              max={durationSec}
              step={0.1}
              value={currentTimeSec}
              onChange={e => handleSeek(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[var(--sea-600)]"
            />

            {/* Event Markers along the scrubber */}
            {VIZHINJAM_SCENARIO_MILESTONES.map(m => {
              const leftPct = (m.timeSec / durationSec) * 100;
              return (
                <div
                  key={`${m.timeSec}-${m.type}`}
                  style={{ left: `${leftPct}%` }}
                  title={`${m.title} (${m.timeSec}s): ${m.description}`}
                  className={cn(
                    'absolute w-2 h-2 -translate-x-1/2 rounded-full pointer-events-auto transition-transform hover:scale-150',
                    m.severity === 'CRITICAL' ? 'bg-red-500 ring-2 ring-red-400' :
                    m.severity === 'HIGH' ? 'bg-amber-500' : 'bg-cyan-500'
                  )}
                />
              );
            })}
          </div>

          {/* Buttons Row */}
          <div className="flex items-center justify-between text-xs font-mono">
            {/* Left: Playback & Step */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={togglePlay}
                className="p-1.5 rounded-lg border hover:bg-[var(--surface-hover)] transition-colors"
                style={{ borderColor: 'var(--line)' }}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => skip(-10)}
                className="p-1.5 rounded-lg border hover:bg-[var(--surface-hover)] transition-colors"
                style={{ borderColor: 'var(--line)' }}
                title="Rewind 10s"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => skip(10)}
                className="p-1.5 rounded-lg border hover:bg-[var(--surface-hover)] transition-colors"
                style={{ borderColor: 'var(--line)' }}
                title="Forward 10s"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              {/* Timestamp */}
              <div className="px-2 text-[11px] opacity-80">
                <span>{Math.floor(currentTimeSec / 60)}:{String(Math.floor(currentTimeSec % 60)).padStart(2, '0')}</span>
                <span className="opacity-40"> / </span>
                <span>{Math.floor(durationSec / 60)}:{String(Math.floor(durationSec % 60)).padStart(2, '0')}</span>
              </div>
            </div>

            {/* Center: Live indicator & Speed */}
            {!compactControls && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLiveMode(!isLiveMode)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-1',
                    isLiveMode
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                  )}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', isLiveMode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400')} />
                  <span>{isLiveMode ? 'LIVE SYNC' : 'RECORDED'}</span>
                </button>

                <div className="flex items-center rounded border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
                  {([0.5, 1, 2] as const).map(rate => (
                    <button
                      key={rate}
                      onClick={() => setPlaybackRate(rate)}
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] transition-colors',
                        playbackRate === rate ? 'bg-[var(--sea-600)] text-white font-bold' : 'hover:bg-[var(--surface-hover)] opacity-70'
                      )}
                    >
                      {rate}×
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Right: Modality toggle & Overlay layers */}
            <div className="flex items-center gap-1.5">
              {/* Modality Button */}
              <button
                onClick={toggleModality}
                className={cn(
                  'px-2 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5',
                  modality === 'THERMAL'
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 font-bold'
                    : 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30'
                )}
                title="Toggle RGB / Thermal Modality"
              >
                <Flame className="w-3 h-3" />
                <span>{modality}</span>
              </button>

              {/* Layer Config Toggle */}
              {!compactControls && (
                <div className="relative">
                  <button
                    onClick={() => setShowConfigMenu(!showConfigMenu)}
                    className="p-1.5 rounded-lg border hover:bg-[var(--surface-hover)] transition-colors"
                    style={{ borderColor: 'var(--line)' }}
                    title="Toggle Overlays"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>

                  {showConfigMenu && (
                    <div
                      className="absolute right-0 bottom-full mb-2 w-48 rounded-xl border p-2 shadow-2xl z-50 text-[11px]"
                      style={{ background: 'var(--raised)', borderColor: 'var(--line)', color: 'var(--text)' }}
                    >
                      <div className="font-bold border-b pb-1 mb-1 text-[10px] uppercase opacity-50">
                        Overlay Layers
                      </div>
                      {Object.entries(overlayConfig).map(([key, val]) => (
                        <label
                          key={key}
                          className="flex items-center justify-between py-1 px-1 rounded hover:bg-[var(--surface-hover)] cursor-pointer"
                        >
                          <span className="capitalize">{key.replace('show', '').replace(/([A-Z])/g, ' $1')}</span>
                          <input
                            type="checkbox"
                            checked={val}
                            onChange={e => setOverlayConfig(c => ({ ...c, [key]: e.target.checked }))}
                            className="rounded accent-[var(--sea-600)]"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

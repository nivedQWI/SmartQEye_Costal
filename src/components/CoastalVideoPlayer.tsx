// ============================================================
// SmartQEye Coastal — Coastal Video Player Component
// Renders live MP4 stream with real-time hardware-accelerated filters:
// - RGB: Direct optical daylight video (as-is)
// - Thermal: FLIR Ironbow LWIR false-color heat signature
// - Night Vision: Gen-3 P-43 Green Phosphor light intensifier
// ============================================================

import { useState, useRef, useEffect, memo } from 'react';
import { Eye, Flame, Moon, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FILTER_PRESETS } from '@/lib/videoCatalog';
import type { Modality } from '@/types';

interface CoastalVideoPlayerProps {
  src: string;
  modality?: Modality;
  filterOverride?: Modality | null;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  showControls?: boolean;
  showHudOverlay?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onTimeUpdate?: (currentTime: number) => void;
}

export const CoastalVideoPlayer = memo(function CoastalVideoPlayer({
  src,
  modality = 'RGB',
  filterOverride = null,
  autoPlay = true,
  muted = true,
  loop = true,
  showControls = false,
  showHudOverlay = false,
  className,
  style,
  onTimeUpdate,
}: CoastalVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Active modality: either overridden by user controls or determined by video classification
  const activeModality: Modality = filterOverride ?? modality;
  const activeFilterStyle = FILTER_PRESETS[activeModality] ?? FILTER_PRESETS.RGB;

  // Auto-play recovery on mount & src change
  useEffect(() => {
    setHasError(false);
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Modern browsers allow muted autoplay without gesture
          setIsPlaying(false);
        });
    }
  }, [src]);

  function handleRetry() {
    setHasError(false);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }

  return (
    <div className={cn('relative w-full h-full overflow-hidden bg-black flex items-center justify-center', className)} style={style}>
      {/* HTML5 Video element with CSS filter */}
      <video
        ref={videoRef}
        key={src}
        src={src}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        preload="auto"
        controls={showControls}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedData={() => {
          setHasError(false);
          videoRef.current?.play().catch(() => {});
        }}
        onError={() => setHasError(true)}
        onTimeUpdate={() => {
          if (onTimeUpdate && videoRef.current) {
            onTimeUpdate(videoRef.current.currentTime);
          }
        }}
        className="w-full h-full object-cover transition-all duration-300"
        style={activeFilterStyle}
      />

      {/* Optical / Thermal / Night Vision Sensor Overlays */}
      {activeModality === 'THERMAL' && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-color opacity-35"
          style={{ background: 'linear-gradient(180deg, rgba(235, 75, 30, 0.5) 0%, rgba(120, 0, 200, 0.4) 100%)' }}
        />
      )}

      {activeModality === 'NIGHT_VISION' && (
        <>
          {/* Subtle phosphor glow + CRT scanline texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 255, 65, 0.25) 0px, rgba(0, 255, 65, 0.25) 1px, transparent 1px, transparent 2px)',
            }}
          />
          {/* Vignette on edges like real NVG tubes */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0, 20, 5, 0.6) 100%)',
            }}
          />
        </>
      )}

      {/* Tactical HUD Overlay (if enabled) */}
      {showHudOverlay && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 z-10">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded backdrop-blur-xs flex items-center gap-1 shadow-xs',
                activeModality === 'THERMAL'
                  ? 'bg-orange-950/80 text-orange-300 border border-orange-500/40'
                  : activeModality === 'NIGHT_VISION'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                  : 'bg-black/60 text-white/90 border border-white/20'
              )}
            >
              {activeModality === 'THERMAL' ? (
                <>
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span>FLIR LWIR</span>
                </>
              ) : activeModality === 'NIGHT_VISION' ? (
                <>
                  <Moon className="w-3 h-3 text-emerald-400" />
                  <span>NVG GEN-3</span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 text-sky-400" />
                  <span>RGB OPTICAL</span>
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Error state fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-3 text-center z-20">
          <AlertCircle className="w-6 h-6 text-amber-500 mb-1" />
          <span className="text-xs font-mono text-white/90 font-bold">Stream Connecting</span>
          <span className="text-[10px] font-mono text-white/50 max-w-[180px] mt-0.5 mb-2 truncate">
            {src.split('/').pop()}
          </span>
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Reconnect
          </button>
        </div>
      )}
    </div>
  );
});

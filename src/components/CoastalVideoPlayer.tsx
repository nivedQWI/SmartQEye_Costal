// ============================================================
// SmartQEye Coastal — Universal Coastal Video & Stream Player
// Supports:
// - Direct MP4 local & remote video files & persistent IndexedDB blobs
// - HLS (.m3u8) streams via hls.js
// - RTSP / RTMP proxy streams via MediaMTX or WebRTC
// - Hardware-accelerated Optical / Thermal / Night Vision filters
// - Operator Stream Termination & Resume controls
// - Auto-recovery for reloaded user-uploaded videos
// ============================================================

import { useState, useRef, useEffect, memo } from 'react';
import Hls from 'hls.js';
import { Eye, Flame, Moon, AlertCircle, RefreshCw, Square, Play, ShieldAlert, Radio, Plus, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FILTER_PRESETS } from '@/lib/videoCatalog';
import { resolveVideoUrl } from '@/lib/videoStorage';
import type { Modality, FeedState } from '@/types';

interface CoastalVideoPlayerProps {
  src: string;
  feedId?: string;
  modality?: Modality;
  filterOverride?: Modality | null;
  state?: FeedState;
  isTerminated?: boolean;
  streamType?: 'RTSP' | 'RTMP' | 'HLS' | 'MP4';
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  showControls?: boolean;
  showHudOverlay?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onResume?: () => void;
  onAttachStream?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export const CoastalVideoPlayer = memo(function CoastalVideoPlayer({
  src,
  feedId,
  modality = 'RGB',
  filterOverride = null,
  state = 'LIVE',
  isTerminated = false,
  streamType,
  autoPlay = true,
  muted = true,
  loop = true,
  showControls = false,
  showHudOverlay = false,
  className,
  style,
  onResume,
  onAttachStream,
  onTimeUpdate,
}: CoastalVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [activeSrc, setActiveSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const isRecoveringRef = useRef(false);

  // Keep activeSrc updated when src changes
  useEffect(() => {
    setActiveSrc(src);
    setHasError(false);
  }, [src]);

  const isStopped = isTerminated || state === 'TERMINATED';
  const isNoSignal = state === 'NO_SIGNAL' || !activeSrc || activeSrc.trim() === '';
  const isHls = !isNoSignal && (activeSrc.includes('.m3u8') || streamType === 'HLS');
  const isRtspOrRtmp = !isNoSignal && (activeSrc.startsWith('rtsp://') || activeSrc.startsWith('rtmp://') || streamType === 'RTSP' || streamType === 'RTMP');

  // Active modality: either overridden by user controls or determined by video classification
  const activeModality: Modality = filterOverride ?? modality;
  const activeFilterStyle = FILTER_PRESETS[activeModality] ?? FILTER_PRESETS.RGB;

  // HLS.js or native playback attachment
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isStopped || isNoSignal) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    setHasError(false);

    // Clean up prior HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current = hls;
        hls.loadSource(activeSrc);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoPlay) video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_evt, data) => {
          if (data.fatal) {
            setHasError(true);
            hls.destroy();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = activeSrc;
        if (autoPlay) video.play().catch(() => {});
      }
    } else {
      // Direct MP4 or object URL or proxy stream
      video.src = activeSrc;
      video.currentTime = 0;
      if (autoPlay) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeSrc, isStopped, isNoSignal, isHls, autoPlay]);

  // Automatic recovery from IndexedDB for blob URLs that expired across reloads
  const handlePlaybackError = async () => {
    if (isStopped) return;
    if (feedId && !isRecoveringRef.current) {
      isRecoveringRef.current = true;
      try {
        const recovered = await resolveVideoUrl(feedId, activeSrc);
        if (recovered && recovered !== activeSrc) {
          setActiveSrc(recovered);
          setHasError(false);
          if (videoRef.current) {
            videoRef.current.src = recovered;
            videoRef.current.load();
            videoRef.current.play().catch(() => {});
          }
          isRecoveringRef.current = false;
          return;
        }
      } catch (err) {
        console.warn('[CoastalVideoPlayer] Recovery error:', err);
      }
      isRecoveringRef.current = false;
    }
    setHasError(true);
  };

  const handleRetry = async () => {
    setHasError(false);
    if (feedId) {
      try {
        const recovered = await resolveVideoUrl(feedId, activeSrc);
        if (recovered) {
          setActiveSrc(recovered);
          if (videoRef.current) {
            videoRef.current.src = recovered;
            videoRef.current.load();
            videoRef.current.play().catch(() => {});
            return;
          }
        }
      } catch {}
    }
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div className={cn('relative w-full h-full overflow-hidden bg-black flex items-center justify-center', className)} style={style}>
      {/* HTML5 Video element */}
      <video
        ref={videoRef}
        autoPlay={autoPlay && !isStopped}
        muted={muted}
        loop={loop}
        playsInline
        preload="auto"
        controls={showControls && !isStopped}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedData={() => {
          setHasError(false);
          if (!isStopped) videoRef.current?.play().catch(() => {});
        }}
        onError={handlePlaybackError}
        onTimeUpdate={() => {
          if (onTimeUpdate && videoRef.current) {
            onTimeUpdate(videoRef.current.currentTime);
          }
        }}
        className={cn(
          'w-full h-full object-cover transition-all duration-300',
          isStopped && 'opacity-20 grayscale filter brightness-50'
        )}
        style={activeFilterStyle}
      />

      {/* Optical / Thermal / Night Vision Sensor Overlays */}
      {!isStopped && activeModality === 'THERMAL' && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-color opacity-35"
          style={{ background: 'linear-gradient(180deg, rgba(235, 75, 30, 0.5) 0%, rgba(120, 0, 200, 0.4) 100%)' }}
        />
      )}

      {!isStopped && activeModality === 'NIGHT_VISION' && (
        <>
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 255, 65, 0.25) 0px, rgba(0, 255, 65, 0.25) 1px, transparent 1px, transparent 2px)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0, 20, 5, 0.6) 100%)',
            }}
          />
        </>
      )}

      {/* Tactical HUD Overlay (if enabled) */}
      {showHudOverlay && !isStopped && !isNoSignal && (
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

            {/* Protocol Badge */}
            {streamType && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 animate-pulse text-sky-400" />
                {streamType}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ─── Stream Terminated by Operator Overlay ─── */}
      {isStopped && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-30">
          <div className="p-3 rounded-full bg-red-950/80 border border-red-500/40 text-red-400 mb-2 shadow-lg">
            <Square className="w-6 h-6 fill-red-500" />
          </div>
          <span className="text-xs font-mono font-bold text-red-400 tracking-wide uppercase">
            Stream Terminated by Operator
          </span>
          <p className="text-[10px] font-mono text-slate-400 max-w-[220px] mt-1 mb-3">
            Video ingestion halted. Sensor channel placed on standby.
          </p>
          {onResume && (
            <button
              type="button"
              onClick={onResume}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Resume Stream
            </button>
          )}
        </div>
      )}

      {/* ─── Tactical NO SIGNAL Overlay ─── */}
      {!isStopped && isNoSignal && (
        <div className="absolute inset-0 bg-[#060d15] flex flex-col items-center justify-center p-4 text-center z-25 overflow-hidden">
          {/* Scanline pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 3px)',
            }}
          />
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2 relative">
            <Radio className="w-7 h-7 animate-pulse text-amber-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          </div>
          <div className="font-mono text-xs font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
            NO SIGNAL DETECTED
          </div>
          <p className="text-[10px] font-mono text-slate-400 max-w-[220px] leading-relaxed mb-3">
            Camera carrier offline · No active RTSP or RTMP stream inputted for this sortie
          </p>
          {onAttachStream && (
            <button
              type="button"
              onClick={onAttachStream}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-sky-600 hover:bg-sky-500 text-white cursor-pointer shadow-md transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Attach Stream Link
            </button>
          )}
        </div>
      )}

      {/* ─── RTSP / RTMP Connection Notice ─── */}
      {!isStopped && hasError && isRtspOrRtmp && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-3 text-center z-20">
          <ShieldAlert className="w-6 h-6 text-sky-400 mb-1" />
          <span className="text-xs font-mono text-white/90 font-bold">RTSP / RTMP Source Ingesting</span>
          <span className="text-[10px] font-mono text-sky-300/70 max-w-[200px] mt-0.5 mb-2 truncate">
            {activeSrc}
          </span>
          <span className="text-[9px] font-mono text-slate-400 max-w-[220px] mb-3">
            Connecting via MediaMTX gateway. Ingesting stream packet stream.
          </span>
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono bg-sky-600 hover:bg-sky-500 text-white cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3 h-3" /> Reconnect Ingestion
          </button>
        </div>
      )}

      {/* Generic Error state fallback / Session Reconnection */}
      {!isStopped && hasError && !isRtspOrRtmp && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-3 text-center z-20">
          <AlertCircle className="w-6 h-6 text-amber-500 mb-1" />
          <span className="text-xs font-mono text-white/90 font-bold">
            {activeSrc.startsWith('blob:') ? 'Uploaded Video Session Reload Needed' : 'Stream Reconnecting'}
          </span>
          <span className="text-[10px] font-mono text-white/50 max-w-[220px] mt-0.5 mb-3 leading-relaxed">
            {activeSrc.startsWith('blob:')
              ? 'Click below to reload video from persistent storage'
              : (activeSrc.split('/').pop() || activeSrc)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-sky-600 hover:bg-sky-500 text-white cursor-pointer shadow-md transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reconnect Video
            </button>
            {onAttachStream && (
              <button
                type="button"
                onClick={onAttachStream}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <Upload className="w-3 h-3" /> Re-attach
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

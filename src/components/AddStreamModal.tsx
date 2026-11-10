// ============================================================
// SmartQEye Coastal — Add Stream Modal
// Operator Ingestion for RTSP, RTMP, HLS, and MP4 video feeds
// ============================================================

import { useState } from 'react';
import { X, Plus, Radio, Video, Layers, MapPin, CheckCircle2 } from 'lucide-react';
import { useFeedStore } from '@/lib/store';
import { KERALA_SEAPORTS } from '@/lib/coastalPortsData';
import type { Modality } from '@/types';

interface AddStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_PRESETS = [
  { label: 'Vizhinjam Patrol (RGB 1)', url: '/videos/RGB_1.mp4', modality: 'RGB' as Modality, port: 'VIZHINJAM' },
  { label: 'Kochi Harbor Channel (RGB 2)', url: '/videos/RGB_2.mp4', modality: 'RGB' as Modality, port: 'KOCHI' },
  { label: 'Muthalapozhi Breakwater (Ref)', url: '/videos/Muthalapozhi_Harbour_Channel.mp4', modality: 'RGB' as Modality, port: 'VIZHINJAM' },
  { label: 'Coastal Thermal FLIR (Thermal 1)', url: '/videos/thermal_1.mp4', modality: 'THERMAL' as Modality, port: 'ALAPPUZHA' },
  { label: 'Sample HLS Live Stream', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', modality: 'RGB' as Modality, port: 'BEYPORE' },
];

export function AddStreamModal({ isOpen, onClose }: AddStreamModalProps) {
  const { addFeed } = useFeedStore();
  const [streamUrl, setStreamUrl] = useState('');
  const [label, setLabel] = useState('');
  const [uavCode, setUavCode] = useState('');
  const [modality, setModality] = useState<Modality>('RGB');
  const [selectedPort, setSelectedPort] = useState('VIZHINJAM');
  const [streamType, setStreamType] = useState<'RTSP' | 'RTMP' | 'HLS' | 'MP4'>('RTSP');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  function handleTypeChange(type: 'RTSP' | 'RTMP' | 'HLS' | 'MP4') {
    setStreamType(type);
    if (type === 'RTSP' && !streamUrl) setStreamUrl('rtsp://');
    if (type === 'RTMP' && !streamUrl) setStreamUrl('rtmp://');
    if (type === 'HLS' && !streamUrl) setStreamUrl('https://');
    if (type === 'MP4' && !streamUrl) setStreamUrl('/videos/RGB_1.mp4');
  }

  function handlePresetSelect(preset: typeof SAMPLE_PRESETS[0]) {
    setStreamUrl(preset.url);
    setLabel(preset.label);
    setModality(preset.modality);
    setSelectedPort(preset.port);
    if (preset.url.includes('.m3u8')) setStreamType('HLS');
    else if (preset.url.startsWith('rtsp://')) setStreamType('RTSP');
    else if (preset.url.startsWith('rtmp://')) setStreamType('RTMP');
    else setStreamType('MP4');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!streamUrl.trim()) return;

    const finalUav = uavCode.trim() || `UAV-${Math.floor(10 + Math.random() * 90)}`;
    const finalLabel = label.trim() || `${finalUav} Coastal Live Stream`;

    addFeed({
      label: finalLabel,
      videoSrc: streamUrl.trim(),
      uavCode: finalUav,
      missionCode: `M-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      modality,
      streamType,
      portId: selectedPort,
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col chart-paper"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-white">Add Video Stream / Drone Feed</h3>
              <p className="text-xs font-mono text-slate-400">Ingest RTSP, RTMP, HLS, or local MP4 into Command Fleet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Quick Protocol Selector */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Stream Protocol / Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['RTSP', 'RTMP', 'HLS', 'MP4'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    streamType === type
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500 shadow-sm'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stream URL Input */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Stream URL / Video Path <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={streamUrl}
              onChange={e => setStreamUrl(e.target.value)}
              placeholder={
                streamType === 'RTSP' ? 'rtsp://192.168.1.100:554/live' :
                streamType === 'RTMP' ? 'rtmp://localhost:1935/live/drone01' :
                streamType === 'HLS' ? 'https://example.com/live/stream.m3u8' :
                '/videos/RGB_1.mp4'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border bg-black/40 text-white font-mono text-xs focus:outline-hidden focus:border-sky-500 transition-colors"
              style={{ borderColor: 'var(--line)' }}
            />
          </div>

          {/* Preset Buttons for Quick Demo Testing */}
          <div>
            <div className="text-[11px] font-mono text-slate-400 mb-1.5 flex items-center gap-1">
              <Layers className="w-3 h-3 text-sky-400" />
              <span>Or choose from verified coastal sample sources:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetSelect(p)}
                  className="px-2.5 py-1 rounded-lg border text-[11px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 hover:border-sky-500/50 transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* UAV / Source Code */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Drone / Sensor ID
              </label>
              <input
                type="text"
                value={uavCode}
                onChange={e => setUavCode(e.target.value)}
                placeholder="e.g. UAV-07"
                className="w-full px-3 py-2 rounded-xl border bg-black/40 text-white font-mono text-xs focus:outline-hidden focus:border-sky-500"
                style={{ borderColor: 'var(--line)' }}
              />
            </div>

            {/* Sensor Modality */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Sensor Modality
              </label>
              <select
                value={modality}
                onChange={e => setModality(e.target.value as Modality)}
                className="w-full px-3 py-2 rounded-xl border bg-black/40 text-white font-mono text-xs focus:outline-hidden focus:border-sky-500"
                style={{ borderColor: 'var(--line)' }}
              >
                <option value="RGB">RGB Optical (Daylight)</option>
                <option value="THERMAL">Thermal (FLIR LWIR)</option>
                <option value="NIGHT_VISION">Night Vision (NVG Gen-3)</option>
              </select>
            </div>
          </div>

          {/* Port / Coastal Sector */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>Coastal Sector / Port Deployment</span>
            </label>
            <select
              value={selectedPort}
              onChange={e => setSelectedPort(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border bg-black/40 text-white font-mono text-xs focus:outline-hidden focus:border-sky-500"
              style={{ borderColor: 'var(--line)' }}
            >
              {KERALA_SEAPORTS.filter(p => p.id !== 'ALL').map(p => (
                <option key={p.id} value={p.id}>
                  {p.shortName} — {p.district} District
                </option>
              ))}
            </select>
          </div>

          {/* Optional Label */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Feed Display Title
            </label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Vizhinjam Breakwater Infiltration Watch"
              className="w-full px-3 py-2 rounded-xl border bg-black/40 text-white font-mono text-xs focus:outline-hidden focus:border-sky-500"
              style={{ borderColor: 'var(--line)' }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border text-xs font-mono font-semibold text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--line)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitted}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {submitted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Stream Added!</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>Ingest & Deploy Stream</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

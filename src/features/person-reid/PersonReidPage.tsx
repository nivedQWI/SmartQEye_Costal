// ============================================================
// SmartQEye Coastal — Person Re-ID & Face Recognition (/person-reid)
// As specified in Costal Police .docx
// ============================================================

import { useState, useRef } from 'react';
import {
  ScanFace, Users, ShieldAlert, CheckCircle, Search,
  Download, Eye, Filter, ArrowRight,
  Radio, Clock, AlertTriangle, ShieldCheck,
  Play, Pause, Volume2, VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { PersonReidRecord } from '@/types';

// Mock high-resolution Re-ID records
const MOCK_REID_RECORDS: PersonReidRecord[] = [
  {
    id: 'reid-01',
    trackId: 'ID-9041',
    confidence: 0.948,
    isWatchlistMatch: true,
    watchlistIdentity: 'Contact of Interest (Ref #88/24 - Vizhinjam)',
    watchlistNotes: 'Contact of interest flagged in coastal consignment review. Authorised watchlist reference active.',
    faceCropUrl: '/reid/1.jpeg',
    firstSeenAt: '18:12:04 IST',
    lastSeenAt: '19:42:30 IST',
    appearanceFeatures: { upperColor: 'Red Check Shirt', lowerColor: 'Blue Denim', bag: true, helmet: false },
    cameraHops: [
      { droneCode: 'UAV-KL-01', time: '18:12 IST', location: 'Kovalam Lighthouse Promenade' },
      { droneCode: 'UAV-KL-02', time: '18:45 IST', location: 'Hawa Beach Entrance Chokepoint' },
      { droneCode: 'UAV-KL-01', time: '19:42 IST', location: 'Vizhinjam Fishing Harbor Fish Landing Wharf' },
    ]
  },
  {
    id: 'reid-02',
    trackId: 'ID-9048',
    confidence: 0.912,
    isWatchlistMatch: true,
    watchlistIdentity: 'Contact of Interest (Ref #112/25 - Fort Station)',
    watchlistNotes: 'Flagged for port perimeter observation and verification.',
    faceCropUrl: '/reid/2.jpeg',
    firstSeenAt: '19:15:22 IST',
    lastSeenAt: '19:38:10 IST',
    appearanceFeatures: { upperColor: 'Black Polo T-Shirt', lowerColor: 'Khaki Trousers', bag: false, helmet: false },
    cameraHops: [
      { droneCode: 'UAV-KL-03', time: '19:15 IST', location: 'Samudra Beach North Steps' },
      { droneCode: 'UAV-KL-02', time: '19:38 IST', location: 'Hawa Beach North Stairs' }
    ]
  },
  {
    id: 'reid-03',
    trackId: 'ID-8812',
    confidence: 0.985,
    isWatchlistMatch: false,
    faceCropUrl: '/reid/3.jpeg',
    firstSeenAt: '17:40:00 IST',
    lastSeenAt: '19:30:15 IST',
    appearanceFeatures: { upperColor: 'Yellow Kurta', lowerColor: 'White Churidhar', bag: true, helmet: false },
    cameraHops: [
      { droneCode: 'UAV-KL-02', time: '17:40 IST', location: 'Kovalam Beachfront' },
      { droneCode: 'UAV-KL-01', time: '19:30 IST', location: 'Lighthouse Souvenir Row' }
    ]
  },
  {
    id: 'reid-04',
    trackId: 'ID-8830',
    confidence: 0.967,
    isWatchlistMatch: false,
    faceCropUrl: '/reid/4.jpeg',
    firstSeenAt: '18:50:11 IST',
    lastSeenAt: '19:40:05 IST',
    appearanceFeatures: { upperColor: 'Light Blue Linen', lowerColor: 'Navy Slacks', bag: false, helmet: false },
    cameraHops: [
      { droneCode: 'UAV-KL-01', time: '18:50 IST', location: 'Vizhinjam Terminal Road' },
      { droneCode: 'UAV-KL-01', time: '19:40 IST', location: 'Port Gate 2' }
    ]
  },
  {
    id: 'reid-05',
    trackId: 'ID-8902',
    confidence: 0.934,
    isWatchlistMatch: false,
    faceCropUrl: '/reid/5.jpeg',
    firstSeenAt: '19:02:44 IST',
    lastSeenAt: '19:36:12 IST',
    appearanceFeatures: { upperColor: 'Green T-Shirt', lowerColor: 'Cargo Shorts', bag: true, helmet: true },
    cameraHops: [
      { droneCode: 'UAV-KL-03', time: '19:02 IST', location: 'Samudra Beach Viewpoint' }
    ]
  },
  {
    id: 'reid-06',
    trackId: 'ID-8920',
    confidence: 0.971,
    isWatchlistMatch: false,
    faceCropUrl: '/reid/6.jpeg',
    firstSeenAt: '19:22:18 IST',
    lastSeenAt: '19:44:00 IST',
    appearanceFeatures: { upperColor: 'White Shirt', lowerColor: 'Blue Jeans', bag: false, helmet: false },
    cameraHops: [
      { droneCode: 'UAV-KL-02', time: '19:22 IST', location: 'Hawa Beach Central Walkway' }
    ]
  }
];

export default function PersonReidPage() {
  const { devRole } = useAuthStore();
  const isAuthorizedRole = ['ANALYST', 'SUPERVISOR', 'SYS_ADMIN', 'AUDITOR'].includes(devRole);

  const [searchTerm, setSearchTerm] = useState('');
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [hasBagFilter, setHasBagFilter] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PersonReidRecord | null>(null);
  const [dispatchedAlerts, setDispatchedAlerts] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  function togglePlay() {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play().catch(() => {}); }
    else { videoRef.current.pause(); }
  }
  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  }
  // Filter records
  const filteredRecords = MOCK_REID_RECORDS.filter(record => {
    if (watchlistOnly && !record.isWatchlistMatch) return false;
    if (hasBagFilter && !record.appearanceFeatures.bag) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTrack = record.trackId.toLowerCase().includes(term);
      const matchIdentity = record.watchlistIdentity?.toLowerCase().includes(term);
      if (!matchTrack && !matchIdentity) return false;
    }
    return true;
  });

  function handleDispatchPatrol(trackId: string) {
    setDispatchedAlerts(prev => [...prev, trackId]);
  }

  function handleExportCsv() {
    const headers = ['Track ID', 'Watchlist Match', 'Identity', 'Confidence', 'First Seen', 'Last Seen', 'Carrying Bag', 'Hops Count'];
    const rows = filteredRecords.map(r => [
      r.trackId,
      r.isWatchlistMatch ? 'YES' : 'NO',
      r.watchlistIdentity || 'Unidentified',
      `${(r.confidence * 100).toFixed(1)}%`,
      r.firstSeenAt,
      r.lastSeenAt,
      r.appearanceFeatures.bag ? 'YES' : 'NO',
      r.cameraHops.length
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Person_ReID_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto chart-paper p-4 md:p-6 gap-6">
      {/* ── Optional Module Authorization Banner (Rule 9) ── */}
      <div className="rounded-2xl p-4 border bg-amber-500/10 border-amber-500/30 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-amber-900 dark:text-amber-200">
              Optional Module — Requires Authorisation (RFP Baseline Extension)
            </div>
            <p className="text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              Biometric facial crops and watchlist cross-matching are restricted to ANALYST / SUPERVISOR roles. Current Role: <span className="font-mono font-bold">{devRole}</span>. All queries and dossier views are cryptographically logged.
            </p>
          </div>
        </div>
        {!isAuthorizedRole && (
          <span className="px-3 py-1 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-mono text-[11px] font-bold">
            SUPERVISOR ELEVATION REQUIRED
          </span>
        )}
      </div>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Person Re-ID &amp; Face Recognition
            </h1>
            <span className="badge-navy text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
              KERALA POLICE AI
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Cross-camera multi-target person re-identification, feature embedding matching &amp; authorised watchlist matches
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="btn-navy text-xs flex items-center gap-1.5 px-3 py-1.5 rounded"
          >
            <Download className="w-3.5 h-3.5" />
            Export Re-ID Ledger
          </button>
        </div>
      </div>

      {/* ── 6 KPI Metric Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="card-sand p-3 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Persons Tracked
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-[var(--sea-600)] dark:text-[var(--sea-accent)]">84</span>
            <Users className="w-4 h-4 opacity-60" style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Active in field</div>
        </div>

        <div className="card-sand p-3 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Unique Identities
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold" style={{ color: 'var(--text)' }}>312</span>
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">24h</span>
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Cross-drone deduplicated</div>
        </div>

        <div className="card-sand p-3 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Faces Extracted
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400">294</span>
            <ScanFace className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Stored in MinIO object store</div>
        </div>

        <div className="card-sand p-3 flex flex-col justify-between border-l-4 border-l-red-600">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-red-900">
            Watchlist Hits
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-red-700">2</span>
            <span className="animate-pulse bg-red-100 text-red-900 px-1 py-0.5 rounded text-[10px] font-bold border border-red-300">
              ALERT
            </span>
          </div>
          <div className="text-[10px] text-red-800 font-semibold mt-1">2 matches flagged for verification</div>
        </div>

        <div className="card-sand p-3 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Multi-Cam Hops
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold" style={{ color: 'var(--text)' }}>48</span>
            <span className="text-[10px] text-sky-700 dark:text-sky-400 font-mono font-bold bg-sky-500/10 px-1 py-0.5 rounded border border-sky-500/20">Handoffs</span>
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Continuity rate 94.2%</div>
        </div>

        <div className="card-sand p-3 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Re-ID Engine
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-lg font-bold text-emerald-700">OSNet-IBN</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>28.4 FPS on GPU-1</div>
        </div>
      </div>

      {/* ── Main Work Area: Live Tracking Stream & Re-ID Face Gallery ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Live Drone Annotated Stream with Track IDs */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="card-sand p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                <h2 className="font-serif text-sm font-bold text-[var(--text)]">
                  Live Drone Feed — UAV-KL-01 (Kovalam North Sector)
                </h2>
              </div>
              <span className="badge-navy text-[10px] px-2 py-0.5 rounded font-mono">
                PERSISTENT RE-ID TRACKING
              </span>
            </div>

            {/* Live Drone Video Player (Clean video without overlays) */}
            <div className="relative aspect-video rounded-lg overflow-hidden border border-[var(--border)] bg-slate-950 flex items-center justify-center select-none group">
              <video
                ref={videoRef}
                src="/videos/Person_RE_ID.mp4"
                autoPlay
                muted={isMuted}
                loop
                playsInline
                preload="auto"
                className="w-full h-full object-cover"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedData={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = true;
                    videoRef.current.play().catch(() => {});
                  }
                }}
              />

              {/* Click to start if browser blocked autoplay */}
              {!isPlaying && (
                <div
                  onClick={togglePlay}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs cursor-pointer group transition-all"
                >
                  <div className="p-3 rounded-full bg-[var(--sea-600)]/90 text-white shadow-xl group-hover:scale-110 transition-transform flex items-center justify-center">
                    <Play className="w-6 h-6 ml-0.5" />
                  </div>
                  <span className="mt-2 text-[10px] font-mono font-bold text-white bg-black/70 px-2.5 py-0.5 rounded border border-white/20">
                    CLICK TO PLAY RE-ID FEED
                  </span>
                </div>
              )}

              {/* Minimal playback controls */}
              <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={togglePlay} className="text-white hover:text-slate-300 cursor-pointer">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button onClick={toggleMute} className="text-white hover:text-slate-300 cursor-pointer">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-3 bg-[var(--surface-muted)] rounded border border-[var(--border)] flex items-center justify-between text-xs">
              <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Flagged contact in current view: <strong className="text-red-700 dark:text-red-400">Rajan (Meen Rajan)</strong></span>
              <button
                onClick={() => handleDispatchPatrol('ID-9041')}
                disabled={dispatchedAlerts.includes('ID-9041')}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-mono font-bold transition-all",
                  dispatchedAlerts.includes('ID-9041')
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed"
                    : "bg-red-700 hover:bg-red-800 text-white shadow-sm"
                )}
              >
                {dispatchedAlerts.includes('ID-9041') ? 'RECOMMENDATION SENT' : 'RECOMMEND PATROL CHECK'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Face Crop Gallery & Contact Inspector */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="card-sand p-4 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[var(--text)]">
                  MinIO Face Crop Gallery &amp; Track Directory
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Auto-extracted facial biometric crops with multi-camera trajectory histories
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Track ID or contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--sea-500)]"
                  />
                </div>

                <button
                  onClick={() => setWatchlistOnly(!watchlistOnly)}
                  className={cn(
                    "px-2.5 py-1.5 text-xs rounded font-mono font-semibold flex items-center gap-1 border transition-colors cursor-pointer",
                    watchlistOnly
                      ? "bg-red-100 text-red-800 border-red-300"
                      : "bg-[var(--surface-muted)] text-[var(--text)] border-[var(--border)]"
                  )}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  Watchlist Only
                </button>

                <button
                  onClick={() => setHasBagFilter(!hasBagFilter)}
                  className={cn(
                    "px-2.5 py-1.5 text-xs rounded font-mono font-semibold border transition-colors cursor-pointer",
                    hasBagFilter
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-[var(--surface-muted)] text-[var(--text)] border-[var(--border)]"
                  )}
                >
                  Carrying Bag
                </button>
              </div>
            </div>

            {/* Face Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredRecords.map(record => (
                <div
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className={cn(
                    "p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between gap-2.5 hover:shadow-md",
                    record.isWatchlistMatch
                      ? "bg-red-500/10 border-red-500/40 hover:border-red-500"
                      : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--sea-500)]"
                  )}
                >
                  {/* Top crop and badge */}
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <img
                        src={record.faceCropUrl}
                        alt={record.trackId}
                        className={cn(
                          "w-14 h-14 object-cover rounded-md border",
                          record.isWatchlistMatch ? "border-red-500 ring-2 ring-red-400" : "border-slate-300 dark:border-slate-700"
                        )}
                      />
                      {record.isWatchlistMatch && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold" style={{ color: 'var(--text)' }}>{record.trackId}</span>
                        <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {(record.confidence * 100).toFixed(1)}%
                        </span>
                      </div>

                      {record.isWatchlistMatch ? (
                        <div className="text-[11px] font-bold text-red-800 dark:text-red-300 line-clamp-1 mt-0.5">
                          {record.watchlistIdentity}
                        </div>
                      ) : (
                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          Non-Watchlist Subject
                        </div>
                      )}

                      <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {record.cameraHops.length} drone camera {record.cameraHops.length === 1 ? 'hop' : 'hops'}
                      </div>
                    </div>
                  </div>

                  {/* Biometric / Feature tags */}
                  <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
                      Vector Verified
                    </span>
                    {record.appearanceFeatures.bag && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold">
                        Bag
                      </span>
                    )}
                  </div>

                  {/* Footer status */}
                  <div className="flex items-center justify-between pt-1 border-t border-[var(--line)] text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    <span>Last: {record.lastSeenAt}</span>
                    <span className="text-[var(--sea-600)] dark:text-[var(--sea-accent)] font-bold hover:underline flex items-center gap-0.5">
                      Inspect Dossier →
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filteredRecords.length === 0 && (
              <div className="p-8 text-center font-mono text-xs border border-dashed border-[var(--border)] rounded" style={{ color: 'var(--text-muted)' }}>
                No Re-ID records match current filter criteria.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Contact of Interest / Re-ID Dossier Modal ── */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[var(--raised)] text-[var(--text)] max-w-xl w-full p-6 flex flex-col gap-4 shadow-2xl border border-[var(--line)] rounded-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <ScanFace className="w-5 h-5 text-[var(--sea-600)] dark:text-[var(--sea-accent)]" />
                <h3 className="font-serif text-lg font-bold text-[var(--text)]">
                  Subject Dossier &amp; Cross-Camera Trajectory
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-lg font-bold p-1 hover:opacity-80 cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                ×
              </button>
            </div>

            {/* Subject Overview Card */}
            <div className="flex items-start gap-4 p-4 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)]">
              <img
                src={selectedRecord.faceCropUrl}
                alt={selectedRecord.trackId}
                className={cn(
                  "w-24 h-24 object-cover rounded-md border-2",
                  selectedRecord.isWatchlistMatch ? "border-red-500 shadow-md" : "border-slate-300 dark:border-slate-700"
                )}
              />
              <div className="flex-1 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold" style={{ color: 'var(--text)' }}>{selectedRecord.trackId}</span>
                  <span className="badge-navy text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                    CONFIDENCE: {(selectedRecord.confidence * 100).toFixed(1)}%
                  </span>
                </div>

                {selectedRecord.isWatchlistMatch ? (
                  <div>
                    <div className="text-red-700 dark:text-red-400 font-bold font-sans text-sm flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      {selectedRecord.watchlistIdentity}
                    </div>
                    <div className="mt-1 italic text-[11px] bg-red-500/10 text-red-900 dark:text-red-200 p-2 rounded border border-red-500/30">
                      {selectedRecord.watchlistNotes}
                    </div>
                  </div>
                ) : (
                  <div className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    No Active Lookout Circular or Watchlist Matches
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <span>First Seen: {selectedRecord.firstSeenAt}</span>
                  <span>·</span>
                  <span>Last Seen: {selectedRecord.lastSeenAt}</span>
                </div>
              </div>
            </div>

            {/* Spatio-temporal Camera Hops Timeline */}
            <div>
              <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[var(--text)] mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 opacity-60" style={{ color: 'var(--text-muted)' }} />
                Cross-Camera Journey &amp; Spatial Progression
              </h4>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-300 dark:before:bg-slate-700">
                {selectedRecord.cameraHops.map((hop, idx) => (
                  <div key={idx} className="relative flex items-center gap-4 pl-8 text-xs font-mono">
                    <div className="absolute left-1.5 w-3 h-3 rounded-full bg-[var(--sea-600)] dark:bg-[var(--sea-accent)] border-2 border-[var(--raised)] ring-2 ring-[var(--line)]"></div>
                    <div className="flex-1 p-2.5 rounded bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
                      <div>
                        <span className="font-bold" style={{ color: 'var(--text)' }}>{hop.droneCode}</span>
                        <span className="mx-2 opacity-50" style={{ color: 'var(--text-muted)' }}>·</span>
                        <span className="font-sans" style={{ color: 'var(--text-muted)' }}>{hop.location}</span>
                      </div>
                      <span className="font-bold" style={{ color: 'var(--text-muted)' }}>{hop.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
              <div>
                {selectedRecord.isWatchlistMatch && (
                  <button
                    onClick={() => handleDispatchPatrol(selectedRecord.trackId)}
                    disabled={dispatchedAlerts.includes(selectedRecord.trackId)}
                    className={cn(
                      "px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer",
                      dispatchedAlerts.includes(selectedRecord.trackId)
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-red-700 hover:bg-red-800 text-white shadow-sm"
                    )}
                  >
                    {dispatchedAlerts.includes(selectedRecord.trackId)
                      ? '✓ PATROL RECOMMENDATION LOGGED'
                      : 'RECOMMEND PATROL RESPONSE'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-3 py-1.5 rounded text-xs font-mono font-bold border hover:bg-[var(--surface-hover)] cursor-pointer"
                  style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                >
                  Close
                </button>
                <button
                  onClick={() => alert(`Face crop embedding exported to evidence repository.`)}
                  className="btn-navy text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save Evidence
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

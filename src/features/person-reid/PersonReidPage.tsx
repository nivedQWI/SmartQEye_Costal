// ============================================================
// SmartQEye Coastal — Person Re-ID & Face Recognition (/person-reid)
// As specified in Costal Police .docx
// ============================================================

import { useState } from 'react';
import {
  ScanFace, Users, ShieldAlert, CheckCircle, Search,
  Download, Eye, Filter, ArrowRight,
  Radio, Clock, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { PersonReidRecord } from '@/types';

// Mock high-resolution Re-ID records
const MOCK_REID_RECORDS: PersonReidRecord[] = [
  {
    id: 'reid-01',
    trackId: 'TRK-9041',
    confidence: 0.948,
    isWatchlistMatch: true,
    watchlistIdentity: 'Contact of Interest (Ref #88/24 - Vizhinjam)',
    watchlistNotes: 'Contact of interest flagged in coastal consignment review. Authorised watchlist reference active.',
    faceCropUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%237f1d1d"/><circle cx="100" cy="80" r="38" fill="%23fca5a5"/><path d="M 40 180 C 40 130 160 130 160 180 Z" fill="%23fca5a5"/><text x="100" y="185" fill="%23ffffff" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">TRK-9041</text></svg>',
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
    trackId: 'TRK-9048',
    confidence: 0.912,
    isWatchlistMatch: true,
    watchlistIdentity: 'Contact of Interest (Ref #112/25 - Fort Station)',
    watchlistNotes: 'Flagged for port perimeter observation and verification.',
    faceCropUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23991b1b"/><circle cx="100" cy="80" r="38" fill="%23fecaca"/><path d="M 40 180 C 40 130 160 130 160 180 Z" fill="%23fecaca"/><text x="100" y="185" fill="%23ffffff" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">TRK-9048</text></svg>',
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
    trackId: 'TRK-8812',
    confidence: 0.985,
    isWatchlistMatch: false,
    faceCropUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23065f46"/><circle cx="100" cy="80" r="38" fill="%23a7f3d0"/><path d="M 40 180 C 40 130 160 130 160 180 Z" fill="%23a7f3d0"/><text x="100" y="185" fill="%23ffffff" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">TRK-8812</text></svg>',
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
    trackId: 'TRK-8830',
    confidence: 0.967,
    isWatchlistMatch: false,
    faceCropUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%231e3a8a"/><circle cx="100" cy="80" r="38" fill="%23bfdbfe"/><path d="M 40 180 C 40 130 160 130 160 180 Z" fill="%23bfdbfe"/><text x="100" y="185" fill="%23ffffff" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">TRK-8830</text></svg>',
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
    trackId: 'TRK-8902',
    confidence: 0.934,
    isWatchlistMatch: false,
    faceCropUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23374151"/><circle cx="100" cy="80" r="38" fill="%23e5e7eb"/><path d="M 40 180 C 40 130 160 130 160 180 Z" fill="%23e5e7eb"/><text x="100" y="185" fill="%23ffffff" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">TRK-8902</text></svg>',
    firstSeenAt: '19:02:44 IST',
    lastSeenAt: '19:36:12 IST',
    appearanceFeatures: { upperColor: 'Green T-Shirt', lowerColor: 'Cargo Shorts', bag: true, helmet: true },
    cameraHops: [
      { droneCode: 'UAV-KL-03', time: '19:02 IST', location: 'Samudra Beach Viewpoint' }
    ]
  },
  {
    id: 'reid-06',
    trackId: 'TRK-8920',
    confidence: 0.971,
    isWatchlistMatch: false,
    faceCropUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%234c1d95"/><circle cx="100" cy="80" r="38" fill="%23ddd6fe"/><path d="M 40 180 C 40 130 160 130 160 180 Z" fill="%23ddd6fe"/><text x="100" y="185" fill="%23ffffff" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">TRK-8920</text></svg>',
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

  // Filter records
  const filteredRecords = MOCK_REID_RECORDS.filter(record => {
    if (watchlistOnly && !record.isWatchlistMatch) return false;
    if (hasBagFilter && !record.appearanceFeatures.bag) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTrack = record.trackId.toLowerCase().includes(term);
      const matchIdentity = record.watchlistIdentity?.toLowerCase().includes(term);
      const matchFeat = record.appearanceFeatures.upperColor.toLowerCase().includes(term);
      if (!matchTrack && !matchIdentity && !matchFeat) return false;
    }
    return true;
  });

  function handleDispatchPatrol(trackId: string) {
    setDispatchedAlerts(prev => [...prev, trackId]);
  }

  function handleExportCsv() {
    const headers = ['Track ID', 'Watchlist Match', 'Identity', 'Confidence', 'First Seen', 'Last Seen', 'Upper Garment', 'Lower Garment', 'Carrying Bag', 'Hops Count'];
    const rows = filteredRecords.map(r => [
      r.trackId,
      r.isWatchlistMatch ? 'YES' : 'NO',
      r.watchlistIdentity || 'Unidentified',
      `${(r.confidence * 100).toFixed(1)}%`,
      r.firstSeenAt,
      r.lastSeenAt,
      r.appearanceFeatures.upperColor,
      r.appearanceFeatures.lowerColor,
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
            <span className="font-mono text-2xl font-bold" style={{ color: 'var(--accent)' }}>84</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Active in field</div>
        </div>

        <div className="card-sand p-3 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Unique Identities
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-slate-800">312</span>
            <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded">24h</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Cross-drone deduplicated</div>
        </div>

        <div className="card-sand p-3 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Faces Extracted
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-emerald-700">294</span>
            <ScanFace className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Stored in MinIO object store</div>
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
            <span className="font-mono text-2xl font-bold text-slate-800">48</span>
            <span className="text-[10px] text-sky-700 font-mono font-bold bg-sky-50 px-1 py-0.5 rounded">Handoffs</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Continuity rate 94.2%</div>
        </div>

        <div className="card-sand p-3 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Re-ID Engine
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-lg font-bold text-emerald-700">OSNet-IBN</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">28.4 FPS on GPU-1</div>
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

            {/* Simulated Live Video with Bounding Boxes */}
            <div className="relative rounded-lg overflow-hidden border border-[var(--border)] bg-slate-950 aspect-video flex flex-col justify-between p-3 select-none">
              <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 500 300">
                  {/* Subtle Grid */}
                  <defs>
                    <pattern id="reidGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="500" height="300" fill="url(#reidGrid)" />

                  {/* Sidewalk promenade line */}
                  <line x1="0" y1="180" x2="500" y2="240" stroke="#334155" strokeWidth="2" strokeDasharray="5 5" />

                  {/* Person 1: Flagged Contact of Interest (Rajan) */}
                  <g transform="translate(130, 90)">
                    {/* Bounding box */}
                    <rect x="0" y="0" width="75" height="150" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth="2" rx="3" />
                    {/* Face crop box */}
                    <rect x="22" y="10" width="32" height="36" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2 2" />
                    {/* ID Label tag */}
                    <rect x="0" y="-22" width="135" height="20" fill="#ef4444" rx="2" />
                    <text x="4" y="-8" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">TRK-9041 [WATCHLIST]</text>
                    {/* Feature badge */}
                    <rect x="0" y="152" width="125" height="16" fill="rgba(15, 23, 42, 0.85)" rx="2" />
                    <text x="4" y="163" fill="#fca5a5" fontSize="7.5" fontFamily="monospace">RED CHECK / BACKPACK</text>
                  </g>

                  {/* Person 2: Normal Tourist TRK-8812 */}
                  <g transform="translate(300, 110)">
                    <rect x="0" y="0" width="65" height="135" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth="1.5" rx="3" />
                    <rect x="18" y="8" width="28" height="32" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />
                    <rect x="0" y="-18" width="85" height="16" fill="#10b981" rx="2" />
                    <text x="4" y="-6" fill="#ffffff" fontSize="8" fontFamily="monospace" fontWeight="bold">TRK-8812 [98.5%]</text>
                    <rect x="0" y="137" width="95" height="14" fill="rgba(15, 23, 42, 0.8)" rx="2" />
                    <text x="4" y="147" fill="#86efac" fontSize="7" fontFamily="monospace">YELLOW / BAG</text>
                  </g>
                </svg>
              </div>

              {/* HUD Bar */}
              <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-300">
                <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                  UAV-KL-01 · 4K DOWNLINK
                </span>
                <span className="bg-red-950/80 text-red-300 px-2 py-0.5 rounded border border-red-500/50 font-bold animate-pulse">
                  MATCH DETECTED: TRK-9041
                </span>
              </div>

              <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-950/80 p-1.5 rounded">
                <span>EMBEDDING EXTRACTOR: OSNet-x1_0</span>
                <span>DISTANCE METRIC: COSINE SIMILARITY</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-3 bg-[var(--surface-muted)] rounded border border-[var(--border)] flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Flagged contact in current view: <strong className="text-red-700">Rajan (Meen Rajan)</strong></span>
              <button
                onClick={() => handleDispatchPatrol('TRK-9041')}
                disabled={dispatchedAlerts.includes('TRK-9041')}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-mono font-bold transition-all",
                  dispatchedAlerts.includes('TRK-9041')
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed"
                    : "bg-red-700 hover:bg-red-800 text-white shadow-sm"
                )}
              >
                {dispatchedAlerts.includes('TRK-9041') ? 'RECOMMENDATION SENT' : 'RECOMMEND PATROL CHECK'}
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
                    className="pl-8 pr-3 py-1.5 text-xs rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>

                <button
                  onClick={() => setWatchlistOnly(!watchlistOnly)}
                  className={cn(
                    "px-2.5 py-1.5 text-xs rounded font-mono font-semibold flex items-center gap-1 border transition-colors",
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
                    "px-2.5 py-1.5 text-xs rounded font-mono font-semibold border transition-colors",
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
                      ? "bg-red-50/70 border-red-300 hover:border-red-500"
                      : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]"
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
                          record.isWatchlistMatch ? "border-red-500 ring-2 ring-red-400" : "border-slate-300"
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
                        <span className="font-mono text-xs font-bold text-slate-800">{record.trackId}</span>
                        <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {(record.confidence * 100).toFixed(1)}%
                        </span>
                      </div>

                      {record.isWatchlistMatch ? (
                        <div className="text-[11px] font-bold text-red-800 line-clamp-1 mt-0.5">
                          {record.watchlistIdentity}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Non-Watchlist Subject
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {record.cameraHops.length} drone camera {record.cameraHops.length === 1 ? 'hop' : 'hops'}
                      </div>
                    </div>
                  </div>

                  {/* Garment / Feature tags */}
                  <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {record.appearanceFeatures.upperColor}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {record.appearanceFeatures.lowerColor}
                    </span>
                    {record.appearanceFeatures.bag && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                        Bag
                      </span>
                    )}
                  </div>

                  {/* Footer status */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-[10px] font-mono text-slate-500">
                    <span>Last: {record.lastSeenAt}</span>
                    <span className="text-[var(--accent)] font-semibold hover:underline flex items-center gap-0.5">
                      Inspect Dossier →
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filteredRecords.length === 0 && (
              <div className="p-8 text-center text-slate-500 font-mono text-xs border border-dashed border-[var(--border)] rounded">
                No Re-ID records match current filter criteria.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Contact of Interest / Re-ID Dossier Modal ── */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="card-sand max-w-xl w-full p-6 flex flex-col gap-4 shadow-2xl border border-[var(--border)] max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <ScanFace className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="font-serif text-lg font-bold text-[var(--text)]">
                  Subject Dossier &amp; Cross-Camera Trajectory
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1"
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
                  selectedRecord.isWatchlistMatch ? "border-red-500 shadow-md" : "border-slate-300"
                )}
              />
              <div className="flex-1 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-slate-900">{selectedRecord.trackId}</span>
                  <span className="badge-navy text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                    CONFIDENCE: {(selectedRecord.confidence * 100).toFixed(1)}%
                  </span>
                </div>

                {selectedRecord.isWatchlistMatch ? (
                  <div>
                    <div className="text-red-700 font-bold font-sans text-sm flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      {selectedRecord.watchlistIdentity}
                    </div>
                    <div className="text-slate-600 mt-1 italic text-[11px] bg-red-50 p-2 rounded border border-red-200">
                      {selectedRecord.watchlistNotes}
                    </div>
                  </div>
                ) : (
                  <div className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    No Active Lookout Circular or Watchlist Matches
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px] text-slate-600">
                  <span>First Seen: {selectedRecord.firstSeenAt}</span>
                  <span>·</span>
                  <span>Last Seen: {selectedRecord.lastSeenAt}</span>
                </div>
              </div>
            </div>

            {/* Spatio-temporal Camera Hops Timeline */}
            <div>
              <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[var(--text)] mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Cross-Camera Journey &amp; Spatial Progression
              </h4>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
                {selectedRecord.cameraHops.map((hop, idx) => (
                  <div key={idx} className="relative flex items-center gap-4 pl-8 text-xs font-mono">
                    <div className="absolute left-1.5 w-3 h-3 rounded-full bg-[var(--accent)] border-2 border-white ring-2 ring-slate-200"></div>
                    <div className="flex-1 p-2.5 rounded bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">{hop.droneCode}</span>
                        <span className="mx-2 text-slate-400">·</span>
                        <span className="text-slate-600 font-sans">{hop.location}</span>
                      </div>
                      <span className="text-slate-500 font-bold">{hop.time}</span>
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
                      "px-3 py-1.5 rounded text-xs font-mono font-bold transition-all",
                      dispatchedAlerts.includes(selectedRecord.trackId)
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-red-700 hover:bg-red-800 text-white shadow-sm"
                    )}
                  >
                    {dispatchedAlerts.includes(selectedRecord.trackId)
                      ? '✓ PATROL UNITS DISPATCHED'
                      : 'DISPATCH INTERCEPT PATROL'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-3 py-1.5 rounded text-xs font-mono font-medium text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  onClick={() => alert(`Face crop embedding exported to evidence repository.`)}
                  className="btn-navy text-xs px-3 py-1.5 rounded flex items-center gap-1.5"
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

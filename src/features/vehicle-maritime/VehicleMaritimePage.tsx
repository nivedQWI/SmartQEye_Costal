// ============================================================
// SmartQEye Coastal — Vehicle & Maritime Tracking (/vehicle-maritime)
// As specified in Costal Police .docx
// ============================================================

import { useState, useId } from 'react';
import {
  Car, Ship, AlertTriangle, ShieldAlert, Download,
  Search, Video, CheckCircle, Navigation,
  Gauge, Compass, ArrowUpRight, Radio, Filter, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { DroneVideoPlayer } from '@/components/DroneVideoPlayer';
import { VehicleAnprRecord, MaritimeTrackRecord } from '@/types';

// Mock initial ANPR data
const INITIAL_VEHICLES: VehicleAnprRecord[] = [
  {
    id: 'veh-01',
    plate: 'KL-01-CB-4092',
    vehicleType: 'CAR',
    confidence: 0.984,
    speedKmh: 46,
    isWatchlistMatch: true,
    watchlistReason: 'FLAGGED: Authorised watchlist contact of interest in coastal checkpoint transit (Ref: #142/26)',
    thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100"><rect width="150" height="100" fill="%230f172a"/><rect x="15" y="60" width="120" height="25" rx="3" fill="%23ffffff"/><text x="75" y="77" fill="%230f172a" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">KL-01-CB-4092</text></svg>',
    timestamp: '19:42:15 IST',
    droneCode: 'UAV-KL-01',
    locationName: 'Kovalam Beach Road / Junction 4'
  },
  {
    id: 'veh-02',
    plate: 'KL-16-J-8812',
    vehicleType: 'TRUCK',
    confidence: 0.962,
    speedKmh: 32,
    isWatchlistMatch: false,
    thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100"><rect width="150" height="100" fill="%231e293b"/><rect x="15" y="60" width="120" height="25" rx="3" fill="%23ffffff"/><text x="75" y="77" fill="%230f172a" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">KL-16-J-8812</text></svg>',
    timestamp: '19:41:40 IST',
    droneCode: 'UAV-KL-01',
    locationName: 'Vizhinjam Port Coastal Bypass'
  },
  {
    id: 'veh-03',
    plate: 'KL-01-AZ-9901',
    vehicleType: 'AUTO_RICKSHAW',
    confidence: 0.991,
    speedKmh: 28,
    isWatchlistMatch: false,
    thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100"><rect width="150" height="100" fill="%230284c7"/><rect x="15" y="60" width="120" height="25" rx="3" fill="%23ffffff"/><text x="75" y="77" fill="%230f172a" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">KL-01-AZ-9901</text></svg>',
    timestamp: '19:40:12 IST',
    droneCode: 'UAV-KL-02',
    locationName: 'Hawa Beach Access Way'
  },
  {
    id: 'veh-04',
    plate: 'KL-22-E-1004',
    vehicleType: 'BIKE',
    confidence: 0.947,
    speedKmh: 58,
    isWatchlistMatch: true,
    watchlistReason: 'FLAGGED: Authorised watchlist contact of interest in coastal checkpoint transit (Ref: Fort Station)',
    thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100"><rect width="150" height="100" fill="%23475569"/><rect x="15" y="60" width="120" height="25" rx="3" fill="%23ffffff"/><text x="75" y="77" fill="%230f172a" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">KL-22-E-1004</text></svg>',
    timestamp: '19:38:55 IST',
    droneCode: 'UAV-KL-03',
    locationName: 'Samudra Beach North Exit'
  },
  {
    id: 'veh-05',
    plate: 'KL-07-BF-5544',
    vehicleType: 'BUS',
    confidence: 0.978,
    speedKmh: 36,
    isWatchlistMatch: false,
    thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100"><rect width="150" height="100" fill="%230d9488"/><rect x="15" y="60" width="120" height="25" rx="3" fill="%23ffffff"/><text x="75" y="77" fill="%230f172a" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">KL-07-BF-5544</text></svg>',
    timestamp: '19:35:10 IST',
    droneCode: 'UAV-KL-01',
    locationName: 'Kovalam Main Arterial'
  },
  {
    id: 'veh-06',
    plate: 'KL-01-DH-7231',
    vehicleType: 'CAR',
    confidence: 0.988,
    speedKmh: 41,
    isWatchlistMatch: false,
    thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100"><rect width="150" height="100" fill="%23334155"/><rect x="15" y="60" width="120" height="25" rx="3" fill="%23ffffff"/><text x="75" y="77" fill="%230f172a" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">KL-01-DH-7231</text></svg>',
    timestamp: '19:32:04 IST',
    droneCode: 'UAV-KL-02',
    locationName: 'Lighthouse Coastal Avenue'
  }
];

// Mock Maritime data
const INITIAL_VESSELS: MaritimeTrackRecord[] = [
  {
    id: 'vsl-01',
    vesselCode: 'TRAWLER-KL-902',
    vesselClass: 'FISHING_TRAWLER',
    speedKnots: 8.4,
    headingDeg: 195,
    motionState: 'CRUISING',
    proximityWarning: true,
    closestSeparationPx: 68,
    lastSeenAt: '19:43:10 IST',
    lat: 8.3742,
    lon: 76.9681,
    trajectory: [[8.371, 76.965], [8.3725, 76.9665], [8.3742, 76.9681]]
  },
  {
    id: 'vsl-02',
    vesselCode: 'SPEEDBOAT-SEC-04',
    vesselClass: 'SPEEDBOAT',
    speedKnots: 24.2,
    headingDeg: 12,
    motionState: 'CRUISING',
    proximityWarning: true,
    closestSeparationPx: 68,
    lastSeenAt: '19:43:10 IST',
    lat: 8.3748,
    lon: 76.9688,
    trajectory: [[8.376, 76.97], [8.3752, 76.9692], [8.3748, 76.9688]]
  },
  {
    id: 'vsl-03',
    vesselCode: 'DHOW-AL-NOOR',
    vesselClass: 'DHOW',
    speedKnots: 0.2,
    headingDeg: 280,
    motionState: 'ANCHORED',
    proximityWarning: false,
    closestSeparationPx: 240,
    lastSeenAt: '19:41:22 IST',
    lat: 8.3615,
    lon: 76.9542,
    trajectory: [[8.3615, 76.9542]]
  },
  {
    id: 'vsl-04',
    vesselCode: 'COASTAL-CARGO-MV-KERALA',
    vesselClass: 'CARGO_VESSEL',
    speedKnots: 11.5,
    headingDeg: 310,
    motionState: 'CRUISING',
    proximityWarning: false,
    closestSeparationPx: 380,
    lastSeenAt: '19:42:00 IST',
    lat: 8.3912,
    lon: 76.938,
    trajectory: [[8.388, 76.932], [8.39, 76.935], [8.3912, 76.938]]
  },
  {
    id: 'vsl-05',
    vesselCode: 'COUNTRY-BOAT-VZM-11',
    vesselClass: 'COUNTRY_CRAFT',
    speedKnots: 1.1,
    headingDeg: 85,
    motionState: 'DRIFTING',
    proximityWarning: false,
    closestSeparationPx: 190,
    lastSeenAt: '19:39:18 IST',
    lat: 8.3792,
    lon: 76.9745,
    trajectory: [[8.3785, 76.973], [8.3792, 76.9745]]
  }
];

export default function VehicleMaritimePage() {
  const [activeTab, setActiveTab] = useState<'VEHICLE_ANPR' | 'MARITIME_VESSEL'>('VEHICLE_ANPR');
  const [plateSearch, setPlateSearch] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('ALL');
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const [vesselFilter, setVesselFilter] = useState<'ALL' | 'ALERTS' | 'ANCHORED'>('ALL');
  const [inspectVehicle, setInspectVehicle] = useState<VehicleAnprRecord | null>(null);
  const [inspectVessel, setInspectVessel] = useState<MaritimeTrackRecord | null>(null);
  const [vehicles] = useState<VehicleAnprRecord[]>(INITIAL_VEHICLES);
  const [vessels] = useState<MaritimeTrackRecord[]>(INITIAL_VESSELS);

  // SVG Unique IDs for patterns/gradients
  const { devRole } = useAuthStore();
  const isAuthorizedRole = ['ANALYST', 'SUPERVISOR', 'SYS_ADMIN', 'AUDITOR'].includes(devRole);

  const seaPatternId = useId();
  const rawGridPatternId = useId();
  const annoGridPatternId = useId();

  // Filtered vehicles
  const filteredVehicles = vehicles.filter(v => {
    if (showWatchlistOnly && !v.isWatchlistMatch) return false;
    if (selectedVehicleType !== 'ALL' && v.vehicleType !== selectedVehicleType) return false;
    if (plateSearch && !v.plate.toLowerCase().includes(plateSearch.toLowerCase())) return false;
    return true;
  });

  // Filtered vessels
  const filteredVessels = vessels.filter(v => {
    if (vesselFilter === 'ALERTS' && !v.proximityWarning) return false;
    if (vesselFilter === 'ANCHORED' && v.motionState !== 'ANCHORED') return false;
    return true;
  });

  // Vehicle Export
  function handleExportVehicleCsv() {
    const headers = ['Timestamp', 'Plate', 'Vehicle Type', 'Speed (km/h)', 'Confidence %', 'Watchlist Match', 'Drone', 'Location'];
    const rows = filteredVehicles.map(v => [
      v.timestamp,
      v.plate,
      v.vehicleType,
      v.speedKmh,
      `${(v.confidence * 100).toFixed(1)}%`,
      v.isWatchlistMatch ? 'YES - ' + (v.watchlistReason || 'Flagged') : 'NO',
      v.droneCode,
      v.locationName
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ANPR_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Vessel Export
  function handleExportVesselCsv() {
    const headers = ['Vessel Code', 'Class', 'Speed (Knots)', 'Heading (°)', 'State', 'Proximity Warning', 'Lat', 'Lon', 'Last Seen'];
    const rows = filteredVessels.map(v => [
      v.vesselCode,
      v.vesselClass,
      v.speedKnots,
      v.headingDeg,
      v.motionState,
      v.proximityWarning ? 'COLLISION HAZARD (<90px)' : 'NORMAL',
      v.lat,
      v.lon,
      v.lastSeenAt
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Maritime_Tracking_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto chart-paper p-4 md:p-6 gap-6">
      {/* ── Page Header & Segmented Mode Switcher ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Vehicle &amp; Maritime Tracking
            </h1>
            <span className="badge-navy text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
              KERALA POLICE AI
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Dual-domain tracking: High-speed ANPR OCR road surveillance &amp; coastal vessel vector kinematics
          </p>
        </div>

        {/* Segmented Mode Switcher */}
        <div className="flex items-center p-1 bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg shadow-inner">
          <button
            onClick={() => setActiveTab('VEHICLE_ANPR')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md font-sans text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
              activeTab === 'VEHICLE_ANPR'
                ? "bg-[var(--surface)] text-[var(--sea-600)] dark:text-[var(--sea-accent)] shadow-xs border border-[var(--border)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            )}
          >
            <Car className="w-4 h-4 text-emerald-600" />
            <span>🚗 Vehicle &amp; ANPR</span>
          </button>
          <button
            onClick={() => setActiveTab('MARITIME_VESSEL')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md font-sans text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
              activeTab === 'MARITIME_VESSEL'
                ? "bg-[var(--surface)] text-[var(--sea-600)] dark:text-[var(--sea-accent)] shadow-xs border border-[var(--border)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            )}
          >
            <Ship className="w-4 h-4 text-sky-600" />
            <span>🚢 Maritime Vessel Tracking</span>
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODE 1: VEHICLE & ANPR                                      */}
      {/* ════════════════════════════════════════════════════════════ */}
      {activeTab === 'VEHICLE_ANPR' && (
        <div className="flex flex-col gap-6">
          {/* ── Optional Module Authorization Banner (Rule 9) ── */}
          <div className="rounded-2xl p-4 border bg-amber-500/10 border-amber-500/30 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-900 dark:text-amber-200">
                  Optional Module — Requires Authorisation (RFP Baseline Extension)
                </div>
                <p className="text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                  Automated Number Plate Recognition (ANPR) and hotlist matching are restricted to ANALYST / SUPERVISOR roles. Current Role: <span className="font-mono font-bold">{devRole}</span>. All queries and plate exports are recorded in the security audit log.
                </p>
              </div>
            </div>
            {!isAuthorizedRole && (
              <span className="px-3 py-1 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-mono text-[11px] font-bold">
                SUPERVISOR ELEVATION REQUIRED
              </span>
            )}
          </div>

          {/* 5 KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            <div className="card-sand p-3.5 flex flex-col justify-between">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Vehicles In Track
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-mono text-2xl font-bold text-[var(--sea-600)] dark:text-[var(--sea-accent)]">142</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  +18 / 10m
                </span>
              </div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Multi-camera continuity</div>
            </div>

            <div className="card-sand p-3.5 flex flex-col justify-between">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Moving vs Stopped
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-mono text-2xl font-bold" style={{ color: 'var(--text)' }}>108 / 34</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--text-muted)' }}>76% flow</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-emerald-600 h-full" style={{ width: '76%' }}></div>
              </div>
            </div>

            <div className="card-sand p-3.5 flex flex-col justify-between">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Avg Road Speed
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-mono text-2xl font-bold" style={{ color: 'var(--text)' }}>42 <span className="text-xs font-normal">km/h</span></span>
                <Gauge className="w-4 h-4 opacity-60" style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Limit: 50 km/h (Kovalam)</div>
            </div>

            <div className="card-sand p-3.5 flex flex-col justify-between">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Plates OCR&apos;d
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400">138</span>
                <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold border border-emerald-500/20">
                  97.2%
                </span>
              </div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>PaddleOCR + LPRNet</div>
            </div>

            <div className="card-sand p-3.5 flex flex-col justify-between border-l-4 border-l-amber-600">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-amber-900">
                Watchlist Matches
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-mono text-2xl font-bold text-amber-700">2</span>
                <span className="animate-pulse bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-300">
                  FLAGGED
                </span>
              </div>
              <div className="text-[10px] text-amber-800 font-semibold mt-1">Stolen &amp; Smuggling Hits</div>
            </div>
          </div>

          {/* Dual Stream Video Display (Raw Feed vs RTMDet-x + OCR Annotations) */}
          <div className="card-sand p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[var(--sea-600)] dark:text-[var(--sea-accent)]" />
                <h2 className="font-serif text-base font-bold text-[var(--text)]">
                  Live Feed Comparison — UAV-KL-01 (Kovalam Bypass Sector)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                  STREAM 1080P @ 30 FPS
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: Synchronised Drone Video Player */}
              <div className="rounded-lg overflow-hidden border border-[var(--border)] bg-slate-950 aspect-video flex flex-col">
                <DroneVideoPlayer
                  sceneName="vizhinjam_patrol"
                  compactControls={true}
                  className="w-full h-full"
                />
              </div>

              {/* Right: AI-Annotated Stream (RTMDet-x + PaddleOCR) */}
              <div className="relative rounded-lg overflow-hidden border-2 border-emerald-500/50 bg-slate-950 aspect-video flex flex-col justify-between p-3 select-none">
                {/* Simulated AI Road Backdrop with Bounding Boxes */}
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 600 340">
                    <defs>
                      <pattern id={annoGridPatternId} width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(16,185,129,0.08)" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="600" height="340" fill={`url(#${annoGridPatternId})`} />
                    {/* Highway Road curves */}
                    <path d="M 50 340 L 250 120 L 350 120 L 550 340 Z" fill="#0f172a" />
                    <line x1="300" y1="120" x2="300" y2="340" stroke="#facc15" strokeWidth="2" strokeDasharray="10 10" />

                    {/* Car 1: Flagged Car */}
                    <g transform="translate(180, 200)">
                      <rect x="0" y="0" width="130" height="90" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth="2" rx="4" />
                      {/* Label badge */}
                      <rect x="0" y="-22" width="130" height="20" fill="#ef4444" rx="2" />
                      <text x="6" y="-8" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">CAR: KL-01-CB-4092</text>
                      {/* OCR Plate tag */}
                      <rect x="25" y="45" width="80" height="22" fill="#ffffff" stroke="#ef4444" strokeWidth="1.5" rx="2" />
                      <text x="32" y="60" fill="#0f172a" fontSize="10" fontFamily="monospace" fontWeight="bold">KL-01-CB-4092</text>
                      <text x="6" y="80" fill="#fca5a5" fontSize="8" fontFamily="sans-serif">OBSERVED: HARBOR PERIMETER DWELL</text>
                    </g>

                    {/* Car 2: Normal Auto-Rickshaw */}
                    <g transform="translate(350, 160)">
                      <rect x="0" y="0" width="90" height="70" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth="1.5" rx="3" />
                      <rect x="0" y="-18" width="90" height="16" fill="#10b981" rx="2" />
                      <text x="4" y="-6" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">AUTO [99.1%]</text>
                      <rect x="15" y="35" width="60" height="18" fill="#ffffff" stroke="#10b981" strokeWidth="1" rx="2" />
                      <text x="18" y="48" fill="#0f172a" fontSize="8" fontFamily="monospace" fontWeight="bold">KL-01-AZ-9901</text>
                    </g>

                    {/* Car 3: Truck */}
                    <g transform="translate(250, 130)">
                      <rect x="0" y="0" width="60" height="45" fill="rgba(56, 189, 248, 0.1)" stroke="#38bdf8" strokeWidth="1" rx="2" />
                      <rect x="0" y="-14" width="60" height="12" fill="#0284c7" rx="1" />
                      <text x="3" y="-5" fill="#ffffff" fontSize="7" fontFamily="monospace">TRUCK 32km/h</text>
                    </g>
                  </svg>
                </div>

                {/* HUD Top Bar */}
                <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-emerald-300">
                  <span className="bg-slate-900/90 px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-emerald-400" /> RTMDet-x + PaddleOCR (GPU-0)
                  </span>
                  <span className="bg-red-950/80 text-red-300 px-2 py-0.5 rounded border border-red-500/40 font-bold animate-pulse">
                    HOTLIST HIT: 1
                  </span>
                </div>

                {/* HUD Bottom Status */}
                <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-300 bg-slate-950/80 p-1.5 rounded border border-slate-800">
                  <span className="text-emerald-400">FPS: 31.4 | INFERENCE LATENCY: 18.2ms</span>
                  <span className="text-slate-400">TRACKS ACTIVE: 4 VEHICLES</span>
                </div>
              </div>
            </div>
          </div>

          {/* ANPR Recognition Ledger Table */}
          <div className="card-sand p-4 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[var(--text)]">
                  Live ANPR Recognition Ledger
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Automated Number Plate Recognition logs with OCR confidence scores and instant hotlist matching
                </p>
              </div>

              {/* Filters & Export */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search plate number..."
                    value={plateSearch}
                    onChange={(e) => setPlateSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--sea-500)]"
                  />
                </div>

                <select
                  value={selectedVehicleType}
                  onChange={(e) => setSelectedVehicleType(e.target.value)}
                  className="px-2 py-1.5 text-xs rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
                >
                  <option value="ALL">All Classes</option>
                  <option value="CAR">Car</option>
                  <option value="TRUCK">Truck</option>
                  <option value="AUTO_RICKSHAW">Auto-Rickshaw</option>
                  <option value="BIKE">Two-Wheeler</option>
                  <option value="BUS">Bus</option>
                </select>

                <button
                  onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
                  className={cn(
                    "px-2.5 py-1.5 text-xs rounded font-mono font-semibold flex items-center gap-1 border transition-colors cursor-pointer",
                    showWatchlistOnly
                      ? "bg-red-100 text-red-800 border-red-300"
                      : "bg-[var(--surface-muted)] text-[var(--text)] border-[var(--border)]"
                  )}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  Hotlist Only
                </button>

                <button
                  onClick={handleExportVehicleCsv}
                  className="btn-navy text-xs flex items-center gap-1.5 px-3 py-1.5 rounded cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-[var(--border)] rounded-md">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--surface-muted)] text-[var(--text-muted)] border-b border-[var(--border)] font-mono text-[11px] uppercase">
                    <th className="p-3">Time</th>
                    <th className="p-3">Crop</th>
                    <th className="p-3">Plate (HSRP Plate Format)</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Speed</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Drone Source</th>
                    <th className="p-3">Watchlist Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredVehicles.map(veh => (
                    <tr key={veh.id} className={cn("hover:bg-[var(--surface-hover)] transition-colors", veh.isWatchlistMatch ? "bg-red-500/10 border-l-2 border-l-red-500" : "")}>
                      <td className="p-3 font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{veh.timestamp}</td>
                      <td className="p-3">
                        <img
                          src={veh.thumbnailUrl}
                          alt={veh.plate}
                          className="w-10 h-7 object-cover rounded border border-[var(--border)]"
                        />
                      </td>
                      <td className="p-3">
                        {/* Indian High Security Registration Plate (HSRP) Styled Tag */}
                        <div className="inline-flex items-center border border-slate-700 bg-white rounded px-2 py-0.5 shadow-xs font-mono font-black text-slate-900 tracking-wider">
                          <span className="text-[8px] bg-sky-700 text-white font-bold px-1 py-0.5 rounded-xs mr-1.5">IND</span>
                          <span>{veh.plate}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold" style={{ color: 'var(--text)' }}>{veh.vehicleType}</td>
                      <td className="p-3 font-mono">
                        <span className={cn("font-bold", veh.speedKmh > 50 ? "text-amber-700 dark:text-amber-400" : "")} style={veh.speedKmh <= 50 ? { color: 'var(--text)' } : undefined}>
                          {veh.speedKmh} km/h
                        </span>
                      </td>
                      <td className="p-3 font-mono">
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {(veh.confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 font-mono" style={{ color: 'var(--text-muted)' }}>{veh.droneCode}</td>
                      <td className="p-3">
                        {veh.isWatchlistMatch ? (
                          <div className="flex items-center gap-1.5 text-red-700 font-bold bg-red-100/80 px-2 py-0.5 rounded border border-red-300 w-fit">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            <span>HOTLIST HIT</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-fit">
                            <CheckCircle className="w-3 h-3 shrink-0" />
                            <span>CLEAN</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setInspectVehicle(veh)}
                          className="px-2.5 py-1 rounded border font-mono text-[11px] font-bold transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
                          style={{
                            background: 'var(--raised)',
                            borderColor: 'var(--line)',
                            color: 'var(--sea-600)',
                          }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredVehicles.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-6 text-center font-mono" style={{ color: 'var(--text-muted)' }}>
                        No ANPR vehicle records match filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODE 2: MARITIME VESSEL TRACKING                            */}
      {/* ════════════════════════════════════════════════════════════ */}
      {activeTab === 'MARITIME_VESSEL' && (
        <div className="flex flex-col gap-6">
          {/* 4 Maritime KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="card-sand p-3.5 flex flex-col justify-between">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Live In Frame (Sector 4)
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-mono text-2xl font-bold text-sky-800 dark:text-sky-300">28</span>
                <span className="text-[10px] text-sky-700 dark:text-sky-400 font-semibold bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                  Vizhinjam Outer
                </span>
              </div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Radar &amp; Drone Synchronized</div>
            </div>

            <div className="card-sand p-3.5 flex flex-col justify-between">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Cumulative Today
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-mono text-2xl font-bold" style={{ color: 'var(--text)' }}>114</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--text-muted)' }}>24h Log</span>
              </div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>78 Trawlers / 14 Cargo / 22 Crafts</div>
            </div>

            <div className="card-sand p-3.5 flex flex-col justify-between">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Motion State Breakdown
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-mono text-lg font-bold" style={{ color: 'var(--text)' }}>19 / 6 / 3</span>
                <span className="text-[10px] font-mono font-semibold" style={{ color: 'var(--text-muted)' }}>C / A / D</span>
              </div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Cruising (19) · Anchored (6) · Drifting (3)
              </div>
            </div>

            <div className="card-sand p-3.5 flex flex-col justify-between border-l-4 border-l-red-600">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-red-900">
                Proximity / Collision Alerts
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-mono text-2xl font-bold text-red-700">2</span>
                <span className="animate-pulse bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-300">
                  &lt;90px HAZARD
                </span>
              </div>
              <div className="text-[10px] text-red-800 font-semibold mt-1">Trawler 902 &amp; Speedboat 04</div>
            </div>
          </div>

          {/* Maritime Radar & Kinematic Vector Map Feed */}
          <div className="card-sand p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-sky-700" />
                <h2 className="font-serif text-base font-bold text-[var(--text)]">
                  Live Drone Maritime Vector Tracking — UAV-KL-02 (Vizhinjam Approach)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge-navy text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                  RADAR RANGE: 5.0 NM
                </span>
              </div>
            </div>

            {/* Maritime Tactical Canvas with Vectors & Collision Warnings */}
            <div className="relative rounded-lg overflow-hidden border border-[var(--border)] bg-slate-950 aspect-21/9 min-h-[360px] flex flex-col justify-between p-4 select-none">
              {/* Nautical Radar Waves & Sector lines */}
              <div className="absolute inset-0 bg-radial from-slate-900 to-slate-950">
                <svg className="w-full h-full" viewBox="0 0 900 400">
                  <defs>
                    <pattern id={seaPatternId} width="60" height="60" patternUnits="userSpaceOnUse">
                      <path d="M 0 30 Q 15 20 30 30 T 60 30" fill="none" stroke="rgba(14, 165, 233, 0.08)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="900" height="400" fill={`url(#${seaPatternId})`} />

                  {/* Concentric Radar Rings */}
                  <circle cx="450" cy="200" r="80" fill="none" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
                  <circle cx="450" cy="200" r="160" fill="none" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
                  <circle cx="450" cy="200" r="240" fill="none" stroke="rgba(56, 189, 248, 0.12)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="450" y1="0" x2="450" y2="400" stroke="rgba(56, 189, 248, 0.1)" strokeWidth="1" />
                  <line x1="0" y1="200" x2="900" y2="200" stroke="rgba(56, 189, 248, 0.1)" strokeWidth="1" />

                  {/* Coastline silhouette */}
                  <path d="M 0 400 L 0 100 Q 150 140 220 220 T 320 380 L 320 400 Z" fill="rgba(30, 41, 59, 0.6)" stroke="#334155" strokeWidth="1.5" />
                  <text x="50" y="360" fill="#64748b" fontSize="11" fontFamily="serif" fontWeight="bold">KOVALAM COASTLINE</text>

                  {/* Collision Warning line between Vessel 1 and Vessel 2 */}
                  <line x1="480" y1="180" x2="530" y2="215" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4 3" className="animate-pulse" />
                  {/* Warning label */}
                  <rect x="440" y="225" width="150" height="24" fill="#991b1b" rx="3" />
                  <text x="448" y="241" fill="#fef2f2" fontSize="9" fontFamily="monospace" fontWeight="bold">COLLISION HAZARD: 68px</text>

                  {/* Vessel 1: Fishing Trawler (Cruising 8.4kt) */}
                  <g transform="translate(480, 180)">
                    <circle cx="0" cy="0" r="6" fill="#38bdf8" />
                    {/* Heading Vector */}
                    <line x1="0" y1="0" x2="-25" y2="35" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
                    <rect x="10" y="-14" width="130" height="18" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1" rx="2" />
                    <text x="14" y="-2" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">TRAWLER-KL-902 (8.4kt)</text>
                  </g>

                  {/* Vessel 2: Speedboat (Cruising 24.2kt) */}
                  <g transform="translate(530, 215)">
                    <circle cx="0" cy="0" r="6" fill="#ef4444" className="animate-ping" />
                    <circle cx="0" cy="0" r="5" fill="#ef4444" />
                    {/* Heading Vector */}
                    <line x1="0" y1="0" x2="10" y2="-45" stroke="#ef4444" strokeWidth="2" />
                    <rect x="10" y="-8" width="145" height="18" fill="rgba(15, 23, 42, 0.85)" stroke="#ef4444" strokeWidth="1" rx="2" />
                    <text x="14" y="4" fill="#ef4444" fontSize="9" fontFamily="monospace" fontWeight="bold">SPEEDBOAT-SEC-04 (24.2kt)</text>
                  </g>

                  {/* Vessel 3: Dhow (Anchored) */}
                  <g transform="translate(360, 290)">
                    <rect x="-5" y="-5" width="10" height="10" fill="#f59e0b" />
                    <text x="12" y="2" fill="#f59e0b" fontSize="9" fontFamily="monospace">DHOW-AL-NOOR [ANCHORED]</text>
                  </g>

                  {/* Vessel 4: Cargo MV Kerala */}
                  <g transform="translate(680, 110)">
                    <polygon points="0,-8 14,0 0,8 -6,0" fill="#10b981" />
                    <line x1="0" y1="0" x2="-30" y2="-25" stroke="#10b981" strokeWidth="1.5" />
                    <text x="18" y="2" fill="#10b981" fontSize="9" fontFamily="monospace">MV-KERALA (11.5kt - 310°)</text>
                  </g>
                </svg>
              </div>

              {/* HUD Overlay Top */}
              <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-sky-200">
                <span className="bg-slate-900/90 px-2.5 py-1 rounded border border-sky-600/40 flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  VIZHINJAM RADAR INTEGRATION ACTIVE
                </span>
                <span className="bg-red-950/90 text-red-300 px-2.5 py-1 rounded border border-red-500/50 font-bold flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  PROXIMITY WARNING ACTIVE: SECTOR 4-B
                </span>
              </div>

              {/* HUD Overlay Bottom */}
              <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-300 bg-slate-950/80 p-2 rounded border border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-sky-400 font-bold">KINEMATICS: BEARING VECTOR ESTIMATOR</span>
                  <span className="opacity-50">|</span>
                  <span>TTA TO CLOSEST POINT: 42 SECONDS</span>
                </div>
                <div className="text-amber-400 font-bold">
                  RECOMMENDATION: ADVISE SPEEDBOAT ALTER COURSE 15° STARBOARD
                </div>
              </div>
            </div>
          </div>

          {/* Active Coastal Vessels Ledger Table */}
          <div className="card-sand p-4 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[var(--text)]">
                  Active Coastal Vessels Ledger
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Automatic tracking of registered fishing boats, security speedboats, and merchant vessels
                </p>
              </div>

              {/* Filters & Export */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center p-0.5 bg-[var(--surface-muted)] border border-[var(--border)] rounded text-xs font-mono">
                  <button
                    onClick={() => setVesselFilter('ALL')}
                    className={cn("px-2.5 py-1 rounded transition-colors cursor-pointer", vesselFilter === 'ALL' ? "bg-[var(--surface)] text-[var(--sea-600)] dark:text-[var(--sea-accent)] font-bold shadow-xs" : "text-[var(--text-muted)] hover:text-[var(--text)]")}
                  >
                    All ({vessels.length})
                  </button>
                  <button
                    onClick={() => setVesselFilter('ALERTS')}
                    className={cn("px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer", vesselFilter === 'ALERTS' ? "bg-red-100 text-red-800 font-bold" : "text-[var(--text-muted)] hover:text-[var(--text)]")}
                  >
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    Alerts Only
                  </button>
                  <button
                    onClick={() => setVesselFilter('ANCHORED')}
                    className={cn("px-2.5 py-1 rounded transition-colors cursor-pointer", vesselFilter === 'ANCHORED' ? "bg-[var(--surface)] text-[var(--sea-600)] dark:text-[var(--sea-accent)] font-bold shadow-xs" : "text-[var(--text-muted)] hover:text-[var(--text)]")}
                  >
                    Anchored
                  </button>
                </div>

                <button
                  onClick={handleExportVesselCsv}
                  className="btn-navy text-xs flex items-center gap-1.5 px-3 py-1.5 rounded cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Ledger
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-[var(--border)] rounded-md">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--surface-muted)] text-[var(--text-muted)] border-b border-[var(--border)] font-mono text-[11px] uppercase">
                    <th className="p-3">Vessel Code</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3">Speed (Knots)</th>
                    <th className="p-3">Heading</th>
                    <th className="p-3">Motion State</th>
                    <th className="p-3">Separation / Hazard</th>
                    <th className="p-3">Coordinates (Lat, Lon)</th>
                    <th className="p-3">Last Seen</th>
                    <th className="p-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredVessels.map(vsl => (
                    <tr key={vsl.id} className={cn("hover:bg-[var(--surface-hover)] transition-colors", vsl.proximityWarning ? "bg-red-500/10 border-l-2 border-l-red-500" : "")}>
                      <td className="p-3 font-mono font-bold text-[var(--sea-600)] dark:text-[var(--sea-accent)]">{vsl.vesselCode}</td>
                      <td className="p-3 font-sans font-medium" style={{ color: 'var(--text)' }}>{vsl.vesselClass.replace('_', ' ')}</td>
                      <td className="p-3 font-mono font-bold">
                        <span className={vsl.speedKnots > 20 ? "text-amber-700 dark:text-amber-400" : ""} style={vsl.speedKnots <= 20 ? { color: 'var(--text)' } : undefined}>
                          {vsl.speedKnots.toFixed(1)} kt
                        </span>
                      </td>
                      <td className="p-3 font-mono flex items-center gap-1" style={{ color: 'var(--text)' }}>
                        <ArrowUpRight className="w-3 h-3 opacity-60" style={{ transform: `rotate(${vsl.headingDeg}deg)`, color: 'var(--text-muted)' }} />
                        {vsl.headingDeg}°
                      </td>
                      <td className="p-3 font-mono">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold",
                          vsl.motionState === 'CRUISING' ? "bg-sky-50 text-sky-800 border border-sky-200" :
                          vsl.motionState === 'ANCHORED' ? "bg-amber-50 text-amber-800 border border-amber-200" :
                          "bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/30"
                        )}>
                          {vsl.motionState}
                        </span>
                      </td>
                      <td className="p-3 font-mono">
                        {vsl.proximityWarning ? (
                          <div className="flex items-center gap-1 text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded border border-red-300 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{vsl.closestSeparationPx}px HAZARD</span>
                          </div>
                        ) : (
                          <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>{vsl.closestSeparationPx}px (Clear)</span>
                        )}
                      </td>
                      <td className="p-3 font-mono" style={{ color: 'var(--text-muted)' }}>
                        {vsl.lat.toFixed(4)}°N, {vsl.lon.toFixed(4)}°E
                      </td>
                      <td className="p-3 font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{vsl.lastSeenAt}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setInspectVessel(vsl)}
                          className="px-2.5 py-1 rounded border font-mono text-[11px] font-bold transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
                          style={{
                            background: 'var(--raised)',
                            borderColor: 'var(--line)',
                            color: 'var(--sea-600)',
                          }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredVessels.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-6 text-center font-mono" style={{ color: 'var(--text-muted)' }}>
                        No maritime tracks match criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Vehicle Inspection Modal ── */}
      {inspectVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="card-sand max-w-md w-full p-5 flex flex-col gap-4 shadow-2xl border border-[var(--border)]">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-700" />
                <h3 className="font-serif text-base font-bold text-[var(--text)]">Vehicle Inspection Record</h3>
              </div>
              <button onClick={() => setInspectVehicle(null)} className="text-lg font-bold hover:opacity-80 cursor-pointer" style={{ color: 'var(--text-muted)' }}>×</button>
            </div>

            <div className="flex items-center justify-center py-2">
              <div className="border-2 border-slate-800 bg-white rounded px-4 py-2 shadow-md font-mono font-black text-slate-900 tracking-widest text-lg flex items-center gap-3">
                <span className="text-xs bg-sky-700 text-white font-bold px-1.5 py-0.5 rounded">IND</span>
                <span>{inspectVehicle.plate}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vehicle Type:</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>{inspectVehicle.vehicleType}</span>
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Speed Detected:</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>{inspectVehicle.speedKmh} km/h</span>
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>OCR Confidence:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">{(inspectVehicle.confidence * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Drone Source:</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>{inspectVehicle.droneCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Location:</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>{inspectVehicle.locationName}</span>
              </div>
              {inspectVehicle.isWatchlistMatch && (
                <div className="p-3 bg-red-100 border border-red-300 rounded text-red-900 font-sans text-xs mt-2">
                  <div className="font-bold flex items-center gap-1.5 text-red-800 mb-1">
                    <ShieldAlert className="w-4 h-4" /> AUTHORISED WATCHLIST MATCH · RECOMMEND ATTENTION
                  </div>
                  {inspectVehicle.watchlistReason}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => setInspectVehicle(null)}
                className="btn-navy text-xs px-4 py-2 rounded"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Vessel Inspection Modal ── */}
      {inspectVessel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="card-sand max-w-md w-full p-5 flex flex-col gap-4 shadow-2xl border" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <Ship className="w-4 h-4 text-sky-700" />
                <h3 className="font-serif text-base font-bold text-[var(--text)]">Maritime Kinematics Dossier</h3>
              </div>
              <button onClick={() => setInspectVessel(null)} className="text-lg font-bold hover:opacity-80 cursor-pointer" style={{ color: 'var(--text-muted)' }}>×</button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vessel Code:</span>
                <span className="font-bold text-[var(--sea-600)] dark:text-[var(--sea-accent)]">{inspectVessel.vesselCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Classification:</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>{inspectVessel.vesselClass}</span>
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Speed (Knots):</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>{inspectVessel.speedKnots} kt</span>
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Heading:</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>{inspectVessel.headingDeg}°</span>
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Motion State:</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>{inspectVessel.motionState}</span>
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Coordinates:</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>{inspectVessel.lat}°N, {inspectVessel.lon}°E</span>
              </div>
              {inspectVessel.proximityWarning && (
                <div className="p-3 bg-red-100 border border-red-300 rounded text-red-900 font-sans text-xs mt-2">
                  <div className="font-bold flex items-center gap-1.5 text-red-800 mb-1">
                    <AlertTriangle className="w-4 h-4" /> COLLISION RISK ACTIVE
                  </div>
                  Separation under 90px threshold (Current: {inspectVessel.closestSeparationPx}px). Maritime Police Sector alert dispatched.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => setInspectVessel(null)}
                className="btn-navy text-xs px-4 py-2 rounded"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

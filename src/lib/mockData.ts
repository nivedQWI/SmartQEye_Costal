// ============================================================
// SmartQEye Coastal — Mock Data
// Kerala coastal area: Thiruvananthapuram / Vizhinjam / Kovalam / Poovar
// ============================================================

import type {
  Alert, Contact, Zone, Mission, Uav, Feed, TelemetrySample,
  CoastalEvent, EvidenceItem, SystemHealth, EdgeNode, ServiceStatus,
  ContactClass, Severity, FeedState, ZoneType, ZoneProfile,
  AttentionLevel, Modality,
} from '@/types';

// ─── Helpers ─────────────────────────────────────────────────

function ageMs(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

function minutesAgo(n: number): string {
  return ageMs(n * 60_000);
}

// IST offset helper
export function toIST(date: Date): string {
  return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
}

// ─── Zone Profiles ────────────────────────────────────────────

export const ZONE_PROFILES: ZoneProfile[] = [
  {
    id: 'zp-restricted-24x7', name: 'Restricted 24×7', zoneType: 'RESTRICTED',
    sensitivityLevel: 'VERY_HIGH', dwellThresholdSec: 30, schedule: 'ALWAYS',
    defaultSeverity: 'HIGH', notifyList: ['Control Room', 'Coastal SHO'],
  },
  {
    id: 'zp-harbour-patrol', name: 'Harbour Patrol', zoneType: 'HARBOUR',
    sensitivityLevel: 'HIGH', dwellThresholdSec: 120, schedule: 'ALWAYS',
    defaultSeverity: 'MEDIUM', notifyList: ['Control Room'],
  },
  {
    id: 'zp-fishing-daytime', name: 'Fishing Zone – Daytime', zoneType: 'FISHING',
    sensitivityLevel: 'LOW', dwellThresholdSec: 600, schedule: 'DAYTIME',
    defaultSeverity: 'INFO', notifyList: ['Control Room'],
  },
  {
    id: 'zp-tourism-evening', name: 'Tourism – Evening', zoneType: 'TOURISM',
    sensitivityLevel: 'MEDIUM', dwellThresholdSec: 300, schedule: 'CUSTOM',
    defaultSeverity: 'MEDIUM', notifyList: ['Control Room', 'Tourism Police'],
  },
  {
    id: 'zp-beach-monitor', name: 'Beach Monitoring', zoneType: 'BEACH',
    sensitivityLevel: 'MEDIUM', dwellThresholdSec: 240, schedule: 'ALWAYS',
    defaultSeverity: 'LOW', notifyList: ['Control Room'],
  },
  {
    id: 'zp-estuary-watch', name: 'Estuary Watch', zoneType: 'ESTUARY',
    sensitivityLevel: 'HIGH', dwellThresholdSec: 180, schedule: 'ALWAYS',
    defaultSeverity: 'MEDIUM', notifyList: ['Control Room', 'Coast Guard Liaison'],
  },
];

// ─── Zones ───────────────────────────────────────────────────

export const ZONES: Zone[] = [
  {
    id: 'z-01', code: 'Z-01', name: 'Vizhinjam Restricted Jetty', type: 'RESTRICTED',
    profileId: 'zp-restricted-24x7', version: 3, color: '#C8352E',
    geometry: { type: 'Polygon', coordinates: [[[76.980, 8.378], [76.985, 8.378], [76.985, 8.383], [76.980, 8.383], [76.980, 8.378]]] },
    createdAt: minutesAgo(14400), updatedAt: minutesAgo(720),
  },
  {
    id: 'z-02', code: 'Z-02', name: 'Vizhinjam Outer Harbour', type: 'HARBOUR',
    profileId: 'zp-harbour-patrol', version: 2, color: '#E06A3B',
    geometry: { type: 'Polygon', coordinates: [[[76.975, 8.374], [76.985, 8.374], [76.988, 8.382], [76.975, 8.382], [76.975, 8.374]]] },
    createdAt: minutesAgo(14400), updatedAt: minutesAgo(1440),
  },
  {
    id: 'z-03', code: 'Z-03', name: 'Kovalam Beach North', type: 'BEACH',
    profileId: 'zp-beach-monitor', version: 1, color: '#E0A526',
    geometry: { type: 'Polygon', coordinates: [[[76.988, 8.396], [76.995, 8.396], [76.995, 8.403], [76.988, 8.403], [76.988, 8.396]]] },
    createdAt: minutesAgo(14400), updatedAt: minutesAgo(2880),
  },
  {
    id: 'z-04', code: 'Z-04', name: 'Lighthouse Beach – Tourism Zone', type: 'TOURISM',
    profileId: 'zp-tourism-evening', version: 2, color: '#3FAE9A',
    geometry: { type: 'Polygon', coordinates: [[[76.993, 8.388], [77.000, 8.388], [77.000, 8.395], [76.993, 8.395], [76.993, 8.388]]] },
    createdAt: minutesAgo(14400), updatedAt: minutesAgo(1440),
  },
  {
    id: 'z-05', code: 'Z-05', name: 'Poovar Estuary', type: 'ESTUARY',
    profileId: 'zp-estuary-watch', version: 1, color: '#2B7FA6',
    geometry: { type: 'Polygon', coordinates: [[[76.960, 8.315], [76.972, 8.315], [76.972, 8.325], [76.960, 8.325], [76.960, 8.315]]] },
    createdAt: minutesAgo(14400), updatedAt: minutesAgo(5760),
  },
  {
    id: 'z-06', code: 'Z-06', name: 'Fishing Zone – Veli Lake', type: 'FISHING',
    profileId: 'zp-fishing-daytime', version: 1, color: '#3FAE9A',
    geometry: { type: 'Polygon', coordinates: [[[76.904, 8.479], [76.916, 8.479], [76.916, 8.490], [76.904, 8.490], [76.904, 8.479]]] },
    createdAt: minutesAgo(14400), updatedAt: minutesAgo(5760),
  },
  {
    id: 'z-07', code: 'Z-07', name: 'Restricted – Vizhinjam Military Approach', type: 'RESTRICTED',
    profileId: 'zp-restricted-24x7', version: 4, color: '#C8352E',
    geometry: { type: 'Polygon', coordinates: [[[76.970, 8.369], [76.978, 8.369], [76.978, 8.376], [76.970, 8.376], [76.970, 8.369]]] },
    createdAt: minutesAgo(14400), updatedAt: minutesAgo(360),
  },
  {
    id: 'z-08', code: 'Z-08', name: 'Shanghumugham Beach', type: 'BEACH',
    profileId: 'zp-beach-monitor', version: 1, color: '#E0A526',
    geometry: { type: 'Polygon', coordinates: [[[76.888, 8.479], [76.896, 8.479], [76.896, 8.488], [76.888, 8.488], [76.888, 8.479]]] },
    createdAt: minutesAgo(14400), updatedAt: minutesAgo(5760),
  },
  {
    id: 'z-09', code: 'Z-09', name: 'Valiyathura Jetty – Monitored', type: 'MONITORED',
    profileId: 'zp-harbour-patrol', version: 2, color: '#E06A3B',
    geometry: { type: 'Polygon', coordinates: [[[76.914, 8.480], [76.924, 8.480], [76.924, 8.488], [76.914, 8.488], [76.914, 8.480]]] },
    createdAt: minutesAgo(14400), updatedAt: minutesAgo(2880),
  },
  {
    id: 'z-10', code: 'Z-10', name: 'Anchuthengu – Open Coast Watch', type: 'OPEN_SEA',
    profileId: 'zp-beach-monitor', version: 1, color: '#6FB7D6',
    geometry: { type: 'Polygon', coordinates: [[[76.840, 8.610], [76.856, 8.610], [76.856, 8.625], [76.840, 8.625], [76.840, 8.610]]] },
    createdAt: minutesAgo(14400), updatedAt: minutesAgo(5760),
  },
  {
    id: 'z-11', code: 'Z-11', name: 'Paravur Backwaters', type: 'ESTUARY',
    profileId: 'zp-estuary-watch', version: 1, color: '#2B7FA6',
    geometry: { type: 'Polygon', coordinates: [[[76.765, 8.802], [76.778, 8.802], [76.778, 8.815], [76.765, 8.815], [76.765, 8.802]]] },
    createdAt: minutesAgo(14400), updatedAt: minutesAgo(5760),
  },
  {
    id: 'z-12', code: 'Z-12', name: 'Neendakara Fishing Harbour', type: 'FISHING',
    profileId: 'zp-fishing-daytime', version: 2, color: '#3FAE9A',
    geometry: { type: 'Polygon', coordinates: [[[76.553, 9.000], [76.565, 9.000], [76.565, 9.010], [76.553, 9.010], [76.553, 9.000]]] },
    createdAt: minutesAgo(14400), updatedAt: minutesAgo(2880),
  },
];

// ─── UAVs ─────────────────────────────────────────────────────

export const UAVS: Uav[] = [
  { id: 'u-01', droneCode: 'UAV-01', makeModel: 'DJI Matrice 350 RTK', serialNo: 'MAT-001-KP', adapterType: 'dji_sdk', hasOnboardCompute: false, isActive: true },
  { id: 'u-02', droneCode: 'UAV-02', makeModel: 'DJI Matrice 350 RTK', serialNo: 'MAT-002-KP', adapterType: 'dji_sdk', hasOnboardCompute: false, isActive: true },
  { id: 'u-03', droneCode: 'UAV-03', makeModel: 'Asteria Falcon Eye', serialNo: 'FE-003-KP', adapterType: 'mavlink', hasOnboardCompute: true, isActive: true },
  { id: 'u-04', droneCode: 'UAV-04', makeModel: 'Asteria Falcon Eye', serialNo: 'FE-004-KP', adapterType: 'mavlink', hasOnboardCompute: false, isActive: true },
  { id: 'u-05', droneCode: 'UAV-05', makeModel: 'ideaForge SWITCH', serialNo: 'ISW-005-KP', adapterType: 'mavlink', hasOnboardCompute: false, isActive: true },
  { id: 'u-06', droneCode: 'UAV-06', makeModel: 'ideaForge SWITCH', serialNo: 'ISW-006-KP', adapterType: 'mavlink', hasOnboardCompute: false, isActive: true },
];

// ─── Missions ─────────────────────────────────────────────────

export const MISSIONS: Mission[] = [
  { id: 'm-01', missionCode: 'M-2026-0415', title: 'Vizhinjam Harbour Patrol', profile: 'harbour_patrol', uavId: 'u-03', uavCode: 'UAV-03', status: 'ACTIVE', processingMode: 'CENTRAL_GPU', startedAt: minutesAgo(180), area: 'Vizhinjam' },
  { id: 'm-02', missionCode: 'M-2026-0416', title: 'Kovalam Beach Surveillance', profile: 'beach_patrol', uavId: 'u-01', uavCode: 'UAV-01', status: 'ACTIVE', processingMode: 'CENTRAL_GPU', startedAt: minutesAgo(120), area: 'Kovalam' },
  { id: 'm-03', missionCode: 'M-2026-0417', title: 'Poovar Estuary Watch', profile: 'estuary_patrol', uavId: 'u-05', uavCode: 'UAV-05', status: 'ACTIVE', processingMode: 'CENTRAL_GPU', startedAt: minutesAgo(90), area: 'Poovar' },
  { id: 'm-04', missionCode: 'M-2026-0414', title: 'Morning Coastal Survey', profile: 'coastal_survey', uavId: 'u-02', uavCode: 'UAV-02', status: 'COMPLETED', processingMode: 'CENTRAL_GPU', startedAt: minutesAgo(480), endedAt: minutesAgo(120), area: 'Thiruvananthapuram Coast' },
  { id: 'm-05', missionCode: 'M-2026-0418', title: 'Valiyathura Jetty Monitor', profile: 'harbour_patrol', uavId: 'u-04', uavCode: 'UAV-04', status: 'ACTIVE', processingMode: 'CENTRAL_GPU', startedAt: minutesAgo(60), area: 'Valiyathura' },
  { id: 'm-06', missionCode: 'M-2026-0419', title: 'Shanghumugham Patrol', profile: 'beach_patrol', uavId: 'u-06', uavCode: 'UAV-06', status: 'ACTIVE', processingMode: 'LOCAL_EDGE', startedAt: minutesAgo(45), area: 'Shanghumugham' },
];

// ─── Telemetry (initial values) ───────────────────────────────

export const INITIAL_TELEMETRY: Record<string, TelemetrySample> = {
  'f-01': { feedId: 'f-01', uavCode: 'UAV-03', missionCode: 'M-2026-0415', timestamp: new Date().toISOString(), lat: 8.380, lon: 76.982, altitudeM: 120, headingDeg: 42, groundSpeedMs: 9.2, batteryPct: 63, flightStatus: 'AUTO', signalStrengthPct: 94, satelliteCount: 14, telemetryAvailable: true },
  'f-02': { feedId: 'f-02', uavCode: 'UAV-03', missionCode: 'M-2026-0415', timestamp: new Date().toISOString(), lat: 8.380, lon: 76.982, altitudeM: 120, headingDeg: 42, groundSpeedMs: 9.2, batteryPct: 63, flightStatus: 'AUTO', signalStrengthPct: 94, satelliteCount: 14, telemetryAvailable: true },
  'f-03': { feedId: 'f-03', uavCode: 'UAV-01', missionCode: 'M-2026-0416', timestamp: new Date().toISOString(), lat: 8.400, lon: 76.991, altitudeM: 100, headingDeg: 195, groundSpeedMs: 7.5, batteryPct: 78, flightStatus: 'AUTO', signalStrengthPct: 88, satelliteCount: 13, telemetryAvailable: true },
  'f-05': { feedId: 'f-05', uavCode: 'UAV-05', missionCode: 'M-2026-0417', timestamp: new Date().toISOString(), lat: 8.320, lon: 76.965, altitudeM: 80, headingDeg: 320, groundSpeedMs: 5.0, batteryPct: 91, flightStatus: 'AUTO', signalStrengthPct: 82, satelliteCount: 11, telemetryAvailable: true },
  'f-07': { feedId: 'f-07', uavCode: 'UAV-04', missionCode: 'M-2026-0418', timestamp: new Date().toISOString(), lat: 8.483, lon: 76.920, altitudeM: 90, headingDeg: 110, groundSpeedMs: 8.1, batteryPct: 55, flightStatus: 'AUTO', signalStrengthPct: 76, satelliteCount: 12, telemetryAvailable: true },
  'f-09': { feedId: 'f-09', uavCode: 'UAV-06', missionCode: 'M-2026-0419', timestamp: new Date().toISOString(), lat: 8.483, lon: 76.892, altitudeM: 110, headingDeg: 270, groundSpeedMs: 6.3, batteryPct: 82, flightStatus: 'AUTO', signalStrengthPct: 91, satelliteCount: 15, telemetryAvailable: true },
};

// ─── Feeds ────────────────────────────────────────────────────

export const INITIAL_FEEDS: Feed[] = [
  { id: 'f-01', uavCode: 'UAV-03', missionCode: 'M-2026-0415', label: 'UAV-03 RGB', modality: 'RGB', state: 'LIVE', latencyMs: 820, fpsCurrent: 25, fpsTarget: 25, bitrateMbps: 8.4, droppedFrames: 12, lastFrameAt: new Date().toISOString(), resolution: '1920x1080', isPinned: true, telemetry: INITIAL_TELEMETRY['f-01'] },
  { id: 'f-02', uavCode: 'UAV-03', missionCode: 'M-2026-0415', label: 'UAV-03 Thermal', modality: 'THERMAL', state: 'LIVE', latencyMs: 840, fpsCurrent: 25, fpsTarget: 25, bitrateMbps: 4.2, droppedFrames: 8, lastFrameAt: new Date().toISOString(), resolution: '640x512', isPinned: true, telemetry: INITIAL_TELEMETRY['f-02'] },
  { id: 'f-03', uavCode: 'UAV-01', missionCode: 'M-2026-0416', label: 'UAV-01 RGB', modality: 'RGB', state: 'LIVE', latencyMs: 1200, fpsCurrent: 25, fpsTarget: 25, bitrateMbps: 7.8, droppedFrames: 3, lastFrameAt: new Date().toISOString(), resolution: '1920x1080', isPinned: true, telemetry: INITIAL_TELEMETRY['f-03'] },
  { id: 'f-04', uavCode: 'UAV-01', missionCode: 'M-2026-0416', label: 'UAV-01 Thermal', modality: 'THERMAL', state: 'BUFFERING', latencyMs: 3200, fpsCurrent: 12, fpsTarget: 25, bitrateMbps: 2.1, droppedFrames: 87, lastFrameAt: minutesAgo(0.5), resolution: '640x512', isPinned: true, telemetry: INITIAL_TELEMETRY['f-03'] },
  { id: 'f-05', uavCode: 'UAV-05', missionCode: 'M-2026-0417', label: 'UAV-05 RGB', modality: 'RGB', state: 'LIVE', latencyMs: 950, fpsCurrent: 25, fpsTarget: 25, bitrateMbps: 6.9, droppedFrames: 0, lastFrameAt: new Date().toISOString(), resolution: '1920x1080', isPinned: false, telemetry: INITIAL_TELEMETRY['f-05'] },
  { id: 'f-06', uavCode: 'UAV-05', missionCode: 'M-2026-0417', label: 'UAV-05 Thermal', modality: 'THERMAL', state: 'LIVE', latencyMs: 970, fpsCurrent: 25, fpsTarget: 25, bitrateMbps: 3.8, droppedFrames: 0, lastFrameAt: new Date().toISOString(), resolution: '640x512', isPinned: false, telemetry: INITIAL_TELEMETRY['f-05'] },
  { id: 'f-07', uavCode: 'UAV-04', missionCode: 'M-2026-0418', label: 'UAV-04 RGB', modality: 'RGB', state: 'LIVE', latencyMs: 1100, fpsCurrent: 25, fpsTarget: 25, bitrateMbps: 7.2, droppedFrames: 5, lastFrameAt: new Date().toISOString(), resolution: '1920x1080', isPinned: false, telemetry: INITIAL_TELEMETRY['f-07'] },
  { id: 'f-08', uavCode: 'UAV-04', missionCode: 'M-2026-0418', label: 'UAV-04 Thermal', modality: 'THERMAL', state: 'LIVE', latencyMs: 1120, fpsCurrent: 25, fpsTarget: 25, bitrateMbps: 3.5, droppedFrames: 2, lastFrameAt: new Date().toISOString(), resolution: '640x512', isPinned: false, telemetry: INITIAL_TELEMETRY['f-07'] },
  { id: 'f-09', uavCode: 'UAV-06', missionCode: 'M-2026-0419', label: 'UAV-06 RGB', modality: 'RGB', state: 'LIVE', latencyMs: 780, fpsCurrent: 25, fpsTarget: 25, bitrateMbps: 8.1, droppedFrames: 1, lastFrameAt: new Date().toISOString(), resolution: '1920x1080', isPinned: false, telemetry: INITIAL_TELEMETRY['f-09'] },
  { id: 'f-10', uavCode: 'UAV-06', missionCode: 'M-2026-0419', label: 'UAV-06 Thermal', modality: 'THERMAL', state: 'EDGE_SYNC_LAG', latencyMs: 8500, fpsCurrent: 8, fpsTarget: 25, bitrateMbps: 1.2, droppedFrames: 143, lastFrameAt: minutesAgo(2), resolution: '640x512', isPinned: false, edgeSyncLagSec: 127 },
  { id: 'f-11', uavCode: 'UAV-02', missionCode: 'M-2026-0414', label: 'UAV-02 RGB', modality: 'RGB', state: 'RECORDED', latencyMs: 0, fpsCurrent: 0, fpsTarget: 25, bitrateMbps: 0, droppedFrames: 0, resolution: '1920x1080', isPinned: false },
  { id: 'f-12', uavCode: 'UAV-02', missionCode: 'M-2026-0414', label: 'UAV-02 Thermal', modality: 'THERMAL', state: 'RECORDED', latencyMs: 0, fpsCurrent: 0, fpsTarget: 25, bitrateMbps: 0, droppedFrames: 0, resolution: '640x512', isPinned: false },
  // Additional feeds (thumbnails strip)
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `f-${13 + i}`,
    uavCode: `UAV-0${(i % 6) + 1}`,
    missionCode: 'M-2026-0415',
    label: `Feed ${13 + i}`,
    modality: (i % 2 === 0 ? 'RGB' : 'THERMAL') as 'RGB' | 'THERMAL',
    state: (['LIVE', 'LIVE', 'LIVE', 'NO_SIGNAL', 'LIVE', 'BUFFERING', 'LIVE', 'LIVE'] as FeedState[])[i],
    latencyMs: 900 + i * 100,
    fpsCurrent: i === 3 ? 0 : 25,
    fpsTarget: 25,
    bitrateMbps: i === 3 ? 0 : 5 + i,
    droppedFrames: i * 3,
    lastFrameAt: i === 3 ? minutesAgo(5) : new Date().toISOString(),
    resolution: '1280x720',
    isPinned: false,
  })),
];

// ─── Contacts ─────────────────────────────────────────────────

const CONTACT_CLASSES: ContactClass[] = ['VESSEL', 'SMALL_CRAFT', 'FISHING_BOAT', 'PERSON', 'VEHICLE', 'UNKNOWN'];

const CONTACT_LOCATIONS = [
  { lat: 8.379, lon: 76.981 }, { lat: 8.397, lon: 76.992 }, { lat: 8.321, lon: 76.963 },
  { lat: 8.390, lon: 76.991 }, { lat: 8.401, lon: 76.988 }, { lat: 8.484, lon: 76.921 },
  { lat: 8.480, lon: 76.892 }, { lat: 8.376, lon: 76.979 }, { lat: 8.385, lon: 76.984 },
  { lat: 8.395, lon: 76.990 }, { lat: 8.406, lon: 76.995 }, { lat: 8.318, lon: 76.961 },
  { lat: 8.332, lon: 76.967 }, { lat: 8.482, lon: 76.918 }, { lat: 8.488, lon: 76.924 },
  { lat: 8.373, lon: 76.975 }, { lat: 8.387, lon: 76.986 }, { lat: 8.410, lon: 76.997 },
  { lat: 8.360, lon: 76.973 }, { lat: 8.455, lon: 76.912 },
];

export const CONTACTS: Contact[] = Array.from({ length: 40 }, (_, i) => {
  const cls = CONTACT_CLASSES[i % CONTACT_CLASSES.length];
  const loc = CONTACT_LOCATIONS[i % CONTACT_LOCATIONS.length];
  const clsLabels: Record<ContactClass, string> = {
    VESSEL: 'Vessel', SMALL_CRAFT: 'Vessel › Small Craft', FISHING_BOAT: 'Vessel › Fishing Boat',
    PERSON: 'Person', VEHICLE: 'Vehicle', UNKNOWN: 'Unknown',
  };
  return {
    id: `c-${String(1030 + i).padStart(4, '0')}`,
    code: `C-${1030 + i}`,
    class: cls,
    classLabel: clsLabels[cls],
    classConf: 0.72 + Math.random() * 0.26,
    continuityConf: 0.68 + Math.random() * 0.30,
    firstSeenAt: minutesAgo(30 + i * 7),
    lastSeenAt: minutesAgo(i < 10 ? 1 : i < 20 ? 5 : 15),
    lastLocation: { lat: loc.lat + (Math.random() - 0.5) * 0.005, lon: loc.lon + (Math.random() - 0.5) * 0.005, method: 'DRONE_POSITION' },
    lastHeadingDeg: Math.floor(Math.random() * 360),
    lastSpeedKnots: cls === 'PERSON' || cls === 'VEHICLE' ? undefined : 1 + Math.random() * 6,
    linkedAlertIds: i < 8 ? [`a-${String(i + 1).padStart(3, '0')}`] : [],
  };
});

// ─── Evidence items ──────────────────────────────────────────

function makeEvidence(prefix: string): EvidenceItem[] {
  return [
    { id: `${prefix}-e1`, kind: 'CLIP', url: '/mock/sample.mp4', sha256: '9f3a2c8d1e4f6b7a0c9d2e5f3a8b4c1d7e0f2a9b5c8d3e6f1a4b7c0d9e2f5a8', sizeBytes: 18_500_000, contentType: 'video/mp4', modality: 'RGB', capturedAt: minutesAgo(15), description: 'RGB clip, 90s pre/post-roll' },
    { id: `${prefix}-e2`, kind: 'KEYFRAME', url: '/mock/kf1.jpg', sha256: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2', sizeBytes: 420_000, contentType: 'image/jpeg', modality: 'RGB', capturedAt: minutesAgo(16) },
    { id: `${prefix}-e3`, kind: 'KEYFRAME', url: '/mock/kf2.jpg', sha256: '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3', sizeBytes: 415_000, contentType: 'image/jpeg', modality: 'RGB', capturedAt: minutesAgo(15.5) },
    { id: `${prefix}-e4`, kind: 'SIDECAR_JSON', url: '/mock/event.json', sha256: '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4', sizeBytes: 12_800, contentType: 'application/json', capturedAt: minutesAgo(14) },
    { id: `${prefix}-e5`, kind: 'KEYFRAME', url: '/mock/kf3.jpg', sha256: '4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5', sizeBytes: 408_000, contentType: 'image/jpeg', modality: 'THERMAL', capturedAt: minutesAgo(15.2) },
  ];
}

// ─── Alerts ───────────────────────────────────────────────────

const EVENT_TYPES_BY_SEV: Record<Severity, { type: CoastalEvent['type']; zone?: string; zoneName?: string }[]> = {
  CRITICAL: [
    { type: 'intrusion', zone: 'Z-07', zoneName: 'Restricted – Vizhinjam Military Approach' },
    { type: 'intrusion', zone: 'Z-01', zoneName: 'Vizhinjam Restricted Jetty' },
  ],
  HIGH: [
    { type: 'repeated_shoreline_approach' },
    { type: 'prolonged_proximity' },
    { type: 'convergence' },
    { type: 'zone_dwell_exceeded', zone: 'Z-07', zoneName: 'Restricted Area' },
  ],
  MEDIUM: [
    { type: 'loitering', zone: 'Z-04', zoneName: 'Lighthouse Beach' },
    { type: 'crowd_threshold_exceeded', zone: 'Z-03', zoneName: 'Kovalam Beach North' },
    { type: 'course_speed_change' },
    { type: 'recurring_zone_entry', zone: 'Z-02', zoneName: 'Vizhinjam Outer Harbour' },
  ],
  LOW: [
    { type: 'vessel_detected' },
    { type: 'abandoned_object', zone: 'Z-08', zoneName: 'Shanghumugham Beach' },
    { type: 'unusual_stationary' },
  ],
  INFO: [
    { type: 'person_detected' },
    { type: 'vessel_detected' },
    { type: 'vehicle_detected' },
  ],
};

const SEV_ORDER: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

export const ALERTS: Alert[] = [
  // Alert 1 - CRITICAL intrusion
  {
    id: 'a-001', alertCode: 'ALC-2026-001',
    severity: 'CRITICAL', status: 'NEW',
    createdAt: minutesAgo(1.5), updatedAt: minutesAgo(1.5),
    event: {
      id: 'ev-001', type: 'intrusion', occurredAt: minutesAgo(1.5),
      uav: { id: 'u-03', code: 'UAV-03' }, mission: { id: 'm-01', code: 'M-2026-0415', title: 'Vizhinjam Harbour Patrol' },
      location: { lat: 8.373, lon: 76.974, method: 'DRONE_POSITION' },
      zone: { code: 'Z-07', name: 'Restricted – Vizhinjam Military Approach', version: 4, profile: 'Restricted 24×7' },
      contact: { code: 'C-1042', class: 'SMALL_CRAFT', classConf: 0.91, continuityConf: 0.93 },
      attention: 'CRITICAL', modality: 'RGB',
      rationale: {
        factors: [
          { factorName: 'Zone boundary crossed', value: 'Z-07 (Restricted)', contribution: 'PRIMARY' },
          { factorName: 'Zone sensitivity', value: 'VERY_HIGH', contribution: 'PRIMARY' },
          { factorName: 'Detector confidence', value: 0.91, threshold: 0.70, unit: 'conf', contribution: 'SUPPORTING' },
          { factorName: 'Continuity confidence', value: 0.93, threshold: 0.60, unit: 'conf', contribution: 'SUPPORTING' },
          { factorName: 'Time condition', value: 'Outside normal fishing hours', contribution: 'CONTEXTUAL' },
        ],
        note: 'Small craft entered restricted military approach zone at 08:14:22 IST.',
        zoneProfileUsed: 'Restricted 24×7',
        contextCondition: 'Night restriction active',
      },
      versions: { rgbDetectorVersion: 'rgb-det-v1.4.2', trackerVersion: 'bytetrack-v0.9', appVersion: '1.0.3' },
      relatedContacts: [{ code: 'C-1050', class: 'SMALL_CRAFT', relationshipType: 'co_travel' }],
    },
    evidence: makeEvidence('a001'),
    auditTrail: [],
  },
  // Alert 2 - HIGH repeated approach
  {
    id: 'a-002', alertCode: 'ALC-2026-002',
    severity: 'HIGH', status: 'ACKNOWLEDGED',
    createdAt: minutesAgo(4.5), updatedAt: minutesAgo(2),
    acknowledgedAt: minutesAgo(2), acknowledgedBy: 'Operator Rajan',
    event: {
      id: 'ev-002', type: 'repeated_shoreline_approach', occurredAt: minutesAgo(4.5),
      uav: { id: 'u-01', code: 'UAV-01' }, mission: { id: 'm-02', code: 'M-2026-0416', title: 'Kovalam Beach Surveillance' },
      location: { lat: 8.397, lon: 76.992, method: 'DRONE_POSITION' },
      zone: { code: 'Z-03', name: 'Kovalam Beach North', version: 1, profile: 'Beach Monitoring' },
      contact: { code: 'C-1031', class: 'SMALL_CRAFT', classConf: 0.88, continuityConf: 0.82 },
      attention: 'ATTENTION', modality: 'RGB',
      rationale: {
        factors: [
          { factorName: 'Shoreline approaches', value: 4, threshold: 3, unit: 'count/11min', contribution: 'PRIMARY' },
          { factorName: 'Zone profile', value: 'Tourism – Evening', contribution: 'CONTEXTUAL' },
          { factorName: 'Co-appearance with C-1050', value: 3, unit: 'times', contribution: 'SUPPORTING' },
          { factorName: 'Detector confidence', value: 0.88, threshold: 0.70, unit: 'conf', contribution: 'SUPPORTING' },
        ],
        note: 'Contact approached shoreline 4 times in 11 minutes — exceeds threshold of 3.',
        zoneProfileUsed: 'Beach Monitoring',
      },
      versions: { rgbDetectorVersion: 'rgb-det-v1.4.2', trackerVersion: 'bytetrack-v0.9', appVersion: '1.0.3' },
    },
    evidence: makeEvidence('a002'),
    auditTrail: [
      { id: 'au-001', timestamp: minutesAgo(2), userId: 'u-op1', userName: 'Operator Rajan', userRole: 'OPERATOR', action: 'ACKNOWLEDGED', targetType: 'ALERT', targetId: 'a-002', ipAddress: '10.10.1.5' },
    ],
  },
  // Alert 3 - MEDIUM crowd
  {
    id: 'a-003', alertCode: 'ALC-2026-003',
    severity: 'MEDIUM', status: 'NEW',
    createdAt: minutesAgo(12), updatedAt: minutesAgo(12),
    event: {
      id: 'ev-003', type: 'crowd_threshold_exceeded', occurredAt: minutesAgo(12),
      uav: { id: 'u-05', code: 'UAV-05' }, mission: { id: 'm-03', code: 'M-2026-0417', title: 'Poovar Estuary Watch' },
      location: { lat: 8.403, lon: 76.993, method: 'DRONE_POSITION' },
      zone: { code: 'Z-03', name: 'Kovalam Beach North', version: 1, profile: 'Beach Monitoring' },
      attention: 'MONITOR', modality: 'RGB',
      rationale: {
        factors: [
          { factorName: 'Person count', value: 42, threshold: 40, unit: 'persons', contribution: 'PRIMARY' },
          { factorName: 'Zone type', value: 'BEACH', contribution: 'CONTEXTUAL' },
          { factorName: 'Time window', value: 'Weekend evening', contribution: 'CONTEXTUAL' },
        ],
        zoneProfileUsed: 'Beach Monitoring',
      },
      versions: { appVersion: '1.0.3', rgbDetectorVersion: 'rgb-det-v1.4.2', trackerVersion: 'bytetrack-v0.9' },
    },
    evidence: makeEvidence('a003'),
    auditTrail: [],
  },
  // Alert 4 - HIGH convergence
  {
    id: 'a-004', alertCode: 'ALC-2026-004',
    severity: 'HIGH', status: 'ASSIGNED',
    createdAt: minutesAgo(18), updatedAt: minutesAgo(10),
    assignedTo: 'u-sup1', assignedToName: 'SI Menon',
    event: {
      id: 'ev-004', type: 'convergence', occurredAt: minutesAgo(18),
      uav: { id: 'u-03', code: 'UAV-03' }, mission: { id: 'm-01', code: 'M-2026-0415' },
      location: { lat: 8.382, lon: 76.983, method: 'DRONE_POSITION' },
      zone: { code: 'Z-02', name: 'Vizhinjam Outer Harbour', version: 2, profile: 'Harbour Patrol' },
      contact: { code: 'C-1038', class: 'VESSEL', classConf: 0.79, continuityConf: 0.86 },
      relatedContacts: [{ code: 'C-1042', class: 'SMALL_CRAFT', relationshipType: 'convergence' }],
      attention: 'ATTENTION', modality: 'RGB',
      rationale: {
        factors: [
          { factorName: 'Convergence rate', value: '4.2 kn', threshold: '2 kn', unit: 'approach speed', contribution: 'PRIMARY' },
          { factorName: 'Involved contacts', value: 2, contribution: 'SUPPORTING' },
          { factorName: 'Zone sensitivity', value: 'HIGH', contribution: 'CONTEXTUAL' },
        ],
        zoneProfileUsed: 'Harbour Patrol',
      },
      versions: { appVersion: '1.0.3', rgbDetectorVersion: 'rgb-det-v1.4.2', trackerVersion: 'bytetrack-v0.9' },
    },
    evidence: makeEvidence('a004'),
    auditTrail: [
      { id: 'au-002', timestamp: minutesAgo(10), userId: 'u-op2', userName: 'Operator Priya', userRole: 'OPERATOR', action: 'ASSIGNED', targetType: 'ALERT', targetId: 'a-004', detail: { assignedTo: 'SI Menon' }, ipAddress: '10.10.1.6' },
    ],
  },
  // Alert 5 - MEDIUM loitering
  {
    id: 'a-005', alertCode: 'ALC-2026-005',
    severity: 'MEDIUM', status: 'UNDER_REVIEW',
    createdAt: minutesAgo(25), updatedAt: minutesAgo(15),
    event: {
      id: 'ev-005', type: 'loitering', occurredAt: minutesAgo(25), endedAt: minutesAgo(18),
      uav: { id: 'u-04', code: 'UAV-04' }, mission: { id: 'm-05', code: 'M-2026-0418' },
      location: { lat: 8.390, lon: 76.992, method: 'DRONE_POSITION' },
      zone: { code: 'Z-04', name: 'Lighthouse Beach – Tourism Zone', version: 2, profile: 'Tourism – Evening' },
      contact: { code: 'C-1055', class: 'VESSEL', classConf: 0.83, continuityConf: 0.79 },
      attention: 'MONITOR', modality: 'RGB',
      rationale: {
        factors: [
          { factorName: 'Dwell duration', value: 420, threshold: 300, unit: 'seconds', contribution: 'PRIMARY' },
          { factorName: 'Zone profile', value: 'Tourism – Evening (HIGH sensitivity)', contribution: 'CONTEXTUAL' },
        ],
        zoneProfileUsed: 'Tourism – Evening',
      },
      versions: { appVersion: '1.0.3', rgbDetectorVersion: 'rgb-det-v1.4.2', trackerVersion: 'bytetrack-v0.9' },
    },
    evidence: makeEvidence('a005'),
    auditTrail: [],
  },
  // Alerts 6-20 (varied)
  ...Array.from({ length: 15 }, (_, i) => {
    const sev = SEV_ORDER[(i + 2) % SEV_ORDER.length];
    const evDefs = EVENT_TYPES_BY_SEV[sev];
    const evDef = evDefs[i % evDefs.length];
    const idx = i + 6;
    return {
      id: `a-${String(idx).padStart(3, '0')}`,
      alertCode: `ALC-2026-${String(idx).padStart(3, '0')}`,
      severity: sev,
      status: (['NEW', 'ACKNOWLEDGED', 'NEW', 'RESOLVED', 'ASSIGNED'] as Alert['status'][])[i % 5],
      createdAt: minutesAgo(30 + i * 8),
      updatedAt: minutesAgo(30 + i * 8),
      event: {
        id: `ev-${String(idx).padStart(3, '0')}`,
        type: evDef.type,
        occurredAt: minutesAgo(30 + i * 8),
        uav: { id: `u-0${(i % 6) + 1}`, code: `UAV-0${(i % 6) + 1}` },
        mission: { id: 'm-01', code: 'M-2026-0415' },
        location: { lat: 8.380 + (i * 0.005), lon: 76.982 + (i * 0.003), method: 'DRONE_POSITION' as const },
        zone: evDef.zone ? { code: evDef.zone, name: evDef.zoneName!, version: 1, profile: 'Beach Monitoring' } : undefined,
        contact: { code: `C-${1030 + i}`, class: CONTACT_CLASSES[i % CONTACT_CLASSES.length], classConf: 0.7 + Math.random() * 0.28, continuityConf: 0.65 + Math.random() * 0.32 },
        attention: (['MONITOR', 'ATTENTION', 'RECORD_ONLY', 'CRITICAL', 'MONITOR'] as AttentionLevel[])[i % 5],
        rationale: { factors: [{ factorName: 'Threshold exceeded', value: 1, threshold: 1, contribution: 'PRIMARY' as const }] },
        versions: { appVersion: '1.0.3' },
        modality: (i % 2 === 0 ? 'RGB' : 'THERMAL') as 'RGB' | 'THERMAL',
      } as CoastalEvent,
      evidence: makeEvidence(`a${String(idx).padStart(3, '0')}`),
      auditTrail: [],
    } as Alert;
  }),
];

// ─── Historical events (200 events) ──────────────────────────

export const HISTORICAL_EVENTS: CoastalEvent[] = Array.from({ length: 200 }, (_, i) => {
  const hoursAgo = Math.floor(i / 5) + 1;
  const sev = SEV_ORDER[i % SEV_ORDER.length];
  const evDefs = EVENT_TYPES_BY_SEV[sev];
  const evDef = evDefs[i % evDefs.length];
  return {
    id: `hev-${String(i + 1).padStart(4, '0')}`,
    type: evDef.type,
    occurredAt: new Date(Date.now() - hoursAgo * 3_600_000 - (i % 60) * 60_000).toISOString(),
    uav: { id: `u-0${(i % 6) + 1}`, code: `UAV-0${(i % 6) + 1}` },
    mission: { id: 'm-01', code: ['M-2026-0415', 'M-2026-0416', 'M-2026-0417', 'M-2026-0414'][i % 4] },
    location: { lat: 8.350 + (i % 20) * 0.004, lon: 76.960 + (i % 20) * 0.003, method: 'DRONE_POSITION' },
    zone: evDef.zone ? { code: evDef.zone, name: evDef.zoneName!, version: 1, profile: 'Monitor' } : undefined,
    contact: { code: `C-${1030 + (i % 40)}`, class: CONTACT_CLASSES[i % CONTACT_CLASSES.length], classConf: 0.7 + (i % 10) * 0.025, continuityConf: 0.65 + (i % 10) * 0.03 },
    attention: (['RECORD_ONLY', 'MONITOR', 'ATTENTION', 'CRITICAL', 'RECORD_ONLY'] as AttentionLevel[])[i % 5],
    rationale: { factors: [] },
    versions: { appVersion: '1.0.3' },
    modality: (i % 3 === 2 ? 'THERMAL' : 'RGB') as Modality,
  };
});

// ─── System Health ─────────────────────────────────────────────

const EDGE_NODES: EdgeNode[] = [
  { id: 'en-01', name: 'Central-GPU-A', kind: 'CENTRAL_GPU', isOnline: true, lastSeenAt: new Date().toISOString(), queuedEvents: 0, modelVersion: 'rgb-det-v1.4.2', configVersion: '2.3.1', gpuInfo: 'NVIDIA A100 40GB' },
  { id: 'en-02', name: 'Edge-Laptop-Vizhinjam', kind: 'EDGE_LAPTOP', isOnline: true, lastSeenAt: minutesAgo(0.5), lastSyncAt: minutesAgo(2.1), syncLagSec: 127, queuedEvents: 37, modelVersion: 'rgb-det-v1.4.2', configVersion: '2.3.0', ipAddress: '192.168.10.45' },
  { id: 'en-03', name: 'Edge-Laptop-Poovar', kind: 'EDGE_LAPTOP', isOnline: true, lastSeenAt: minutesAgo(1), lastSyncAt: minutesAgo(8), syncLagSec: 480, queuedEvents: 12, modelVersion: 'rgb-det-v1.4.1', configVersion: '2.3.0', ipAddress: '192.168.11.23' },
];

const SERVICE_STATUSES: ServiceStatus[] = [
  { name: 'API Gateway', status: 'OK', lastCheckedAt: new Date().toISOString() },
  { name: 'Inference Scheduler', status: 'OK', lastCheckedAt: new Date().toISOString() },
  { name: 'Alert Service', status: 'OK', lastCheckedAt: new Date().toISOString() },
  { name: 'Evidence Service', status: 'OK', lastCheckedAt: new Date().toISOString() },
  { name: 'GIS Service', status: 'OK', lastCheckedAt: new Date().toISOString() },
  { name: 'Edge Sync Service', status: 'DEGRADED', lastCheckedAt: new Date().toISOString(), detail: 'Vizhinjam node sync lag >2 min' },
  { name: 'Database (PostgreSQL)', status: 'OK', lastCheckedAt: new Date().toISOString() },
  { name: 'Object Storage (S3)', status: 'OK', lastCheckedAt: new Date().toISOString() },
  { name: 'Redis Cache', status: 'OK', lastCheckedAt: new Date().toISOString() },
  { name: 'Media Server', status: 'OK', lastCheckedAt: new Date().toISOString() },
];

export const INITIAL_HEALTH: SystemHealth = {
  feeds: INITIAL_FEEDS.slice(0, 12).map(f => ({
    feedId: f.id, uavCode: f.uavCode, modality: f.modality, state: f.state,
    fpsCurrent: f.fpsCurrent ?? 0, fpsTarget: f.fpsTarget ?? 25,
    latencyMs: f.latencyMs ?? 0, bitrateMbps: f.bitrateMbps ?? 0,
    droppedFrames: f.droppedFrames ?? 0,
    lastFrameAgeMs: f.state === 'NO_SIGNAL' ? 300_000 : f.state === 'EDGE_SYNC_LAG' ? 120_000 : 200,
    lastTelemetryAgeMs: f.state === 'NO_SIGNAL' ? 300_000 : 800,
  })),
  gpuUsagePct: 71,
  vramUsagePct: 58,
  cpuUsagePct: 34,
  storageUsagePct: 62,
  storageUsedTB: 18.6,
  storageTotalTB: 30,
  dbStatus: 'OK',
  queueDepths: { inference: 4, alert_eval: 1, evidence: 0, sync_upload: 37 },
  edgeNodes: EDGE_NODES,
  serviceStatuses: SERVICE_STATUSES,
  updatedAt: new Date().toISOString(),
};

// ─── Drone path data ──────────────────────────────────────────

export const DRONE_PATHS: Record<string, Array<[number, number]>> = {
  'f-01': [
    [76.975, 8.374], [76.978, 8.378], [76.981, 8.381], [76.984, 8.383], [76.982, 8.380],
  ],
  'f-03': [
    [76.988, 8.396], [76.990, 8.399], [76.992, 8.401], [76.993, 8.398], [76.991, 8.400],
  ],
  'f-05': [
    [76.960, 8.315], [76.963, 8.318], [76.966, 8.321], [76.965, 8.320], [76.963, 8.316],
  ],
  'f-07': [
    [76.914, 8.480], [76.918, 8.482], [76.921, 8.483], [76.920, 8.481], [76.917, 8.484],
  ],
  'f-09': [
    [76.888, 8.479], [76.892, 8.481], [76.893, 8.483], [76.890, 8.484], [76.887, 8.482],
  ],
};

// ============================================================
// SmartQEye Coastal — Shared Types
// Mirror these in the FastAPI backend schemas.
// ============================================================

import type { Geometry } from 'geojson';

// ─── Enums ──────────────────────────────────────────────────

export type Severity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AttentionLevel = 'RECORD_ONLY' | 'MONITOR' | 'ATTENTION' | 'CRITICAL';
export type AlertStatus = 'NEW' | 'ACKNOWLEDGED' | 'ASSIGNED' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED' | 'FALSE_ALERT' | 'CLOSED';
export type FeedState = 'LIVE' | 'BUFFERING' | 'NO_SIGNAL' | 'RECORDED' | 'EDGE_SYNC_LAG';
export type ContactClass =
  | 'VESSEL'
  | 'SMALL_CRAFT'
  | 'FISHING_BOAT'
  | 'UNKNOWN_VESSEL'
  | 'MECHANISED_TRAWLER'
  | 'MOTORISED_COUNTRY_CRAFT'
  | 'TRADITIONAL_WOODEN_CRAFT'
  | 'CANOE_CATAMARAN'
  | 'RECREATIONAL_CRAFT'
  | 'PERSON'
  | 'VEHICLE'
  | 'UNKNOWN';
export type Modality = 'RGB' | 'THERMAL';
export type ZoneType = 'RESTRICTED' | 'MONITORED' | 'FISHING' | 'TOURISM' | 'HARBOUR' | 'BEACH' | 'ESTUARY' | 'OPEN_SEA';
export type MissionStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'ABORTED';
export type ProcessingMode = 'CENTRAL_GPU' | 'LOCAL_EDGE' | 'COOP_EDGE' | 'UAV_ONBOARD' | 'POST_MISSION';
export type UserRole = 'OPERATOR' | 'ANALYST' | 'SUPERVISOR' | 'ZONE_ADMIN' | 'SYS_ADMIN' | 'MODEL_CUSTODIAN' | 'AUDITOR';

export type EventType =
  | 'person_detected' | 'vehicle_detected' | 'vessel_detected'
  | 'zone_entry' | 'zone_exit' | 'zone_dwell_exceeded' | 'intrusion'
  | 'crowd_threshold_exceeded'
  | 'abandoned_object' | 'stationary_object'
  | 'loitering' | 'prolonged_presence' | 'repeated_shoreline_approach'
  | 'recurring_zone_entry' | 'course_speed_change' | 'unusual_stationary' | 'approach_departure_cycle'
  | 'convergence' | 'prolonged_proximity' | 'co_travel' | 'separation_reappearance'
  | 'video_loss' | 'telemetry_loss' | 'stream_degraded' | 'node_offline' | 'model_deployed';

// ─── Location ───────────────────────────────────────────────

export interface Location {
  lat: number;
  lon: number;
  method: 'DRONE_POSITION' | 'GIMBAL_PROJECTED' | 'MANUAL';
  altitudeM?: number;
  accuracyM?: number;
}

// ─── Zone ───────────────────────────────────────────────────

export interface ZoneProfile {
  id: string;
  name: string;
  zoneType: ZoneType;
  sensitivityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  dwellThresholdSec: number;
  schedule: 'ALWAYS' | 'DAYTIME' | 'NIGHTTIME' | 'CUSTOM';
  defaultSeverity: Severity;
  notifyList: string[];
  description?: string;
}

export interface Zone {
  id: string;
  code: string;
  name: string;
  type: ZoneType;
  geometry: Geometry;
  profileId: string;
  profile?: ZoneProfile;
  version: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

// ─── UAV / Mission ──────────────────────────────────────────

export interface Uav {
  id: string;
  droneCode: string;
  makeModel: string;
  serialNo: string;
  adapterType: string;
  hasOnboardCompute: boolean;
  isActive: boolean;
}

export interface Mission {
  id: string;
  missionCode: string;
  title: string;
  profile: string;
  uavId: string;
  uavCode: string;
  status: MissionStatus;
  processingMode: ProcessingMode;
  startedAt?: string;
  endedAt?: string;
  plannedStart?: string;
  area?: string;
}

// ─── Telemetry ──────────────────────────────────────────────

export interface TelemetrySample {
  feedId: string;
  uavCode: string;
  missionCode: string;
  timestamp: string;
  lat: number;
  lon: number;
  altitudeM: number;
  headingDeg: number;
  groundSpeedMs: number;
  batteryPct: number;
  flightStatus: 'TAKEOFF' | 'AUTO' | 'LOITER' | 'RTL' | 'LAND' | 'MANUAL' | 'UNKNOWN';
  gimbalPitchDeg?: number;
  gimbalYawDeg?: number;
  signalStrengthPct?: number;
  satelliteCount?: number;
  telemetryAvailable: boolean;
}

// ─── Feed ───────────────────────────────────────────────────

export interface Feed {
  id: string;
  uavCode: string;
  missionCode: string;
  label: string;
  modality: Modality;
  state: FeedState;
  latencyMs?: number;
  fpsCurrent?: number;
  fpsTarget?: number;
  bitrateMbps?: number;
  droppedFrames?: number;
  lastFrameAt?: string;
  resolution?: string;
  streamUrl?: string;
  thumbnailUrl?: string;
  telemetry?: TelemetrySample;
  isPinned?: boolean;
  edgeSyncLagSec?: number;
}

// ─── Contact ─────────────────────────────────────────────────

export interface ContactObservation {
  id: string;
  contactId: string;
  timestamp: string;
  location: Location;
  modality: Modality;
  classLabel: ContactClass;
  classConf: number;
  continuityConf: number;
  bbox?: [number, number, number, number];
  headingDeg?: number;
  speedKnots?: number;
  feedId?: string;
}

export interface ContactRelationship {
  relatedContactId: string;
  relatedContactCode: string;
  type: 'convergence' | 'prolonged_proximity' | 'co_travel' | 'co_appearance';
  count: number;
  lastSeenAt: string;
}

export interface Contact {
  id: string;
  code: string;
  class: ContactClass;
  classLabel: string;
  classConf: number;
  continuityConf: number;
  isBroadClass?: boolean;
  broadClassReason?: string;
  fineGrainedType?: string;
  classificationConf?: number;
  firstSeenAt: string;
  lastSeenAt: string;
  lastLocation?: Location;
  lastHeadingDeg?: number;
  lastSpeedKnots?: number;
  observations?: ContactObservation[];
  relationships?: ContactRelationship[];
  zoneInteractions?: ZoneInteraction[];
  linkedAlertIds?: string[];
  notes?: string;
}

export interface ZoneInteraction {
  zoneCode: string;
  zoneName: string;
  type: 'entry' | 'exit' | 'dwell';
  occurredAt: string;
  durationSec?: number;
}

// ─── Evidence ───────────────────────────────────────────────

export type EvidenceKind = 'CLIP' | 'KEYFRAME' | 'THUMBNAIL' | 'SIDECAR_JSON' | 'TELEMETRY_EXPORT';

export interface EvidenceItem {
  id: string;
  kind: EvidenceKind;
  url: string;
  sha256: string;
  sizeBytes: number;
  contentType: string;
  modality?: Modality;
  capturedAt?: string;
  description?: string;
}

// ─── Event ──────────────────────────────────────────────────

export interface RationaleFactor {
  factorName: string;
  value: number | string;
  threshold?: number | string;
  unit?: string;
  contribution: 'PRIMARY' | 'SUPPORTING' | 'CONTEXTUAL';
}

export interface EventRationale {
  factors: RationaleFactor[];
  note?: string;
  zoneProfileUsed?: string;
  contextCondition?: string;
}

export interface EventVersions {
  rgbDetectorVersion?: string;
  thermalDetectorVersion?: string;
  trackerVersion?: string;
  contactEngineVersion?: string;
  behaviourEngineVersion?: string;
  appVersion: string;
}

export interface CoastalEvent {
  id: string;
  type: EventType;
  occurredAt: string;
  endedAt?: string;
  uav: { id: string; code: string };
  mission: { id: string; code: string; title?: string };
  location: Location;
  zone?: { code: string; name: string; version: number; profile: string };
  contact?: {
    code: string;
    class: ContactClass;
    classConf: number;
    continuityConf: number;
  };
  relatedContacts?: Array<{ code: string; class: ContactClass; relationshipType: string }>;
  attention: AttentionLevel;
  rationale: EventRationale;
  versions: EventVersions;
  modality?: Modality;
}

// ─── Audit ──────────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  detail?: Record<string, unknown>;
  ipAddress?: string;
}

// ─── Alert ──────────────────────────────────────────────────

export interface Alert {
  id: string;
  alertCode: string;
  severity: Severity;
  status: AlertStatus;
  event: CoastalEvent;
  evidence: EvidenceItem[];
  incidentId?: string;
  assignedTo?: string;
  assignedToName?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  notes?: string;
  auditTrail: AuditEntry[];
  isFalseAlert?: boolean;
  falseAlertReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── System Health ──────────────────────────────────────────

export interface EdgeNode {
  id: string;
  name: string;
  kind: 'CENTRAL_GPU' | 'EDGE_LAPTOP' | 'COOP_WORKER';
  isOnline: boolean;
  lastSeenAt: string;
  lastSyncAt?: string;
  syncLagSec?: number;
  queuedEvents: number;
  modelVersion?: string;
  configVersion?: string;
  gpuInfo?: string;
  ipAddress?: string;
}

export interface SystemHealth {
  feeds: FeedHealth[];
  gpuUsagePct: number;
  vramUsagePct: number;
  cpuUsagePct: number;
  storageUsagePct: number;
  storageUsedTB: number;
  storageTotalTB: number;
  dbStatus: 'OK' | 'DEGRADED' | 'DOWN';
  queueDepths: Record<string, number>;
  edgeNodes: EdgeNode[];
  serviceStatuses: ServiceStatus[];
  updatedAt: string;
}

export interface FeedHealth {
  feedId: string;
  uavCode: string;
  modality: Modality;
  state: FeedState;
  fpsCurrent: number;
  fpsTarget: number;
  latencyMs: number;
  bitrateMbps: number;
  droppedFrames: number;
  lastFrameAgeMs: number;
  lastTelemetryAgeMs: number;
}

export interface ServiceStatus {
  name: string;
  status: 'OK' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';
  lastCheckedAt: string;
  detail?: string;
}

// ─── Map / GIS ──────────────────────────────────────────────

export interface DroneMapMarker {
  feedId: string;
  uavCode: string;
  lat: number;
  lon: number;
  headingDeg: number;
  altitudeM: number;
  state: FeedState;
  trail: Array<[number, number]>;
  missionCode: string;
}

export interface ContactMapMarker {
  contactId: string;
  contactCode: string;
  class: ContactClass;
  lat: number;
  lon: number;
  headingDeg?: number;
  lastSeenAt: string;
  severity?: Severity;
}

export interface AlertMapPin {
  alertId: string;
  alertCode: string;
  severity: Severity;
  lat: number;
  lon: number;
  eventType: EventType;
  occurredAt: string;
  status: AlertStatus;
}

// ─── User / Auth ────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  fullName: string;
  rankTitle?: string;
  role: UserRole;
  unitName?: string;
  email?: string;
  avatarUrl?: string;
}

// ─── i18n ───────────────────────────────────────────────────

export type TranslationKey = string;

// ─── Missions Sorties (Costal Police docx) ──────────────────

export type Squadron = 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA';
export type VideoSourceType = 'RTMP' | 'RTSP' | 'UPLOAD';

export interface MissionSortie {
  id: string;
  missionId: string; // MSN-YYYYMMDD-HHMM-SS-SQUADRON
  name: string;
  droneId: string;
  droneCode: string;
  squadron: Squadron;
  videoSourceType: VideoSourceType;
  videoSourceUrl?: string;
  srtFileName?: string;
  pilotName: string;
  location: string;
  status: 'ACTIVE' | 'STANDBY' | 'COMPLETED' | 'STOPPED';
  serverIngestion: boolean;
  cognitiveBypass: boolean;
  bitrateMbps?: number;
  fps?: number;
  packetLossPct?: number;
  startedAt?: string;
  endedAt?: string;
  durationMin?: number;
}

// ─── Crowd Analytics (Costal Police docx) ───────────────────

export interface CrowdZoneDensity {
  id: string;
  name: string;
  areaM2: number;
  count: number;
  densityPpm2: number;
  status: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface CrowdAnalyticsSample {
  droneId: string;
  droneCode: string;
  timestamp: string;
  currentCount: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  trendDeltaPct: number;
  peakCount: number;
  peakTimestamp: string;
  activeAlerts: number;
  densityStatus: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  densityPpm2: number;
  activeModel: 'CSRNet-A' | 'CSRNet-B' | 'DM-Count' | 'RTMDet-Crowd';
  zones: CrowdZoneDensity[];
  trendHistory: Array<{ time: string; count: number; threshold: number }>;
}

// ─── Vehicle & ANPR (Costal Police docx) ────────────────────

export interface VehicleAnprRecord {
  id: string;
  plate: string;
  vehicleType: 'CAR' | 'BIKE' | 'TRUCK' | 'BUS' | 'AUTO_RICKSHAW';
  confidence: number;
  speedKmh: number;
  isWatchlistMatch: boolean;
  watchlistReason?: string;
  thumbnailUrl: string;
  timestamp: string;
  droneCode: string;
  locationName: string;
}

// ─── Maritime Vessel Tracking (Costal Police docx) ──────────

export interface MaritimeTrackRecord {
  id: string;
  vesselCode: string;
  vesselClass: 'FISHING_TRAWLER' | 'SPEEDBOAT' | 'CARGO_VESSEL' | 'DHOW' | 'COUNTRY_CRAFT';
  speedKnots: number;
  headingDeg: number;
  motionState: 'CRUISING' | 'ANCHORED' | 'DRIFTING';
  proximityWarning: boolean;
  closestSeparationPx?: number;
  lastSeenAt: string;
  lat: number;
  lon: number;
  trajectory: Array<[number, number]>;
}

// ─── Person Re-ID (Costal Police docx) ──────────────────────

export interface PersonReidRecord {
  id: string;
  trackId: string;
  confidence: number;
  isWatchlistMatch: boolean;
  watchlistIdentity?: string;
  watchlistNotes?: string;
  faceCropUrl: string;
  firstSeenAt: string;
  lastSeenAt: string;
  cameraHops: Array<{ droneCode: string; time: string; location: string }>;
  appearanceFeatures: { upperColor: string; lowerColor: string; bag: boolean; helmet: boolean };
}

// ─── Intrusion Detection (Costal Police docx) ───────────────

export interface IntrusionRecord {
  id: string;
  zoneId: string;
  zoneName: string;
  breachType: 'PERSON' | 'VEHICLE' | 'VESSEL';
  targetCode: string;
  severity: Severity;
  dwellTimeSec: number;
  timestamp: string;
  snapshotUrl: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'RESOLVED';
}

// ─── Anomaly Monitor (Costal Police docx) ───────────────────

export type AnomalyType =
  | 'LOITERING'
  | 'FLEEING'
  | 'SUDDEN_FALL'
  | 'OBJECT_OF_INTEREST_MANUAL_REVIEW'
  | 'WRONG_WAY_DRIVING'
  | 'ABRUPT_STOP'
  | 'ERRATIC_SPEEDING';

export interface AnomalyRecord {
  id: string;
  category: 'PERSON' | 'TRAFFIC' | 'MARINE';
  anomalyType: AnomalyType;
  riskScore: number; // 0-100
  droneCode: string;
  timestamp: string;
  clipReplaySec: number;
  description: string;
  status: 'NEW' | 'REVIEWED' | 'ESCALATED' | 'FALSE_POSITIVE';
}

// ─── AI Models Management (Costal Police docx) ──────────────

export interface AiModelItem {
  id: string;
  name: string;
  version: string;
  licence: string;
  task: string;
  taskLabel?: string;
  modality: 'RGB' | 'THERMAL' | 'BOTH';
  framework: string;
  vramMb: number;
  status: 'ACTIVE' | 'STANDBY' | 'CANDIDATE' | 'STOPPED' | 'ERROR';
  state: 'ACTIVE' | 'STARTING' | 'STOPPED' | 'ERROR';
  assignedDroneCodes: string[];
  fpsAverage: number;
  latencyMs: number;
  isOptionalModule?: boolean;
}

// ─── Police Reports (Costal Police docx) ────────────────────

export type PoliceReportType =
  | 'DAILY_INCIDENT_SUMMARY'
  | 'WEEKLY_SLA_AUDIT'
  | 'DRONE_UTILISATION_30DAY'
  | 'MISSION_AAR';

export interface PoliceReport {
  id: string;
  reportType: PoliceReportType;
  title: string;
  periodCovered: string;
  generatedAt: string;
  generatedBy: string;
  signOffOfficer: string;
  fileSizeMb: number;
  downloadUrl: string;
}

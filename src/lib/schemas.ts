// ============================================================
// SmartQEye Coastal — Zod API Validation Schemas (Phase 8)
// Runtime verification of all API payloads matching openapi.yaml
// ============================================================

import { z } from 'zod';

// ─── Common Types ─────────────────────────────────────────────

export const ModalitySchema = z.enum(['RGB', 'THERMAL']);

export const SeveritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']);

export const AttentionLevelSchema = z.enum([
  'ROUTINE', 'ATTENTION', 'ELEVATED', 'CRITICAL',
  'RECORD_ONLY', 'MONITOR', 'ESCALATE', 'RESTRICTED_ACCESS'
]);

export const ZoneTypeSchema = z.enum([
  'RESTRICTED', 'MONITORED', 'FISHING', 'TOURISM',
  'HARBOUR', 'BEACH', 'ESTUARY', 'OPEN_SEA'
]);

export const UserRoleSchema = z.enum([
  'OPERATOR', 'ANALYST', 'SUPERVISOR', 'ZONE_ADMIN',
  'SYS_ADMIN', 'MODEL_CUSTODIAN', 'AUDITOR'
]);

// ─── Location ─────────────────────────────────────────────────

export const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  method: z.enum(['DRONE_POSITION', 'GIMBAL_PROJECTED', 'MANUAL']),
  altitudeM: z.number().optional(),
  accuracyM: z.number().optional(),
});

// ─── Telemetry ────────────────────────────────────────────────

export const TelemetrySampleSchema = z.object({
  feedId: z.string(),
  uavCode: z.string(),
  missionCode: z.string(),
  timestamp: z.string(),
  lat: z.number(),
  lon: z.number(),
  altitudeM: z.number(),
  headingDeg: z.number(),
  groundSpeedMs: z.number(),
  batteryPct: z.number().min(0).max(100),
  flightStatus: z.enum(['TAKEOFF', 'AUTO', 'LOITER', 'RTL', 'LAND', 'MANUAL', 'UNKNOWN']),
  gimbalPitchDeg: z.number().optional(),
  gimbalYawDeg: z.number().optional(),
  signalStrengthPct: z.number().optional(),
  satelliteCount: z.number().optional(),
  telemetryAvailable: z.boolean(),
});

// ─── Auth & User ──────────────────────────────────────────────

export const LoginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  mfaCode: z.string().optional(),
});

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullName: z.string(),
  role: UserRoleSchema,
  station: z.string(),
  badgeNumber: z.string().optional(),
  rankTitle: z.string().optional(),
  createdAt: z.string().optional(),
});

// ─── Coastal Event & Alerts ───────────────────────────────────

export const CoastalEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  occurredAt: z.string(),
  endedAt: z.string().optional(),
  uav: z.object({ id: z.string(), code: z.string() }),
  mission: z.object({ id: z.string(), code: z.string(), title: z.string().optional() }),
  location: LocationSchema,
  zone: z.object({
    code: z.string(),
    name: z.string(),
    version: z.number(),
    profile: z.string(),
  }).optional(),
  contact: z.object({
    code: z.string(),
    class: z.string(),
    classConf: z.number(),
    continuityConf: z.number(),
  }).optional(),
  attention: AttentionLevelSchema,
  rationale: z.object({
    factors: z.array(z.any()),
    note: z.string().optional(),
  }),
  versions: z.object({
    appVersion: z.string(),
  }).passthrough(),
  modality: ModalitySchema.optional(),
});

export const AlertSchema = z.object({
  id: z.string(),
  alertCode: z.string(),
  severity: SeveritySchema,
  status: z.enum(['NEW', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED']),
  event: CoastalEventSchema,
  evidence: z.array(z.any()),
  notes: z.string().optional(),
  createdAt: z.string(),
  acknowledgedAt: z.string().optional(),
  acknowledgedBy: z.string().optional(),
});

// ─── Persistent Coastal Contacts ──────────────────────────────

export const ContactSchema = z.object({
  id: z.string(),
  code: z.string(),
  class: z.string(),
  classLabel: z.string(),
  classConf: z.number(),
  continuityConf: z.number(),
  attentionLevel: AttentionLevelSchema.optional(),
  firstSeenAt: z.string(),
  lastSeenAt: z.string(),
  dwellTotalSec: z.number().optional(),
  evidenceCount: z.number().optional(),
  modalitySeen: z.enum(['RGB', 'THERMAL', 'BOTH']).optional(),
  observedUavs: z.array(z.string()).optional(),
  lastLocation: LocationSchema.optional(),
  lastHeadingDeg: z.number().optional(),
  lastSpeedKnots: z.number().optional(),
  isBroadClass: z.boolean().optional(),
  broadClassReason: z.string().optional(),
  fineGrainedType: z.string().optional(),
}).passthrough();

// ─── Zones ───────────────────────────────────────────────────

export const ZoneSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  type: ZoneTypeSchema,
  geometry: z.any(),
  profileId: z.string(),
  version: z.number(),
  color: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).passthrough();

// ─── Incidents (ELIR) ─────────────────────────────────────────

export const IncidentRecordSchema = z.object({
  id: z.string(),
  incidentCode: z.string(),
  alertId: z.string(),
  title: z.string(),
  category: z.string(),
  station: z.string(),
  assignedOfficer: z.string(),
  badge: z.string(),
  openedAt: z.string(),
  status: z.enum(['NEW', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'ESCALATED', 'RESOLVED', 'FALSE_POSITIVE']),
  severity: SeveritySchema,
  attention: AttentionLevelSchema,
  evidenceCount: z.number(),
  sha256DossierHash: z.string(),
  summary: z.string(),
  uavCode: z.string(),
  missionCode: z.string(),
  zoneCode: z.string(),
  zoneName: z.string(),
  coordinates: z.object({ lat: z.number(), lon: z.number() }),
}).passthrough();

// ─── Audit ───────────────────────────────────────────────────

export const AuditEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  userId: z.string(),
  userName: z.string(),
  userRole: UserRoleSchema,
  action: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  outcome: z.enum(['SUCCESS', 'FLAGGED', 'BLOCKED']).optional(),
  ipAddress: z.string().optional(),
  sessionId: z.string().optional(),
  detail: z.record(z.string(), z.unknown()).optional(),
  beforeAfterSummary: z.string().optional(),
  prevHash: z.string().optional(),
  hash: z.string().optional(),
});

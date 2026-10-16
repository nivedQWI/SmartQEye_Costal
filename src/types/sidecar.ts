// ============================================================
// SmartQEye Coastal — Sidecar Detections & Telemetry Types
// Appendix A & C Specification: frame-synchronised bounding boxes,
// tracking continuity, Cognitive Frame Selection (CFS), and DJI telemetry
// ============================================================

import type { ContactClass, Modality } from '@/types';

export interface BoundingBox {
  id: string;
  trackId: number | string;
  contactId?: string; // e.g. "C-1042"
  class: ContactClass;
  label: string;
  conf: number;
  // Normalised coordinates [x1, y1, x2, y2] relative to video dimensions (0.0 to 1.0)
  bbox: [number, number, number, number];
  headingDeg?: number;
  speedKnots?: number;
  modality?: Modality;
  trail?: Array<[number, number]>; // Historical motion trail [x, y] in normalised coords
  inZoneBreach?: boolean;
  zoneCode?: string;
  fineGrainedType?: string; // Kerala indigenous craft fine-grained label
}

export type CfsStatus = 'FULL' | 'LIGHT' | 'SKIP';

export type CfsReasonCode =
  | 'new_object'
  | 'significant_motion'
  | 'track_uncertainty'
  | 'zone_interaction'
  | 'scene_change'
  | 'periodic_refresh'
  | 'idle';

export const CFS_REASON_LABELS: Record<CfsReasonCode, string> = {
  new_object: 'New object acquired',
  significant_motion: 'Significant motion delta',
  track_uncertainty: 'Track uncertainty / boundary ambiguity',
  zone_interaction: 'Zone perimeter interaction',
  scene_change: 'Gimbal movement / scene change',
  periodic_refresh: 'Periodic full refresh check',
  idle: 'Quiescent open water (idle)',
};

export interface CfsState {
  status: CfsStatus;
  rateFps: number; // e.g. 25, 12, 6
  reasonCode: string; // e.g. "CFS-01: Attention contact in primary frame", "CFS-03: Quiescent open water", or Appendix C reason code
  vramSavingsPct: number;
}

export interface TelemetryPoint {
  timeSec: number;
  lat: number;
  lon: number;
  altM: number;
  speedMs: number;
  headingDeg: number;
  gimbalPitchDeg?: number;
  gimbalYawDeg?: number;
  batteryPct?: number;
  uavCode?: string;
  missionCode?: string;
  timestampIso?: string;
}

export interface ScenarioMilestone {
  timeSec: number;
  type: 'CONTACT_ACQUIRED' | 'ZONE_BREACH' | 'ALERT_RAISED' | 'CKFE_KEYFRAME' | 'THERMAL_SEGMENT' | 'FEED_LAG' | 'CONTACT_LOST';
  title: string;
  description: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  contactId?: string;
  alertCode?: string;
  keyframeUrl?: string;
  zoneCode?: string;
}

export interface FrameData {
  timeSec: number;
  frameIndex?: number;
  boxes: BoundingBox[];
  cfs: CfsState;
  telemetry?: TelemetryPoint;
}

export interface SidecarData {
  version: string;
  sceneName: string;
  durationSec: number;
  videoFps: number;
  videoWidth: number;
  videoHeight: number;
  uavCode: string;
  missionCode: string;
  detectorModel: string;
  trackerModel: string;
  frames: FrameData[];
  telemetryTrack: TelemetryPoint[];
  events: ScenarioMilestone[];
}

export interface PlayerOverlayConfig {
  showBoundingBoxes: boolean;
  showLabels: boolean;
  showTrackIds: boolean;
  showMotionTrails: boolean;
  showZonePolygons: boolean;
  showTelemetryHud: boolean;
  showCfsBadge: boolean;
  showTargetVectors: boolean;
  showConfidence: boolean;
}

export const DEFAULT_OVERLAY_CONFIG: PlayerOverlayConfig = {
  showBoundingBoxes: true,
  showLabels: true,
  showTrackIds: true,
  showMotionTrails: true,
  showZonePolygons: true,
  showTelemetryHud: true,
  showCfsBadge: true,
  showTargetVectors: true,
  showConfidence: true,
};

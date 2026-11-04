// ============================================================
// SmartQEye Coastal — Context Intelligence Types
// Corresponds to the Persistent Coastal Contact & Context Intelligence
// FastAPI backend (SmartQEye-Coastal-Context-MVP).
// NOTE: ZoneProfile / AttentionLevel are already declared in index.ts
// under the existing app domain. Types here use the prefix "Context"
// to avoid collisions.
// ============================================================

// ─── Zone Profile (Context Engine) ───────────────────────────

export type ContextZoneType = 'tourism' | 'fishing' | 'monitored' | 'restricted';

export interface ContextZoneProfile {
  name: string;
  location: string;
  type: ContextZoneType;
  normal_hours: [number, number];
  allowed_behaviours: string[];
  base_attention: number;
}

export type ContextZoneProfiles = Record<string, ContextZoneProfile>;

// ─── Attention Levels ─────────────────────────────────────────

export type ContextAttentionLevel = 'NORMAL' | 'MONITOR' | 'ATTENTION';
export type ContextRecommendedAction =
  | 'TRACK_AND_RETAIN'
  | 'CONTINUE_MONITORING'
  | 'OPERATOR_REVIEW_REQUIRED';

// ─── Context Evaluation Result ────────────────────────────────

export interface ContextResult {
  contact_id: string;
  zone_id: string;
  zone_name: string;
  location: string;
  hour: number;
  observed_behaviours: string[];
  attention_score: number;
  attention_level: ContextAttentionLevel;
  recommended_action: ContextRecommendedAction;
  context_summary: string;
  reasons: string[];
  interpretation_notice: string;
  sensor?: string;
  source?: string;
}

// ─── Request Bodies ───────────────────────────────────────────

export interface ContextEvaluationRequest {
  zone_id: string;
  hour: number;
  behaviours: string[];
  dwell_seconds?: number;
  nearby_contacts?: number;
  contact_id?: string;
}

export interface ContextTrackPoint {
  t: number;
  heading_deg: number;
  shoreline_distance_m: number;
  speed_kmh: number;
  nearby_contacts?: number;
}

export interface AutomatedTrackRequest {
  zone_id: string;
  hour: number;
  contact_id: string;
  points: ContextTrackPoint[];
}

export interface ObservationEvaluationRequest {
  zone_id: string;
  hour: number;
  contact_id: string;
  sensor: string;
  observations: string[];
}

// ─── Track Evaluation Result ──────────────────────────────────

export interface TrackDerivedFeatures {
  duration_seconds: number;
  heading_changes_deg: number[];
  significant_turns: number;
  shoreline_approach_episodes: number;
  max_speed_kmh: number;
  average_speed_kmh: number;
  nearby_contacts: number;
  dwell_seconds: number;
  derived_behaviours: string[];
}

export interface TrackEvaluationResult {
  source: 'AUTOMATED_TRACK_DERIVATION';
  contact_id: string;
  derived_features: TrackDerivedFeatures;
  context: ContextResult;
}

// ─── Scenario (UI) ───────────────────────────────────────────

export interface ScenarioEvent {
  at: number;
  code: string;
  label: string;
}

export interface CoastalScenario {
  title: string;
  video: string;
  contact: string;
  zone: string;
  hour: number;
  sensor: string;
  condition: string;
  events: ScenarioEvent[];
  doNotClaim: string[];
}

export type ScenarioKey = 'Day' | 'Cloudy' | 'Night' | 'Thermal';

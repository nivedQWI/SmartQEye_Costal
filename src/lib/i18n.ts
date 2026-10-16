// ============================================================
// SmartQEye Coastal — i18n layer
// English baseline; extend with Malayalam translations later.
// ============================================================

export const en = {
  // Navigation
  nav_command_center: 'Command Center',
  nav_live: 'Live Monitor',
  nav_alerts: 'Alerts',
  nav_contacts: 'Contacts',
  nav_missions: 'Missions',
  nav_map: 'Map / GIS',
  nav_history: 'History',
  nav_reports: 'Reports',
  nav_rules: 'Rules',
  nav_models: 'AI & Models',
  nav_health: 'System Health',
  nav_admin: 'Administration',

  // Auth
  auth_title: 'SmartQEye Coastal',
  auth_subtitle: 'Coastal Surveillance & Intelligence Platform',
  auth_username: 'Username',
  auth_password: 'Password',
  auth_mfa: 'Authenticator Code',
  auth_login: 'Sign In',
  auth_sso: 'Sign in with Police SSO',
  auth_banner: 'Authorised use only. All access is audited and logged.',

  // Severity
  sev_info: 'Info',
  sev_low: 'Low',
  sev_medium: 'Medium',
  sev_high: 'High',
  sev_critical: 'Critical',

  // Alert actions
  alert_ack: 'Acknowledge',
  alert_assign: 'Assign',
  alert_escalate: 'Escalate',
  alert_resolve: 'Resolve',
  alert_false_alert: 'Mark False Alert',
  alert_create_incident: 'Create Incident',
  alert_open: 'Open',

  // Feed states
  feed_live: 'Live',
  feed_buffering: 'Buffering',
  feed_no_signal: 'No Signal',
  feed_recorded: 'Recorded',
  feed_edge_sync: 'Edge Sync Lag',

  // Disclaimer
  disclaimer: 'Describes observed activity only. Interpretation rests with authorised personnel.',

  // Status bar
  status_feeds: 'Feeds',
  status_gpu: 'GPU',
  status_storage: 'Storage',
  status_edge: 'Edge',
  status_db: 'DB',

  // Common
  common_loading: 'Loading…',
  common_error: 'An error occurred',
  common_retry: 'Retry',
  common_close: 'Close',
  common_save: 'Save',
  common_cancel: 'Cancel',
  common_confirm: 'Confirm',
  common_export: 'Export',
  common_notes: 'Notes',
  common_reason: 'Reason',
  common_na: 'N/A',
  common_unknown: 'Unknown',

  // Telemetry
  tele_lat: 'Latitude',
  tele_lon: 'Longitude',
  tele_alt: 'Altitude',
  tele_heading: 'Heading',
  tele_speed: 'Ground Speed',
  tele_battery: 'Battery',
  tele_status: 'Flight Status',
  tele_unavailable: 'Telemetry unavailable',
  tele_awaiting_sync: 'Awaiting sync',

  // Evidence
  ev_sha256: 'SHA-256',
  ev_copy_hash: 'Copy hash',
  ev_copy_all: 'Copy all hashes',

  // Coming soon
  coming_soon_title: 'Coming in Next Phase',
  coming_soon_desc: 'This section is under development and will be available in Phase 2.',
} as const;

export type TranslationKey = keyof typeof en;

// Simple t() function — replace with i18next for full i18n
export function t(key: TranslationKey): string {
  return en[key];
}

// For dynamic keys
export function tDynamic(key: string): string {
  return (en as Record<string, string>)[key] ?? key;
}

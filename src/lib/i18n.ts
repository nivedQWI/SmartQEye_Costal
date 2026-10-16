// ============================================================
// SmartQEye Coastal — i18n layer
// English baseline + Malayalam (മലയാളം) language support
// ============================================================

export const en = {
  // Navigation
  nav_command_center: 'Command Center',
  nav_live: 'Live Monitor',
  nav_alerts: 'Alerts',
  nav_contacts: 'Contacts',
  nav_missions: 'Missions & Sorties',
  nav_map: 'Map / GIS',
  nav_history: 'History Playback',
  nav_reports: 'Police Reports',
  nav_rules: 'Rules',
  nav_models: 'AI & Models',
  nav_health: 'System Health',
  nav_admin: 'Administration',
  nav_crowd: 'Crowd Analytics',
  nav_vehicle: 'Vehicle & Maritime',
  nav_reid: 'Person Re-ID',
  nav_intrusion: 'Intrusion Geofence',
  nav_anomaly: 'Anomaly Monitor',

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
  disclaimer: 'Observed behaviour only. Operational interpretation and action rest with authorised Kerala Police personnel.',

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

export const ml: Record<TranslationKey, string> = {
  // Navigation
  nav_command_center: 'കമാൻഡ് സെന്റർ',
  nav_live: 'തത്സമയ നിരീക്ഷണം',
  nav_alerts: 'മുന്നറിയിപ്പുകൾ',
  nav_contacts: 'കോൺടാക്റ്റുകൾ',
  nav_missions: 'ദൗത്യങ്ങൾ & സോർട്ടി',
  nav_map: 'മാപ്പ് / ജി.ഐ.എസ്',
  nav_history: 'ചരിത്ര പ്ലേബാക്ക്',
  nav_reports: 'പോലീസ് റിപ്പോർട്ടുകൾ',
  nav_rules: 'നിയമങ്ങൾ',
  nav_models: 'എ.ഐ മോഡലുകൾ',
  nav_health: 'സിസ്റ്റം ആരോഗ്യം',
  nav_admin: 'അഡ്മിനിസ്ട്രേഷൻ',
  nav_crowd: 'ക്രൗഡ് അനലിറ്റിക്സ്',
  nav_vehicle: 'വാഹന & സമുദ്ര നിരീക്ഷണം',
  nav_reid: 'പേഴ്സൺ റീ-ഐഡി',
  nav_intrusion: 'ജിയോഫെൻസ് അതിക്രമം',
  nav_anomaly: 'അസാധാരണ പെരുമാറ്റ നിരീക്ഷണം',

  // Auth
  auth_title: 'സ്മാർട്ട് ക്യു ഐ കോസ്റ്റൽ',
  auth_subtitle: 'തീരദേശ ഡ്രോൺ നിരീക്ഷണ പ്ലാറ്റ്‌ഫോം',
  auth_username: 'ഉപയോക്തൃനാമം',
  auth_password: 'പാസ്‌വേഡ്',
  auth_mfa: 'ഓതന്റിക്കേറ്റർ കോഡ്',
  auth_login: 'ലോഗിൻ ചെയ്യുക',
  auth_sso: 'പോലീസ് എസ്.എസ്.ഒ വഴി ലോഗിൻ ചെയ്യുക',
  auth_banner: 'അംഗീകൃത ഉദ്യോഗസ്ഥർക്ക് മാത്രം പ്രവേശനം. എല്ലാ പ്രവർത്തനങ്ങളും രേഖപ്പെടുത്തുന്നു.',

  // Severity
  sev_info: 'വിവരം',
  sev_low: 'കുറഞ്ഞത്',
  sev_medium: 'ഇടത്തരം',
  sev_high: 'ഉയർന്നത്',
  sev_critical: 'ഗുരുതരമായത്',

  // Alert actions
  alert_ack: 'സ്ഥിരീകരിക്കുക',
  alert_assign: 'ചുമതലപ്പെടുത്തുക',
  alert_escalate: 'ഉയർത്തുക',
  alert_resolve: 'പരിഹരിക്കുക',
  alert_false_alert: 'തെറ്റായ മുന്നറിയിപ്പ്',
  alert_create_incident: 'കേസ് രേഖപ്പെടുത്തുക',
  alert_open: 'തുറക്കുക',

  // Feed states
  feed_live: 'തത്സമയം',
  feed_buffering: 'ബഫറിംഗ്',
  feed_no_signal: 'സിഗ്നൽ ലഭ്യമല്ല',
  feed_recorded: 'റെക്കോർഡ് ചെയ്തത്',
  feed_edge_sync: 'എഡ്ജ് സിങ്ക് ലാഗ്',

  // Disclaimer
  disclaimer: 'നിരീക്ഷിച്ച പെരുമാറ്റം മാത്രം. പ്രവർത്തനപരമായ തീരുമാനങ്ങൾ അധികാരപ്പെടുത്തിയ കേരള പോലീസിൽ നിക്ഷിപ്തമാണ്.',

  // Status bar
  status_feeds: 'ഫീഡുകൾ',
  status_gpu: 'ജിപിയു',
  status_storage: 'സംഭരണം',
  status_edge: 'എഡ്ജ്',
  status_db: 'ഡാറ്റാബേസ്',

  // Common
  common_loading: 'ലോഡ് ചെയ്യുന്നു…',
  common_error: 'ഒരു പിശക് സംഭവിച്ചു',
  common_retry: 'വീണ്ടും ശ്രമിക്കുക',
  common_close: 'അടയ്ക്കുക',
  common_save: 'സൂക്ഷിക്കുക',
  common_cancel: 'റദ്ദാക്കുക',
  common_confirm: 'സ്ഥിരീകരിക്കുക',
  common_export: 'എക്‌സ്‌പോർട്ട്',
  common_notes: 'കുറിപ്പുകൾ',
  common_reason: 'കാരണം',
  common_na: 'ലഭ്യമല്ല',
  common_unknown: 'അജ്ഞാതം',

  // Telemetry
  tele_lat: 'അക്ഷാംശം (Latitude)',
  tele_lon: 'രേഖാംശം (Longitude)',
  tele_alt: 'ഉയരം (Altitude)',
  tele_heading: 'ദിശ (Heading)',
  tele_speed: 'വേഗത (Ground Speed)',
  tele_battery: 'ബാറ്ററി (Battery)',
  tele_status: 'പറക്കൽ നില',
  tele_unavailable: 'ടെലിമെട്രി ലഭ്യമല്ല',
  tele_awaiting_sync: 'സിങ്കിനായി കാത്തിരിക്കുന്നു',

  // Evidence
  ev_sha256: 'എസ്.എച്ച്.എ-256',
  ev_copy_hash: 'കോഡ് കോപ്പി ചെയ്യുക',
  ev_copy_all: 'എല്ലാം കോപ്പി ചെയ്യുക',

  // Coming soon
  coming_soon_title: 'അടുത്ത ഘട്ടത്തിൽ വരുന്നു',
  coming_soon_desc: 'ഈ ഭാഗം നിർമ്മാണത്തിലാണ്.',
};

export function t(key: TranslationKey, lang: 'en' | 'ml' = 'en'): string {
  if (lang === 'ml') {
    return ml[key] ?? en[key] ?? key;
  }
  return en[key] ?? key;
}

export function tDynamic(key: string, lang: 'en' | 'ml' = 'en'): string {
  if (lang === 'ml') {
    return (ml as Record<string, string>)[key] ?? (en as Record<string, string>)[key] ?? key;
  }
  return (en as Record<string, string>)[key] ?? key;
}

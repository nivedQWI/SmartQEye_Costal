// ============================================================
// SmartQEye Coastal — Typed Query Keys Factory (Phase 8)
// Centralized key management for TanStack React Query cache invalidation
// ============================================================

export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
    session: () => ['auth', 'session'] as const,
  },
  alerts: {
    all: ['alerts'] as const,
    list: (filters?: Record<string, unknown>) => ['alerts', 'list', filters] as const,
    detail: (id: string) => ['alerts', 'detail', id] as const,
  },
  contacts: {
    all: ['contacts'] as const,
    list: (filters?: Record<string, unknown>) => ['contacts', 'list', filters] as const,
    detail: (id: string) => ['contacts', 'detail', id] as const,
  },
  missions: {
    all: ['missions'] as const,
    list: () => ['missions', 'list'] as const,
    detail: (id: string) => ['missions', 'detail', id] as const,
    aar: (id: string) => ['missions', 'aar', id] as const,
  },
  feeds: {
    all: ['feeds'] as const,
    list: () => ['feeds', 'list'] as const,
    telemetry: (id: string) => ['feeds', 'telemetry', id] as const,
  },
  zones: {
    all: ['zones'] as const,
    list: () => ['zones', 'list'] as const,
    profiles: () => ['zones', 'profiles'] as const,
    detail: (id: string) => ['zones', 'detail', id] as const,
  },
  incidents: {
    all: ['incidents'] as const,
    list: (filters?: Record<string, unknown>) => ['incidents', 'list', filters] as const,
    detail: (id: string) => ['incidents', 'detail', id] as const,
  },
  audit: {
    all: ['audit'] as const,
    list: (filters?: Record<string, unknown>) => ['audit', 'list', filters] as const,
    head: () => ['audit', 'head'] as const,
    verify: () => ['audit', 'verify'] as const,
  },
  models: {
    all: ['models'] as const,
    registry: () => ['models', 'registry'] as const,
    runs: () => ['models', 'runs'] as const,
  },
  admin: {
    users: () => ['admin', 'users'] as const,
    permissionsMatrix: () => ['admin', 'permissions-matrix'] as const,
    retentionPolicies: () => ['admin', 'retention-policies'] as const,
    backupDrills: () => ['admin', 'backup-drills'] as const,
    activeSessions: () => ['admin', 'active-sessions'] as const,
  },
  health: {
    system: () => ['health', 'system'] as const,
  },
} as const;

// Demo only, not real authentication.

import type { UserRole } from '@/types';

export interface RoleConfigItem {
  landing: string;
  primary: string[];
  demoPassword: string;
  allowedRoutes: string[];
}

export type RoleAction =
  | 'ACK_ALERT'
  | 'ESCALATE_ALERT'
  | 'RESOLVE_ALERT'
  | 'START_STOP_MISSION'
  | 'DELETE_MISSION'
  | 'DISPATCH_INTERCEPTOR'
  | 'EDIT_GEOFENCE'
  | 'GENERATE_SIGN_REPORT'
  | 'EXPORT_DOWNLOAD'
  | 'HOT_SWAP_MODEL'
  | 'RESTART_NODE'
  | 'CHANGE_MISSION';

export const ROLE_CONFIG: Record<UserRole, RoleConfigItem> = {
  OPERATOR: {
    landing: '/alerts',
    primary: ['/alerts', '/missions', '/map', '/reports', '/health'],
    demoPassword: 'admin123',
    allowedRoutes: [
      '/alerts',
      '/alerts/:id',
      '/missions',
      '/map',
      '/reports',
      '/health',
    ],
  },
  ANALYST: {
    landing: '/alerts',
    primary: ['/alerts', '/anomaly-monitor', '/person-reid', '/vehicle-maritime', '/crowd-analytics', '/history', '/reports'],
    demoPassword: 'admin123',
    allowedRoutes: [
      '/alerts',
      '/alerts/:id',
      '/anomaly-monitor',
      '/person-reid',
      '/vehicle-maritime',
      '/crowd-analytics',
      '/history',
      '/reports',
    ],
  },
  SUPERVISOR: {
    landing: '/reports',
    primary: ['/reports', '/', '/alerts', '/missions', '/map', '/history', '/health'],
    demoPassword: 'admin123',
    allowedRoutes: [
      '/',
      '/live',
      '/alerts',
      '/alerts/:id',
      '/missions',
      '/map',
      '/intrusion-detection',
      '/anomaly-monitor',
      '/crowd-analytics',
      '/vehicle-maritime',
      '/person-reid',
      '/history',
      '/reports',
      '/health',
      '/admin',
    ],
  },
  ZONE_ADMIN: {
    landing: '/map',
    primary: ['/map', '/intrusion-detection', '/crowd-analytics', '/', '/alerts', '/vehicle-maritime'],
    demoPassword: 'admin123',
    allowedRoutes: [
      '/',
      '/map',
      '/intrusion-detection',
      '/crowd-analytics',
      '/alerts',
      '/alerts/:id',
      '/vehicle-maritime',
    ],
  },
  SYS_ADMIN: {
    landing: '/health',
    primary: ['/health', '/models', '/admin'],
    demoPassword: 'admin123',
    allowedRoutes: [
      '/models',
      '/health',
      '/admin',
    ],
  },
  MODEL_CUSTODIAN: {
    landing: '/models',
    primary: ['/models', '/live', '/person-reid', '/vehicle-maritime', '/crowd-analytics', '/anomaly-monitor', '/health'],
    demoPassword: 'admin123',
    allowedRoutes: [
      '/models',
      '/live',
      '/person-reid',
      '/vehicle-maritime',
      '/crowd-analytics',
      '/anomaly-monitor',
      '/health',
    ],
  },
  AUDITOR: {
    landing: '/history',
    primary: ['/history', '/reports', '/alerts', '/admin', '/missions'],
    demoPassword: 'admin123',
    allowedRoutes: [
      '/alerts',
      '/alerts/:id',
      '/missions',
      '/history',
      '/reports',
      '/admin',
    ],
  },
};

export const ROLES_LIST: UserRole[] = [
  'OPERATOR',
  'SUPERVISOR',
  'SYS_ADMIN',
  'AUDITOR',
];

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'OPERATOR':
      return 'Operator';
    case 'ANALYST':
      return 'Analyst';
    case 'SUPERVISOR':
      return 'Supervisor';
    case 'ZONE_ADMIN':
      return 'Zone Admin';
    case 'SYS_ADMIN':
      return 'Sys Admin';
    case 'MODEL_CUSTODIAN':
      return 'Model Custodian';
    case 'AUDITOR':
      return 'Auditor';
    default:
      return (role as string).replace(/_/g, ' ');
  }
}

export function canAccess(role: UserRole, path: string): boolean {
  const allowed = ROLE_CONFIG[role]?.allowedRoutes ?? [];
  const normalized = path.replace(/\/+$/, '') || '/';
  if (allowed.includes(normalized)) return true;
  if (/^\/alerts\/[^/]+$/.test(normalized) && allowed.includes('/alerts/:id')) return true;
  return false;
}

export const ACTION_PERMISSIONS: Record<RoleAction, UserRole[]> = {
  ACK_ALERT: ['OPERATOR', 'SUPERVISOR'],
  ESCALATE_ALERT: ['OPERATOR', 'SUPERVISOR'],
  RESOLVE_ALERT: ['SUPERVISOR'],
  START_STOP_MISSION: ['OPERATOR', 'SUPERVISOR'],
  DELETE_MISSION: ['SUPERVISOR', 'SYS_ADMIN'],
  DISPATCH_INTERCEPTOR: ['OPERATOR', 'SUPERVISOR'],
  EDIT_GEOFENCE: ['SUPERVISOR'],
  GENERATE_SIGN_REPORT: ['SUPERVISOR'],
  EXPORT_DOWNLOAD: ['SUPERVISOR', 'AUDITOR'],
  HOT_SWAP_MODEL: ['SYS_ADMIN'],
  RESTART_NODE: ['SYS_ADMIN'],
  CHANGE_MISSION: ['OPERATOR', 'SUPERVISOR'],
};

export function can(role: UserRole, action: RoleAction): boolean {
  return ACTION_PERMISSIONS[action]?.includes(role) ?? false;
}

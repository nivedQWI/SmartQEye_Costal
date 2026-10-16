// ============================================================
// SmartQEye Coastal — Role-Based Access Control Configuration
// Per ROLE_BASED_ACCESS_CONTROL.md & UI_AND_SIDEBAR_NAVIGATION.md
// ============================================================

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
    landing: '/overview',
    primary: ['/overview', '/alerts', '/missions', '/map', '/reports', '/health'],
    demoPassword: 'admin123',
    allowedRoutes: [
      '/overview',
      '/alerts',
      '/alerts/:id',
      '/missions',
      '/map',
      '/reports',
      '/health',
      '/help',
    ],
  },
  SUPERVISOR: {
    landing: '/reports',
    primary: ['/reports', '/health', '/admin', '/', '/alerts', '/missions', '/map', '/history', '/live'],
    demoPassword: 'admin123',
    allowedRoutes: [
      '/reports',
      '/health',
      '/admin',
      '/',
      '/alerts',
      '/alerts/:id',
      '/missions',
      '/map',
      '/history',
      '/live',
      '/crowd-analytics',
      '/vehicle-maritime',
      '/person-reid',
      '/intrusion-detection',
      '/anomaly-monitor',
      '/fleet',
      '/abandoned-objects',
      '/contacts',
      '/contacts/:id',
      '/incidents',
      '/incidents/:id',
      '/config/zones',
      '/config/alerts',
      '/help',
    ],
  },
  SYS_ADMIN: {
    landing: '/health',
    primary: ['/health', '/models', '/admin'],
    demoPassword: 'admin123',
    allowedRoutes: [
      '/health',
      '/models',
      '/admin',
      '/audit',
      '/deployment',
      '/integrations',
      '/acceptance',
      '/config/alerts',
      '/help',
    ],
  },
  AUDITOR: {
    landing: '/history',
    primary: ['/history', '/audit', '/alerts', '/missions', '/reports', '/admin'],
    demoPassword: 'admin123',
    allowedRoutes: [
      '/history',
      '/audit',
      '/alerts',
      '/alerts/:id',
      '/missions',
      '/reports',
      '/admin',
      '/incidents',
      '/incidents/:id',
      '/acceptance',
      '/help',
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
    case 'SUPERVISOR':
      return 'Supervisor';
    case 'SYS_ADMIN':
      return 'Sys Admin';
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
  if (/^\/contacts\/[^/]+$/.test(normalized) && allowed.includes('/contacts/:id')) return true;
  if (/^\/incidents\/[^/]+$/.test(normalized) && allowed.includes('/incidents/:id')) return true;
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

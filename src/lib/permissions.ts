// ============================================================
// SmartQEye Coastal — RBAC Permissions & Role Matrix
// 15 Permissions x 7 Roles per Kerala Police RFP & Proposal
// ============================================================

import type { Permission, UserRole } from '@/types';

export interface PermissionMeta {
  code: Permission;
  label: string;
  description: string;
  category: 'OPERATIONS' | 'INTELLIGENCE' | 'GOVERNANCE' | 'SYSTEM';
}

export const PERMISSION_LIST: PermissionMeta[] = [
  // Operations
  {
    code: 'VIEW_LIVE',
    label: 'View Live Feeds',
    description: 'Access real-time tactical video streams and telemetry HUD',
    category: 'OPERATIONS',
  },
  {
    code: 'VIEW_ARCHIVE',
    label: 'View Historical Archive',
    description: 'Access past missions, historical flight paths, and recorded video',
    category: 'OPERATIONS',
  },
  {
    code: 'ACKNOWLEDGE_ALERT',
    label: 'Triage & Acknowledge Alerts',
    description: 'Acknowledge alerts, recommend patrol response, and escalate incidents',
    category: 'OPERATIONS',
  },

  // Intelligence & Analytics
  {
    code: 'ANALYSE',
    label: 'Execute AI Analytics',
    description: 'Run crowd density estimation, ANPR, maritime tracking, and anomaly algorithms',
    category: 'INTELLIGENCE',
  },
  {
    code: 'EVIDENCE_ACCESS',
    label: 'Evidence & ELIR Access',
    description: 'Inspect sealed Evidence-Linked Incident Records and verify cryptographic digests',
    category: 'INTELLIGENCE',
  },
  {
    code: 'EXPORT',
    label: 'Export Evidence Packages',
    description: 'Generate and download court-admissible ZIP packages with SHA-256 manifests',
    category: 'INTELLIGENCE',
  },

  // Governance & Configuration
  {
    code: 'MANAGE_ZONES',
    label: 'Manage Coastal Zones',
    description: 'Create, modify, and approve sensitive geofences and context intelligence profiles',
    category: 'GOVERNANCE',
  },
  {
    code: 'MANAGE_ALERT_RULES',
    label: 'Configure Alert Rules',
    description: 'Adjust sensitivity thresholds, dwell times, and multi-tier escalation channels',
    category: 'GOVERNANCE',
  },
  {
    code: 'VIEW_AUDIT',
    label: 'Audit Trail Inspection',
    description: 'Inspect immutable cryptographic audit logs and execute hash-chain verification',
    category: 'GOVERNANCE',
  },

  // Platform & AI
  {
    code: 'MANAGE_MODELS',
    label: 'Model Registry Lifecycle',
    description: 'Deploy, start, stop, and configure central/edge AI detection engines',
    category: 'SYSTEM',
  },
  {
    code: 'MANAGE_DATASETS',
    label: 'Curated Dataset Queue',
    description: 'Manage false-positive feedback loops for offline human-in-the-loop retraining',
    category: 'SYSTEM',
  },
  {
    code: 'APPROVE_MODEL',
    label: 'Model Candidate Sign-off',
    description: 'Formally certify and sign off on candidate model versions for operational duty',
    category: 'SYSTEM',
  },
  {
    code: 'MANAGE_USERS',
    label: 'User & Access Governance',
    description: 'Enrol personnel, assign roles, enforce MFA, and revoke active sessions',
    category: 'SYSTEM',
  },
  {
    code: 'SYSTEM_ADMIN',
    label: 'Platform Administration',
    description: 'Manage GPU nodes, network gateways, TLS policies, and data retention rules',
    category: 'SYSTEM',
  },
  {
    code: 'API_KEYS',
    label: 'API Key & Integration Control',
    description: 'Issue, rotate, and revoke CCTNS and Kerala Police API integration credentials',
    category: 'SYSTEM',
  },
];

export const ALL_ROLES: UserRole[] = [
  'OPERATOR',
  'SUPERVISOR',
  'SYS_ADMIN',
  'AUDITOR',
];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OPERATOR: [
    'VIEW_LIVE',
    'VIEW_ARCHIVE',
    'ACKNOWLEDGE_ALERT',
  ],
  SUPERVISOR: [
    'VIEW_LIVE',
    'VIEW_ARCHIVE',
    'ANALYSE',
    'ACKNOWLEDGE_ALERT',
    'EVIDENCE_ACCESS',
    'EXPORT',
    'MANAGE_ZONES',
    'MANAGE_ALERT_RULES',
  ],
  AUDITOR: [
    'VIEW_ARCHIVE',
    'EVIDENCE_ACCESS',
    'EXPORT',
    'VIEW_AUDIT',
  ],
  SYS_ADMIN: [
    'VIEW_LIVE',
    'VIEW_ARCHIVE',
    'ANALYSE',
    'ACKNOWLEDGE_ALERT',
    'EXPORT',
    'EVIDENCE_ACCESS',
    'MANAGE_ZONES',
    'MANAGE_ALERT_RULES',
    'MANAGE_MODELS',
    'MANAGE_DATASETS',
    'APPROVE_MODEL',
    'MANAGE_USERS',
    'VIEW_AUDIT',
    'SYSTEM_ADMIN',
    'API_KEYS',
  ],
};

export function hasPermission(
  role: UserRole,
  permission: Permission,
  customMatrix?: Record<UserRole, Permission[]>
): boolean {
  const matrix = customMatrix || DEFAULT_ROLE_PERMISSIONS;
  const permissions = matrix[role] || [];
  return permissions.includes(permission);
}

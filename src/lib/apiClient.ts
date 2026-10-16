// ============================================================
// SmartQEye Coastal — ApiClient Interface (Phase 8)
// Strictly defined against docs/openapi.yaml
// Implemented by both MockApiClient and LiveApiClient
// ============================================================

import type {
  Alert, Contact, Zone, Mission, SystemHealth,
  CoastalEvent, User, ZoneProfile, ContextProfileDetail,
  AlertRuleConfig, AbandonedObjectRecord, AuditEntry,
  IncidentRecord, AdminUser, DataRetentionPolicy,
  BackupDrillRecord, ActiveSession, Permission, UserRole,
} from '@/types';
import type { ChainVerificationResult } from './crypto';

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AlertFilters {
  severity?: string[];
  status?: string[];
  zoneCode?: string;
  uavCode?: string;
  eventType?: string[];
  dateFrom?: string;
  dateTo?: string;
  contactCode?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface EventFilters {
  dateFrom?: string;
  dateTo?: string;
  missionCode?: string;
  uavCode?: string;
  eventType?: string[];
  zoneCode?: string;
  contactCode?: string;
  severity?: string[];
  modality?: string[];
  page?: number;
  pageSize?: number;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly message: string,
    public readonly details?: unknown
  ) {
    super(`[API ${statusCode}] ${message}`);
    this.name = 'ApiError';
  }
}

export interface ApiClient {
  auth: {
    login(username: string, password: string, mfaCode?: string): Promise<User>;
    verifyMfa(token: string, mfaCode: string): Promise<User>;
    getCurrentUser(): Promise<User | null>;
    logout(): Promise<void>;
  };
  alerts: {
    list(filters?: AlertFilters): Promise<Page<Alert>>;
    get(id: string): Promise<Alert | null>;
    acknowledge(id: string, note?: string): Promise<Alert>;
  };
  events: {
    list(filters?: EventFilters): Promise<Page<CoastalEvent>>;
  };
  contacts: {
    list(): Promise<Contact[]>;
    get(id: string): Promise<Contact | null>;
  };
  missions: {
    list(): Promise<Mission[]>;
    get(id: string): Promise<Mission | null>;
    create(data: Omit<Mission, 'id'>): Promise<Mission>;
  };
  zones: {
    list(): Promise<Zone[]>;
    update(id: string, zone: Partial<Zone>): Promise<Zone>;
    getProfiles(): Promise<ZoneProfile[]>;
  };
  audit: {
    query(filters?: {
      userRole?: UserRole;
      action?: string;
      targetType?: string;
      outcome?: string;
      page?: number;
      pageSize?: number;
    }): Promise<Page<AuditEntry>>;
    getLatestHead(): Promise<AuditEntry>;
    append(data: {
      userId: string;
      userName: string;
      userRole: UserRole;
      action: string;
      targetType: string;
      targetId: string;
      outcome?: 'SUCCESS' | 'FLAGGED' | 'BLOCKED';
      ipAddress?: string;
      sessionId?: string;
      detail?: Record<string, unknown>;
      beforeAfterSummary?: string;
    }): Promise<AuditEntry>;
    verifyChain(): Promise<ChainVerificationResult>;
  };
  admin: {
    listUsers(): Promise<AdminUser[]>;
    updateUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser>;
    getPermissionsMatrix(): Promise<Record<UserRole, Permission[]>>;
    updatePermissionsMatrix(matrix: Record<UserRole, Permission[]>): Promise<Record<UserRole, Permission[]>>;
    getDataRetentionPolicies(): Promise<DataRetentionPolicy[]>;
    getBackupDrills(): Promise<BackupDrillRecord[]>;
    getActiveSessions(): Promise<ActiveSession[]>;
    killSession(sessionId: string, terminatedBy: { id: string; name: string }): Promise<void>;
  };
  health: {
    getHealth(): Promise<SystemHealth>;
  };
}

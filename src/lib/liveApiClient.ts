// ============================================================
// SmartQEye Coastal — LiveApiClient (FastAPI Backend Driver)
// Phase 8: Production HTTP transport with JWT, Retry, and Error Mapping
// ============================================================

import { ApiError, type ApiClient, type AlertFilters, type EventFilters, type Page } from './apiClient';
import { runtimeConfig } from './runtimeConfig';
import {
  AlertSchema, ContactSchema, ZoneSchema,
  AuditEntrySchema, UserSchema, TelemetrySampleSchema
} from './schemas';
import type {
  Alert, Contact, Zone, Mission, SystemHealth,
  CoastalEvent, User, ZoneProfile, AuditEntry,
  AdminUser, DataRetentionPolicy, BackupDrillRecord,
  ActiveSession, Permission, UserRole,
} from '@/types';
import type { ChainVerificationResult } from './crypto';

export class LiveApiClient implements ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = runtimeConfig.API_BASE_URL.replace(/\/+$/, '');
  }

  private getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('sqeye_jwt_token');
    }
    return null;
  }

  private async fetchWithRetry<T>(
    path: string,
    options: RequestInit = {},
    retries = 3,
    delayMs = 500
  ): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        if (response.status >= 500 && retries > 0) {
          await new Promise(r => setTimeout(r, delayMs));
          return this.fetchWithRetry<T>(path, options, retries - 1, delayMs * 2);
        }

        let errorDetails: unknown = null;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = await response.text();
        }

        throw new ApiError(response.status, response.statusText, errorDetails);
      }

      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof ApiError) throw err;

      if (retries > 0) {
        await new Promise(r => setTimeout(r, delayMs));
        return this.fetchWithRetry<T>(path, options, retries - 1, delayMs * 2);
      }

      throw new ApiError(0, err instanceof Error ? err.message : 'Network failure');
    }
  }

  // ─── Auth ───────────────────────────────────────────────────

  public auth = {
    login: async (username: string, password: string, mfaCode?: string): Promise<User> => {
      const data = await this.fetchWithRetry<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, mfaCode }),
      });
      if (data.token && typeof localStorage !== 'undefined') {
        localStorage.setItem('sqeye_jwt_token', data.token);
      }
      return UserSchema.parse(data.user);
    },

    verifyMfa: async (token: string, mfaCode: string): Promise<User> => {
      const data = await this.fetchWithRetry<any>('/auth/mfa', {
        method: 'POST',
        body: JSON.stringify({ token, mfaCode }),
      });
      if (data.token && typeof localStorage !== 'undefined') {
        localStorage.setItem('sqeye_jwt_token', data.token);
      }
      return UserSchema.parse(data.user);
    },

    getCurrentUser: async (): Promise<User | null> => {
      const data = await this.fetchWithRetry<User>('/auth/me');
      return UserSchema.parse(data);
    },

    logout: async (): Promise<void> => {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('sqeye_jwt_token');
      }
      await this.fetchWithRetry('/auth/logout', { method: 'POST' }).catch(() => {});
    },
  };

  // ─── Alerts ─────────────────────────────────────────────────

  public alerts = {
    list: async (filters: AlertFilters = {}): Promise<Page<Alert>> => {
      const query = new URLSearchParams();
      if (filters.severity) filters.severity.forEach(s => query.append('severity', s));
      if (filters.status) filters.status.forEach(s => query.append('status', s));
      if (filters.zoneCode) query.set('zoneCode', filters.zoneCode);
      if (filters.uavCode) query.set('uavCode', filters.uavCode);
      if (filters.page) query.set('page', String(filters.page));
      if (filters.pageSize) query.set('pageSize', String(filters.pageSize));

      const path = `/alerts${query.toString() ? `?${query.toString()}` : ''}`;
      return this.fetchWithRetry<Page<Alert>>(path);
    },

    get: async (id: string): Promise<Alert | null> => {
      return this.fetchWithRetry<Alert>(`/alerts/${id}`);
    },

    acknowledge: async (id: string, note?: string): Promise<Alert> => {
      return this.fetchWithRetry<Alert>(`/alerts/${id}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      });
    },
  };

  // ─── Events ─────────────────────────────────────────────────

  public events = {
    list: async (filters: EventFilters = {}): Promise<Page<CoastalEvent>> => {
      const query = new URLSearchParams();
      if (filters.dateFrom) query.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) query.set('dateTo', filters.dateTo);
      if (filters.page) query.set('page', String(filters.page));
      if (filters.pageSize) query.set('pageSize', String(filters.pageSize));

      const path = `/events${query.toString() ? `?${query.toString()}` : ''}`;
      return this.fetchWithRetry<Page<CoastalEvent>>(path);
    },
  };

  // ─── Contacts ───────────────────────────────────────────────

  public contacts = {
    list: async (): Promise<Contact[]> => {
      const data = await this.fetchWithRetry<Contact[]>('/contacts');
      return data.map(c => ContactSchema.parse(c) as Contact);
    },

    get: async (id: string): Promise<Contact | null> => {
      const data = await this.fetchWithRetry<Contact>(`/contacts/${id}`);
      return ContactSchema.parse(data) as Contact;
    },
  };

  // ─── Missions ───────────────────────────────────────────────

  public missions = {
    list: async (): Promise<Mission[]> => {
      return this.fetchWithRetry<Mission[]>('/missions');
    },

    get: async (id: string): Promise<Mission | null> => {
      return this.fetchWithRetry<Mission>(`/missions/${id}`);
    },

    create: async (data: Omit<Mission, 'id'>): Promise<Mission> => {
      return this.fetchWithRetry<Mission>('/missions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  };

  // ─── Zones ──────────────────────────────────────────────────

  public zones = {
    list: async (): Promise<Zone[]> => {
      return this.fetchWithRetry<Zone[]>('/zones');
    },

    update: async (id: string, zone: Partial<Zone>): Promise<Zone> => {
      return this.fetchWithRetry<Zone>(`/zones/${id}`, {
        method: 'PUT',
        body: JSON.stringify(zone),
      });
    },

    getProfiles: async (): Promise<ZoneProfile[]> => {
      return this.fetchWithRetry<ZoneProfile[]>('/zones/profiles');
    },
  };

  // ─── Audit ──────────────────────────────────────────────────

  public audit = {
    query: async (filters?: {
      userRole?: UserRole;
      action?: string;
      targetType?: string;
      outcome?: string;
      page?: number;
      pageSize?: number;
    }): Promise<Page<AuditEntry>> => {
      const query = new URLSearchParams();
      if (filters?.action) query.set('action', filters.action);
      if (filters?.page) query.set('page', String(filters.page));
      if (filters?.pageSize) query.set('pageSize', String(filters.pageSize));

      return this.fetchWithRetry<Page<AuditEntry>>(`/audit${query.toString() ? `?${query.toString()}` : ''}`);
    },

    getLatestHead: async (): Promise<AuditEntry> => {
      return this.fetchWithRetry<AuditEntry>('/audit/head');
    },

    append: async (data: {
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
    }): Promise<AuditEntry> => {
      return this.fetchWithRetry<AuditEntry>('/audit', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    verifyChain: async (): Promise<ChainVerificationResult> => {
      return this.fetchWithRetry<ChainVerificationResult>('/audit/verify', {
        method: 'POST',
      });
    },
  };

  // ─── Admin ──────────────────────────────────────────────────

  public admin = {
    listUsers: async (): Promise<AdminUser[]> => {
      return this.fetchWithRetry<AdminUser[]>('/admin/users');
    },

    updateUser: async (id: string, updates: Partial<AdminUser>): Promise<AdminUser> => {
      return this.fetchWithRetry<AdminUser>(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    getPermissionsMatrix: async (): Promise<Record<UserRole, Permission[]>> => {
      return this.fetchWithRetry<Record<UserRole, Permission[]>>('/admin/permissions');
    },

    updatePermissionsMatrix: async (matrix: Record<UserRole, Permission[]>): Promise<Record<UserRole, Permission[]>> => {
      return this.fetchWithRetry<Record<UserRole, Permission[]>>('/admin/permissions', {
        method: 'PUT',
        body: JSON.stringify(matrix),
      });
    },

    getDataRetentionPolicies: async (): Promise<DataRetentionPolicy[]> => {
      return this.fetchWithRetry<DataRetentionPolicy[]>('/admin/retention');
    },

    getBackupDrills: async (): Promise<BackupDrillRecord[]> => {
      return this.fetchWithRetry<BackupDrillRecord[]>('/admin/backups');
    },

    getActiveSessions: async (): Promise<ActiveSession[]> => {
      return this.fetchWithRetry<ActiveSession[]>('/admin/sessions');
    },

    killSession: async (sessionId: string, terminatedBy: { id: string; name: string }): Promise<void> => {
      await this.fetchWithRetry(`/admin/sessions/${sessionId}/kill`, {
        method: 'POST',
        body: JSON.stringify(terminatedBy),
      });
    },
  };

  // ─── Health ─────────────────────────────────────────────────

  public health = {
    getHealth: async (): Promise<SystemHealth> => {
      return this.fetchWithRetry<SystemHealth>('/health');
    },
  };
}

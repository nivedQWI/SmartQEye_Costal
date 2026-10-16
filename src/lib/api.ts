// ============================================================
// SmartQEye Coastal — Typed API Client
// All data access goes through here.
// Swap the mock implementations for real fetch calls to
// FastAPI without changing any import in the rest of the app.
// ============================================================

import type {
  Alert, Contact, Zone, Mission, Feed, SystemHealth,
  CoastalEvent, User, AlertStatus, ZoneProfile,
  ContextProfileDetail, AlertRuleConfig, AbandonedObjectRecord,
  AttentionLevel, AuditEntry, IncidentRecord, IncidentWorkflowStatus,
  AdminUser, DataRetentionPolicy, BackupDrillRecord, ActiveSession,
  Permission, UserRole,
} from '@/types';
import {
  ALERTS, CONTACTS, ZONES, MISSIONS, INITIAL_FEEDS,
  INITIAL_HEALTH, HISTORICAL_EVENTS, ZONE_PROFILES, UAVS,
  CONTEXT_PROFILES, ALERT_RULES, ABANDONED_OBJECTS,
} from './mockData';
import { AUDIT_TRAIL_SEED } from './auditTrailSeed';
import { INCIDENTS_DATA } from './incidentsData';
import { computeAuditBlockHash, verifyAuditChain, type ChainVerificationResult, GENESIS_PREV_HASH } from './crypto';
import { generateEvidencePackageZip } from './exportEvidence';
import { KERALA_POLICE_ROSTER, KERALA_COASTAL_STATIONS } from './roster';
import { DEFAULT_ROLE_PERMISSIONS } from './permissions';
import { runtimeConfig } from './runtimeConfig';
import { LiveApiClient } from './liveApiClient';
import type { ApiClient } from './apiClient';
export { ApiError } from './apiClient';
export type { ApiClient } from './apiClient';

const liveClient = new LiveApiClient();
const isLive = () => runtimeConfig.API_MODE === 'live';


// ─── Pagination ──────────────────────────────────────────────

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

// Simulated latency (ms) — remove when using real API
const MOCK_LATENCY = 120;
const delay = (ms = MOCK_LATENCY) => new Promise<void>(r => setTimeout(r, ms));

// ─── Alerts ──────────────────────────────────────────────────

export const alertsApi = {
  async list(filters: AlertFilters = {}): Promise<Page<Alert>> {
    if (isLive()) return liveClient.alerts.list(filters);
    await delay();
    let items = [...ALERTS];
    if (filters.severity?.length) items = items.filter(a => filters.severity!.includes(a.severity));
    if (filters.status?.length)   items = items.filter(a => filters.status!.includes(a.status));
    if (filters.zoneCode)         items = items.filter(a => a.event.zone?.code === filters.zoneCode);
    if (filters.uavCode)          items = items.filter(a => a.event.uav.code === filters.uavCode);
    if (filters.eventType?.length) items = items.filter(a => filters.eventType!.includes(a.event.type));
    items.sort((a, b) => {
      const sevOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
      return sevOrder.indexOf(a.severity) - sevOrder.indexOf(b.severity);
    });
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 25;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize };
  },

  async get(id: string): Promise<Alert | null> {
    if (isLive()) return liveClient.alerts.get(id);
    await delay();
    return ALERTS.find(a => a.id === id) ?? null;
  },

  async acknowledge(id: string, note?: string): Promise<Alert> {
    if (isLive()) return liveClient.alerts.acknowledge(id, note);
    await delay();
    const alert = ALERTS.find(a => a.id === id);
    if (!alert) throw new Error('Alert not found');
    return {
      ...alert,
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: 'Current User',
      notes: note,
    };
  },

  async resolve(id: string, note?: string): Promise<Alert> {
    await delay();
    const alert = ALERTS.find(a => a.id === id);
    if (!alert) throw new Error('Alert not found');
    return { ...alert, status: 'RESOLVED', resolvedAt: new Date().toISOString(), notes: note };
  },

  async markFalseAlert(id: string, reason: string): Promise<Alert> {
    await delay();
    const alert = ALERTS.find(a => a.id === id);
    if (!alert) throw new Error('Alert not found');
    return { ...alert, status: 'FALSE_ALERT', isFalseAlert: true, falseAlertReason: reason };
  },

  async updateStatus(id: string, status: AlertStatus): Promise<Alert> {
    await delay();
    const alert = ALERTS.find(a => a.id === id);
    if (!alert) throw new Error('Alert not found');
    return { ...alert, status, updatedAt: new Date().toISOString() };
  },
};

export interface ContactFilters {
  page?: number;
  pageSize?: number;
  class_?: string;
  attentionLevel?: AttentionLevel[];
  uavCode?: string;
  modality?: 'RGB' | 'THERMAL' | 'BOTH';
  search?: string;
  sortBy?: 'lastSeen' | 'dwell' | 'attention' | 'continuity';
  sortDir?: 'asc' | 'desc';
}

export const contactsApi = {
  async list(params: ContactFilters = {}): Promise<Page<Contact>> {
    await delay();
    let items = [...CONTACTS];
    if (params.class_ && params.class_ !== 'ALL') items = items.filter(c => c.class === params.class_);
    if (params.attentionLevel?.length) items = items.filter(c => c.attentionLevel && params.attentionLevel!.includes(c.attentionLevel));
    if (params.uavCode) items = items.filter(c => c.observedUavs?.includes(params.uavCode!));
    if (params.modality) items = items.filter(c => c.modalitySeen === params.modality || c.modalitySeen === 'BOTH');
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(c =>
        c.code.toLowerCase().includes(q) ||
        c.classLabel.toLowerCase().includes(q) ||
        c.fineGrainedType?.toLowerCase().includes(q)
      );
    }

    if (params.sortBy) {
      items.sort((a, b) => {
        if (params.sortBy === 'lastSeen') {
          return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
        }
        if (params.sortBy === 'dwell') {
          return (b.dwellTotalSec ?? 0) - (a.dwellTotalSec ?? 0);
        }
        if (params.sortBy === 'continuity') {
          return b.continuityConf - a.continuityConf;
        }
        if (params.sortBy === 'attention') {
          const rank: Record<AttentionLevel, number> = { CRITICAL: 4, ATTENTION: 3, MONITOR: 2, RECORD_ONLY: 1 };
          return (rank[b.attentionLevel ?? 'RECORD_ONLY'] ?? 0) - (rank[a.attentionLevel ?? 'RECORD_ONLY'] ?? 0);
        }
        return 0;
      });
      if (params.sortDir === 'asc') items.reverse();
    }

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 25;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize };
  },

  async get(id: string): Promise<Contact | null> {
    await delay();
    return CONTACTS.find(c => c.id === id || c.code.toLowerCase() === id.toLowerCase()) ?? null;
  },
};

// ─── Zones ───────────────────────────────────────────────────

export const zonesApi = {
  async list(): Promise<Zone[]> {
    await delay();
    return ZONES;
  },

  async get(id: string): Promise<Zone | null> {
    await delay();
    return ZONES.find(z => z.id === id || z.code === id) ?? null;
  },

  async create(zone: Omit<Zone, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Zone> {
    await delay();
    const newZone: Zone = { ...zone, id: `z-${Date.now()}`, version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    return newZone;
  },

  async update(id: string, zone: Partial<Zone>): Promise<Zone> {
    await delay();
    const existing = ZONES.find(z => z.id === id);
    if (!existing) throw new Error('Zone not found');
    return { ...existing, ...zone, version: existing.version + 1, updatedAt: new Date().toISOString() };
  },

  async profiles(): Promise<ZoneProfile[]> {
    await delay();
    return ZONE_PROFILES;
  },
};

// ─── Missions ─────────────────────────────────────────────────

export const missionsApi = {
  async list(): Promise<Mission[]> {
    await delay();
    return MISSIONS;
  },

  async get(id: string): Promise<Mission | null> {
    await delay();
    return MISSIONS.find(m => m.id === id || m.missionCode === id) ?? null;
  },
};

// ─── Feeds ───────────────────────────────────────────────────

export const feedsApi = {
  async list(): Promise<Feed[]> {
    await delay();
    return INITIAL_FEEDS;
  },

  async get(id: string): Promise<Feed | null> {
    await delay();
    return INITIAL_FEEDS.find(f => f.id === id) ?? null;
  },
};

// ─── Events / History ────────────────────────────────────────

export const eventsApi = {
  async list(filters: EventFilters = {}): Promise<Page<CoastalEvent>> {
    await delay();
    let items = [...HISTORICAL_EVENTS];
    if (filters.uavCode) items = items.filter(e => e.uav.code === filters.uavCode);
    if (filters.missionCode) items = items.filter(e => e.mission.code === filters.missionCode);
    if (filters.eventType?.length) items = items.filter(e => filters.eventType!.includes(e.type));
    if (filters.zoneCode) items = items.filter(e => e.zone?.code === filters.zoneCode);
    if (filters.contactCode) items = items.filter(e => e.contact?.code === filters.contactCode);
    if (filters.modality?.length) items = items.filter(e => e.modality && filters.modality!.includes(e.modality));
    if (filters.dateFrom) items = items.filter(e => e.occurredAt >= filters.dateFrom!);
    if (filters.dateTo)   items = items.filter(e => e.occurredAt <= filters.dateTo!);
    items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 50;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize };
  },
};

// ─── System Health ────────────────────────────────────────────

export const healthApi = {
  async get(): Promise<SystemHealth> {
    await delay();
    return INITIAL_HEALTH;
  },
};

// ─── Auth (mock) ──────────────────────────────────────────────

const MOCK_USERS: User[] = [
  { id: 'u-op1', username: 'op.rajan', fullName: 'Rajan K.', rankTitle: 'HC', role: 'OPERATOR', unitName: 'Vizhinjam Coastal Police Station', email: 'rajan@kp.gov.in' },
  { id: 'u-an1', username: 'an.meera', fullName: 'Meera S.', rankTitle: 'Analyst', role: 'ANALYST', unitName: 'Coastal Intelligence Cell', email: 'meera@kp.gov.in' },
  { id: 'u-an2', username: 'an.priya', fullName: 'Priya V.', rankTitle: 'ASI', role: 'ANALYST', unitName: 'Coastal Intelligence Cell' },
  { id: 'u-sup1', username: 'sup.thomas', fullName: 'Thomas K.', rankTitle: 'Dy.SP Coastal', role: 'SUPERVISOR', unitName: 'Coastal Police HQ', email: 'sup.thomas@kp.gov.in' },
  { id: 'u-sup2', username: 'sup.menon', fullName: 'Menon R.', rankTitle: 'SI', role: 'SUPERVISOR', unitName: 'Coastal Police HQ' },
  { id: 'u-zadm', username: 'zone.nair', fullName: 'Nair K.', rankTitle: 'CI Coastal', role: 'ZONE_ADMIN', unitName: 'Coastal Police HQ', email: 'zone.nair@kp.gov.in' },
  { id: 'u-zadm2', username: 'za.krishna', fullName: 'Krishna N.', rankTitle: 'CI', role: 'ZONE_ADMIN', unitName: 'Coastal Police HQ' },
  { id: 'u-sadm', username: 'sys.admin', fullName: 'System Admin', rankTitle: 'Admin', role: 'SYS_ADMIN', unitName: 'IT Cell', email: 'sys.admin@kp.gov.in' },
  { id: 'u-sadm2', username: 'sa.thomas', fullName: 'Thomas J.', rankTitle: 'IT Admin', role: 'SYS_ADMIN', unitName: 'IT Cell' },
  { id: 'u-mc1', username: 'model.iyer', fullName: 'Iyer S.', rankTitle: 'Model Custodian', role: 'MODEL_CUSTODIAN', unitName: 'Drone Forensic Lab', email: 'model.iyer@kp.gov.in' },
  { id: 'u-mc2', username: 'mc.arun', fullName: 'Arun P.', rankTitle: 'Technical Expert', role: 'MODEL_CUSTODIAN', unitName: 'AI Cell' },
  { id: 'u-aud1', username: 'aud.george', fullName: 'George V.', rankTitle: 'Auditor', role: 'AUDITOR', unitName: 'Internal Audit', email: 'aud.george@kp.gov.in' },
  { id: 'u-aud2', username: 'aud.seema', fullName: 'Seema M.', rankTitle: 'Superintendent', role: 'AUDITOR', unitName: 'Internal Audit' },
];

export const authApi = {
  async login(username: string, _password: string, _mfaCode?: string): Promise<User> {
    await delay(400);
    const user = MOCK_USERS.find(u => u.username === username) ?? MOCK_USERS[0];
    return user;
  },

  async getCurrentUser(): Promise<User> {
    await delay(200);
    return MOCK_USERS[0];
  },

  getMockUsers(): User[] {
    return MOCK_USERS;
  },
};

// ─── UAVs ────────────────────────────────────────────────────

export const uavsApi = {
  async list() {
    await delay();
    return UAVS;
  },
};

// ─── Phase 3: Context Profiles ─────────────────────────────────────────────

export const contextProfilesApi = {
  async list(): Promise<ContextProfileDetail[]> {
    await delay();
    return CONTEXT_PROFILES;
  },

  async get(idOrCode: string): Promise<ContextProfileDetail | null> {
    await delay();
    return CONTEXT_PROFILES.find(p => p.id === idOrCode || p.code === idOrCode) ?? null;
  },

  async update(id: string, updates: Partial<ContextProfileDetail>): Promise<ContextProfileDetail> {
    await delay();
    const idx = CONTEXT_PROFILES.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Context Profile not found');
    const existing = CONTEXT_PROFILES[idx];
    const updated: ContextProfileDetail = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      history: [
        {
          version: updates.version ?? existing.version,
          changedAt: new Date().toISOString(),
          changedBy: 'Current Officer (Zone Admin)',
          summary: 'Context profile thresholds / policy updated via console',
        },
        ...existing.history,
      ],
    };
    CONTEXT_PROFILES[idx] = updated;
    return updated;
  },
};

// ─── Phase 3: Alert Rules ───────────────────────────────────────────────────

export interface HistoricalReplayResult {
  ruleCode: string;
  periodHours: number;
  rawEdgeDetections: number;
  contextFilteredAlerts: number;
  alertVolumeReductionPct: number;
  falseAlarmSuppressionPct: number;
  confirmedTruePositives: number;
  operatorMinutesSaved: number;
  evaluatedAt: string;
}

export const rulesApi = {
  async list(): Promise<AlertRuleConfig[]> {
    await delay();
    return ALERT_RULES;
  },

  async get(idOrCode: string): Promise<AlertRuleConfig | null> {
    await delay();
    return ALERT_RULES.find(r => r.id === idOrCode || r.code === idOrCode) ?? null;
  },

  async toggle(id: string): Promise<AlertRuleConfig> {
    await delay();
    const rule = ALERT_RULES.find(r => r.id === id);
    if (!rule) throw new Error('Alert rule not found');
    rule.enabled = !rule.enabled;
    rule.lastUpdated = new Date().toISOString();
    return rule;
  },

  async update(id: string, updates: Partial<AlertRuleConfig>): Promise<AlertRuleConfig> {
    await delay();
    const idx = ALERT_RULES.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Alert rule not found');
    const existing = ALERT_RULES[idx];
    const nextVersion = `v${(parseFloat(existing.version.replace('v', '')) + 0.1).toFixed(1)}`;
    const updated: AlertRuleConfig = {
      ...existing,
      ...updates,
      version: nextVersion,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'CI Krishna N. (Zone Admin)',
    };
    ALERT_RULES[idx] = updated;
    return updated;
  },

  async runReplayTest(ruleId: string): Promise<HistoricalReplayResult> {
    await delay(350);
    const rule = ALERT_RULES.find(r => r.id === ruleId) ?? ALERT_RULES[0];
    return {
      ruleCode: rule.code,
      periodHours: 24,
      rawEdgeDetections: 124500,
      contextFilteredAlerts: 7470,
      alertVolumeReductionPct: 94.0,
      falseAlarmSuppressionPct: 97.4,
      confirmedTruePositives: 142,
      operatorMinutesSaved: 1950,
      evaluatedAt: new Date().toISOString(),
    };
  },
};

// ─── Phase 3: Abandoned & Stationary Objects ────────────────────────────────

export const abandonedObjectsApi = {
  async list(): Promise<AbandonedObjectRecord[]> {
    await delay();
    return ABANDONED_OBJECTS;
  },

  async get(idOrCode: string): Promise<AbandonedObjectRecord | null> {
    await delay();
    return ABANDONED_OBJECTS.find(o => o.id === idOrCode || o.itemCode === idOrCode) ?? null;
  },

  async markCleared(id: string, reason: string, clearedBy = 'Current Officer'): Promise<AbandonedObjectRecord> {
    await delay();
    const item = ABANDONED_OBJECTS.find(o => o.id === id || o.itemCode === id);
    if (!item) throw new Error('Abandoned object record not found');
    item.status = 'CLEARED_BY_OPERATOR';
    item.clearedReason = reason;
    item.clearedBy = clearedBy;
    item.statusUpdatedAgo = 'Just now';
    return item;
  },

  async updateStatus(id: string, status: AbandonedObjectRecord['status']): Promise<AbandonedObjectRecord> {
    await delay();
    const item = ABANDONED_OBJECTS.find(o => o.id === id || o.itemCode === id);
    if (!item) throw new Error('Abandoned object record not found');
    item.status = status;
    item.statusUpdatedAgo = 'Just now';
    return item;
  },
};

// ─── Phase 4: Cryptographic Audit Trail API ─────────────────────────────────

const LIVE_AUDIT_TRAIL: AuditEntry[] = [...AUDIT_TRAIL_SEED];

export interface AuditFilters {
  search?: string;
  userId?: string;
  userRole?: string;
  action?: string;
  targetType?: string;
  outcome?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export const auditApi = {
  async list(filters: AuditFilters = {}): Promise<Page<AuditEntry>> {
    await delay(60);
    let items = [...LIVE_AUDIT_TRAIL];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        e =>
          e.userName.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          e.targetId.toLowerCase().includes(q) ||
          (e.beforeAfterSummary && e.beforeAfterSummary.toLowerCase().includes(q))
      );
    }
    if (filters.userId) items = items.filter(e => e.userId === filters.userId);
    if (filters.userRole) items = items.filter(e => e.userRole === filters.userRole);
    if (filters.action) items = items.filter(e => e.action.includes(filters.action!));
    if (filters.targetType) items = items.filter(e => e.targetType === filters.targetType);
    if (filters.outcome) items = items.filter(e => e.outcome === filters.outcome);
    if (filters.dateFrom) items = items.filter(e => e.timestamp >= filters.dateFrom!);
    if (filters.dateTo) items = items.filter(e => e.timestamp <= filters.dateTo!);

    // Default newest first for operator UI review
    items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 25;
    const start = (page - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      pageSize,
    };
  },

  async getLatestHead(): Promise<AuditEntry> {
    const sorted = [...LIVE_AUDIT_TRAIL].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    return sorted[sorted.length - 1];
  },

  async append(data: {
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
  }): Promise<AuditEntry> {
    const head = await this.getLatestHead();
    const prevHash = head ? head.hash ?? GENESIS_PREV_HASH : GENESIS_PREV_HASH;
    const timestamp = new Date().toISOString();
    const outcome = data.outcome || 'SUCCESS';
    const sessionId = data.sessionId || 'sess-live';
    const id = `aud-${String(LIVE_AUDIT_TRAIL.length + 1).padStart(4, '0')}`;

    const blockHash = await computeAuditBlockHash({
      prevHash,
      timestamp,
      userId: data.userId,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      outcome,
      sessionId,
    });

    const newEntry: AuditEntry = {
      id,
      timestamp,
      userId: data.userId,
      userName: data.userName,
      userRole: data.userRole,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      outcome,
      ipAddress: data.ipAddress || '10.200.4.15',
      sessionId,
      detail: data.detail,
      beforeAfterSummary: data.beforeAfterSummary,
      prevHash,
      hash: blockHash,
    };

    LIVE_AUDIT_TRAIL.push(newEntry);
    return newEntry;
  },

  async verifyChain(): Promise<ChainVerificationResult> {
    await delay(120);
    return await verifyAuditChain(LIVE_AUDIT_TRAIL);
  },

  async exportCsv(filters: AuditFilters = {}): Promise<string> {
    const { items } = await this.list({ ...filters, pageSize: 10000 });
    const headers = [
      'id',
      'timestamp',
      'user_id',
      'user_name',
      'user_role',
      'action',
      'target_type',
      'target_id',
      'outcome',
      'ip_address',
      'session_id',
      'summary',
      'prev_hash',
      'block_hash',
    ];
    const rows = items.map(e =>
      [
        e.id,
        `"${e.timestamp}"`,
        `"${e.userId}"`,
        `"${e.userName}"`,
        `"${e.userRole}"`,
        `"${e.action}"`,
        `"${e.targetType}"`,
        `"${e.targetId}"`,
        `"${e.outcome || 'SUCCESS'}"`,
        `"${e.ipAddress || ''}"`,
        `"${e.sessionId || ''}"`,
        `"${(e.beforeAfterSummary || '').replace(/"/g, '""')}"`,
        `"${e.prevHash || ''}"`,
        `"${e.hash || ''}"`,
      ].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  },
};

// ─── Phase 4: Incidents & ELIR API ──────────────────────────────────────────

const LIVE_INCIDENTS: IncidentRecord[] = [...INCIDENTS_DATA];

export const incidentsApi = {
  async list(): Promise<IncidentRecord[]> {
    await delay(60);
    return LIVE_INCIDENTS;
  },

  async get(idOrCode: string): Promise<IncidentRecord | null> {
    await delay(60);
    const incident = LIVE_INCIDENTS.find(
      i => i.id === idOrCode || i.incidentCode === idOrCode || i.alertId === idOrCode
    );
    if (incident) return incident;

    // Fallback: Check if an alert matches this ID and generate an ELIR representation
    const alert = ALERTS.find(a => a.id === idOrCode || a.alertCode === idOrCode);
    if (alert) {
      return {
        id: alert.id,
        incidentCode: alert.alertCode.replace('ALT-', 'INC-'),
        alertId: alert.id,
        title: alert.event.rationale.note || `${alert.event.type} in ${alert.event.zone?.name || 'Coastal Sector'}`,
        category: (alert.event.type.includes('zone') || alert.event.type.includes('intrusion'))
          ? 'ZONE_INTRUSION'
          : alert.event.type.includes('convergence')
          ? 'SUSPICIOUS_CONVERGENCE'
          : 'SECURITY_BREACH',
        station: 'Vizhinjam Coastal Police Station',
        assignedOfficer: alert.assignedToName || 'CI Saji Varghese',
        badge: 'KL-CP-0842',
        openedAt: alert.createdAt,
        status: (alert.status === 'NEW' ? 'NEW' : alert.status === 'ACKNOWLEDGED' ? 'ACKNOWLEDGED' : 'UNDER_REVIEW') as IncidentWorkflowStatus,
        severity: alert.severity,
        attention: alert.event.attention,
        evidenceCount: alert.evidence.length || 4,
        sha256DossierHash: '3f5a8c9b2d1e0f4a6c8e9b1d3f5a7c9e0b2d4f6a8c1e3b5d7f9a1c3e5b7d9f1a',
        summary: alert.notes || 'Automated AI detection flagged persistent coastal contact exhibiting anomalous kinematics.',
        uavCode: alert.event.uav.code,
        missionCode: alert.event.mission.code,
        zoneCode: alert.event.zone?.code || 'Z-01',
        zoneName: alert.event.zone?.name || 'Coastal Surveillance Sector',
        coordinates: { lat: alert.event.location.lat, lon: alert.event.location.lon },
        contactCode: alert.event.contact?.code,
        evidence: alert.evidence,
        rationale: alert.event.rationale,
        versions: alert.event.versions,
        auditTrail: alert.auditTrail,
        operatorNotes: alert.notes,
      };
    }

    return null;
  },

  async updateStatus(
    id: string,
    status: IncidentWorkflowStatus,
    note: string,
    officer: { id: string; name: string; role: UserRole }
  ): Promise<IncidentRecord> {
    await delay(100);
    const inc = LIVE_INCIDENTS.find(i => i.id === id || i.incidentCode === id || i.alertId === id);
    if (!inc) throw new Error('Incident not found');

    const previousStatus = inc.status;
    inc.status = status;
    inc.operatorNotes = note ? `${note} (Updated by ${officer.name})` : inc.operatorNotes;

    const auditEntry = await auditApi.append({
      userId: officer.id,
      userName: officer.name,
      userRole: officer.role,
      action: `INCIDENT_STATUS_${status}`,
      targetType: 'INCIDENT',
      targetId: inc.incidentCode,
      outcome: 'SUCCESS',
      beforeAfterSummary: `Incident status transition: ${previousStatus} -> ${status}. Note: ${note}`,
    });

    inc.auditTrail.unshift(auditEntry);
    return inc;
  },

  async markFalsePositive(
    id: string,
    reason: string,
    officer: { id: string; name: string; role: UserRole }
  ): Promise<IncidentRecord> {
    await delay(100);
    const inc = LIVE_INCIDENTS.find(i => i.id === id || i.incidentCode === id || i.alertId === id);
    if (!inc) throw new Error('Incident not found');

    inc.status = 'FALSE_POSITIVE';
    inc.falsePositiveReason = reason;
    inc.isAddedToCuratedDataset = true;

    const auditEntry = await auditApi.append({
      userId: officer.id,
      userName: officer.name,
      userRole: officer.role,
      action: 'MARKED_FALSE_POSITIVE',
      targetType: 'INCIDENT',
      targetId: inc.incidentCode,
      outcome: 'FLAGGED',
      beforeAfterSummary: `Marked false positive: "${reason}". Added to offline curated dataset queue. Will not modify deployed models automatically.`,
    });

    inc.auditTrail.unshift(auditEntry);
    return inc;
  },

  async verifySeal(id: string): Promise<{ verified: boolean; checkedCount: number; algorithm: string }> {
    await delay(250);
    const inc = await this.get(id);
    if (!inc) throw new Error('Incident not found');
    return {
      verified: true,
      checkedCount: (inc.evidence?.length ?? 0) > 0 ? inc.evidence.length : 6,
      algorithm: 'SHA-256 (NIST FIPS 180-4)',
    };
  },

  async exportPackage(
    id: string,
    purpose: string,
    officer: { id: string; name: string; badge: string; rank: string; role: UserRole; station: string }
  ) {
    const inc = await this.get(id);
    if (!inc) throw new Error('Incident not found');

    const result = await generateEvidencePackageZip({
      incident: inc,
      purpose,
      certifyingOfficer: {
        name: officer.name,
        badge: officer.badge,
        rank: officer.rank,
        station: officer.station,
      },
    });

    await auditApi.append({
      userId: officer.id,
      userName: officer.name,
      userRole: officer.role,
      action: 'EXPORTED_COURT_EVIDENCE_ZIP',
      targetType: 'INCIDENT',
      targetId: inc.incidentCode,
      outcome: 'SUCCESS',
      beforeAfterSummary: `Exported sealed ZIP evidence package (${result.filename}). Purpose: "${purpose}". Manifest SHA-256: ${result.manifestSha256.slice(0, 16)}...`,
    });

    return result;
  },
};

// ─── Phase 4: Administration & RBAC API ─────────────────────────────────────

const ADMIN_USERS: AdminUser[] = KERALA_POLICE_ROSTER.map((officer, i) => ({
  id: officer.id,
  username: officer.name.toLowerCase().replace(/[^a-z0-9]/g, '.'),
  fullName: officer.name,
  rankTitle: officer.rank,
  badgeNumber: officer.badgeNumber,
  station: officer.stationName,
  role: (
    i === 0 ? 'SYS_ADMIN' :
    i === 1 ? 'SUPERVISOR' :
    i === 2 ? 'OPERATOR' :
    i === 3 ? 'ZONE_ADMIN' :
    i === 4 ? 'MODEL_CUSTODIAN' :
    i === 5 ? 'AUDITOR' : 'ANALYST'
  ) as UserRole,
  status: 'ACTIVE',
  lastLoginAt: '2026-10-16T08:12:00+05:30',
  mfaEnabled: true,
  mfaType: i % 2 === 0 ? 'TOTP' : 'FIDO2_KEY',
  assignedZones: ['Z-01', 'Z-02', 'Z-03'],
  email: `${officer.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@keralapolice.gov.in`,
  phone: '+91 94979 ' + String(10000 + i * 234).slice(0, 5),
}));

let PERMISSIONS_MATRIX: Record<UserRole, Permission[]> = { ...DEFAULT_ROLE_PERMISSIONS };

const RETENTION_POLICIES: DataRetentionPolicy[] = [
  {
    id: 'ret-01',
    dataType: 'Raw Video Feed (Source H.264/H.265)',
    retentionDays: 7,
    storageLocation: 'Central SAN Node /mnt/video/raw',
    legalHoldEligible: true,
    isLegalHoldActive: false,
    purgeSchedule: 'Daily 03:00 IST automated FIFO purge',
    encryptionStandard: 'AES-256-GCM',
    description: 'Continuous continuous drone streams kept for tactical review window.',
  },
  {
    id: 'ret-02',
    dataType: 'Edge Circular Temp Buffers',
    retentionDays: 1,
    storageLocation: 'Edge Laptop NVMe /opt/sqeye/edge/ring',
    legalHoldEligible: false,
    isLegalHoldActive: false,
    purgeSchedule: 'Continuous 24-hour ring overwriting',
    encryptionStandard: 'LUKS2 Full-Disk Encryption',
    description: 'Local buffer on field laptops prior to central optical sync.',
  },
  {
    id: 'ret-03',
    dataType: 'Flagged Event Clips (Pre/Post Window)',
    retentionDays: 90,
    storageLocation: 'Central GPU Node Cluster /data/clips',
    legalHoldEligible: true,
    isLegalHoldActive: false,
    purgeSchedule: 'Weekly Sunday 04:00 IST purge',
    encryptionStandard: 'AES-256-GCM',
    description: '30s pre and post event video clips extracted by CFS / CKFE.',
  },
  {
    id: 'ret-04',
    dataType: 'CKFE Keyframe Evidence Images',
    retentionDays: 180,
    storageLocation: 'WORM Optical Mirror /mnt/evidence/keyframes',
    legalHoldEligible: true,
    isLegalHoldActive: false,
    purgeSchedule: 'Semi-annual archival rotation',
    encryptionStandard: 'AES-256-GCM + SHA-256 Seal',
    description: 'High-confidence keyframes linked to incident alerts.',
  },
  {
    id: 'ret-05',
    dataType: 'Contact Histories & Kinematic Trajectories',
    retentionDays: 180,
    storageLocation: 'PostgreSQL / TimescaleDB contact_history',
    legalHoldEligible: true,
    isLegalHoldActive: false,
    purgeSchedule: 'Monthly partition drop',
    encryptionStandard: 'TDE (Transparent Data Encryption)',
    description: 'Persistent coastal craft observations, headings, and zone crossings.',
  },
  {
    id: 'ret-06',
    dataType: 'Crowd Density Grids & AI Heatmaps',
    retentionDays: 365,
    storageLocation: 'Object Storage /data/analytics',
    legalHoldEligible: false,
    isLegalHoldActive: false,
    purgeSchedule: 'Annual audit archive',
    encryptionStandard: 'AES-256',
    description: 'Aggregated statistical density grids for beach and harbour monitoring.',
  },
  {
    id: 'ret-07',
    dataType: 'Formal Court ELIR Evidence Dossiers',
    retentionDays: 0, // Permanent
    storageLocation: 'Kerala State Data Centre (KSDC-Kochi WORM Archive)',
    legalHoldEligible: true,
    isLegalHoldActive: true,
    purgeSchedule: 'Permanent Immutable Preservation (7+ Years per BNSS Sec 63)',
    encryptionStandard: 'AES-256 + Tamper-Evident SHA-256 Hash Chain',
    description: 'Certified court dossiers with full chain of custody and officer tokens.',
  },
];

const BACKUP_DRILLS: BackupDrillRecord[] = [
  {
    id: 'drill-01',
    drillDate: '2026-10-15 03:00 IST',
    target: 'Full Database & Evidence Snapshot',
    backupType: 'FULL',
    rpoMinutesActual: 4.2,
    rpoMinutesTarget: 15.0,
    rtoMinutesActual: 22.4,
    rtoMinutesTarget: 60.0,
    status: 'PASSED',
    verifiedBy: 'DySP K. R. Harikrishnan (Cyber Division)',
    destinationMirror: 'KSDC-Kochi Offsite Optical Ring',
    notes: 'Zero loss drill. Database restore verified with checksum match on 10,480 items.',
  },
  {
    id: 'drill-02',
    drillDate: '2026-10-08 02:30 IST',
    target: 'Differential Evidence Store Mirror',
    backupType: 'INCREMENTAL',
    rpoMinutesActual: 3.8,
    rpoMinutesTarget: 15.0,
    rtoMinutesActual: 18.1,
    rtoMinutesTarget: 60.0,
    status: 'PASSED',
    verifiedBy: 'Thomas J. (IT Cell)',
    destinationMirror: 'Thiruvananthapuram Secondary Edge Node',
    notes: 'Incremental sync of 48.6 GB evidence packages completed in 18 minutes.',
  },
  {
    id: 'drill-03',
    drillDate: '2026-10-01 03:15 IST',
    target: 'WORM Optical Cold Storage Backup',
    backupType: 'SNAPSHOT',
    rpoMinutesActual: 6.5,
    rpoMinutesTarget: 15.0,
    rtoMinutesActual: 31.0,
    rtoMinutesTarget: 60.0,
    status: 'PASSED',
    verifiedBy: 'DySP K. R. Harikrishnan',
    destinationMirror: 'Cyber Forensics Air-Gapped Optical Library',
    notes: 'Physical write-once Blu-ray media burn drill verified for Section 65B compliance.',
  },
];

const ACTIVE_SESSIONS: ActiveSession[] = [
  {
    id: 'sess-01',
    userId: 'u-op1',
    userName: 'SI Ananya Ramesh',
    role: 'OPERATOR',
    ipAddress: '10.200.4.15',
    station: 'Vizhinjam Coastal Police Station',
    browser: 'Chromium 128 (Air-Gapped Workstation A)',
    loginAt: '2026-10-16T08:00:12+05:30',
    lastActivityAt: '2026-10-16T08:35:12+05:30',
    currentRoute: '/live',
    isCurrentSession: true,
  },
  {
    id: 'sess-02',
    userId: 'u-sup1',
    userName: 'CI Saji Varghese',
    role: 'SUPERVISOR',
    ipAddress: '10.200.4.12',
    station: 'Vizhinjam Coastal Police Station',
    browser: 'Chromium 128 (Duty Officer Terminal)',
    loginAt: '2026-10-16T07:45:00+05:30',
    lastActivityAt: '2026-10-16T08:34:00+05:30',
    currentRoute: '/alerts',
    isCurrentSession: false,
  },
  {
    id: 'sess-03',
    userId: 'u-zadm',
    userName: 'CI Krishna N.',
    role: 'ZONE_ADMIN',
    ipAddress: '10.200.4.8',
    station: 'Coastal Police HQ (Thiruvananthapuram)',
    browser: 'Firefox ESR 115 (Admin Desk)',
    loginAt: '2026-10-16T06:30:00+05:30',
    lastActivityAt: '2026-10-16T08:20:00+05:30',
    currentRoute: '/config/zones',
    isCurrentSession: false,
  },
  {
    id: 'sess-04',
    userId: 'u-aud1',
    userName: 'Inspector Rahul Menon',
    role: 'AUDITOR',
    ipAddress: '10.200.4.30',
    station: 'Cyber Division Drone Forensic Lab',
    browser: 'Chromium 128 (Forensic Terminal)',
    loginAt: '2026-10-16T08:10:00+05:30',
    lastActivityAt: '2026-10-16T08:32:00+05:30',
    currentRoute: '/audit',
    isCurrentSession: false,
  },
];

export const adminApi = {
  async listUsers(): Promise<AdminUser[]> {
    await delay(60);
    return ADMIN_USERS;
  },

  async updateUser(id: string, updates: Partial<AdminUser>, adminOfficer: { id: string; name: string }): Promise<AdminUser> {
    await delay(100);
    const user = ADMIN_USERS.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    Object.assign(user, updates);

    await auditApi.append({
      userId: adminOfficer.id,
      userName: adminOfficer.name,
      userRole: 'SYS_ADMIN',
      action: 'ADMIN_USER_UPDATED',
      targetType: 'USER',
      targetId: user.username,
      outcome: 'SUCCESS',
      beforeAfterSummary: `Officer profile ${user.fullName} updated by ${adminOfficer.name}.`,
    });
    return user;
  },

  async toggleUserStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED', adminOfficer: { id: string; name: string }): Promise<AdminUser> {
    await delay(100);
    const user = ADMIN_USERS.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    user.status = status;

    await auditApi.append({
      userId: adminOfficer.id,
      userName: adminOfficer.name,
      userRole: 'SYS_ADMIN',
      action: `USER_STATUS_${status}`,
      targetType: 'USER',
      targetId: user.username,
      outcome: 'SUCCESS',
      beforeAfterSummary: `Officer status changed to ${status} for ${user.fullName}.`,
    });
    return user;
  },

  async getPermissionsMatrix(): Promise<Record<UserRole, Permission[]>> {
    await delay(40);
    return { ...PERMISSIONS_MATRIX };
  },

  async updatePermissionsMatrix(
    newMatrix: Record<UserRole, Permission[]>,
    reason: string,
    adminOfficer: { id: string; name: string }
  ): Promise<Record<UserRole, Permission[]>> {
    await delay(120);
    PERMISSIONS_MATRIX = { ...newMatrix };

    await auditApi.append({
      userId: adminOfficer.id,
      userName: adminOfficer.name,
      userRole: 'SYS_ADMIN',
      action: 'RBAC_MATRIX_MODIFIED',
      targetType: 'SYSTEM',
      targetId: 'RBAC_SECURITY_MATRIX',
      outcome: 'SUCCESS',
      beforeAfterSummary: `RBAC permission matrix modified by ${adminOfficer.name}. Justification: "${reason}".`,
    });
    return PERMISSIONS_MATRIX;
  },

  async getDataRetentionPolicies(): Promise<DataRetentionPolicy[]> {
    await delay(50);
    return RETENTION_POLICIES;
  },

  async toggleLegalHold(policyId: string, active: boolean, adminOfficer: { id: string; name: string }): Promise<DataRetentionPolicy> {
    await delay(80);
    const policy = RETENTION_POLICIES.find(p => p.id === policyId);
    if (!policy) throw new Error('Policy not found');
    policy.isLegalHoldActive = active;

    await auditApi.append({
      userId: adminOfficer.id,
      userName: adminOfficer.name,
      userRole: 'SYS_ADMIN',
      action: active ? 'LEGAL_HOLD_ENGAGED' : 'LEGAL_HOLD_RELEASED',
      targetType: 'SYSTEM',
      targetId: policy.id,
      outcome: 'SUCCESS',
      beforeAfterSummary: `${active ? 'Engaged' : 'Released'} legal hold on ${policy.dataType}. Automatic pruning suspended.`,
    });
    return policy;
  },

  async getBackupDrills(): Promise<BackupDrillRecord[]> {
    await delay(50);
    return BACKUP_DRILLS;
  },

  async triggerBackupDrill(officer: { id: string; name: string }): Promise<BackupDrillRecord> {
    await delay(400);
    const newDrill: BackupDrillRecord = {
      id: `drill-${String(BACKUP_DRILLS.length + 1).padStart(2, '0')}`,
      drillDate: new Date().toISOString(),
      target: 'Live State Disaster Recovery Verification',
      backupType: 'INCREMENTAL',
      rpoMinutesActual: 3.6,
      rpoMinutesTarget: 15.0,
      rtoMinutesActual: 19.4,
      rtoMinutesTarget: 60.0,
      status: 'PASSED',
      verifiedBy: officer.name,
      destinationMirror: 'KSDC-Kochi Mirror (Optical Feed Sync)',
      notes: 'Scheduled operator drill simulated. SHA-256 state tree verified.',
    };
    BACKUP_DRILLS.unshift(newDrill);

    await auditApi.append({
      userId: officer.id,
      userName: officer.name,
      userRole: 'SYS_ADMIN',
      action: 'BACKUP_RECOVERY_DRILL_EXECUTED',
      targetType: 'SYSTEM',
      targetId: newDrill.id,
      outcome: 'SUCCESS',
      beforeAfterSummary: `Drill executed by ${officer.name}. RPO: 3.6m (Target: 15m), RTO: 19.4m (Target: 60m). Status: PASSED.`,
    });
    return newDrill;
  },

  async getActiveSessions(): Promise<ActiveSession[]> {
    await delay(40);
    return ACTIVE_SESSIONS;
  },

  async killSession(sessionId: string, adminOfficer: { id: string; name: string }): Promise<void> {
    await delay(100);
    const idx = ACTIVE_SESSIONS.findIndex(s => s.id === sessionId);
    if (idx !== -1) {
      const removed = ACTIVE_SESSIONS.splice(idx, 1)[0];
      await auditApi.append({
        userId: adminOfficer.id,
        userName: adminOfficer.name,
        userRole: 'SYS_ADMIN',
        action: 'SESSION_TERMINATED_BY_ADMIN',
        targetType: 'USER',
        targetId: removed.userId,
        outcome: 'SUCCESS',
        beforeAfterSummary: `Remote session killed for ${removed.userName} (${removed.ipAddress}) by ${adminOfficer.name}.`,
      });
    }
  },
};



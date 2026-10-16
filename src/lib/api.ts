// ============================================================
// SmartQEye Coastal — Typed API Client
// All data access goes through here.
// Swap the mock implementations for real fetch calls to
// FastAPI without changing any import in the rest of the app.
// ============================================================

import type {
  Alert, Contact, Zone, Mission, Feed, SystemHealth,
  CoastalEvent, User, AlertStatus, ZoneProfile,
} from '@/types';
import {
  ALERTS, CONTACTS, ZONES, MISSIONS, INITIAL_FEEDS,
  INITIAL_HEALTH, HISTORICAL_EVENTS, ZONE_PROFILES, UAVS,
} from './mockData';

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
    await delay();
    return ALERTS.find(a => a.id === id) ?? null;
  },

  async acknowledge(id: string, note?: string): Promise<Alert> {
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

// ─── Contacts ─────────────────────────────────────────────────

export const contactsApi = {
  async list(params: { page?: number; pageSize?: number; class_?: string; search?: string } = {}): Promise<Page<Contact>> {
    await delay();
    let items = [...CONTACTS];
    if (params.class_) items = items.filter(c => c.class === params.class_);
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(c => c.code.toLowerCase().includes(q) || c.classLabel.toLowerCase().includes(q));
    }
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 25;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize };
  },

  async get(id: string): Promise<Contact | null> {
    await delay();
    return CONTACTS.find(c => c.id === id || c.code === id) ?? null;
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
  { id: 'u-op1', username: 'op.rajan', fullName: 'Rajan K.', rankTitle: 'HC', role: 'OPERATOR', unitName: 'Coastal Control Room', email: 'rajan@kp.gov.in' },
  { id: 'u-an1', username: 'an.priya', fullName: 'Priya V.', rankTitle: 'ASI', role: 'ANALYST', unitName: 'Coastal Intelligence Cell' },
  { id: 'u-sup1', username: 'sup.menon', fullName: 'Menon R.', rankTitle: 'SI', role: 'SUPERVISOR', unitName: 'Coastal Police HQ' },
  { id: 'u-zadm', username: 'za.krishna', fullName: 'Krishna N.', rankTitle: 'CI', role: 'ZONE_ADMIN', unitName: 'Coastal Police HQ' },
  { id: 'u-sadm', username: 'sa.thomas', fullName: 'Thomas J.', rankTitle: 'IT Admin', role: 'SYS_ADMIN', unitName: 'IT Cell' },
  { id: 'u-mc1', username: 'mc.arun', fullName: 'Arun P.', rankTitle: 'Technical Expert', role: 'MODEL_CUSTODIAN', unitName: 'AI Cell' },
  { id: 'u-aud1', username: 'aud.seema', fullName: 'Seema M.', rankTitle: 'Superintendent', role: 'AUDITOR', unitName: 'Internal Audit' },
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

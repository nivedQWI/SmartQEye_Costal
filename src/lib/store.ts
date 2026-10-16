// ============================================================
// SmartQEye Coastal — Global UI State (Zustand)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Alert, Feed, TelemetrySample, SystemHealth, User, UserRole, Mission, Permission } from '@/types';
import { ALERTS, INITIAL_FEEDS, INITIAL_HEALTH, MISSIONS } from '@/lib/mockData';
import { authApi } from '@/lib/api';
import { DEFAULT_ROLE_PERMISSIONS, hasPermission as checkPermission } from '@/lib/permissions';

// ─── Theme ────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  resolveTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      resolved: 'light',
      setMode: (mode) => {
        set({ mode });
        get().resolveTheme();
      },
      resolveTheme: () => {
        const { mode } = get();
        let resolved: 'light' | 'dark';
        if (mode === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } else {
          resolved = mode;
        }
        set({ resolved });
        document.documentElement.setAttribute('data-theme', resolved);
      },
    }),
    { name: 'sqeye-theme' }
  )
);

// ─── Language (English / Malayalam) ───────────────────────────

export type Language = 'en' | 'ml';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    { name: 'sqeye-lang' }
  )
);

// ─── Auth / User ──────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  devRole: UserRole;  // dev-mode role switcher
  viewAsRole: UserRole | null; // "View as role" preview switcher
  customPermissions: Record<UserRole, Permission[]> | null;
  lastActiveAt: number;
  isIdleModalOpen: boolean;
  login: (username: string, password: string, mfaCode?: string) => Promise<void>;
  logout: () => void;
  setDevRole: (role: UserRole) => void;
  setViewAsRole: (role: UserRole | null) => void;
  setCustomPermissions: (matrix: Record<UserRole, Permission[]>) => void;
  hasPermission: (permission: Permission) => boolean;
  getEffectiveRole: () => UserRole;
  recordActivity: () => void;
  setIdleModalOpen: (open: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      devRole: 'OPERATOR',
      viewAsRole: null,
      customPermissions: null,
      lastActiveAt: Date.now(),
      isIdleModalOpen: false,

      login: async (username, password, mfaCode) => {
        const user = await authApi.login(username, password, mfaCode);
        set({
          user,
          isAuthenticated: true,
          devRole: user.role,
          viewAsRole: null,
          lastActiveAt: Date.now(),
          isIdleModalOpen: false,
        });
      },

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          viewAsRole: null,
          isIdleModalOpen: false,
        }),

      setDevRole: (devRole) => {
        const users = authApi.getMockUsers();
        const user = users.find(u => u.role === devRole) ?? users[0];
        set({ devRole, user, viewAsRole: null });
      },

      setViewAsRole: (viewAsRole) => set({ viewAsRole }),

      setCustomPermissions: (customPermissions) => set({ customPermissions }),

      getEffectiveRole: () => {
        const { viewAsRole, user, devRole } = get();
        return viewAsRole || user?.role || devRole;
      },

      hasPermission: (permission: Permission) => {
        const effectiveRole = get().getEffectiveRole();
        const matrix = get().customPermissions || DEFAULT_ROLE_PERMISSIONS;
        return checkPermission(effectiveRole, permission, matrix);
      },

      recordActivity: () => set({ lastActiveAt: Date.now() }),
      setIdleModalOpen: (isIdleModalOpen) => set({ isIdleModalOpen }),
    }),
    { name: 'sqeye-auth' }
  )
);


// ─── Alerts ──────────────────────────────────────────────────

interface AlertState {
  alerts: Alert[];
  criticalBanner: Alert | null;
  unreadCount: number;
  addAlert: (alert: Alert) => void;
  updateAlert: (alert: Alert) => void;
  dismissBanner: () => void;
  markRead: (ids: string[]) => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: ALERTS,
  criticalBanner: null,
  unreadCount: ALERTS.filter(a => a.status === 'NEW').length,

  addAlert: (alert) => {
    set(state => ({
      alerts: [alert, ...state.alerts],
      unreadCount: state.unreadCount + 1,
      criticalBanner: alert.severity === 'CRITICAL' && alert.status === 'NEW' ? alert : state.criticalBanner,
    }));
  },

  updateAlert: (alert) => {
    set(state => ({
      alerts: state.alerts.map(a => a.id === alert.id ? alert : a),
    }));
  },

  dismissBanner: () => {
    const banner = get().criticalBanner;
    if (banner) {
      set(state => ({
        criticalBanner: null,
        alerts: state.alerts.map(a => a.id === banner.id ? { ...a, status: 'ACKNOWLEDGED' } : a),
      }));
    }
  },

  markRead: (ids) => {
    set(state => ({
      unreadCount: Math.max(0, state.unreadCount - ids.length),
    }));
  },
}));

// ─── Feeds ───────────────────────────────────────────────────

interface FeedState {
  feeds: Feed[];
  telemetry: Record<string, TelemetrySample>;
  pinnedFeedIds: string[];
  activeFeedId: string | null;
  gridLayout: 1 | 4 | 9 | 16;
  modalityOverride: Record<string, 'RGB' | 'THERMAL' | 'SPLIT'>;
  updateFeed: (feed: Feed) => void;
  updateTelemetry: (sample: TelemetrySample) => void;
  pinFeed: (id: string) => void;
  unpinFeed: (id: string) => void;
  setActiveFeed: (id: string | null) => void;
  setGridLayout: (layout: 1 | 4 | 9 | 16) => void;
  setModalityOverride: (feedId: string, modality: 'RGB' | 'THERMAL' | 'SPLIT') => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  feeds: INITIAL_FEEDS,
  telemetry: {},
  pinnedFeedIds: INITIAL_FEEDS.filter(f => f.isPinned).map(f => f.id),
  activeFeedId: 'f-01',
  gridLayout: 4,
  modalityOverride: {},

  updateFeed: (feed) =>
    set(state => ({ feeds: state.feeds.map(f => f.id === feed.id ? feed : f) })),

  updateTelemetry: (sample) =>
    set(state => ({ telemetry: { ...state.telemetry, [sample.feedId]: sample } })),

  pinFeed: (id) =>
    set(state => ({
      pinnedFeedIds: state.pinnedFeedIds.includes(id) ? state.pinnedFeedIds : [...state.pinnedFeedIds, id],
    })),

  unpinFeed: (id) =>
    set(state => ({ pinnedFeedIds: state.pinnedFeedIds.filter(pid => pid !== id) })),

  setActiveFeed: (id) => set({ activeFeedId: id }),
  setGridLayout: (layout) => set({ gridLayout: layout }),
  setModalityOverride: (feedId, modality) =>
    set(state => ({ modalityOverride: { ...state.modalityOverride, [feedId]: modality } })),
}));

// ─── Map / GIS ───────────────────────────────────────────────

interface MapState {
  layers: {
    zones: boolean;
    drones: boolean;
    contacts: boolean;
    alerts: boolean;
    heatmap: boolean;
  };
  dronePositions: Record<string, { lat: number; lon: number; headingDeg: number }>;
  selectedZoneId: string | null;
  editingZoneId: string | null;
  toggleLayer: (key: keyof MapState['layers']) => void;
  updateDronePosition: (feedId: string, lat: number, lon: number, headingDeg: number) => void;
  setSelectedZone: (id: string | null) => void;
  setEditingZone: (id: string | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  layers: { zones: true, drones: true, contacts: true, alerts: true, heatmap: false },
  dronePositions: {},
  selectedZoneId: null,
  editingZoneId: null,

  toggleLayer: (key) =>
    set(state => ({ layers: { ...state.layers, [key]: !state.layers[key] } })),

  updateDronePosition: (feedId, lat, lon, headingDeg) =>
    set(state => ({
      dronePositions: { ...state.dronePositions, [feedId]: { lat, lon, headingDeg } },
    })),

  setSelectedZone: (id) => set({ selectedZoneId: id }),
  setEditingZone: (id) => set({ editingZoneId: id }),
}));

// ─── Health ──────────────────────────────────────────────────

interface HealthState {
  health: SystemHealth;
  updateHealth: (health: SystemHealth) => void;
}

export const useHealthStore = create<HealthState>((set) => ({
  health: INITIAL_HEALTH,
  updateHealth: (health) => set({ health }),
}));

// ─── Mission selector ─────────────────────────────────────────

interface MissionState {
  missions: Mission[];
  activeMissionId: string | null;
  setActiveMission: (id: string | null) => void;
}

export const useMissionStore = create<MissionState>((set) => ({
  missions: MISSIONS,
  activeMissionId: 'm-01',
  setActiveMission: (id) => set({ activeMissionId: id }),
}));

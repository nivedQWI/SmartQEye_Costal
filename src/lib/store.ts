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

// ─── Training Mode & Guided Tours (RFP §13; proposal 5.1.35) ───

export interface TrainingModule {
  id: string;
  name: string;
  description: string;
  targetRoute: string;
  tourId: string;
  estimatedMinutes: number;
}

export const TRAINING_MODULES: TrainingModule[] = [
  { id: 'tm-1', name: 'Command Dashboard & KPIs', description: 'Real-time overview of sorties, attention levels, and critical incidents.', targetRoute: '/', tourId: 'dashboard', estimatedMinutes: 3 },
  { id: 'tm-2', name: 'Live Multi-Drone Ingestion', description: 'Monitor RTSP streams, toggle CFS dynamic FPS, and inspect overlays.', targetRoute: '/live', tourId: 'live_monitor', estimatedMinutes: 4 },
  { id: 'tm-3', name: 'Incident Records & ELIR Dossiers', description: 'Investigate evidence frames, tamper seals, and Section 65B custody.', targetRoute: '/incidents', tourId: 'incidents', estimatedMinutes: 5 },
  { id: 'tm-4', name: 'GIS & Maritime Zone Breach', description: 'Geofence boundaries, prohibited zone alerts, and coordinate tracking.', targetRoute: '/map', tourId: 'gis_map', estimatedMinutes: 4 },
  { id: 'tm-5', name: 'Persistent Coastal Contacts', description: 'Multi-object ByteTrack tracking, re-identification, and behaviour timelines.', targetRoute: '/contacts', tourId: 'contacts', estimatedMinutes: 5 },
  { id: 'tm-6', name: 'Forensic History & Playback', description: 'Time-scrubbing telemetry, synchronized drone track replay, and export.', targetRoute: '/history', tourId: 'history', estimatedMinutes: 4 },
  { id: 'tm-7', name: 'Role-Based User Administration', description: 'Manage police officer profiles, PEN numbers, and RBAC matrix.', targetRoute: '/admin', tourId: 'admin', estimatedMinutes: 3 },
  { id: 'tm-8', name: 'System Deployment & Edge Nodes', description: 'Central GPU vs edge laptop topology, node failover, and queue health.', targetRoute: '/deployment', tourId: 'deployment', estimatedMinutes: 3 },
  { id: 'tm-9', name: 'AI Models & Dataset Lifecycle', description: 'Permissive frameworks, rollback targets, and feedback curation.', targetRoute: '/models', tourId: 'models', estimatedMinutes: 4 },
  { id: 'tm-10', name: 'Court-Admissible Report Generator', description: 'Export sealed Section 65B PDFs with digital SHA-256 signatures.', targetRoute: '/reports', tourId: 'reports', estimatedMinutes: 3 },
];

export interface TourStep {
  title: string;
  content: string;
  route?: string;
}

export const TOUR_DEFINITIONS: Record<string, { title: string; steps: TourStep[] }> = {
  dashboard: {
    title: 'Command Dashboard Tour',
    steps: [
      { title: 'Operational Command Header', content: 'Provides real-time drone sortie counts, battery telemetry, and mission profiles for Kerala Coastal Police.', route: '/' },
      { title: 'Active Alert & Attention Matrix', content: 'Categorises contacts by Operational Attention levels (ROUTINE, ATTENTION, ELEVATED, CRITICAL) per Rule 7.', route: '/' },
      { title: 'Fleet Health & Storage Bar', content: 'Monitors central GPU cluster VRAM, offline NVMe capacity, and active edge nodes.', route: '/' },
    ],
  },
  live_monitor: {
    title: 'Live Multi-Drone Ingestion Tour',
    steps: [
      { title: 'Multi-Feed Layout (1 / 4 / 9 / 16)', content: 'Switch between quad-view and priority focus views with zero dropped frames.', route: '/live' },
      { title: 'Cognitive Frame Selection (CFS)', content: 'Dynamic FPS scaling (8–25 FPS) automatically saves up to 68% VRAM on quiescent ocean expanses.', route: '/live' },
      { title: 'RGB & Thermal Modality Switch', content: 'Toggle between HD optical and long-wave infrared (LWIR) simulated ironbow sensors for night patrols.', route: '/live' },
    ],
  },
  incidents: {
    title: 'Evidence-Linked Incident Records (ELIR) Tour',
    steps: [
      { title: 'ELIR Dossier Generation', content: 'Every operational breach automatically produces a unique INC-YYYYMMDD-nnnn electronic dossier.', route: '/incidents' },
      { title: 'CKFE Evidence Keyframes', content: 'Cognitive Keyframe Extraction selects the 3 most salient pre/post-roll frames with burn-in HUD telemetry.', route: '/incidents' },
      { title: 'Section 65B Forensic Integrity', content: 'Calculates SHA-256 hash seals on client-side and packages all evidence into a tamper-evident ZIP.', route: '/incidents' },
    ],
  },
  gis_map: {
    title: 'GIS & Maritime Zone Tour',
    steps: [
      { title: 'Kerala Coastline Spatial GIS', content: 'Offline vector map with nautical depth contours and high-risk fishing corridors.', route: '/map' },
      { title: 'Prohibited & Geofenced Zones', content: 'Monitors 5 NM Territorial Waters, Vizhinjam Port approaches, and sensitive naval exclusion zones.', route: '/map' },
      { title: 'Live Drone & Contact Tracks', content: 'Visualises heading vectors, speeds in knots, and historical Breadcrumb trajectories.', route: '/map' },
    ],
  },
  contacts: {
    title: 'Persistent Coastal Contacts Tour',
    steps: [
      { title: 'Persistent Contact Registry', content: 'ByteTrack multi-object tracking maintains identity across occlusions, breaking surf, and camera pans.', route: '/contacts' },
      { title: 'Kerala Maritime Craft Taxonomy', content: 'Hierarchical classification separates Mechanised Trawlers, Motorised Country Craft, and Catamarans.', route: '/contacts' },
      { title: 'Contact Relationship Graph', content: 'Visualises vessel-to-vessel rendezvous and prolonged proximity without jumping to conclusions.', route: '/contacts' },
    ],
  },
  history: {
    title: 'Historical Playback & Forensic Review Tour',
    steps: [
      { title: 'Synchronised Timeline Scrubber', content: 'Replay multi-drone sorties frame-by-frame with synchronous telemetry alignment.', route: '/history' },
      { title: 'Zone Breach Markers', content: 'Jump directly to attention spikes and boundary breach events on the master timeline.', route: '/history' },
      { title: 'Court-Ready Telemetry CSV Export', content: 'Export GPS coordinates, altitudes, and heading logs for cyber forensic examination.', route: '/history' },
    ],
  },
  admin: {
    title: 'User & RBAC Administration Tour',
    steps: [
      { title: 'Kerala Police Officer Profiles', content: 'Manage officer PEN identifiers, coastal police stations, and active duty assignments.', route: '/admin' },
      { title: 'Granular Role Capability Matrix', content: 'Strictly separate OPERATOR, ANALYST, SUPERVISOR, MODEL_CUSTODIAN, and SYS_ADMIN rights.', route: '/admin' },
      { title: 'Active Session Termination', content: 'Administrative kill-switch terminates rogue or compromised operator sessions instantly.', route: '/admin' },
    ],
  },
  deployment: {
    title: 'Deployment & Edge Architecture Tour',
    steps: [
      { title: 'Central GPU vs Edge Laptop Topology', content: 'Review the 4 deployment models supported by the SmartQEye platform per Proposal 6.6.', route: '/deployment' },
      { title: 'Node Health & Queue Depth', content: 'Real-time telemetry on edge ingestion lag, network bandwidth, and model bundle synchronization.', route: '/deployment' },
      { title: 'Air-Gapped Operation', content: 'Demonstrates zero reliance on external CDNs or cloud APIs for high-security police networks.', route: '/deployment' },
    ],
  },
  models: {
    title: 'AI Models & Governance Tour',
    steps: [
      { title: '100% Permissive Frameworks', content: 'Verified zero AGPL-3.0 Ultralytics YOLO code; runs RTMDet, RT-DETRv2, and ByteTrack.', route: '/models' },
      { title: 'One-Click Production Rollback', content: 'Safely revert to previous validated model versions with mandatory audit justification.', route: '/models' },
      { title: 'Human-in-the-Loop Feedback Curation', content: 'Operator corrections go to an offline dataset queue and never alter live weights automatically.', route: '/models' },
    ],
  },
  reports: {
    title: 'Reports & Section 65B Attestation Tour',
    steps: [
      { title: 'Official Kerala Police Templates', content: '9 formal report templates including Daily Incident Summaries and Drone Sortie Audits.', route: '/reports' },
      { title: 'Section 65B Legal Attestation', content: 'Automatic inclusion of Indian Evidence Act electronic certificates with SHA-256 seal.', route: '/reports' },
      { title: 'Client-Side PDF Generation', content: 'Exports court-admissible PDFs with official letterhead, running footers, and signature blocks.', route: '/reports' },
    ],
  },
};

interface TrainingState {
  isTrainingMode: boolean;
  completedModuleIds: string[];
  activeTourId: string | null;
  tourStepIndex: number;
  toggleTrainingMode: () => void;
  setTrainingMode: (enabled: boolean) => void;
  markModuleComplete: (moduleId: string) => void;
  resetTrainingProgress: () => void;
  startTour: (tourId: string) => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  endTour: () => void;
}

export const useTrainingStore = create<TrainingState>((set, get) => ({
  isTrainingMode: false,
  completedModuleIds: ['tm-1', 'tm-2'],
  activeTourId: null,
  tourStepIndex: 0,

  toggleTrainingMode: () => set(state => ({ isTrainingMode: !state.isTrainingMode })),
  setTrainingMode: (enabled) => set({ isTrainingMode: enabled }),

  markModuleComplete: (moduleId) => set(state => ({
    completedModuleIds: state.completedModuleIds.includes(moduleId)
      ? state.completedModuleIds
      : [...state.completedModuleIds, moduleId],
  })),

  resetTrainingProgress: () => set({
    completedModuleIds: [],
    activeTourId: null,
    tourStepIndex: 0,
  }),

  startTour: (tourId) => set({
    activeTourId: tourId,
    tourStepIndex: 0,
  }),

  nextTourStep: () => {
    const { activeTourId, tourStepIndex } = get();
    if (!activeTourId) return;
    const tour = TOUR_DEFINITIONS[activeTourId];
    if (tour && tourStepIndex < tour.steps.length - 1) {
      set({ tourStepIndex: tourStepIndex + 1 });
    } else {
      set({ activeTourId: null, tourStepIndex: 0 });
    }
  },

  prevTourStep: () => {
    const { tourStepIndex } = get();
    if (tourStepIndex > 0) {
      set({ tourStepIndex: tourStepIndex - 1 });
    }
  },

  endTour: () => set({ activeTourId: null, tourStepIndex: 0 }),
}));


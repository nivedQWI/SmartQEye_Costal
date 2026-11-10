// ============================================================
// SmartQEye Coastal — Global UI State (Zustand)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Alert, Feed, TelemetrySample, SystemHealth, User, UserRole, Mission, Permission, MissionSortie, VideoSourceType } from '@/types';
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
  toggleTheme: () => void;
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
      toggleTheme: () => {
        const next = get().resolved === 'dark' ? 'light' : 'dark';
        set({ mode: next, resolved: next });
        document.documentElement.setAttribute('data-theme', next);
        document.documentElement.classList.toggle('dark', next === 'dark');
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
        document.documentElement.classList.toggle('dark', resolved === 'dark');
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
  acknowledgeAlert: (id: string) => void;
  dismissBanner: () => void;
  markRead: (ids: string[]) => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
// expose for resilient API lookup

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

  acknowledgeAlert: (id) => {
    set(state => ({
      alerts: state.alerts.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a),
      unreadCount: Math.max(0, state.unreadCount - 1),
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

export interface AddFeedInput {
  label: string;
  videoSrc: string;
  uavCode?: string;
  missionCode?: string;
  modality?: 'RGB' | 'THERMAL' | 'NIGHT_VISION';
  streamType?: 'RTSP' | 'RTMP' | 'HLS' | 'MP4';
  portId?: string;
}

interface FeedState {
  feeds: Feed[];
  telemetry: Record<string, TelemetrySample>;
  pinnedFeedIds: string[];
  activeFeedId: string | null;
  gridLayout: 1 | 4 | 9 | 16;
  modalityOverride: Record<string, 'RGB' | 'THERMAL' | 'SPLIT'>;
  addFeed: (input: AddFeedInput) => void;
  syncMissionFeed: (sortie: MissionSortie) => void;
  attachStreamToFeed: (feedId: string, url: string, streamType?: 'RTSP' | 'RTMP' | 'HLS' | 'MP4') => void;
  terminateFeed: (id: string) => void;
  resumeFeed: (id: string) => void;
  removeFeed: (id: string) => void;
  restoreDefaultFeeds: () => void;
  updateFeed: (feed: Feed) => void;
  updateTelemetry: (sample: TelemetrySample) => void;
  pinFeed: (id: string) => void;
  unpinFeed: (id: string) => void;
  setActiveFeed: (id: string | null) => void;
  setGridLayout: (layout: 1 | 4 | 9 | 16) => void;
  setModalityOverride: (feedId: string, modality: 'RGB' | 'THERMAL' | 'SPLIT') => void;
}

function detectStreamType(url: string): 'RTSP' | 'RTMP' | 'HLS' | 'MP4' {
  if (url.startsWith('rtsp://')) return 'RTSP';
  if (url.startsWith('rtmp://')) return 'RTMP';
  if (url.includes('.m3u8')) return 'HLS';
  return 'MP4';
}

export const useFeedStore = create<FeedState>()(
  persist(
    (set, get) => ({
      // ONLY mission-ingested feeds are shown (no hardcoded folder video feeds)
      feeds: [],
      telemetry: {},
      pinnedFeedIds: [],
      activeFeedId: null,
      gridLayout: 4,
      modalityOverride: {},

      addFeed: (input) => {
        const hasSrc = Boolean(input.videoSrc && input.videoSrc.trim());
        const type = input.streamType || (hasSrc ? detectStreamType(input.videoSrc) : 'RTMP');
        const newId = `feed-custom-${Date.now()}`;
        const uav = input.uavCode || `UAV-${String(get().feeds.length + 1).padStart(2, '0')}`;
        const newFeed: Feed = {
          id: newId,
          uavCode: uav,
          missionCode: input.missionCode || 'M-2026-LIVE',
          label: input.label || `${uav} Live Feed`,
          modality: input.modality || 'RGB',
          state: hasSrc ? 'LIVE' : 'NO_SIGNAL',
          streamUrl: hasSrc ? input.videoSrc : undefined,
          videoSrc: hasSrc ? input.videoSrc : '',
          streamType: hasSrc ? type : undefined,
          isTerminated: false,
          latencyMs: hasSrc ? (type === 'RTSP' || type === 'RTMP' ? 140 : 45) : undefined,
          fpsCurrent: hasSrc ? 30 : 0,
          fpsTarget: 30,
          bitrateMbps: hasSrc ? 4.5 : 0,
          resolution: hasSrc ? '1920x1080' : 'N/A',
          lastFrameAt: hasSrc ? new Date().toISOString() : undefined,
        };
        set(state => ({
          feeds: [newFeed, ...state.feeds],
          activeFeedId: newId,
        }));
      },

      syncMissionFeed: (sortie) => {
        const hasStream = Boolean(sortie.videoSourceUrl && sortie.videoSourceUrl.trim());
        const type = sortie.videoSourceType === 'UPLOAD' ? 'MP4' : (sortie.videoSourceType as 'RTSP' | 'RTMP' | 'HLS' | 'MP4');
        const feedId = sortie.id;

        const newFeed: Feed = {
          id: feedId,
          uavCode: sortie.droneCode,
          missionCode: sortie.missionId,
          label: sortie.name,
          modality: 'RGB',
          state: hasStream ? 'LIVE' : 'NO_SIGNAL',
          streamUrl: hasStream ? sortie.videoSourceUrl : undefined,
          videoSrc: hasStream ? sortie.videoSourceUrl : '',
          streamType: hasStream ? type : undefined,
          isTerminated: false,
          latencyMs: hasStream ? (type === 'RTSP' || type === 'RTMP' ? 140 : 45) : undefined,
          fpsCurrent: hasStream ? 30 : 0,
          fpsTarget: 30,
          bitrateMbps: hasStream ? 4.5 : 0,
          resolution: hasStream ? '1920x1080' : 'N/A',
          lastFrameAt: hasStream ? new Date().toISOString() : undefined,
        };

        set(state => {
          const exists = state.feeds.some(f => f.id === feedId);
          const nextFeeds = exists
            ? state.feeds.map(f => (f.id === feedId ? { ...f, ...newFeed } : f))
            : [newFeed, ...state.feeds];
          return {
            feeds: nextFeeds,
            activeFeedId: state.activeFeedId ?? feedId,
          };
        });
      },

      attachStreamToFeed: (feedId, url, streamType) => {
        const type = streamType || detectStreamType(url);
        set(state => ({
          feeds: state.feeds.map(f => {
            if (f.id !== feedId) return f;
            return {
              ...f,
              videoSrc: url,
              streamUrl: url,
              streamType: type,
              state: 'LIVE',
              isTerminated: false,
              latencyMs: type === 'RTSP' || type === 'RTMP' ? 140 : 45,
              fpsCurrent: 30,
              fpsTarget: 30,
              bitrateMbps: 4.5,
              resolution: '1920x1080',
              lastFrameAt: new Date().toISOString(),
            };
          }),
        }));
      },

      terminateFeed: (id) =>
        set(state => ({
          feeds: state.feeds.map(f =>
            f.id === id ? { ...f, state: 'TERMINATED', isTerminated: true } : f
          ),
        })),

      resumeFeed: (id) =>
        set(state => ({
          feeds: state.feeds.map(f =>
            f.id === id ? { ...f, state: f.videoSrc ? 'LIVE' : 'NO_SIGNAL', isTerminated: false } : f
          ),
        })),

      removeFeed: (id) =>
        set(state => ({
          feeds: state.feeds.filter(f => f.id !== id),
          activeFeedId: state.activeFeedId === id ? (state.feeds.filter(f => f.id !== id)[0]?.id ?? null) : state.activeFeedId,
        })),

      restoreDefaultFeeds: () => {
        // Sync purely from active missions (no folder feeds)
        const activeSorties = useMissionStore.getState().activeMissions;
        const missionFeeds: Feed[] = activeSorties.map(s => {
          const hasStream = Boolean(s.videoSourceUrl && s.videoSourceUrl.trim());
          const type = s.videoSourceType === 'UPLOAD' ? 'MP4' : (s.videoSourceType as 'RTSP' | 'RTMP' | 'HLS' | 'MP4');
          return {
            id: s.id,
            uavCode: s.droneCode,
            missionCode: s.missionId,
            label: s.name,
            modality: 'RGB',
            state: hasStream ? 'LIVE' : 'NO_SIGNAL',
            streamUrl: hasStream ? s.videoSourceUrl : undefined,
            videoSrc: hasStream ? s.videoSourceUrl : '',
            streamType: hasStream ? type : undefined,
            isTerminated: false,
            fpsCurrent: hasStream ? 30 : 0,
            fpsTarget: 30,
            bitrateMbps: hasStream ? 4.5 : 0,
            resolution: hasStream ? '1920x1080' : 'N/A',
            lastFrameAt: hasStream ? new Date().toISOString() : undefined,
          };
        });
        set({
          feeds: missionFeeds,
          activeFeedId: missionFeeds[0]?.id ?? null,
        });
      },

      updateFeed: (feed) =>
        set(state => ({ feeds: state.feeds.map(f => (f.id === feed.id ? feed : f)) })),

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
    }),
    {
      name: 'sqeye-mission-feeds-v3',
      partialize: (state) => ({
        feeds: state.feeds,
        pinnedFeedIds: state.pinnedFeedIds,
      }),
    }
  )
);

// ─── Map / GIS ───────────────────────────────────────────────

interface MapState {
  layers: {
    zones: boolean;
    drones: boolean;
    alerts: boolean;
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
  layers: { zones: true, drones: true, alerts: true },
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
  activeMissions: MissionSortie[];
  historyMissions: MissionSortie[];
  setActiveMission: (id: string | null) => void;
  startMission: (sortie: MissionSortie) => void;
  stopMission: (id: string) => void;
  attachStreamToMission: (id: string, url: string, type?: VideoSourceType) => void;
  deleteHistoryMission: (id: string) => void;
}

export const useMissionStore = create<MissionState>()(
  persist(
    (set, get) => ({
      missions: MISSIONS,
      activeMissionId: 'm-01',
      activeMissions: [],
      historyMissions: [
        {
          id: 'msn-h-1',
          missionId: 'MSN-20261012-1430-00-BRAVO',
          name: 'Kovalam Tourist Beach Perimeter Scan',
          droneId: 'uav-02',
          droneCode: 'UAV-02',
          squadron: 'BRAVO',
          videoSourceType: 'RTSP',
          pilotName: 'SI Manesh V.',
          location: 'Kovalam Light House Beach',
          status: 'COMPLETED',
          serverIngestion: true,
          cognitiveBypass: false,
          startedAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
          endedAt: new Date(Date.now() - 21 * 3600 * 1000).toISOString(),
          durationMin: 58,
        },
        {
          id: 'msn-h-2',
          missionId: 'MSN-20261012-0915-00-ALPHA',
          name: 'Poovar Estuary Joint Maritime Patrol',
          droneId: 'uav-03',
          droneCode: 'UAV-03',
          squadron: 'ALPHA',
          videoSourceType: 'RTMP',
          pilotName: 'ASI Pradeep K.',
          location: 'Poovar Golden Sand Estuary',
          status: 'COMPLETED',
          serverIngestion: true,
          cognitiveBypass: false,
          startedAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
          endedAt: new Date(Date.now() - 27 * 3600 * 1000).toISOString(),
          durationMin: 74,
        },
        {
          id: 'msn-h-3',
          missionId: 'MSN-20261011-1820-00-CHARLIE',
          name: 'Vizhinjam International Terminal Basin Night Patrol',
          droneId: 'uav-04',
          droneCode: 'UAV-04',
          squadron: 'CHARLIE',
          videoSourceType: 'UPLOAD',
          srtFileName: 'DJI_0442_Vizhinjam.srt',
          pilotName: 'SI Ramesh Kumar',
          location: 'Vizhinjam Terminal Breakwater',
          status: 'COMPLETED',
          serverIngestion: true,
          cognitiveBypass: true,
          startedAt: new Date(Date.now() - 44 * 3600 * 1000).toISOString(),
          endedAt: new Date(Date.now() - 43 * 3600 * 1000).toISOString(),
          durationMin: 62,
        },
      ],

      setActiveMission: (id) => set({ activeMissionId: id }),

      startMission: (sortie) => {
        set(state => ({
          activeMissions: [sortie, ...state.activeMissions],
        }));
        // Sync feed into useFeedStore
        useFeedStore.getState().syncMissionFeed(sortie);
      },

      stopMission: (id) => {
        const mission = get().activeMissions.find(m => m.id === id);
        if (!mission) return;
        const completed: MissionSortie = {
          ...mission,
          status: 'COMPLETED',
          endedAt: new Date().toISOString(),
        };
        set(state => ({
          activeMissions: state.activeMissions.filter(m => m.id !== id),
          historyMissions: [completed, ...state.historyMissions],
        }));
        // Remove from active feeds
        useFeedStore.getState().removeFeed(id);
      },

      attachStreamToMission: (id, url, type = 'RTMP') => {
        set(state => ({
          activeMissions: state.activeMissions.map(m =>
            m.id === id ? { ...m, videoSourceUrl: url, videoSourceType: type } : m
          ),
        }));
        useFeedStore.getState().attachStreamToFeed(id, url, type === 'UPLOAD' ? 'MP4' : (type as any));
      },

      deleteHistoryMission: (id) =>
        set(state => ({
          historyMissions: state.historyMissions.filter(m => m.id !== id),
        })),
    }),
    {
      name: 'sqeye-missions-v3',
      partialize: (state) => ({
        activeMissions: state.activeMissions,
        historyMissions: state.historyMissions,
      }),
    }
  )
);

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
  { id: 'tm-1', name: 'Command Dashboard & KPIs', description: 'Real-time overview of missions, attention levels, and critical incidents.', targetRoute: '/', tourId: 'dashboard', estimatedMinutes: 3 },
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
      { title: 'Cognitive Frame Selection (CFS)', content: 'Dynamic FPS scaling (8—œ25 FPS) automatically saves up to 68% VRAM on quiescent ocean expanses.', route: '/live' },
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
      { title: 'Synchronised Timeline Scrubber', content: 'Replay multi-drone missions frame-by-frame with synchronous telemetry alignment.', route: '/history' },
      { title: 'Zone Breach Markers', content: 'Jump directly to attention spikes and boundary breach events on the master timeline.', route: '/history' },
      { title: 'Court-Ready Telemetry CSV Export', content: 'Export GPS coordinates, altitudes, and heading logs for cyber forensic examination.', route: '/history' },
    ],
  },
  admin: {
    title: 'User & RBAC Administration Tour',
    steps: [
      { title: 'Kerala Police Officer Profiles', content: 'Manage officer PEN identifiers, coastal police stations, and active duty assignments.', route: '/admin' },
      { title: 'Granular Role Capability Matrix', content: 'Strictly separate OPERATOR, SUPERVISOR, SYS_ADMIN, and AUDITOR rights.', route: '/admin' },
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
      { title: '100% Permissive Frameworks', content: 'Verified zero copyleft AGPL-3.0 code; runs Apache-2.0 RTMDet, RT-DETRv2, and ByteTrack.', route: '/models' },
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


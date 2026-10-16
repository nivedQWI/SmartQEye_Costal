// ============================================================
// SmartQEye Coastal — Typed Runtime Configuration Accessor
// Resolves configuration values in priority order:
// 1. window.__SMARTQEYE_CONFIG__ (injected via Docker / config.js)
// 2. import.meta.env (Vite build-time environment variables)
// 3. Fallback defaults
// ============================================================

export interface SmartQEyeRuntimeConfig {
  API_MODE: 'mock' | 'live';
  API_BASE_URL: string;
  WS_BASE_URL: string;
  MAP_TILE_URL: string;
  ORGANIZATION_NAME: string;
  STATION_NAME: string;
  APP_VERSION: string;
  DEMO_MODE: boolean;
  ENABLE_OPTIONAL_MODULES: boolean;
}

declare global {
  interface Window {
    __SMARTQEYE_CONFIG__?: Partial<SmartQEyeRuntimeConfig>;
  }
}

const DEFAULT_CONFIG: SmartQEyeRuntimeConfig = {
  API_MODE: (import.meta.env.VITE_API_MODE as 'mock' | 'live') || 'mock',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  WS_BASE_URL: import.meta.env.VITE_WS_BASE_URL || 'ws://127.0.0.1:8000/ws',
  MAP_TILE_URL: import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  ORGANIZATION_NAME: 'Kerala Police Coastal Division',
  STATION_NAME: 'Vizhinjam Coastal Police Station',
  APP_VERSION: '0.9.0-prod-mvp',
  DEMO_MODE: true,
  ENABLE_OPTIONAL_MODULES: true,
};

export function getRuntimeConfig(): SmartQEyeRuntimeConfig {
  const runtime = typeof window !== 'undefined' ? window.__SMARTQEYE_CONFIG__ || {} : {};
  return {
    ...DEFAULT_CONFIG,
    ...runtime,
  };
}

export const runtimeConfig = getRuntimeConfig();

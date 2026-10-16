// ============================================================
// SmartQEye Coastal — Runtime Environment Configuration
// Loaded before the SPA bundle initializes.
// In containerized deployments, this file can be generated dynamically
// by the container entrypoint from environment variables without rebuilding the image.
// ============================================================

window.__SMARTQEYE_CONFIG__ = {
  // Mode: "mock" | "live"
  API_MODE: "mock",

  // Base URL for the FastAPI backend in live mode
  API_BASE_URL: "http://127.0.0.1:8000/api/v1",

  // WebSocket base URL for real-time telemetry and alerts stream
  WS_BASE_URL: "ws://127.0.0.1:8000/ws",

  // Tile server URL for offline MapLibre tiles
  MAP_TILE_URL: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",

  // Station and agency branding
  ORGANIZATION_NAME: "Kerala Police Coastal Division",
  STATION_NAME: "Vizhinjam Coastal Police Station",
  APP_VERSION: "0.9.0-prod-mvp",

  // Operational guardrails
  DEMO_MODE: true,
  ENABLE_OPTIONAL_MODULES: true,
};

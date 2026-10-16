/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAP_TILE_URL?: string;
  readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __BUILD_HASH__: string;

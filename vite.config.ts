import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

import { execSync } from 'node:child_process'

let buildHash = 'dev'
try {
  buildHash = execSync('git rev-parse --short HEAD').toString().trim()
} catch {
  buildHash = '1984557'
}

export default defineConfig({
  define: {
    __BUILD_HASH__: JSON.stringify(buildHash),
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
})

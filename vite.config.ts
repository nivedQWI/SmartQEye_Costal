import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

import { execSync } from 'node:child_process'

import fs from 'node:fs'
import path from 'node:path'

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
    {
      name: 'serve-coastal-videos',
      configureServer(server) {
        server.middlewares.use('/videos', (req, res, next) => {
          const videoDir = path.resolve(__dirname, '../SmartQEye_Costal_Videos')
          const fileName = decodeURIComponent((req.url || '').replace(/^\//, '').split('?')[0])
          const filePath = path.join(videoDir, fileName)
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const stat = fs.statSync(filePath)
            const range = req.headers.range
            res.setHeader('Content-Type', 'video/mp4')
            res.setHeader('Accept-Ranges', 'bytes')

            if (range) {
              const parts = range.replace(/bytes=/, '').split('-')
              const start = parseInt(parts[0], 10)
              const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
              const chunkSize = end - start + 1
              res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4',
              })
              fs.createReadStream(filePath, { start, end }).pipe(res)
            } else {
              res.setHeader('Content-Length', stat.size)
              fs.createReadStream(filePath).pipe(res)
            }
          } else {
            next()
          }
        })
      },
    },
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

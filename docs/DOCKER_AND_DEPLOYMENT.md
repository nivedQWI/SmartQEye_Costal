# Docker Containerization & Deployment Guide

SmartQEye Coastal is fully containerized using Docker and Docker Compose, offering both high-performance production Nginx deployment and isolated containerized development with hot module replacement.

---

## 1. Quick Start Commands

### Option A: Run Production Container (Recommended for Customer Demo)
```bash
# Build and start the production container in the background
docker compose up -d --build smartqeye-coastal

# Access the application at:
http://localhost:8080
```

### Option B: Run Development Container (With Hot-Reloading)
```bash
# Build and start the development container
docker compose --profile dev up -d --build smartqeye-coastal-dev

# Access the dev environment at:
http://localhost:5174
```

### Option C: Run Locally (Native Node.js)
```bash
# Install exact dependencies
npm ci

# Start the Vite development server
npm run dev

# Access the local dev server at:
http://localhost:5173
```

---

## 2. Docker Architecture

### Multi-Stage `Dockerfile`

The `Dockerfile` is structured into three clean stages:

1. **Stage 1 (`builder`):**
   - Base image: `node:22-alpine`
   - Executes `npm ci` and compiles TypeScript and bundles assets with Vite (`npm run build`).
2. **Stage 2 (`runner`):**
   - Base image: `nginx:alpine`
   - Copies production assets from the `builder` stage directly into `/usr/share/nginx/html`.
   - Injects security headers, Gzip compression, and Single Page Application fallback routing via `nginx.conf`.
   - Exposes HTTP port `80` (mapped to `8080` on host).
   - Configures automatic health checking against `http://127.0.0.1/healthz`.
3. **Stage 3 (`dev`):**
   - Base image: `node:22-alpine`
   - Runs `npm run dev -- --host 0.0.0.0` with volume mounts for live editing without rebuilds.
   - Exposes port `5173` (mapped to `5174` on host to prevent port collisions).

---

## 3. `docker-compose.yml` Specification

```yaml
services:
  smartqeye-coastal:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
      args:
        - VITE_MAP_TILE_URL=${VITE_MAP_TILE_URL:-}
    image: smartqeye-coastal:latest
    container_name: smartqeye-coastal-app
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production

  smartqeye-coastal-dev:
    build:
      context: .
      dockerfile: Dockerfile
      target: dev
    image: smartqeye-coastal:dev
    container_name: smartqeye-coastal-dev
    ports:
      - "5174:5173"
    volumes:
      - ./src:/app/src
      - ./public:/app/public
      - ./index.html:/app/index.html
    environment:
      - NODE_ENV=development
    profiles:
      - dev
```

---

## 4. Nginx Production Tuning (`nginx.conf`)

The production container includes enterprise-grade optimizations:

- **Security Headers:**
  - `X-Frame-Options: SAMEORIGIN` (prevents external clickjacking).
  - `X-XSS-Protection: 1; mode=block` (browser XSS filtering).
  - `X-Content-Type-Options: nosniff` (MIME sniffing protection).
  - `Referrer-Policy: strict-origin-when-cross-origin`.
- **Static Asset Caching:** Long-term caching headers (`max-age=31536000, immutable`) for hash-versioned JS, CSS, fonts, and images.
- **SPA Fallback Routing:** All non-file URI requests fall back gracefully to `index.html` via `try_files $uri $uri/ /index.html;`, ensuring client-side React Router functions without 404s.
- **Automated Health Check:** `GET /healthz` returns `HTTP 200 OK` for container orchestrators and load balancers.

---

## 5. Verification Commands

| Goal | Command | Expected Result |
| :--- | :--- | :--- |
| **Check Container Health** | `docker ps --filter "name=smartqeye"` | Status: `Up ... (healthy)` |
| **Inspect Nginx Logs** | `docker logs smartqeye-coastal-app` | Zero error messages |
| **Test HTTP Response** | `curl -I http://localhost:8080` | `HTTP/1.1 200 OK` |
| **Verify Lint** | `npm run lint` | 0 errors |
| **Verify Production Build** | `npm run build` | 0 errors |


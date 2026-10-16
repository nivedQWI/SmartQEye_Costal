# ============================================================
# SmartQEye Coastal — Production Multi-Stage Dockerfile
# ============================================================

# ─── Stage 1: Build Frontend Assets ───────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json ./

# Clean install dependencies based on package-lock.json
RUN npm ci

# Copy source code and config
COPY . .

# Optional build-time argument for map tiles or backend URLs
ARG VITE_MAP_TILE_URL=""
ENV VITE_MAP_TILE_URL=${VITE_MAP_TILE_URL}

# Compile TypeScript and bundle with Vite
RUN npm run build

# ─── Stage 2: Production Nginx Server ─────────────────────────
FROM nginx:alpine AS runner

WORKDIR /usr/share/nginx/html

# Clean default Nginx files
RUN rm -rf ./*

# Copy customized Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist .

# Expose HTTP port 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/healthz || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

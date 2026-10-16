# ============================================================
# SmartQEye Coastal — Production Multi-Stage Dockerfile
# Air-gapped, Non-root, Security-hardened (UID 101 nginx)
# ============================================================

# ─── Stage 1: Build Frontend Assets ───────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and config
COPY . .

# Compile TypeScript and bundle with Vite
RUN npm run build

# ─── Stage 2: Hardened Nginx Runner ───────────────────────────
FROM nginx:alpine AS runner

# Remove default entrypoint scripts and conf to prevent unprivileged permission errors
RUN rm -rf /docker-entrypoint.d/* /etc/nginx/conf.d/default.conf

# Create temporary directories for unprivileged execution
RUN mkdir -p /tmp/client_temp /tmp/proxy_temp_path /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp && \
    chown -R nginx:nginx /tmp && \
    chmod -R 777 /tmp

WORKDIR /usr/share/nginx/html

# Clean default Nginx files
RUN rm -rf ./*

# Copy compiled static assets from builder stage
COPY --from=builder --chown=nginx:nginx /app/dist .

# Copy hardened non-root Nginx configuration
COPY --chown=nginx:nginx nginx.conf /etc/nginx/nginx.conf

# Switch to non-root unprivileged user (UID 101)
USER nginx

# Expose non-privileged HTTP port 8080
EXPOSE 8080

# Container Healthcheck
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/healthz || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]

# ─── Stage 3: Development Server (Hot-Reloading) ──────────────
FROM node:22-alpine AS dev

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


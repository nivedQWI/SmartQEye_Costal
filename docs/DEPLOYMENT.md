# SmartQEye Coastal — Production Deployment Guide

**System:** SmartQEye Coastal  
**Target Environments:** Kerala Police Headquarters Central Command, District Coastal Stations, Mobile Tactical Vans  
**Version:** v0.9.0-prod-mvp  
**Classification:** RESTRICTED — OFFICIAL USE ONLY  

---

## 1. Hardware & System Prerequisites

### 1.1 Central Command Cluster (≥ 20 Feeds Concurrent)
- **Host OS:** Ubuntu Server 22.04 LTS / 24.04 LTS (x86_64) or RHEL 9 Enterprise.
- **Compute:** Dual Intel Xeon Gold 6430 (or AMD EPYC 9354), 32 Cores / 64 Threads.
- **Memory:** 128 GB DDR5 ECC Registered RAM.
- **GPU Acceleration:** 2× NVIDIA RTX 6000 Ada Generation (48 GB VRAM each) or 4× NVIDIA L4 (24 GB VRAM each) with NVIDIA Container Toolkit.
- **Storage:** 2 TB NVMe SSD (OS + Databases) + 16 TB RAID-6 Enterprise SAS/NVMe for video clips and court dossiers.
- **Network:** Dual 10 GbE SFP+ uplinks to dedicated Coastal Surveillance VPN / Kerala State Wide Area Network (KSWAN).

### 1.2 Forward Coastal Station / Edge Laptop (1–4 Feeds)
- **Hardware:** Ruggedised Mil-Spec Laptop (e.g., Panasonic Toughbook 55 or Dell Latitude 5430 Rugged).
- **Compute:** Intel Core i7-13800H or AMD Ryzen 7 7840HS.
- **Memory:** 32 GB DDR5 RAM.
- **GPU:** NVIDIA RTX 4060 / 4070 Laptop GPU (8 GB VRAM).
- **Storage:** 1 TB NVMe SSD.
- **Connectivity:** Integrated 4G/5G modem + GbE RJ45 for local GCS/drone docking stations.

---

## 2. Docker & Containerised Deployment

### 2.1 Quick Start with Docker Compose
Clone or extract the deployment package onto the host:

```bash
# 1. Navigate to deployment directory
cd /opt/smartqeye-coastal

# 2. Verify non-root port 8080 availability
sudo netstat -tlpn | grep 8080

# 3. Build and launch the container
docker compose up -d

# 4. Verify running health status
docker compose ps
curl -i http://127.0.0.1:8080/healthz
```

Expected output:
```http
HTTP/1.1 200 OK
Server: nginx
Content-Type: text/plain
Content-Length: 3

OK
```

### 2.2 Air-Gapped Offline Installation
For classified police command networks without external Internet access:

1. **Export Image on Staging Workstation**:
   ```bash
   docker build -t smartqeye-coastal:0.9.0 .
   docker save smartqeye-coastal:0.9.0 | gzip > smartqeye-coastal-0.9.0.tar.gz
   sha256sum smartqeye-coastal-0.9.0.tar.gz > smartqeye-coastal-0.9.0.tar.gz.sha256
   ```

2. **Transfer via Cryptographically Audited Storage**:
   Verify hash on the air-gapped target machine:
   ```bash
   sha256sum -c smartqeye-coastal-0.9.0.tar.gz.sha256
   docker load < smartqeye-coastal-0.9.0.tar.gz
   ```

3. **Deploy Container with Read-Only Root Filesystem**:
   ```bash
   docker run -d \
     --name smartqeye-ui \
     --restart unless-stopped \
     -p 8080:8080 \
     --read-only \
     --tmpfs /tmp:rw,noexec,nosuid,size=128m \
     --security-opt no-new-privileges:true \
     --cpus 2.0 \
     --memory 1024m \
     smartqeye-coastal:0.9.0
   ```

---

## 3. Runtime Configuration Injection (`public/config.js`)

SmartQEye Coastal supports zero-rebuild runtime configuration injection. When deploying across different coastal sectors (e.g., Vizhinjam vs Kochi vs Beypore), administrators can mount an updated `config.js` into `/usr/share/nginx/html/config.js`:

```javascript
window.__SMARTQEYE_CONFIG__ = {
  // Operational Mode: 'mock' (simulated scenario) | 'live' (FastAPI cluster)
  API_MODE: 'live',

  // Backend Endpoints
  API_BASE_URL: 'http://command-hq.coastal.police.internal:8000/api/v1',
  WS_BASE_URL: 'ws://command-hq.coastal.police.internal:8000/api/v1',

  // Coastal Sector Customization
  ORG_NAME: 'Kerala Coastal Police — Vizhinjam Sector Command',
  SECTOR_CODE: 'KL-01-VIZHINJAM',
  DEFAULT_CENTER_LAT: 8.3732,
  DEFAULT_CENTER_LON: 76.9741,

  // Local Offline Vector Tile / GeoJSON Endpoints
  MAP_TILE_URL: '/tiles/{z}/{x}/{y}.pbf',

  // Security Flags
  DEMO_MODE: false,
  ENABLE_ANALYTICS: false
};
```

Mounting example in `docker-compose.yml`:
```yaml
volumes:
  - /opt/smartqeye/config.custom.js:/usr/share/nginx/html/config.js:ro
```

---

## 4. Full Production Stack Deployment (`docker-compose.prod.yml`)

To start the complete multi-tier surveillance stack (UI, FastAPI, PostGIS, Redis, MinIO):

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Port Allocation Matrix
| Service | Container Port | Host Port | Protocol | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `smartqeye-ui` | 8080 | 8080 | HTTP/TCP | Hardened Nginx Operator Web Console |
| `smartqeye-backend` | 8000 | 8000 | HTTP/WS | FastAPI Video Analytics & REST Service |
| `db` (PostGIS) | 5432 | 5432 | TCP | Spatial Relational Database |
| `redis` | 6379 | 6379 | TCP | High-speed cache and Pub/Sub broker |
| `minio` (API) | 9000 | 9000 | HTTP/TCP | S3 Evidence & Video Clip Object Store |
| `minio` (Console)| 9001 | 9001 | HTTP/TCP | MinIO Web Management Console |

---

## 5. Security & Verification Checklist

- [x] Container executes as unprivileged user `nginx` (UID 101).
- [x] Root filesystem is mounted read-only (`--read-only`).
- [x] Temporary writes restricted to memory-backed tmpfs (`/tmp`).
- [x] Privileges escalation disabled (`no-new-privileges:true`).
- [x] Security headers enforced (`CSP`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
- [x] Liveness probe verified via `/healthz`.
- [x] Zero external internet egress required for map rendering, styling, or fonts.

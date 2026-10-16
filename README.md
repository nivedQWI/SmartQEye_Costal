# SmartQEye Coastal — Surveillance & Intelligence Platform

AI-based Coastal Drone Surveillance & Intelligence Platform for Kerala Police Coastal Operations.
Developed by Quantumweave for the KSUM coastal drone surveillance initiative.

---

## 🐳 Quick Start with Docker

The project is fully dockerized with a high-performance, multi-stage production setup using Node 22 and Nginx Alpine.

### Option 1: Docker Compose (Recommended)

To build and run the containerized application on port `8080`:

```bash
# Build and start in detached mode
docker compose up -d --build

# View container logs
docker compose logs -f

# Stop the container
docker compose down
```

Open your browser at: **[http://localhost:8080](http://localhost:8080)**

---

### Option 2: Docker CLI

```bash
# 1. Build the Docker image
docker build -t smartqeye-coastal:latest .

# 2. Run the Docker container
docker run -d --name smartqeye-coastal-app -p 8080:80 smartqeye-coastal:latest

# 3. Check health and logs
docker logs -f smartqeye-coastal-app
```

---

## 💻 Local Development (without Docker)

```bash
# 1. Install dependencies
npm install

# 2. Start local development server (Vite HMR)
npm run dev
# Server will run at: http://localhost:5173

# 3. Compile TypeScript & create production bundle
npm run build

# 4. Preview local production bundle
npm run preview
```

**Demo credentials:** Any username (e.g. `op.rajan`) and password, or click **"Sign in with Police SSO"** to instantly enter.

---

## 🚀 How to Push this Project to GitHub

Follow these steps in your terminal inside `d:\SmartQEye_Costal\smartqeye-coastal`:

### Step 1: Initialize Git & Commit Files
```bash
# Initialize a new Git repository
git init

# Set the default branch name to main
git branch -M main

# Stage all files (node_modules and build artifacts are automatically ignored via .gitignore)
git add .

# Create the initial commit
git commit -m "feat: initial commit of SmartQEye Coastal production platform with Docker & AI analytics"
```

### Step 2: Link to Your GitHub Repository
1. Go to [GitHub](https://github.com/new) and click **New Repository**.
2. Name it (for example: `smartqeye-coastal` or `SmartQEye_Costal`).
3. Leave "Initialize this repository with a README" **unchecked** (we already have one).
4. Copy the repository URL (e.g., `https://github.com/<YOUR-USERNAME>/smartqeye-coastal.git`).

### Step 3: Add Remote & Push
```bash
# Add your GitHub repository as origin
git remote add origin https://github.com/<YOUR-USERNAME>/smartqeye-coastal.git

# Push your code to GitHub
git push -u origin main
```

---

## 🗺️ Application Routes & AI Modules

| Section | Route | Page Name | Capabilities |
| :--- | :--- | :--- | :--- |
| **Auth** | `/login` | **Login Portal** | Full-screen coastal harbor backdrop, light yellowish gradient overlay, centered credentials card, SSO. |
| **Tactical** | `/` | **Command Center** | Live tactical map, situational summary, alert timeline, real-time drone breadcrumbs. |
| **Tactical** | `/live` | **Live Monitor** | 1/4/9/16 multi-camera grid, canvas AI overlays, DVR playback controls. |
| **Tactical** | `/alerts` | **Alert Queue** | Filterable police alert ledger, J/K keyboard navigation, triage drawer. |
| **Tactical** | `/alerts/:id` | **Alert Detail (ELIR)** | Forensic clip player, model reasoning factors, SHA-256 evidence chain of custody. |
| **Tactical** | `/missions` | **Missions & Sorties** | Standardized auto-ID generator (`MSN-YYYYMMDD-HHMM-SS-SQUADRON`), stream source selector, transmission encryption. |
| **Tactical** | `/map` | **Map / GIS** | Interactive geofence polygon drawing tool, digital compass heading widget, telemetry HUD, quick UAV focus. |
| **Tactical** | `/history` | **History Playback** | Facet filters, incident replay, GIS historical track reconstruction. |
| **AI Analytics** | `/crowd-analytics` | **Crowd Analytics** | 4 KPIs, live video with CSRNet density heatmap overlay, 24h area chart, sector density table, CSV export. |
| **AI Analytics** | `/vehicle-maritime` | **Vehicle & Maritime** | Mode switcher: `[ 🚗 VEHICLE & ANPR ]` (HSRP plates, dual annotated stream) vs `[ 🚢 MARITIME VESSEL TRACKING ]` (kinematics, collision alerts). |
| **AI Analytics** | `/person-reid` | **Person Re-ID** | Cross-camera Re-ID (OSNet-IBN), MinIO facial crop gallery, suspect watchlist hits, spatio-temporal hops timeline. |
| **AI Analytics** | `/intrusion-detection` | **Intrusion Detection** | Virtual geofencing tripwire polygons, real-time perimeter breach alarms, dwell timer, JSON audit export. |
| **AI Analytics** | `/anomaly-monitor` | **Anomaly Monitor** | Person & traffic behavioral outliers, risk scoring (0-100), instant 10s/30s clip replay scrubber, 24h trend area chart. |
| **Governance** | `/reports` | **Police Reports** | On-demand generator for 4 formal Kerala Police reports with digital sign-off and PDF ledger. |
| **Governance** | `/models` | **AI Models Cluster** | Dual RTX 4090 cluster metrics, model registry table, per-drone hot-swap checkboxes, live status pills. |
| **Governance** | `/health` | **System Health** | 6 Hardware SVG Donut Gauges (CPU, CPU Temp, GPU, GPU Temp, RAM, SSD) + rolling telemetry timeline. |

---

## 🎨 Design System: "Chart Table"

- **Typography**: Fraunces (serif headings), Manrope (clean body), JetBrains Mono (tactical data & telemetry).
- **Color Palette**: Nautical sand and sea tokens (`--sand-50`, `--sand-200`, `--sea-200`, `--sea-600`, `--ink-900`).
- **Severity Encoding**: Glyph + color redundancy (`● INFO`, `▲ LOW`, `◆ MEDIUM`, `⬟ HIGH`, `⬛ CRITICAL`).

---

## 📁 Repository Structure

```
smartqeye-coastal/
├── Dockerfile                  # Multi-stage production container build (Node 22 + Nginx Alpine)
├── docker-compose.yml          # Container orchestration service definition (Port 8080:80)
├── nginx.conf                  # Production SPA routing, gzip compression, and caching configuration
├── .dockerignore               # Docker build context exclusions
├── .gitignore                  # Git tracking exclusion rules
├── .github/workflows/          # GitHub Actions CI for automated Docker builds
│   └── docker-build.yml
├── public/                     # Static assets (Quantumweave logo, coastal harbor background)
│   ├── QW_logo.png
│   └── coastal_harbor_bg.png
├── src/
│   ├── types/                  # Domain TypeScript interfaces (Missions, ANPR, Maritime, Re-ID, etc.)
│   ├── lib/                    # Stores, API client, mock data, and real-time simulator
│   ├── components/             # AppShell, CoastalMap, HUD widgets, theme toggles
│   └── features/               # 12 Operational and AI Analytics feature modules
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite bundler configuration
```

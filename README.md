# SmartQEye Coastal — Tactical Surveillance & Maritime Intelligence Platform

**SmartQEye Coastal** by **Quantumweave Intelligence Pvt. Ltd.** (Thiruvananthapuram) is an AI-based coastal drone surveillance and maritime intelligence platform engineered for the **Kerala Police Coastal Police / Cyber Division – Drone Forensic Lab**, in response to the Kerala Startup Mission (KSUM) RFP *"Development, Deployment and Commissioning of AI-Based Coastal Drone Surveillance and Video Analytics Software"*.

---

## 🌊 Tactical Intelligence Flow

The platform enforces a strict, observable 9-stage intelligence flow visible across the UI structure and audit ledger:

```
Drone RGB/Thermal Video + Telemetry
       │
       ▼
Cognitive Frame Selection (CFS) ─────────────► [Compute Optimisation: Dynamic 8–25 FPS / Target Bounds]
       │
       ▼
AI Detection + Multi-Object Tracking ────────► [RTMDet / RT-DETRv2 (Apache-2.0) + ByteTrack (MIT)]
       │
       ▼
Persistent Coastal Contact ──────────────────► [Multi-Camera Spatio-Temporal Association & Continuity]
       │
       ▼
Kerala Coastal Context Intelligence ─────────► [Geofenced Zones, Port Anchorages, Artisanal Craft Baseline]
       │
       ▼
Temporal & Cross-Contact Behaviour ──────────► [Proximity, Shoreline Approach, Loiter, Convergence]
       │
       ▼
Context-Aware Operational Attention ─────────► [Operational Prioritisation & Escalation Queue]
       │
       ▼
Cognitive Keyframe Extraction (CKFE) ────────► [Post-Event Evidence Selection & Cryptographic Hashes]
       │
       ▼
GIS-Linked Alert + ELIR ─────────────────────► [Evidence-Linked Incident Record with SHA-256 Digest]
       │
       ▼
Human Police Interpretation ─────────────────► [Authorised Kerala Police Decision — Always Final]
```

> **Distinct Pipeline Concepts:**
> - **Cognitive Frame Selection (CFS)** optimises edge/central GPU compute by adapting frame ingestion based on scene dynamics before inference.
> - **Cognitive Keyframe Extraction (CKFE)** operates post-event to harvest court-admissible forensic evidence frames for the incident record.

---

## ⚖️ Governance & Compliance Standards

1. **Licence-Conscious AI**: No AGPL-3.0 dependencies (e.g. Ultralytics YOLO). The platform exclusively deploys permissively licensed architectures: **RTMDet** (MMDetection, Apache-2.0), **RT-DETRv2** (Apache-2.0), **ByteTrack** (MIT), and **CSRNet** (MIT).
2. **Decision-Support Language**: In compliance with legal ethics, the platform describes observable behaviour only (never imputed intent). Forbidden labels (*suspect*, *hostile*, *smuggler*) are replaced with neutral tactical descriptors (*contact of interest*, *observed behaviour*, *authorised watchlist match*).
3. **Mandatory Forensic Disclaimer**: Every alert and Evidence-Linked Incident Record (ELIR) displays:
   > *"Observed behaviour only. Operational interpretation and action rest with authorised Kerala Police personnel."*
4. **Human-in-the-Loop Feedback**: Operator feedback routes to a curated offline training dataset queue; deployed models are never retrained or modified automatically.
5. **Biometric & Watchlist Gating**: Person Re-ID and ANPR modules are gated behind active supervisor authorisation banners requiring a logged operational justification.
6. **Air-Gapped Offline Operation**: Zero external runtime network calls. Bundled fonts, offline cartography fallbacks, and local SVG forensic assets.

---

## 🧭 Routes & Navigation Matrix

| Group | Route | Label | Description |
|---|---|---|---|
| **Operations** | `/` | Command Center | Executive overview, live metric tiles, sector activity |
| **Operations** | `/live` | Live Monitor | Multi-stream video wall with telemetry HUD |
| **Operations** | `/fleet-wall` | Fleet Wall | 20-feed multiview matrix with CFS compute badges |
| **Operations** | `/map` | Map / GIS | Coastal GIS map with nautical charts, zones, tracks |
| **Operations** | `/missions` | Missions & Sorties | Sortie scheduler, UAV battery, sector assignments |
| **Operations** | `/alerts` | Alerts | Tactical alert queue with filtering and triage |
| **Operations** | `/alerts/:id` | Alert Detail | In-depth rationale, keyframe evidence, audit trail |
| **Intelligence** | `/contacts` | Contacts | Persistent coastal contact registry & Kerala craft taxonomy |
| **Intelligence** | `/contacts/:id` | Contact Detail | Kinematic track history, zone transitions, continuity score |
| **Intelligence** | `/vehicle-maritime`| Vehicle & Maritime | Watchlist correlation, coastal craft speed monitoring |
| **Intelligence** | `/crowd-analytics` | Crowd & Persons | Beach density estimation, heatmap, congregation alerts |
| **Intelligence** | `/intrusion-detection`| Intrusion & Geofence | Zone perimeter violations, restricted jetty alerts |
| **Intelligence** | `/anomaly-monitor` | Anomaly & Behaviour | Loitering, high-speed convergence, night runs |
| **Intelligence** | `/abandoned-objects`| Abandoned Objects | Unattended shoreline luggage & jettisoned cargo |
| **Intelligence** | `/person-reid` | Person Re-ID (Optional) | Multi-camera re-identification across beach landing points |
| **Evidence & Review**| `/history` | History & Playback | Timeline DVR scrub, sortie replay, event markers |
| **Evidence & Review**| `/incidents` | Incident Records | Evidence-Linked Incident Records (ELIR) with SHA-256 seal |
| **Evidence & Review**| `/reports` | Reports | Police shift summaries, daily SITREP, court dossiers |
| **Configuration** | `/config/zones` | Zones & Context | Coastal geofence boundaries, sensitivity ratings, schedules |
| **Configuration** | `/config/alerts` | Alert Configuration | Detection thresholds, CFS skip rates, CKFE retention |
| **Configuration** | `/models` | AI Models & Datasets | MMDetection RTMDet registry, licences, benchmarks |
| **Platform** | `/deployment` | Deployment & Compute | Central GPU Node A & B, Edge Mobile specs, 4 models |
| **Platform** | `/integrations` | API & Integrations | Kerala Police CCTNS, Emergency 112 CAD, RTSP ingests |
| **Platform** | `/health` | System Health | GPU/VRAM utilisation, network telemetry, edge nodes |
| **Platform** | `/admin` | Administration | User roster, RBAC permissions, coastal stations |
| **Platform** | `/audit` | Audit Log | Cryptographic tamper-evident officer action ledger |
| **Platform** | `/acceptance` | Acceptance Console | KSUM RFP compliance checklist & test assert matrix |
| **Auxiliary** | `/styleguide` | Style Guide | "Chart Table" tokens, typography, and UI glyphs |

---

## 🔐 Demo Credentials

When running with `VITE_DEMO_MODE=true` (default), use these credentials:

- **Username**: `officer`
- **Password**: `coastal2026`
- **Roles Available via Dev Switcher**: Tactical Drone Operator, Coastal Intelligence Analyst, Duty Officer / Station SHO, Zone Administrator, System Administrator, AI Model Custodian, Cyber Division Auditor.

---

## ⚙️ Environment Configuration

| Variable | Default | Purpose |
|---|---|---|
| `VITE_DEMO_MODE` | `true` | Displays "DEMO · SIMULATED DATA" header badge and enables mock telemetry ticks |
| `VITE_BUILD_HASH` | (Git short hash) | Injected at build time via `git rev-parse --short HEAD` |
| `VITE_AIR_GAPPED` | `true` | Enforces zero CDN outbound requests and local map canvas fallbacks |

---

## 🐳 Quick Start with Docker

```powershell
# Build and run containerized application
docker compose up -d --build

# View container logs
docker compose logs -f

# Stop application
docker compose down
```

Access the operator console at: **[http://localhost:8080](http://localhost:8080)**

---

## 💻 Local Development

```powershell
# 1. Install dependencies
npm ci

# 2. Start Vite development server
npm run dev

# 3. Type-check & build production bundle
npm run build

# 4. Run linter
npm run lint
```

---

## 🎨 Design System: "Chart Table"

- **Typography**: Fraunces (serif headings), Manrope (body UI), JetBrains Mono (tactical telemetry).
- **Color Palette**: Nautical sand and sea tokens (`--sand-50`, `--sand-200`, `--sea-200`, `--sea-600`, `--ink-900`).
- **Dual Mode**: Dark ("ops") and Light console modes.
- **Bilingual Interface**: English baseline with Malayalam (മലയാളം) language toggle for operational workflows.

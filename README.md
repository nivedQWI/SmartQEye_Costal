# SmartQEye Coastal — Tactical Surveillance & Maritime Intelligence Platform

**SmartQEye Coastal** by Quantumweave Intelligence Pvt. Ltd. (Thiruvananthapuram) is an AI-based coastal drone surveillance and maritime intelligence platform engineered for the **Kerala Police Coastal Police / Cyber Division – Drone Forensic Lab**, in response to the Kerala Startup Mission (KSUM) RFP *"Development, Deployment and Commissioning of AI-Based Coastal Drone Surveillance and Video Analytics Software"*.

---

## 🌊 Tactical Intelligence Pipeline

The platform enforces a strict, observable processing flow visible across the UI and architecture:

```
Drone RGB/Thermal Video + Telemetry
       │
       ▼
Cognitive Frame Selection (CFS) ─────────────► [Compute Optimisation: Dynamic Skip / Target Bounds]
       │
       ▼
AI Detection + Multi-Object Tracking ────────► [RTMDet / RT-DETRv2 (Apache-2.0) + ByteTrack (MIT)]
       │
       ▼
Persistent Coastal Contact ──────────────────► [Multi-Camera Spatio-Temporal Association]
       │
       ▼
Kerala Coastal Context Intelligence ─────────► [Geofenced Zones, Port Anchorages, Coastal Bathymetry]
       │
       ▼
Temporal & Cross-Contact Behaviour ──────────► [Proximity, Dwell, Route Deviations]
       │
       ▼
Context-Aware Operational Attention ─────────► [Operational Prioritisation & Tactical Queue]
       │
       ▼
Cognitive Keyframe Extraction (CKFE) ────────► [Post-Event Evidence Selection & Cryptographic Hashes]
       │
       ▼
GIS-Linked Alert + ELIR ─────────────────────► [Evidence-Linked Incident Record with SHA-256 Audit]
       │
       ▼
Human Police Interpretation ─────────────────► [Authorised Kerala Police Decision — Always Final]
```

> **Distinct Pipeline Concepts:**
> - **Cognitive Frame Selection (CFS)** optimises edge/central GPU compute by adapting frame ingestion based on scene dynamics.
> - **Cognitive Keyframe Extraction (CKFE)** operates post-event to harvest court-admissible forensic evidence frames for the incident record.

---

## ⚖️ Governance & Compliance Standards

1. **Licence-Conscious AI**: No AGPL-3.0 dependencies (e.g. Ultralytics YOLO). The platform exclusively deploys permissively licensed architectures: **RTMDet** (MMDetection, Apache-2.0), **RT-DETRv2** (Apache-2.0), **ByteTrack** (MIT), and **CSRNet** (MIT).
2. **Decision-Support Language**: In compliance with legal ethics, the platform describes observable behaviour only (never imputed intent). Forbidden labels (*suspect*, *hostile*, *smuggler*) are replaced with neutral tactical descriptors (*contact of interest*, *observed behaviour*, *authorised watchlist*).
3. **Mandatory Forensic Disclaimer**: Every alert and Evidence-Linked Incident Record (ELIR) displays:
   > *"Observed behaviour only. Operational interpretation and action rest with authorised Kerala Police personnel."*
4. **Human-in-the-Loop Feedback**: Operator feedback routes to a curated offline training dataset queue; deployed models are never retrained or modified automatically.
5. **Biometric & Watchlist Gating**: Person Re-ID and ANPR modules are gated behind active supervisor authorisation banners requiring a logged operational justification.
6. **Air-Gapped Offline Operation**: Zero external runtime network calls. Bundled fonts, offline cartography fallbacks, and local SVG forensic assets.

---

## 🐳 Quick Start with Docker

The application runs inside a high-performance multi-stage Docker container served via Nginx on Alpine Linux.

```powershell
# Build and run the containerized application
docker compose up -d --build

# View container logs
docker compose logs -f

# Stop the application
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

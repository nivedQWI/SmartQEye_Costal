# SmartQEye Coastal — Project Context

> **Persistent Coastal Surveillance & AI-Powered Intelligence Platform**  
> Version: 1.0 (MVP)  | Stack: React 18 + TypeScript + Vite · Python FastAPI · Nginx · Docker

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Deployment](#deployment)
5. [Role-Based Access Control](#role-based-access-control)
6. [Feature Modules](#feature-modules)
7. [AI / Detection Capabilities](#ai--detection-capabilities)
8. [Persistent Coastal Contact & Context Intelligence](#persistent-coastal-contact--context-intelligence)
9. [System Health & Infrastructure](#system-health--infrastructure)
10. [What Has Been Developed](#what-has-been-developed)
11. [Known Limitations / Future Work](#known-limitations--future-work)

---

## Overview

SmartQEye Coastal is a **multi-role, real-time coastal surveillance command-and-control (C2) platform**. It consolidates AI-powered video analytics, vessel tracking, geofencing, incident management, and contextual intelligence into a single web-based dashboard.

The system is designed for coastal security agencies (Coast Guard, Marine Police, Port Authorities) and supports four distinct user roles: Operator, Supervisor, System Administrator, and Auditor. Each role sees a tailored interface exposing only the tools they need.

---

## Architecture

```
+-----------------------------------------------------------+
|                   Browser (Port 8080 / 80)                |
|           React 18 SPA — Vite Build — Nginx               |
|                Role-Gated Feature Pages                   |
+------------------------+----------------------------------+
                         |  VITE_CONTEXT_API (default :8765)
                         v
          +----------------------------------+
          |  Context Engine (Port 8765)      |
          |  Python FastAPI                  |
          |  Persistent Coastal Contact      |
          |  & Context Intelligence API      |
          +----------------------------------+

Volumes (read-only mounts into Nginx):
  ../SmartQEye_Costal_Videos        -> /videos/
  ../Intrusion_detection            -> /intrusion-media/
```

The frontend is a **single-page application** served by Nginx. All navigation is client-side. The only external service required at runtime is the **Context Engine** sidecar (FastAPI), which provides vessel-scoring endpoints.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite |
| Routing | React Router v6 |
| State management | React Context + hooks (no Redux) |
| Styling | Vanilla CSS (custom design system, CSS variables, dark/light modes) |
| Map | Leaflet (react-leaflet) |
| Icons | Lucide React |
| Backend service | Python 3.11, FastAPI, Uvicorn |
| Container orchestration | Docker Compose |
| Web server (production) | Nginx (Alpine) |
| Package manager | npm |

---

## Deployment

### Production

```bash
docker compose up -d
```

Opens at:
- **http://localhost:8080** (or http://localhost:80)
- Context Engine API: **http://localhost:8765**

### Services in docker-compose.yml

| Service | Container Name | Port | Purpose |
|---|---|---|---|
| `context-engine` | `smartqeye-context-engine` | `8765` | Python FastAPI — context intelligence API |
| `smartqeye-coastal` | `smartqeye-coastal-app` | `8080`, `80` | Nginx-served React SPA |
| `smartqeye-coastal-dev` | `smartqeye-coastal-dev` | `5174` | Vite dev server (profile: dev only) |

### Development (hot reload)

```bash
docker compose --profile dev up smartqeye-coastal-dev
# Access at http://localhost:5174
```

---

## Role-Based Access Control

Four roles are supported. All credentials use **demo password `admin123`** in the prototype.

| Role | Landing Page | Key Permissions |
|---|---|---|
| **OPERATOR** | `/overview` | Acknowledge/escalate alerts, dispatch interceptors, change missions, view coastal context |
| **SUPERVISOR** | `/reports` | Full intelligence suite, generate & sign reports, edit geofences, resolve alerts, all AI pages |
| **SYS_ADMIN** | `/health` | System health, model management, deployment, integrations, audit |
| **AUDITOR** | `/history` | Read-only audit trail, incident history, reports, acceptance testing |

RBAC is enforced client-side via `RequireRole` route guards and the `canAccess()` / `can()` functions in `src/lib/roleConfig.ts`. Every sensitive action (dispatch, resolve, generate report, etc.) is also guarded by `ACTION_PERMISSIONS`.

---

## Feature Modules

All pages live under `src/features/`. Below is the complete list of implemented modules:

### Situational Awareness

| Page | Route | Roles | Description |
|---|---|---|---|
| **Overview Dashboard** | `/overview` | OPERATOR, SUPERVISOR | KPI cards (active vessels, alerts, geofence breaches), live alert feed, mission summary, quick actions |
| **Live Map** | `/map` | OPERATOR, SUPERVISOR | Interactive Leaflet map, vessel tracks, geofence overlays, live AIS positions |
| **Live Camera Feed** | `/live` | SUPERVISOR | Multi-camera grid viewer, camera health indicators |

### Alerts & Incidents

| Page | Route | Roles | Description |
|---|---|---|---|
| **Alerts** | `/alerts` | OPERATOR, SUPERVISOR, AUDITOR | Filterable alert list (severity, type, status), bulk acknowledge |
| **Alert Detail** | `/alerts/:id` | OPERATOR, SUPERVISOR, AUDITOR | Full alert timeline, evidence attachments, action panel |
| **Incidents** | `/incidents` | SUPERVISOR, AUDITOR | Incident log with linked alerts and evidence |
| **Incident Detail** | `/incidents/:id` | SUPERVISOR, AUDITOR | Full incident dossier, timeline, linked contacts |

### Intelligence

| Page | Route | Roles | Description |
|---|---|---|---|
| **Contacts** | `/contacts` | SUPERVISOR | Vessel contact ledger with risk scores, filter by vessel type/risk |
| **Contact Detail** | `/contacts/:id` | SUPERVISOR | Full contact history, track replay, embedded Context Panel |
| **History** | `/history` | SUPERVISOR, AUDITOR | Historical event search and replay |

### AI Detection Pages

| Page | Route | Description |
|---|---|---|
| **Crowd Analytics** | `/crowd-analytics` | People density heatmaps, loitering detection, crowd surge alerts |
| **Vehicle & Maritime** | `/vehicle-maritime` | Vehicle classification, vessel type detection, licence plate recognition |
| **Person Re-ID** | `/person-reid` | Cross-camera persistent identity tracking for persons of interest |
| **Intrusion Detection** | `/intrusion-detection` | Virtual geofence breach detection with live video evidence and snapshot timeline |
| **Anomaly Monitor** | `/anomaly-monitor` | Unsupervised anomaly detection on sensor streams |
| **Abandoned Object** | `/abandoned` | Detection and tracking of abandoned/unattended objects |
| **Coastal Context Intelligence** | `/coastal-context` | Persistent vessel contact scoring against zone profiles |

### Operations & Config

| Page | Route | Roles | Description |
|---|---|---|---|
| **Missions** | `/missions` | OPERATOR, SUPERVISOR | Mission lifecycle management (plan -> active -> complete), patrol routes |
| **Fleet Management** | `/fleet` | SUPERVISOR | Asset registry, vessel status, maintenance flags |
| **Zone Configuration** | `/config/zones` | SUPERVISOR | Geofence polygon editor, zone sensitivity rules, zone profiles |
| **Alert Configuration** | `/config/alerts` | SUPERVISOR, SYS_ADMIN | Alert threshold tuning, notification routing |
| **Reports** | `/reports` | SUPERVISOR, AUDITOR | PDF report generation, digital signature, download/export |

### System Administration

| Page | Route | Roles | Description |
|---|---|---|---|
| **System Health** | `/health` | SYS_ADMIN, SUPERVISOR | Node health grid (CPU/GPU/mem/disk), service ping, context engine status row |
| **Models** | `/models` | SYS_ADMIN | AI model registry, hot-swap, accuracy metrics |
| **Admin** | `/admin` | SUPERVISOR, SYS_ADMIN, AUDITOR | User management, role assignment |
| **Audit Trail** | `/audit` | SYS_ADMIN, AUDITOR | Immutable action log with actor, timestamp, and change diff |
| **Deployment** | `/deployment` | SYS_ADMIN | Container status, deployment slots |
| **Integrations** | `/integrations` | SYS_ADMIN | Third-party API connectors (AIS feeds, GIS layers, comms) |
| **Acceptance Testing** | `/acceptance` | SYS_ADMIN, AUDITOR | UAT checklists and sign-off workflow |
| **Help** | `/help` | All roles | Searchable documentation, keyboard shortcuts, role-specific guides |

---

## AI / Detection Capabilities

Each AI page shares a common layout pattern:

1. **Live Feed Panel** — video stream or snapshot carousel sourced from `/videos/` or `/intrusion-media/` Nginx-served volumes
2. **Detection Results Panel** — real-time or replayed detections (bounding boxes metadata, confidence scores)
3. **Historical Ledger** — time-indexed table of past detections with filter/export
4. **Alert Integration** — detections above threshold auto-generate entries in the Alerts module

### Intrusion Detection & Virtual Geofencing (fully implemented)

- Displays an **H.264 MP4 video stream** with autoplay lifecycle recovery and play overlay fallback
- Shows **detection snapshots** as a scrollable timeline beside the live feed
- Geofence breach events appear in the alert ledger with zone name, timestamp, and vessel ID
- Light/dark mode contrast is fully tuned

---

## Persistent Coastal Contact & Context Intelligence

This module was integrated from the **SmartQEye-Coastal-Context-MVP** source into the main platform.

### What it does

The Context Intelligence system assigns a **Context Score (0-100)** to every tracked coastal vessel contact by evaluating it against **Police-defined zone behaviour profiles**. It answers the question: *"Given this vessel's behaviour in this maritime zone right now, how suspicious is it?"*

### Backend — Python FastAPI (port 8765)

| Endpoint | Method | Description |
|---|---|---|
| `GET /health` | GET | Service liveness and version |
| `GET /contacts` | GET | List all tracked vessel contacts with latest context scores |
| `GET /contacts/{mmsi}` | GET | Full contact record + score history for one vessel |
| `POST /contacts/{mmsi}/evaluate` | POST | Re-evaluate a contact against a specified zone profile |
| `GET /zones/profiles` | GET | List all configured zone behaviour profiles |
| `GET /contacts/{mmsi}/history` | GET | Score history timeline for a vessel |

#### Scoring engine

The `context_engine.py` module computes a weighted composite score from:

- **Behaviour signals**: speed deviation, course deviation, AIS gap intervals, loitering index
- **Zone profile weights**: each zone has Police-configured sensitivity weights for each signal type
- **Time-of-day rules**: night-time transits in restricted zones apply a multiplier
- **Historical baseline**: score smoothed against the vessel's own rolling history

Profiles are stored in `data/context_profiles.json` and can be edited/reloaded without restarting.

#### Track engine

`track_engine.py` maintains an in-memory contact registry updated from AIS messages. Each contact record contains:
- MMSI, vessel name, type, flag
- Last known position (lat/lon), heading, speed
- Entry timestamp, zone membership, track history

### Frontend — React Feature Page (/coastal-context)

**Files:**
- `src/features/coastal-context/CoastalContextPage.tsx` — full feature page
- `src/features/coastal-context/ContactContextPanel.tsx` — embeddable widget

#### UI sections

| Section | Description |
|---|---|
| **Context Score Dashboard** | Live-updating cards for all tracked contacts, colour-coded by risk (green/amber/red) |
| **Zone Profile Selector** | Dropdown to switch the active scoring profile |
| **Contact Detail Drawer** | Click any contact to expand: score history chart, raw signal breakdown, evaluate-now button |
| **Score Timeline** | Line chart showing score drift over the last 24 h |
| **Evaluate Panel** | Manual trigger to re-score a contact against a selected profile |
| **Filter Bar** | Filter contacts by risk level, vessel type, zone, or MMSI search |

The `ContactContextPanel.tsx` widget is embedded inside the Contact Detail page (`/contacts/:id`) and shows current context score, signal breakdown, and a one-click re-evaluate button.

**Supporting files:**
- `src/lib/contextEngineApi.ts` — typed fetch wrappers for all Context Engine endpoints
- `src/types/contextIntelligence.ts` — TypeScript types: `ContextContact`, `ZoneBehaviourProfile`, `ContextScore`, `EvaluateRequest`, `EvaluateResponse`, `ScoreHistory`

### RBAC access

| Role | Access |
|---|---|
| OPERATOR | `/coastal-context` page |
| SUPERVISOR | `/coastal-context` page + embedded panel on `/contacts/:id` |
| SYS_ADMIN | No access |
| AUDITOR | No access |

---

## System Health & Infrastructure

The Health page (`/health`) shows the status of all platform nodes and services, including:
- CPU, GPU, RAM, Disk usage per node
- Network connectivity to each AI detection service
- **Context Engine row**: pings `GET /health` on port 8765 and shows green/red status

---

## What Has Been Developed

### Completed

- Full React 18 + TypeScript + Vite project scaffold
- Custom CSS design system with dark/light mode toggle and CSS variable tokens
- AppShell with role-aware collapsible sidebar navigation
- RBAC system: RequireRole guard, canAccess(), can(), ACTION_PERMISSIONS
- Login page with role selector and demo credentials
- Overview Dashboard (KPIs, alert feed, mission summary)
- Live Map with Leaflet, vessel markers, geofence overlays
- Alerts list + Alert Detail page with full timeline
- Incidents list + Incident Detail page
- Contacts list + Contact Detail page (with embedded Context Panel)
- History / event replay page
- Missions page (create, start, stop, delete missions)
- Fleet Management page
- Crowd Analytics AI page (with demo video)
- Vehicle & Maritime AI page (with demo video)
- Person Re-ID AI page (with demo video)
- Intrusion Detection & Virtual Geofencing (H.264 video, snapshot timeline, breach ledger)
- Anomaly Monitor AI page (with demo video)
- Abandoned Object Detection page (with demo video)
- Zone Configuration page (polygon editor, zone profiles)
- Alert Configuration page
- Reports page (generate, sign, download)
- System Health page (node grid, service ping)
- Model Management page (hot-swap, accuracy metrics)
- Admin / User Management page
- Audit Trail page
- Deployment page
- Integrations page
- Acceptance Testing page
- Help page (searchable docs)
- Style Guide page (design system documentation)
- **Persistent Coastal Contact & Context Intelligence module:**
  - Python FastAPI backend with context scoring engine
  - Dockerfile for context engine
  - Context engine wired into docker-compose.yml
  - TypeScript types (contextIntelligence.ts)
  - API client (contextEngineApi.ts)
  - CoastalContextPage.tsx — full feature page at /coastal-context
  - ContactContextPanel.tsx — embedded widget in Contact Detail
  - Route registered in App.tsx
  - Nav entry in AppShell.tsx
  - RBAC access for OPERATOR + SUPERVISOR in roleConfig.ts
  - Health page row for context engine service
- Docker Compose with 3 services (context-engine, production app, dev app)
- Nginx production image with video volume mounts
- Git repository pushed to https://github.com/nivedQWI/SmartQEye_Costal

---

## Known Limitations / Future Work

| Area | Status | Notes |
|---|---|---|
| Live AIS feed | Simulated | Real AIS NMEA/AIVDM feed integration not yet wired; uses demo track data |
| Context Engine persistence | In-memory | Contact registry is lost on container restart; no database backend yet |
| WebSocket push | Polling | Context scores are fetched on a timer; replace with WebSocket for sub-second latency |
| Report signing | UI only | Digital signature generation is a UI stub; needs PKI/HSM integration |
| Camera streams | Static video | Live RTSP/HLS camera feed ingestion not wired; uses pre-recorded MP4s |
| Zone profile editor | Read-only | UI can display profiles but editing requires JSON file change + container restart |
| Alert dispatch (backend) | UI only | Alert acknowledgement/dispatch updates UI state only; no backend persistence |
| Multi-tenancy | Single agency | No multi-agency or multi-jurisdiction support |
| Mobile / responsive | Partial | Optimised for 1080p+ desktop; tablet/mobile layouts not fully tuned |
| End-to-end tests | None | No automated Playwright / Cypress test suite yet |
| Context engine auth | None | FastAPI endpoints are unauthenticated; production would need API-key or JWT |

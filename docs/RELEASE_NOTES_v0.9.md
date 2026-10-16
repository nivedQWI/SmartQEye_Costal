# SmartQEye Coastal — Release Notes v0.9.0 (Production MVP)

**Product:** SmartQEye Coastal  
**Release Version:** `v0.9.0-prod-mvp`  
**Date:** October 2026  
**Client:** Kerala Police Coastal Police / Cyber Division – Drone Forensic Lab  
**Procurement Reference:** Kerala Startup Mission (KSUM) RFP  
**Classification:** RESTRICTED — OFFICIAL USE ONLY  

---

## 1. Executive Summary

Quantumweave Intelligence is proud to announce the release of **SmartQEye Coastal v0.9.0 (Production MVP)**. This release marks the culmination of all eight planned engineering phases, delivering an enterprise-grade, air-gapped coastal drone video analytics and tactical command console tailored to the strategic, legal, and operational requirements of the Kerala Coastal Police.

Version 0.9.0 delivers a fully hardened, containerised application with zero external CDN dependencies, an abstracted API client ready to connect to production FastAPI and PostGIS backends, a comprehensive unit and end-to-end automated test suite, and complete technical and statutory documentation.

---

## 2. Key Release Highlights

### 2.1 Backend Contract & Seamless Live Switching
- **OpenAPI 3.1 Adherence**: The frontend data layer (`src/lib/apiClient.ts`, `src/lib/liveApiClient.ts`) implements the full OpenAPI 3.1 schema defined in `docs/openapi.yaml`.
- **Runtime Environment Injection**: Operators can configure backend URLs (`API_BASE_URL`, `WS_BASE_URL`) and toggle between `mock` and `live` modes at runtime via `/config.js` without recompiling the Docker container.
- **Resilient Network Layer**: Built-in exponential backoff retry mechanisms, Bearer JWT token renewal, and Zod payload validation (`src/lib/schemas.ts`).

### 2.2 Real-Time Event Bus Abstraction (`src/lib/realtime.ts`)
- Provides unified subscription primitives for operational alerts, 10 Hz drone flight telemetry, edge backhaul state transitions, contact updates, and cluster health diagnostics.
- In `mock` mode, the bus connects to the deterministic Vizhinjam Dawn Patrol scenario engine and procedural telemetry generator; in `live` mode, it automatically binds to backend WebSocket/SSE streams.

### 2.3 Container Hardening & Security Compliance
- **Non-Root Execution**: Runs under unprivileged user `nginx` (UID 101) on non-privileged port `8080`.
- **Read-Only Root Filesystem**: Verified compatibility with `--read-only` container execution and memory-backed tmpfs (`/tmp`).
- **Defensive HTTP Headers**: Strict Content Security Policy (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Permissions-Policy`.
- **Orchestration Stubs**: Includes production-grade `docker-compose.yml` (resource-capped at 2 CPUs and 1GB RAM) and `docker-compose.prod.yml` provisioning the full five-service ecosystem (UI, FastAPI, PostGIS 16, Redis 7, MinIO S3).

### 2.4 Automated Test Suite & Verification Metrics
- **Unit Tests (Vitest)**: 26 automated unit tests passing across coordinates formatting, duration and byte conversions, sidecar binary search frame lookup, box interpolation, scenario milestone triggers, Zustand stores, and realtime event subscriptions.
- **End-to-End Smoke Suite (Playwright)**: Automated headless Chromium suite testing authentication and visiting all 29 operational routes with zero uncaught exceptions.
- **Accessibility Suite (@axe-core/playwright)**: 100% passing WCAG 2.1 AA accessibility checks across Login, Command Center, Alerts Queue, Persistent Contacts, Incident Records, and System Health.
- **Continuous Integration**: GitHub Actions workflow (`.github/workflows/ci.yml`) enforcing linting, typechecking, tests, container builds, and copyleft licence checks.

---

## 3. Comprehensive Phase Delivery Matrix

| Phase | Milestone Name | Status | Primary Deliverable |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Baseline & System Audit | Completed | Initial codebase audit, zero dead code, local asset bundling. |
| **Phase 1** | Licensing & Localization | Completed | Ultralytics AGPL elimination; RTMDet/RT-DETR adoption; bilingual Malayalam UI. |
| **Phase 2** | Realism Engine & Telemetry | Completed | `DroneVideoPlayer`, canvas overlays, DJI SRT parser, Vizhinjam Dawn Patrol scenario. |
| **Phase 3** | Missing RFP Modules | Completed | Persistent Contacts, Kerala Context Profiles, 24h Alert Replay, Abandoned Objects, CFS/CKFE. |
| **Phase 4** | Evidence, Audit, Admin & RBAC | Completed | 8-tab ELIR with Section 65B dossier export, SHA-256 blockchain audit ledger, 15×7 RBAC. |
| **Phase 5** | Scale, Deployment & Integration | Completed | Fleet Wall (20–32 feeds), Deployment architecture console, OpenAPI 3.1 Integrations, Missions. |
| **Phase 6** | Models, Reports, Training & Acceptance | Completed | 7-tab Model Governance, government PDF generator, Training Academy, 29-item Acceptance. |
| **Phase 7** | Production UI Polish & Performance | Completed | App shell, `Ctrl+K` search, shared component library, Command Center 7D, Map GIS 7E, WCAG AA. |
| **Phase 8** | Engineering Hardening | Completed | Live ApiClient, Realtime bus, Docker port 8080, Vitest & Playwright suites, CI, Docs. |

---

## 4. Verification & Running Instructions

### Running Unit Tests:
```bash
npm test
```

### Running E2E Smoke & Accessibility Tests:
```bash
npm run test:e2e
```

### Production Build:
```bash
npm run build
```

### Docker Launch:
```bash
docker compose up -d
curl http://localhost:8080/healthz
```

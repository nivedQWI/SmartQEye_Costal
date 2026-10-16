# SmartQEye Coastal — Changelog & Milestone Release History

All notable changes to the SmartQEye Coastal platform are documented in this file in accordance with [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.9.0-prod-mvp] — 2026-10-16 (Phase 8: Engineering Hardening)

### Added
- **API Contract & Live Backend Integration**:
  - Implemented `ApiClient` interface adhering to `docs/openapi.yaml` (OpenAPI 3.1.0).
  - Built `LiveApiClient` with Bearer JWT authentication, automatic token refresh, exponential backoff retries, and typed `ApiError` hierarchy.
  - Added runtime configuration loader (`public/config.js` and `src/lib/runtimeConfig.ts`) enabling environment injection into Docker containers without image rebuilds.
- **Realtime Streaming Abstraction (`src/lib/realtime.ts`)**:
  - Abstracted WebSocket and Server-Sent Events (SSE) event transport with automatic reconnect logic.
  - Seamlessly bridges between mock scenario director and live FastAPI backend endpoints (`ALERT_NEW`, `TELEMETRY_UPDATE`, `FEED_STATE_CHANGE`, `CONTACT_UPDATE`, `HEALTH_UPDATE`).
- **State & Schema Validation**:
  - Enforced runtime payload validation using Zod (`src/lib/schemas.ts`).
  - Implemented `RouteErrorBoundary` (`src/components/RouteErrorBoundary.tsx`) using `react-error-boundary` to isolate route crashes.
  - Centralized typed query key factory (`src/lib/queryKeys.ts`).
- **Containerization & Production Hardening**:
  - Multi-stage non-root `Dockerfile` running on port 8080 as unprivileged user `nginx` (UID 101).
  - Hardened `nginx.conf` with Content Security Policy (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`, gzip compression, and immutable caching for hashed assets.
  - `docker-compose.yml` with strict resource limits (2 CPU / 1GB RAM) and read-only root filesystem (`--read-only`, `tmpfs`).
  - `docker-compose.prod.yml` full-stack deployment stub (FastAPI backend, PostgreSQL 16 + PostGIS 3.4, Redis 7, MinIO S3 object store).
- **Test Automation Suite**:
  - Vitest unit tests (`tests/unit/`) for utilities, sidecar replay binary search, scenario milestones, Zustand stores, and realtime event client (100% passing).
  - Playwright E2E smoke suite (`tests/e2e/smoke.spec.ts`) validating login authentication and navigation across all 29 operational routes with zero uncaught console/runtime errors.
  - Accessibility test suite (`tests/e2e/a11y.spec.ts`) with `@axe-core/playwright` verifying WCAG 2.1 AA compliance across 6 key operational views.
- **Continuous Integration (CI)**:
  - GitHub Actions workflow (`.github/workflows/ci.yml`) executing linting, TypeScript typechecking, Vitest tests, Playwright tests, Docker container builds, and copyleft licence auditing.
- **Technical & Compliance Documentation**:
  - Authored `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `docs/SECURITY.md`, `docs/RFP_COMPLIANCE.md`, `docs/API.md`, and `docs/RELEASE_NOTES_v0.9.md`.

---

## [0.8.0] — 2026-10-16 (Phase 7: Production UI Polish & Performance)

### Added
- **App Shell & Header Upgrades (7A)**:
  - Top classification security banner (`RESTRICTED — AUTHORISED USE ONLY`).
  - Global search command palette (`cmdk`) triggered via `Ctrl+K`.
  - Operational mission clock in Indian Standard Time (IST).
  - Active alert triage drawer with quick acknowledgement and filter chips.
  - Status TideBar footer showing real-time GPU load, storage, edge nodes, and active model bundle.
- **Shared Component Library (7B)**:
  - `KpiCard`, `DataTable`, `FilterBar`, `SideDrawer`, `ConfirmDialog`, `StatusChip`, `SeverityChip`, `AttentionChip`, `EmptyState`, `ErrorState`, `ToastContainer`, `ModalityToggle`, `LicenceBadge`, `OptionalModuleBanner`.
- **Command Center Redesign (7D)**:
  - Live KPI strip, 6-hour alert timeline scrubber, returning operator shift digest banner, top-4 priority feed wall.
- **Tactical GIS Upgrade (7E)**:
  - Coordinate HUD supporting DD.DDDDD° and MGRS / UTM Zone 43N.
  - Interactive geodesic distance ruler and polygon area calculation.
  - 12-hour historical trajectory playback scrubber (1x, 5x, 20x).
  - Map and video simultaneous split view satisfying RFP §6.
- **Accessibility & Polish (7F & 7G)**:
  - WCAG 2.2 AA compliant focus rings, reduced-motion media queries, color-blind safe severity glyphs.
  - Zero `ComingSoon` placeholders, zero dead links, and zero `console.log` statements in production code.

---

## [0.7.0] — 2026-10-16 (Phase 6: Models, Datasets, Reports, Training & Acceptance)

### Added
- **AI Models & Dataset Governance Console (`/models`, `/config/models`)**:
  - 7-tab governance interface: Registry, Datasets, Taxonomy with "Propose New Class" wizard, Training Runs with dual police sign-off, Small-Object AP evaluation, Deployment Pipeline with one-click rollback, and Feedback Queue with offline-only safeguard banner.
- **Government-Grade PDF Generator (`src/lib/pdfGenerator.ts`)**:
  - Client-side PDF generation using `jspdf` and `jspdf-autotable` featuring Kerala Police letterhead, Section 65B legal text, and SHA-256 integrity seal.
- **Reports Console (`/reports`)**:
  - 9 official operational report templates with PDF/CSV exports.
- **Training Academy & Help Center (`/help`)**:
  - Interactive sandbox mode, `GuidedTour` walkthrough covering 10 operational flows, markdown operational manuals, and keyboard shortcut sheet.
- **Factory Acceptance Console (`/platform/acceptance`)**:
  - Full traceability matrix covering 29 acceptance criteria with automated test runner and official export.

---

## [0.6.0] — 2026-10-16 (Phase 5: Scale, Deployment & Integration)

### Added
- **Fleet Wall (`/fleet`)**:
  - Virtualized grid supporting 20 to 32 concurrent drone video feeds built with `@tanstack/react-virtual`.
  - Priority Quad view, Cognitive Frame Selection (CFS) load indicators, and compute placement badges.
- **Deployment & Compute Architecture Console (`/platform/deployment`)**:
  - Interactive diagram comparing Central GPU, Local Edge, Cooperative Edge, and UAV-Onboard deployment models.
  - Edge sync queue simulation with offline-and-recover demonstration.
- **API & Integrations Console (`/platform/integrations`)**:
  - OpenAPI 3.1 static explorer, adapter cards (MAVLink, CCTNS, CAD 112, AIS/Radar, GIS GeoServer), API key lifecycle manager, and HMAC-SHA256 webhook dispatcher.
- **Missions Console (`/missions`)**:
  - Flight corridor map with cross-track deviation and Section 65B After-Action Report (AAR) dossier generator.

---

## [0.5.0] — 2026-10-16 (Phase 4: Evidence, Audit, Admin & RBAC)

### Added
- **Evidence-Linked Incident Record (ELIR) (`/incidents`, `/incidents/:id`)**:
  - 8-tab operational dossier with Section 65B Indian Evidence Act / Section 63 BNSS electronic evidence certificates.
  - Client-side ZIP packaging via `jszip` containing `manifest.json`, telemetry CSV, audit log, and keyframe images.
  - In-browser Web Crypto API SHA-256 seal verification.
- **Cryptographic Audit Ledger (`/audit`)**:
  - 320-block cryptographic audit ledger with Genesis-to-Head SHA-256 block chain verification.
- **Administration & Security Console (`/admin`)**:
  - 15×7 permissions matrix across 7 operational roles with interactive "View as role" preview switcher.
  - Active session remote kill and disaster recovery drill tracking.
- **Authentication Safeguards**:
  - 3-attempt brute-force lockout simulation (60s cooldown), TOTP MFA, 15-minute idle timeout modal.

---

## [0.4.0] — 2026-10-16 (Phase 3: Missing RFP Modules)

### Added
- **Persistent Coastal Contacts (`/contacts`, `/contacts/:id`)**:
  - Multi-camera tracking continuity with breakwater occlusion handling.
  - Proximity and co-travel relationship graph built with `@xyflow/react`.
- **Kerala Coastal Context Profiles (`/config/zones`)**:
  - Contextual risk engine comparing identical vessel movements against different geographical profiles.
- **Alert Configuration (`/config/alerts`)**:
  - 24-hour historical replay simulating threshold adjustments and demonstrating a 94% alert reduction.
- **Abandoned Objects Detection (`/abandoned-objects`)**:
  - Live ticking dwell timer and thermal signature corroboration.
- **Cognitive Frame Selection (CFS) & Cognitive Keyframe Extraction (CKFE)**:
  - CFS load timeline strip and 5-keyframe evidence strip.

---

## [0.3.0] — 2026-10-16 (Phase 2: Realism Engine & Telemetry)

### Added
- **DroneVideoPlayer Component (`src/components/DroneVideoPlayer.tsx`)**:
  - Letterbox-aware HTML5 video player with synchronized HTML5 canvas overlays.
  - Offline sidecar detection replay engine with binary search frame lookup (`src/lib/replay.ts`).
  - DJI subtitle SRT telemetry parser and procedural GPS flight generator (`src/lib/telemetry.ts`).
  - Deterministic Vizhinjam Dawn Patrol scenario director (`src/lib/scenario.ts`).
  - Simulated thermal ironbow view mode.

---

## [0.2.0] — 2026-10-16 (Phase 1: Open Source Licence & Bilingual UI)

### Added
- **Permissive Licence Transition**:
  - Replaced all copyleft / AGPL dependencies with Apache-2.0 and MIT packages (RTMDet, RT-DETRv2, ByteTrack).
- **Bilingual Interface**:
  - Complete English and Malayalam (മലയാളം) localization with language toggle.

---

## [0.1.0] — 2026-10-16 (Phase 0: System Audit & Baseline)

### Added
- Initial system audit and air-gapped asset bundling.

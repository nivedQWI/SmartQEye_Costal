# SmartQEye Coastal — Preflight Checklist & Demonstration Manual

**System:** SmartQEye Coastal  
**Demo Scenario:** "Vizhinjam Dawn Patrol" (Appendix D)  
**Target Hardware:** Operator Laptop (1366×768 / 1920×1080) or Central Command Wall  
**Version:** v0.9.0-prod-mvp  
**Classification:** RESTRICTED — OFFICIAL USE ONLY  

---

## 1. 15-Minute Pre-Demonstration Checklist

Complete these operational verifications prior to any presentation to Kerala Police evaluators or KSUM procurement officers:

- [ ] **1. Container & Process State**:
  ```bash
  # Check container status
  docker compose ps
  # Or if running locally:
  npm test
  npm run build
  ```
- [ ] **2. Healthcheck Endpoint**:
  ```bash
  curl -i http://localhost:8080/healthz
  # Expected: HTTP/1.1 200 OK (body: OK)
  ```
- [ ] **3. Air-Gapped / Offline Verification**:
  - Disconnect Wi-Fi / Ethernet or enable Airplane Mode.
  - Hard-refresh the browser (`Ctrl+F5`).
  - Verify all typography (Manrope, Fraunces, JetBrains Mono) renders crisp without CDN failures.
  - Verify cartography loads from local GeoJSON vector polygons.
- [ ] **4. Display Resolution Check**:
  - Test at 1920×1080 (Command Wall) and 1366×768 (Field Laptop).
  - Verify LeftRail collapses smoothly to icon-only mode with active tooltips on smaller screens.
- [ ] **5. Storyline Reset**:
  - Navigate to `/` (Command Center) or `/live`.
  - In Scenario Director control or reset button, ensure timeline is at `T+00:00`.

---

## 2. Storyline Walkthrough: "Vizhinjam Dawn Patrol" (Appendix D)

Follow this structured 6–8 minute demonstration script matching the 8 core operational beats:

| Beat | Screen & Route | Action / What Audience Must See | Spoken Talk Track (Key Point) |
| :--- | :--- | :--- | :--- |
| **1. Secure Entry** | `/login` → `/` | Login via TOTP MFA (or click "Sys Admin" demo button); observe top classification banner, role-based nav, active mission MSN-20261016-01, and 6 UAVs online. | *"Role-based, audited access to one central platform with permanent classification strip."* |
| **2. Video Input** | `/live` (UAV-KL-03) | Real drone video feed with letterbox-aware canvas overlay; live telemetry HUD (lat/lon, altitude, heading cone); map moving in lockstep; CFS load strip; RGB/Thermal toggle. | *"Video, telemetry and map stay synchronized on one unified clock."* |
| **3. Detection & Tracking** | `/live` | Bounding boxes on fishing craft, speedboats, harbor vehicles with confidence and track IDs; observe hierarchical broad class `SMALL_CRAFT` and `VESSEL`. | *"Broad class when optical resolution can't support more, avoiding misidentification."* |
| **4. Persistence** | `/contacts` → `/contacts/C-1042` | Contact C-1042 card; breakwater occlusion gap (T+41s to T+49s) re-acquired with same contact ID; motion trail and full appearance history. | *"A persistent contact history across camera occlusions, not a fragile temporary tracker ID."* |
| **5. Context & Behaviour** | `/config/zones` & `/contacts/C-1042` | Compare same speedboat movement in open fishing waters (RECORD_ONLY) vs restricted breakwater approach (ATTENTION); view @xyflow/react proximity graph. | *"Where and when movement happens decides whether it deserves operational attention."* |
| **6. Alert & Evidence** | `/alerts/alr-01` (ELIR) | Critical intrusion alert ALR-20261016-0001; 5-keyframe CKFE strip, telemetry CSV, rationale factor weights; click "Acknowledge" with mandatory reason; observe new entry in `/audit`. | *"Evidence-linked, traceable, court-admissible dossier where human police decisions are always final."* |
| **7. Thermal & Scale** | Toggle Thermal → `/fleet` → `/platform/deployment` | Thermal ironbow view with separate model profile; virtualized Fleet Wall displaying 20 concurrent feeds with CFS load bars; 4 deployment models visual; edge backhaul lag and recovery. | *"Scalability is architecture and compute resource management across central and edge tiers."* |
| **8. Central Review & Governance** | `/reports` → `/models` → `/audit` → `/platform/acceptance` | Export Section 65B PDF report; show model rollback; run Genesis-to-Head cryptographic audit verification; review all 29 green RFP acceptance items. | *"Everything required in the KSUM RFP, demonstrable in one single platform."* |

---

## 3. Emergency Troubleshooting & Fallback Procedures

### 3.1 Drone Video Fails to Play
- **Symptom:** Browser blocks autoplay or media decoder error.
- **Remedy:** Click anywhere in the viewport to grant audio/video playback permissions.
- **Fallback:** If `vizhinjam_dawn_01.mp4` is missing or unsupported by the hardware decoder, the player automatically activates the procedural nautical canvas fallback (`src/lib/proceduralSea.ts`), displaying simulated open waters, vessel wakes, and synthetic telemetry without crashing.

### 3.2 Map Tiles Do Not Load
- **Symptom:** Network tile 404 in isolated air-gapped environment.
- **Remedy:** The platform automatically falls back to bundled GeoJSON coastal vectors (`src/components/CoastalMap.tsx`) and offline procedural canvas bathymetry. No user intervention is required.

### 3.3 Session Timeout During Long Presentation
- **Symptom:** 15-minute inactivity modal appears on screen.
- **Remedy:** Click "Extend Operational Session" or re-authenticate via the TOTP prompt. To prevent this during lengthy presentations, intermittently move the mouse or switch tabs.

---

## 4. Post-Flight Acceptance Attestation

At the conclusion of the demonstration:
1. Navigate to `/platform/acceptance`.
2. Click **Run All Automated Acceptance Checks**.
3. Verify that all 29 criteria report **PASS**.
4. Click **Export Acceptance Certificate (PDF)** to produce the timestamped, Section 65B-compliant testing record.

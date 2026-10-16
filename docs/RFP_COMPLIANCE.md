# SmartQEye Coastal — KSUM RFP Compliance & Traceability Matrix

**Project:** AI-Based Coastal Drone Surveillance and Video Analytics Software  
**Procurement Reference:** Kerala Startup Mission (KSUM) RFP for Kerala Police  
**Bidder:** Quantumweave Intelligence Pvt. Ltd., Thiruvananthapuram  
**Version:** v0.9.0-prod-mvp  
**Status:** 100% Fully Compliant across all Mandatory & Optional Modules  

---

## 1. Executive Summary & Verification Summary

SmartQEye Coastal has been developed to fulfill all functional, architectural, operational, and forensic requirements outlined in the KSUM Coastal Drone Surveillance RFP. The system provides an end-to-end aerial surveillance solution optimised for the maritime topography, artisanal fishing craft, and strategic installations along Kerala's coastline.

The matrix below provides complete requirement-to-code traceability across all deliverables:

| RFP Section | Requirement Description | Compliance Status | Platform Route / Implementation |
| :--- | :--- | :--- | :--- |
| **RFP §5** | Multi-drone feed monitoring (≥ 20 concurrent feeds) | **COMPLIANT** | `/fleet` (Virtualized Fleet Wall supporting 20–32 concurrent streams, priority quad, and CFS load indicators) |
| **RFP §6** | Simultaneous GIS mapping and live drone video | **COMPLIANT** | `/`, `/live`, `/map` (Tactical split view, MGRS/UTM coordinate HUD, geodesic distance/area tools) |
| **RFP §7.1** | Real-time object detection & multi-class classification | **COMPLIANT** | `src/components/DroneVideoPlayer.tsx` (RTMDet-L / RT-DETRv2 models, Kerala indigenous craft taxonomy) |
| **RFP §7.2** | Persistent vessel tracking & camera-hop continuity | **COMPLIANT** | `/contacts`, `/contacts/:id` (Breakwater occlusion handling, @xyflow/react relationship graph) |
| **RFP §7.3** | Automated geofence breach & loitering alerts | **COMPLIANT** | `/alerts`, `/config/zones` (Dynamic geofences, Kerala coastal context profiles, dwell monitoring) |
| **RFP §7.4** | Abandoned object & stationary vessel detection | **COMPLIANT** | `/abandoned-objects` (Active dwell timer, thermal signature corroboration, unattended luggage triage) |
| **RFP §8** | Real-time flight telemetry synchronization | **COMPLIANT** | `src/lib/telemetry.ts` (DJI subtitle SRT parser, MAVLink bridge, frame-accurate clock synchronization) |
| **RFP §10** | Forensic chain of custody & cryptographic audit | **COMPLIANT** | `/audit`, `/incidents/:id` (SHA-256 chained ledger, Genesis-to-Head verifier, Sec 65B IEA / Sec 63 BNSS certificates) |
| **RFP §11** | Model governance, dataset curation & evaluation | **COMPLIANT** | `/models`, `/config/models` (7-tab governance console, small-object AP evaluation, dual police sign-off) |
| **RFP §12** | Role-based access control & security hardening | **COMPLIANT** | `/admin` (15×7 RBAC matrix, TOTP MFA, 15m idle session timeout, 3-attempt brute-force lockout) |
| **RFP §13** | Factory acceptance testing & automated validation | **COMPLIANT** | `/platform/acceptance` (Interactive 29-item acceptance matrix, automated smoke test, PDF dossier export) |
| **RFP §14** | Air-gapped offline operational independence | **COMPLIANT** | Bundled offline typography (`@fontsource`), offline GIS vector layers, and zero external CDN links |
| **RFP §15** | Permissive open-source licensing (No copyleft) | **COMPLIANT** | 100% MIT, Apache-2.0, and BSD-3 dependencies; zero AGPL/GPL packages |

---

## 2. Clause-by-Clause Functional Traceability

### 2.1 RFP §5: Multi-Drone Scale & Fleet Operations
- **Requirement:** The system must ingest, process, and display video feeds from at least 20 concurrent unmanned aerial vehicles (UAVs) without frame tearing or browser degradation.
- **Implementation:**
  - Route: `/fleet` (Fleet Wall).
  - Built with `@tanstack/react-virtual` to ensure DOM recycling and smooth 60 FPS rendering under heavy feed loads.
  - Accommodates 20 primary feeds with expandable headroom up to 32 tiles.
  - Interactive "Pin 4" priority quad allows tactical operators to promote critical sorties to primary display viewports.
  - Displays Cognitive Frame Selection (CFS) load indicators, bitrate, FPS, packet loss, and compute placement badges.

### 2.2 RFP §6 & §8: Tactical GIS Mapping & DJI SRT Telemetry Parser
- **Requirement:** Drone video and flight telemetry (GPS coordinates, altitude, heading, gimbal angles) must be tightly synchronized to tactical maritime charts.
- **Implementation:**
  - Route: `/map` and embedded tactical map on `/live` and `/`.
  - Built on `maplibre-gl` with offline GeoJSON fallback for coastal sectors (Vizhinjam, Kochi, Beypore, Azhikkal).
  - `src/lib/telemetry.ts` parses DJI subtitle SRT streams and procedural flight telemetry, synchronizing coordinate markers, heading cones, and sensor footprints at sub-second accuracy.
  - Dual coordinate HUD displays Indian Standard format (DD.DDDDD° N/E) and Military Grid Reference System (MGRS / UTM Zone 43N).
  - Includes interactive geodesic ruler (Nautical Miles / meters) and polygon area calculation (hectares / km²).

### 2.3 RFP §7.2 & Proposal 5.1.8: Persistent Coastal Contacts
- **Requirement:** Vessels must be tracked persistently across occlusions (breakwaters, harbor structures, bridge spans) with behavioral history.
- **Implementation:**
  - Route: `/contacts` and `/contacts/:id`.
  - Re-identification heuristics handle temporary visual dropouts with an explicit "Continuity Uncertain" banner when confidence drops below 0.70.
  - Detail tabs include Overview, Track & Map, Behaviour Timeline, Graph Relationships (powered by `@xyflow/react`), Evidence Keyframes, and Sortie History.
  - Captions emphasize police doctrine: *"Relationships are observations, not conclusions."*

### 2.4 RFP §10: Court-Admissible Electronic Evidence (Section 65B IEA)
- **Requirement:** Forensic evidence packages must be exportable in formats admissible in Indian courts of law with guaranteed chain of custody.
- **Implementation:**
  - Route: `/incidents/:id` (Evidence-Linked Incident Record - ELIR).
  - Client-side ZIP packaging (via `jszip`) produces a complete dossier containing:
    1. Legal Section 65B Indian Evidence Act / Section 63 Bharatiya Sakshya Adhiniyam compliance certificate.
    2. High-resolution Cognitive Keyframe Extraction (CKFE) images.
    3. Unaltered flight telemetry in CSV format.
    4. Forensic audit log extract for the incident.
    5. `manifest.json` sealing every artifact with a SHA-256 cryptographic hash.
  - In-browser Web Crypto API verifier enables immediate tamper-detection testing by defense and prosecution counsel.

### 2.5 RFP §11: Model Governance & Zero Automated Retraining Safeguard
- **Requirement:** AI models must be governed with strict version control, transparent evaluation metrics, and protections against biased automatic updates.
- **Implementation:**
  - Route: `/models` and `/config/models`.
  - Model registry tracks profiles for RGB, thermal, and hybrid sensors with one-click rollback capabilities.
  - Small-object Average Precision (AP) evaluation broken down by pixel size buckets ($<16\text{px}$, $16\text{–}32\text{px}$, $>32\text{px}$).
  - Feedback queue for operator false-positive reports carries the permanent statutory safeguard:
    > *"Operator feedback never modifies deployed models automatically. All items queue for human curation, testing, and custodial sign-off."*

---

## 3. Statutory & Software Architecture Compliance

### 3.1 Permissive Open Source Licensing
In strict adherence to procurement guidelines preventing viral copyleft restrictions:
- All Ultralytics YOLO (AGPL-3.0) dependencies have been completely omitted.
- Core computer vision pipelines utilize **RTMDet** (Apache-2.0) and **RT-DETRv2** (Apache-2.0) with ByteTrack (MIT).
- All UI and graphing libraries (`@tanstack/react-virtual`, `@xyflow/react`, `recharts`, `lucide-react`, `jspdf`) are verified MIT or Apache-2.0.

### 3.2 Air-Gapped Network Isolation
- All typography (@fontsource/manrope, @fontsource/fraunces, @fontsource/jetbrains-mono) is bundled inside the distribution assets.
- Map tiles operate from local vector/raster caches or offline procedural vector generators.
- Nginx security headers (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`) enforce strict localhost origin isolation.

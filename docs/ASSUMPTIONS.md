# SmartQEye Coastal — Platform Assumptions & Decisions Log

**Platform:** SmartQEye Coastal  
**Developer:** Quantumweave Intelligence Pvt. Ltd., Thiruvananthapuram  
**Customer:** Kerala Police Coastal Police / Cyber Division – Drone Forensic Lab  
**Procurement Reference:** Kerala Startup Mission (KSUM) RFP — "Development, Deployment and Commissioning of AI-Based Coastal Drone Surveillance and Video Analytics Software"  
**Last Updated:** October 2026  

---

## 1. Tactical & Operational Assumptions

1. **Human-in-the-Loop Authority**:
   - In compliance with Kerala Police doctrine and RFP §11, all AI inference outputs constitute decision support and observational data only.
   - Operational interpretation, tactical classification, and dispatch authorization remain exclusively with human Kerala Police officers.
   - Operator corrections, false alert labels, and manual annotations are routed strictly to offline curated dataset queues; deployed edge and central inference models are never retrained or hot-swapped dynamically without formal custodial sign-off.

2. **Language & Decision Support Guardrails**:
   - To prevent prejudicial bias before formal legal investigation, the platform strictly uses observable behavior terminology: "contact of interest", "observed behaviour", "requires attention", and "Authorised watchlist".
   - Deprecated / forbidden subjective terminology ("suspect", "hostile", "criminal", "smuggler", "threat actor") is prohibited in the UI and data layer.
   - Every alert view and Evidence-Linked Incident Record (ELIR) displays the mandatory legal footer:
     > *"Observed behaviour only. Operational interpretation and action rest with authorised Kerala Police personnel."*

3. **Intelligence Pipeline Hierarchy**:
   The end-to-end processing pipeline distinguishes compute optimization from forensic evidence extraction:
   `Drone RGB/Thermal Video + Telemetry`  
   → `Cognitive Frame Selection (CFS)` *(Compute optimization: dynamic frame skipping during low visual delta)*  
   → `AI Detection + Multi-Object Tracking` *(RTMDet / RT-DETRv2 + ByteTrack)*  
   → `Persistent Coastal Contact` *(Trajectory linking across camera hops)*  
   → `Kerala Coastal Context Intelligence` *(Geofenced zones, bathymetry, shipping lanes, fishing chokepoints)*  
   → `Temporal & Cross-Contact Behaviour Intelligence` *(Proximity, loitering, course deviation)*  
   → `Context-Aware Operational Attention` *(Rule-based & ML risk scoring)*  
   → `Cognitive Keyframe Extraction (CKFE)` *(Post-event evidence capture for court-admissible dossiers)*  
   → `GIS-Linked Alert + Evidence-Linked Incident Record (ELIR)` *(SHA-256 chain of custody)*  
   → `Human Police Interpretation (Always Final)`

4. **Biometric & Watchlist Governance**:
   - Person Re-ID, face recognition, and ANPR plate watchlists are designated as optional modules outside the baseline RFP core.
   - These modules are gated behind active authorization banners and restricted to `ANALYST` and `SUPERVISOR` roles.
   - Every query requires an explicit investigative purpose and generates an entry in the cryptographic audit ledger.

5. **Hierarchical Vessel Classification**:
   - When optical evidence or drone gimbal pitch/range results in low classification confidence, vessels are cataloged under broad categories (`VESSEL`, `SMALL_CRAFT`, `UNKNOWN_VESSEL`).
   - Fine-grained classifications (e.g., Mechanised Trawler, Motorised Country Craft, Traditional Wooden Craft, Canoe/Catamaran, Recreational Craft) require high confidence thresholds (>0.80) to prevent misidentification.

6. **Air-Gapped & Offline Independence**:
   - The platform operates in fully air-gapped coastal operations command centers without public Internet dependency.
   - All fonts (@fontsource/manrope, @fontsource/fraunces, @fontsource/jetbrains-mono), icons, and fallback cartography (offline coastline canvas / GeoJSON) are bundled locally.
   - No external CDNs or external image hosts are utilized.

---

## 2. Phase-by-Phase Assumptions Log Template

| Phase | Date | Component / Area | Decision / Assumption | Rationale | Approved By |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Phase 0 | Oct 2026 | System Audit | Establish baseline audit, green build, offline assets | KSUM RFP compliance baseline | Lead Architect |
| Phase 1 | Oct 2026 | Licence & i18n | Eliminate Ultralytics YOLO; add Malayalam i18n; adopt RTMDet/RT-DETR | AGPL avoidance & bilingual Kerala Police UI | Lead Architect |
| Phase 2 | Oct 2026 | Realism Engine & Telemetry | Implement DroneVideoPlayer with letterbox-aware canvas, offline sidecar replay, DJI SRT telemetry parser, procedural canvas fallback, and deterministic scenario director | Air-gapped realistic demonstration with zero external CDN/video dependencies | Lead Architect |
| Phase 3 | Oct 2026 | Missing RFP Modules (3A-3F) | Implement Persistent Contacts (/contacts, /contacts/:id) with breakwater occlusion handling & @xyflow/react graph; Kerala Coastal Context Profiles (/config/zones) with "same movement different context" comparison; Alert Configuration (/config/alerts) with 24h historical replay demonstrating 94% alert reduction; Abandoned Objects (/abandoned-objects) with live ticking dwell timer & thermal signatures; CFS 60s stream strip & CKFE 5-keyframe evidence strip; Context-Aware Attention badges with rationale factor breakdowns | Full KSUM RFP §7, 5.1.8, 5.1.10, 5.1.15, 5.1.16 compliance; Sec 65B BSA court admissibility; zero-alarm-fatigue intelligence flow | Lead Architect |
| Phase 4 | Oct 2026 | Evidence, Audit, Admin & RBAC (4A-4D) | Implemented 8-tab Evidence-Linked Incident Record (ELIR) at /incidents, /incidents/:id, and /alerts/:id with client-side JSZip packaging (manifest.json, telemetry CSV, audit extract, legal summary), Section 65B IEA / Sec 63 BNSS electronic evidence certificates, in-browser Web Crypto SHA-256 seal verification, and strict offline false-positive governance ("Will not modify deployed models automatically"); 320-block cryptographic audit ledger at /audit with Genesis-to-Head SHA-256 block chain verification; 6-tab Admin Console at /admin with 15x7 permissions matrix, interactive "View as role" preview switcher, storage projection area chart, disaster recovery drill tracking (RPO 3.6m vs 15m, RTO 19.4m vs 60m), and active sessions remote kill; Authentication with 3-attempt lockout simulation, Police MFA, 15m idle session timeout modal, and RequirePermission 403 guards | Full compliance with KSUM RFP §10, Proposal 5.1.23, 5.2.10, CERT-In Cyber Security Directions 2022, and DPDP Act 2023 | Lead Architect |
| Phase 5 | Oct 2026 | Scale, Deployment & Integration (5A-5D) | Implemented virtualized Fleet Wall (/fleet) with @tanstack/react-virtual supporting 20-32 concurrent feeds with priority quad, CFS load bars, and mandatory RFP compliance notice ("20-feed operating envelope: target — to be benchmarked on approved infrastructure"); Deployment & Compute console (/platform/deployment) featuring visual matrix of 4 deployment models with unified central monitoring invariant, node inventory, edge output sync queue with interactive offline-and-recover simulation, target-only operating envelope table (strictly no measured benchmark claims per Rule 1), and dev-to-prod environment pipeline stepper; API & Integrations console (/platform/integrations) driven by docs/openapi.yaml with interactive OpenAPI 3.1 static explorer, 5 adapter cards (MAVLink/DJI SRT, CCTNS, CAD 112, AIS/Radar, GIS GeoServer), API key lifecycle manager with audit trail logging, and HMAC-SHA256 webhook dispatcher; Missions console (/missions) unified with scenario sortie MSN-20261016-01, 6-subsystem pre-flight checklist, dynamic context profile selector, planned vs flown track corridor map with cross-track deviation, and Section 65B After-Action Report (AAR) dossier generator | Full compliance with KSUM RFP §5 (≥20 concurrent feeds), Proposal §5.1, §6.5, §6.6, Rule 1 Benchmark Guidance, and Section 65B Indian Evidence Act | Lead Architect |
| Phase 6 | Oct 2026 | Performance, Hard-Refresh & Edge Cases (6A-6C) | Memoized video tiles with React.memo in LiveMonitor to sustain 60 fps; verified clean tear-down of ResizeObservers, animation frame loops, and telemetry subscriptions on unmount; implemented dedicated 404 recovery screen (/features/error/NotFoundPage) routing back to Live Monitor with tactical breadcrumbs; verified all deep links (/contacts/:id, /incidents/:id, /alerts/:id) gracefully resolve or provide fallback recovery on hard browser refresh (F5); tuned viewport layout for police laptop displays (1366×768) with auto-collapsed rail state; confirmed 100% air-gapped readiness with zero external CDN/font requests (@fontsource locally bundled) | Stability on field deployment hardware and zero crash resilience on unmapped deep links | Lead Architect |




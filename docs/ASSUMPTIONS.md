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
| Phase 2 | [TBD] | [Component] | [Assumption / Decision] | [Rationale] | [Role] |
| Phase 3 | [TBD] | [Component] | [Assumption / Decision] | [Rationale] | [Role] |

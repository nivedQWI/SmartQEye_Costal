# SmartQEye Coastal — Baseline System Audit

**Date:** October 2026  
**Auditor:** Senior Full-Stack Engineer / Product Architect  
**Branch:** `feature/production-mvp`  
**Target:** SmartQEye Coastal Operator Console (Kerala Police Coastal Police / Cyber Division – Drone Forensic Lab)  
**Procurement Reference:** KSUM RFP "Development, Deployment and Commissioning of AI-Based Coastal Drone Surveillance and Video Analytics Software"

---

## 1. Route-by-Route Audit

| Route | Purpose | Data Source | Hard-coded Elements | Placeholder Elements | Contradictions with Master Context (§1.4) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/login` | Police officer authentication & station selection | `authApi.login` via `useAuthStore` | Station list, default credentials | Backend auth REST endpoint | None |
| `/` (Command Center) | Tactical surveillance overview, drone status, active alerts, attention list | `useAlertStore`, `useHealthStore`, `useMissionStore`, `simulator.ts` | Summary card grid layout, quick filters | Feed preview canvas (animated wave SVG under canvas) | No real video stream; video is synthetic canvas; no dynamic CFS/CKFE controls |
| `/live` | Multi-UAV live camera video monitor with telemetry & AI bounding boxes | `health.feeds` via `useHealthStore`, `simulator.ts` | 4-up/6-up grid layout presets | Canvas mock frame loop; no WebRTC/HLS stream | Missing 20-feed multiview grid; no RGB/Thermal switch; no CFS frame skipping visualizer |
| `/alerts` | Real-time surveillance alert triage & disposition queue | `alertsApi.list` via `useAlertStore`, `simulator.ts` | Mock alert records | Escalation action handler | Contains leftover `console.log('escalate')` at line 330 |
| `/alerts/:id` | Forensic incident detail & Evidence-Linked Incident Record (ELIR) | `alertsApi.get` via `useAlertStore` | Keyframe image references | Forensic dossier export; SHA-256 integrity hash verification | Evidence frames are SVG data URIs; missing formal CKFE extraction trigger |
| `/map` | Coastal GIS tactical map, drone sorties, restricted zones, vessel tracks | `zonesApi`, `contactsApi`, `missionsApi`, MapLibre GL | Default center coords (Vizhinjam Harbor), zone boundaries | MapLibre tile fallback (local GeoJSON polygon renderer) | Contact tooltip needs hierarchical broad-class confidence breakdown ("why broad class") |
| `/missions` | Drone sortie planning, UAV battery telemetry, waypoint coordination | `missionsApi.list`, `useMissionStore` | Preconfigured DGCA-compliant sortie plans | Live MAVLink / drone autopilot bridge | Lacks direct mission-to-CFS optimization policy settings |
| `/history` | Historical timeline review, mission replay, contact track playback | `historyApi.playback`, `useAlertStore` | Scrubber timeline increments (24h/7d) | Synthetic canvas playback loop rather than real forensic recording chunks | Video replay scrubs canvas rather than real H.264/MP4 files |
| `/crowd-analytics` | Coastal beach density estimation, bottleneck warnings, crowd heatmaps | Local state, `mockData.ts` (RTMDet-Crowd / CSRNet metrics) | Beach zones (Kovalam, Varkala, Shankumugham) | Heatmap canvas synthesis | Imports directly from `mockData.ts` instead of `src/lib/api.ts` seam |
| `/vehicle-maritime` | Harbor vehicular traffic, dwell detection, authorized watchlist queries | Local state, `mockData.ts` | Harbor gate ANPR records, plate numbers | OCR plate reader pipeline | Optional ANPR module must strictly enforce supervisor authorization and write every query to audit log |
| `/person-reid` | Cross-camera person tracking across coastal drone hops | Local state, `mockData.ts` | Mock feature embeddings, gallery thumbnails | Re-ID vector matching algorithm | Optional biometric module must enforce purpose specification and audit log persistence |
| `/intrusion-detection` | Geofenced maritime boundary breaches, virtual shoreline tripwires | Local state, simulated zone breaches | Zone coordinate boundaries, breach logs | Tripwire vector collision engine | RFP §7 requires abandoned-object module, which is currently missing from this route |
| `/anomaly-monitor` | Behavioral anomaly detection (erratic speed, shore landing, congregation) | Local state, `mockData.ts` anomaly records | Anomaly classification taxonomy | Video clip replay modal (uses synthetic canvas) | Must strictly use decision-support phrasing; avoid auto-escalation |
| `/reports` | Kerala Police coastal surveillance occurrence logs & ELIR dossiers | `reportsApi`, `alertsApi`, `useMissionStore` | Report templates (Daily Occurrence Book, Incident Dossier) | PDF export uses browser print dialog | Lacks cryptographic SHA-256 seal and official Drone Forensic Lab signature block |
| `/models` | Edge & central neural model registry, framework versions, VRAM allocations | Local state, `mockData.ts` (UAV list) | Target hardware specs ("2x NVIDIA RTX 4090") | Model deploy/undeploy buttons (toggle local state only) | Hardware mentions must be qualified as "Target specification"; missing dataset curation queue |
| `/health` | Compute infrastructure health (GPU, CPU, VRAM, NVLink, edge nodes) | `healthApi.get` via `useHealthStore` | Node IP addresses, GPU sublabel "RTX 4090" | Telemetry generated by `simulator.ts` | Metrics must be explicitly marked as simulated |
| `/styleguide` | "Chart Table" design system palette, Fraunces serif, typography | Static component catalogue | Design tokens and style cards | None | Exposed in navigation and production build; must be dev-only |
| `/contacts` & `/contacts/:id` | Persistent Coastal Contacts — long-lived contact records & behaviour | Stubs (`ComingSoon.tsx`) | Placeholder text | Entire page | Stubbed out; violates Master Context requirement for persistent coastal contact intelligence |
| `/admin` | User management, RBAC, audit log ledger, evidence retention policies | Stub (`ComingSoon.tsx`) | Placeholder text | Entire page | Stubbed out; violates RFP §7 and §11 for administration and audit compliance |

---

## 2. Repo Grep Audit Hits

### 2.1 `YOLO`
- `README.md:50`: `1. **Licence-Conscious AI**: No AGPL-3.0 dependencies (e.g. Ultralytics YOLO). The platform exclusively deploys permissively licensed architectures: **RTMDet** (MMDetection, Apache-2.0), **RT-DETRv2** (Apache-2.0), **ByteTrack** (MIT), and **CSRNet** (MIT).`
- `docs/THIRD_PARTY.md:43`: `In compliance with procurement regulations avoiding AGPL-3.0 (e.g. Ultralytics YOLO):`
- *Assessment:* Zero code or UI references. Only appears in explicit licensing compliance disclaimers.

### 2.2 `suspect`
- `README.md:51`: `Forbidden labels (*suspect*, *hostile*, *smuggler*) are replaced with neutral tactical descriptors...`
- `docs/ASSUMPTIONS.md:19`: `Deprecated / forbidden subjective terminology ("suspect", "hostile", "criminal", "smuggler", "threat actor") is prohibited in the UI and data layer.`
- `plan.md:27`: `suspect watchlist alert hits, appearance feature inspector.`
- `plan.md:188`: `4. Watchlist Matches: Suspect alert hits`
- `plan.md:196`: `Kerala Police suspect watchlist matching badge.`
- `plan.md:312`: `Add mock face crops and suspect watchlist matches.`
- *Assessment:* Code and UI are completely clean. `plan.md` planning notes contain legacy terminology that should be updated to "authorised watchlist" and "contact of interest".

### 2.3 `weapon`
- `plan.md:29`: `behavioral pattern analysis for person anomalies (loitering, fleeing, falls, weapons)...`
- `plan.md:228`: `Person Anomalies: Suspicious loitering (>5 min in restricted zone), running/fleeing, sudden falls, weapon brandishing.`
- *Assessment:* Zero hits in `src/` codebase. Only present in historical `plan.md` document.

### 2.4 `Dual RTX` / `RTX`
- `plan.md:238`: `GPU Cluster health (NVIDIA RTX 4090 / A100)...`
- `src/features/health/SystemHealth.tsx:218`: `subLabel="RTX 4090"`
- `src/features/models/AIModelsPage.tsx:166`: `<div className="text-xl font-bold font-mono">2x NVIDIA RTX 4090</div>`
- *Assessment:* Found in `AIModelsPage.tsx` and `SystemHealth.tsx`. Must be clearly labeled as "Target — to be benchmarked on approved infrastructure" rather than implying physical measured hardware in the demo.

### 2.5 `ComingSoon`
- `plan.md:90`: `| /admin | ComingSoon | Retained Stub | Administrative settings and RBAC |`
- `src/App.tsx:11`: `import ComingSoon from '@/components/ComingSoon';`
- `src/App.tsx:99`: `<Route path="contacts" element={<ComingSoon title="Contacts" description="Persistent Coastal Contacts..." />} />`
- `src/App.tsx:100`: `<Route path="contacts/:id" element={<ComingSoon title="Contact Detail" />} />`
- `src/App.tsx:101`: `<Route path="admin" element={<ComingSoon title="Administration" description="User & role management, RBAC, audit log, retention policies..." />} />`
- `src/components/ComingSoon.tsx:8`: `interface ComingSoonProps {`
- `src/components/ComingSoon.tsx:13`: `export default function ComingSoon({ title, description }: ComingSoonProps)`
- `tree_structure.txt:48`: `ComingSoon.tsx`
- *Assessment:* Active stubs on `/contacts`, `/contacts/:id`, and `/admin`. Must be replaced with functional production implementations in subsequent phases.

### 2.6 `console.log`
- `src/features/alerts/AlertQueue.tsx:330`: `onClick={() => alert.event.type && console.log('escalate')}`
- *Assessment:* 1 active debugging hit in `AlertQueue.tsx`. Needs removal or replacement with dispatch modal.

### 2.7 `TODO`
- *Assessment:* 0 hits across repository.

### 2.8 `lorem`
- *Assessment:* 0 hits across repository.

### 2.9 `d:\\` / `D:\`
- `plan.md:2`: `**Document Reference:** D:\SmartQEye_Costal\Costal Police .docx`
- `plan.md:4`: `**Target Project:** D:\SmartQEye_Costal\smartqeye-coastal`
- `tree_structure.txt:2`: `Directory: D:\COSTAL_DEMO`
- `tree_structure.txt:5`: `D:\COSTAL_DEMO`
- *Assessment:* Personal/local Windows paths remain in `plan.md` and `tree_structure.txt`. Should be sanitized or kept internal.

---

## 3. Recommended Remediation Plan
1. **Remove `console.log`** from `src/features/alerts/AlertQueue.tsx`.
2. **Implement full `/contacts` and `/contacts/:id`** to replace `ComingSoon` stub with persistent coastal contact intelligence.
3. **Implement full `/admin`** with user RBAC, cryptographic audit logging, and data retention settings.
4. **Implement `/rules`** (or Alert Rules configuration) as required by RFP §7.
5. **Implement 20-feed multiview grid** and RGB/Thermal mode switcher in `/live`.
6. **Implement Abandoned-Object Detection** module in shoreline intrusion analytics.
7. **Refactor direct `mockData.ts` imports** in analytics pages to use `src/lib/api.ts`.

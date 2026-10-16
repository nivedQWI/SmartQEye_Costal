# Modules & Feature Capabilities

SmartQEye Coastal organizes coastal surveillance capabilities into focused operational modules. Below is a detailed breakdown of each page module, recent feature enhancements, and role gating.

---

## 1. Tactical Command Center (`/`)

The Command Center provides a high-level operational overview across the Kerala coastline:

- **Full Canvas Map:** Displays real-time geofenced zones, patrolling UAVs, and active alerts positioned across Kerala coastal sectors (Vizhinjam, Kochi, Kozhikode, Kannur).
- **Map Layers Toggle:** Interactive floating control allowing operators to toggle visibility of Security Zones, Drone Paths, and Alert Markers independently.
- **Adaptive Alert Queue:** The right sidebar displays live high-priority alerts with pulse indicators. If an active role lacks alerts permission, the queue collapses gracefully, displaying only Mission Stats.
- **Mission Stats Box:** Summarizes the active mission title, count of new unacknowledged alerts, and active UAV telemetry feeds.

---

## 2. Mission Control (`/missions`)

The Mission Control module manages drone sortie deployments, transmission parameters, and video ingestion:

- **Mission Configuration:** Operators select squadron designations (`ALPHA`, `BRAVO`, `CHARLIE`, `DELTA`), specify mission names, assign UAV crafts, and designate coastal deployment targets.
- **Direct Video Ingestion:**
  - Integrated dropzone allows uploading recorded coastal patrol videos (MP4, WebM, MOV).
  - Video stream player displays a live decoded feed upon clicking "Start Mission" with muted autoplay and automatic object URL lifecycle cleanup.
  - Built-in codec fallback warns if raw unconverted stream formats are loaded.
- **Transmission Controls:** Configures video source protocols (RTMP, RTSP, WebRTC, Encrypted Tunnel), bitrate (up to 12.5 Mbps), and frame rates (30–60 FPS).
- **Historical Mission Log:**
  - Tabular archive of completed missions with start/end timestamps, duration, pilot names, and status chips.
  - Protected with role-gated deletion (`DELETE_MISSION`), visible only to `SUPERVISOR` and `SYS_ADMIN`.
- **Mission Start/Stop Controls:** Gated by `START_STOP_MISSION`, allowing only `OPERATOR` and `SUPERVISOR` to trigger or abort missions.

---

## 3. Alerts & Incident Queue (`/alerts`, `/alerts/:id`)

The alert triage system processes multi-sensor intelligence:

- **Severity Triage:** Alerts are classified into `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, and `INFO` with standardized color coding and pulse animations.
- **Quick Row Actions:** Row-level "Ack" and "↑" (escalate) buttons allow rapid handling directly from the table.
- **Keyboard Accelerators:**
  - Press `[A]` to acknowledge selected alert.
  - Press `[E]` to escalate selected alert.
  - Shortcut hints and key listeners are automatically deactivated for `AUDITOR` and roles without triage authorization.
- **Incident Detail View (`/alerts/:id`):**
  - Displays high-resolution snapshot imagery, bounding boxes, target coordinates, and detection confidence.
  - Features cryptographic SHA-256 hash verification verifying chain-of-custody integrity.
  - Export report functionality is gated by `EXPORT_DOWNLOAD` (accessible to `SUPERVISOR` and `AUDITOR`).

---

## 4. System Health & Edge Infrastructure (`/health`)

Monitors computing hardware and distributed edge servers deployed across coastal police stations:

- **Cluster Architecture:** Tracks cluster nodes at Vizhinjam Port Base, Kochi Harbor Station, and Kozhikode Coastal Command.
- **Resource Telemetry:** Real-time metrics for CPU utilization, GPU temperature, VRAM allocation, network bandwidth, and memory consumption.
- **Node Management:** Features "Restart Node" and "Force Sync" operations, strictly gated by `RESTART_NODE` and restricted to `SYS_ADMIN`.

---

## 5. AI Models & Neural Orchestration (`/models`)

Maintains the computer vision and neural inference models running on drone payloads and edge servers:

- **Active Model Registry:**
  - *YOLOv8x Maritime Vessel Classifier* (v2.4.1)
  - *Person Re-Identification Deep Cosine Metric* (v3.1.0)
  - *Crowd Density & Flow Estimator* (v1.9.3)
  - *Coastal Intrusion Anomaly Autoencoder* (v2.0.4)
- **Model Hot-Swapping:** Allows zero-downtime weight hot-swapping during active missions. Strictly gated by `HOT_SWAP_MODEL` (restricted to `SYS_ADMIN`).

---

## 6. Police Reports & Regulatory Audit (`/reports`)

Handles official documentation, incident logging, and compliance reporting:

- **Automated Report Generation:**
  - Daily Coastal Surveillance Summaries.
  - Incident Escalation Briefings.
  - Evidentiary Chain-of-Custody Certificates.
  - Gated by `GENERATE_SIGN_REPORT` (restricted to `SUPERVISOR`).
- **Export & Archival:**
  - Instant PDF and CSV export of historical reports with cryptographic digital signatures.
  - Gated by `EXPORT_DOWNLOAD` (accessible to `SUPERVISOR` and `AUDITOR`).

---

## 7. Specialized AI Analytics Pages

Accessible to `SUPERVISOR` for deep-dive investigation:

- **Crowd Analytics (`/crowd-analytics`):** Real-time beach density heatmaps, flow vectors, and threshold alarms for public gatherings.
- **Vehicle & Maritime (`/vehicle-maritime`):** AIS vessel tracking, speed violation alerts, unregistered skiff detection, and harbor entrance logs.
- **Person Re-ID (`/person-reid`):** Multi-camera appearance matching across coastal watchtowers and port facilities.
- **Intrusion Detection (`/intrusion-detection`):** Perimeter breach monitoring with response boat dispatch controls (`DISPATCH_INTERCEPTOR`).
- **Anomaly Monitor (`/anomaly-monitor`):** Unsupervised behavioural anomaly alerts (loitering skiffs, nighttime landings).


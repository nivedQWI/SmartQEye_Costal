# SmartQEye Coastal — API Specification & Integration Reference

**System:** SmartQEye Coastal  
**API Version:** v1 (OpenAPI 3.1.0)  
**Base URL:** `/api/v1`  
**Schema Definition:** `docs/openapi.yaml`  
**Classification:** RESTRICTED — OFFICIAL USE ONLY  

---

## 1. Overview & Architecture

The SmartQEye Coastal API layer provides high-throughput, low-latency RESTful endpoints and real-time WebSocket streams for multi-drone video surveillance, tactical GIS telemetry, operational alerts, and forensic audit logging.

The frontend abstracts all communication through the `ApiClient` interface (`src/lib/apiClient.ts`), seamlessly supporting two execution modes configured at runtime via `/config.js` or `VITE_API_MODE`:
1. **Mock Mode (`API_MODE=mock`)**: Powered by an internal scenario engine (`src/lib/scenario.ts`, `src/lib/mockData.ts`) suitable for demonstrations, sandbox evaluations, and training.
2. **Live Mode (`API_MODE=live`)**: Connects to the production FastAPI backend cluster with JWT authentication, automatic token renewal, exponential backoff retries, and strict Zod payload validation (`src/lib/schemas.ts`).

---

## 2. Authentication & Authorization

All protected endpoints require an HTTP `Authorization` header containing a valid Bearer JWT:

```http
Authorization: Bearer <JWT_TOKEN>
```

### 2.1 Login
- **Endpoint:** `POST /api/v1/auth/login`
- **Request Body:**
  ```json
  {
    "username": "op.rajan",
    "password": "<PASSWORD>",
    "mfaCode": "123456"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "tokenType": "Bearer",
    "expiresIn": 28800,
    "user": {
      "id": "u-01",
      "username": "op.rajan",
      "name": "Rajan K. (HC 4102)",
      "badge": "KP-COASTAL-4102",
      "station": "Vizhinjam Coastal Police Station",
      "role": "OPERATOR"
    }
  }
  ```

### 2.2 Token Refresh
- **Endpoint:** `POST /api/v1/auth/refresh`
- **Request Body:** `{ "refreshToken": "<REFRESH_TOKEN>" }`
- **Response (200 OK):** `{ "accessToken": "<NEW_TOKEN>", "expiresIn": 28800 }`

---

## 3. Core REST Endpoints

### 3.1 Operational Alerts (`/api/v1/alerts`)
- `GET /api/v1/alerts`: Returns list of active and historical surveillance alerts with optional query parameters (`status`, `severity`, `feedId`, `zoneId`, `limit`, `offset`).
- `GET /api/v1/alerts/{id}`: Returns complete Evidence-Linked Incident Record (ELIR) details including keyframe URLs, context profiles, and audit log.
- `PATCH /api/v1/alerts/{id}/status`: Updates workflow status (`ACKNOWLEDGED`, `UNDER_REVIEW`, `ESCALATED`, `RESOLVED`, `FALSE_POSITIVE`). Requires mandatory transition note and audit reason.

### 3.2 Live Feeds & Telemetry (`/api/v1/feeds`)
- `GET /api/v1/feeds`: Returns status for all configured UAV surveillance feeds (up to 32 streams).
- `GET /api/v1/feeds/{id}`: Returns feed metadata, current state (`LIVE`, `BUFFERING`, `EDGE_SYNC_LAG`, `NO_SIGNAL`), active drone assignment, and CFS metrics.
- `GET /api/v1/feeds/{id}/telemetry`: Returns latest flight telemetry point (`lat`, `lon`, `altitudeM`, `headingDeg`, `groundSpeedMs`, `batteryPct`, `gimbalPitchDeg`).

### 3.3 Persistent Contacts (`/api/v1/contacts`)
- `GET /api/v1/contacts`: Returns catalog of tracked maritime contacts, vessel classification, attention levels (`RECORD_ONLY`, `MONITOR`, `ATTENTION`, `CRITICAL`), and camera-hop dwell history.
- `GET /api/v1/contacts/{id}`: Returns deep track trajectory, occlusion flags, behavior timeline, and multi-vessel proximity relationships.

### 3.4 Tactical Missions (`/api/v1/missions`)
- `GET /api/v1/missions`: Retrieves scheduled and ongoing drone sorties.
- `POST /api/v1/missions`: Creates a new flight mission with assigned UAV, flight path corridor, and Kerala coastal context profile.

### 3.5 Geofenced Zones (`/api/v1/zones`)
- `GET /api/v1/zones`: Returns GeoJSON feature collection of coastal restricted zones, security buffers, and shipping lanes.
- `POST /api/v1/zones`: Creates or updates a geofenced area. Requires `MANAGE_ZONES` permission.

### 3.6 Cryptographic Audit Ledger (`/api/v1/audit`)
- `GET /api/v1/audit`: Returns paginated cryptographic audit blocks with SHA-256 block hash signatures.
- `POST /api/v1/audit`: Logs an audited user action.

### 3.7 Health & Liveness
- `GET /api/v1/healthz`: Unauthenticated container liveness probe returning HTTP 200 `OK`.
- `GET /api/v1/system/health`: Detailed subsystem diagnostics (GPU VRAM, edge node latency, storage utilization, model latency).

---

## 4. Real-Time Streaming (WebSocket)

- **WebSocket URI:** `ws://<HOST>:8000/api/v1/events`
- **Connection Protocol:** Standard WebSocket with Bearer authentication ticket.
- **Message Format:** JSON envelope containing `type`, `payload`, and `timestamp`.

### Event Types:
1. `ALERT_NEW`: Dispatched immediately when a high-priority contact or zone breach occurs.
   ```json
   {
     "type": "ALERT_NEW",
     "payload": {
       "id": "alr-01",
       "alertCode": "ALR-20261016-0001",
       "severity": "CRITICAL",
       "type": "intrusion",
       "title": "High-Speed Vessel Approaching Breakwater"
     }
   }
   ```
2. `TELEMETRY_UPDATE`: 10 Hz flight updates per active drone.
3. `FEED_STATE_CHANGE`: Dispatched on edge backhaul degradation or state change.
4. `CONTACT_UPDATE`: Position, heading, and attention level changes for tracked vessels.
5. `HEALTH_UPDATE`: System resource metrics.

---

## 5. Client Abstraction (`src/lib/api.ts` & `src/lib/realtime.ts`)

The React application consumes APIs exclusively through centralized singletons:

```typescript
import { alertsApi, feedsApi, contactsApi } from '@/lib/api';
import { realtimeClient } from '@/lib/realtime';

// Fetch active alerts
const activeAlerts = await alertsApi.getAlerts({ status: 'NEW' });

// Subscribe to real-time events
const sub = realtimeClient.subscribeAlerts((alert) => {
  console.log('Received real-time alert:', alert.alertCode);
});

// Clean up on component unmount
sub.unsubscribe();
```

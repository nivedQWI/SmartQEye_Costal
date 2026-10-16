# Kerala Coastal C4I & CAD Integration API Manual

## 1. Overview
SmartQEye Coastal exposes OpenAPI 3.1 RESTful endpoints and real-time WebSocket / Webhook interfaces for integration with Kerala Police CAD (Computer Aided Dispatch) and State Emergency Operation Centers.

## 2. Key Endpoints
- `GET /api/v1/health` — System status, central GPU temperature, edge sync lag.
- `GET /api/v1/feeds` — Active drone video feeds and telemetry channels.
- `GET /api/v1/incidents` — ELIR incident dossiers with Section 65B hash seals.
- `POST /api/v1/incidents/:id/export` — Generate cryptographic ZIP evidence package.
- `POST /api/v1/webhooks/cad` — Real-time event notifications to Police Interceptor Units.

## 3. Data Integrity & Security
All integration calls require Mutual TLS (mTLS) and Bearer tokens signed by the Kerala Police Key Management Service (KMS).

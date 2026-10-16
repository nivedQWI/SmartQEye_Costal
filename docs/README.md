# SmartQEye Coastal — System Documentation

Welcome to the documentation suite for **SmartQEye Coastal**, the real-time AI-powered coastal surveillance, maritime tracking, and tactical command platform designed for the Kerala Police Department.

---

## Documentation Index

| Document | Description |
| :--- | :--- |
| **[Role-Based Access Control](ROLE_BASED_ACCESS_CONTROL.md)** | Detailed specification of the 4 active roles, login flow, MFA, route guards, and permission matrix (`can(role, action)`). |
| **[UI & Sidebar Navigation](UI_AND_SIDEBAR_NAVIGATION.md)** | Architecture of the adaptive navigation shell, dynamic section ordering, top header controls, and styling constraints. |
| **[Modules & Capabilities](MODULES_AND_CAPABILITIES.md)** | Deep dive into every page module (Mission Control with video stream ingestion, Tactical Command Center, Alert Queue, System Health, AI Models, etc.). |
| **[Docker & Deployment](DOCKER_AND_DEPLOYMENT.md)** | Guide to running SmartQEye Coastal locally with Vite or containerized with Docker (production multi-stage Nginx and hot-reloading dev container). |

---

## Architecture At A Glance

```
+-----------------------------------------------------------------------------------+
|                                 USER / CLIENT                                     |
+-----------------------------------------------------------------------------------+
                                          |
                         [ Authentication & Role Selection ]
                         - OPERATOR
                         - SUPERVISOR
                         - SYS_ADMIN
                         - AUDITOR
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                              REACT APPLICATION SHELL                              |
|                                                                                   |
|  +---------------------------+  +-----------------------------------------------+ |
|  |     ADAPTIVE SIDEBAR      |  |                TOP HEADER BAR                 | |
|  | - Filtered per role       |  | - Mission Selector (editable vs read-only)    | |
|  | - Dynamic section sorting |  | - Alert Bell (scoped to operational roles)    | |
|  | - Empty sections removed  |  | - User profile (dev switcher hidden)          | |
|  +---------------------------+  +-----------------------------------------------+ |
|                                                                                   |
|  +------------------------------------------------------------------------------+ |
|  |                       ROUTE GUARD & VIEWPORT OUTLET                          | |
|  | - RequireRole: Enforces allowedRoutes per active role                        | |
|  | - CatchAll: Unpermitted route direct requests redirect to role landing page  | |
|  +------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

---

## Key Principles

1. **Strict Role-Based Security:** Every route, page, and mutation button is strictly gated against the active role.
2. **Clean DOM Pruning:** Unauthorized actions and buttons are removed from the DOM rather than greyed out or disabled, ensuring a natural interface without awkward gaps.
3. **Evidence-Based Chain of Custody:** High-criticality events, reports, and sortie logs are cryptographically tracked with SHA-256 signatures.
4. **Resilient Containerization:** Production-ready multi-stage Nginx container with Gzip, security headers, SPA fallbacks, and health checks on port 8080, alongside a hot-reloading container on port 5174.

# Role-Based Access Control (RBAC) Specification

SmartQEye Coastal enforces strict role-based access control configured for customer demonstrations and operational deployments. Access boundaries exist at two levels:

1. **Page/Route Level:** Gated by `canAccess(role, path)` and enforced by `<RequireRole>` in `src/App.tsx`.
2. **Action/Button Level:** Gated by `can(role, action)` with unauthorized interactive elements pruned directly from the DOM.

---

## 1. Active User Roles

| Role Key | Role Title | Landing Page | Primary Operational Focus |
| :--- | :--- | :--- | :--- |
| **`OPERATOR`** | Tactical Operator | `/alerts` | Coastal surveillance, active alert triage, live reconnaissance, and mission execution. |
| **`SUPERVISOR`** | Station Duty Officer | `/reports` | Incident oversight, mission dispatch, zone geofence modifications, and signed report generation. |
| **`SYS_ADMIN`** | Systems & Network Admin | `/health` | Edge cluster health, node restarts, AI neural model hot-swapping, and system diagnostics. |
| **`AUDITOR`** | Police Inspection Auditor | `/history` | Historical sortie audit, incident replay review, evidence chain of custody, and compliance export. |

---

## 2. Authentication & Login Flow

The login experience is implemented in `src/features/login/LoginPage.tsx`:

1. **Role Selection Dropdown:**
   - Positioned above the "Sign in with Police SSO" button.
   - Allows instant selection between `OPERATOR`, `SUPERVISOR`, `SYS_ADMIN`, and `AUDITOR`.
   - Selecting any role immediately autofills the username to the role's mock officer account and autofills the password to `admin123`.

2. **Single Sign-On (Police SSO):**
   - Direct button to authenticate via the Kerala Police Enterprise SSO provider.
   - Sets the active session to the selected role and proceeds directly to the role's landing page.

3. **Two-Factor Authentication (MFA):**
   - When submitting credentials directly, a 6-digit MFA modal appears.
   - Any 6-digit PIN (default demo: `123456`) authenticates the user.

4. **Session Persistence & Redirects:**
   - The authenticated user is stored in `useAuthStore` (`localStorage`).
   - If an authenticated user navigates to `/login`, they are immediately redirected to their role's landing page.
   - Logging out clears the session state and returns to `/login`.

---

## 3. Route Guard & Protection Architecture

Route guarding is managed in `src/App.tsx` and configured via `src/lib/roleConfig.ts`:

### Allowed Routes per Role

```typescript
export const ROLE_CONFIG: Record<UserRole, RoleConfigEntry> = {
  OPERATOR: {
    landing: '/alerts',
    allowedRoutes: ['/alerts', '/alerts/:id', '/missions', '/map', '/reports', '/health'],
  },
  SUPERVISOR: {
    landing: '/reports',
    allowedRoutes: [
      '/reports', '/health', '/admin', '/', '/alerts', '/alerts/:id',
      '/missions', '/map', '/history', '/live', '/crowd-analytics',
      '/vehicle-maritime', '/person-reid', '/intrusion-detection', '/anomaly-monitor'
    ],
  },
  SYS_ADMIN: {
    landing: '/health',
    allowedRoutes: ['/health', '/models', '/admin'],
  },
  AUDITOR: {
    landing: '/history',
    allowedRoutes: ['/history', '/alerts', '/alerts/:id', '/missions', '/reports', '/admin'],
  },
};
```

### Route Guard Enforcement (`RequireRole`)
```tsx
function RequireRole({ children, path }: { children: React.ReactNode; path: string }) {
  const { user, devRole } = useAuthStore();
  const activeRole = user?.role ?? devRole ?? 'OPERATOR';

  if (!canAccess(activeRole, path)) {
    const landing = ROLE_CONFIG[activeRole]?.landing ?? '/alerts';
    return <Navigate to={landing} replace />;
  }

  return <>{children}</>;
}
```

Any attempt by a user to paste or enter a URL outside their permitted list immediately redirects them to their designated landing page.

---

## 4. Action Permissions Matrix (`can(role, action)`)

Actions are defined in `src/lib/roleConfig.ts` with granular action keys:

```typescript
export type RoleAction =
  | 'ACK_ALERT'
  | 'ESCALATE_ALERT'
  | 'RESOLVE_ALERT'
  | 'START_STOP_MISSION'
  | 'DELETE_MISSION'
  | 'DISPATCH_INTERCEPTOR'
  | 'EDIT_GEOFENCE'
  | 'GENERATE_SIGN_REPORT'
  | 'EXPORT_DOWNLOAD'
  | 'HOT_SWAP_MODEL'
  | 'RESTART_NODE'
  | 'CHANGE_MISSION';
```

| Action Key | Allowed Roles | Impacted Component | DOM Behavior when Unauthorized |
| :--- | :--- | :--- | :--- |
| **`ACK_ALERT`** | `OPERATOR`, `SUPERVISOR` | `AlertQueue.tsx`, `AppShell.tsx` | "Ack" row buttons and banner action button removed; shortcut `[A]` disabled. |
| **`ESCALATE_ALERT`** | `OPERATOR`, `SUPERVISOR` | `AlertQueue.tsx` | "↑" escalate button and preview escalate button removed; shortcut `[E]` disabled. |
| **`RESOLVE_ALERT`** | `SUPERVISOR` | `IntrusionDetectionPage.tsx` | "Resolve" incident button removed from tactical event feed. |
| **`START_STOP_MISSION`** | `OPERATOR`, `SUPERVISOR` | `MissionsPage.tsx` | "Start Mission" and "Stop Mission" buttons removed from DOM. |
| **`DELETE_MISSION`** | `SUPERVISOR`, `SYS_ADMIN` | `MissionsPage.tsx` | Table action header and trash button removed from Historical Mission Log. |
| **`DISPATCH_INTERCEPTOR`**| `OPERATOR`, `SUPERVISOR` | `IntrusionDetectionPage.tsx` | "Dispatch" response boat button removed. |
| **`EDIT_GEOFENCE`** | `SUPERVISOR` | `MapGIS.tsx` | Polygon drawing tool, "+ New Zone", and save buttons removed. |
| **`GENERATE_SIGN_REPORT`**| `SUPERVISOR` | `ReportsPage.tsx` | "Generate Signed Report" form section removed. |
| **`EXPORT_DOWNLOAD`** | `SUPERVISOR`, `AUDITOR` | `ReportsPage.tsx`, `AlertDetail.tsx`| "Download Report" table column and incident "Export" buttons removed. |
| **`HOT_SWAP_MODEL`** | `SYS_ADMIN` | `AIModelsPage.tsx` | Cluster hot-swap action controls removed. |
| **`RESTART_NODE`** | `SYS_ADMIN` | `SystemHealth.tsx` | "Restart Node" and "Force Sync" buttons removed from edge cluster cards. |
| **`CHANGE_MISSION`** | `OPERATOR`, `SUPERVISOR` | `AppShell.tsx` | Top bar mission dropdown rendered as read-only text without arrow. |


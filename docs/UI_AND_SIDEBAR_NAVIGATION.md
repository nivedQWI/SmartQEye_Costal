# UI & Sidebar Navigation Architecture

SmartQEye Coastal utilizes an adaptive application shell (`src/components/AppShell.tsx`) that dynamically arranges navigation and header controls according to the active role's operational duties.

---

## 1. Dynamic Sidebar Ordering & Filtering Algorithm

Rather than showing static disabled links or leaving empty category headers, the sidebar automatically filters and reorganizes navigation sections:

1. **Filtering Allowed Links:** Every navigation item is checked against `canAccess(activeRole, item.to)`. Unpermitted items are excluded.
2. **Removing Empty Sections:** Any navigation section with zero visible items is completely pruned from the DOM.
3. **Ordering Items Within Sections:** Items within each section are arranged by their priority in the role's `allowedRoutes` array.
4. **Ordering Sections Dynamically:** Sections themselves are ordered by the earliest primary index of any item they contain. If a role prioritizes Reports, the "Analytics & Reporting" section elevates above secondary sections.

### Implementation Snippet (`src/components/AppShell.tsx`)
```typescript
const visibleSections = NAV_SECTIONS
  .map(section => {
    const visibleItems = section.items
      .filter(item => canAccess(activeRole, item.to))
      .sort((a, b) => {
        const idxA = allowedRoutes.indexOf(a.to);
        const idxB = allowedRoutes.indexOf(b.to);
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
      });
    return { ...section, items: visibleItems };
  })
  .filter(section => section.items.length > 0)
  .sort((a, b) => {
    const minA = Math.min(...a.items.map(i => {
      const idx = allowedRoutes.indexOf(i.to);
      return idx === -1 ? 999 : idx;
    }));
    const minB = Math.min(...b.items.map(i => {
      const idx = allowedRoutes.indexOf(i.to);
      return idx === -1 ? 999 : idx;
    }));
    return minA - minB;
  });
```

---

## 2. Role Sidebar Views

### OPERATOR (5 Sidebar Links)
- **Tactical Ops:**
  - Alerts (`/alerts`)
  - Mission Control (`/missions`)
  - Map / GIS (`/map`)
- **Analytics & Reporting:**
  - Police Reports (`/reports`)
- **Administration:**
  - System Health (`/health`)

*(Empty sections "AI Analytics" are excluded)*

### SUPERVISOR (14 Sidebar Links)
- **Analytics & Reporting:**
  - Police Reports (`/reports`)
- **Administration:**
  - System Health (`/health`)
  - Administration (`/admin`)
- **Tactical Ops:**
  - Command Center (`/`)
  - Alerts (`/alerts`)
  - Mission Control (`/missions`)
  - Map / GIS (`/map`)
  - History Playback (`/history`)
  - Live Monitor (`/live`)
- **AI Analytics:**
  - Crowd Analytics (`/crowd-analytics`)
  - Vehicle & Maritime (`/vehicle-maritime`)
  - Person Re-ID (`/person-reid`)
  - Intrusion Detection (`/intrusion-detection`)
  - Anomaly Monitor (`/anomaly-monitor`)

### SYS_ADMIN (3 Sidebar Links)
- **Administration:**
  - System Health (`/health`)
  - AI Models (`/models`)
  - Administration (`/admin`)

*(All tactical ops and AI analytics feeds are excluded)*

### AUDITOR (5 Sidebar Links)
- **Tactical Ops:**
  - History Playback (`/history`)
  - Alerts (`/alerts`)
  - Mission Control (`/missions`)
- **Analytics & Reporting:**
  - Police Reports (`/reports`)
- **Administration:**
  - Administration (`/admin`)

---

## 3. Top Header Bar Scoping

The header bar provides continuous situational awareness while respecting role boundaries:

1. **Active Mission Selector:**
   - **OPERATOR & SUPERVISOR:** Renders as an interactive dropdown selector allowing active drone mission switching.
   - **SYS_ADMIN & AUDITOR:** Renders as a clean, read-only status label without dropdown chevron or click handlers.

2. **Alert Notification Bell:**
   - **OPERATOR, SUPERVISOR, AUDITOR:** Visible with live unread badge counter.
   - **SYS_ADMIN:** Completely hidden to maintain clean focus on infrastructure health.

3. **Critical Alert Banner:**
   - Appears at the top of the interface whenever a critical security incident occurs.
   - For `AUDITOR`, the "Acknowledge" button is hidden to prevent evidence state alterations.

4. **User Profile Menu:**
   - Displays current officer name, badge number, station assignment, and active role.
   - The legacy `Dev Switch Role` dropdown is removed from user view for production demos.
   - Sign Out button remains accessible to terminate the session.

---

## 4. UI Design System Guidelines

All interface components strictly conform to the existing visual tokens:
- **Typography:** JetBrains Mono for telemetry/data grids, Manrope for system copy, Fraunces for editorial headings.
- **Color Palette:** Coastal Police ink (`#0a2233`), deep ocean navy, sea-amber accents, and crisp muted borders (`var(--line)`).
- **DOM Stability:** Action elements are removed with conditional rendering (`{can(activeRole, ...) && (...) }`) rather than `opacity-0` or `disabled`, ensuring adjacent grid elements align naturally without empty gutters.
- **Copy Standards:** No emoji glyphs or punctuation symbols like em dashes or en dashes in newly added visible copy.


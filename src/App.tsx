// ============================================================
// SmartQEye Coastal — App Router
// As specified in Costal Police .docx
// ============================================================

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '@/components/AppShell';
import { useAuthStore } from '@/lib/store';
import { canAccess, ROLE_CONFIG } from '@/lib/roleConfig';
import type { UserRole } from '@/types';

// Lazy-loaded pages
const LoginPage             = lazy(() => import('@/features/login/LoginPage'));
const CommandCenter         = lazy(() => import('@/features/command/CommandCenter'));
const LiveMonitor           = lazy(() => import('@/features/live/LiveMonitor'));
const AlertQueue            = lazy(() => import('@/features/alerts/AlertQueue'));
const AlertDetail           = lazy(() => import('@/features/alerts/AlertDetail'));
const MapGIS                = lazy(() => import('@/features/map/MapGIS'));
const HistoryPlayback       = lazy(() => import('@/features/history/HistoryPlayback'));
const SystemHealthPage      = lazy(() => import('@/features/health/SystemHealth'));
const StyleGuide            = lazy(() => import('@/features/styleguide/StyleGuide'));

// Upgraded Production & AI Analytics Pages (Costal Police .docx)
const MissionsPage          = lazy(() => import('@/features/missions/MissionsPage'));
const ReportsPage           = lazy(() => import('@/features/reports/ReportsPage'));
const AIModelsPage          = lazy(() => import('@/features/models/AIModelsPage'));
const CrowdAnalyticsPage    = lazy(() => import('@/features/crowd/CrowdAnalyticsPage'));
const VehicleMaritimePage   = lazy(() => import('@/features/vehicle-maritime/VehicleMaritimePage'));
const PersonReidPage        = lazy(() => import('@/features/person-reid/PersonReidPage'));
const IntrusionDetectionPage = lazy(() => import('@/features/intrusion/IntrusionDetectionPage'));
const AnomalyMonitorPage    = lazy(() => import('@/features/anomaly/AnomalyMonitorPage'));
const OverviewDashboard     = lazy(() => import('@/features/overview/OverviewDashboard'));

// New Phase pages (RFP Compliance & Platform Architecture)
const FleetWallPage         = lazy(() => import('@/features/fleet/FleetWallPage'));
const ContactsPage          = lazy(() => import('@/features/contacts/ContactsPage'));
const ContactDetailPage     = lazy(() => import('@/features/contacts/ContactDetailPage'));
const AbandonedObjectsPage  = lazy(() => import('@/features/abandoned/AbandonedObjectsPage'));
const IncidentsPage         = lazy(() => import('@/features/incidents/IncidentsPage'));
const ZonesConfigPage       = lazy(() => import('@/features/config/ZonesConfigPage'));
const AlertConfigPage       = lazy(() => import('@/features/config/AlertConfigPage'));
const DeploymentPage        = lazy(() => import('@/features/platform/DeploymentPage'));
const IntegrationsPage      = lazy(() => import('@/features/platform/IntegrationsPage'));
const AdminPage             = lazy(() => import('@/features/admin/AdminPage'));
const AuditLogPage          = lazy(() => import('@/features/platform/AuditLogPage'));
const AcceptancePage        = lazy(() => import('@/features/platform/AcceptancePage'));
const HelpCenterPage        = lazy(() => import('@/features/help/HelpCenterPage'));
const NotFoundPage          = lazy(() => import('@/features/error/NotFoundPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

// ─── Page loading skeleton ────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex items-center justify-center h-full gap-3" style={{ color: 'var(--text-muted)' }}>
      <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      <span className="text-sm font-mono">Loading Coastal Operations...</span>
    </div>
  );
}

// ─── Auth & Role guards ───────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({ path, children }: { path: string; children: React.ReactNode }) {
  const { user, devRole } = useAuthStore();
  const location = useLocation();
  const activeRole: UserRole = user?.role ?? devRole ?? 'OPERATOR';

  if (!canAccess(activeRole, path) && !canAccess(activeRole, location.pathname)) {
    const landing = ROLE_CONFIG[activeRole]?.landing ?? '/';
    return <Navigate to={landing} replace />;
  }
  return <>{children}</>;
}

function CatchAll() {
  const { isAuthenticated, user, devRole } = useAuthStore();
  if (isAuthenticated) {
    const activeRole = user?.role ?? devRole ?? 'OPERATOR';
    const landing = ROLE_CONFIG[activeRole]?.landing ?? '/';
    return <Navigate to={landing} replace />;
  }
  return <Navigate to="/login" replace />;
}

// ─── App ─────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected shell */}
            <Route path="/" element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }>
              {/* Tactical Operations */}
              <Route index element={<RequireRole path="/"><CommandCenter /></RequireRole>} />
              <Route path="overview" element={<RequireRole path="/overview"><OverviewDashboard /></RequireRole>} />
              <Route path="live" element={<RequireRole path="/live"><LiveMonitor /></RequireRole>} />
              <Route path="alerts" element={<RequireRole path="/alerts"><AlertQueue /></RequireRole>} />
              <Route path="alerts/:id" element={<RequireRole path="/alerts/:id"><AlertDetail /></RequireRole>} />
              <Route path="map" element={<RequireRole path="/map"><MapGIS /></RequireRole>} />
              <Route path="missions" element={<RequireRole path="/missions"><MissionsPage /></RequireRole>} />
              <Route path="history" element={<RequireRole path="/history"><HistoryPlayback /></RequireRole>} />
              <Route path="fleet" element={<RequireRole path="/fleet"><FleetWallPage /></RequireRole>} />

              {/* AI Analytics Pages */}
              <Route path="crowd-analytics" element={<RequireRole path="/crowd-analytics"><CrowdAnalyticsPage /></RequireRole>} />
              <Route path="vehicle-maritime" element={<RequireRole path="/vehicle-maritime"><VehicleMaritimePage /></RequireRole>} />
              <Route path="person-reid" element={<RequireRole path="/person-reid"><PersonReidPage /></RequireRole>} />
              <Route path="intrusion-detection" element={<RequireRole path="/intrusion-detection"><IntrusionDetectionPage /></RequireRole>} />
              <Route path="anomaly-monitor" element={<RequireRole path="/anomaly-monitor"><AnomalyMonitorPage /></RequireRole>} />
              <Route path="abandoned-objects" element={<RequireRole path="/abandoned-objects"><AbandonedObjectsPage /></RequireRole>} />

              {/* Intelligence */}
              <Route path="contacts" element={<RequireRole path="/contacts"><ContactsPage /></RequireRole>} />
              <Route path="contacts/:id" element={<RequireRole path="/contacts/:id"><ContactDetailPage /></RequireRole>} />

              {/* Evidence & Review */}
              <Route path="incidents" element={<RequireRole path="/incidents"><IncidentsPage /></RequireRole>} />
              <Route path="incidents/:id" element={<RequireRole path="/incidents/:id"><AlertDetail /></RequireRole>} />

              {/* System & Governance */}
              <Route path="reports" element={<RequireRole path="/reports"><ReportsPage /></RequireRole>} />
              <Route path="models" element={<RequireRole path="/models"><AIModelsPage /></RequireRole>} />
              <Route path="health" element={<RequireRole path="/health"><SystemHealthPage /></RequireRole>} />

              {/* Configuration */}
              <Route path="config/zones" element={<RequireRole path="/config/zones"><ZonesConfigPage /></RequireRole>} />
              <Route path="config/alerts" element={<RequireRole path="/config/alerts"><AlertConfigPage /></RequireRole>} />

              {/* Platform */}
              <Route path="deployment" element={<RequireRole path="/deployment"><DeploymentPage /></RequireRole>} />
              <Route path="integrations" element={<RequireRole path="/integrations"><IntegrationsPage /></RequireRole>} />
              <Route path="admin" element={<RequireRole path="/admin"><AdminPage /></RequireRole>} />
              <Route path="audit" element={<RequireRole path="/audit"><AuditLogPage /></RequireRole>} />
              <Route path="acceptance" element={<RequireRole path="/acceptance"><AcceptancePage /></RequireRole>} />
              <Route path="help" element={<HelpCenterPage />} />

              {/* Auxiliary */}
              <Route path="styleguide" element={<StyleGuide />} />

              {/* In-shell 404 route */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<CatchAll />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

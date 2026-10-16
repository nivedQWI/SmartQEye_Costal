// ============================================================
// SmartQEye Coastal — App Router
// As specified in Costal Police .docx
// ============================================================

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '@/components/AppShell';
import { useAuthStore } from '@/lib/store';
import { RequirePermission } from '@/components/RequirePermission';
import ComingSoon from '@/components/ComingSoon';

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

// New Phase 1 Pages (RFP Compliance & Platform Architecture)
const FleetWallPage         = lazy(() => import('@/features/fleet/FleetWallPage'));
const ContactsPage          = lazy(() => import('@/features/contacts/ContactsPage'));
const ContactDetailPage    = lazy(() => import('@/features/contacts/ContactDetailPage'));
const AbandonedObjectsPage  = lazy(() => import('@/features/abandoned/AbandonedObjectsPage'));
const IncidentsPage         = lazy(() => import('@/features/incidents/IncidentsPage'));
const ZonesConfigPage       = lazy(() => import('@/features/config/ZonesConfigPage'));
const AlertConfigPage       = lazy(() => import('@/features/config/AlertConfigPage'));
const DeploymentPage        = lazy(() => import('@/features/platform/DeploymentPage'));
const IntegrationsPage      = lazy(() => import('@/features/platform/IntegrationsPage'));
const AdminPage             = lazy(() => import('@/features/admin/AdminPage'));
const AuditLogPage          = lazy(() => import('@/features/platform/AuditLogPage'));
const AcceptancePage        = lazy(() => import('@/features/platform/AcceptancePage'));
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

// ─── Auth guard ───────────────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
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
              {/* Operations */}
              <Route index element={<CommandCenter />} />
              <Route path="live" element={<LiveMonitor />} />
              <Route path="fleet-wall" element={<FleetWallPage />} />
              <Route path="fleet" element={<FleetWallPage />} />
              <Route path="alerts" element={<AlertQueue />} />
              <Route path="alerts/:id" element={<AlertDetail />} />
              <Route path="map" element={<MapGIS />} />
              <Route path="missions" element={<MissionsPage />} />

              {/* Intelligence */}
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="contacts/:id" element={<ContactDetailPage />} />
              <Route path="vehicle-maritime" element={<VehicleMaritimePage />} />
              <Route path="crowd-analytics" element={<CrowdAnalyticsPage />} />
              <Route path="intrusion-detection" element={<IntrusionDetectionPage />} />
              <Route path="anomaly-monitor" element={<AnomalyMonitorPage />} />
              <Route path="abandoned-objects" element={<AbandonedObjectsPage />} />
              <Route path="person-reid" element={<PersonReidPage />} />

              {/* Evidence & Review */}
              <Route path="history" element={<HistoryPlayback />} />
              <Route path="incidents" element={<IncidentsPage />} />
              <Route path="incidents/:id" element={<AlertDetail />} />
              <Route path="reports" element={<ReportsPage />} />

              {/* Configuration */}
              <Route
                path="config/zones"
                element={
                  <RequirePermission permission="MANAGE_ZONES">
                    <ZonesConfigPage />
                  </RequirePermission>
                }
              />
              <Route
                path="config/alerts"
                element={
                  <RequirePermission permission="MANAGE_ALERT_RULES">
                    <AlertConfigPage />
                  </RequirePermission>
                }
              />
              <Route
                path="models"
                element={
                  <RequirePermission permission="MANAGE_MODELS">
                    <AIModelsPage />
                  </RequirePermission>
                }
              />

              {/* Platform */}
              <Route path="deployment" element={<DeploymentPage />} />
              <Route path="platform/deployment" element={<DeploymentPage />} />
              <Route path="integrations" element={<IntegrationsPage />} />
              <Route path="platform/integrations" element={<IntegrationsPage />} />
              <Route path="health" element={<SystemHealthPage />} />

              <Route
                path="admin"
                element={
                  <RequirePermission permission="MANAGE_USERS">
                    <AdminPage />
                  </RequirePermission>
                }
              />
              <Route
                path="audit"
                element={
                  <RequirePermission permission="VIEW_AUDIT">
                    <AuditLogPage />
                  </RequirePermission>
                }
              />
              <Route path="acceptance" element={<AcceptancePage />} />


              {/* Auxiliary / Style Guide */}
              <Route path="styleguide" element={<StyleGuide />} />

              {/* In-shell 404 route */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Top-level catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

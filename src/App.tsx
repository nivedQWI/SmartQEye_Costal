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

// Eagerly loaded primary operational pages (Instantaneous 0ms switching, no network latency)
import LoginPage from '@/features/login/LoginPage';
import CommandCenter from '@/features/command/CommandCenter';
import MissionsPage from '@/features/missions/MissionsPage';
import FleetWallPage from '@/features/fleet/FleetWallPage';
import LiveMonitor from '@/features/live/LiveMonitor';
import OverviewDashboard from '@/features/overview/OverviewDashboard';
import AlertQueue from '@/features/alerts/AlertQueue';
import MapGIS from '@/features/map/MapGIS';

// Resilient dynamic loader with automatic retry on chunk network hiccups
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      console.warn('[Router] Chunk load error, retrying module import...', error);
      await new Promise(res => setTimeout(res, 250));
      return await factory();
    }
  });
}

// Resilient lazy-loaded secondary and platform pages
const AlertDetail            = lazyWithRetry(() => import('@/features/alerts/AlertDetail'));
const HistoryPlayback        = lazyWithRetry(() => import('@/features/history/HistoryPlayback'));
const SystemHealthPage       = lazyWithRetry(() => import('@/features/health/SystemHealth'));
const StyleGuide             = lazyWithRetry(() => import('@/features/styleguide/StyleGuide'));
const ReportsPage            = lazyWithRetry(() => import('@/features/reports/ReportsPage'));
const AIModelsPage           = lazyWithRetry(() => import('@/features/models/AIModelsPage'));
const CrowdAnalyticsPage     = lazyWithRetry(() => import('@/features/crowd/CrowdAnalyticsPage'));
const VehicleMaritimePage    = lazyWithRetry(() => import('@/features/vehicle-maritime/VehicleMaritimePage'));
const PersonReidPage         = lazyWithRetry(() => import('@/features/person-reid/PersonReidPage'));
const IntrusionDetectionPage = lazyWithRetry(() => import('@/features/intrusion/IntrusionDetectionPage'));
const AnomalyMonitorPage     = lazyWithRetry(() => import('@/features/anomaly/AnomalyMonitorPage'));
const CoastalContextPage     = lazyWithRetry(() => import('@/features/coastal-context/CoastalContextPage'));
const RecordedAnalysisPage   = lazyWithRetry(() => import('@/features/recorded-analysis/RecordedAnalysisPage'));
const ContactsPage           = lazyWithRetry(() => import('@/features/contacts/ContactsPage'));
const ContactDetailPage      = lazyWithRetry(() => import('@/features/contacts/ContactDetailPage'));
const IncidentsPage          = lazyWithRetry(() => import('@/features/incidents/IncidentsPage'));
const ZonesConfigPage        = lazyWithRetry(() => import('@/features/config/ZonesConfigPage'));
const AlertConfigPage        = lazyWithRetry(() => import('@/features/config/AlertConfigPage'));
const DeploymentPage         = lazyWithRetry(() => import('@/features/platform/DeploymentPage'));
const IntegrationsPage       = lazyWithRetry(() => import('@/features/platform/IntegrationsPage'));
const AdminPage              = lazyWithRetry(() => import('@/features/admin/AdminPage'));
const AuditLogPage           = lazyWithRetry(() => import('@/features/platform/AuditLogPage'));
const AcceptancePage         = lazyWithRetry(() => import('@/features/platform/AcceptancePage'));
const HelpCenterPage         = lazyWithRetry(() => import('@/features/help/HelpCenterPage'));
const NotFoundPage           = lazyWithRetry(() => import('@/features/error/NotFoundPage'));

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
              <Route path="recorded-analysis" element={<RequireRole path="/recorded-analysis"><RecordedAnalysisPage /></RequireRole>} />
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

              {/* Intelligence */}
              <Route path="contacts" element={<Navigate to="/coastal-context" replace />} />
              <Route path="contacts/:id" element={<Navigate to="/coastal-context" replace />} />
              <Route path="coastal-context" element={<RequireRole path="/coastal-context"><CoastalContextPage /></RequireRole>} />

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

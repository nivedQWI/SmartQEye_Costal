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
import ComingSoon from '@/components/ComingSoon';
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

              {/* AI Analytics Pages */}
              <Route path="crowd-analytics" element={<RequireRole path="/crowd-analytics"><CrowdAnalyticsPage /></RequireRole>} />
              <Route path="vehicle-maritime" element={<RequireRole path="/vehicle-maritime"><VehicleMaritimePage /></RequireRole>} />
              <Route path="person-reid" element={<RequireRole path="/person-reid"><PersonReidPage /></RequireRole>} />
              <Route path="intrusion-detection" element={<RequireRole path="/intrusion-detection"><IntrusionDetectionPage /></RequireRole>} />
              <Route path="anomaly-monitor" element={<RequireRole path="/anomaly-monitor"><AnomalyMonitorPage /></RequireRole>} />

              {/* System & Governance */}
              <Route path="reports" element={<RequireRole path="/reports"><ReportsPage /></RequireRole>} />
              <Route path="models" element={<RequireRole path="/models"><AIModelsPage /></RequireRole>} />
              <Route path="health" element={<RequireRole path="/health"><SystemHealthPage /></RequireRole>} />
              <Route path="styleguide" element={<StyleGuide />} />

              {/* Auxiliary stubs */}
              <Route path="contacts" element={<ComingSoon title="Contacts" description="Persistent Coastal Contacts — long-lived contact records, history, relationships, and behaviour. Coming in Phase 2." />} />
              <Route path="contacts/:id" element={<ComingSoon title="Contact Detail" />} />
              <Route path="admin" element={<RequireRole path="/admin"><ComingSoon title="Administration" description="User & role management, RBAC, audit log, retention policies. Coming in Phase 2." /></RequireRole>} />
              {/* NOTE: /rules route has been completely removed as per Costal Police .docx specifications */}
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<CatchAll />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

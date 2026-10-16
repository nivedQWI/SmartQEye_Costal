// ============================================================
// SmartQEye Coastal — App Router
// As specified in Costal Police .docx
// ============================================================

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '@/components/AppShell';
import { useAuthStore } from '@/lib/store';
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
              {/* Tactical Operations */}
              <Route index element={<CommandCenter />} />
              <Route path="live" element={<LiveMonitor />} />
              <Route path="alerts" element={<AlertQueue />} />
              <Route path="alerts/:id" element={<AlertDetail />} />
              <Route path="map" element={<MapGIS />} />
              <Route path="missions" element={<MissionsPage />} />
              <Route path="history" element={<HistoryPlayback />} />

              {/* AI Analytics Pages */}
              <Route path="crowd-analytics" element={<CrowdAnalyticsPage />} />
              <Route path="vehicle-maritime" element={<VehicleMaritimePage />} />
              <Route path="person-reid" element={<PersonReidPage />} />
              <Route path="intrusion-detection" element={<IntrusionDetectionPage />} />
              <Route path="anomaly-monitor" element={<AnomalyMonitorPage />} />

              {/* System & Governance */}
              <Route path="reports" element={<ReportsPage />} />
              <Route path="models" element={<AIModelsPage />} />
              <Route path="health" element={<SystemHealthPage />} />
              <Route path="styleguide" element={<StyleGuide />} />

              {/* Auxiliary stubs */}
              <Route path="contacts" element={<ComingSoon title="Contacts" description="Persistent Coastal Contacts — long-lived contact records, history, relationships, and behaviour. Coming in Phase 2." />} />
              <Route path="contacts/:id" element={<ComingSoon title="Contact Detail" />} />
              <Route path="admin" element={<ComingSoon title="Administration" description="User & role management, RBAC, audit log, retention policies. Coming in Phase 2." />} />
              {/* NOTE: /rules route has been completely removed as per Costal Police .docx specifications */}
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

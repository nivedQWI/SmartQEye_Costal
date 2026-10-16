// ============================================================
// SmartQEye Coastal — App Shell
// Adaptive UI, Dynamic Role Navigation & HarbourBar
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Anchor, LayoutDashboard, Monitor, Bell, Map, History,
  FileText, Shield, Cpu, Users, Radio,
  ChevronRight, LogOut, Sun, Moon, Laptop,
  AlertTriangle, Activity, Database, Terminal, PanelLeftClose, PanelLeft,
  Car, ScanFace, ShieldAlert, AlertOctagon, Grid, Sliders, Settings2,
  Server, Network, ScrollText, CheckSquare, PackageSearch, FolderArchive, Info,
  GraduationCap, HelpCircle, Search, ChevronDown
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';
import { cn, formatPct } from '@/lib/utils';
import { ISTClock } from '@/components/ISTClock';
import { AboutDialog } from '@/components/AboutDialog';
import { IdleTimeoutModal } from '@/components/IdleTimeoutModal';
import { TrainingModeBadge } from '@/components/TrainingModeBadge';
import { GuidedTour } from '@/components/GuidedTour';
import { GlobalSearchDialog } from '@/components/GlobalSearchDialog';
import { AlertDrawer } from '@/components/AlertDrawer';
import { ToastContainer } from '@/components/Toast';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import {
  useAlertStore, useAuthStore, useThemeStore,
  useHealthStore, useMissionStore, useLanguageStore
} from '@/lib/store';
import { t, type TranslationKey } from '@/lib/i18n';
import { simulator } from '@/lib/simulator';
import { ROLE_CONFIG, canAccess, can } from '@/lib/roleConfig';
import type { UserRole } from '@/types';

// Toggle to display developer role switcher in HarbourBar (hidden for customer demo)
const SHOW_DEV_ROLE_SWITCHER = false;

// ─── Nav Structure with Thematic Sections ────────────────────

interface NavEntry {
  to: string;
  label: string;
  labelKey?: TranslationKey;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
  roles: UserRole[];
  badgeKey?: 'alerts' | 'contacts';
}

interface NavSection {
  title: string;
  titleMl?: string;
  items: NavEntry[];
}

const ALL_ROLES: UserRole[] = ['OPERATOR', 'SUPERVISOR', 'SYS_ADMIN', 'AUDITOR'];

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Tactical Ops',
    titleMl: 'ടാക്ടിക്കൽ ഓപ്സ്',
    items: [
      { to: '/overview',           label: 'Overview Dashboard',  labelKey: 'nav_command_center', icon: Activity,        roles: ['OPERATOR'] },
      { to: '/',                   label: 'Command Center',      labelKey: 'nav_command_center', icon: LayoutDashboard, roles: ALL_ROLES },
      { to: '/live',               label: 'Live Monitor',        labelKey: 'nav_live',           icon: Monitor,         roles: ALL_ROLES },
      { to: '/fleet',              label: 'Fleet Wall',          labelKey: 'nav_fleet_wall',     icon: Grid,            roles: ALL_ROLES },
      { to: '/alerts',             label: 'Alerts',              labelKey: 'nav_alerts',         icon: Bell,            roles: ALL_ROLES, badgeKey: 'alerts' },
      { to: '/missions',           label: 'Mission Control',     labelKey: 'nav_missions',       icon: Anchor,          roles: ALL_ROLES },
      { to: '/map',                label: 'Map / GIS',           labelKey: 'nav_map',            icon: Map,             roles: ALL_ROLES },
      { to: '/history',            label: 'History Playback',    labelKey: 'nav_history',        icon: History,         roles: ALL_ROLES },
    ]
  },
  {
    title: 'AI Analytics',
    titleMl: 'എഐ അനലിറ്റിക്സ്',
    items: [
      { to: '/crowd-analytics',    label: 'Crowd Analytics',     labelKey: 'nav_crowd',          icon: Users,           roles: ALL_ROLES },
      { to: '/vehicle-maritime',   label: 'Vehicle & Maritime',  labelKey: 'nav_vehicle',        icon: Car,             roles: ALL_ROLES },
      { to: '/person-reid',        label: 'Person Re-ID',        labelKey: 'nav_reid',           icon: ScanFace,        roles: ALL_ROLES },
      { to: '/intrusion-detection',label: 'Intrusion Geofence',  labelKey: 'nav_intrusion',      icon: ShieldAlert,     roles: ALL_ROLES },
      { to: '/anomaly-monitor',    label: 'Anomaly Monitor',     labelKey: 'nav_anomaly',        icon: AlertOctagon,    roles: ALL_ROLES },
      { to: '/abandoned-objects',  label: 'Abandoned Objects',   labelKey: 'nav_abandoned',      icon: PackageSearch,   roles: ALL_ROLES },
    ]
  },
  {
    title: 'Intelligence & Evidence',
    titleMl: 'ഇന്റലിജൻസ് & തെളിവുകൾ',
    items: [
      { to: '/contacts',           label: 'Contacts',            labelKey: 'nav_contacts',       icon: Radio,           roles: ALL_ROLES, badgeKey: 'contacts' },
      { to: '/incidents',          label: 'Incident Records',    labelKey: 'nav_incidents',      icon: FolderArchive,   roles: ALL_ROLES },
    ]
  },
  {
    title: 'Analytics & Reporting',
    titleMl: 'അനലിറ്റിക്സ് & റിപ്പോർട്ടിംഗ്',
    items: [
      { to: '/reports',            label: 'Police Reports',      labelKey: 'nav_reports',        icon: FileText,        roles: ALL_ROLES },
    ]
  },
  {
    title: 'Administration',
    titleMl: 'അഡ്മിനിസ്ട്രേഷൻ',
    items: [
      { to: '/health',             label: 'System Health',       labelKey: 'nav_health',         icon: Activity,        roles: ALL_ROLES },
      { to: '/models',             label: 'AI Models Cluster',   labelKey: 'nav_models',         icon: Cpu,             roles: ALL_ROLES },
      { to: '/admin',              label: 'Administration',      labelKey: 'nav_admin',          icon: Shield,          roles: ['SYS_ADMIN', 'SUPERVISOR', 'AUDITOR'] },
      { to: '/audit',              label: 'Audit Log',           labelKey: 'nav_audit',          icon: ScrollText,      roles: ['SYS_ADMIN'] },
      { to: '/config/zones',       label: 'Zones & Context',     labelKey: 'nav_config_zones',   icon: Sliders,         roles: ['SUPERVISOR'] },
      { to: '/config/alerts',      label: 'Alert Configuration', labelKey: 'nav_config_alerts',  icon: Settings2,       roles: ['SUPERVISOR', 'SYS_ADMIN'] },
      { to: '/deployment',         label: 'Deployment & Compute',labelKey: 'nav_deployment',     icon: Server,          roles: ['SYS_ADMIN'] },
      { to: '/integrations',       label: 'API & Integrations',  labelKey: 'nav_integrations',   icon: Network,         roles: ['SYS_ADMIN'] },
      { to: '/acceptance',         label: 'Acceptance Console',  labelKey: 'nav_acceptance',     icon: CheckSquare,     roles: ['SYS_ADMIN', 'AUDITOR'] },
      { to: '/help',               label: 'Help & Training',     labelKey: 'nav_help',           icon: GraduationCap,   roles: ALL_ROLES },
    ]
  }
];

const ROLES: UserRole[] = ['OPERATOR', 'SUPERVISOR', 'SYS_ADMIN', 'AUDITOR'];

// ─── AppShell ─────────────────────────────────────────────────

export function AppShell() {
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1366 : false
  );
  const [aboutOpen, setAboutOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);

  const { user, devRole, logout, setDevRole } = useAuthStore();
  const activeRole: UserRole = user?.role ?? devRole ?? 'OPERATOR';
  const allowedRoutes = ROLE_CONFIG[activeRole]?.allowedRoutes ?? [];

  const { mode, setMode, resolveTheme, resolved } = useThemeStore();
  const { criticalBanner, unreadCount, addAlert, dismissBanner } = useAlertStore();
  const { updateHealth } = useHealthStore();
  const { missions, activeMissionId, setActiveMission } = useMissionStore();
  const { language, setLanguage } = useLanguageStore();

  const navigate = useNavigate();
  const location = useLocation();

  const activeMission = missions.find(m => m.id === activeMissionId);
  const health = useHealthStore(s => s.health);
  const liveFeeds = health.feeds.filter(f => f.state === 'LIVE').length;
  const totalFeeds = health.feeds.length;

  // Initialise theme
  useEffect(() => {
    resolveTheme();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (mode === 'system') resolveTheme(); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  // Start simulator
  useEffect(() => {
    simulator.start();
    const unsub = simulator.subscribe(event => {
      if (event.type === 'ALERT_NEW') addAlert(event.payload);
      if (event.type === 'HEALTH_UPDATE') updateHealth(event.payload);
    });
    return () => { simulator.stop(); unsub(); };
  }, []);

  // Compute Breadcrumb from current path
  const breadcrumbs = useMemo(() => {
    const path = location.pathname;
    if (path === '/') return [{ label: 'Tactical Ops', path: '/' }, { label: 'Command Center', path: '/' }];

    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (item.to !== '/' && path.startsWith(item.to)) {
          const crumbs = [
            { label: section.title, path: item.to },
            { label: item.label, path: item.to },
          ];

          const subId = path.replace(item.to, '').replace(/^\//, '');
          if (subId) {
            crumbs.push({ label: subId, path });
          }
          return crumbs;
        }
      }
    }
    return [{ label: 'Navigation', path }, { label: path.replace(/^\//, ''), path }];
  }, [location.pathname]);

  // Dynamic Sidebar Ordering & Filtering Algorithm (UI_AND_SIDEBAR_NAVIGATION.md)
  const visibleSections = useMemo(() => {
    return NAV_SECTIONS
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
  }, [activeRole, allowedRoutes]);

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        {/* ── Skip Link for Keyboard / Accessibility ── */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-[var(--sea-600)] focus:text-white focus:rounded-lg focus:shadow-xl focus:font-bold focus:text-xs"
        >
          Skip to main content
        </a>

        {/* ── Persistent Classification Strip (Top) ── */}
        <div
          className="w-full py-0.5 px-4 text-center text-[10px] font-mono font-bold tracking-widest uppercase flex items-center justify-between border-b z-30 select-none flex-shrink-0"
          style={{
            background: '#042F2E',
            color: '#5EEAD4',
            borderColor: 'rgba(94, 234, 212, 0.25)',
          }}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-[#5EEAD4]" />
            <span>RESTRICTED · KERALA POLICE INTERNAL OPERATIONAL USE ONLY</span>
          </div>
          <span className="hidden sm:inline">SECTION 65B INDIAN EVIDENCE ACT & SECTION 63 BSA COMPLIANT</span>
          <span>DRONE FORENSIC LAB</span>
        </div>

        {/* ── Body Container with Rail + Main ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ══════════════════════════════════════════
              LEFT SIDEBAR — always visible, collapsible
             ══════════════════════════════════════════ */}
          <aside
            className={cn(
              'flex flex-col h-full flex-shrink-0 border-r z-30 transition-all duration-200 select-none shadow-sm',
            )}
            style={{
              width: collapsed ? '64px' : '250px',
              background: 'var(--panel)',
              borderColor: 'var(--line)',
            }}
          >
            {/* ── Logo + app name ── */}
            <div
              className="flex items-center gap-2.5 h-14 px-3 border-b flex-shrink-0"
              style={{ borderColor: 'var(--line)' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white p-0.5 border shadow-xs overflow-hidden"
                style={{ borderColor: 'var(--line)' }}
              >
                <img
                  src="/QW_logo.png"
                  alt="Quantumweave SmartQEye Coastal"
                  className="w-full h-full object-contain"
                />
              </div>

              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="font-serif text-base font-bold leading-tight truncate" style={{ color: 'var(--text)' }}>
                    SmartQEye
                  </div>
                  <div className="text-[11px] font-semibold tracking-wide truncate text-[var(--accent)]">
                    Coastal Surveillance · QW
                  </div>
                </div>
              )}

              {/* Collapse toggle */}
              <button
                onClick={() => setCollapsed(c => !c)}
                className="ml-auto p-1.5 rounded-md hover:bg-[var(--surface-hover)] opacity-70 hover:opacity-100 transition-all flex-shrink-0 cursor-pointer"
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <PanelLeft className="w-4 h-4 text-[var(--text)]" /> : <PanelLeftClose className="w-4 h-4 text-[var(--text)]" />}
              </button>
            </div>

            {/* ── Grouped Navigation Sections ── */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-1 divide-y divide-[var(--line)]">
              {visibleSections.map(({ title, titleMl, items }, sIdx) => {
                return (
                  <div key={title} className={cn("py-1.5", sIdx === 0 ? "pt-0" : "")}>
                    {!collapsed && (
                      <div className="px-3 pt-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] opacity-80">
                        {language === 'ml' && titleMl ? titleMl : title}
                      </div>
                    )}

                    {items.map(item => {
                      const itemLabel = item.labelKey ? (t(item.labelKey, language) || item.label) : item.label;
                      const badgeCount = item.badgeKey === 'alerts' ? unreadCount : item.badgeKey === 'contacts' ? 4 : 0;

                      const navElement = (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.to === '/'}
                          className={({ isActive }) => cn(
                            'flex items-center gap-3 mx-1 my-0.5 rounded-lg transition-all duration-150 group relative',
                            collapsed ? 'px-0 justify-center h-10' : 'px-3 py-2',
                            isActive
                              ? 'font-semibold shadow-xs'
                              : 'opacity-75 hover:opacity-100 hover:bg-[var(--surface-hover)]',
                          )}
                          style={({ isActive }) => ({
                            background: isActive ? 'var(--sea-200)' : 'transparent',
                            color: isActive ? 'var(--sea-600)' : 'var(--text)',
                          })}
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && (
                                <span
                                  className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full"
                                  style={{ background: 'var(--sea-600)' }}
                                />
                              )}

                              <item.icon
                                className={cn('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')}
                                strokeWidth={isActive ? 2.5 : 1.9}
                                style={{ color: isActive ? 'var(--sea-600)' : 'inherit' }}
                              />

                              {!collapsed && (
                                <span className="text-[13px] font-medium truncate flex-1">
                                  {itemLabel}
                                </span>
                              )}

                              {badgeCount > 0 && (
                                <span
                                  className={cn(
                                    'rounded-full text-[10px] font-bold font-mono px-1.5 py-0.2',
                                    collapsed ? 'absolute top-1 right-1' : 'ml-auto',
                                    item.badgeKey === 'alerts' ? 'bg-red-500 text-white' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                  )}
                                >
                                  {badgeCount > 99 ? '99+' : badgeCount}
                                </span>
                              )}

                              {!collapsed && isActive && badgeCount === 0 && (
                                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                              )}
                            </>
                          )}
                        </NavLink>
                      );

                      if (collapsed) {
                        return (
                          <Tooltip.Root key={item.to}>
                            <Tooltip.Trigger asChild>
                              {navElement}
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content
                                side="right"
                                sideOffset={8}
                                className="z-50 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--panel)] border shadow-xl text-[var(--text)]"
                                style={{ borderColor: 'var(--line)' }}
                              >
                                {itemLabel}
                                {badgeCount > 0 && ` (${badgeCount})`}
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        );
                      }

                      return navElement;
                    })}
                  </div>
                );
              })}
            </nav>

            {/* ── User Profile at bottom ── */}
            <div className="border-t px-3 py-2.5 flex-shrink-0" style={{ borderColor: 'var(--line)' }}>
              {collapsed ? (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto cursor-pointer"
                  style={{ background: 'var(--sea-600)' }}
                  title={user?.fullName ?? 'Kerala Police Officer'}
                >
                  {user?.fullName?.[0] ?? 'K'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs"
                    style={{ background: 'var(--sea-600)' }}
                  >
                    {user?.fullName?.[0] ?? 'K'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate text-[var(--text)]">
                      {user?.fullName ?? 'Kerala Police Officer'}
                    </div>
                    <div
                      className="text-[10px] font-mono truncate font-semibold"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {activeRole.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ══════════════════════════════════════════
              MAIN AREA (Header + Content + TideBar)
             ══════════════════════════════════════════ */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

            {/* ── Harbour Bar Header ── */}
            <header
              className="flex items-center h-14 px-4 gap-3 flex-shrink-0 border-b z-20"
              style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
            >
              {/* 1. Sidebar Toggle */}
              <button
                onClick={() => setCollapsed(c => !c)}
                className="p-1.5 rounded-lg border hover:bg-[var(--surface-hover)] transition-colors cursor-pointer opacity-80 hover:opacity-100"
                style={{ borderColor: 'var(--line)' }}
                title={collapsed ? 'Expand left rail' : 'Collapse left rail'}
              >
                {collapsed ? <PanelLeft className="w-4 h-4 text-[var(--sea-600)]" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>

              {/* 2. Breadcrumbs */}
              <div className="hidden md:flex items-center gap-1.5 text-xs font-medium">
                {breadcrumbs.map((crumb, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    {idx > 0 && <span className="opacity-40">/</span>}
                    <span className={cn(idx === breadcrumbs.length - 1 ? 'font-bold text-[var(--sea-600)]' : 'opacity-70')}>
                      {crumb.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* 3. Global Search Button (Ctrl+K) */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-[var(--surface-hover)] hover:bg-[var(--panel)] transition-all cursor-pointer text-xs"
                style={{ borderColor: 'var(--line)' }}
                title="Search intelligence records, contacts, sorties, and actions (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-[var(--sea-600)]" />
                <span className="hidden xl:inline opacity-70">Search records...</span>
                <kbd className="px-1.5 py-0.2 rounded border bg-[var(--panel)] text-[10px] font-mono opacity-60" style={{ borderColor: 'var(--line)' }}>
                  Ctrl+K
                </kbd>
              </button>

              <div className="flex-1" />

              {/* 4. Active Mission Selector */}
              {can(activeRole, 'CHANGE_MISSION') ? (
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-90 max-w-[200px]"
                      style={{ background: 'var(--sand-200)', borderColor: 'var(--sand-300)', color: 'var(--ink-900)' }}
                    >
                      <Anchor className="w-3.5 h-3.5 flex-shrink-0 text-[var(--sea-600)]" />
                      <span className="truncate">{activeMission?.title ?? 'All Missions'}</span>
                      <ChevronDown className="w-3 h-3 opacity-60 flex-shrink-0" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="z-50 min-w-[240px] rounded-xl shadow-2xl p-1 bg-[var(--panel)] border text-xs"
                      style={{ borderColor: 'var(--line)' }}
                      sideOffset={6}
                    >
                      {missions.map(m => (
                        <DropdownMenu.Item
                          key={m.id}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors outline-none hover:bg-[var(--surface-hover)]',
                            m.id === activeMissionId && 'font-semibold',
                          )}
                          onSelect={() => setActiveMission(m.id)}
                        >
                          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', m.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400')} />
                          <div className="min-w-0">
                            <div className="truncate font-medium">{m.title}</div>
                            <div className="text-[10px] opacity-60 font-mono">{m.missionCode}</div>
                          </div>
                          {m.id === activeMissionId && <span className="ml-auto text-xs text-[var(--sea-600)]">✓</span>}
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              ) : (
                <div
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border max-w-[200px]"
                  style={{ background: 'var(--sand-200)', borderColor: 'var(--sand-300)', color: 'var(--ink-900)' }}
                >
                  <Anchor className="w-3.5 h-3.5 flex-shrink-0 text-[var(--sea-600)]" />
                  <span className="truncate">{activeMission?.title ?? 'All Missions'}</span>
                </div>
              )}

              {/* 5. Connectivity & Processing Mode Chip */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Central GPU · Synced</span>
              </div>

              {/* 6. Mission Clock (IST) */}
              <ISTClock />

              {/* 7. Active Alert Bell */}
              {['OPERATOR', 'SUPERVISOR', 'AUDITOR'].includes(activeRole) && (
                <button
                  onClick={() => setIsAlertDrawerOpen(true)}
                  className="relative p-2 rounded-lg transition-colors hover:bg-[var(--surface-hover)] cursor-pointer"
                  aria-label={`Open active alert drawer. ${unreadCount} unread alerts`}
                  title="Active Coastal Alerts Drawer"
                >
                  <Bell
                    className="w-5 h-5"
                    style={{ color: unreadCount > 0 ? 'var(--sev-critical)' : 'var(--text-muted)' }}
                  />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                      style={{ background: 'var(--sev-critical)' }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* 8. Training Sandbox Badge */}
              <TrainingModeBadge />

              {/* 9. Language Toggle (EN/ML) */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'ml' : 'en')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:bg-[var(--surface-hover)] cursor-pointer"
                style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                title={language === 'en' ? 'Switch to Malayalam (മലയാളം)' : 'Switch to English'}
                aria-label="Toggle language"
              >
                <span className={cn(language === 'en' ? 'text-[var(--sea-600)] font-bold' : 'opacity-60')}>EN</span>
                <span className="opacity-40">/</span>
                <span className={cn(language === 'ml' ? 'text-[var(--sea-600)] font-bold' : 'opacity-60')}>മലയാളം</span>
              </button>

              {/* 10. Theme Toggle */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    className="p-2 rounded-lg transition-colors hover:bg-[var(--surface-hover)] cursor-pointer"
                    aria-label="Switch nautical theme"
                  >
                    {resolved === 'dark' ? <Moon className="w-4 h-4 opacity-75" /> : <Sun className="w-4 h-4 opacity-75" />}
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 rounded-xl shadow-2xl p-1 min-w-[140px] bg-[var(--panel)] border text-xs"
                    style={{ borderColor: 'var(--line)' }}
                    sideOffset={6}
                  >
                    {(
                      [
                        ['light',  <Sun key="s" className="w-3.5 h-3.5" />, 'Light Sand'],
                        ['dark',   <Moon key="m" className="w-3.5 h-3.5" />, 'Dark Ops'],
                        ['system', <Laptop key="l" className="w-3.5 h-3.5" />, 'System Mode'],
                      ] as const
                    ).map(([m, icon, label]) => (
                      <DropdownMenu.Item
                        key={m}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors outline-none hover:bg-[var(--surface-hover)]',
                          mode === m && 'font-semibold',
                        )}
                        onSelect={() => setMode(m)}
                      >
                        {icon} {label}
                        {mode === m && <span className="ml-auto text-[var(--sea-600)]">✓</span>}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>

              {/* 11. DEMO Chip */}
              {import.meta.env.VITE_DEMO_MODE !== 'false' && (
                <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>DEMO · SIMULATED</span>
                </div>
              )}

              {/* 12. User Profile Menu */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    className="flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition-colors hover:bg-[var(--surface-hover)] cursor-pointer"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs"
                      style={{ background: 'var(--sea-600)' }}
                    >
                      {user?.fullName?.[0] ?? 'K'}
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="text-xs font-semibold leading-tight">{user?.fullName ?? 'Kerala Police'}</div>
                      <div className="text-[10px] font-mono opacity-50">{activeRole.replace(/_/g, ' ')}</div>
                    </div>
                    <ChevronDown className="w-3 h-3 opacity-40 hidden sm:block" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 rounded-xl shadow-2xl p-1 min-w-[220px] bg-[var(--panel)] border text-xs"
                    style={{ borderColor: 'var(--line)' }}
                    sideOffset={6}
                  >
                    <div className="px-3 py-2 border-b mb-1" style={{ borderColor: 'var(--line)' }}>
                      <div className="font-bold">{user?.fullName ?? 'User'}</div>
                      <div className="text-[10px] font-mono opacity-60">Role: {activeRole.replace(/_/g, ' ')}</div>
                    </div>

                    <DropdownMenu.Item
                      onSelect={() => navigate('/help')}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[var(--surface-hover)] transition-colors outline-none"
                    >
                      <HelpCircle className="w-3.5 h-3.5 opacity-60" />
                      <span>Help Centre & Shortcuts (?)</span>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                      onSelect={() => setAboutOpen(true)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[var(--surface-hover)] transition-colors outline-none"
                    >
                      <Info className="w-3.5 h-3.5 opacity-60" />
                      <span>About Platform & Build</span>
                    </DropdownMenu.Item>

                    {SHOW_DEV_ROLE_SWITCHER && (
                      <>
                        <div className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase font-bold opacity-40">
                          Dev · Switch Role
                        </div>
                        {ROLES.map(role => (
                          <DropdownMenu.Item
                            key={role}
                            className={cn(
                              'flex items-center gap-2 px-3 py-1 rounded-lg cursor-pointer text-xs transition-colors outline-none hover:bg-[var(--surface-hover)]',
                              activeRole === role && 'font-semibold',
                            )}
                            onSelect={() => setDevRole(role)}
                          >
                            <Shield className="w-3 h-3 opacity-40 flex-shrink-0" />
                            <span>{role.replace(/_/g, ' ')}</span>
                            {activeRole === role && <span className="ml-auto text-[var(--sea-600)]">✓</span>}
                          </DropdownMenu.Item>
                        ))}
                        <DropdownMenu.Separator className="my-1 h-px bg-[var(--line)]" />
                      </>
                    )}

                    <DropdownMenu.Separator className="my-1 h-px bg-[var(--line)]" />

                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors outline-none"
                      onSelect={logout}
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </header>

            {/* ── Critical Alert Banner ── */}
            {criticalBanner && ['OPERATOR', 'SUPERVISOR', 'AUDITOR'].includes(activeRole) && (
              <div
                className="flex items-center gap-3 px-4 py-2 text-xs border-b flex-shrink-0 animate-pulse"
                style={{ background: 'var(--sev-critical)', color: 'white', borderColor: 'rgba(0,0,0,0.25)' }}
                role="alert"
                aria-live="assertive"
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="font-bold">CRITICAL</span>
                <span className="flex-1 truncate">
                  {criticalBanner.alertCode}: {criticalBanner.event.type.replace(/_/g, ' ')}
                </span>
                <button
                  className="px-2.5 py-0.5 rounded border border-white/40 text-xs font-medium hover:bg-white/20 transition-colors flex-shrink-0 cursor-pointer"
                  onClick={() => navigate(`/alerts/${criticalBanner.id}`)}
                >
                  Open
                </button>
                {can(activeRole, 'ACK_ALERT') && (
                  <button
                    className="px-2.5 py-0.5 rounded border border-white/40 text-xs font-medium hover:bg-white/20 transition-colors flex-shrink-0 cursor-pointer"
                    onClick={dismissBanner}
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            )}

            {/* ── Page Content ── */}
            <main
              id="main-content"
              tabIndex={-1}
              className="flex-1 overflow-hidden min-h-0 outline-none"
            >
              <RouteErrorBoundary>
                <Outlet />
              </RouteErrorBoundary>
            </main>

            {/* ── Status Tide Bar ── */}
            <footer
              className="flex items-center h-9 px-4 gap-6 text-xs border-t flex-shrink-0 overflow-x-auto"
              style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text-muted)' }}
            >
              <TideBarItem icon={<Monitor className="w-3.5 h-3.5" />}  label="Feeds"   value={`${liveFeeds}/${totalFeeds} live`} ok={liveFeeds >= totalFeeds * 0.8} />
              <TideBarItem icon={<Cpu      className="w-3.5 h-3.5" />}  label="GPU"     value={formatPct(health.gpuUsagePct)} ok={health.gpuUsagePct < 85} />
              <TideBarItem icon={<Database className="w-3.5 h-3.5" />}  label="Storage" value={formatPct(health.storageUsagePct)} ok={health.storageUsagePct < 85} />
              <TideBarItem icon={<Terminal className="w-3.5 h-3.5" />}  label="Edge"    value={`${health.edgeNodes.filter(n => n.isOnline).length}/${health.edgeNodes.length} nodes`} ok={health.edgeNodes.every(n => n.isOnline)} />
              <TideBarItem icon={<Activity className="w-3.5 h-3.5" />}  label="Model Bundle" value="RTMDet-L v2.4.1" ok={true} />
              <TideBarItem icon={<Activity className="w-3.5 h-3.5" />}  label="Last Sync" value="0s ago" ok={true} />
              <button
                onClick={() => setAboutOpen(true)}
                className="ml-auto flex-shrink-0 opacity-70 hover:opacity-100 hover:underline font-mono text-[11px] flex items-center gap-1.5 transition-opacity cursor-pointer"
                title="Click to view Platform & Build specifications"
              >
                <span>SmartQEye v1.2.0-coastal · Kerala Coastal Police</span>
                <Info className="w-3.5 h-3.5 text-[var(--sea-600)]" />
              </button>
            </footer>
          </div>
        </div>

        {/* Global Search Command Palette (Ctrl+K) */}
        <GlobalSearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />

        {/* Slide-over Active Alert Drawer */}
        <AlertDrawer open={isAlertDrawerOpen} onOpenChange={setIsAlertDrawerOpen} />

        {/* Global Toast Notification System */}
        <ToastContainer />

        {/* About Platform Modal */}
        <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />

        {/* 15-Minute Inactivity Idle Timeout Modal */}
        <IdleTimeoutModal />

        {/* Guided Tour Floating Walkthrough */}
        <GuidedTour />
      </div>
    </Tooltip.Provider>
  );
}

// ─── Tide bar status item ─────────────────────────────────────

function TideBarItem({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
      <span className={ok ? 'text-emerald-500' : 'text-amber-500'}>{icon}</span>
      <span className="opacity-70 text-xs">{label}</span>
      <span className={cn('font-mono font-medium text-xs', ok ? '' : 'text-amber-500')}>{value}</span>
    </div>
  );
}

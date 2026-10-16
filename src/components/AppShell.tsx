// ============================================================
// SmartQEye Coastal — App Shell
// Phase 7A & 7F: App Shell, Header, Accessibility, Responsive Navigation
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
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
import {
  useAlertStore, useAuthStore, useThemeStore,
  useHealthStore, useMissionStore, useLanguageStore
} from '@/lib/store';
import { t, type TranslationKey } from '@/lib/i18n';
import { simulator } from '@/lib/simulator';
import type { UserRole } from '@/types';

// ─── Nav Structure with Thematic Sections ────────────────────

interface NavEntry {
  to: string;
  labelKey: TranslationKey;
  defaultLabel: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
  roles: UserRole[];
  badgeKey?: 'alerts' | 'contacts';
}

interface NavSection {
  title: string;
  titleMl: string;
  items: NavEntry[];
}

const ALL_ROLES: UserRole[] = ['OPERATOR', 'ANALYST', 'SUPERVISOR', 'ZONE_ADMIN', 'SYS_ADMIN', 'MODEL_CUSTODIAN', 'AUDITOR'];

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operations',
    titleMl: 'ഓപ്പറേഷൻസ്',
    items: [
      { to: '/',                 labelKey: 'nav_command_center', defaultLabel: 'Command Center',     icon: LayoutDashboard, roles: ALL_ROLES },
      { to: '/live',             labelKey: 'nav_live',           defaultLabel: 'Live Monitor',       icon: Monitor,         roles: ALL_ROLES },
      { to: '/fleet-wall',       labelKey: 'nav_fleet_wall',     defaultLabel: 'Fleet Wall (20 Feeds)', icon: Grid,         roles: ALL_ROLES },
      { to: '/map',              labelKey: 'nav_map',            defaultLabel: 'Map / GIS',          icon: Map,             roles: ALL_ROLES },
      { to: '/missions',         labelKey: 'nav_missions',       defaultLabel: 'Missions & Sorties', icon: Anchor,          roles: ALL_ROLES },
      { to: '/alerts',           labelKey: 'nav_alerts',         defaultLabel: 'Alerts',             icon: Bell,            roles: ALL_ROLES, badgeKey: 'alerts' },
    ]
  },
  {
    title: 'Intelligence',
    titleMl: 'ഇന്റലിജൻസ്',
    items: [
      { to: '/contacts',         labelKey: 'nav_contacts',       defaultLabel: 'Contacts',           icon: Radio,           roles: ALL_ROLES, badgeKey: 'contacts' },
      { to: '/vehicle-maritime', labelKey: 'nav_vehicle',        defaultLabel: 'Vehicle & Maritime',  icon: Car,             roles: ALL_ROLES },
      { to: '/crowd-analytics',  labelKey: 'nav_crowd',          defaultLabel: 'Crowd & Persons',    icon: Users,           roles: ALL_ROLES },
      { to: '/intrusion-detection', labelKey: 'nav_intrusion',   defaultLabel: 'Intrusion & Geofence', icon: ShieldAlert,   roles: ALL_ROLES },
      { to: '/anomaly-monitor',  labelKey: 'nav_anomaly',        defaultLabel: 'Anomaly & Behaviour', icon: AlertOctagon,   roles: ALL_ROLES },
      { to: '/abandoned-objects',labelKey: 'nav_abandoned',      defaultLabel: 'Abandoned Objects',  icon: PackageSearch,   roles: ALL_ROLES },
      { to: '/person-reid',      labelKey: 'nav_reid',           defaultLabel: 'Person Re-ID (Optional)', icon: ScanFace,    roles: ALL_ROLES },
    ]
  },
  {
    title: 'Evidence & Review',
    titleMl: 'തെളിവുകൾ & അവലോകനം',
    items: [
      { to: '/history',          labelKey: 'nav_history',        defaultLabel: 'History & Playback', icon: History,         roles: ALL_ROLES },
      { to: '/incidents',        labelKey: 'nav_incidents',      defaultLabel: 'Incident Records',   icon: FolderArchive,   roles: ALL_ROLES },
      { to: '/reports',          labelKey: 'nav_reports',        defaultLabel: 'Reports',            icon: FileText,        roles: ALL_ROLES },
    ]
  },
  {
    title: 'Configuration',
    titleMl: 'കോൺഫിഗറേഷൻ',
    items: [
      { to: '/config/zones',     labelKey: 'nav_config_zones',   defaultLabel: 'Zones & Context',    icon: Sliders,         roles: ALL_ROLES },
      { to: '/config/alerts',    labelKey: 'nav_config_alerts',  defaultLabel: 'Alert Configuration',icon: Settings2,       roles: ALL_ROLES },
      { to: '/models',           labelKey: 'nav_models',         defaultLabel: 'AI Models & Datasets', icon: Cpu,           roles: ALL_ROLES },
    ]
  },
  {
    title: 'Platform',
    titleMl: 'പ്ലാറ്റ്ഫോം',
    items: [
      { to: '/deployment',       labelKey: 'nav_deployment',     defaultLabel: 'Deployment & Compute', icon: Server,        roles: ALL_ROLES },
      { to: '/integrations',     labelKey: 'nav_integrations',   defaultLabel: 'API & Integrations', icon: Network,         roles: ALL_ROLES },
      { to: '/health',           labelKey: 'nav_health',         defaultLabel: 'System Health',      icon: Activity,        roles: ALL_ROLES },
      { to: '/admin',            labelKey: 'nav_admin',          defaultLabel: 'Administration',     icon: Shield,          roles: ALL_ROLES },
      { to: '/audit',            labelKey: 'nav_audit',          defaultLabel: 'Audit Log',          icon: ScrollText,      roles: ALL_ROLES },
      { to: '/acceptance',       labelKey: 'nav_acceptance',     defaultLabel: 'Acceptance Console', icon: CheckSquare,     roles: ALL_ROLES },
      { to: '/help',             labelKey: 'nav_help',           defaultLabel: 'Help & Training',    icon: GraduationCap,   roles: ALL_ROLES },
    ]
  }
];

const ROLES: UserRole[] = ['OPERATOR', 'ANALYST', 'SUPERVISOR', 'ZONE_ADMIN', 'SYS_ADMIN', 'MODEL_CUSTODIAN', 'AUDITOR'];

export function AppShell() {
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1366 : false
  );
  const [aboutOpen, setAboutOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);

  const { user, devRole, logout, setDevRole, viewAsRole, setViewAsRole } = useAuthStore();
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
    const unsub = simulator.subscribe(event => {
      if (event.type === 'ALERT_NEW') addAlert(event.payload);
      if (event.type === 'HEALTH_UPDATE') updateHealth(event.payload);
    });
    return () => { simulator.stop(); unsub(); };
  }, []);

  // Compute Breadcrumb from current path
  const breadcrumbs = useMemo(() => {
    const path = location.pathname;
    if (path === '/') return [{ label: 'Operations', path: '/' }, { label: 'Command Center', path: '/' }];

    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (item.to !== '/' && path.startsWith(item.to)) {
          const crumbs = [
            { label: section.title, path: item.to },
            { label: item.defaultLabel, path: item.to },
          ];

          // Sub-item detail check (e.g. /contacts/:id or /alerts/:id)
          const subId = path.replace(item.to, '').replace(/^\//, '');
          if (subId) {
            crumbs.push({ label: subId, path });
          }
          return crumbs;
        }
      }
    }
    return [{ label: 'Platform', path }, { label: path.replace(/^\//, ''), path }];
  }, [location.pathname]);

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        {/* ── Skip Link for Keyboard / Accessibility (7F) ── */}
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
                  <div className="text-[11px] font-semibold tracking-wide truncate text-[var(--sea-600)]">
                    Coastal Police · QW
                  </div>
                </div>
              )}

              {/* Collapse toggle */}
              <button
                onClick={() => setCollapsed(c => !c)}
                className="ml-auto p-1.5 rounded-md hover:bg-[var(--surface)] opacity-70 hover:opacity-100 transition-all flex-shrink-0 cursor-pointer"
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            </div>

            {/* ── Grouped Navigation Sections ── */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-1 divide-y divide-[var(--line)]">
              {NAV_SECTIONS.map((section, sIdx) => {
                const visibleItems = section.items.filter(item => item.roles.includes(devRole));
                if (visibleItems.length === 0) return null;

                return (
                  <div key={section.title} className={cn("py-1.5", sIdx === 0 ? "pt-0" : "")}>
                    {!collapsed && (
                      <div className="px-3 pt-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] opacity-80">
                        {language === 'ml' ? section.titleMl : section.title}
                      </div>
                    )}

                    {visibleItems.map(item => {
                      const itemLabel = t(item.labelKey, language) || item.defaultLabel;
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
                              : 'opacity-75 hover:opacity-100 hover:bg-[var(--surface)]',
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
                    <div className="text-[10px] font-mono truncate font-semibold opacity-60">
                      {devRole.replace(/_/g, ' ')}
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

            {/* ── Harbour Bar Header (7A) ── */}
            <header
              className="flex items-center h-14 px-4 gap-3 flex-shrink-0 border-b z-20"
              style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
            >
              {/* 1. Sidebar Toggle */}
              <button
                onClick={() => setCollapsed(c => !c)}
                className="p-1.5 rounded-lg border hover:bg-[var(--surface)] transition-colors cursor-pointer opacity-80 hover:opacity-100"
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-[var(--surface)] hover:bg-[var(--panel)] transition-all cursor-pointer text-xs"
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
                          'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors outline-none hover:bg-[var(--surface)]',
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

              {/* 5. Connectivity & Processing Mode Chip */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Central GPU · Synced</span>
              </div>

              {/* 6. Mission Clock (IST) */}
              <ISTClock />

              {/* 7. Active Alert Bell + Drawer Trigger */}
              <button
                onClick={() => setIsAlertDrawerOpen(true)}
                className="relative p-2 rounded-lg transition-colors hover:bg-[var(--surface)] cursor-pointer"
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

              {/* 8. Training Sandbox Badge */}
              <TrainingModeBadge />

              {/* 9. Language Toggle (EN/ML) */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'ml' : 'en')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:bg-[var(--surface)] cursor-pointer"
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
                    className="p-2 rounded-lg transition-colors hover:bg-[var(--surface)] cursor-pointer"
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
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors outline-none hover:bg-[var(--surface)]',
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
                    className="flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition-colors hover:bg-[var(--surface)] cursor-pointer"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs"
                      style={{ background: 'var(--sea-600)' }}
                    >
                      {user?.fullName?.[0] ?? 'K'}
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="text-xs font-semibold leading-tight">{user?.fullName ?? 'Kerala Police'}</div>
                      <div className="text-[10px] font-mono opacity-50">{devRole.replace(/_/g, ' ')}</div>
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
                      <div className="font-bold">{user?.fullName}</div>
                      <div className="text-[10px] font-mono opacity-60">Role: {devRole.replace(/_/g, ' ')}</div>
                    </div>

                    <DropdownMenu.Item
                      onSelect={() => navigate('/help')}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[var(--surface)] transition-colors outline-none"
                    >
                      <HelpCircle className="w-3.5 h-3.5 opacity-60" />
                      <span>Help Centre & Shortcuts (?)</span>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                      onSelect={() => setAboutOpen(true)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[var(--surface)] transition-colors outline-none"
                    >
                      <Info className="w-3.5 h-3.5 opacity-60" />
                      <span>About Platform & Build</span>
                    </DropdownMenu.Item>

                    {/* Dev role switcher */}
                    {import.meta.env.DEV && (
                      <>
                        <div className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase font-bold opacity-40">
                          Dev · Switch Role
                        </div>
                        {ROLES.map(role => (
                          <DropdownMenu.Item
                            key={role}
                            className={cn(
                              'flex items-center gap-2 px-3 py-1 rounded-lg cursor-pointer text-xs transition-colors outline-none hover:bg-[var(--surface)]',
                              devRole === role && 'font-semibold',
                            )}
                            onSelect={() => setDevRole(role)}
                          >
                            <Shield className="w-3 h-3 opacity-40 flex-shrink-0" />
                            <span>{role.replace(/_/g, ' ')}</span>
                            {devRole === role && <span className="ml-auto text-[var(--sea-600)]">✓</span>}
                          </DropdownMenu.Item>
                        ))}
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
            {criticalBanner && (
              <div
                className="flex items-center gap-3 px-4 py-2 text-xs border-b flex-shrink-0 animate-pulse"
                style={{ background: 'var(--sev-critical)', color: 'white', borderColor: 'rgba(0,0,0,0.25)' }}
                role="alert"
                aria-live="assertive"
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="font-bold">CRITICAL BREACH</span>
                <span className="flex-1 truncate">
                  {criticalBanner.alertCode}: {criticalBanner.event.type.replace(/_/g, ' ')}
                </span>
                <button
                  className="px-2.5 py-0.5 rounded border border-white/40 text-xs font-medium hover:bg-white/20 transition-colors flex-shrink-0 cursor-pointer"
                  onClick={() => navigate(`/alerts/${criticalBanner.id}`)}
                >
                  Open Dossier
                </button>
                <button
                  className="px-2.5 py-0.5 rounded border border-white/40 text-xs font-medium hover:bg-white/20 transition-colors flex-shrink-0 cursor-pointer"
                  onClick={dismissBanner}
                >
                  Acknowledge
                </button>
              </div>
            )}

            {/* ── Role Preview Active Banner ── */}
            {viewAsRole && (
              <div
                className="flex items-center justify-between px-4 py-1.5 text-xs font-mono font-bold border-b flex-shrink-0"
                style={{
                  background: '#042F2E',
                  color: '#5EEAD4',
                  borderColor: 'rgba(94, 234, 212, 0.3)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#5EEAD4] animate-pulse" />
                  <span>ROLE PREVIEW ACTIVE: Viewing platform as &ldquo;{viewAsRole}&rdquo; (Base login: {user?.role || devRole})</span>
                </div>
                <button
                  onClick={() => setViewAsRole(null)}
                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#134E4A] hover:bg-[#115E59] text-white border border-[#2DD4BF]/40 transition-colors cursor-pointer"
                >
                  Exit Role Preview
                </button>
              </div>
            )}

            {/* ── Page Content (Target of Skip Link) ── */}
            <main
              id="main-content"
              tabIndex={-1}
              className="flex-1 overflow-hidden min-h-0 outline-none"
            >
              <Outlet />
            </main>

            {/* ── Status Tide Bar (7A) ── */}
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

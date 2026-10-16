// ============================================================
// SmartQEye Coastal — App Shell
// HarbourBar + Always-visible LeftRail + StatusTidebar
// As specified in Costal Police .docx
// ============================================================

import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Anchor, LayoutDashboard, Monitor, Bell, Map, History,
  FileText, Shield, Cpu, Users, Radio,
  ChevronRight, LogOut, Sun, Moon, Laptop,
  AlertTriangle, Activity, Database, Terminal, PanelLeftClose, PanelLeft,
  Car, ScanFace, ShieldAlert, AlertOctagon
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn, formatPct } from '@/lib/utils';
import { ISTClock } from '@/components/ISTClock';
import { useAlertStore, useAuthStore, useThemeStore, useHealthStore, useMissionStore } from '@/lib/store';
import { simulator } from '@/lib/simulator';
import { ROLE_CONFIG, canAccess, can } from '@/lib/roleConfig';
import type { UserRole } from '@/types';

// Toggle to display developer role switcher in HarbourBar (hidden for customer demo)
const SHOW_DEV_ROLE_SWITCHER = false;

// ─── Nav Structure with Thematic Sections ────────────────────

interface NavEntry {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
  roles: UserRole[];
}

interface NavSection {
  title: string;
  items: NavEntry[];
}

const ALL_ROLES: UserRole[] = ['OPERATOR', 'ANALYST', 'SUPERVISOR', 'ZONE_ADMIN', 'SYS_ADMIN', 'MODEL_CUSTODIAN', 'AUDITOR'];

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Tactical Ops',
    items: [
      { to: '/overview',           label: 'Overview Dashboard',  icon: Activity,        roles: ['OPERATOR'] },
      { to: '/',                   label: 'Command Center',      icon: LayoutDashboard, roles: ALL_ROLES },
      { to: '/live',               label: 'Live Monitor',        icon: Monitor,         roles: ALL_ROLES },
      { to: '/alerts',             label: 'Alerts',              icon: Bell,            roles: ALL_ROLES },
      { to: '/missions',           label: 'Mission Control',     icon: Anchor,          roles: ALL_ROLES },
      { to: '/map',                label: 'Map / GIS',           icon: Map,             roles: ALL_ROLES },
      { to: '/history',            label: 'History Playback',    icon: History,         roles: ALL_ROLES },
    ]
  },
  {
    title: 'AI Analytics',
    items: [
      { to: '/crowd-analytics',    label: 'Crowd Analytics',     icon: Users,           roles: ALL_ROLES },
      { to: '/vehicle-maritime',   label: 'Vehicle & Maritime',  icon: Car,             roles: ALL_ROLES },
      { to: '/person-reid',        label: 'Person Re-ID',        icon: ScanFace,        roles: ALL_ROLES },
      { to: '/intrusion-detection',label: 'Intrusion Geofence',  icon: ShieldAlert,     roles: ALL_ROLES },
      { to: '/anomaly-monitor',    label: 'Anomaly Monitor',     icon: AlertOctagon,    roles: ALL_ROLES },
    ]
  },
  {
    title: 'System & Reports',
    items: [
      { to: '/reports',          label: 'Police Reports',      icon: FileText,        roles: ALL_ROLES },
      { to: '/models',           label: 'AI Models Cluster',   icon: Cpu,             roles: ALL_ROLES },
      { to: '/health',           label: 'System Health',       icon: Activity,        roles: ALL_ROLES },
      { to: '/admin',            label: 'Administration',      icon: Shield,          roles: ['SYS_ADMIN', 'SUPERVISOR', 'AUDITOR'] },
    ]
  }
];

const ROLES: UserRole[] = ['OPERATOR', 'SUPERVISOR', 'SYS_ADMIN', 'AUDITOR'];

// ─── AppShell ─────────────────────────────────────────────────

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);

  const { user, devRole, logout, setDevRole } = useAuthStore();
  const activeRole: UserRole = user?.role ?? devRole ?? 'OPERATOR';
  const primaryList = ROLE_CONFIG[activeRole]?.primary ?? [];

  const { mode, setMode, resolveTheme, resolved } = useThemeStore();
  const { criticalBanner, unreadCount, addAlert, dismissBanner } = useAlertStore();
  const { updateHealth } = useHealthStore();
  const { missions, activeMissionId, setActiveMission } = useMissionStore();
  const navigate = useNavigate();

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

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

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
          {/* Quantumweave logo mark */}
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
              <div
                className="font-serif text-base font-bold leading-tight truncate"
                style={{ color: 'var(--text)' }}
              >
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
            className="ml-auto p-1.5 rounded-md hover:bg-[var(--surface-hover)] opacity-70 hover:opacity-100 transition-all flex-shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <PanelLeft className="w-4 h-4 text-[var(--text)]" />
              : <PanelLeftClose className="w-4 h-4 text-[var(--text)]" />
            }
          </button>
        </div>

        {/* ── Grouped Navigation Sections ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-1 divide-y divide-[var(--line)]">
          {NAV_SECTIONS.map((section, originalSectionIndex) => {
            const visibleItems = section.items.filter(item => canAccess(activeRole, item.to));
            if (visibleItems.length === 0) return null;

            // Earliest primary index in this section
            let earliestPrimaryIndex = Infinity;
            visibleItems.forEach(item => {
              const idx = primaryList.indexOf(item.to);
              if (idx !== -1 && idx < earliestPrimaryIndex) {
                earliestPrimaryIndex = idx;
              }
            });

            // Reorder items within section
            const primaryItems: NavEntry[] = [];
            const secondaryItems: NavEntry[] = [];
            visibleItems.forEach(item => {
              if (primaryList.includes(item.to)) {
                primaryItems.push(item);
              } else {
                secondaryItems.push(item);
              }
            });
            primaryItems.sort((a, b) => primaryList.indexOf(a.to) - primaryList.indexOf(b.to));

            return {
              section,
              visibleItems: [...primaryItems, ...secondaryItems],
              earliestPrimaryIndex,
              originalSectionIndex,
            };
          })
            .filter((s): s is NonNullable<typeof s> => s !== null)
            .sort((a, b) => {
              if (a.earliestPrimaryIndex !== b.earliestPrimaryIndex) {
                return a.earliestPrimaryIndex - b.earliestPrimaryIndex;
              }
              return a.originalSectionIndex - b.originalSectionIndex;
            })
            .map(({ section, visibleItems }, sIdx) => {
              return (
                <div key={section.title} className={cn("py-1.5", sIdx === 0 ? "pt-0" : "")}>
                  {/* Section title (visible when expanded) */}
                  {!collapsed && (
                    <div className="px-3 pt-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] opacity-80">
                      {section.title}
                    </div>
                  )}

                  {visibleItems.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      title={collapsed ? item.label : undefined}
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
                          {/* Active bar */}
                          {isActive && (
                            <span
                              className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full"
                              style={{ background: 'var(--sea-600)' }}
                            />
                          )}

                          {/* Icon */}
                          <item.icon
                            className={cn('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')}
                            strokeWidth={isActive ? 2.5 : 1.9}
                            style={{ color: isActive ? 'var(--sea-600)' : 'inherit' }}
                          />

                          {/* Label — clearly visible */}
                          {!collapsed && (
                            <span className="text-[13px] font-medium truncate flex-1">
                              {item.label}
                            </span>
                          )}

                          {/* Chevron indicator for active item */}
                          {!collapsed && isActive && (
                            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              );
            })}
        </nav>

        {/* ── User Profile at bottom ── */}
        <div
          className="border-t px-3 py-2.5 flex-shrink-0"
          style={{ borderColor: 'var(--line)' }}
        >
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
          MAIN AREA (top bar + content + tide bar)
         ══════════════════════════════════════════ */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── Harbour Bar ── */}
        <header
          className="flex items-center h-14 px-4 gap-3 flex-shrink-0 border-b z-20"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
        >
          {/* Mission selector */}
          {can(activeRole, 'CHANGE_MISSION') ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-opacity hover:opacity-80 max-w-[240px]"
                  style={{ background: 'var(--sand-200)', borderColor: 'var(--sand-300)', color: 'var(--ink-900)' }}
                >
                  <Anchor className="w-3.5 h-3.5 flex-shrink-0 text-[var(--accent)]" />
                  <span className="truncate">{activeMission?.title ?? 'All Missions'}</span>
                  <ChevronRight className="w-3 h-3 rotate-90 opacity-50 flex-shrink-0" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-[240px] rounded-xl shadow-2xl p-1"
                  style={{ background: 'var(--raised)', border: '1px solid var(--line)' }}
                  sideOffset={6}
                >
                  {missions.map(m => (
                    <DropdownMenu.Item
                      key={m.id}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors outline-none',
                        'hover:bg-[var(--sand-100)] dark:hover:bg-[var(--raised)]',
                        m.id === activeMissionId && 'font-semibold',
                      )}
                      onSelect={() => setActiveMission(m.id)}
                    >
                      <span
                        className={cn('w-2 h-2 rounded-full flex-shrink-0', m.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400')}
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{m.title}</div>
                        <div className="text-[10px] opacity-60 font-mono">{m.missionCode}</div>
                      </div>
                      {m.id === activeMissionId && <span className="ml-auto text-xs" style={{ color: 'var(--sea-600)' }}>✓</span>}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border max-w-[240px]"
              style={{ background: 'var(--sand-200)', borderColor: 'var(--sand-300)', color: 'var(--ink-900)' }}
            >
              <Anchor className="w-3.5 h-3.5 flex-shrink-0 text-[var(--accent)]" />
              <span className="truncate">{activeMission?.title ?? 'All Missions'}</span>
            </div>
          )}

          <div className="flex-1" />

          {/* IST Clock */}
          <ISTClock />

          {/* Alert Bell */}
          {['OPERATOR', 'SUPERVISOR', 'AUDITOR'].includes(activeRole) && (
            <button
              className="relative p-2 rounded-lg transition-colors hover:bg-[var(--sand-100)] dark:hover:bg-[var(--raised)]"
              onClick={() => navigate('/alerts')}
              aria-label={`${unreadCount} unread alerts`}
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

          {/* Theme toggle */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="p-2 rounded-lg transition-colors hover:bg-[var(--sand-100)] dark:hover:bg-[var(--raised)]"
                aria-label="Switch theme"
              >
                {resolved === 'dark'
                  ? <Moon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  : <Sun className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                }
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 rounded-xl shadow-2xl p-1 min-w-[150px]"
                style={{ background: 'var(--raised)', border: '1px solid var(--line)' }}
                sideOffset={6}
              >
                {(
                  [
                    ['light',  <Sun    key="sun"    className="w-3.5 h-3.5" />, 'Light'],
                    ['dark',   <Moon   key="moon"   className="w-3.5 h-3.5" />, 'Dark'],
                    ['system', <Laptop key="laptop" className="w-3.5 h-3.5" />, 'System'],
                  ] as const
                ).map(([m, icon, label]) => (
                  <DropdownMenu.Item
                    key={m}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors outline-none',
                      'hover:bg-[var(--sand-100)] dark:hover:bg-[var(--raised)]',
                      mode === m && 'font-semibold',
                    )}
                    onSelect={() => setMode(m)}
                  >
                    {icon} {label}
                    {mode === m && <span className="ml-auto" style={{ color: 'var(--sea-600)' }}>✓</span>}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* User menu + dev role switcher */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-[var(--sand-100)] dark:hover:bg-[var(--raised)]"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--sea-600)' }}
                >
                  {user?.fullName?.[0] ?? 'K'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold leading-tight">{user?.fullName ?? 'Kerala Police'}</div>
                  <div className="text-[10px] font-mono opacity-50">{activeRole.replace(/_/g, ' ')}</div>
                </div>
                <ChevronRight className="w-3 h-3 rotate-90 opacity-30 hidden sm:block" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 rounded-xl shadow-2xl p-1 min-w-[230px]"
                style={{ background: 'var(--raised)', border: '1px solid var(--line)' }}
                sideOffset={6}
              >
                {/* User info header */}
                <div className="px-3 py-2.5 border-b mb-1" style={{ borderColor: 'var(--line)' }}>
                  <div className="text-sm font-semibold">{user?.fullName ?? 'User'}</div>
                  <div className="text-xs opacity-50 font-mono">{user?.username}</div>
                </div>

                {SHOW_DEV_ROLE_SWITCHER && (
                  <>
                    <div className="px-3 py-1 text-[10px] uppercase tracking-widest font-semibold opacity-40">
                      Dev · Switch Role
                    </div>
                    {ROLES.map(role => (
                      <DropdownMenu.Item
                        key={role}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-xs transition-colors outline-none',
                          'hover:bg-[var(--sand-100)] dark:hover:bg-[var(--raised)]',
                          activeRole === role && 'font-semibold',
                        )}
                        onSelect={() => setDevRole(role)}
                      >
                        <Shield className="w-3 h-3 opacity-40 flex-shrink-0" />
                        <span>{role.replace(/_/g, ' ')}</span>
                        {activeRole === role && (
                          <span className="ml-auto text-xs" style={{ color: 'var(--sea-600)' }}>✓</span>
                        )}
                      </DropdownMenu.Item>
                    ))}
                    <DropdownMenu.Separator className="my-1 h-px" style={{ background: 'var(--line)' }} />
                  </>
                )}

                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors outline-none"
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
              className="px-2.5 py-0.5 rounded border border-white/40 text-xs font-medium hover:bg-white/20 transition-colors flex-shrink-0"
              onClick={() => navigate(`/alerts/${criticalBanner.id}`)}
            >Open</button>
            {can(activeRole, 'ACK_ALERT') && (
              <button
                className="px-2.5 py-0.5 rounded border border-white/40 text-xs font-medium hover:bg-white/20 transition-colors flex-shrink-0"
                onClick={dismissBanner}
              >Acknowledge</button>
            )}
          </div>
        )}

        {/* ── Page content ── */}
        <main className="flex-1 overflow-hidden min-h-0">
          <Outlet />
        </main>

        {/* ── Status Tide Bar (bottom) ── */}
        <footer
          className="flex items-center h-9 px-4 gap-6 text-xs border-t flex-shrink-0 overflow-x-auto"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text-muted)' }}
        >
          <TideBarItem icon={<Monitor className="w-3.5 h-3.5" />}  label="Feeds"   value={`${liveFeeds}/${totalFeeds} live`}                               ok={liveFeeds >= totalFeeds * 0.8} />
          <TideBarItem icon={<Cpu      className="w-3.5 h-3.5" />}  label="GPU"     value={formatPct(health.gpuUsagePct)}                                    ok={health.gpuUsagePct < 85} />
          <TideBarItem icon={<Database className="w-3.5 h-3.5" />}  label="Storage" value={formatPct(health.storageUsagePct)}                                ok={health.storageUsagePct < 85} />
          <TideBarItem icon={<Terminal className="w-3.5 h-3.5" />}  label="Edge"    value={`${health.edgeNodes.filter(n => n.isOnline).length}/${health.edgeNodes.length}`}  ok={health.edgeNodes.every(n => n.isOnline)} />
          <TideBarItem icon={<Database className="w-3.5 h-3.5" />}  label="DB"      value={health.dbStatus}                                                  ok={health.dbStatus === 'OK'} />
          <div className="ml-auto flex-shrink-0 opacity-50 font-mono text-[11px]">SmartQEye v1.2.0 · Kerala Coastal Police</div>
        </footer>
      </div>
    </div>
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

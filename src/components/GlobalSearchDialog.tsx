// ============================================================
// SmartQEye Coastal — GlobalSearchDialog Component (Ctrl+K)
// Phase 7A: Global Command Palette via `cmdk`
// Searches Contacts, Incidents, Sorties, Zones, Drones, Pages & Actions
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  Search, Radio, Bell, Map, Anchor, Shield, Cpu,
  Monitor, Car, Users, FileText, CheckSquare, Sparkles,
  Flame, Moon, Sun, ArrowRight, CornerDownLeft
} from 'lucide-react';
import { useAuthStore, useThemeStore, useTrainingStore } from '@/lib/store';
import { UAVS } from '@/lib/mockData';

export interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const navigate = useNavigate();
  const { toggleTheme, setMode } = useThemeStore();
  const { toggleTrainingMode } = useTrainingStore();
  const [search, setSearch] = useState('');

  // Keyboard shortcut listener (Ctrl+K / Cmd+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const runCommand = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-[15vh] p-4 animate-in fade-in">
      <div
        className="w-full max-w-xl rounded-2xl border bg-[var(--panel)] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95"
        style={{ borderColor: 'var(--line)' }}
      >
        <Command
          value={search}
          onValueChange={setSearch}
          className="flex flex-col h-full text-xs"
        >
          {/* Search Input Bar */}
          <div className="flex items-center px-4 py-3 border-b gap-3" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
            <Search className="w-4 h-4 text-[var(--sea-600)] flex-shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Search contacts, alerts, sorties, zones, drones, routes... (ESC to close)"
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 font-sans"
            />
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--panel)] border text-[10px] font-mono opacity-50" style={{ borderColor: 'var(--line)' }}>
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <Command.List className="max-h-80 overflow-y-auto p-2 divide-y space-y-1" style={{ borderColor: 'var(--line)' }}>
            <Command.Empty className="py-8 text-center opacity-60 font-mono text-xs">
              No matching coastal intelligence records found.
            </Command.Empty>

            {/* Quick Pages */}
            <Command.Group heading="Navigation & Operations" className="px-2 py-1.5 font-mono text-[10px] uppercase font-bold text-[var(--sea-600)]">
              {[
                { title: 'Command Center', route: '/', icon: Monitor, hint: 'Fleet tactical overview' },
                { title: 'Live Drone Monitor', route: '/live', icon: Monitor, hint: 'Active RTSP streams & CFS' },
                { title: 'Fleet Wall (20 Feeds)', route: '/fleet', icon: Monitor, hint: 'Multi-stream wall' },
                { title: 'GIS Maritime Map', route: '/map', icon: Map, hint: 'Nautical contours & geofence' },
                { title: 'Incident Records (ELIR)', route: '/incidents', icon: FileText, hint: 'Court dossiers' },
                { title: 'Active Alert Queue', route: '/alerts', icon: Bell, hint: 'Operational triage' },
                { title: 'Persistent Contacts', route: '/contacts', icon: Radio, hint: 'ByteTrack maritime entities' },
                { title: 'AI Models & Datasets', route: '/models', icon: Cpu, hint: 'Registry & rollback' },
                { title: 'System Deployment', route: '/deployment', icon: Shield, hint: 'Edge node topology' },
                { title: 'Acceptance Console', route: '/acceptance', icon: CheckSquare, hint: '29 KSUM acceptance rows' },
                { title: 'Help Centre & Training', route: '/help', icon: Sparkles, hint: 'Tours & manuals' },
              ].map(p => {
                const Icon = p.icon;
                return (
                  <Command.Item
                    key={p.route}
                    onSelect={() => runCommand(() => navigate(p.route))}
                    className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-[var(--surface)] transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 text-[var(--sea-600)]" />
                      <span className="font-semibold">{p.title}</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-50">{p.hint}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>

            {/* Contacts */}
            <Command.Group heading="Persistent Maritime Contacts" className="px-2 py-1.5 font-mono text-[10px] uppercase font-bold text-[var(--sea-600)]">
              {[
                { id: 'C-1042', title: 'C-1042 · Motorised Country Craft', sub: 'Vizhinjam breakwater corridor' },
                { id: 'C-1048', title: 'C-1048 · Mechanised Trawler (Deep-Sea)', sub: 'Approaching 5 NM prohibited zone' },
                { id: 'C-1051', title: 'C-1051 · Traditional Wooden Craft', sub: 'Artisanal nearshore fishing' },
                { id: 'C-1055', title: 'C-1055 · Speedboat / Patrol Interceptor', sub: 'Coastal Police station unit' },
              ].map(c => (
                <Command.Item
                  key={c.id}
                  onSelect={() => runCommand(() => navigate(`/contacts/${c.id}`))}
                  className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-[var(--surface)] transition-colors text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="font-mono font-bold">{c.title}</span>
                  </div>
                  <span className="text-[10px] opacity-60 font-mono">{c.sub}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Incidents */}
            <Command.Group heading="Incident Dossiers & Alerts" className="px-2 py-1.5 font-mono text-[10px] uppercase font-bold text-[var(--sea-600)]">
              {[
                { id: 'INC-20261016-0042', title: 'INC-20261016-0042 · Prohibited Zone Breach', level: 'CRITICAL' },
                { id: 'INC-20261016-0038', title: 'INC-20261016-0038 · Shoreline Rapid Approach', level: 'ELEVATED' },
                { id: 'INC-20261015-0104', title: 'INC-20261015-0104 · Night Thermal Rendezvous', level: 'ATTENTION' },
              ].map(i => (
                <Command.Item
                  key={i.id}
                  onSelect={() => runCommand(() => navigate(`/incidents/${i.id}`))}
                  className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-[var(--surface)] transition-colors text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-mono font-bold">{i.title}</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-700">
                    {i.level}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* UAV Drone Feeds */}
            <Command.Group heading="UAV Sortie Feeds" className="px-2 py-1.5 font-mono text-[10px] uppercase font-bold text-[var(--sea-600)]">
              {UAVS.map(u => (
                <Command.Item
                  key={u.id}
                  onSelect={() => runCommand(() => navigate('/live'))}
                  className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-[var(--surface)] transition-colors text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Anchor className="w-3.5 h-3.5 text-[var(--sea-600)]" />
                    <span className="font-mono font-bold">{u.droneCode} ({u.makeModel})</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-60">Status: {u.isActive ? 'Active Live' : 'Standby'}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Quick Tactical Actions */}
            <Command.Group heading="Tactical Actions" className="px-2 py-1.5 font-mono text-[10px] uppercase font-bold text-[var(--sea-600)]">
              <Command.Item
                onSelect={() => runCommand(() => toggleTrainingMode())}
                className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-[var(--surface)] transition-colors text-xs"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Toggle Training Sandbox Mode</span>
                </div>
                <CornerDownLeft className="w-3 h-3 opacity-40" />
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => toggleTheme())}
                className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-[var(--surface)] transition-colors text-xs"
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Toggle Light / Dark Nautical Theme</span>
                </div>
                <CornerDownLeft className="w-3 h-3 opacity-40" />
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/reports'))}
                className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-[var(--surface)] transition-colors text-xs"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[var(--sea-600)]" />
                  <span>Generate Court-Admissible Dossier (PDF)</span>
                </div>
                <CornerDownLeft className="w-3 h-3 opacity-40" />
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer hints */}
          <div className="flex items-center justify-between px-4 py-2 border-t text-[10px] font-mono opacity-60 bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-3">
              <span>↑↓ Navigate</span>
              <span>↵ Open</span>
              <span>ESC Dismiss</span>
            </div>
            <span>SmartQEye Coastal Command Palette</span>
          </div>
        </Command>
      </div>
    </div>
  );
}

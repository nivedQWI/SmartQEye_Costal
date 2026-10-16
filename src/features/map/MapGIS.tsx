// ============================================================
// SmartQEye Coastal — Map / GIS Page (/map)
// Phase 7 Production UI Polish — 7E Upgrade
// Tactical GIS with Layer Controls, MGRS/UTM Coordinate Readout,
// Geodesic Ruler/Area Measurement, 12h Track Playback Scrubber,
// and Synchronised Map + Live Drone Video Split View (RFP §6)
// ============================================================

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Pentagon, Circle, Edit3, Trash2, Upload, ChevronRight, X, Save,
  Compass, Radio, Navigation, Battery, Wind, Crosshair,
  Shield, Layers, AlertTriangle, Check, Ruler, Play, Pause,
  RotateCcw, Video, Eye, EyeOff, Sliders, Maximize2, Split
} from 'lucide-react';
import { CoastalMap } from '@/components/CoastalMap';
import { DroneVideoPlayer } from '@/components/DroneVideoPlayer';
import { useMapStore, useFeedStore, useAlertStore } from '@/lib/store';
import { zonesApi, auditApi } from '@/lib/api';
import { ZONES, ZONE_PROFILES, UAVS, CONTACTS } from '@/lib/mockData';
import type { Zone, ZoneType, Modality } from '@/types';
import { cn, formatIST } from '@/lib/utils';
import { useToastStore } from '@/components/Toast';

// ─── Zone type colours & labels ───────────────────────────────

const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  RESTRICTED: 'Restricted Exclusion',
  MONITORED: 'Monitored Coastal',
  FISHING: 'Fishing Corridor',
  TOURISM: 'Tourism / Resort',
  HARBOUR: 'Port / Harbour Anchorage',
  BEACH: 'Public Beach / Shoreline',
  ESTUARY: 'Estuary / Backwaters',
  OPEN_SEA: 'Open Sea (5 NM Line)',
};

// ─── Geodesic & UTM Calculations Helper ────────────────────────

function toUTMString(lat: number, lon: number): string {
  // Approximate UTM / MGRS for Southern Kerala Coast (UTM Zone 43P)
  const zone = '43P';
  const easting = Math.round(500000 + (lon - 76.5) * 111320 * Math.cos((lat * Math.PI) / 180));
  const northing = Math.round(lat * 110574);
  const sq1 = 'FQ';
  const eStr = String(Math.abs(easting % 100000)).padStart(5, '0');
  const nStr = String(Math.abs(northing % 100000)).padStart(5, '0');
  return `${zone} ${sq1} ${eStr.slice(0, 3)} ${nStr.slice(0, 3)}`;
}

function haversineDistanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateBearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const b = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((b + 360) % 360);
}

// ─── Draw & Measurement Tools ─────────────────────────────────

type ActiveTool = 'none' | 'polygon' | 'circle' | 'edit' | 'ruler' | 'area';

function TacticalToolbar({
  tool,
  onSelect,
  onResetMeasurements
}: {
  tool: ActiveTool;
  onSelect: (t: ActiveTool) => void;
  onResetMeasurements: () => void;
}) {
  const tools: Array<{ id: ActiveTool; icon: React.ReactNode; label: string }> = [
    { id: 'ruler',   icon: <Ruler className="w-3.5 h-3.5" />,    label: 'Geodesic Ruler (NM/m)' },
    { id: 'polygon', icon: <Pentagon className="w-3.5 h-3.5" />, label: 'Geofence Polygon' },
    { id: 'circle',  icon: <Circle className="w-3.5 h-3.5" />,   label: 'Radial Buffer' },
    { id: 'edit',    icon: <Edit3 className="w-3.5 h-3.5" />,     label: 'Vertex Edit' },
  ];

  return (
    <div
      className="flex flex-col gap-1 p-2 rounded-xl border shadow-lg backdrop-blur-md select-none"
      style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
    >
      <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-[var(--sea-600)] px-1 mb-1">
        GIS Tactical Tools
      </div>
      {tools.map(t => (
        <button
          key={t.id}
          className={cn(
            'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors text-left',
            tool === t.id
              ? 'font-bold bg-[var(--sea-600)] text-white shadow-xs'
              : 'opacity-75 hover:opacity-100 hover:bg-[var(--sand-200)] dark:hover:bg-[var(--line)]',
          )}
          onClick={() => onSelect(tool === t.id ? 'none' : t.id)}
          title={t.label}
        >
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}

      <div className="h-px my-1" style={{ background: 'var(--line)' }} />

      <button
        onClick={onResetMeasurements}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono opacity-70 hover:opacity-100 hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
        title="Clear current distance and area measurements"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Clear Measure</span>
      </button>
    </div>
  );
}

// ─── Digital Compass Heading Widget ───────────────────────────

function DigitalCompass({ headingDeg = 195 }: { headingDeg?: number }) {
  const directions = [
    { label: 'N', deg: 0 },
    { label: 'NE', deg: 45 },
    { label: 'E', deg: 90 },
    { label: 'SE', deg: 135 },
    { label: 'S', deg: 180 },
    { label: 'SW', deg: 225 },
    { label: 'W', deg: 270 },
    { label: 'NW', deg: 315 },
  ];

  const getCardinal = (deg: number) => {
    const val = Math.floor((deg / 45) + 0.5) % 8;
    return directions[val].label;
  };

  return (
    <div
      className="p-2.5 rounded-xl border shadow-lg backdrop-blur-md flex flex-col items-center gap-1.5 select-none w-32"
      style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
    >
      <div className="text-[9px] uppercase font-mono font-bold tracking-widest text-[var(--text-muted)]">
        Gimbal Compass
      </div>

      <div className="relative w-20 h-20 rounded-full border border-[var(--line)] flex items-center justify-center bg-slate-950/20 shadow-inner">
        <span className="absolute top-0.5 text-[8px] font-mono font-bold text-red-600">N</span>
        <span className="absolute bottom-0.5 text-[8px] font-mono font-bold opacity-60">S</span>
        <span className="absolute right-1 text-[8px] font-mono font-bold opacity-60">E</span>
        <span className="absolute left-1 text-[8px] font-mono font-bold opacity-60">W</span>

        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out"
          style={{ transform: `rotate(${headingDeg}deg)` }}
        >
          <div className="w-1 h-8 bg-red-600 rounded-t-full -translate-y-4 shadow-xs" />
          <div className="w-1 h-8 bg-slate-400 rounded-b-full translate-y-4 shadow-xs" />
          <div className="absolute w-2.5 h-2.5 rounded-full bg-slate-900 border border-white" />
        </div>
      </div>

      <div className="text-center font-mono text-xs font-bold text-[var(--text)]">
        <span>{headingDeg}°</span>
        <span className="ml-1 text-[var(--sea-600)]">{getCardinal(headingDeg)}</span>
      </div>
    </div>
  );
}

// ─── Tactical Drone Telemetry HUD Overlay ─────────────────────

function TelemetryHUD({
  drone,
  onFocus,
  onOpenSplitView,
  isSplitViewOpen,
}: {
  drone: (typeof UAVS)[0];
  onFocus: () => void;
  onOpenSplitView: () => void;
  isSplitViewOpen: boolean;
}) {
  return (
    <div
      className="p-3 rounded-xl border shadow-lg backdrop-blur-md flex flex-col gap-2 w-64 select-none"
      style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
    >
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span className="font-mono text-xs font-bold text-[var(--text)]">{drone.droneCode}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onFocus}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--panel)] hover:bg-[var(--sand-200)] text-[var(--text)] border border-[var(--line)] flex items-center gap-0.5"
            title="Recenter camera on this UAV"
          >
            <Crosshair className="w-3 h-3" /> Focus
          </button>
          <button
            onClick={onOpenSplitView}
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 transition-colors",
              isSplitViewOpen
                ? "bg-[var(--sea-600)] text-white border-[var(--sea-600)]"
                : "bg-[var(--panel)] text-[var(--sea-600)] border-[var(--line)] hover:bg-[var(--sand-200)]"
            )}
            title="Toggle simultaneous map + live drone feed split view"
          >
            <Split className="w-3 h-3" /> Split
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
        <div>
          <span className="text-[9px] uppercase opacity-60 block">Altitude</span>
          <span className="font-bold">124m AGL</span>
        </div>
        <div>
          <span className="text-[9px] uppercase opacity-60 block">Airspeed</span>
          <span className="font-bold">38 km/h</span>
        </div>
        <div>
          <span className="text-[9px] uppercase opacity-60 block">Battery</span>
          <span className="font-bold text-emerald-600 flex items-center gap-1">
            <Battery className="w-3 h-3" /> 86% (28m)
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase opacity-60 block">Wind Vector</span>
          <span className="font-bold flex items-center gap-1">
            <Wind className="w-3 h-3 text-[var(--sea-600)]" /> 14kt WNW
          </span>
        </div>
      </div>

      <div className="pt-1.5 border-t border-[var(--line)] flex items-center justify-between text-[10px] font-mono opacity-70">
        <span>LAT: 8.3842° N</span>
        <span>LON: 76.9781° E</span>
      </div>
    </div>
  );
}

// ─── Comprehensive Layer Controls Panel ────────────────────────

interface LayerFilterState {
  // Zones by type
  zoneRestricted: boolean;
  zoneFishing: boolean;
  zoneTourism: boolean;
  zoneBeach: boolean;
  zoneHarbour: boolean;
  zoneEstuary: boolean;
  zoneOpenSea: boolean;
  // Contacts
  contactVessels: boolean;
  contactSmallCraft: boolean;
  contactFishing: boolean;
  contactPersons: boolean;
  contactVehicles: boolean;
  // Tracks & Alerts
  tracksCurrentSortie: boolean;
  tracks24hHistory: boolean;
  alertsCritical: boolean;
  alertsElevated: boolean;
  alertsRoutine: boolean;
  uavTrails: boolean;
  patrolSectors: boolean;
  landingCentres: boolean;
}

function LayerControlsDropdown({
  layers,
  onToggle,
}: {
  layers: LayerFilterState;
  onToggle: (k: keyof LayerFilterState) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold shadow-md backdrop-blur-md transition-colors"
        style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
      >
        <Layers className="w-3.5 h-3.5 text-[var(--sea-600)]" />
        <span>Tactical Layers</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      </button>

      {open && (
        <div
          className="absolute top-10 left-0 w-72 rounded-xl border shadow-xl backdrop-blur-md p-3 z-30 space-y-3 max-h-[80vh] overflow-y-auto"
          style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: 'var(--line)' }}>
            <span className="font-serif text-xs font-bold">GIS Layer Overlays</span>
            <button className="text-xs font-bold opacity-60 hover:opacity-100" onClick={() => setOpen(false)}>×</button>
          </div>

          {/* Zones */}
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--sea-600)] mb-1">
              Maritime Zones by Classification
            </div>
            <div className="space-y-1 text-xs font-mono">
              {[
                { k: 'zoneRestricted', l: 'Restricted Exclusion (Red)', c: '#C8352E' },
                { k: 'zoneFishing', l: 'Fishing Corridors (Green)', c: '#2ECC71' },
                { k: 'zoneHarbour', l: 'Port & Anchorage (Blue)', c: '#2B7FA6' },
                { k: 'zoneTourism', l: 'Tourism & Resorts (Amber)', c: '#E0A526' },
                { k: 'zoneBeach', l: 'Public Beaches (Yellow)', c: '#F1C40F' },
                { k: 'zoneEstuary', l: 'Estuaries & Inlets (Cyan)', c: '#1ABC9C' },
                { k: 'zoneOpenSea', l: '5 NM Territorial Waters', c: '#34495E' },
              ].map(item => (
                <label key={item.k} className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                  <input
                    type="checkbox"
                    checked={layers[item.k as keyof LayerFilterState]}
                    onChange={() => onToggle(item.k as keyof LayerFilterState)}
                    className="rounded"
                    style={{ accentColor: 'var(--sea-600)' }}
                  />
                  <span className="w-2 h-2 rounded-xs flex-shrink-0" style={{ background: item.c }} />
                  <span className="truncate">{item.l}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Contacts */}
          <div className="border-t pt-2" style={{ borderColor: 'var(--line)' }}>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--sea-600)] mb-1">
              Contact Class Filtering
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs font-mono">
              {[
                { k: 'contactVessels', l: 'Vessels' },
                { k: 'contactSmallCraft', l: 'Small Craft' },
                { k: 'contactFishing', l: 'Fishing Boats' },
                { k: 'contactPersons', l: 'Persons' },
                { k: 'contactVehicles', l: 'Vehicles' },
              ].map(item => (
                <label key={item.k} className="flex items-center gap-1.5 cursor-pointer hover:opacity-80">
                  <input
                    type="checkbox"
                    checked={layers[item.k as keyof LayerFilterState]}
                    onChange={() => onToggle(item.k as keyof LayerFilterState)}
                    className="rounded"
                    style={{ accentColor: 'var(--sea-600)' }}
                  />
                  <span>{item.l}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tracks, Alerts & Infrastructure */}
          <div className="border-t pt-2" style={{ borderColor: 'var(--line)' }}>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--sea-600)] mb-1">
              Tracks & Operational GIS
            </div>
            <div className="space-y-1 text-xs font-mono">
              {[
                { k: 'tracksCurrentSortie', l: 'Current Sortie Trajectories' },
                { k: 'tracks24hHistory', l: '24h Kinematic Breadcrumb History' },
                { k: 'alertsCritical', l: 'Critical Alert Halos (▲)' },
                { k: 'uavTrails', l: 'UAV Flight Vectors & Trails' },
                { k: 'patrolSectors', l: 'Kerala Police Patrol Sectors' },
                { k: 'landingCentres', l: 'Harbours & Landing Centres' },
              ].map(item => (
                <label key={item.k} className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                  <input
                    type="checkbox"
                    checked={layers[item.k as keyof LayerFilterState]}
                    onChange={() => onToggle(item.k as keyof LayerFilterState)}
                    className="rounded"
                    style={{ accentColor: 'var(--sea-600)' }}
                  />
                  <span>{item.l}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 12-Hour Historical Track Playback Scrubber ────────────────

function HistoricalPlaybackScrubber({
  isPlaying,
  onTogglePlay,
  playbackOffsetHours,
  onSeekHours,
  speed,
  onSetSpeed,
}: {
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackOffsetHours: number; // 0 = now, -12 = 12h ago
  onSeekHours: (h: number) => void;
  speed: 1 | 5 | 20;
  onSetSpeed: (s: 1 | 5 | 20) => void;
}) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-1.5 rounded-xl border shadow-lg backdrop-blur-md select-none"
      style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
    >
      {/* Play/Pause Button */}
      <button
        onClick={onTogglePlay}
        className="p-1 rounded-lg bg-[var(--sea-600)] text-white hover:opacity-90 transition-opacity"
        title={isPlaying ? 'Pause Track Playback' : 'Play 12h Historical Track Replay'}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>

      {/* Scrubber Info & Slider */}
      <div className="flex flex-col gap-0.5 w-60 sm:w-80">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="font-bold text-[var(--sea-600)]">
            {playbackOffsetHours === 0 ? 'LIVE REPLAY' : `${Math.abs(playbackOffsetHours).toFixed(1)}h Ago`}
          </span>
          <span className="opacity-60">-12h Coastal Archive</span>
        </div>
        <input
          type="range"
          min={-12}
          max={0}
          step={0.1}
          value={playbackOffsetHours}
          onChange={(e) => onSeekHours(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[var(--line)]"
          style={{ accentColor: 'var(--sea-600)' }}
        />
      </div>

      {/* Speed multiplier toggles */}
      <div className="flex items-center gap-1 border-l pl-2" style={{ borderColor: 'var(--line)' }}>
        {[1, 5, 20].map(s => (
          <button
            key={s}
            onClick={() => onSetSpeed(s as 1 | 5 | 20)}
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors",
              speed === s
                ? "bg-[var(--sea-600)] text-white"
                : "opacity-60 hover:opacity-100 hover:bg-[var(--sand-200)]"
            )}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Zone Properties Drawer ───────────────────────────────────

function ZonePropertiesDrawer({
  zone,
  onClose,
  onSave
}: {
  zone: Zone;
  onClose: () => void;
  onSave: (z: Zone) => void;
}) {
  const [draft, setDraft] = useState<Zone>({ ...zone });

  function save() {
    onSave(draft);
    onClose();
  }

  return (
    <div
      className="w-80 flex-shrink-0 flex flex-col border-l overflow-hidden shadow-xl"
      style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--line)' }}>
        <div>
          <div className="font-mono text-xs opacity-50">{zone.code}</div>
          <div className="font-serif text-sm font-semibold">Zone Geofence Properties</div>
        </div>
        <button className="opacity-40 hover:opacity-100 text-lg font-bold" onClick={onClose}>×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1 opacity-70">Zone Identifier</label>
          <input
            value={draft.name}
            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl text-sm border outline-none font-sans"
            style={{ background: 'var(--raised)', borderColor: 'var(--line)', color: 'var(--text)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1 opacity-70">Classification Type</label>
          <select
            value={draft.type}
            onChange={e => setDraft(d => ({ ...d, type: e.target.value as ZoneType }))}
            className="w-full px-3 py-2 rounded-xl text-sm border outline-none font-sans"
            style={{ background: 'var(--raised)', borderColor: 'var(--line)', color: 'var(--text)' }}
          >
            {Object.entries(ZONE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1 opacity-70">Assigned Security Profile</label>
          <select
            value={draft.profileId}
            onChange={e => setDraft(d => ({ ...d, profileId: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl text-sm border outline-none font-sans"
            style={{ background: 'var(--raised)', borderColor: 'var(--line)', color: 'var(--text)' }}
          >
            {ZONE_PROFILES.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.sensitivityLevel})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1 opacity-70">Boundary Perimeter Color</label>
          <input
            type="color"
            value={draft.color}
            onChange={e => setDraft(d => ({ ...d, color: e.target.value }))}
            className="w-full h-9 rounded-xl border outline-none cursor-pointer p-1"
            style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
          />
        </div>
      </div>

      <div className="p-3 border-t flex items-center justify-end gap-2" style={{ borderColor: 'var(--line)' }}>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium opacity-70 hover:opacity-100"
        >
          Cancel
        </button>
        <button
          onClick={save}
          className="px-4 py-1.5 rounded-xl text-xs font-mono font-bold bg-[var(--sea-600)] text-white hover:opacity-90 flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" /> Save Geofence
        </button>
      </div>
    </div>
  );
}

// ─── Simultaneous Map + Drone Video Split View Component ───────

function SplitDroneVideoDrawer({
  drone,
  onClose,
}: {
  drone: (typeof UAVS)[0];
  onClose: () => void;
}) {
  const [modality, setModality] = useState<Modality>('RGB');

  return (
    <div
      className="w-[480px] lg:w-[560px] flex-shrink-0 flex flex-col border-l shadow-2xl relative z-20"
      style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
    >
      {/* Split View Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-serif text-sm font-semibold">{drone.droneCode} Ingest Feed</h3>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--sand-200)] text-[var(--ink-900)] font-bold">
            RFP §6 Synchronised
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100"
          title="Close Split View"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Synchronized Drone Video Player */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="aspect-video w-full bg-black relative">
          <DroneVideoPlayer
            sceneName="vizhinjam_patrol"
            autoPlay={true}
            loop={true}
            showControls={true}
            initialModality={modality}
            compactControls={true}
          />
        </div>

        {/* Tactical Sensor HUD & Frustum Info */}
        <div className="p-3.5 space-y-3 font-mono text-xs">
          <div className="p-2.5 rounded-lg border bg-[var(--raised)] space-y-1" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between font-bold text-[var(--sea-600)]">
              <span>Sensor Frustum Telemetry</span>
              <span>1080p @ 30 FPS</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>Gimbal Pitch: -32.4°</div>
              <div>Gimbal Yaw: 195.0° S</div>
              <div>Standoff Dist: 180m</div>
              <div>Sensor Footprint: 240m × 135m</div>
            </div>
          </div>

          <div className="text-[11px] opacity-75 leading-relaxed">
            <strong>RFP §6 Split Synchronization:</strong> Real-time pan-tilt-zoom orientation and ground footprint polygons are dynamically projected onto the MapLibre tactical canvas.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Map / GIS Page Component ─────────────────────────────

export default function MapGIS() {
  const [tool, setTool] = useState<ActiveTool>('none');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedDroneIndex, setSelectedDroneIndex] = useState(0);
  const [isSplitViewOpen, setIsSplitViewOpen] = useState(false);
  const { addToast } = useToastStore();

  // Mouse cursor & measurement states
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number }>({ lat: 8.3842, lon: 76.9781 });
  const [measurePoints, setMeasurePoints] = useState<Array<{ lat: number; lon: number }>>([]);

  // 12-hour track playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackOffsetHours, setPlaybackOffsetHours] = useState(0);
  const [speed, setSpeed] = useState<1 | 5 | 20>(1);

  // Tactical layers state
  const [layerFilters, setLayerFilters] = useState<LayerFilterState>({
    zoneRestricted: true,
    zoneFishing: true,
    zoneTourism: true,
    zoneBeach: true,
    zoneHarbour: true,
    zoneEstuary: true,
    zoneOpenSea: true,
    contactVessels: true,
    contactSmallCraft: true,
    contactFishing: true,
    contactPersons: true,
    contactVehicles: true,
    tracksCurrentSortie: true,
    tracks24hHistory: false,
    alertsCritical: true,
    alertsElevated: true,
    alertsRoutine: true,
    uavTrails: true,
    patrolSectors: true,
    landingCentres: true,
  });

  const selectedZone = ZONES.find(z => z.id === selectedZoneId);
  const currentDrone = UAVS[selectedDroneIndex] || UAVS[0];

  const toggleLayerFilter = (key: keyof LayerFilterState) => {
    setLayerFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPlaybackOffsetHours(prev => {
        if (prev >= 0) {
          setIsPlaying(false);
          return 0;
        }
        return Math.min(0, prev + 0.05 * speed);
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  // Handle map clicks for ruler & polygon measurements
  const handleMapClick = (coords: { lat: number; lon: number }) => {
    if (tool === 'ruler') {
      setMeasurePoints(prev => {
        if (prev.length >= 2) return [coords];
        return [...prev, coords];
      });
    } else if (tool === 'polygon') {
      setMeasurePoints(prev => [...prev, coords]);
    }
  };

  // Measurement results calculation
  const measurementResult = useMemo(() => {
    if (tool === 'ruler' && measurePoints.length >= 2) {
      const p1 = measurePoints[0];
      const p2 = measurePoints[1];
      const distM = haversineDistanceM(p1.lat, p1.lon, p2.lat, p2.lon);
      const distNM = distM / 1852;
      const bearing = calculateBearingDeg(p1.lat, p1.lon, p2.lat, p2.lon);
      return {
        type: 'ruler',
        text: `${distNM.toFixed(2)} NM (${distM < 1000 ? `${distM.toFixed(0)} m` : `${(distM / 1000).toFixed(2)} km`}) · Bearing: ${bearing}°`,
      };
    } else if (tool === 'polygon' && measurePoints.length >= 3) {
      // Calculate approximate area
      const p0 = measurePoints[0];
      let areaM2 = 0;
      for (let i = 0; i < measurePoints.length; i++) {
        const j = (i + 1) % measurePoints.length;
        const x1 = (measurePoints[i].lon - p0.lon) * 111320 * Math.cos((p0.lat * Math.PI) / 180);
        const y1 = (measurePoints[i].lat - p0.lat) * 110574;
        const x2 = (measurePoints[j].lon - p0.lon) * 111320 * Math.cos((p0.lat * Math.PI) / 180);
        const y2 = (measurePoints[j].lat - p0.lat) * 110574;
        areaM2 += x1 * y2 - x2 * y1;
      }
      areaM2 = Math.abs(areaM2) / 2;
      const ha = areaM2 / 10000;
      const km2 = areaM2 / 1000000;
      return {
        type: 'area',
        text: `Perimeter: ${measurePoints.length} vertices · Area: ${ha.toFixed(2)} ha (${km2.toFixed(3)} km²)`,
      };
    }
    return null;
  }, [tool, measurePoints]);

  function handleZoneSave(updated: Zone) {
    zonesApi.update(updated.id, updated);
    auditApi.append({
      userId: 'usr-001',
      userName: 'SI Menon R.',
      userRole: 'OPERATOR',
      action: 'UPDATE_ZONE_GEOFENCE',
      targetType: 'ZONE',
      targetId: updated.id,
      outcome: 'SUCCESS',
      detail: { zoneName: updated.name, type: updated.type },
    });
    addToast({
      title: 'Geofence Updated',
      message: `Zone ${updated.code} boundary and security profile successfully saved.`,
      type: 'success',
    });
    setSelectedZoneId(null);
  }

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* ── Main Map Canvas ── */}
      <div className="flex-1 relative flex flex-col min-w-0">
        <CoastalMap
          height="100%"
          className="absolute inset-0"
          onZoneClick={id => setSelectedZoneId(id === selectedZoneId ? null : id)}
          onDroneClick={() => setIsSplitViewOpen(true)}
          onCursorMove={setCursorCoords}
          onMapClick={handleMapClick}
        />

        {/* ── Top Left Floating Controls (Toolbar + Layers) ── */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-auto">
          <LayerControlsDropdown
            layers={layerFilters}
            onToggle={toggleLayerFilter}
          />
          <TacticalToolbar
            tool={tool}
            onSelect={setTool}
            onResetMeasurements={() => setMeasurePoints([])}
          />
        </div>

        {/* ── Top Right Floating HUD (Compass & Drone Telemetry) ── */}
        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2.5 pointer-events-auto">
          <DigitalCompass headingDeg={195} />
          <TelemetryHUD
            drone={currentDrone}
            onFocus={() => {
              addToast({
                title: 'GIS Focus',
                message: `Tactical camera locked to ${currentDrone.droneCode}`,
                type: 'info',
              });
            }}
            onOpenSplitView={() => setIsSplitViewOpen(!isSplitViewOpen)}
            isSplitViewOpen={isSplitViewOpen}
          />
        </div>

        {/* ── Active Tool Guidance Banner ── */}
        {tool !== 'none' && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold shadow-xl border flex items-center gap-2 z-20"
            style={{ background: 'var(--ink-900)', color: 'var(--sand-200)', borderColor: 'var(--sea-600)' }}
          >
            <span>
              {tool === 'ruler' && 'GEODESIC RULER: Click two points on water to calculate nautical distance (NM) & true bearing (°)'}
              {tool === 'polygon' && 'GEOFENCE POLYGON: Click map to place perimeter vertices'}
              {tool === 'circle' && 'RADIAL BUFFER: Click center point to anchor security perimeter'}
              {tool === 'edit' && 'VERTEX EDIT: Drag boundary nodes to adjust geofence'}
            </span>
            <button
              onClick={() => {
                setTool('none');
                setMeasurePoints([]);
              }}
              className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[10px]"
            >
              Exit
            </button>
          </div>
        )}

        {/* ── Measurement Result Chip ── */}
        {measurementResult && (
          <div
            className="absolute top-14 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-xs font-mono font-bold shadow-2xl border flex items-center gap-2 z-20 bg-[var(--raised)] text-[var(--sea-600)]"
            style={{ borderColor: 'var(--sea-600)' }}
          >
            <Ruler className="w-4 h-4" />
            <span>{measurementResult.text}</span>
          </div>
        )}

        {/* ── Bottom HUD Bar (Coordinates + 12h Playback Scrubber) ── */}
        <div className="absolute bottom-4 inset-x-4 z-10 flex items-center justify-between pointer-events-none">
          {/* Real-time Cursor Coordinates Readout */}
          <div
            className="px-3 py-1.5 rounded-xl border shadow-lg backdrop-blur-md font-mono text-xs flex items-center gap-3 pointer-events-auto"
            style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
          >
            <div>
              <span className="text-[9px] uppercase opacity-60 block">Geodetic DD.DDDDD°</span>
              <span className="font-bold">
                {cursorCoords.lat.toFixed(5)}°N, {cursorCoords.lon.toFixed(5)}°E
              </span>
            </div>
            <div className="h-6 w-px bg-[var(--line)]" />
            <div>
              <span className="text-[9px] uppercase opacity-60 block">MGRS / UTM Grid</span>
              <span className="font-bold text-[var(--sea-600)]">
                {toUTMString(cursorCoords.lat, cursorCoords.lon)}
              </span>
            </div>
            <div className="h-6 w-px bg-[var(--line)] hidden sm:block" />
            <div className="hidden sm:block">
              <span className="text-[9px] uppercase opacity-60 block">Bathymetry / Depth</span>
              <span className="font-bold opacity-80">-14m Chart Datum</span>
            </div>
          </div>

          {/* 12-Hour Historical Track Playback Scrubber */}
          <div className="pointer-events-auto">
            <HistoricalPlaybackScrubber
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              playbackOffsetHours={playbackOffsetHours}
              onSeekHours={setPlaybackOffsetHours}
              speed={speed}
              onSetSpeed={setSpeed}
            />
          </div>
        </div>
      </div>

      {/* ── Simultaneous Map + Drone Video Split View Drawer (RFP §6) ── */}
      {isSplitViewOpen && (
        <SplitDroneVideoDrawer
          drone={currentDrone}
          onClose={() => setIsSplitViewOpen(false)}
        />
      )}

      {/* ── Zone Geofence Properties Drawer ── */}
      {selectedZone && (
        <ZonePropertiesDrawer
          zone={selectedZone}
          onClose={() => setSelectedZoneId(null)}
          onSave={handleZoneSave}
        />
      )}
    </div>
  );
}

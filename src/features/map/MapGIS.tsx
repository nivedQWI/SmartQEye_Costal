// ============================================================
// SmartQEye Coastal — Map / GIS Page (/map)
// Tactical GIS with Geofence Polygon Drawing, Digital Compass & Telemetry HUD
// As specified in Costal Police .docx
// ============================================================

import { useState } from 'react';
import {
  Pentagon, Circle, Edit3, Trash2, Upload, ChevronRight, X, Save,
  Compass, Radio, Navigation, Battery, Wind, Crosshair,
  Shield, Layers, AlertTriangle, Check
} from 'lucide-react';
import { CoastalMap } from '@/components/CoastalMap';
import { useMapStore } from '@/lib/store';
import { zonesApi } from '@/lib/api';
import { ZONES, ZONE_PROFILES, UAVS } from '@/lib/mockData';
import type { Zone, ZoneType } from '@/types';
import { cn } from '@/lib/utils';

// ─── Zone type colours & labels ───────────────────────────────

const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  RESTRICTED: 'Restricted', MONITORED: 'Monitored', FISHING: 'Fishing',
  TOURISM: 'Tourism', HARBOUR: 'Harbour', BEACH: 'Beach', ESTUARY: 'Estuary', OPEN_SEA: 'Open Sea',
};

// ─── Draw tool ────────────────────────────────────────────────

type DrawTool = 'polygon' | 'circle' | 'select' | 'edit' | 'none';

function DrawTools({ tool, onSelect }: { tool: DrawTool; onSelect: (t: DrawTool) => void }) {
  const tools: Array<{ id: DrawTool; icon: React.ReactNode; label: string }> = [
    { id: 'polygon', icon: <Pentagon className="w-4 h-4" />, label: 'Geofence Polygon' },
    { id: 'circle',  icon: <Circle   className="w-4 h-4" />, label: 'Circular Buffer' },
    { id: 'edit',    icon: <Edit3    className="w-4 h-4" />, label: 'Edit Vertices' },
  ];

  return (
    <div
      className="flex flex-col gap-1 p-2 rounded-xl border shadow-lg backdrop-blur-md"
      style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
    >
      <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-[var(--accent)] px-1 mb-1">
        Geofence Tools
      </div>
      {tools.map(t => (
        <button
          key={t.id}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors',
            tool === t.id ? 'font-bold bg-[var(--sand-200)] text-[var(--text)]' : 'opacity-70 hover:opacity-100 hover:bg-[var(--surface-hover)]',
          )}
          onClick={() => onSelect(t.id)}
          title={t.label}
        >
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
      <div className="h-px my-1" style={{ background: 'var(--line)' }} />
      <button
        onClick={() => alert('GeoJSON polygon definition loaded into GIS canvas.')}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs opacity-70 hover:opacity-100 hover:bg-[var(--surface-hover)] transition-colors"
        title="Import GeoJSON / KML"
      >
        <Upload className="w-4 h-4" />
        <span>Import KML/GeoJSON</span>
      </button>
    </div>
  );
}

// ─── Digital Compass Heading Widget ───────────────────────────

function DigitalCompass({ headingDeg = 195 }: { headingDeg?: number }) {
  const directions = [
    { label: 'N', deg: 0, bold: true },
    { label: 'NE', deg: 45 },
    { label: 'E', deg: 90, bold: true },
    { label: 'SE', deg: 135 },
    { label: 'S', deg: 180, bold: true },
    { label: 'SW', deg: 225 },
    { label: 'W', deg: 270, bold: true },
    { label: 'NW', deg: 315 },
  ];

  const getCardinal = (deg: number) => {
    const val = Math.floor((deg / 45) + 0.5) % 8;
    return directions[val].label;
  };

  return (
    <div
      className="p-3 rounded-xl border shadow-lg backdrop-blur-md flex flex-col items-center gap-2 select-none w-36"
      style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
    >
      <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-[var(--text-muted)]">
        Compass Heading
      </div>

      {/* Compass Dial */}
      <div className="relative w-24 h-24 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-950/20 shadow-inner">
        {/* Cardinal markings */}
        <span className="absolute top-1 text-[9px] font-mono font-bold text-red-600">N</span>
        <span className="absolute bottom-1 text-[9px] font-mono font-bold text-slate-500">S</span>
        <span className="absolute right-1.5 text-[9px] font-mono font-bold text-slate-500">E</span>
        <span className="absolute left-1.5 text-[9px] font-mono font-bold text-slate-500">W</span>

        {/* Rotating Compass Needle */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out"
          style={{ transform: `rotate(${headingDeg}deg)` }}
        >
          {/* North needle tip (red) */}
          <div className="w-1.5 h-10 bg-red-600 rounded-t-full -translate-y-5 shadow-xs" />
          {/* South needle tip (silver) */}
          <div className="w-1.5 h-10 bg-slate-400 rounded-b-full translate-y-5 shadow-xs" />
          {/* Pivot center */}
          <div className="absolute w-3 h-3 rounded-full bg-slate-900 border border-white" />
        </div>
      </div>

      <div className="text-center">
        <span className="font-mono text-sm font-bold text-[var(--text)]">{headingDeg}°</span>
        <span className="ml-1 text-xs font-mono font-bold text-[var(--accent)]">{getCardinal(headingDeg)}</span>
      </div>
    </div>
  );
}

// ─── Tactical Drone Telemetry HUD Overlay ─────────────────────

function TelemetryHUD({
  drone,
  onFocus
}: {
  drone: (typeof UAVS)[0];
  onFocus: () => void;
}) {
  return (
    <div
      className="p-3.5 rounded-xl border shadow-lg backdrop-blur-md flex flex-col gap-2.5 w-64 select-none"
      style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
    >
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span className="font-mono text-xs font-bold text-[var(--text)]">{drone.droneCode}</span>
        </div>
        <button
          onClick={onFocus}
          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--surface-muted)] hover:bg-[var(--sand-200)] text-[var(--accent)] border border-[var(--line)] flex items-center gap-1"
          title="Track camera on this UAV"
        >
          <Crosshair className="w-3 h-3" /> Focus
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div>
          <span className="text-[9px] uppercase text-slate-500 block">Altitude</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">124m AGL</span>
        </div>
        <div>
          <span className="text-[9px] uppercase text-slate-500 block">Airspeed</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">38 km/h</span>
        </div>
        <div>
          <span className="text-[9px] uppercase text-slate-500 block">Battery</span>
          <span className="font-bold text-emerald-600 flex items-center gap-1">
            <Battery className="w-3 h-3" /> 86% (28m)
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase text-slate-500 block">Wind Vector</span>
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Wind className="w-3 h-3" /> 14kt WNW
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>LAT: 8.3842° N</span>
        <span>LON: 76.9781° E</span>
      </div>
    </div>
  );
}

// ─── Zone properties drawer ───────────────────────────────────

function ZonePropertiesDrawer({ zone, onClose, onSave }: { zone: Zone; onClose: () => void; onSave: (z: Zone) => void }) {
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--line)' }}>
        <div>
          <div className="font-mono text-xs opacity-50">{zone.code}</div>
          <div className="font-serif text-sm font-semibold">Zone Properties</div>
        </div>
        <button className="opacity-40 hover:opacity-100 text-lg font-bold" onClick={onClose}>×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Zone Name</label>
          <input
            value={draft.name}
            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl text-sm border outline-none font-sans"
            style={{ background: 'var(--raised)', borderColor: 'var(--line)', color: 'var(--text)' }}
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Zone Classification</label>
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

        {/* Profile */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Assigned Profile</label>
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

        {/* Color */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Boundary Color</label>
          <input
            type="color"
            value={draft.color}
            onChange={e => setDraft(d => ({ ...d, color: e.target.value }))}
            className="w-full h-9 rounded-xl border outline-none cursor-pointer p-1"
            style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t flex items-center justify-end gap-2" style={{ borderColor: 'var(--line)' }}>
        <button
          onClick={onClose}
          className="px-3 py-2 rounded-xl text-xs font-mono font-medium opacity-70 hover:opacity-100"
        >
          Cancel
        </button>
        <button
          onClick={save}
          className="btn-navy text-xs px-4 py-2 rounded-xl flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" /> Save Zone
        </button>
      </div>
    </div>
  );
}

// ─── Zone list sidebar ────────────────────────────────────────

function ZoneList({
  selectedId,
  onSelect
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="w-64 flex-shrink-0 flex flex-col border-r"
      style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b flex-shrink-0" style={{ borderColor: 'var(--line)' }}>
        <span className="font-serif text-sm font-semibold">Active Geofences</span>
        <button
          onClick={() => alert('Click "Geofence Polygon" tool on the map to trace new perimeter vertices.')}
          className="text-xs px-2.5 py-1 rounded-lg transition-colors font-mono font-bold"
          style={{ background: 'var(--sand-200)', color: 'var(--ink-900)' }}
        >
          + New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {ZONES.map(zone => (
          <button
            key={zone.id}
            className={cn(
              'w-full text-left px-3 py-2.5 border-b flex items-center gap-2.5 transition-colors hover:bg-[var(--sand-100)] dark:hover:bg-[var(--raised)]',
              selectedId === zone.id && 'bg-[var(--sea-100)] dark:bg-[var(--raised)]',
            )}
            style={{ borderColor: 'var(--line)' }}
            onClick={() => onSelect(zone.id)}
          >
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: zone.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{zone.name}</div>
              <div className="text-[10px] opacity-60 font-mono">{zone.code} · {ZONE_TYPE_LABELS[zone.type]}</div>
            </div>
            <span className="text-[10px] opacity-50 font-mono">v{zone.version}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Map GIS page ─────────────────────────────────────────────

export default function MapGIS() {
  const [drawTool, setDrawTool] = useState<DrawTool>('none');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedDroneIndex, setSelectedDroneIndex] = useState(0);

  const selectedZone = ZONES.find(z => z.id === selectedZoneId);
  const currentDrone = UAVS[selectedDroneIndex] || UAVS[0];

  function handleZoneSave(updated: Zone) {
    zonesApi.update(updated.id, updated);
    setSelectedZoneId(null);
  }

  function handleFocusDrone() {
    alert(`GIS Camera zoomed to ${currentDrone.droneCode} at 8.3842°N, 76.9781°E`);
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Zone list sidebar */}
      <ZoneList
        selectedId={selectedZoneId}
        onSelect={(id) => setSelectedZoneId(id === selectedZoneId ? null : id)}
      />

      {/* Map canvas */}
      <div className="flex-1 relative">
        <CoastalMap
          height="100%"
          className="absolute inset-0"
          onZoneClick={id => setSelectedZoneId(id === selectedZoneId ? null : id)}
        />

        {/* Draw tools overlay (Top Left) */}
        <div className="absolute top-4 left-4 z-10">
          <DrawTools tool={drawTool} onSelect={setDrawTool} />
        </div>

        {/* Digital Compass & Telemetry HUD (Top Right) */}
        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-3 pointer-events-auto">
          <DigitalCompass headingDeg={195} />
          <TelemetryHUD drone={currentDrone} onFocus={handleFocusDrone} />
        </div>

        {/* Draw mode hint banner */}
        {drawTool !== 'none' && (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold shadow-2xl border flex items-center gap-3 z-20"
            style={{ background: 'var(--ink-900)', color: 'var(--sand-200)', borderColor: 'var(--accent)' }}
          >
            <span>
              {drawTool === 'polygon' && 'GEOFENCE POLYGON MODE: Click map to place vertices · Double-click to close boundary'}
              {drawTool === 'circle' && 'RADIAL BUFFER MODE: Click center anchor point · Drag to set radius (m)'}
              {drawTool === 'edit' && 'VERTEX EDIT MODE: Drag polygon handles to reposition geofence perimeter'}
            </span>
            <button
              className="ml-2 px-2 py-0.5 rounded bg-red-600/80 hover:bg-red-600 text-white text-[11px]"
              onClick={() => setDrawTool('none')}
            >
              Finish Drawing
            </button>
          </div>
        )}
      </div>

      {/* Zone properties drawer */}
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

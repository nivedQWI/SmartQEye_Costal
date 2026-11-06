// ============================================================
// SmartQEye Coastal — Map / GIS Page (/map)
// Tactical GIS with Active Mission Drones, Port Selection & Geofence Drawing
// As specified in Coastal Police Requirements
// ============================================================

import { useState } from 'react';
import {
  Pentagon, Undo2, Trash2, CheckCircle2,
  Compass, Radio, Battery, Wind, Crosshair,
  Shield, Anchor, Send, X, Layers, AlertCircle
} from 'lucide-react';
import { CoastalMap } from '@/components/CoastalMap';
import { useAuthStore } from '@/lib/store';
import { can } from '@/lib/roleConfig';
import { ZONES, ZONE_PROFILES, UAVS } from '@/lib/mockData';
import { KERALA_SEAPORTS, ACTIVE_MISSION_DRONES, type SeaPort, type ActiveDroneMission } from '@/lib/coastalPortsData';
import type { Zone, ZoneType } from '@/types';
import { cn } from '@/lib/utils';

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
      className="p-3 rounded-xl border shadow-lg backdrop-blur-md flex flex-col items-center gap-2 select-none w-36 bg-[var(--raised)] border-[var(--line)]"
    >
      <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-[var(--text-muted)]">
        Compass Heading
      </div>

      {/* Compass Dial */}
      <div className="relative w-20 h-20 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-950/20 shadow-inner">
        <span className="absolute top-1 text-[9px] font-mono font-bold text-red-600">N</span>
        <span className="absolute bottom-1 text-[9px] font-mono font-bold text-slate-500">S</span>
        <span className="absolute right-1.5 text-[9px] font-mono font-bold text-slate-500">E</span>
        <span className="absolute left-1.5 text-[9px] font-mono font-bold text-slate-500">W</span>

        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out"
          style={{ transform: `rotate(${headingDeg}deg)` }}
        >
          <div className="w-1.5 h-8 bg-red-600 rounded-t-full -translate-y-4 shadow-xs" />
          <div className="w-1.5 h-8 bg-slate-400 rounded-b-full translate-y-4 shadow-xs" />
          <div className="absolute w-2.5 h-2.5 rounded-full bg-slate-900 border border-white" />
        </div>
      </div>

      <div className="text-center">
        <span className="font-mono text-xs font-bold text-[var(--text)]">{headingDeg}°</span>
        <span className="ml-1 text-xs font-mono font-bold text-[var(--sea-600)] dark:text-[var(--sea-accent)]">{getCardinal(headingDeg)}</span>
      </div>
    </div>
  );
}

// ─── Tactical Drone Telemetry HUD Overlay ─────────────────────

function TelemetryHUD({
  drone,
}: {
  drone: ActiveDroneMission;
}) {
  return (
    <div
      className="p-3.5 rounded-xl border shadow-lg backdrop-blur-md flex flex-col gap-2.5 w-64 select-none bg-[var(--raised)] border-[var(--line)]"
    >
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span className="font-mono text-xs font-bold text-[var(--text)]">{drone.droneId}</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          ACTIVE
        </span>
      </div>

      <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">
        {drone.missionTitle}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div>
          <span className="text-[9px] uppercase block text-[var(--text-muted)]">Altitude</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{drone.altitudeM}m AGL</span>
        </div>
        <div>
          <span className="text-[9px] uppercase block text-[var(--text-muted)]">Speed</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{drone.groundSpeedKmh} km/h</span>
        </div>
        <div>
          <span className="text-[9px] uppercase block text-[var(--text-muted)]">Battery</span>
          <span className="font-bold text-emerald-600 flex items-center gap-1">
            <Battery className="w-3 h-3" /> {drone.batteryPct}%
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase block text-[var(--text-muted)]">Wind</span>
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Wind className="w-3 h-3" /> 12kt W
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
        <span>LAT: {drone.lat.toFixed(4)}° N</span>
        <span>LON: {drone.lon.toFixed(4)}° E</span>
      </div>
    </div>
  );
}

// ─── Save Geofence Modal ──────────────────────────────────────

interface SaveGeofenceModalProps {
  vertices: [number, number][];
  onClose: () => void;
  onSubmit: (name: string, type: ZoneType, sensitivity: string) => void;
}

function SaveGeofenceModal({ vertices, onClose, onSubmit }: SaveGeofenceModalProps) {
  const [name, setName] = useState(`Coastal Security Perimeter Zone - ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`);
  const [zoneType, setZoneType] = useState<ZoneType>('RESTRICTED');
  const [sensitivity, setSensitivity] = useState('VERY_HIGH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(name, zoneType, sensitivity);
      setIsSubmitting(false);
    }, 600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border shadow-2xl bg-[var(--raised)] border-[var(--line)] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface-muted)]">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-yellow-500" />
            <div>
              <h3 className="font-serif text-sm font-bold text-[var(--text)]">Submit Geofence to Central Command Center</h3>
              <p className="text-[11px] font-mono text-[var(--text-muted)]">Transmit polygon coordinates for Supervisor review and AI detection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[var(--text-muted)] mb-1">
              Geofence Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border font-medium bg-[var(--panel)] border-[var(--line)] text-[var(--text)] outline-none focus:border-yellow-500"
              placeholder="e.g. Vizhinjam Outer Anchorage High-Security Zone"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[var(--text-muted)] mb-1">
                Classification
              </label>
              <select
                value={zoneType}
                onChange={e => setZoneType(e.target.value as ZoneType)}
                className="w-full px-3 py-2 rounded-xl text-xs font-sans bg-[var(--panel)] border-[var(--line)] text-[var(--text)] outline-none"
              >
                <option value="RESTRICTED">Restricted (High Priority)</option>
                <option value="HARBOUR">Harbour / Naval Anchorage</option>
                <option value="MONITORED">Monitored Coastal Water</option>
                <option value="BEACH">Beach Perimeter</option>
                <option value="ESTUARY">Estuary Infiltration Watch</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[var(--text-muted)] mb-1">
                AI Detection Sensitivity
              </label>
              <select
                value={sensitivity}
                onChange={e => setSensitivity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-sans bg-[var(--panel)] border-[var(--line)] text-[var(--text)] outline-none"
              >
                <option value="VERY_HIGH">VERY HIGH (Immediate Triage)</option>
                <option value="HIGH">HIGH (Standard Patrol Alert)</option>
                <option value="MEDIUM">MEDIUM (Dwell & Trend Only)</option>
              </select>
            </div>
          </div>

          {/* Coordinates Summary */}
          <div className="p-3 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[var(--text)]">Polygon Boundary Coordinates</span>
              <span className="text-yellow-600 dark:text-yellow-400 font-bold">{vertices.length} Vertices Placed</span>
            </div>
            <div className="max-h-28 overflow-y-auto font-mono text-[11px] text-[var(--text-muted)] space-y-1">
              {vertices.map((v, i) => (
                <div key={i} className="flex justify-between items-center px-1">
                  <span>Vertex #{i + 1}:</span>
                  <span className="text-slate-800 dark:text-slate-200">Lat: {v[1].toFixed(5)}°N, Lon: {v[0].toFixed(5)}°E</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transmit Notice */}
          <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-500" />
            <span>
              Coordinates will be encrypted and transmitted to the <strong>Kerala Police Central Command Center</strong>. A Supervisor Review Ticket will be logged and automated edge detection rules will be armed.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono font-medium hover:bg-[var(--surface-hover)] text-[var(--text-muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-yellow-500 hover:bg-yellow-400 text-slate-950 flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Transmitting...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit to Central Command</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Map GIS Page ─────────────────────────────────────────────

export default function MapGIS() {
  const { user, devRole } = useAuthStore();
  const activeRole = user?.role ?? devRole ?? 'OPERATOR';
  const canEditGeofence = can(activeRole, 'EDIT_GEOFENCE');

  // Port selector state
  const [selectedPortId, setSelectedPortId] = useState<string>('ALL');

  // Drawing Polygon State
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawVertices, setDrawVertices] = useState<[number, number][]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Custom zones added during session
  const [customZones, setCustomZones] = useState<Zone[]>([]);

  // Confirmation Toast
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Active mission drones list filtered by port
  const activeDrones = selectedPortId === 'ALL'
    ? ACTIVE_MISSION_DRONES
    : ACTIVE_MISSION_DRONES.filter(d => d.portId === selectedPortId);

  const currentDrone = activeDrones[0] || ACTIVE_MISSION_DRONES[0];

  function handleMapClickCoord(coord: [number, number]) {
    if (!isDrawing) return;
    setDrawVertices(prev => [...prev, coord]);
  }

  function handleUndoVertex() {
    setDrawVertices(prev => prev.slice(0, -1));
  }

  function handleClearVertices() {
    setDrawVertices([]);
  }

  function handleCancelDrawing() {
    setIsDrawing(false);
    setDrawVertices([]);
  }

  function handleSaveGeofenceSubmit(name: string, type: ZoneType, _sensitivity: string) {
    if (drawVertices.length < 3) return;

    // Saved zones are explicitly styled in yellowish color
    const newZone: Zone = {
      id: `z-custom-${Date.now()}`,
      code: `Z-CUSTOM-${customZones.length + 1}`,
      name,
      type,
      profileId: 'zp-restricted-24x7',
      version: 1,
      color: '#EAB308',
      geometry: {
        type: 'Polygon',
        coordinates: [[...drawVertices, drawVertices[0]]],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCustomZones(prev => [...prev, newZone]);
    setShowSaveModal(false);
    setIsDrawing(false);
    setDrawVertices([]);

    // Show prominent confirmation toast
    setSuccessToast(`Geofence "${name}" with ${drawVertices.length} vertices successfully transmitted to Central Command Center (Review Ticket: SRQ-2026-904).`);
    setTimeout(() => setSuccessToast(null), 6000);
  }

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* ─── Full-width Map Canvas ─── */}
      <div className="absolute inset-0 z-0">
        <CoastalMap
          height="100%"
          className="w-full h-full"
          showAlerts={false}
          showDrones={true}
          showZones={true}
          selectedPortId={selectedPortId}
          isDrawingPolygon={isDrawing}
          drawingVertices={drawVertices}
          onMapClickCoord={handleMapClickCoord}
          customZones={customZones}
        />
      </div>

      {/* ─── Top Tactical Control Bar ─── */}
      <div
        className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex items-start justify-between gap-4"
      >
        {/* Left Side: Sea Port Dropdown & Mission Status */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2.5 p-2 rounded-2xl border shadow-xl backdrop-blur-md bg-[var(--raised)] border-[var(--line)]">
          {/* Sea Port Selector */}
          <div className="flex items-center gap-2 px-2">
            <Anchor className="w-4 h-4 text-[var(--sea-600)] dark:text-[var(--sea-accent)]" />
            <span className="text-[11px] font-mono font-bold uppercase text-[var(--text-muted)]">Sea Port:</span>
            <select
              value={selectedPortId}
              onChange={e => setSelectedPortId(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold border outline-none bg-[var(--panel)] border-[var(--line)] text-[var(--text)] cursor-pointer hover:border-[var(--sea-500)] transition-colors"
            >
              {KERALA_SEAPORTS.map(port => (
                <option key={port.id} value={port.id}>
                  {port.name}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-[var(--line)]" />

          {/* Active Drones Count Badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{activeDrones.length} {activeDrones.length === 1 ? 'Drone Active' : 'Drones Active'}</span>
          </div>

          <div className="h-4 w-px bg-[var(--line)]" />

          {/* Draw Geofence Button */}
          {canEditGeofence && !isDrawing && (
            <button
              onClick={() => {
                setIsDrawing(true);
                setDrawVertices([]);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-md cursor-pointer"
              title="Draw a custom geofence polygon by placing vertices on the map"
            >
              <Pentagon className="w-3.5 h-3.5 text-slate-950" />
              <span>Draw Geofence</span>
            </button>
          )}
        </div>

        {/* Right Side: Digital Compass & Telemetry HUD */}
        <div className="pointer-events-auto flex flex-col items-end gap-3">
          <DigitalCompass headingDeg={currentDrone.headingDeg} />
          <TelemetryHUD drone={currentDrone} />
        </div>
      </div>

      {/* ─── Active Polygon Drawing Controls Toolbar ─── */}
      {isDrawing && (
        <div
          className="absolute top-20 left-4 z-20 pointer-events-auto p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md bg-[var(--raised)] border-[var(--line)] max-w-md animate-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Pentagon className="w-4 h-4 text-yellow-500 animate-pulse" />
              <span className="font-serif text-xs font-bold text-[var(--text)]">Geofence Polygon Drawing</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30">
              {drawVertices.length} {drawVertices.length === 1 ? 'point marked' : 'points marked'}
            </span>
          </div>

          <p className="text-[11px] font-sans text-[var(--text-muted)] mb-3 leading-relaxed">
            {drawVertices.length === 0 && 'Click anywhere on the map to place vertex 1.'}
            {drawVertices.length === 1 && 'Vertex 1 marked. Click map to connect vertex 2.'}
            {drawVertices.length === 2 && '2 vertices connected! Click a 3rd point to close and create geofence zone.'}
            {drawVertices.length >= 3 && `Yellow geofence zone active with ${drawVertices.length} connected points! Click map to add more points or click Save Geofence.`}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleUndoVertex}
              disabled={drawVertices.length === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono border hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-40 cursor-pointer"
              style={{ borderColor: 'var(--line)' }}
              title="Undo last vertex"
            >
              <Undo2 className="w-3.5 h-3.5" /> Undo
            </button>

            <button
              onClick={handleClearVertices}
              disabled={drawVertices.length === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono border hover:bg-[var(--surface-hover)] text-red-500 transition-colors disabled:opacity-40 cursor-pointer"
              style={{ borderColor: 'var(--line)' }}
              title="Clear all vertices"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>

            <button
              onClick={() => setShowSaveModal(true)}
              disabled={drawVertices.length < 3}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all ml-auto cursor-pointer',
                drawVertices.length >= 3
                  ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold shadow-md'
                  : 'bg-[var(--surface-muted)] text-[var(--text-muted)] opacity-50 cursor-not-allowed'
              )}
              title="Save Geofence and submit coordinates to Central Command Center"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Save Geofence
            </button>

            <button
              onClick={handleCancelDrawing}
              className="p-1.5 rounded-lg text-xs hover:bg-[var(--surface-hover)] text-[var(--text-muted)] transition-colors cursor-pointer"
              title="Cancel drawing"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Success Toast Notification ─── */}
      {successToast && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-lg p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md bg-emerald-950/90 text-emerald-100 border-emerald-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-xs font-mono leading-relaxed">{successToast}</div>
          <button
            onClick={() => setSuccessToast(null)}
            className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Save Geofence Modal ─── */}
      {showSaveModal && (
        <SaveGeofenceModal
          vertices={drawVertices}
          onClose={() => setShowSaveModal(false)}
          onSubmit={handleSaveGeofenceSubmit}
        />
      )}
    </div>
  );
}

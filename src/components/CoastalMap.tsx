// ============================================================
// SmartQEye Coastal — MapLibre Map Component
// Powered by OpenStreetMap (OSM) focused on Kerala State Coastline
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MLMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import type { Alert, Zone } from '@/types';
import { useMapStore } from '@/lib/store';
import { ZONES, ALERTS, KERALA_COASTAL_SECTORS } from '@/lib/mockData';
import { ACTIVE_MISSION_DRONES, KERALA_SEAPORTS, type ActiveDroneMission } from '@/lib/coastalPortsData';

// Configure MapLibre Web Worker to use bundled static asset URL
if (typeof window !== 'undefined' && (maplibregl as any).setWorkerUrl) {
  (maplibregl as any).setWorkerUrl(maplibreWorkerUrl);
}

// OpenStreetMap (OSM) Tile Provider URL
const DEFAULT_OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_URL = import.meta.env.VITE_MAP_TILE_URL || DEFAULT_OSM_TILE_URL;

// High-reliability OpenStreetMap raster style (No external font glyph dependencies)
function buildOSMStyle(): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: [TILE_URL],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: 'osm-tiles-layer',
        type: 'raster',
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };
}

// Kerala State Geographical Focus (Center: Lat 10.25°N, Lon 76.35°E, Zoom 7.8)
export const KERALA_VIEW = {
  center: [76.35, 10.25] as [number, number],
  zoom: 7.8,
};

// ─── Hover Popup Builder ──────────────────────────────────────

function buildHoverPopupHTML(data: {
  droneId: string;
  missionId: string;
  locationName: string;
  operatorName?: string;
  timestamp?: string | Date;
  badgeType?: 'DRONE' | 'ALERT' | 'ZONE';
  extraTitle?: string;
}): string {
  const dateObj = data.timestamp ? (typeof data.timestamp === 'string' ? new Date(data.timestamp) : data.timestamp) : new Date();
  const formattedDate = dateObj.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }) + ' IST';

  const isAlert = data.badgeType === 'ALERT';
  const isZone = data.badgeType === 'ZONE';
  const typeLabel = isAlert ? 'COASTAL ALERT' : isZone ? 'COASTAL GEOFENCE' : 'ACTIVE MISSION DRONE';
  const typeBg = isAlert ? '#C8352E' : isZone ? '#E06A3B' : '#0284c7';

  return `
    <div style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 12px 14px;
      min-width: 270px;
      max-width: 340px;
      background: #091724;
      color: #e2e8f0;
      border: 1px solid rgba(56, 189, 248, 0.45);
      border-radius: 10px;
      box-shadow: 0 14px 30px -4px rgba(0, 0, 0, 0.85);
      line-height: 1.45;
      pointer-events: none;
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 6px;">
        <span style="background: ${typeBg}; color: #ffffff; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.6px; font-family: monospace;">
          ${typeLabel}
        </span>
        <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 10px; color: #4ade80; font-family: monospace; font-weight: 700;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #4ade80; display: inline-block; box-shadow: 0 0 6px #4ade80;"></span> LIVE
        </span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
          <span style="color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">DRONE ID:</span>
          <span style="color: #38bdf8; font-weight: 800; font-family: monospace; font-size: 12px;">${data.droneId}</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
          <span style="color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">MISSION ID:</span>
          <span style="color: #fbbf24; font-weight: 700; font-family: monospace; font-size: 11px;">${data.missionId}</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 2px; margin-top: 1px;">
          <span style="color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">LOCATION:</span>
          <span style="color: #f8fafc; font-weight: 600; font-size: 11px; line-height: 1.35;">${data.locationName}</span>
        </div>

        ${data.operatorName ? `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 1px;">
          <span style="color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">OPERATOR NAME:</span>
          <span style="color: #a7f3d0; font-weight: 700; font-size: 11px;">${data.operatorName}</span>
        </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 4px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.15); font-size: 10px;">
          <span style="color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px;">TIME DATE:</span>
          <span style="color: #e2e8f0; font-family: monospace; font-weight: 600;">${formattedDate}</span>
        </div>
      </div>
    </div>
  `;
}

export interface CoastalMapProps {
  height?: string;
  className?: string;
  interactive?: boolean;
  showZones?: boolean;
  showDrones?: boolean;
  showContacts?: boolean;
  showAlerts?: boolean;
  initialCenter?: [number, number];
  initialZoom?: number;
  onAlertClick?: (alertId: string) => void;
  onContactClick?: (contactId: string) => void;
  onZoneClick?: (zoneId: string) => void;
  /** Fired when an active drone marker is clicked (feedId, e.g. 'f-01'). */
  onDroneClick?: (feedId: string) => void;
  followFeedId?: string;
  /** When this changes, the map flies to the given centre/zoom. */
  focus?: { center: [number, number]; zoom: number } | null;
  /** Show ONLY this drone (used by the Live Monitor focus mini-map). */
  singleDrone?: { feedId: string; uavCode: string; missionCode: string; locationName: string; lat: number; lon: number; headingDeg?: number; operatorName?: string };
  /** Highlight and pin an exact alert incident */
  highlightAlert?: Alert | null;
  /** Selected port filter ID (e.g. 'ALL', 'VIZHINJAM', 'KOCHI', etc.) */
  selectedPortId?: string;
  /** Whether polygon drawing mode is active */
  isDrawingPolygon?: boolean;
  /** Array of [lon, lat] coordinates placed by user during polygon draw */
  drawingVertices?: [number, number][];
  /** Callback when user clicks map while in polygon draw mode */
  onMapClickCoord?: (coord: [number, number]) => void;
  /** Custom user-created zones to render permanently on map */
  customZones?: Zone[];
}

export function CoastalMap({
  height = '100%',
  className = '',
  interactive = true,
  showZones = true,
  showDrones = true,
  showAlerts = true,
  initialCenter = KERALA_VIEW.center,
  initialZoom = KERALA_VIEW.zoom,
  onAlertClick,
  onZoneClick,
  onDroneClick,
  focus,
  singleDrone,
  highlightAlert,
  selectedPortId = 'ALL',
  isDrawingPolygon = false,
  drawingVertices = [],
  onMapClickCoord,
  customZones = [],
}: CoastalMapProps) {
  const mapRef = useRef<MLMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep latest callbacks in refs
  const onAlertClickRef = useRef(onAlertClick);
  const onDroneClickRef = useRef(onDroneClick);
  const onZoneClickRef = useRef(onZoneClick);
  const onMapClickCoordRef = useRef(onMapClickCoord);
  const isDrawingPolygonRef = useRef(isDrawingPolygon);

  onAlertClickRef.current = onAlertClick;
  onDroneClickRef.current = onDroneClick;
  onZoneClickRef.current = onZoneClick;
  onMapClickCoordRef.current = onMapClickCoord;
  isDrawingPolygonRef.current = isDrawingPolygon;

  const { layers, dronePositions } = useMapStore();
  const alertMarkersRef = useRef<maplibregl.Marker[]>([]);
  const droneMarkersRef = useRef<Record<string, maplibregl.Marker>>({});
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);

  // SVG Screen Coordinates for in-progress geofence drawing
  const [screenVertices, setScreenVertices] = useState<{ x: number; y: number }[]>([]);
  // SVG Screen Coordinates for saved custom zones
  const [customZonesScreen, setCustomZonesScreen] = useState<Array<{ id: string; name: string; points: string }>>([]);

  // Drone real-time state for hover popups
  const droneDataRef = useRef<Record<string, {
    uavCode: string;
    missionCode: string;
    locationName: string;
    operatorName: string;
    lat: number;
    lon: number;
  }>>({});

  // Initialize droneDataRef with all ACTIVE_MISSION_DRONES
  useEffect(() => {
    ACTIVE_MISSION_DRONES.forEach(d => {
      droneDataRef.current[d.feedId] = {
        uavCode: d.droneId,
        missionCode: d.missionId,
        locationName: d.locationName,
        operatorName: d.operatorName,
        lat: d.lat,
        lon: d.lon,
      };
    });
  }, []);

  // Update SVG projected points from geographic coordinates
  const updateProjectedCoords = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Project drawing vertices to screen pixels
    if (drawingVertices.length > 0) {
      const projected = drawingVertices.map(coord => {
        const pt = map.project([coord[0], coord[1]]);
        return { x: pt.x, y: pt.y };
      });
      setScreenVertices(projected);
    } else {
      setScreenVertices([]);
    }

    // Project custom zones to screen pixels
    if (customZones.length > 0) {
      const projectedZones = customZones.map(zone => {
        if (zone.geometry && zone.geometry.type === 'Polygon') {
          const ring = (zone.geometry as any).coordinates[0] as [number, number][];
          if (!ring || ring.length < 3) return null;
          const pts = ring.map(c => {
            const pt = map.project([c[0], c[1]]);
            return `${pt.x},${pt.y}`;
          }).join(' ');
          return { id: zone.id, name: zone.name, points: pts };
        }
        return null;
      }).filter(Boolean) as Array<{ id: string; name: string; points: string }>;
      setCustomZonesScreen(projectedZones);
    } else {
      setCustomZonesScreen([]);
    }
  }, [drawingVertices, customZones]);

  // Map initialization
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: MLMap;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: buildOSMStyle(),
        center: initialCenter,
        zoom: initialZoom,
        interactive,
        attributionControl: false,
      });
    } catch (err) {
      console.error('Failed to initialize MapLibre GL map:', err);
      return;
    }

    mapRef.current = map;

    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    }

    map.on('error', (e) => {
      if (e?.error?.message?.includes('aborted')) return;
      console.warn('MapLibre notice:', e?.error?.message || e);
    });

    // Real-time map projection listener for SVG drawing overlay
    map.on('move', updateProjectedCoords);
    map.on('zoom', updateProjectedCoords);
    map.on('resize', updateProjectedCoords);

    // Map click handler for polygon drawing
    map.on('click', (e) => {
      if (isDrawingPolygonRef.current) {
        onMapClickCoordRef.current?.([e.lngLat.lng, e.lngLat.lat]);
      }
    });

    map.on('load', () => {
      map.resize();

      if (showZones) addZones(map, [...ZONES, ...customZones]);
      if (showAlerts) addAlertPins(map);
      if (showDrones) renderActiveMissionDrones(map, selectedPortId);
      setupInteractions(map);
      updateProjectedCoords();

      if (highlightAlert) {
        map.jumpTo({ center: [highlightAlert.event.location.lon, highlightAlert.event.location.lat], zoom: 14 });
      } else if (focus) {
        map.jumpTo({ center: focus.center, zoom: focus.zoom });
      }
      setTimeout(() => {
        map.resize();
        updateProjectedCoords();
      }, 150);
      setTimeout(() => {
        map.resize();
        updateProjectedCoords();
      }, 500);
    });

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
        updateProjectedCoords();
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      hoverPopupRef.current?.remove();
      alertMarkersRef.current.forEach(m => m.remove());
      Object.values(droneMarkersRef.current).forEach(m => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update cursor based on drawing mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = isDrawingPolygon ? 'crosshair' : '';
  }, [isDrawingPolygon]);

  // Re-project SVG whenever drawing vertices or custom zones change
  useEffect(() => {
    updateProjectedCoords();
  }, [updateProjectedCoords]);

  // Fly to port focus when focus prop or selectedPortId changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (focus) {
      map.flyTo({ center: focus.center, zoom: focus.zoom, duration: 1200, essential: true });
    } else if (selectedPortId) {
      const port = KERALA_SEAPORTS.find(p => p.id === selectedPortId);
      if (port) {
        map.flyTo({ center: port.center, zoom: port.zoom, duration: 1200, essential: true });
      }
    }
  }, [focus?.center[0], focus?.center[1], focus?.zoom, selectedPortId]);

  // Re-filter active mission drones when selectedPortId changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !showDrones) return;
    renderActiveMissionDrones(map, selectedPortId);
  }, [selectedPortId, showDrones]);

  // Fly to highlighted alert on change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !highlightAlert) return;
    const loc = highlightAlert.event.location;
    map.flyTo({ center: [loc.lon, loc.lat], zoom: 14, duration: 1000, essential: true });
    if (showAlerts) addAlertPins(map);
  }, [highlightAlert?.id, highlightAlert?.event.location.lat, highlightAlert?.event.location.lon]);

  // Update drone positions in real-time
  useEffect(() => {
    if (!mapRef.current || !showDrones || !layers.drones || singleDrone) return;
    Object.entries(dronePositions).forEach(([feedId, pos]) => {
      if (droneMarkersRef.current[feedId]) {
        updateDroneMarker(feedId, pos.lat, pos.lon, pos.headingDeg);
      }
    });
  }, [dronePositions, showDrones, layers.drones]);

  // Update custom zones when added
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !showZones) return;
    addZones(map, [...ZONES, ...customZones]);
  }, [customZones, showZones]);

  function renderActiveMissionDrones(map: MLMap, portId: string = 'ALL') {
    Object.values(droneMarkersRef.current).forEach(m => m.remove());
    droneMarkersRef.current = {};

    if (singleDrone) {
      droneDataRef.current[singleDrone.feedId] = {
        uavCode: singleDrone.uavCode,
        missionCode: singleDrone.missionCode,
        locationName: singleDrone.locationName,
        operatorName: singleDrone.operatorName || 'Duty Patrol Officer',
        lat: singleDrone.lat,
        lon: singleDrone.lon,
      };
      updateDroneMarker(singleDrone.feedId, singleDrone.lat, singleDrone.lon, singleDrone.headingDeg ?? 0);
      return;
    }

    const activeList = portId === 'ALL'
      ? ACTIVE_MISSION_DRONES
      : ACTIVE_MISSION_DRONES.filter(d => d.portId === portId);

    activeList.forEach(drone => {
      droneDataRef.current[drone.feedId] = {
        uavCode: drone.droneId,
        missionCode: drone.missionId,
        locationName: drone.locationName,
        operatorName: drone.operatorName,
        lat: drone.lat,
        lon: drone.lon,
      };
      updateDroneMarker(drone.feedId, drone.lat, drone.lon, drone.headingDeg);
    });
  }

  function updateDroneMarker(feedId: string, lat: number, lon: number, headingDeg: number) {
    const map = mapRef.current;
    if (!map) return;

    if (droneDataRef.current[feedId]) {
      droneDataRef.current[feedId].lat = lat;
      droneDataRef.current[feedId].lon = lon;
    }

    if (droneMarkersRef.current[feedId]) {
      droneMarkersRef.current[feedId].setLngLat([lon, lat]);
      // The SVG direction arrow is inside: el > div(#2) > svg > g[transform]
      const svgEl = droneMarkersRef.current[feedId].getElement().querySelector('svg g[transform]') as SVGGElement | null;
      if (svgEl) svgEl.setAttribute('transform', `translate(27, 27) rotate(${headingDeg})`);
    } else {
      const el = createDroneElement(feedId, headingDeg, [lon, lat]);
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lon, lat])
        .addTo(map);
      droneMarkersRef.current[feedId] = marker;
    }
  }

  function createDroneElement(feedId: string, headingDeg: number, _coords: [number, number]): HTMLElement {
    const el = document.createElement('div');
    el.style.cursor = 'pointer';
    el.title = 'Active Mission Drone';
    el.addEventListener('click', (e) => {
      if (isDrawingPolygonRef.current) return;
      e.stopPropagation();
      hoverPopupRef.current?.remove();
      onDroneClickRef.current?.(feedId);
    });

    const info = droneDataRef.current[feedId] || { uavCode: 'UAV-01', missionCode: '', locationName: 'Kerala Coast', operatorName: '', lat: 0, lon: 0 };
    const droneId = info.uavCode || 'UAV-01';
    const portLabel = (info.locationName || 'Patrol Sector').split(',')[0];

    el.style.cssText = 'cursor: pointer; position: relative; display: flex; flex-direction: column; align-items: center;';

    el.innerHTML = `
      <style>
        @keyframes drone-pulse-ring {
          0%   { transform: scale(1);   opacity: 0.7; }
          50%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1);   opacity: 0; }
        }
        @keyframes drone-blink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
      </style>
      <!-- Outer pulsing ring -->
      <div style="
        position: absolute; top: 50%; left: 50%;
        width: 54px; height: 54px;
        margin-left: -27px; margin-top: -43px;
        border-radius: 50%;
        border: 3px solid #38bdf8;
        animation: drone-pulse-ring 2s ease-out infinite;
        pointer-events: none;
      "></div>

      <!-- Drone icon circle -->
      <div style="position: relative; width: 54px; height: 54px; flex-shrink: 0;">
        <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="27" cy="27" r="25" fill="#0c4a6e" stroke="#38bdf8" stroke-width="3" style="filter: drop-shadow(0 4px 12px rgba(2,132,199,0.7))"/>
          <g transform="translate(27, 27) rotate(${headingDeg})">
            <path d="M0 -12 L-5 4 L0 1 L5 4 Z" fill="#ffffff" opacity="0.95"/>
          </g>
          <circle cx="27" cy="27" r="4" fill="#facc15" stroke="#000" stroke-width="1"/>
        </svg>
        <!-- Live blinking dot -->
        <div style="
          position: absolute; top: 2px; right: 2px;
          width: 10px; height: 10px; border-radius: 50%;
          background: #4ade80;
          border: 2px solid #0c4a6e;
          animation: drone-blink 1.5s ease-in-out infinite;
          box-shadow: 0 0 6px #4ade80;
        "></div>
      </div>

      <!-- Label below marker -->
      <div style="
        margin-top: 2px;
        background: rgba(12, 74, 110, 0.92);
        border: 1.5px solid #38bdf8;
        border-radius: 6px;
        padding: 3px 8px;
        text-align: center;
        white-space: nowrap;
        box-shadow: 0 4px 14px rgba(0,0,0,0.7);
        pointer-events: none;
      ">
        <div style="font-family: monospace; font-size: 11px; font-weight: 900; color: #38bdf8; letter-spacing: 0.8px;">${droneId}</div>
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 9px; color: #94a3b8; font-weight: 600; margin-top: 1px; max-width: 140px; overflow: hidden; text-overflow: ellipsis;">${portLabel}</div>
      </div>
    `;

    // Mouse Hover Popup with DRONE ID, MISSION ID, LOCATION, OPERATOR NAME, TIME DATE
    el.addEventListener('mouseenter', () => {
      if (isDrawingPolygonRef.current) return;
      const map = mapRef.current;
      if (!map) return;
      hoverPopupRef.current?.remove();

      const data = droneDataRef.current[feedId] ?? {
        uavCode: 'UAV-01',
        missionCode: 'M-2026-0415',
        locationName: 'Kerala Coastal Patrol Sector',
        operatorName: 'Inspector Duty Officer',
        lat: 10.0,
        lon: 76.2,
      };

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 50,
        className: 'coastal-custom-hover-popup',
      })
        .setLngLat([data.lon, data.lat])
        .setHTML(buildHoverPopupHTML({
          droneId: data.uavCode,
          missionId: data.missionCode,
          locationName: data.locationName,
          operatorName: data.operatorName,
          timestamp: new Date(),
          badgeType: 'DRONE',
        }))
        .addTo(map);

      hoverPopupRef.current = popup;
    });

    el.addEventListener('mouseleave', () => {
      hoverPopupRef.current?.remove();
      hoverPopupRef.current = null;
    });

    return el;
  }

  function addZones(map: MLMap, zoneList: Zone[]) {
    zoneList.forEach(zone => {
      const sourceId = `zone-${zone.id}`;
      const fillId = `zone-fill-${zone.id}`;
      const borderId = `zone-border-${zone.id}`;

      const isCustom = zone.id.startsWith('z-custom');
      const fillColor = isCustom ? '#FACC15' : (zone.color || '#C8352E');
      const borderColor = isCustom ? '#EAB308' : (zone.color || '#C8352E');

      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData({
          type: 'Feature',
          geometry: zone.geometry,
          properties: { code: zone.code, name: zone.name, type: zone.type },
        });
        return;
      }

      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: zone.geometry,
          properties: { code: zone.code, name: zone.name, type: zone.type },
        },
      });

      map.addLayer({
        id: fillId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': fillColor,
          'fill-opacity': isCustom ? 0.38 : 0.25,
        },
      });

      map.addLayer({
        id: borderId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': borderColor,
          'line-width': isCustom ? 3.5 : 2.5,
          'line-dasharray': zone.type === 'RESTRICTED' || isCustom ? [4, 2] : [1],
        },
      });
    });
  }

  function addAlertPins(map: MLMap) {
    alertMarkersRef.current.forEach(m => m.remove());
    alertMarkersRef.current = [];

    const alertList: Alert[] = [...ALERTS.slice(0, 15).filter(a => a.status !== 'RESOLVED')];
    if (highlightAlert && !alertList.some(a => a.id === highlightAlert.id)) {
      alertList.push(highlightAlert);
    }

    alertList.forEach(alert => {
      const loc = alert.event.location;
      const isHighlighted = highlightAlert?.id === alert.id;
      const el = createAlertElement(alert, isHighlighted);
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([loc.lon, loc.lat])
        .addTo(map);

      alertMarkersRef.current.push(marker);
      el.addEventListener('click', (e) => {
        if (isDrawingPolygonRef.current) return;
        e.stopPropagation();
        hoverPopupRef.current?.remove();
        onAlertClickRef.current?.(alert.id);
      });
    });
  }

  function createAlertElement(alert: Alert, isHighlighted: boolean = false): HTMLElement {
    const colours: Record<string, string> = {
      CRITICAL: '#C8352E', HIGH: '#E06A3B', MEDIUM: '#E0A526', LOW: '#3FAE9A', INFO: '#2B7FA6',
    };
    const colour = colours[alert.severity] ?? '#2B7FA6';

    if (isHighlighted) {
      const wrap = document.createElement('div');
      wrap.style.cssText = `
        position: relative; width: 44px; height: 44px;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; transform: translate(-50%, -50%);
      `;
      wrap.innerHTML = `
        <span style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: ${colour}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <span style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: ${colour}; opacity: 0.85; box-shadow: 0 0 14px ${colour};"></span>
        <span style="position: relative; width: 14px; height: 14px; border-radius: 50%; background: #ffffff; border: 3px solid ${colour};"></span>
      `;
      wrap.title = `INCIDENT LOCATION: ${alert.alertCode}`;
      return wrap;
    }

    const el = document.createElement('div');
    el.style.cssText = `
      width: 0; height: 0;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-bottom: 20px solid ${colour};
      cursor: pointer; position: relative;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.6));
    `;
    if (alert.severity === 'CRITICAL') {
      el.style.animation = 'pulse-live 1.5s ease-in-out infinite';
    }

    const inner = document.createElement('div');
    inner.style.cssText = `
      position: absolute; top: 7px; left: -5px;
      font-size: 8px; color: white; font-weight: bold;
      width: 10px; text-align: center;
    `;
    inner.textContent = '!';
    el.appendChild(inner);

    el.addEventListener('mouseenter', () => {
      if (isDrawingPolygonRef.current) return;
      const map = mapRef.current;
      if (!map) return;
      hoverPopupRef.current?.remove();

      const loc = alert.event.location;
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 16,
        className: 'coastal-custom-hover-popup',
      })
        .setLngLat([loc.lon, loc.lat])
        .setHTML(buildHoverPopupHTML({
          droneId: alert.event.uav?.code || 'UAV-01',
          missionId: alert.event.mission?.code || 'M-2026-0415',
          locationName: loc.name || alert.event.zone?.name || 'Kerala Coastline Sector',
          operatorName: 'Inspector Coastal Surveillance Unit',
          timestamp: alert.event.occurredAt || alert.createdAt,
          badgeType: 'ALERT',
          extraTitle: alert.alertCode,
        }))
        .addTo(map);

      hoverPopupRef.current = popup;
    });

    el.addEventListener('mouseleave', () => {
      hoverPopupRef.current?.remove();
      hoverPopupRef.current = null;
    });

    return el;
  }

  function setupInteractions(map: MLMap) {
    ZONES.forEach(zone => {
      const matchingSector = KERALA_COASTAL_SECTORS.find(s =>
        zone.name.toLowerCase().includes(s.name.split(' ')[0].toLowerCase()) ||
        s.name.toLowerCase().includes(zone.name.split(' ')[0].toLowerCase())
      ) || KERALA_COASTAL_SECTORS[0];

      map.on('click', `zone-fill-${zone.id}`, (e) => {
        if (isDrawingPolygonRef.current) {
          onMapClickCoordRef.current?.([e.lngLat.lng, e.lngLat.lat]);
          return;
        }
        onZoneClickRef.current?.(zone.id);
      });

      map.on('mousemove', `zone-fill-${zone.id}`, (e) => {
        if (isDrawingPolygonRef.current) return;
        map.getCanvas().style.cursor = 'pointer';
        hoverPopupRef.current?.remove();

        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 12,
          className: 'coastal-custom-hover-popup',
        })
          .setLngLat(e.lngLat)
          .setHTML(buildHoverPopupHTML({
            droneId: matchingSector.uavCode,
            missionId: matchingSector.missionCode,
            locationName: zone.name,
            operatorName: 'Inspector Coastal Security Wing',
            timestamp: new Date(),
            badgeType: 'ZONE',
            extraTitle: zone.code,
          }))
          .addTo(map);

        hoverPopupRef.current = popup;
      });

      map.on('mouseleave', `zone-fill-${zone.id}`, () => {
        if (isDrawingPolygonRef.current) return;
        map.getCanvas().style.cursor = '';
        hoverPopupRef.current?.remove();
        hoverPopupRef.current = null;
      });
    });
  }

  return (
    <div className={`relative ${className}`} style={{ height, width: '100%' }}>
      <style>{`
        .coastal-custom-hover-popup .maplibregl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
        }
        .coastal-custom-hover-popup .maplibregl-popup-tip {
          border-top-color: #091724 !important;
          border-bottom-color: #091724 !important;
        }
      `}</style>

      {/* MapLibre WebGL Canvas Container */}
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />

      {/* ─── Dedicated SVG Tactical Geofence Layer ─── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id="yellow-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Saved custom geofence zones in yellowish color */}
        {customZonesScreen.map(zone => (
          <g key={zone.id}>
            <polygon
              points={zone.points}
              fill="rgba(250, 204, 21, 0.35)"
              stroke="#EAB308"
              strokeWidth="3.5"
              strokeDasharray="6,4"
              strokeLinejoin="round"
              filter="url(#yellow-glow)"
            />
          </g>
        ))}

        {/* 2. In-progress closed geofence zone with yellowish fill and dotted lines */}
        {isDrawingPolygon && screenVertices.length >= 3 && (
          <polygon
            points={screenVertices.map(p => `${p.x},${p.y}`).join(' ')}
            fill="rgba(250, 204, 21, 0.38)"
            stroke="#EAB308"
            strokeWidth="4"
            strokeDasharray="6,4"
            strokeLinejoin="round"
            filter="url(#yellow-glow)"
          />
        )}

        {/* 3. In-progress dotted connecting line between 2 marked points */}
        {isDrawingPolygon && screenVertices.length === 2 && (
          <line
            x1={screenVertices[0].x}
            y1={screenVertices[0].y}
            x2={screenVertices[1].x}
            y2={screenVertices[1].y}
            stroke="#FACC15"
            strokeWidth="4"
            strokeDasharray="6,4"
            strokeLinecap="round"
            filter="url(#yellow-glow)"
          />
        )}

        {/* 4. Visible colored dots at every marked point on the map */}
        {isDrawingPolygon && screenVertices.map((p, idx) => (
          <g key={idx} transform={`translate(${p.x}, ${p.y})`}>
            {/* Outer animated halo ring */}
            <circle r="12" fill="none" stroke="#FACC15" strokeWidth="2.5" opacity="0.8">
              <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.2;0.9" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Dark background backing for contrast */}
            <circle r="9" fill="#000000" opacity="0.6" />

            {/* Marked colored dot */}
            <circle
              r="7.5"
              fill="#FACC15"
              stroke="#000000"
              strokeWidth="2"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
            />

            {/* Sequence number on dot */}
            <text
              y="3.5"
              textAnchor="middle"
              fontSize="9"
              fontWeight="900"
              fill="#000000"
              fontFamily="monospace"
            >
              {idx + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

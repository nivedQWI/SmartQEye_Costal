// ============================================================
// SmartQEye Coastal — MapLibre Map Component
// Powered by OpenStreetMap (OSM) focused on Kerala State Coastline
// ============================================================

import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MLMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Alert } from '@/types';
import { useMapStore } from '@/lib/store';
import { ZONES, ALERTS, INITIAL_TELEMETRY, KERALA_COASTAL_SECTORS } from '@/lib/mockData';

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
// Encompasses the complete Kerala coastline from Kasaragod to Thiruvananthapuram
export const KERALA_VIEW = {
  center: [76.35, 10.25] as [number, number],
  zoom: 7.8,
};

// ─── Hover Popup Builder ──────────────────────────────────────

function buildHoverPopupHTML(data: {
  droneId: string;
  missionId: string;
  locationName: string;
  timestamp: string | Date;
  badgeType: 'DRONE' | 'ALERT' | 'ZONE';
  extraTitle?: string;
}): string {
  const dateObj = typeof data.timestamp === 'string' ? new Date(data.timestamp) : data.timestamp;
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

  const typeLabel = data.badgeType === 'DRONE' ? 'UAV PATROL' : data.badgeType === 'ALERT' ? 'COASTAL ALERT' : 'COASTAL ZONE';
  const typeBg = data.badgeType === 'ALERT' ? '#C8352E' : data.badgeType === 'ZONE' ? '#E06A3B' : '#2B7FA6';

  return `
    <div style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 10px 12px;
      min-width: 250px;
      max-width: 320px;
      background: #0d1e2d;
      color: #e2e8f0;
      border: 1px solid rgba(43, 127, 166, 0.45);
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.7);
      line-height: 1.4;
      pointer-events: none;
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;">
        <span style="background: ${typeBg}; color: #fff; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.5px; font-family: monospace;">
          ${typeLabel}
        </span>
        ${data.extraTitle ? `<span style="font-size: 11px; font-weight: 600; color: #94a3b8; font-family: monospace;">${data.extraTitle}</span>` : ''}
      </div>

      <div style="display: flex; flex-direction: column; gap: 5px; font-size: 11px;">
        <div style="display: flex; justify-content: space-between; gap: 8px;">
          <span style="color: #94a3b8; font-weight: 500;">Drone ID:</span>
          <span style="color: #38bdf8; font-weight: 700; font-family: monospace;">${data.droneId}</span>
        </div>

        <div style="display: flex; justify-content: space-between; gap: 8px;">
          <span style="color: #94a3b8; font-weight: 500;">Mission ID:</span>
          <span style="color: #fbbf24; font-weight: 600; font-family: monospace;">${data.missionId}</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 2px; margin-top: 2px;">
          <span style="color: #94a3b8; font-weight: 500;">Location:</span>
          <span style="color: #f1f5f9; font-weight: 600; font-size: 11px; line-height: 1.3;">"${data.locationName}"</span>
        </div>

        <div style="display: flex; justify-content: space-between; gap: 8px; margin-top: 3px; padding-top: 5px; border-top: 1px dashed rgba(255,255,255,0.12); font-size: 10px;">
          <span style="color: #64748b;">Time & Date:</span>
          <span style="color: #cbd5e1; font-family: monospace;">${formattedDate}</span>
        </div>
      </div>
    </div>
  `;
}

interface CoastalMapProps {
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
  followFeedId?: string;
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
}: CoastalMapProps) {
  const mapRef = useRef<MLMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { layers, dronePositions } = useMapStore();
  const alertMarkersRef = useRef<maplibregl.Marker[]>([]);
  const droneMarkersRef = useRef<Record<string, maplibregl.Marker>>({});
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);

  // Drone real-time state for hover popups
  const droneDataRef = useRef<Record<string, {
    uavCode: string;
    missionCode: string;
    locationName: string;
    lat: number;
    lon: number;
  }>>({
    'f-01': { uavCode: 'UAV-01', missionCode: 'M-2026-0416', locationName: 'Kochi Port & Naval Base Sector, Ernakulam', lat: 9.965, lon: 76.230 },
    'f-03': { uavCode: 'UAV-03', missionCode: 'M-2026-0415', locationName: 'Vizhinjam International Seaport, Thiruvananthapuram', lat: 8.382, lon: 76.980 },
    'f-05': { uavCode: 'UAV-05', missionCode: 'M-2026-0417', locationName: 'Alappuzha Beach & Pier Sector, Alappuzha', lat: 9.492, lon: 76.320 },
    'f-07': { uavCode: 'UAV-04', missionCode: 'M-2026-0418', locationName: 'Azhikkal Port Sector, Kannur', lat: 11.935, lon: 75.312 },
    'f-09': { uavCode: 'UAV-06', missionCode: 'M-2026-0419', locationName: 'Bekal Fort Coastal Sector, Kasaragod', lat: 12.392, lon: 75.032 },
    'f-11': { uavCode: 'UAV-02', missionCode: 'M-2026-0414', locationName: 'Beypore Deep Harbour Sector, Kozhikode', lat: 11.168, lon: 75.802 },
  });

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

    // Add navigation controls (zoom in, zoom out, compass reset)
    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    }

    // Gracefully handle any tile loading warnings
    map.on('error', (e) => {
      // Ignore normal abort errors during rapid panning
      if (e?.error?.message?.includes('aborted')) return;
      console.warn('MapLibre notice:', e?.error?.message || e);
    });

    map.on('load', () => {
      map.resize();

      if (showZones) addZones(map);
      if (showAlerts) addAlertPins(map);
      if (showDrones) addDroneMarkers(map);
      setupInteractions(map);
    });

    // Auto-resize observer to handle panel collapses and flexbox layout changes
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
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

  // Update drone positions in real-time
  useEffect(() => {
    if (!mapRef.current || !showDrones || !layers.drones) return;
    Object.entries(dronePositions).forEach(([feedId, pos]) => {
      updateDroneMarker(feedId, pos.lat, pos.lon, pos.headingDeg);
    });
  }, [dronePositions, showDrones, layers.drones]);

  // Synchronize layer visibility from useMapStore
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Toggle Zones
    ZONES.forEach(zone => {
      const fillId = `zone-fill-${zone.id}`;
      const borderId = `zone-border-${zone.id}`;
      const visibility = (showZones && layers.zones) ? 'visible' : 'none';
      if (map.getLayer(fillId)) map.setLayoutProperty(fillId, 'visibility', visibility);
      if (map.getLayer(borderId)) map.setLayoutProperty(borderId, 'visibility', visibility);
    });

    // Toggle Alerts
    alertMarkersRef.current.forEach(m => {
      const el = m.getElement();
      el.style.display = (showAlerts && layers.alerts) ? 'block' : 'none';
    });

    // Toggle Drones
    Object.values(droneMarkersRef.current).forEach(m => {
      const el = m.getElement();
      el.style.display = (showDrones && layers.drones) ? 'block' : 'none';
    });
  }, [layers, showZones, showAlerts, showDrones]);

  function updateDroneMarker(feedId: string, lat: number, lon: number, headingDeg: number) {
    const map = mapRef.current;
    if (!map) return;

    // Update internal reference
    if (droneDataRef.current[feedId]) {
      droneDataRef.current[feedId].lat = lat;
      droneDataRef.current[feedId].lon = lon;
    } else {
      const initial = INITIAL_TELEMETRY[feedId];
      droneDataRef.current[feedId] = {
        uavCode: initial?.uavCode ?? feedId.replace('f-', 'UAV-'),
        missionCode: initial?.missionCode ?? 'M-2026-0415',
        locationName: initial?.locationName ?? 'Kerala Coastal Waters',
        lat,
        lon,
      };
    }

    if (droneMarkersRef.current[feedId]) {
      droneMarkersRef.current[feedId].setLngLat([lon, lat]);
      const el = droneMarkersRef.current[feedId].getElement();
      el.style.transform = `rotate(${headingDeg}deg)`;
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
    el.style.transform = `rotate(${headingDeg}deg)`;
    el.style.cursor = 'pointer';
    el.innerHTML = `
      <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="#0284c7" fill-opacity="0.95" stroke="white" stroke-width="2" style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.55))"/>
        <path d="M16 6 L13 17 L16 15 L19 17 Z" fill="#ffffff"/>
        <circle cx="16" cy="16" r="2.5" fill="#facc15"/>
        <text x="16" y="27" text-anchor="middle" font-size="6.5" font-weight="bold" fill="white" font-family="monospace">${feedId.replace('f-', 'U')}</text>
      </svg>
    `;

    // ── Mouse Hover Popup for Drones ────────────────────────────
    el.addEventListener('mouseenter', () => {
      const map = mapRef.current;
      if (!map) return;
      hoverPopupRef.current?.remove();

      const data = droneDataRef.current[feedId] ?? {
        uavCode: feedId.replace('f-', 'UAV-'),
        missionCode: 'M-2026-0415',
        locationName: 'Kerala Coastal Patrol Sector',
        lat: 10.0,
        lon: 76.2,
      };

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 18,
        className: 'coastal-custom-hover-popup',
      })
        .setLngLat([data.lon, data.lat])
        .setHTML(buildHoverPopupHTML({
          droneId: data.uavCode,
          missionId: data.missionCode,
          locationName: data.locationName,
          timestamp: new Date(),
          badgeType: 'DRONE',
          extraTitle: feedId.toUpperCase(),
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

  function addZones(map: MLMap) {
    ZONES.forEach(zone => {
      if (map.getSource(`zone-${zone.id}`)) return;

      map.addSource(`zone-${zone.id}`, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: zone.geometry,
          properties: { code: zone.code, name: zone.name, type: zone.type },
        },
      });

      map.addLayer({
        id: `zone-fill-${zone.id}`,
        type: 'fill',
        source: `zone-${zone.id}`,
        paint: {
          'fill-color': zone.color,
          'fill-opacity': 0.25,
        },
      });

      map.addLayer({
        id: `zone-border-${zone.id}`,
        type: 'line',
        source: `zone-${zone.id}`,
        paint: {
          'line-color': zone.color,
          'line-width': 2.5,
          'line-dasharray': zone.type === 'RESTRICTED' ? [4, 2] : [1],
        },
      });
    });
  }

  function addAlertPins(map: MLMap) {
    alertMarkersRef.current.forEach(m => m.remove());
    alertMarkersRef.current = [];

    ALERTS.slice(0, 15).filter(a => a.status !== 'RESOLVED').forEach(alert => {
      const loc = alert.event.location;
      const el = createAlertElement(alert);
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([loc.lon, loc.lat])
        .addTo(map);

      alertMarkersRef.current.push(marker);
      el.addEventListener('click', () => onAlertClick?.(alert.id));
    });
  }

  function createAlertElement(alert: Alert): HTMLElement {
    const colours: Record<string, string> = {
      CRITICAL: '#C8352E', HIGH: '#E06A3B', MEDIUM: '#E0A526', LOW: '#3FAE9A', INFO: '#2B7FA6',
    };
    const colour = colours[alert.severity] ?? '#2B7FA6';

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

    // ── Mouse Hover Popup for Alerts ────────────────────────────
    el.addEventListener('mouseenter', () => {
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

  function addDroneMarkers(_map: MLMap) {
    const initialPositions = [
      { feedId: 'f-01', lat: 9.965, lon: 76.230, heading: 45 },
      { feedId: 'f-03', lat: 8.382, lon: 76.980, heading: 195 },
      { feedId: 'f-05', lat: 9.492, lon: 76.320, heading: 320 },
      { feedId: 'f-07', lat: 11.935, lon: 75.312, heading: 110 },
      { feedId: 'f-09', lat: 12.392, lon: 75.032, heading: 270 },
      { feedId: 'f-11', lat: 11.168, lon: 75.802, heading: 180 },
    ];
    initialPositions.forEach(({ feedId, lat, lon, heading }) => {
      updateDroneMarker(feedId, lat, lon, heading);
    });
  }

  function setupInteractions(map: MLMap) {
    ZONES.forEach(zone => {
      // Find matching sector for drone / mission metadata
      const matchingSector = KERALA_COASTAL_SECTORS.find(s =>
        zone.name.toLowerCase().includes(s.name.split(' ')[0].toLowerCase()) ||
        s.name.toLowerCase().includes(zone.name.split(' ')[0].toLowerCase())
      ) || KERALA_COASTAL_SECTORS[0];

      map.on('click', `zone-fill-${zone.id}`, () => onZoneClick?.(zone.id));

      // ── Mouse Hover Popup for Zones ───────────────────────────
      map.on('mousemove', `zone-fill-${zone.id}`, (e) => {
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
            timestamp: new Date(),
            badgeType: 'ZONE',
            extraTitle: zone.code,
          }))
          .addTo(map);

        hoverPopupRef.current = popup;
      });

      map.on('mouseleave', `zone-fill-${zone.id}`, () => {
        map.getCanvas().style.cursor = '';
        hoverPopupRef.current?.remove();
        hoverPopupRef.current = null;
      });
    });
  }

  return (
    <div className={`relative ${className}`} style={{ height, width: '100%' }}>
      {/* Self-contained styling for dark glassmorphic hover popups */}
      <style>{`
        .coastal-custom-hover-popup .maplibregl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
        }
        .coastal-custom-hover-popup .maplibregl-popup-tip {
          border-top-color: #0d1e2d !important;
          border-bottom-color: #0d1e2d !important;
        }
      `}</style>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

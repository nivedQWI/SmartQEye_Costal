// ============================================================
// SmartQEye Coastal — MapLibre Map Component
// Powered by OpenStreetMap (OSM) focused on Kerala State Coastline
// ============================================================

import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MLMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Contact, Alert } from '@/types';
import { useMapStore } from '@/lib/store';
import { ZONES, CONTACTS, ALERTS } from '@/lib/mockData';

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
  showContacts = true,
  showAlerts = true,
  initialCenter = KERALA_VIEW.center,
  initialZoom = KERALA_VIEW.zoom,
  onAlertClick,
  onContactClick,
  onZoneClick,
}: CoastalMapProps) {
  const mapRef = useRef<MLMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { layers, dronePositions } = useMapStore();
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const contactMarkersRef = useRef<maplibregl.Marker[]>([]);
  const alertMarkersRef = useRef<maplibregl.Marker[]>([]);
  const droneMarkersRef = useRef<Record<string, maplibregl.Marker>>({});

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
      // Ensure layout size is synchronized
      map.resize();

      if (showZones) addZones(map);
      if (showContacts) addContactMarkers(map);
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
      markersRef.current.forEach(m => m.remove());
      contactMarkersRef.current.forEach(m => m.remove());
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

    // Toggle Contacts
    contactMarkersRef.current.forEach(m => {
      const el = m.getElement();
      el.style.display = (showContacts && layers.contacts) ? 'flex' : 'none';
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
  }, [layers, showZones, showContacts, showAlerts, showDrones]);

  function updateDroneMarker(feedId: string, lat: number, lon: number, headingDeg: number) {
    const map = mapRef.current;
    if (!map) return;

    if (droneMarkersRef.current[feedId]) {
      droneMarkersRef.current[feedId].setLngLat([lon, lat]);
      const el = droneMarkersRef.current[feedId].getElement();
      el.style.transform = `rotate(${headingDeg}deg)`;
    } else {
      const el = createDroneElement(feedId, headingDeg);
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lon, lat])
        .addTo(map);
      droneMarkersRef.current[feedId] = marker;
    }
  }

  function createDroneElement(feedId: string, headingDeg: number): HTMLElement {
    const el = document.createElement('div');
    el.style.transform = `rotate(${headingDeg}deg)`;
    el.style.cursor = 'pointer';
    el.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="#2B7FA6" fill-opacity="0.95" stroke="white" stroke-width="2" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.4))"/>
        <path d="M16 6 L13 17 L16 15 L19 17 Z" fill="#FBF7EC"/>
        <circle cx="16" cy="16" r="2.5" fill="#FACC15"/>
        <text x="16" y="28" text-anchor="middle" font-size="6" font-weight="bold" fill="white" font-family="monospace">${feedId.replace('f-', 'U')}</text>
      </svg>
    `;
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
          'fill-opacity': 0.22,
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

  function addContactMarkers(map: MLMap) {
    contactMarkersRef.current.forEach(m => m.remove());
    contactMarkersRef.current = [];

    CONTACTS.slice(0, 20).forEach(contact => {
      if (!contact.lastLocation) return;
      const el = createContactElement(contact);
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([contact.lastLocation.lon, contact.lastLocation.lat])
        .setPopup(new maplibregl.Popup({ offset: 16, closeButton: false })
          .setHTML(`
            <div style="font-size:12px; font-family: sans-serif; padding: 2px;">
              <div style="font-weight:700; color: #12303F; margin-bottom:2px">${contact.code}</div>
              <div style="color: #4A5568">${contact.classLabel}</div>
              <div style="font-size:10px; font-family: monospace; color: #2B7FA6; margin-top:3px">Confidence: ${(contact.classConf * 100).toFixed(0)}%</div>
            </div>
          `))
        .addTo(map);

      contactMarkersRef.current.push(marker);
      el.addEventListener('click', () => onContactClick?.(contact.id));
    });
  }

  function createContactElement(contact: Contact): HTMLElement {
    const colours: Record<string, string> = {
      VESSEL: '#2B7FA6', SMALL_CRAFT: '#6FB7D6', FISHING_BOAT: '#3FAE9A',
      PERSON: '#E06A3B', VEHICLE: '#9B59B6', UNKNOWN: '#93A2AB',
    };
    const shapes: Record<string, string> = {
      VESSEL: '⬡', SMALL_CRAFT: '▲', FISHING_BOAT: '◆', PERSON: '●', VEHICLE: '■', UNKNOWN: '?',
    };
    const colour = colours[contact.class] ?? '#93A2AB';
    const shape = shapes[contact.class] ?? '?';

    const el = document.createElement('div');
    el.style.cssText = `
      width: 24px; height: 24px; border-radius: 50%;
      background: ${colour}; border: 2px solid white;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 11px; cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      transition: transform 0.15s ease;
    `;
    el.innerHTML = shape;
    el.title = `${contact.code} (${contact.classLabel})`;
    return el;
  }

  function addAlertPins(map: MLMap) {
    alertMarkersRef.current.forEach(m => m.remove());
    alertMarkersRef.current = [];

    ALERTS.slice(0, 10).filter(a => a.status !== 'RESOLVED').forEach(alert => {
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
      border-bottom: 18px solid ${colour};
      cursor: pointer; position: relative;
      filter: drop-shadow(0 2px 5px rgba(0,0,0,0.45));
    `;
    if (alert.severity === 'CRITICAL') {
      el.style.animation = 'pulse-live 1.5s ease-in-out infinite';
    }

    const inner = document.createElement('div');
    inner.style.cssText = `
      position: absolute; top: 6px; left: -5px;
      font-size: 8px; color: white; font-weight: bold;
      width: 10px; text-align: center;
    `;
    inner.textContent = '!';
    el.appendChild(inner);
    el.title = `${alert.alertCode} – ${alert.severity}`;
    return el;
  }

  function addDroneMarkers(_map: MLMap) {
    const initialPositions = [
      { feedId: 'f-01', lat: 8.380, lon: 76.982, heading: 42 },
      { feedId: 'f-03', lat: 8.400, lon: 76.991, heading: 195 },
      { feedId: 'f-05', lat: 8.320, lon: 76.965, heading: 320 },
      { feedId: 'f-07', lat: 8.483, lon: 76.920, heading: 110 },
      { feedId: 'f-09', lat: 8.483, lon: 76.892, heading: 270 },
    ];
    initialPositions.forEach(({ feedId, lat, lon, heading }) => {
      updateDroneMarker(feedId, lat, lon, heading);
    });
  }

  function setupInteractions(map: MLMap) {
    ZONES.forEach(zone => {
      map.on('click', `zone-fill-${zone.id}`, () => onZoneClick?.(zone.id));
      map.on('mouseenter', `zone-fill-${zone.id}`, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', `zone-fill-${zone.id}`, () => {
        map.getCanvas().style.cursor = '';
      });
    });
  }

  // Quick focus back to Kerala
  function resetToKerala() {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: KERALA_VIEW.center,
        zoom: KERALA_VIEW.zoom,
        essential: true,
      });
    }
  }

  return (
    <div className={`relative ${className}`} style={{ height, width: '100%' }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />

      {/* Focus Kerala State Quick Navigation Button */}
      {interactive && (
        <button
          onClick={resetToKerala}
          className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-lg text-xs font-mono font-bold shadow-md border flex items-center gap-1.5 transition-all bg-[var(--surface)] text-[var(--accent)] border-[var(--border)] hover:bg-[var(--surface-hover)]"
          title="Reset map view to Kerala State coastline"
        >
          <span>🌴 Focus Kerala State</span>
        </button>
      )}
    </div>
  );
}

// ============================================================
// SmartQEye Coastal — MapLibre Map Component
// Falls back to a styled offline background if tiles fail
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MLMap } from 'maplibre-gl';
import type { Zone, Contact, Alert } from '@/types';
import { useMapStore } from '@/lib/store';
import { ZONES, CONTACTS, ALERTS } from '@/lib/mockData';
import { SEV_COLOURS } from '@/lib/utils';

// Tile URL from env or fallback
const TILE_URL = import.meta.env.VITE_MAP_TILE_URL ?? '';

// Offline fallback style (stylised sea/land — no network required)
const OFFLINE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  name: 'SmartQEye Offline',
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#BFE3F2' }, // sea-200
    },
  ],
};

// Build style
function buildStyle(): maplibregl.StyleSpecification {
  if (TILE_URL) {
    return {
      version: 8,
      glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [TILE_URL],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [
        { id: 'background', type: 'background', paint: { 'background-color': '#BFE3F2' } },
        { id: 'tiles', type: 'raster', source: 'osm-tiles', paint: { 'raster-opacity': 0.85 } },
      ],
    };
  }
  return OFFLINE_STYLE;
}

// Kerala coastline extent
const INITIAL_VIEW = { center: [76.98, 8.40] as [number, number], zoom: 11 };

interface CoastalMapProps {
  height?: string;
  className?: string;
  interactive?: boolean;
  showZones?: boolean;
  showDrones?: boolean;
  showContacts?: boolean;
  showAlerts?: boolean;
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
  onAlertClick,
  onContactClick,
  onZoneClick,
}: CoastalMapProps) {
  const mapRef = useRef<MLMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { layers, dronePositions } = useMapStore();
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildStyle(),
      center: INITIAL_VIEW.center,
      zoom: INITIAL_VIEW.zoom,
      interactive,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      addZones(map);
      addContactMarkers(map);
      addAlertPins(map);
      addDroneMarkers(map);
      setupInteractions(map);
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update drone positions
  useEffect(() => {
    if (!mapRef.current) return;
    Object.entries(dronePositions).forEach(([feedId, pos]) => {
      updateDroneMarker(feedId, pos.lat, pos.lon, pos.headingDeg);
    });
  }, [dronePositions]);

  const droneMarkersRef = useRef<Record<string, maplibregl.Marker>>({});

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
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="13" fill="#2B7FA6" fill-opacity="0.9" stroke="white" stroke-width="1.5"/>
        <path d="M14 4 L12 14 L14 12 L16 14 Z" fill="white"/>
        <circle cx="14" cy="14" r="2" fill="white"/>
        <text x="14" y="26" text-anchor="middle" font-size="5" fill="white" font-family="monospace">${feedId.replace('f-', 'U')}</text>
      </svg>
    `;
    return el;
  }

  function addZones(map: MLMap) {
    ZONES.forEach(zone => {
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
          'fill-opacity': 0.15,
        },
      });

      map.addLayer({
        id: `zone-border-${zone.id}`,
        type: 'line',
        source: `zone-${zone.id}`,
        paint: {
          'line-color': zone.color,
          'line-width': 2,
          'line-dasharray': zone.type === 'RESTRICTED' ? [4, 2] : [1],
        },
      });
    });
  }

  function addContactMarkers(map: MLMap) {
    CONTACTS.slice(0, 20).forEach(contact => {
      if (!contact.lastLocation) return;
      const el = createContactElement(contact);
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([contact.lastLocation.lon, contact.lastLocation.lat])
        .setPopup(new maplibregl.Popup({ offset: 16, closeButton: false })
          .setHTML(`
            <div style="font-size:12px">
              <div style="font-weight:600;margin-bottom:4px">${contact.code}</div>
              <div style="opacity:0.7">${contact.classLabel}</div>
              <div style="font-size:11px;opacity:0.5;margin-top:2px">conf: ${(contact.classConf * 100).toFixed(0)}%</div>
            </div>
          `))
        .addTo(map);
      markersRef.current.push(marker);

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
      width: 22px; height: 22px; border-radius: 50%;
      background: ${colour}; border: 2px solid white;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 10px; cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    `;
    el.innerHTML = shape;
    el.title = `${contact.code} (${contact.classLabel})`;
    return el;
  }

  function addAlertPins(map: MLMap) {
    ALERTS.slice(0, 10).filter(a => a.status !== 'RESOLVED').forEach(alert => {
      const loc = alert.event.location;
      const el = createAlertElement(alert);
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([loc.lon, loc.lat])
        .addTo(map);
      markersRef.current.push(marker);
      el.addEventListener('click', () => onAlertClick?.(alert.id));
    });
  }

  function createAlertElement(alert: Alert): HTMLElement {
    const colours: Record<string, string> = {
      CRITICAL: '#C8352E', HIGH: '#E06A3B', MEDIUM: '#E0A526', LOW: '#3FAE9A', INFO: '#2B7FA6',
    };
    const shapes: Record<string, string> = {
      CRITICAL: '⬛', HIGH: '⬟', MEDIUM: '◆', LOW: '▲', INFO: '●',
    };
    const colour = colours[alert.severity] ?? '#2B7FA6';
    const shape = shapes[alert.severity] ?? '!';

    const el = document.createElement('div');
    el.style.cssText = `
      width: 0; height: 0;
      border-left: 9px solid transparent;
      border-right: 9px solid transparent;
      border-bottom: 16px solid ${colour};
      cursor: pointer; position: relative;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
    `;
    if (alert.severity === 'CRITICAL') {
      el.style.animation = 'pulse-live 1.5s ease-in-out infinite';
    }

    const inner = document.createElement('div');
    inner.style.cssText = `
      position: absolute; top: 5px; left: -5px;
      font-size: 8px; color: white; font-weight: bold;
      width: 10px; text-align: center;
    `;
    inner.textContent = shape;
    el.appendChild(inner);
    el.title = `${alert.alertCode} – ${alert.severity}`;
    return el;
  }

  function addDroneMarkers(_map: MLMap) {
    // Initial positions from INITIAL_FEEDS
    const positions: Array<{ feedId: string; lat: number; lon: number; heading: number }> = [
      { feedId: 'f-01', lat: 8.380, lon: 76.982, heading: 42 },
      { feedId: 'f-03', lat: 8.400, lon: 76.991, heading: 195 },
      { feedId: 'f-05', lat: 8.320, lon: 76.965, heading: 320 },
      { feedId: 'f-07', lat: 8.483, lon: 76.920, heading: 110 },
      { feedId: 'f-09', lat: 8.483, lon: 76.892, heading: 270 },
    ];
    positions.forEach(({ feedId, lat, lon, heading }) => {
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

  return (
    <div ref={containerRef} className={className} style={{ height, width: '100%' }} />
  );
}

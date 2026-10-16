// ============================================================
// SmartQEye Coastal — Telemetry Engine & DJI SRT Parser
// Synchronises video playback time to GPS, altitude, heading, and map coordinates
// ============================================================

import { useState, useEffect } from 'react';
import type { TelemetryPoint } from '@/types/sidecar';
import { formatMissionId, formatUavCode } from '@/lib/idGenerator';

// Default base coordinates for Vizhinjam Coastal Operations
const BASE_LAT = 8.3732;
const BASE_LON = 76.9741;
const BASE_ALT = 120.0;
const BASE_SPEED = 8.2;
const BASE_HEADING = 42.0;

export interface ParsedSrtEntry {
  index: number;
  startTimeSec: number;
  endTimeSec: number;
  rawText: string;
  telemetry: TelemetryPoint;
}

/**
 * Parses DJI/Autel drone .srt subtitle telemetry into structured points.
 */
export function parseDjiSrt(srtContent: string): ParsedSrtEntry[] {
  const entries: ParsedSrtEntry[] = [];
  const blocks = srtContent.trim().split(/\r?\n\r?\n/);

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const index = parseInt(lines[0], 10);
    const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
    if (!timeMatch) continue;

    const startSec = parseInt(timeMatch[1], 10) * 3600 +
      parseInt(timeMatch[2], 10) * 60 +
      parseInt(timeMatch[3], 10) +
      parseInt(timeMatch[4], 10) / 1000;

    const endSec = parseInt(timeMatch[5], 10) * 3600 +
      parseInt(timeMatch[6], 10) * 60 +
      parseInt(timeMatch[7], 10) +
      parseInt(timeMatch[8], 10) / 1000;

    const text = lines.slice(2).join(' ');

    // DJI Format 1: GPS(lon,lat,altM) or GPS (lat,lon,alt)
    let lat = BASE_LAT;
    let lon = BASE_LON;
    let altM = BASE_ALT;
    let speedMs = BASE_SPEED;
    let headingDeg = BASE_HEADING;
    let gimbalPitchDeg = -30.0;

    // Pattern A: GPS(76.9741,8.3732,120.4M)
    const gpsMatch = text.match(/GPS\s*\(\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+)M?)?\s*\)/i);
    if (gpsMatch) {
      const p1 = parseFloat(gpsMatch[1]);
      const p2 = parseFloat(gpsMatch[2]);
      if (p1 > 60 && p1 < 90) { // Longitude first (DJI style)
        lon = p1;
        lat = p2;
      } else {
        lat = p1;
        lon = p2;
      }
      if (gpsMatch[3]) altM = parseFloat(gpsMatch[3]);
    }

    // Pattern B: [latitude: 8.3732] [longitude: 76.9741]
    const latMatch = text.match(/latitude[:\s]+([0-9.-]+)/i);
    const lonMatch = text.match(/longitude[:\s]+([0-9.-]+)/i);
    if (latMatch) lat = parseFloat(latMatch[1]);
    if (lonMatch) lon = parseFloat(lonMatch[1]);

    // Altitude: BAROMETER: 120.4M or [altitude: 120.4]
    const altMatch = text.match(/(?:altitude|barometer|rel_alt)[:\s]+([0-9.-]+)/i);
    if (altMatch) altM = parseFloat(altMatch[1]);

    // Speed: D 8.2m/s or [speed: 8.2]
    const speedMatch = text.match(/(?:speed|D)[:\s]+([0-9.-]+)(?:\s*m\/s)?/i);
    if (speedMatch) speedMs = parseFloat(speedMatch[1]);

    // Heading: H 42.1deg or [heading: 42.1]
    const hdgMatch = text.match(/(?:heading|H)[:\s]+([0-9.-]+)/i);
    if (hdgMatch) headingDeg = parseFloat(hdgMatch[1]);

    // Gimbal Pitch: P -45.0deg
    const pitchMatch = text.match(/(?:pitch|P)[:\s]+([0-9.-]+)/i);
    if (pitchMatch) gimbalPitchDeg = parseFloat(pitchMatch[1]);

    entries.push({
      index: isNaN(index) ? entries.length + 1 : index,
      startTimeSec: startSec,
      endTimeSec: endSec,
      rawText: text,
      telemetry: {
        timeSec: startSec,
        lat,
        lon,
        altM,
        speedMs,
        headingDeg,
        gimbalPitchDeg,
        batteryPct: Math.max(20, Math.round(95 - (startSec * 0.05))),
        uavCode: formatUavCode(3),
        missionCode: formatMissionId('VIZHINJAM', '0830', 1),
      },
    });
  }

  return entries;
}

/**
 * Procedural telemetry trajectory generator (for Vizhinjam Dawn Patrol scenario).
 */
export function generateProceduralTelemetry(timeSec: number, uavCode = formatUavCode(3)): TelemetryPoint {
  // Drone flies circular patrol orbit over Vizhinjam Harbour approach
  const orbitRadius = 0.008; // ~800m
  const orbitAngularSpeed = (2 * Math.PI) / 120; // 1 full orbit in 120s
  const angle = timeSec * orbitAngularSpeed;

  const lat = BASE_LAT + Math.sin(angle) * orbitRadius;
  const lon = BASE_LON + Math.cos(angle) * orbitRadius * 0.9;
  const headingDeg = Math.round(((angle + Math.PI / 2) * (180 / Math.PI) + 360) % 360);
  const altM = Math.round((120.0 + Math.sin(timeSec * 0.1) * 3.5) * 10) / 10;
  const speedMs = Math.round((8.2 + Math.cos(timeSec * 0.15) * 0.8) * 10) / 10;
  const batteryPct = Math.max(15, Math.round(94 - (timeSec * 0.04)));

  return {
    timeSec,
    lat,
    lon,
    altM,
    speedMs,
    headingDeg,
    gimbalPitchDeg: -35,
    gimbalYawDeg: headingDeg,
    batteryPct,
    uavCode,
    missionCode: formatMissionId('VIZHINJAM', '0830', 1),
    timestampIso: new Date(Date.now() - (120 - timeSec) * 1000).toISOString(),
  };
}

// ─── Global Telemetry Bus (Singleton) ─────────────────────────

type TelemetryListener = (point: TelemetryPoint) => void;

class TelemetryBus {
  private currentPoint: TelemetryPoint = generateProceduralTelemetry(0);
  private listeners = new Set<TelemetryListener>();

  getPoint(): TelemetryPoint {
    return this.currentPoint;
  }

  updateTime(timeSec: number, customPoint?: TelemetryPoint) {
    this.currentPoint = customPoint ?? generateProceduralTelemetry(timeSec);
    this.listeners.forEach(fn => fn(this.currentPoint));
  }

  subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    listener(this.currentPoint);
    return () => this.listeners.delete(listener);
  }
}

export const telemetryBus = new TelemetryBus();

/**
 * React hook to subscribe to the current video time telemetry.
 */
export function useTelemetry(timeSec?: number): TelemetryPoint {
  const [telemetry, setTelemetry] = useState<TelemetryPoint>(() =>
    timeSec !== undefined ? generateProceduralTelemetry(timeSec) : telemetryBus.getPoint()
  );

  useEffect(() => {
    if (timeSec !== undefined) {
      setTelemetry(generateProceduralTelemetry(timeSec));
      return;
    }
    const unsub = telemetryBus.subscribe(point => setTelemetry(point));
    return unsub;
  }, [timeSec]);

  return telemetry;
}

// ============================================================
// SmartQEye Coastal — Real-time Simulator
// Fake WebSocket / event emitter that keeps the UI "live"
// ============================================================

import type {
  Alert, Feed, TelemetrySample, SystemHealth, ContactClass, Severity,
} from '@/types';
import {
  ALERTS, INITIAL_FEEDS, INITIAL_TELEMETRY, INITIAL_HEALTH, CONTACTS,
} from './mockData';
import { formatAlertId, formatMissionId, formatUavCode } from '@/lib/idGenerator';

// ─── Event types ─────────────────────────────────────────────

export type SimulatorEvent =
  | { type: 'ALERT_NEW';       payload: Alert }
  | { type: 'ALERT_UPDATED';   payload: Alert }
  | { type: 'FEED_UPDATE';     payload: Feed }
  | { type: 'TELEMETRY';       payload: TelemetrySample }
  | { type: 'HEALTH_UPDATE';   payload: SystemHealth }
  | { type: 'DRONE_POSITION';  payload: { feedId: string; lat: number; lon: number; headingDeg: number } };

type Listener = (event: SimulatorEvent) => void;

// ─── Simulator class ─────────────────────────────────────────

class CoastalSimulator {
  private listeners: Set<Listener> = new Set();
  private intervals: ReturnType<typeof setInterval>[] = [];
  private feeds: Feed[] = [...INITIAL_FEEDS];
  private telemetry: Record<string, TelemetrySample> = { ...INITIAL_TELEMETRY };
  private health: SystemHealth = { ...INITIAL_HEALTH };
  private alertIndex = ALERTS.length;
  private running = false;

  // ── Drone paths (lat/lon delta per tick) ─────────────────
  private dronePaths: Record<string, { lat: number; lon: number; heading: number; dLat: number; dLon: number }> = {
    'f-01': { lat: 8.380, lon: 76.982, heading: 42,  dLat: 0.0002,  dLon: 0.0003 },
    'f-03': { lat: 8.400, lon: 76.991, heading: 195, dLat: -0.0002, dLon: -0.0001 },
    'f-05': { lat: 8.320, lon: 76.965, heading: 320, dLat: 0.0001,  dLon: -0.0002 },
    'f-07': { lat: 8.483, lon: 76.920, heading: 110, dLat: 0.0001,  dLon: 0.0002 },
    'f-09': { lat: 8.483, lon: 76.892, heading: 270, dLat: 0.0000,  dLon: -0.0003 },
  };

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: SimulatorEvent) {
    this.listeners.forEach(l => l(event));
  }

  start() {
    if (this.running) return;
    this.running = true;

    // Drone telemetry updates every 2s
    this.intervals.push(setInterval(() => this.tickTelemetry(), 2000));

    // Feed state updates every 8s
    this.intervals.push(setInterval(() => this.tickFeeds(), 8000));

    // New alerts every 5-15s (randomized)
    this.scheduleNextAlert();

    // Health updates every 5s
    this.intervals.push(setInterval(() => this.tickHealth(), 5000));
  }

  stop() {
    this.running = false;
    this.intervals.forEach(clearInterval);
    this.intervals = [];
  }

  private tickTelemetry() {
    Object.entries(this.dronePaths).forEach(([feedId, path]) => {
      // Move drone slightly
      path.lat += path.dLat + (Math.random() - 0.5) * 0.00005;
      path.lon += path.dLon + (Math.random() - 0.5) * 0.00005;
      path.heading = (path.heading + (Math.random() - 0.5) * 5 + 360) % 360;

      const sample: TelemetrySample = {
        feedId,
        uavCode: this.feeds.find(f => f.id === feedId)?.uavCode ?? 'UAV-KL-01',
        missionCode: formatMissionId('VIZHINJAM', '0830', 1),
        timestamp: new Date().toISOString(),
        lat: path.lat,
        lon: path.lon,
        altitudeM: 100 + Math.sin(Date.now() / 10000) * 10,
        headingDeg: Math.round(path.heading),
        groundSpeedMs: 7 + Math.random() * 4,
        batteryPct: Math.max(10, (this.telemetry[feedId]?.batteryPct ?? 80) - 0.01),
        flightStatus: 'AUTO',
        signalStrengthPct: 85 + Math.floor(Math.random() * 15),
        satelliteCount: 12 + Math.floor(Math.random() * 4),
        telemetryAvailable: true,
      };

      this.telemetry[feedId] = sample;

      this.emit({ type: 'TELEMETRY', payload: sample });
      this.emit({ type: 'DRONE_POSITION', payload: { feedId, lat: path.lat, lon: path.lon, headingDeg: Math.round(path.heading) } });
    });
  }

  private tickFeeds() {
    // Occasionally drop a feed and recover it
    const mutableFeeds = this.feeds.filter(f => f.state === 'LIVE');
    if (mutableFeeds.length > 3 && Math.random() < 0.15) {
      const target = mutableFeeds[Math.floor(Math.random() * mutableFeeds.length)];
      const newState = Math.random() < 0.5 ? 'BUFFERING' : 'NO_SIGNAL';
      const updated = { ...target, state: newState as Feed['state'], lastFrameAt: new Date().toISOString() };
      this.feeds = this.feeds.map(f => f.id === target.id ? updated : f);
      this.emit({ type: 'FEED_UPDATE', payload: updated });

      // Recover after 5-12s
      setTimeout(() => {
        const recovered = { ...updated, state: 'LIVE' as Feed['state'], lastFrameAt: new Date().toISOString(), latencyMs: 800 + Math.random() * 500 };
        this.feeds = this.feeds.map(f => f.id === target.id ? recovered : f);
        this.emit({ type: 'FEED_UPDATE', payload: recovered });
      }, 5000 + Math.random() * 7000);
    }

    // Update latency/fps for live feeds
    this.feeds.filter(f => f.state === 'LIVE').forEach(feed => {
      const updated: Feed = {
        ...feed,
        latencyMs: Math.max(500, (feed.latencyMs ?? 1000) + (Math.random() - 0.5) * 200),
        fpsCurrent: Math.min(25, Math.max(15, (feed.fpsCurrent ?? 25) + (Math.random() - 0.5) * 2)),
        lastFrameAt: new Date().toISOString(),
      };
      this.emit({ type: 'FEED_UPDATE', payload: updated });
    });
  }

  private scheduleNextAlert() {
    if (!this.running) return;
    const delay = 5000 + Math.random() * 10000;
    setTimeout(() => {
      if (!this.running) return;
      this.generateAlert();
      this.scheduleNextAlert();
    }, delay);
  }

  private generateAlert() {
    const severities: Severity[] = ['CRITICAL', 'HIGH', 'HIGH', 'MEDIUM', 'MEDIUM', 'MEDIUM', 'LOW', 'LOW', 'INFO', 'INFO'];
    const severity = severities[Math.floor(Math.random() * severities.length)];

    const eventTypes = ['loitering', 'vessel_detected', 'zone_entry', 'repeated_shoreline_approach', 'crowd_threshold_exceeded', 'convergence', 'intrusion', 'course_speed_change'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)] as Alert['event']['type'];

    const contactIdx = Math.floor(Math.random() * CONTACTS.length);
    const contact = CONTACTS[contactIdx];
    const uavCodes = [formatUavCode(1), formatUavCode(3), formatUavCode(5)];
    const uavCode = uavCodes[Math.floor(Math.random() * uavCodes.length)];

    this.alertIndex++;
    const alertId = `a-${String(this.alertIndex).padStart(3, '0')}`;

    const newAlert: Alert = {
      id: alertId,
      alertCode: formatAlertId(this.alertIndex),
      severity,
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      event: {
        id: `ev-sim-${this.alertIndex}`,
        type: eventType,
        occurredAt: new Date().toISOString(),
        uav: { id: 'u-03', code: uavCode },
        mission: { id: 'm-01', code: formatMissionId('VIZHINJAM', '0830', 1) },
        location: {
          lat: 8.350 + Math.random() * 0.05,
          lon: 76.960 + Math.random() * 0.04,
          method: 'DRONE_POSITION',
        },
        attention: severity === 'CRITICAL' ? 'CRITICAL' : severity === 'HIGH' ? 'ATTENTION' : 'MONITOR',
        rationale: {
          factors: [{ factorName: 'Threshold exceeded', value: 1, threshold: 1, contribution: 'PRIMARY' }],
        },
        versions: { appVersion: '1.2.0-coastal' },
        contact: {
          code: contact.code,
          class: contact.class as ContactClass,
          classConf: contact.classConf,
          continuityConf: contact.continuityConf,
        },
      },
      evidence: [],
      auditTrail: [],
    };

    this.emit({ type: 'ALERT_NEW', payload: newAlert });
  }

  private tickHealth() {
    const updatedHealth: SystemHealth = {
      ...this.health,
      gpuUsagePct: Math.max(40, Math.min(95, this.health.gpuUsagePct + (Math.random() - 0.5) * 5)),
      cpuUsagePct: Math.max(15, Math.min(80, this.health.cpuUsagePct + (Math.random() - 0.5) * 3)),
      updatedAt: new Date().toISOString(),
    };
    this.health = updatedHealth;
    this.emit({ type: 'HEALTH_UPDATE', payload: updatedHealth });
  }
}

// Singleton
export const simulator = new CoastalSimulator();

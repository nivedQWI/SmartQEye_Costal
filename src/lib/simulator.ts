// ============================================================
// SmartQEye Coastal — Real-time Simulator
// Fake WebSocket / event emitter that keeps the UI "live"
// ============================================================

import type {
  Alert, Feed, TelemetrySample, SystemHealth, ContactClass, Severity,
} from '@/types';
import {
  ALERTS, INITIAL_FEEDS, INITIAL_TELEMETRY, INITIAL_HEALTH, CONTACTS, KERALA_COASTAL_SECTORS,
} from './mockData';

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

  // ── Drone paths patrolling across Kerala Coastal Sectors ──
  private dronePaths: Record<string, {
    lat: number; lon: number; heading: number; dLat: number; dLon: number;
    anchorLat: number; anchorLon: number;
    uavCode: string; missionCode: string; missionTitle: string; locationName: string;
  }> = {
    'f-01': {
      lat: 9.965, lon: 76.230, heading: 45, dLat: 0.00018, dLon: 0.00012,
      anchorLat: 9.965, anchorLon: 76.230,
      uavCode: 'UAV-01', missionCode: 'M-2026-0416', missionTitle: 'Kochi Port & Naval Base Surveillance',
      locationName: 'Kochi Port & Naval Base Sector, Ernakulam',
    },
    'f-03': {
      lat: 8.382, lon: 76.980, heading: 195, dLat: -0.00015, dLon: -0.0001,
      anchorLat: 8.382, anchorLon: 76.980,
      uavCode: 'UAV-03', missionCode: 'M-2026-0415', missionTitle: 'Vizhinjam Seaport Security Patrol',
      locationName: 'Vizhinjam International Seaport, Thiruvananthapuram',
    },
    'f-05': {
      lat: 9.492, lon: 76.320, heading: 320, dLat: 0.00012, dLon: -0.00015,
      anchorLat: 9.492, anchorLon: 76.320,
      uavCode: 'UAV-05', missionCode: 'M-2026-0417', missionTitle: 'Alappuzha Coastal Infiltration Watch',
      locationName: 'Alappuzha Beach & Pier Sector, Alappuzha',
    },
    'f-07': {
      lat: 11.935, lon: 75.312, heading: 110, dLat: 0.00014, dLon: 0.00014,
      anchorLat: 11.935, anchorLon: 75.312,
      uavCode: 'UAV-04', missionCode: 'M-2026-0418', missionTitle: 'Kannur Azhikkal Estuary Monitoring',
      locationName: 'Azhikkal Port Sector, Kannur',
    },
    'f-09': {
      lat: 12.392, lon: 75.032, heading: 270, dLat: -0.00012, dLon: -0.00012,
      anchorLat: 12.392, anchorLon: 75.032,
      uavCode: 'UAV-06', missionCode: 'M-2026-0419', missionTitle: 'Bekal Coastal High-Security Sector',
      locationName: 'Bekal Fort Coastal Sector, Kasaragod',
    },
    'f-11': {
      lat: 11.168, lon: 75.802, heading: 180, dLat: 0.00015, dLon: -0.0001,
      anchorLat: 11.168, anchorLon: 75.802,
      uavCode: 'UAV-02', missionCode: 'M-2026-0414', missionTitle: 'Beypore Maritime & Harbour Patrol',
      locationName: 'Beypore Deep Harbour Sector, Kozhikode',
    },
  };

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: SimulatorEvent) {
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
      // Move drone slightly within patrol boundary
      if (Math.abs(path.lat - path.anchorLat) > 0.02) path.dLat = -path.dLat;
      if (Math.abs(path.lon - path.anchorLon) > 0.02) path.dLon = -path.dLon;

      path.lat += path.dLat + (Math.random() - 0.5) * 0.00005;
      path.lon += path.dLon + (Math.random() - 0.5) * 0.00005;
      path.heading = (path.heading + (Math.random() - 0.5) * 4 + 360) % 360;

      const sample: TelemetrySample = {
        feedId,
        uavCode: path.uavCode,
        missionCode: path.missionCode,
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
        locationName: path.locationName,
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
    const spot = KERALA_COASTAL_SECTORS[Math.floor(Math.random() * KERALA_COASTAL_SECTORS.length)];

    this.alertIndex++;
    const alertId = `a-${String(this.alertIndex).padStart(3, '0')}`;

    const newAlert: Alert = {
      id: alertId,
      alertCode: `ALC-2026-${String(this.alertIndex).padStart(3, '0')}`,
      severity,
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      event: {
        id: `ev-sim-${this.alertIndex}`,
        type: eventType,
        occurredAt: new Date().toISOString(),
        uav: { id: `u-${spot.uavCode.replace('UAV-0', '')}`, code: spot.uavCode },
        mission: { id: `m-${spot.uavCode.replace('UAV-0', '')}`, code: spot.missionCode, title: spot.missionTitle },
        location: {
          lat: spot.lat + (Math.random() - 0.5) * 0.008,
          lon: spot.lon + (Math.random() - 0.5) * 0.008,
          method: 'DRONE_POSITION',
          name: spot.name,
        },
        attention: severity === 'CRITICAL' ? 'CRITICAL' : severity === 'HIGH' ? 'ATTENTION' : 'MONITOR',
        rationale: {
          factors: [{ factorName: 'Threshold exceeded', value: 1, threshold: 1, contribution: 'PRIMARY' }],
        },
        versions: { appVersion: '1.0.3' },
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

// ============================================================
// SmartQEye Coastal — Realtime Streaming Abstraction (Phase 8)
// Abstract WebSocket / Server-Sent Events (SSE) transport
// Seamlessly toggles between Mock scenario driver and Live FastAPI WebSocket backend
// ============================================================

import type { Alert, TelemetrySample, FeedState, Contact, SystemHealth } from '@/types';
import { runtimeConfig } from './runtimeConfig';
import { simulator } from './simulator';
import { telemetryBus } from './telemetry';

export type RealtimeConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

export type RealtimeEventHandler<T> = (data: T) => void;

class RealtimeStreamManager {
  private status: RealtimeConnectionStatus = 'DISCONNECTED';
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: NodeJS.Timeout | null = null;

  // Listeners
  private alertListeners = new Set<RealtimeEventHandler<Alert>>();
  private telemetryListeners = new Map<string, Set<RealtimeEventHandler<TelemetrySample>>>();
  private allTelemetryListeners = new Set<RealtimeEventHandler<TelemetrySample>>();
  private feedStateListeners = new Set<RealtimeEventHandler<{ feedId: string; state: FeedState }>>();
  private contactListeners = new Set<RealtimeEventHandler<Contact>>();
  private healthListeners = new Set<RealtimeEventHandler<SystemHealth>>();
  private statusListeners = new Set<RealtimeEventHandler<RealtimeConnectionStatus>>();

  private mockUnsubscribe: (() => void) | null = null;

  constructor() {
    this.connect();
  }

  public connect(): void {
    if (runtimeConfig.API_MODE === 'live') {
      this.connectLiveWebSocket();
    } else {
      this.connectMockTransport();
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.mockUnsubscribe) {
      this.mockUnsubscribe();
      this.mockUnsubscribe = null;
    }
    this.setStatus('DISCONNECTED');
  }

  public getStatus(): RealtimeConnectionStatus {
    return this.status;
  }

  public onStatusChange(handler: RealtimeEventHandler<RealtimeConnectionStatus>): RealtimeSubscription {
    this.statusListeners.add(handler);
    handler(this.status);
    return {
      unsubscribe: () => this.statusListeners.delete(handler),
    };
  }

  public subscribeStatus(handler: RealtimeEventHandler<RealtimeConnectionStatus>): RealtimeSubscription {
    return this.onStatusChange(handler);
  }

  // ─── Subscriptions ──────────────────────────────────────────

  public subscribeAlerts(handler: RealtimeEventHandler<Alert>): RealtimeSubscription {
    this.alertListeners.add(handler);
    return {
      unsubscribe: () => this.alertListeners.delete(handler),
    };
  }

  public subscribeTelemetry(feedId: string, handler: RealtimeEventHandler<TelemetrySample>): RealtimeSubscription {
    if (!this.telemetryListeners.has(feedId)) {
      this.telemetryListeners.set(feedId, new Set());
    }
    this.telemetryListeners.get(feedId)!.add(handler);
    return {
      unsubscribe: () => {
        const set = this.telemetryListeners.get(feedId);
        if (set) {
          set.delete(handler);
          if (set.size === 0) this.telemetryListeners.delete(feedId);
        }
      },
    };
  }

  public subscribeAllTelemetry(handler: RealtimeEventHandler<TelemetrySample>): RealtimeSubscription {
    this.allTelemetryListeners.add(handler);
    return {
      unsubscribe: () => this.allTelemetryListeners.delete(handler),
    };
  }

  public subscribeFeedState(handler: RealtimeEventHandler<{ feedId: string; state: FeedState }>): RealtimeSubscription {
    this.feedStateListeners.add(handler);
    return {
      unsubscribe: () => this.feedStateListeners.delete(handler),
    };
  }

  public subscribeContacts(handler: RealtimeEventHandler<Contact>): RealtimeSubscription {
    this.contactListeners.add(handler);
    return {
      unsubscribe: () => this.contactListeners.delete(handler),
    };
  }

  public subscribeHealth(handler: RealtimeEventHandler<SystemHealth>): RealtimeSubscription {
    this.healthListeners.add(handler);
    return {
      unsubscribe: () => this.healthListeners.delete(handler),
    };
  }

  // ─── Live WebSocket Transport ───────────────────────────────

  private connectLiveWebSocket(): void {
    if (typeof window === 'undefined') return;

    this.setStatus('CONNECTING');
    try {
      const url = `${runtimeConfig.WS_BASE_URL}/events`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.setStatus('CONNECTED');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.dispatchIncomingEvent(message);
        } catch {
          // ignore non-json messages
        }
      };

      this.ws.onerror = () => {
        // ws error handled in onclose
      };

      this.ws.onclose = () => {
        this.setStatus('DISCONNECTED');
        this.scheduleReconnect();
      };
    } catch {
      this.setStatus('DISCONNECTED');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    const delayMs = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 15000);
    this.reconnectTimer = setTimeout(() => {
      this.connectLiveWebSocket();
    }, delayMs);
  }

  private dispatchIncomingEvent(message: { type: string; payload: any }): void {
    switch (message.type) {
      case 'ALERT_NEW':
        this.alertListeners.forEach(h => h(message.payload));
        break;
      case 'TELEMETRY_UPDATE': {
        const sample: TelemetrySample = message.payload;
        this.allTelemetryListeners.forEach(h => h(sample));
        const feedListeners = this.telemetryListeners.get(sample.feedId);
        if (feedListeners) feedListeners.forEach(h => h(sample));
        break;
      }
      case 'FEED_STATE_CHANGE':
        this.feedStateListeners.forEach(h => h(message.payload));
        break;
      case 'CONTACT_UPDATE':
        this.contactListeners.forEach(h => h(message.payload));
        break;
      case 'HEALTH_UPDATE':
        this.healthListeners.forEach(h => h(message.payload));
        break;
    }
  }

  // ─── Mock Transport (Simulator & Scenario Director) ─────────

  private connectMockTransport(): void {
    this.setStatus('CONNECTING');

    const unsubSim = simulator.subscribe((event) => {
      if (event.type === 'ALERT_NEW') {
        this.alertListeners.forEach(h => h(event.payload));
      } else if (event.type === 'HEALTH_UPDATE') {
        this.healthListeners.forEach(h => h(event.payload));
      }
    });

    const unsubTelemetry = telemetryBus.subscribe((point) => {
      const sample: TelemetrySample = {
        feedId: 'f-01',
        uavCode: point.uavCode || 'UAV-KL-03',
        missionCode: point.missionCode || 'MSN-20261016-01',
        timestamp: point.timestampIso || new Date().toISOString(),
        lat: point.lat,
        lon: point.lon,
        altitudeM: point.altM,
        headingDeg: point.headingDeg,
        groundSpeedMs: point.speedMs,
        batteryPct: point.batteryPct ?? 84,
        flightStatus: 'AUTO',
        gimbalPitchDeg: point.gimbalPitchDeg ?? -35,
        gimbalYawDeg: point.gimbalYawDeg ?? point.headingDeg,
        signalStrengthPct: 92,
        satelliteCount: 14,
        telemetryAvailable: true,
      };
      this.allTelemetryListeners.forEach(h => h(sample));
      const feedListeners = this.telemetryListeners.get('f-01');
      if (feedListeners) feedListeners.forEach(h => h(sample));
    });

    this.mockUnsubscribe = () => {
      unsubSim();
      unsubTelemetry();
    };

    setTimeout(() => {
      this.setStatus('CONNECTED');
    }, 100);
  }

  private setStatus(status: RealtimeConnectionStatus): void {
    this.status = status;
    this.statusListeners.forEach(h => h(status));
  }
}

export const realtimeClient = new RealtimeStreamManager();

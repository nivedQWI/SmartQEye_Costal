import { describe, it, expect, vi } from 'vitest';
import { realtimeClient } from '@/lib/realtime';
import type { Alert } from '@/types';

describe('Realtime Streaming Abstraction (src/lib/realtime)', () => {
  it('allows subscription and unsubscription for alerts', () => {
    const handler = vi.fn();
    const sub = realtimeClient.subscribeAlerts(handler);

    expect(typeof sub.unsubscribe).toBe('function');
    sub.unsubscribe();
  });

  it('allows subscription and unsubscription for telemetry samples', () => {
    const handler = vi.fn();
    const sub = realtimeClient.subscribeTelemetry('f-01', handler);

    expect(typeof sub.unsubscribe).toBe('function');
    sub.unsubscribe();
  });

  it('allows subscription and unsubscription for connection status changes', () => {
    const handler = vi.fn();
    const sub = realtimeClient.subscribeStatus(handler);

    expect(typeof sub.unsubscribe).toBe('function');
    sub.unsubscribe();
  });
});

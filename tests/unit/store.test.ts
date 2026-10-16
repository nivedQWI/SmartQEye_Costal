import { describe, it, expect, beforeEach } from 'vitest';
import { useAlertStore, useFeedStore } from '@/lib/store';
import type { Alert, Feed, TelemetrySample } from '@/types';

describe('Global State Stores (src/lib/store)', () => {
  describe('useAlertStore', () => {
    it('manages alerts, critical banner, and unread counts', () => {
      const initialAlerts = useAlertStore.getState().alerts;
      const initialUnread = useAlertStore.getState().unreadCount;

      const newAlert: Alert = {
        id: 'test-alr-999',
        alertCode: 'ALR-20261016-0999',
        type: 'intrusion',
        severity: 'CRITICAL',
        title: 'Unauthorized Vessel Approach',
        description: 'Vessel approaching sensitive coastal zone',
        status: 'NEW',
        missionId: 'm-01',
        missionCode: 'MSN-20261016-01',
        uavId: 'u-01',
        uavCode: 'UAV-KL-03',
        feedId: 'f-01',
        zoneId: 'z-01',
        zoneCode: 'Z-07',
        confidence: 0.96,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add alert
      useAlertStore.getState().addAlert(newAlert);
      expect(useAlertStore.getState().alerts[0].id).toBe('test-alr-999');
      expect(useAlertStore.getState().unreadCount).toBe(initialUnread + 1);
      expect(useAlertStore.getState().criticalBanner?.id).toBe('test-alr-999');

      // Dismiss banner acknowledges the alert
      useAlertStore.getState().dismissBanner();
      expect(useAlertStore.getState().criticalBanner).toBeNull();

      // Acknowledge alert
      useAlertStore.getState().acknowledgeAlert('test-alr-999');
      const updated = useAlertStore.getState().alerts.find(a => a.id === 'test-alr-999');
      expect(updated?.status).toBe('ACKNOWLEDGED');
    });
  });

  describe('useFeedStore', () => {
    it('manages active feed, grid layout, and telemetry state', () => {
      // Set grid layout
      useFeedStore.getState().setGridLayout(9);
      expect(useFeedStore.getState().gridLayout).toBe(9);

      // Set active feed
      useFeedStore.getState().setActiveFeed('f-02');
      expect(useFeedStore.getState().activeFeedId).toBe('f-02');

      // Pin / Unpin
      useFeedStore.getState().pinFeed('f-05');
      expect(useFeedStore.getState().pinnedFeedIds).toContain('f-05');
      useFeedStore.getState().unpinFeed('f-05');
      expect(useFeedStore.getState().pinnedFeedIds).not.toContain('f-05');

      // Update telemetry
      const sample: TelemetrySample = {
        feedId: 'f-01',
        uavCode: 'UAV-KL-03',
        missionCode: 'MSN-20261016-01',
        timestamp: new Date().toISOString(),
        lat: 8.375,
        lon: 76.975,
        altitudeM: 125,
        headingDeg: 45,
        groundSpeedMs: 9.5,
        batteryPct: 82,
        flightStatus: 'AUTO',
        signalStrengthPct: 95,
        satelliteCount: 16,
        telemetryAvailable: true,
      };

      useFeedStore.getState().updateTelemetry(sample);
      expect(useFeedStore.getState().telemetry['f-01']).toEqual(sample);
    });
  });
});

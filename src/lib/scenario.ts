// ============================================================
// SmartQEye Coastal — Scenario Director ("Vizhinjam Dawn Patrol")
// Appendix D: Deterministic multi-screen scenario timeline
// Synchronises Drone Video, AI Overlays, Telemetry, Map GIS, and Alerts
// ============================================================

import { simulator } from '@/lib/simulator';
import { telemetryBus } from '@/lib/telemetry';
import { useAlertStore } from '@/lib/store';
import { ALERTS } from '@/lib/mockData';
import { formatAlertId, formatMissionId, formatUavCode } from '@/lib/idGenerator';
import type { ScenarioMilestone } from '@/types/sidecar';
import type { Alert } from '@/types';

export const SCENARIO_NAME = 'Vizhinjam Dawn Patrol';
export const SCENARIO_UAV = formatUavCode(3); // UAV-KL-03
export const SCENARIO_MISSION = formatMissionId('VIZHINJAM', '0830', 1);

export const VIZHINJAM_SCENARIO_MILESTONES: ScenarioMilestone[] = [
  {
    timeSec: 0,
    type: 'CONTACT_ACQUIRED',
    title: 'Sortie Commenced',
    description: 'UAV-KL-03 patrolling Vizhinjam Outer Approaches. Mode: CFS Quiescent Light (12 FPS).',
    severity: 'INFO',
  },
  {
    timeSec: 8,
    type: 'CONTACT_ACQUIRED',
    title: 'Contact C-1042 Acquired',
    description: 'High-speed small craft C-1042 acquired entering outer channel at 18.5 kn. CFS steps to FULL (25 FPS).',
    contactId: 'C-1042',
    severity: 'LOW',
  },
  {
    timeSec: 18,
    type: 'ZONE_BREACH',
    title: 'Restricted Zone Z-07 Breached',
    description: 'C-1042 crosses perimeter of Zone Z-07 (Vizhinjam Military Approach) without transponder.',
    contactId: 'C-1042',
    zoneCode: 'Z-07',
    severity: 'HIGH',
  },
  {
    timeSec: 24,
    type: 'ALERT_RAISED',
    title: 'Operational Alert ALR-20261016-0001 Raised',
    description: 'Critical Intrusion alert triggered. Pre/post keyframe extraction initiated for court dossier.',
    contactId: 'C-1042',
    alertCode: formatAlertId(1),
    severity: 'CRITICAL',
  },
  {
    timeSec: 32,
    type: 'THERMAL_SEGMENT',
    title: 'Thermal Signature Corroboration',
    description: 'Thermal sensor corroborates high heat radiation from outboard twin engines.',
    contactId: 'C-1042',
    severity: 'HIGH',
  },
  {
    timeSec: 45,
    type: 'CKFE_KEYFRAME',
    title: 'CKFE Evidence Sealed',
    description: '3 keyframes sealed with SHA-256 tamper-evident integrity hash into incident dossier.',
    alertCode: formatAlertId(1),
    severity: 'CRITICAL',
  },
  {
    timeSec: 60,
    type: 'FEED_LAG',
    title: 'Auxiliary Edge Node Lag',
    description: 'Vizhinjam edge station gateway reports 12s backhaul lag; Central GPU retains custody.',
    severity: 'MEDIUM',
  },
  {
    timeSec: 75,
    type: 'CONTACT_LOST',
    title: 'Contact Intercepted',
    description: 'Coast Guard / Coastal Police patrol interceptor arrives at breakwater jetty.',
    contactId: 'C-1042',
    severity: 'INFO',
  },
];

class ScenarioDirector {
  private currentTimeSec = 0;
  private triggeredMilestones = new Set<string>();

  reset() {
    this.currentTimeSec = 0;
    this.triggeredMilestones.clear();
  }

  getCurrentTime(): number {
    return this.currentTimeSec;
  }

  /**
   * Advances the scenario to a specific video timeSec, triggering deterministic events.
   */
  advanceToTime(timeSec: number) {
    this.currentTimeSec = timeSec;

    // Update global telemetry bus so map and HUD move with the video
    telemetryBus.updateTime(timeSec);

    // If seeking backwards, allow re-triggering of forward milestones
    VIZHINJAM_SCENARIO_MILESTONES.forEach(m => {
      const key = `${m.timeSec}-${m.type}`;
      if (timeSec < m.timeSec && this.triggeredMilestones.has(key)) {
        this.triggeredMilestones.delete(key);
      }
    });

    // Evaluate newly reached milestones
    VIZHINJAM_SCENARIO_MILESTONES.forEach(m => {
      const key = `${m.timeSec}-${m.type}`;
      if (timeSec >= m.timeSec && !this.triggeredMilestones.has(key)) {
        this.triggeredMilestones.add(key);
        this.executeMilestone(m);
      }
    });
  }

  private executeMilestone(m: ScenarioMilestone) {
    const alertStore = useAlertStore.getState();

    if (m.type === 'ALERT_RAISED' && m.alertCode) {
      // Find the primary seeded alert
      const targetAlert = ALERTS.find(a => a.alertCode === m.alertCode) ?? ALERTS[0];
      const freshAlert: Alert = {
        ...targetAlert,
        status: 'NEW',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      alertStore.addAlert(freshAlert);
      simulator.emit({ type: 'ALERT_NEW', payload: freshAlert });
    } else if (m.type === 'FEED_LAG') {
      simulator.emit({
        type: 'FEED_UPDATE',
        payload: {
          id: 'f-07',
          label: 'Vizhinjam Edge Secondary',
          uavCode: formatUavCode(4),
          missionCode: formatMissionId('VIZHINJAM', '0830', 2),
          modality: 'RGB',
          state: 'EDGE_SYNC_LAG',
          edgeSyncLagSec: 12,
          lastFrameAt: new Date().toISOString(),
        },
      });
    }
  }

  getActiveMilestones(): ScenarioMilestone[] {
    return VIZHINJAM_SCENARIO_MILESTONES.filter(m => this.currentTimeSec >= m.timeSec);
  }
}

export const scenarioDirector = new ScenarioDirector();

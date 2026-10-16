// ============================================================
// SmartQEye Coastal — Sidecar Replay Engine
// Binary search time-lookup, smooth box interpolation, and synthetic sidecar generator
// ============================================================

import type { SidecarData, FrameData, BoundingBox, TelemetryPoint, ScenarioMilestone } from '@/types/sidecar';
import { getSimulatedBoxes, getSimulatedCfsState } from '@/lib/proceduralSea';
import { generateProceduralTelemetry } from '@/lib/telemetry';
import { formatAlertId, formatMissionId, formatUavCode } from '@/lib/idGenerator';

/**
 * Binary search to find the closest FrameData for given timeSec.
 */
export function findFrameAtTime(frames: FrameData[], timeSec: number): FrameData | null {
  if (!frames || frames.length === 0) return null;

  let low = 0;
  let high = frames.length - 1;

  if (timeSec <= frames[0].timeSec) return frames[0];
  if (timeSec >= frames[high].timeSec) return frames[high];

  while (low <= high) {
    const mid = (low + high) >> 1;
    const midTime = frames[mid].timeSec;

    if (midTime === timeSec) {
      return frames[mid];
    } else if (midTime < timeSec) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  // Choose closer of frames[high] and frames[low]
  const prev = frames[high];
  const next = frames[low] ?? frames[high];
  return Math.abs(timeSec - prev.timeSec) <= Math.abs(next.timeSec - timeSec) ? prev : next;
}

/**
 * Linearly interpolates two bounding boxes by trackId.
 */
export function interpolateBoxes(prevBoxes: BoundingBox[], nextBoxes: BoundingBox[], alpha: number): BoundingBox[] {
  if (alpha <= 0.05) return prevBoxes;
  if (alpha >= 0.95) return nextBoxes;

  const nextMap = new Map<string, BoundingBox>();
  nextBoxes.forEach(b => nextMap.set(String(b.trackId), b));

  return prevBoxes.map(pb => {
    const nb = nextMap.get(String(pb.trackId));
    if (!nb) return pb;

    // Interpolate coordinates
    const bbox: [number, number, number, number] = [
      pb.bbox[0] + (nb.bbox[0] - pb.bbox[0]) * alpha,
      pb.bbox[1] + (nb.bbox[1] - pb.bbox[1]) * alpha,
      pb.bbox[2] + (nb.bbox[2] - pb.bbox[2]) * alpha,
      pb.bbox[3] + (nb.bbox[3] - pb.bbox[3]) * alpha,
    ];

    return {
      ...pb,
      bbox,
      conf: pb.conf + (nb.conf - pb.conf) * alpha,
      headingDeg: pb.headingDeg !== undefined && nb.headingDeg !== undefined
        ? pb.headingDeg + (nb.headingDeg - pb.headingDeg) * alpha
        : pb.headingDeg,
      speedKnots: pb.speedKnots !== undefined && nb.speedKnots !== undefined
        ? pb.speedKnots + (nb.speedKnots - pb.speedKnots) * alpha
        : pb.speedKnots,
      inZoneBreach: pb.inZoneBreach || nb.inZoneBreach,
    };
  });
}

/**
 * Generates deterministic scenario milestones (Appendix D "Vizhinjam Dawn Patrol").
 */
export function getScenarioMilestones(): ScenarioMilestone[] {
  return [
    {
      timeSec: 0,
      type: 'CONTACT_ACQUIRED',
      title: 'Sortie Commenced',
      description: 'UAV-KL-03 begins sector scan over Vizhinjam Harbour approach at 120m altitude.',
      severity: 'INFO',
    },
    {
      timeSec: 8,
      type: 'CONTACT_ACQUIRED',
      title: 'Contact C-1042 Acquired',
      description: 'High-speed craft detected entering outer approach channel at 18.5 knots. CFS steps to FULL rate.',
      contactId: 'C-1042',
      severity: 'LOW',
    },
    {
      timeSec: 18,
      type: 'ZONE_BREACH',
      title: 'Restricted Zone Perimeter Breached',
      description: 'C-1042 crosses into Zone Z-07 (Vizhinjam Military & Naval Approach) without authorisation.',
      contactId: 'C-1042',
      zoneCode: 'Z-07',
      severity: 'HIGH',
    },
    {
      timeSec: 24,
      type: 'ALERT_RAISED',
      title: 'Operational Alert ALR-20261016-0001 Raised',
      description: 'Intrusion alert raised. CKFE keyframe extraction initiated; human officer confirmation requested.',
      contactId: 'C-1042',
      alertCode: formatAlertId(1),
      severity: 'CRITICAL',
    },
    {
      timeSec: 32,
      type: 'THERMAL_SEGMENT',
      title: 'Thermal Sensor Profile Corroboration',
      description: 'Hot outboard engine exhaust signature confirmed on thermal sensor at breakwater perimeter.',
      contactId: 'C-1042',
      severity: 'HIGH',
    },
    {
      timeSec: 45,
      type: 'CKFE_KEYFRAME',
      title: 'CKFE Evidence Sealed',
      description: '3 keyframes and 90s pre/post roll evidence clip sealed with SHA-256 tamper-evident digest.',
      alertCode: formatAlertId(1),
      severity: 'CRITICAL',
    },
    {
      timeSec: 60,
      type: 'FEED_LAG',
      title: 'Secondary Node Sync Lag',
      description: 'Auxiliary station node reports 12s sync lag; central GPU Node A retains primary custody.',
      severity: 'MEDIUM',
    },
    {
      timeSec: 75,
      type: 'CONTACT_LOST',
      title: 'Contact Intercepted & Stationary',
      description: 'Patrol boat intercepts C-1042 at breakwater jetty; craft speed dropped to 0.0 knots.',
      contactId: 'C-1042',
      severity: 'INFO',
    },
  ];
}

/**
 * Creates a synthetic, high-fidelity SidecarData object (for fallback or procedural scenes).
 */
export function createSyntheticSidecar(durationSec = 120, fps = 25): SidecarData {
  const totalFrames = Math.floor(durationSec * fps);
  const frames: FrameData[] = [];
  const telemetryTrack: TelemetryPoint[] = [];

  // Generate 1 sample per frame (or every 0.2s for efficiency)
  const stepSec = 0.2;
  for (let t = 0; t <= durationSec; t += stepSec) {
    const timeSec = Math.round(t * 10) / 10;
    const boxes = getSimulatedBoxes(timeSec);
    const cfs = getSimulatedCfsState(timeSec);
    const telemetry = generateProceduralTelemetry(timeSec);

    frames.push({
      timeSec,
      frameIndex: Math.floor(timeSec * fps),
      boxes,
      cfs,
      telemetry,
    });

    telemetryTrack.push(telemetry);
  }

  return {
    version: '1.2.0-coastal',
    sceneName: 'vizhinjam_patrol',
    durationSec,
    videoFps: fps,
    videoWidth: 1280,
    videoHeight: 720,
    uavCode: formatUavCode(3),
    missionCode: formatMissionId('VIZHINJAM', '0830', 1),
    detectorModel: 'RTMDet-L (MMDetection, Apache-2.0)',
    trackerModel: 'ByteTrack (MIT)',
    frames,
    telemetryTrack,
    events: getScenarioMilestones(),
  };
}

/**
 * Asynchronously loads sidecar JSON from URL, falling back to synthetic sidecar.
 */
export async function loadSidecarData(sceneName: string): Promise<SidecarData> {
  try {
    const res = await fetch(`/demo/${sceneName}.detections.json`);
    if (res.ok) {
      const data = (await res.json()) as SidecarData;
      return data;
    }
  } catch {
    // Fall back to synthetic sidecar
  }

  return createSyntheticSidecar(120);
}

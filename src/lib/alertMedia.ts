// ============================================================
// SmartQEye Coastal — Alert Media & Keyframe Mapping
// Maps each event type to video and keyframes from disk
// ============================================================

export interface KeyframeItem {
  id: string;
  url: string;
  label: string;
  timestampOffsetSec: number;
  sha256: string;
}

export interface EventMediaConfig {
  videoUrl: string;
  keyframes: KeyframeItem[];
}

export function getAlertMedia(eventType: string): EventMediaConfig {
  const norm = (eventType || '').toLowerCase();

  switch (norm) {
    case 'intrusion':
      return {
        videoUrl: '/videos/Alerts Page Video/Intrusion.mp4',
        keyframes: [
          {
            id: 'kf-int-1',
            url: '/videos/Alerts Page KEYFRAMES/Intrusion 1.png',
            label: 'Initial Boundary Crossing Detection',
            timestampOffsetSec: 12,
            sha256: '9a3f2b8c1d4e7f0a2b5c8d1e4f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8f1a',
          },
          {
            id: 'kf-int-2',
            url: '/videos/Alerts Page KEYFRAMES/Intrusion 2.png',
            label: 'Vector Track & Restricted Perimeter Penetration',
            timestampOffsetSec: 28,
            sha256: '3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8f1a9a3f2b8c1d4e7f0a2b5c8d1e4f7a0b',
          },
          {
            id: 'kf-int-3',
            url: '/videos/Alerts Page KEYFRAMES/Intrusion 3.png',
            label: 'Terminal Visual Confirmation & Intercept Vector',
            timestampOffsetSec: 45,
            sha256: '5a8b1c4d7e0f3a6b9c2d5e8f1a9a3f2b8c1d4e7f0a2b5c8d1e4f7a0b3c6d9e2f',
          },
        ],
      };

    case 'zone_entry':
    case 'recurring_zone_entry':
      return {
        videoUrl: '/videos/Alerts Page Video/Zone Entry.mp4',
        keyframes: [
          {
            id: 'kf-ze-1',
            url: '/videos/Alerts Page KEYFRAMES/Zone Entry 1.png',
            label: 'Zone Entry Marker 1 — Sector Transition',
            timestampOffsetSec: 10,
            sha256: '7b2a9f1c4e8d3a6b5c0d2e9f4a1b8c3d6e0f5a7b2c9d1e4f8a3b6c0d2e5f9a1b',
          },
          {
            id: 'kf-ze-2',
            url: '/videos/Alerts Page KEYFRAMES/Zone Entry 2.png',
            label: 'Zone Entry Marker 2 — Deep Perimeter Transit',
            timestampOffsetSec: 25,
            sha256: '1e4f8a3b6c0d2e5f9a1b7b2a9f1c4e8d3a6b5c0d2e9f4a1b8c3d6e0f5a7b2c9d',
          },
          {
            id: 'kf-ze-3',
            url: '/videos/Alerts Page KEYFRAMES/Zone Entry 3.png',
            label: 'Zone Entry Marker 3 — Coastal Channel Incursion',
            timestampOffsetSec: 42,
            sha256: '2c9d1e4f8a3b6c0d2e5f9a1b7b2a9f1c4e8d3a6b5c0d2e9f4a1b8c3d6e0f5a7b',
          },
        ],
      };

    case 'vessel_detected':
      return {
        videoUrl: '/videos/Alerts Page Video/Vessel Detected.mp4',
        keyframes: [
          {
            id: 'kf-vd-1',
            url: '/videos/Alerts Page KEYFRAMES/Vessel Detected 1.png',
            label: 'Vessel Classification & Optical Signature',
            timestampOffsetSec: 8,
            sha256: '6f0a2b5c8d1e4f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8f1a9a3f2b8c1d4e',
          },
          {
            id: 'kf-vd-2',
            url: '/videos/Alerts Page KEYFRAMES/Vessel Detected 2.png',
            label: 'Vessel Track Continuity & Heading Vector',
            timestampOffsetSec: 18,
            sha256: '4d7e0f3a6b9c2d5e8f1a9a3f2b8c1d4e6f0a2b5c8d1e4f7a0b3c6d9e2f5a8b1c',
          },
          {
            id: 'kf-vd-3',
            url: '/videos/Alerts Page KEYFRAMES/Vessel Detected 3.png',
            label: 'Kinematic Profile & Speed Estimation',
            timestampOffsetSec: 30,
            sha256: '8c1d4e6f0a2b5c8d1e4f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8f1a9a3f2b',
          },
        ],
      };

    case 'course_speed_change':
      return {
        videoUrl: '/videos/Alerts Page Video/Course  Speed Change.mp4',
        keyframes: [
          {
            id: 'kf-cs-1',
            url: '/videos/Alerts Page KEYFRAMES/Course  Speed Change 1.png',
            label: 'Course Change Initiated',
            timestampOffsetSec: 14,
            sha256: '8b3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8f1a9a3f2b8c1d4e7f0a2b5c8d1e4f7a',
          },
          {
            id: 'kf-cs-2',
            url: '/videos/Alerts Page KEYFRAMES/Course  Speed Change 2.png',
            label: 'Speed Surge Observed in Restricted Corridor',
            timestampOffsetSec: 32,
            sha256: '0a2b5c8d1e4f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8f1a9a3f2b8c1d4e7f',
          },
          {
            id: 'kf-cs-3',
            url: '/videos/Alerts Page KEYFRAMES/Course  Speed Change 3.png',
            label: 'Anomalous Heading Stabilized Post-Manoeuvre',
            timestampOffsetSec: 50,
            sha256: '2d5e8f1a9a3f2b8c1d4e7f0a2b5c8d1e4f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c',
          },
        ],
      };

    case 'crowd_threshold_exceeded':
      return {
        videoUrl: '/videos/Alerts Page Video/Crowd Threshold Exceeded.mp4',
        keyframes: [
          {
            id: 'kf-ct-1',
            url: '/videos/Alerts Page KEYFRAMES/Crowd Threshold Exceeded 1.png',
            label: 'Crowd Accumulation Onset',
            timestampOffsetSec: 10,
            sha256: '5f9a1b7b2a9f1c4e8d3a6b5c0d2e9f4a1b8c3d6e0f5a7b2c9d1e4f8a3b6c0d2e',
          },
          {
            id: 'kf-ct-2',
            url: '/videos/Alerts Page KEYFRAMES/Crowd Threshold Exceeded 2.png',
            label: 'Threshold Breach Detected',
            timestampOffsetSec: 25,
            sha256: '4a1b8c3d6e0f5a7b2c9d1e4f8a3b6c0d2e5f9a1b7b2a9f1c4e8d3a6b5c0d2e9f',
          },
          {
            id: 'kf-ct-3',
            url: '/videos/Alerts Page KEYFRAMES/Crowd Threshold Exceeded 3.png',
            label: 'Density Saturation Peak',
            timestampOffsetSec: 40,
            sha256: '3d6e0f5a7b2c9d1e4f8a3b6c0d2e5f9a1b7b2a9f1c4e8d3a6b5c0d2e9f4a1b8c',
          },
        ],
      };

    default:
      return {
        videoUrl: '/videos/Alerts Page Video/Intrusion.mp4',
        keyframes: [
          {
            id: 'kf-def-1',
            url: '/videos/Alerts Page KEYFRAMES/Intrusion 1.png',
            label: 'Surveillance Keyframe 1',
            timestampOffsetSec: 10,
            sha256: '9a3f2b8c1d4e7f0a2b5c8d1e4f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8f1a',
          },
          {
            id: 'kf-def-2',
            url: '/videos/Alerts Page KEYFRAMES/Intrusion 2.png',
            label: 'Surveillance Keyframe 2',
            timestampOffsetSec: 25,
            sha256: '3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8f1a9a3f2b8c1d4e7f0a2b5c8d1e4f7a0b',
          },
          {
            id: 'kf-def-3',
            url: '/videos/Alerts Page KEYFRAMES/Intrusion 3.png',
            label: 'Surveillance Keyframe 3',
            timestampOffsetSec: 40,
            sha256: '5a8b1c4d7e0f3a6b9c2d5e8f1a9a3f2b8c1d4e7f0a2b5c8d1e4f7a0b3c6d9e2f',
          },
        ],
      };
  }
}

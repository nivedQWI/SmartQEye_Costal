import { describe, it, expect } from 'vitest';
import { findFrameAtTime, interpolateBoxes } from '@/lib/replay';
import type { FrameData, BoundingBox } from '@/types/sidecar';

describe('Sidecar Replay Engine (src/lib/replay)', () => {
  const mockFrames: FrameData[] = [
    {
      frameIndex: 0,
      timeSec: 0.0,
      boxes: [
        {
          id: 'b-0',
          trackId: 101,
          contactId: 'C-1042',
          class: 'SMALL_CRAFT',
          label: 'Speedboat',
          conf: 0.85,
          bbox: [0.1, 0.1, 0.2, 0.2],
        },
      ],
      cfs: { status: 'LIGHT', rateFps: 12, reasonCode: 'CFS-03', vramSavingsPct: 52 },
    },
    {
      frameIndex: 25,
      timeSec: 1.0,
      boxes: [
        {
          id: 'b-1',
          trackId: 101,
          contactId: 'C-1042',
          class: 'SMALL_CRAFT',
          label: 'Speedboat',
          conf: 0.95,
          bbox: [0.3, 0.3, 0.4, 0.4],
        },
      ],
      cfs: { status: 'FULL', rateFps: 25, reasonCode: 'CFS-01', vramSavingsPct: 0 },
    },
    {
      frameIndex: 50,
      timeSec: 2.0,
      boxes: [],
      cfs: { status: 'SKIP', rateFps: 6, reasonCode: 'CFS-04', vramSavingsPct: 76 },
    },
  ];

  describe('findFrameAtTime', () => {
    it('returns null for empty frames array', () => {
      expect(findFrameAtTime([], 1.0)).toBeNull();
    });

    it('returns exact match when timeSec corresponds to an exact frame', () => {
      const match = findFrameAtTime(mockFrames, 1.0);
      expect(match).not.toBeNull();
      expect(match?.frameIndex).toBe(25);
    });

    it('clamps to boundary frames when requested time is out of range', () => {
      const before = findFrameAtTime(mockFrames, -1.0);
      expect(before?.frameIndex).toBe(0);

      const after = findFrameAtTime(mockFrames, 5.0);
      expect(after?.frameIndex).toBe(50);
    });

    it('finds the nearest frame for intermediary timestamps', () => {
      const nearFirst = findFrameAtTime(mockFrames, 0.3);
      expect(nearFirst?.frameIndex).toBe(0);

      const nearSecond = findFrameAtTime(mockFrames, 0.8);
      expect(nearSecond?.frameIndex).toBe(25);
    });
  });

  describe('interpolateBoxes', () => {
    const boxA: BoundingBox = {
      id: 'box-a',
      trackId: 1,
      class: 'SMALL_CRAFT',
      label: 'Craft A',
      conf: 0.8,
      bbox: [0.1, 0.1, 0.3, 0.3],
      headingDeg: 100,
    };

    const boxB: BoundingBox = {
      id: 'box-b',
      trackId: 1,
      class: 'SMALL_CRAFT',
      label: 'Craft A',
      conf: 0.9,
      bbox: [0.2, 0.2, 0.4, 0.4],
      headingDeg: 120,
    };

    it('returns prevBoxes when alpha <= 0.05', () => {
      const result = interpolateBoxes([boxA], [boxB], 0.02);
      expect(result).toEqual([boxA]);
    });

    it('returns nextBoxes when alpha >= 0.95', () => {
      const result = interpolateBoxes([boxA], [boxB], 0.98);
      expect(result).toEqual([boxB]);
    });

    it('smoothly interpolates coordinates, confidence, and heading at midpoint alpha = 0.5', () => {
      const result = interpolateBoxes([boxA], [boxB], 0.5);
      expect(result).toHaveLength(1);
      const interpolated = result[0];

      expect(interpolated.bbox[0]).toBeCloseTo(0.15);
      expect(interpolated.bbox[1]).toBeCloseTo(0.15);
      expect(interpolated.bbox[2]).toBeCloseTo(0.35);
      expect(interpolated.bbox[3]).toBeCloseTo(0.35);
      expect(interpolated.conf).toBeCloseTo(0.85);
      expect(interpolated.headingDeg).toBeCloseTo(110);
    });
  });
});

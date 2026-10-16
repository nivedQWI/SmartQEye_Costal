import { describe, it, expect } from 'vitest';
import {
  formatCoords,
  formatDeg,
  formatPct,
  formatBytes,
  formatDuration,
  truncateSha,
  eventTypeLabel,
  isSeverity,
  cn,
} from '@/lib/utils';

describe('Utility Functions (src/lib/utils)', () => {
  describe('formatCoords', () => {
    it('formats positive lat and lon as N and E with 5 decimals', () => {
      const formatted = formatCoords(8.37321, 76.97412);
      expect(formatted).toBe('8.37321°N 76.97412°E');
    });

    it('formats negative lat and lon as S and W', () => {
      const formatted = formatCoords(-12.34567, -45.67891);
      expect(formatted).toBe('12.34567°S 45.67891°W');
    });
  });

  describe('formatDeg', () => {
    it('formats headings with padded 3 digits and degree symbol', () => {
      expect(formatDeg(7)).toBe('007°');
      expect(formatDeg(42)).toBe('042°');
      expect(formatDeg(180)).toBe('180°');
    });
  });

  describe('formatPct', () => {
    it('rounds and adds percentage sign', () => {
      expect(formatPct(42.4)).toBe('42%');
      expect(formatPct(99.6)).toBe('100%');
    });
  });

  describe('formatBytes', () => {
    it('formats bytes, KB, MB, and GB accurately', () => {
      expect(formatBytes(500)).toBe('500 B');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1048576 * 2.5)).toBe('2.5 MB');
      expect(formatBytes(1073741824 * 3.125)).toBe('3.13 GB');
    });
  });

  describe('formatDuration', () => {
    it('formats seconds into mm:ss or hh:mm:ss', () => {
      expect(formatDuration(45)).toBe('0:45');
      expect(formatDuration(75)).toBe('1:15');
      expect(formatDuration(3665)).toBe('1:01:05');
    });
  });

  describe('truncateSha', () => {
    it('truncates hash to specified length with ellipsis', () => {
      const hash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      expect(truncateSha(hash, 8)).toBe('e3b0c442…');
      expect(truncateSha(hash, 12)).toBe('e3b0c44298fc…');
    });
  });

  describe('eventTypeLabel', () => {
    it('maps known operational event keys to human labels', () => {
      expect(eventTypeLabel('zone_entry')).toBe('Zone Entry');
      expect(eventTypeLabel('intrusion')).toBe('Intrusion');
      expect(eventTypeLabel('abandoned_object')).toBe('Abandoned Object');
      expect(eventTypeLabel('unknown_custom_event')).toBe('unknown_custom_event');
    });
  });

  describe('isSeverity', () => {
    it('validates Kerala coastal surveillance severity levels', () => {
      expect(isSeverity('INFO')).toBe(true);
      expect(isSeverity('LOW')).toBe(true);
      expect(isSeverity('MEDIUM')).toBe(true);
      expect(isSeverity('HIGH')).toBe(true);
      expect(isSeverity('CRITICAL')).toBe(true);
      expect(isSeverity('INVALID')).toBe(false);
    });
  });

  describe('cn (Tailwind class merger)', () => {
    it('merges class names and resolves conflicts', () => {
      const res = cn('p-2 text-white', false && 'hidden', 'p-4');
      expect(res).toBe('text-white p-4');
    });
  });
});

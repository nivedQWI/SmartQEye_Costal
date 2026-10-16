import { describe, it, expect, beforeEach } from 'vitest';
import {
  scenarioDirector,
  VIZHINJAM_SCENARIO_MILESTONES,
  SCENARIO_NAME,
  SCENARIO_UAV,
} from '@/lib/scenario';

describe('Scenario Director (src/lib/scenario)', () => {
  beforeEach(() => {
    scenarioDirector.reset();
  });

  it('initialises with deterministic metadata and milestones', () => {
    expect(SCENARIO_NAME).toBe('Vizhinjam Dawn Patrol');
    expect(SCENARIO_UAV).toBe('UAV-KL-03');
    expect(VIZHINJAM_SCENARIO_MILESTONES.length).toBeGreaterThan(0);
  });

  it('tracks time progression and advances cleanly', () => {
    expect(scenarioDirector.getCurrentTime()).toBe(0);
    scenarioDirector.advanceToTime(10);
    expect(scenarioDirector.getCurrentTime()).toBe(10);
  });

  it('returns active milestones matching the current playback time', () => {
    scenarioDirector.advanceToTime(5);
    const initialMilestones = scenarioDirector.getActiveMilestones();
    // At t=5s, milestone 0s should be active, but 8s should not
    expect(initialMilestones.some(m => m.timeSec === 0)).toBe(true);
    expect(initialMilestones.some(m => m.timeSec === 8)).toBe(false);

    scenarioDirector.advanceToTime(25);
    const midMilestones = scenarioDirector.getActiveMilestones();
    // At t=25s, milestones 0s, 8s, 18s, 24s should be active
    expect(midMilestones.some(m => m.timeSec === 18)).toBe(true);
    expect(midMilestones.some(m => m.timeSec === 24)).toBe(true);
    expect(midMilestones.some(m => m.timeSec === 60)).toBe(false);
  });

  it('resets correctly back to t=0', () => {
    scenarioDirector.advanceToTime(50);
    expect(scenarioDirector.getCurrentTime()).toBe(50);

    scenarioDirector.reset();
    expect(scenarioDirector.getCurrentTime()).toBe(0);
    expect(scenarioDirector.getActiveMilestones().length).toBe(1); // t=0 milestone
  });
});

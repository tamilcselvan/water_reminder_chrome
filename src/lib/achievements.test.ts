import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS, findNewUnlocks } from './achievements';

describe('ACHIEVEMENTS catalog', () => {
  it('has unique ids', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('findNewUnlocks', () => {
  it('unlocks first-drop on the first log', () => {
    const stats = { totalLogsCount: 1, currentStreak: 0, longestStreak: 0 };
    const unlocked = findNewUnlocks(stats, new Set());
    expect(unlocked.map((a) => a.id)).toContain('first-drop');
  });

  it('does not re-unlock an already-unlocked achievement', () => {
    const stats = { totalLogsCount: 1, currentStreak: 0, longestStreak: 0 };
    const unlocked = findNewUnlocks(stats, new Set(['first-drop']));
    expect(unlocked.map((a) => a.id)).not.toContain('first-drop');
  });

  it('unlocks streak achievements at their thresholds', () => {
    const stats = { totalLogsCount: 10, currentStreak: 7, longestStreak: 7 };
    const unlocked = findNewUnlocks(stats, new Set());
    const ids = unlocked.map((a) => a.id);
    expect(ids).toContain('streak-3');
    expect(ids).toContain('streak-7');
    expect(ids).not.toContain('streak-30');
  });

  it('unlocks nothing new when stats are below every remaining threshold', () => {
    const stats = { totalLogsCount: 1, currentStreak: 1, longestStreak: 1 };
    const already = new Set(ACHIEVEMENTS.map((a) => a.id).filter((id) => id === 'century-club' || id === 'streak-7' || id === 'streak-30' || id === 'streak-3'));
    const unlocked = findNewUnlocks(stats, already);
    expect(unlocked.map((a) => a.id)).toEqual(['first-drop']);
  });
});

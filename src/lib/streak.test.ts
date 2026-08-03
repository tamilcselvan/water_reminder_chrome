import { describe, it, expect } from 'vitest';
import { applyGoalMetToday, applyDayRollover } from './streak';
import { DEFAULT_STREAK } from './types';

describe('applyGoalMetToday', () => {
  it('starts a streak of 1 from no history', () => {
    const result = applyGoalMetToday(DEFAULT_STREAK, '2026-03-05');
    expect(result).toEqual({ currentStreak: 1, longestStreak: 1, lastGoalMetDateKey: '2026-03-05' });
  });

  it('extends a consecutive-day streak', () => {
    const streak = { currentStreak: 2, longestStreak: 2, lastGoalMetDateKey: '2026-03-04' };
    const result = applyGoalMetToday(streak, '2026-03-05');
    expect(result).toEqual({ currentStreak: 3, longestStreak: 3, lastGoalMetDateKey: '2026-03-05' });
  });

  it('resets to 1 after a gap day', () => {
    const streak = { currentStreak: 5, longestStreak: 5, lastGoalMetDateKey: '2026-03-01' };
    const result = applyGoalMetToday(streak, '2026-03-05');
    expect(result).toEqual({ currentStreak: 1, longestStreak: 5, lastGoalMetDateKey: '2026-03-05' });
  });

  it('is a no-op if today was already counted', () => {
    const streak = { currentStreak: 3, longestStreak: 3, lastGoalMetDateKey: '2026-03-05' };
    expect(applyGoalMetToday(streak, '2026-03-05')).toEqual(streak);
  });

  it('keeps the higher longestStreak on a new personal best', () => {
    const streak = { currentStreak: 2, longestStreak: 10, lastGoalMetDateKey: '2026-03-04' };
    const result = applyGoalMetToday(streak, '2026-03-05');
    expect(result.longestStreak).toBe(10);
  });
});

describe('applyDayRollover', () => {
  it('leaves the streak untouched when yesterday met the goal', () => {
    const streak = { currentStreak: 3, longestStreak: 3, lastGoalMetDateKey: '2026-03-04' };
    expect(applyDayRollover(streak, '2026-03-05')).toEqual(streak);
  });

  it('leaves a never-started streak untouched', () => {
    expect(applyDayRollover(DEFAULT_STREAK, '2026-03-05')).toEqual(DEFAULT_STREAK);
  });

  it('resets currentStreak to 0 after a missed day', () => {
    const streak = { currentStreak: 4, longestStreak: 4, lastGoalMetDateKey: '2026-03-02' };
    const result = applyDayRollover(streak, '2026-03-05');
    expect(result).toEqual({ currentStreak: 0, longestStreak: 4, lastGoalMetDateKey: '2026-03-02' });
  });
});

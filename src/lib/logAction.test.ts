import { describe, it, expect, beforeEach } from 'vitest';
import { installChromeMock } from '../testUtils/chromeMock';
import { __resetDBConnectionForTests } from './db';
import { setSettings, setStreak } from './storage';
import { DEFAULT_SETTINGS } from './types';
import { logDrink } from './logAction';

beforeEach(async () => {
  installChromeMock();
  __resetDBConnectionForTests();
  await indexedDB.deleteDatabase('hydro-db');
});

describe('logDrink', () => {
  it('records the amount and updates today’s total', async () => {
    await setSettings({ ...DEFAULT_SETTINGS, dailyGoalMl: 2000 });
    const now = new Date(2026, 2, 5, 10, 0).getTime();
    const result = await logDrink(250, now);
    expect(result.todayCache.totalMl).toBe(250);
    expect(result.todayCache.goalMetAt).toBeNull();
  });

  it('marks the goal met once the total reaches dailyGoalMl and starts a streak', async () => {
    await setSettings({ ...DEFAULT_SETTINGS, dailyGoalMl: 500 });
    const now = new Date(2026, 2, 5, 10, 0).getTime();
    await logDrink(300, now);
    const result = await logDrink(300, now + 1000);
    expect(result.todayCache.goalMetAt).not.toBeNull();
    expect(result.streak.currentStreak).toBe(1);
  });

  it('does not double-count the streak on repeated logs after the goal is already met', async () => {
    await setSettings({ ...DEFAULT_SETTINGS, dailyGoalMl: 100 });
    const now = new Date(2026, 2, 5, 10, 0).getTime();
    await logDrink(150, now);
    const result = await logDrink(50, now + 1000);
    expect(result.streak.currentStreak).toBe(1);
  });

  it('resets currentStreak on rollover after a missed day before counting today', async () => {
    await setSettings({ ...DEFAULT_SETTINGS, dailyGoalMl: 100 });
    await setStreak({ currentStreak: 4, longestStreak: 4, lastGoalMetDateKey: '2026-03-01' });
    const now = new Date(2026, 2, 5, 10, 0).getTime();
    const result = await logDrink(150, now);
    expect(result.streak.currentStreak).toBe(1);
    expect(result.streak.longestStreak).toBe(4);
  });

  it('unlocks first-drop on the very first log', async () => {
    await setSettings(DEFAULT_SETTINGS);
    const result = await logDrink(100, Date.now());
    expect(result.newlyUnlocked.map((a) => a.id)).toContain('first-drop');
  });

  it('does not re-unlock first-drop on a second log', async () => {
    await setSettings(DEFAULT_SETTINGS);
    const now = Date.now();
    await logDrink(100, now);
    const result = await logDrink(100, now + 1000);
    expect(result.newlyUnlocked.map((a) => a.id)).not.toContain('first-drop');
  });
});

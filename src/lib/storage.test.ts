import { describe, it, expect, beforeEach } from 'vitest';
import { installChromeMock } from '../testUtils/chromeMock';
import { getSettings, setSettings, getTodayCache, setTodayCache, getStreak, setStreak } from './storage';
import { DEFAULT_SETTINGS, DEFAULT_STREAK } from './types';

beforeEach(() => {
  installChromeMock();
});

describe('settings', () => {
  it('returns defaults when nothing stored', async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('persists and returns what was set', async () => {
    const custom = { ...DEFAULT_SETTINGS, dailyGoalMl: 3000 };
    await setSettings(custom);
    expect(await getSettings()).toEqual(custom);
  });
});

describe('todayCache', () => {
  it('returns a fresh zeroed cache for the current day when nothing stored', async () => {
    const now = new Date(2026, 2, 5, 10, 0).getTime();
    const cache = await getTodayCache(now);
    expect(cache).toEqual({ dateKey: '2026-03-05', totalMl: 0, goalMetAt: null });
  });

  it('returns the stored cache when its dateKey matches today', async () => {
    const now = new Date(2026, 2, 5, 10, 0).getTime();
    await setTodayCache({ dateKey: '2026-03-05', totalMl: 500, goalMetAt: null });
    expect(await getTodayCache(now)).toEqual({ dateKey: '2026-03-05', totalMl: 500, goalMetAt: null });
  });

  it('self-corrects to a fresh cache when the stored dateKey is stale', async () => {
    const now = new Date(2026, 2, 6, 1, 0).getTime();
    await setTodayCache({ dateKey: '2026-03-05', totalMl: 1800, goalMetAt: 123 });
    expect(await getTodayCache(now)).toEqual({ dateKey: '2026-03-06', totalMl: 0, goalMetAt: null });
  });
});

describe('streak', () => {
  it('returns defaults when nothing stored', async () => {
    expect(await getStreak()).toEqual(DEFAULT_STREAK);
  });

  it('persists and returns what was set when the stored day is still current', async () => {
    const now = new Date(2026, 2, 5, 10, 0).getTime();
    const custom = { currentStreak: 3, longestStreak: 5, lastGoalMetDateKey: '2026-03-04' };
    await setStreak(custom);
    expect(await getStreak(now)).toEqual(custom);
  });

  it('leaves the streak untouched when the goal was met yesterday', async () => {
    const now = new Date(2026, 2, 5, 10, 0).getTime();
    const custom = { currentStreak: 3, longestStreak: 5, lastGoalMetDateKey: '2026-03-04' };
    await setStreak(custom);
    expect(await getStreak(now)).toEqual(custom);
  });

  it('self-corrects currentStreak to 0 when a day was missed since the last read', async () => {
    const now = new Date(2026, 2, 10, 10, 0).getTime();
    await setStreak({ currentStreak: 4, longestStreak: 4, lastGoalMetDateKey: '2026-03-02' });
    expect(await getStreak(now)).toEqual({
      currentStreak: 0,
      longestStreak: 4,
      lastGoalMetDateKey: '2026-03-02',
    });
  });
});

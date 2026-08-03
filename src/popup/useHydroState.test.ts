import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { installChromeMock } from '../testUtils/chromeMock';
import { setSettings, setTodayCache, setStreak } from '../lib/storage';
import { DEFAULT_SETTINGS } from '../lib/types';
import { todayDateKey, previousDateKey } from '../lib/dateUtils';
import { useHydroState } from './useHydroState';

beforeEach(() => {
  installChromeMock();
});

describe('useHydroState', () => {
  it('loads settings, todayCache, and streak on mount', async () => {
    const yesterday = previousDateKey(todayDateKey());
    await setSettings({ ...DEFAULT_SETTINGS, dailyGoalMl: 3000 });
    await setTodayCache({ dateKey: todayDateKey(), totalMl: 750, goalMetAt: null });
    await setStreak({ currentStreak: 2, longestStreak: 4, lastGoalMetDateKey: yesterday });

    const { result } = renderHook(() => useHydroState());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.settings.dailyGoalMl).toBe(3000);
    expect(result.current.todayCache.totalMl).toBe(750);
    expect(result.current.streak.currentStreak).toBe(2);
  });

  it('self-corrects a stale streak after a missed day, without waiting for a new log', async () => {
    // Regression test for the popup showing a stale streak after a missed day: the
    // fixture's lastGoalMetDateKey is many months before "today", so opening the popup
    // should immediately reflect the reset streak rather than the old stored value.
    await setSettings(DEFAULT_SETTINGS);
    await setTodayCache({ dateKey: todayDateKey(), totalMl: 0, goalMetAt: null });
    await setStreak({ currentStreak: 5, longestStreak: 5, lastGoalMetDateKey: '2026-03-04' });

    const { result } = renderHook(() => useHydroState());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.streak.currentStreak).toBe(0);
    expect(result.current.streak.longestStreak).toBe(5);
  });

  it('refresh() re-reads the latest stored values', async () => {
    await setSettings(DEFAULT_SETTINGS);
    const { result } = renderHook(() => useHydroState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await setTodayCache({ dateKey: todayDateKey(), totalMl: 900, goalMetAt: null });
    await result.current.refresh();

    await waitFor(() => expect(result.current.todayCache.totalMl).toBe(900));
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { installChromeMock } from '../testUtils/chromeMock';
import { setSettings, setTodayCache, setStreak } from '../lib/storage';
import { DEFAULT_SETTINGS } from '../lib/types';
import { todayDateKey } from '../lib/dateUtils';
import { useHydroState } from './useHydroState';

beforeEach(() => {
  installChromeMock();
});

describe('useHydroState', () => {
  it('loads settings, todayCache, and streak on mount', async () => {
    await setSettings({ ...DEFAULT_SETTINGS, dailyGoalMl: 3000 });
    await setTodayCache({ dateKey: todayDateKey(), totalMl: 750, goalMetAt: null });
    await setStreak({ currentStreak: 2, longestStreak: 4, lastGoalMetDateKey: '2026-03-04' });

    const { result } = renderHook(() => useHydroState());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.settings.dailyGoalMl).toBe(3000);
    expect(result.current.todayCache.totalMl).toBe(750);
    expect(result.current.streak.currentStreak).toBe(2);
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

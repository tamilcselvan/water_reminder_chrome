import { useCallback, useEffect, useState } from 'react';
import { getSettings, getTodayCache, getStreak } from '../lib/storage';
import { DEFAULT_SETTINGS, DEFAULT_STREAK, Settings, TodayCache, StreakState } from '../lib/types';

export interface HydroState {
  settings: Settings;
  todayCache: TodayCache;
  streak: StreakState;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useHydroState(): HydroState {
  const [settings, setSettingsState] = useState<Settings | null>(null);
  const [todayCache, setTodayCacheState] = useState<TodayCache | null>(null);
  const [streak, setStreakState] = useState<StreakState | null>(null);

  const refresh = useCallback(async () => {
    const [s, t, st] = await Promise.all([getSettings(), getTodayCache(), getStreak()]);
    setSettingsState(s);
    setTodayCacheState(t);
    setStreakState(st);
  }, []);

  useEffect(() => {
    refresh();
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area === 'local' && (changes.settings || changes.todayCache || changes.streak)) {
        refresh();
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [refresh]);

  return {
    settings: settings ?? DEFAULT_SETTINGS,
    todayCache: todayCache ?? { dateKey: '', totalMl: 0, goalMetAt: null },
    streak: streak ?? DEFAULT_STREAK,
    loading: settings === null || todayCache === null || streak === null,
    refresh,
  };
}

import { Settings, TodayCache, StreakState, DEFAULT_SETTINGS, DEFAULT_STREAK } from './types';
import { todayDateKey } from './dateUtils';
import { applyDayRollover } from './streak';

const KEYS = { settings: 'settings', todayCache: 'todayCache', streak: 'streak' } as const;

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...(result[KEYS.settings] as Partial<Settings> | undefined) };
}

export async function setSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [KEYS.settings]: settings });
}

export async function getTodayCache(now: number = Date.now()): Promise<TodayCache> {
  const result = await chrome.storage.local.get(KEYS.todayCache);
  const cached = result[KEYS.todayCache] as TodayCache | undefined;
  const currentKey = todayDateKey(now);
  if (!cached || cached.dateKey !== currentKey) {
    return { dateKey: currentKey, totalMl: 0, goalMetAt: null };
  }
  return cached;
}

export async function setTodayCache(cache: TodayCache): Promise<void> {
  await chrome.storage.local.set({ [KEYS.todayCache]: cache });
}

export async function getStreak(now: number = Date.now()): Promise<StreakState> {
  const result = await chrome.storage.local.get(KEYS.streak);
  const stored: StreakState = {
    ...DEFAULT_STREAK,
    ...(result[KEYS.streak] as Partial<StreakState> | undefined),
  };
  return applyDayRollover(stored, todayDateKey(now));
}

export async function setStreak(streak: StreakState): Promise<void> {
  await chrome.storage.local.set({ [KEYS.streak]: streak });
}

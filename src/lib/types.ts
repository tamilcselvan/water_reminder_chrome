export type Units = 'ml' | 'oz';

export interface ActiveHours {
  startMinutes: number;
  endMinutes: number;
}

export interface Settings {
  dailyGoalMl: number;
  intervalMinutes: number;
  units: Units;
  activeHours: ActiveHours | null;
  notificationsEnabled: boolean;
}

export interface TodayCache {
  dateKey: string;
  totalMl: number;
  goalMetAt: number | null;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastGoalMetDateKey: string | null;
}

export interface LogEntry {
  id: number;
  timestampMs: number;
  amountMl: number;
}

export interface AchievementRecord {
  id: string;
  unlockedAtMs: number;
}

export const DEFAULT_SETTINGS: Settings = {
  dailyGoalMl: 2000,
  intervalMinutes: 60,
  units: 'ml',
  activeHours: null,
  notificationsEnabled: true,
};

export const DEFAULT_STREAK: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastGoalMetDateKey: null,
};

export const MIN_INTERVAL_MINUTES = 5;
export const MIN_AMOUNT_ML = 1;
export const MAX_AMOUNT_ML = 5000;

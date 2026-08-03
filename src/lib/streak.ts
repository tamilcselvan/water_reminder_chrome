import { StreakState } from './types';
import { previousDateKey } from './dateUtils';

export function applyGoalMetToday(streak: StreakState, todayKey: string): StreakState {
  if (streak.lastGoalMetDateKey === todayKey) return streak;
  const isConsecutive = streak.lastGoalMetDateKey === previousDateKey(todayKey);
  const currentStreak = isConsecutive ? streak.currentStreak + 1 : 1;
  return {
    currentStreak,
    longestStreak: Math.max(streak.longestStreak, currentStreak),
    lastGoalMetDateKey: todayKey,
  };
}

export function applyDayRollover(streak: StreakState, newTodayKey: string): StreakState {
  if (streak.lastGoalMetDateKey === null) return streak;
  const yesterdayKey = previousDateKey(newTodayKey);
  if (streak.lastGoalMetDateKey === yesterdayKey) return streak;
  return { ...streak, currentStreak: 0 };
}

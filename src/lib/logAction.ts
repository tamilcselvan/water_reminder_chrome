import { addLog, getAllLogs, getAchievements, addAchievement } from './db';
import { getSettings, getTodayCache, setTodayCache, getStreak, setStreak } from './storage';
import { computeTotalMl, isGoalMet } from './goal';
import { applyGoalMetToday, applyDayRollover } from './streak';
import { findNewUnlocks, AchievementDef } from './achievements';
import { todayDateKey } from './dateUtils';
import { TodayCache, StreakState } from './types';

export interface LogDrinkResult {
  todayCache: TodayCache;
  streak: StreakState;
  newlyUnlocked: AchievementDef[];
}

export async function logDrink(amountMl: number, now: number = Date.now()): Promise<LogDrinkResult> {
  await addLog({ timestampMs: now, amountMl });

  const todayKey = todayDateKey(now);
  const settings = await getSettings();
  let streak = applyDayRollover(await getStreak(), todayKey);

  const allLogs = await getAllLogs();
  const todayTotal = computeTotalMl(allLogs.filter((l) => todayDateKey(l.timestampMs) === todayKey));
  const goalMet = isGoalMet(todayTotal, settings.dailyGoalMl);

  const previousCache = await getTodayCache(now);
  const todayCache: TodayCache = {
    dateKey: todayKey,
    totalMl: todayTotal,
    goalMetAt: goalMet ? (previousCache.goalMetAt ?? now) : null,
  };
  await setTodayCache(todayCache);

  if (goalMet && streak.lastGoalMetDateKey !== todayKey) {
    streak = applyGoalMetToday(streak, todayKey);
  }
  await setStreak(streak);

  const achievementRecords = await getAchievements();
  const unlockedIds = new Set(achievementRecords.map((a) => a.id));
  const newlyUnlocked = findNewUnlocks(
    {
      totalLogsCount: allLogs.length,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
    },
    unlockedIds,
  );
  for (const achievement of newlyUnlocked) {
    await addAchievement({ id: achievement.id, unlockedAtMs: now });
  }

  return { todayCache, streak, newlyUnlocked };
}

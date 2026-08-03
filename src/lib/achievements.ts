export interface AchievementStats {
  totalLogsCount: number;
  currentStreak: number;
  longestStreak: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  isUnlocked: (stats: AchievementStats) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-drop',
    title: 'First Drop',
    description: 'Log your first glass of water.',
    isUnlocked: (s) => s.totalLogsCount >= 1,
  },
  {
    id: 'century-club',
    title: 'Century Club',
    description: 'Log 100 glasses of water.',
    isUnlocked: (s) => s.totalLogsCount >= 100,
  },
  {
    id: 'streak-3',
    title: 'Building Momentum',
    description: 'Hit a 3-day streak.',
    isUnlocked: (s) => s.currentStreak >= 3,
  },
  {
    id: 'streak-7',
    title: 'Week of Waves',
    description: 'Hit a 7-day streak.',
    isUnlocked: (s) => s.currentStreak >= 7,
  },
  {
    id: 'streak-30',
    title: 'Tidal Habit',
    description: 'Hit a 30-day streak.',
    isUnlocked: (s) => s.currentStreak >= 30,
  },
];

export function findNewUnlocks(
  stats: AchievementStats,
  alreadyUnlockedIds: Set<string>,
): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => !alreadyUnlockedIds.has(a.id) && a.isUnlocked(stats));
}

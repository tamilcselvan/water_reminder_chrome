import { useEffect, useState } from 'react';
import { getAchievements } from '../../lib/db';
import { ACHIEVEMENTS } from '../../lib/achievements';
import { AchievementBadge } from '../components/AchievementBadge';

export function AchievementsView() {
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getAchievements().then((records) => setUnlockedIds(new Set(records.map((r) => r.id))));
  }, []);

  return (
    <div>
      {ACHIEVEMENTS.map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          unlocked={unlockedIds.has(achievement.id)}
        />
      ))}
    </div>
  );
}

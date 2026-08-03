import { motion } from 'framer-motion';
import { AchievementDef } from '../../lib/achievements';

interface AchievementBadgeProps {
  achievement: AchievementDef;
  unlocked: boolean;
}

export function AchievementBadge({ achievement, unlocked }: AchievementBadgeProps) {
  return (
    <motion.div
      className="card"
      initial={unlocked ? { scale: 0.6, opacity: 0 } : false}
      animate={{ scale: 1, opacity: unlocked ? 1 : 0.4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      data-testid={`achievement-${achievement.id}`}
      data-unlocked={unlocked}
    >
      <strong>{achievement.title}</strong>
      <p>{achievement.description}</p>
    </motion.div>
  );
}

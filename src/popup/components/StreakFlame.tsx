import { motion } from 'framer-motion';

interface StreakFlameProps {
  currentStreak: number;
}

export function StreakFlame({ currentStreak }: StreakFlameProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ fontSize: 32 }}
        aria-hidden="true"
      >
        🔥
      </motion.div>
      <p>{currentStreak} day streak</p>
    </div>
  );
}

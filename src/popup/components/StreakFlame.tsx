import { motion, useReducedMotion } from 'framer-motion';

interface StreakFlameProps {
  currentStreak: number;
}

export function StreakFlame({ currentStreak }: StreakFlameProps) {
  // MotionConfig reducedMotion="user" (set in Popup.tsx) only suppresses Framer Motion's
  // positional/transform-ish keys under prefers-reduced-motion — opacity keyframes are not
  // covered, so this infinite flicker would keep animating even with reduced motion on.
  // useReducedMotion() reads the same user preference directly, letting us fully disable
  // the animate/transition props (rather than just some of the animated values) when set.
  const reduceMotion = useReducedMotion();

  return (
    <div style={{ textAlign: 'center' }}>
      <motion.div
        animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
        transition={reduceMotion ? undefined : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ fontSize: 32 }}
        aria-hidden="true"
      >
        🔥
      </motion.div>
      <p>{currentStreak} day streak</p>
    </div>
  );
}

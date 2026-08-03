import { motion } from 'framer-motion';
import { goalPercent } from '../../lib/goal';

interface ProgressRingProps {
  totalMl: number;
  goalMl: number;
  size?: number;
}

const STROKE = 10;

export function ProgressRing({ totalMl, goalMl, size = 140 }: ProgressRingProps) {
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  // Fraction (0-1, clamped) used only for drawing the stroke offset.
  const pct = goalMl > 0 ? Math.min(1, totalMl / goalMl) : 0;
  const offset = circumference * (1 - pct);
  // Shared with background/index.ts's updateBadge so the two consumers of "percent of
  // goal" can't drift out of sync (see src/lib/goal.ts).
  const pctLabel = goalPercent(totalMl, goalMl);

  return (
    <svg width={size} height={size} role="img" aria-label={`${pctLabel}% of daily goal`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--card-bg)"
        strokeWidth={STROKE}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.16}
        fill="var(--text-color)"
      >
        {pctLabel}%
      </text>
    </svg>
  );
}

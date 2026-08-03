import { motion } from 'framer-motion';

interface ProgressRingProps {
  totalMl: number;
  goalMl: number;
  size?: number;
}

const STROKE = 10;

export function ProgressRing({ totalMl, goalMl, size = 140 }: ProgressRingProps) {
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = goalMl > 0 ? Math.min(1, totalMl / goalMl) : 0;
  const offset = circumference * (1 - pct);
  const pctLabel = Math.round(pct * 100);

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
        transition={{ duration: 0.6, ease: 'easeOut' }}
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

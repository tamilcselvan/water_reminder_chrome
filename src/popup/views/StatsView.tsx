import { useEffect, useState } from 'react';
import { getLogsSince } from '../../lib/db';
import { dateKeyFromTimestamp } from '../../lib/dateUtils';
import { computeTotalMl } from '../../lib/goal';
import { LogEntry } from '../../lib/types';

interface DayTotal {
  dateKey: string;
  totalMl: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function lastNDayKeys(n: number, now: number): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(dateKeyFromTimestamp(now - i * DAY_MS));
  }
  return keys;
}

export function computeWeeklyTotals(logs: LogEntry[], now: number = Date.now()): DayTotal[] {
  return lastNDayKeys(7, now).map((dateKey) => ({
    dateKey,
    totalMl: computeTotalMl(logs.filter((l) => dateKeyFromTimestamp(l.timestampMs) === dateKey)),
  }));
}

export function StatsView() {
  const [days, setDays] = useState<DayTotal[]>([]);

  useEffect(() => {
    const sevenDaysAgo = Date.now() - 7 * DAY_MS;
    getLogsSince(sevenDaysAgo).then((logs) => setDays(computeWeeklyTotals(logs)));
  }, []);

  const max = Math.max(1, ...days.map((d) => d.totalMl));
  const barWidth = 28;
  const gap = 12;

  return (
    <div className="card">
      <svg width={7 * (barWidth + gap) + 8} height={140} role="img" aria-label="Weekly water intake">
        {days.map((d, i) => {
          const x = i * (barWidth + gap) + 8;
          const height = (d.totalMl / max) * 100;
          return (
            <g key={d.dateKey}>
              <rect
                x={x}
                y={120 - height}
                width={barWidth}
                height={height}
                fill="var(--accent)"
                rx={4}
              />
              <text x={x + barWidth / 2} y={135} fontSize={9} textAnchor="middle" fill="var(--text-color)">
                {d.dateKey.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

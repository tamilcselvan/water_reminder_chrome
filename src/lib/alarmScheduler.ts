import { ActiveHours } from './types';
import { minutesSinceLocalMidnight } from './dateUtils';

const DAY_MS = 24 * 60 * 60 * 1000;

export function isWithinActiveHours(nowMs: number, activeHours: ActiveHours | null): boolean {
  if (!activeHours) return true;
  const nowMinutes = minutesSinceLocalMidnight(nowMs);
  return nowMinutes >= activeHours.startMinutes && nowMinutes < activeHours.endMinutes;
}

export function computeNextReminderTime(
  nowMs: number,
  intervalMinutes: number,
  activeHours: ActiveHours | null,
): number {
  if (!activeHours) return nowMs + intervalMinutes * 60_000;
  if (!isWithinActiveHours(nowMs, activeHours)) return computeWindowStartAfter(nowMs, activeHours);
  const candidate = nowMs + intervalMinutes * 60_000;
  if (isWithinActiveHours(candidate, activeHours)) return candidate;
  return computeWindowStartAfter(candidate, activeHours);
}

export function computeWindowStartAfter(nowMs: number, activeHours: ActiveHours | null): number {
  if (!activeHours) return nowMs;
  const nowMinutes = minutesSinceLocalMidnight(nowMs);
  const todayMidnight = nowMs - nowMinutes * 60_000;
  if (nowMinutes < activeHours.startMinutes) {
    return todayMidnight + activeHours.startMinutes * 60_000;
  }
  return todayMidnight + DAY_MS + activeHours.startMinutes * 60_000;
}

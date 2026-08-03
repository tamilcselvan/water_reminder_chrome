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

  const nowMinutes = minutesSinceLocalMidnight(nowMs);

  // If now is within active hours, add the interval respecting the window
  if (nowMinutes >= activeHours.startMinutes && nowMinutes < activeHours.endMinutes) {
    const candidate = nowMs + intervalMinutes * 60_000;
    const candidateMinutes = minutesSinceLocalMidnight(candidate);

    // If candidate is still within active hours, return it
    if (candidateMinutes >= activeHours.startMinutes && candidateMinutes < activeHours.endMinutes) {
      return candidate;
    }

    // If candidate is past the end of active hours, return next day's window start
    const todayMidnight = nowMs - nowMinutes * 60_000;
    return todayMidnight + DAY_MS + activeHours.startMinutes * 60_000;
  }

  // If now is before or after active hours, return the appropriate window start
  const todayMidnight = nowMs - nowMinutes * 60_000;
  if (nowMinutes < activeHours.startMinutes) {
    return todayMidnight + activeHours.startMinutes * 60_000;
  }
  return todayMidnight + DAY_MS + activeHours.startMinutes * 60_000;
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

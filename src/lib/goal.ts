import { LogEntry } from './types';

export function computeTotalMl(logs: LogEntry[]): number {
  return logs.reduce((sum, log) => sum + log.amountMl, 0);
}

export function isGoalMet(totalMl: number, dailyGoalMl: number): boolean {
  return totalMl >= dailyGoalMl;
}

/**
 * Percentage (0-100, rounded, clamped at 100) of totalMl toward goalMl.
 * Returns 0 when goalMl is not positive, avoiding a NaN from dividing by zero.
 */
export function goalPercent(totalMl: number, goalMl: number): number {
  if (goalMl <= 0) return 0;
  return Math.min(100, Math.round((totalMl / goalMl) * 100));
}

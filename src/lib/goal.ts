import { LogEntry } from './types';

export function computeTotalMl(logs: LogEntry[]): number {
  return logs.reduce((sum, log) => sum + log.amountMl, 0);
}

export function isGoalMet(totalMl: number, dailyGoalMl: number): boolean {
  return totalMl >= dailyGoalMl;
}

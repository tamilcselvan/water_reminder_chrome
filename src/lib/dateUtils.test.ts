// src/lib/dateUtils.test.ts
import { describe, it, expect } from 'vitest';
import {
  dateKeyFromTimestamp,
  todayDateKey,
  minutesSinceLocalMidnight,
  previousDateKey,
} from './dateUtils';

describe('dateKeyFromTimestamp', () => {
  it('formats as YYYY-MM-DD in local time', () => {
    const d = new Date(2026, 2, 5, 23, 59); // March 5 2026, local time
    expect(dateKeyFromTimestamp(d.getTime())).toBe('2026-03-05');
  });

  it('zero-pads single-digit month and day', () => {
    const d = new Date(2026, 0, 9, 0, 0);
    expect(dateKeyFromTimestamp(d.getTime())).toBe('2026-01-09');
  });
});

describe('todayDateKey', () => {
  it('defaults to the current time when no argument given', () => {
    expect(todayDateKey()).toBe(dateKeyFromTimestamp(Date.now()));
  });

  it('accepts an explicit timestamp', () => {
    const d = new Date(2026, 5, 15, 10, 0);
    expect(todayDateKey(d.getTime())).toBe('2026-06-15');
  });
});

describe('minutesSinceLocalMidnight', () => {
  it('returns 0 at local midnight', () => {
    const d = new Date(2026, 2, 5, 0, 0);
    expect(minutesSinceLocalMidnight(d.getTime())).toBe(0);
  });

  it('returns the correct minute count mid-day', () => {
    const d = new Date(2026, 2, 5, 14, 30);
    expect(minutesSinceLocalMidnight(d.getTime())).toBe(14 * 60 + 30);
  });
});

describe('previousDateKey', () => {
  it('returns the prior calendar day', () => {
    expect(previousDateKey('2026-03-05')).toBe('2026-03-04');
  });

  it('rolls back across a month boundary', () => {
    expect(previousDateKey('2026-03-01')).toBe('2026-02-28');
  });

  it('rolls back across a year boundary', () => {
    expect(previousDateKey('2026-01-01')).toBe('2025-12-31');
  });
});

import { describe, it, expect } from 'vitest';
import { isWithinActiveHours, computeNextReminderTime, computeWindowStartAfter } from './alarmScheduler';

const ACTIVE_HOURS = { startMinutes: 8 * 60, endMinutes: 21 * 60 }; // 08:00–21:00

describe('isWithinActiveHours', () => {
  it('is always true when activeHours is null', () => {
    const now = new Date(2026, 2, 5, 3, 0).getTime();
    expect(isWithinActiveHours(now, null)).toBe(true);
  });

  it('is true inside the window', () => {
    const now = new Date(2026, 2, 5, 14, 0).getTime();
    expect(isWithinActiveHours(now, ACTIVE_HOURS)).toBe(true);
  });

  it('is false before the window starts', () => {
    const now = new Date(2026, 2, 5, 6, 0).getTime();
    expect(isWithinActiveHours(now, ACTIVE_HOURS)).toBe(false);
  });

  it('is false after the window ends', () => {
    const now = new Date(2026, 2, 5, 22, 0).getTime();
    expect(isWithinActiveHours(now, ACTIVE_HOURS)).toBe(false);
  });
});

describe('computeNextReminderTime', () => {
  it('adds the interval directly when no activeHours is set', () => {
    const now = new Date(2026, 2, 5, 23, 0).getTime();
    expect(computeNextReminderTime(now, 60, null)).toBe(now + 60 * 60_000);
  });

  it('adds the interval directly when the result stays inside the window', () => {
    const now = new Date(2026, 2, 5, 14, 0).getTime();
    expect(computeNextReminderTime(now, 60, ACTIVE_HOURS)).toBe(now + 60 * 60_000);
  });

  it('pushes forward to the window start when the result would land before it', () => {
    const now = new Date(2026, 2, 5, 7, 50).getTime();
    const result = computeNextReminderTime(now, 15, ACTIVE_HOURS);
    expect(new Date(result)).toEqual(new Date(2026, 2, 5, 8, 0));
  });

  it('pushes forward to the next day window start when the result would land after it ends', () => {
    const now = new Date(2026, 2, 5, 20, 50).getTime();
    const result = computeNextReminderTime(now, 30, ACTIVE_HOURS);
    expect(new Date(result)).toEqual(new Date(2026, 2, 6, 8, 0));
  });
});

describe('computeWindowStartAfter', () => {
  it('returns now unchanged when activeHours is null', () => {
    const now = new Date(2026, 2, 5, 14, 0).getTime();
    expect(computeWindowStartAfter(now, null)).toBe(now);
  });

  it("returns today's window start when currently before it", () => {
    const now = new Date(2026, 2, 5, 3, 0).getTime();
    expect(new Date(computeWindowStartAfter(now, ACTIVE_HOURS))).toEqual(new Date(2026, 2, 5, 8, 0));
  });

  it("returns tomorrow's window start when currently inside or after it", () => {
    const now = new Date(2026, 2, 5, 14, 0).getTime();
    expect(new Date(computeWindowStartAfter(now, ACTIVE_HOURS))).toEqual(new Date(2026, 2, 6, 8, 0));
  });
});

import { describe, it, expect } from 'vitest';
import { computeTotalMl, isGoalMet, goalPercent } from './goal';

describe('computeTotalMl', () => {
  it('sums amounts across logs', () => {
    const logs = [
      { id: 1, timestampMs: 1, amountMl: 250 },
      { id: 2, timestampMs: 2, amountMl: 100 },
    ];
    expect(computeTotalMl(logs)).toBe(350);
  });

  it('returns 0 for an empty list', () => {
    expect(computeTotalMl([])).toBe(0);
  });
});

describe('isGoalMet', () => {
  it('is false below the goal', () => {
    expect(isGoalMet(1000, 2000)).toBe(false);
  });

  it('is true at exactly the goal', () => {
    expect(isGoalMet(2000, 2000)).toBe(true);
  });

  it('is true above the goal', () => {
    expect(isGoalMet(2500, 2000)).toBe(true);
  });
});

describe('goalPercent', () => {
  it('returns 0 when the goal is 0 (avoids divide-by-zero / NaN)', () => {
    expect(goalPercent(500, 0)).toBe(0);
  });

  it('returns 0 when the goal is negative', () => {
    expect(goalPercent(500, -100)).toBe(0);
  });

  it('computes the rounded percentage for a normal case', () => {
    expect(goalPercent(500, 2000)).toBe(25);
  });

  it('clamps at 100 when over goal', () => {
    expect(goalPercent(3000, 2000)).toBe(100);
  });
});

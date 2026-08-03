import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { computeWeeklyTotals, StatsView } from './StatsView';

vi.mock('../../lib/db', () => ({
  getLogsSince: vi.fn(async () => [
    { id: 1, timestampMs: new Date(2026, 2, 5, 9, 0).getTime(), amountMl: 300 },
    { id: 2, timestampMs: new Date(2026, 2, 4, 9, 0).getTime(), amountMl: 500 },
  ]),
}));

describe('computeWeeklyTotals', () => {
  it('buckets logs into the last 7 calendar days', () => {
    const now = new Date(2026, 2, 5, 20, 0).getTime();
    const logs = [
      { id: 1, timestampMs: new Date(2026, 2, 5, 9, 0).getTime(), amountMl: 300 },
      { id: 2, timestampMs: new Date(2026, 2, 4, 9, 0).getTime(), amountMl: 500 },
    ];
    const result = computeWeeklyTotals(logs, now);
    expect(result).toHaveLength(7);
    expect(result[6]).toEqual({ dateKey: '2026-03-05', totalMl: 300 });
    expect(result[5]).toEqual({ dateKey: '2026-03-04', totalMl: 500 });
    expect(result[0].totalMl).toBe(0);
  });
});

describe('StatsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders one bar per day once logs load', async () => {
    render(<StatsView />);
    expect(await screen.findByLabelText('Weekly water intake')).toBeInTheDocument();
    expect(document.querySelectorAll('rect')).toHaveLength(7);
  });
});

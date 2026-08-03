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

  it('produces a contiguous 7-day window across a DST spring-forward transition', () => {
    // US DST 2026 starts Sun Mar 8 (clocks jump 2:00am -> 3:00am, a 23-hour
    // calendar day). A naive `now - i * 24h` day-walk skips Mar 8 entirely
    // when evaluated shortly after midnight the following day. Verify the
    // bucket list stays a contiguous 7-day calendar window regardless.
    // Access Node's `process.env` via globalThis to avoid pulling in
    // @types/node (not part of this project's tsconfig `types`).
    const nodeProcess = (globalThis as unknown as { process: { env: Record<string, string | undefined> } })
      .process;
    const originalTz = nodeProcess.env.TZ;
    nodeProcess.env.TZ = 'America/New_York';
    try {
      const now = new Date(2026, 2, 9, 0, 30).getTime(); // Mar 9, 2026 00:30 local
      const logs = [
        // A log recorded on the spring-forward day itself must not vanish.
        { id: 1, timestampMs: new Date(2026, 2, 8, 10, 0).getTime(), amountMl: 250 },
      ];
      const result = computeWeeklyTotals(logs, now);
      expect(result.map((d) => d.dateKey)).toEqual([
        '2026-03-03',
        '2026-03-04',
        '2026-03-05',
        '2026-03-06',
        '2026-03-07',
        '2026-03-08',
        '2026-03-09',
      ]);
      expect(result.find((d) => d.dateKey === '2026-03-08')?.totalMl).toBe(250);
    } finally {
      nodeProcess.env.TZ = originalTz;
    }
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

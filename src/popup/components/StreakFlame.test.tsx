import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakFlame } from './StreakFlame';

describe('StreakFlame', () => {
  it('shows the current streak count', () => {
    render(<StreakFlame currentStreak={5} />);
    expect(screen.getByText('5 day streak')).toBeInTheDocument();
  });

  it('shows 0 for no streak', () => {
    render(<StreakFlame currentStreak={0} />);
    expect(screen.getByText('0 day streak')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ACHIEVEMENTS } from '../../lib/achievements';
import { AchievementsView } from './AchievementsView';

vi.mock('../../lib/db', () => ({
  getAchievements: vi.fn(async () => [{ id: 'first-drop', unlockedAtMs: 1 }]),
}));

describe('AchievementsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders every achievement in the catalog', async () => {
    render(<AchievementsView />);
    for (const a of ACHIEVEMENTS) {
      expect(await screen.findByTestId(`achievement-${a.id}`)).toBeInTheDocument();
    }
  });

  it('marks unlocked achievements based on stored records', async () => {
    render(<AchievementsView />);
    expect(await screen.findByTestId('achievement-first-drop')).toHaveAttribute('data-unlocked', 'true');
    expect(screen.getByTestId('achievement-century-club')).toHaveAttribute('data-unlocked', 'false');
  });
});

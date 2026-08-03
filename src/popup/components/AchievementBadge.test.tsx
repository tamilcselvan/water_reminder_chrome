import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AchievementBadge } from './AchievementBadge';

const SAMPLE = { id: 'first-drop', title: 'First Drop', description: 'Log your first glass.', isUnlocked: () => true };

describe('AchievementBadge', () => {
  it('shows title and description', () => {
    render(<AchievementBadge achievement={SAMPLE} unlocked={true} />);
    expect(screen.getByText('First Drop')).toBeInTheDocument();
    expect(screen.getByText('Log your first glass.')).toBeInTheDocument();
  });

  it('marks locked badges as data-unlocked=false', () => {
    render(<AchievementBadge achievement={SAMPLE} unlocked={false} />);
    expect(screen.getByTestId('achievement-first-drop')).toHaveAttribute('data-unlocked', 'false');
  });

  it('marks unlocked badges as data-unlocked=true', () => {
    render(<AchievementBadge achievement={SAMPLE} unlocked={true} />);
    expect(screen.getByTestId('achievement-first-drop')).toHaveAttribute('data-unlocked', 'true');
  });
});

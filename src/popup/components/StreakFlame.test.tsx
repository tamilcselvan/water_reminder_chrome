import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StreakFlame } from './StreakFlame';

function mockPrefersReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? matches : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('StreakFlame', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the current streak count', () => {
    render(<StreakFlame currentStreak={5} />);
    expect(screen.getByText('5 day streak')).toBeInTheDocument();
  });

  it('shows 0 for no streak', () => {
    render(<StreakFlame currentStreak={0} />);
    expect(screen.getByText('0 day streak')).toBeInTheDocument();
  });

  it('disables the flicker animation when prefers-reduced-motion is set', () => {
    mockPrefersReducedMotion(true);
    render(<StreakFlame currentStreak={3} />);
    const flame = screen.getByText('🔥');
    // No inline animation-driving style should be applied when motion is disabled;
    // Framer Motion only writes transform/opacity onto the element while animating.
    expect(flame.style.opacity).toBe('');
    expect(flame.style.transform).toBe('');
  });

  it('still animates when prefers-reduced-motion is not set', async () => {
    mockPrefersReducedMotion(false);
    render(<StreakFlame currentStreak={3} />);
    const flame = screen.getByText('🔥');
    await waitFor(() => expect(flame.style.opacity).not.toBe(''));
  });
});

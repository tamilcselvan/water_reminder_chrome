import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressRing } from './ProgressRing';

describe('ProgressRing', () => {
  it('labels the svg with the rounded percentage', () => {
    render(<ProgressRing totalMl={500} goalMl={2000} />);
    expect(screen.getByRole('img', { name: '25% of daily goal' })).toBeInTheDocument();
  });

  it('caps the displayed percentage at 100 when over goal', () => {
    render(<ProgressRing totalMl={3000} goalMl={2000} />);
    expect(screen.getByRole('img', { name: '100% of daily goal' })).toBeInTheDocument();
  });

  it('shows 0% when the goal is 0 (avoids divide-by-zero)', () => {
    render(<ProgressRing totalMl={0} goalMl={0} />);
    expect(screen.getByRole('img', { name: '0% of daily goal' })).toBeInTheDocument();
  });
});

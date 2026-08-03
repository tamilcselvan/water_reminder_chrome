import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { installChromeMock } from '../testUtils/chromeMock';
import { setSettings } from '../lib/storage';
import { DEFAULT_SETTINGS } from '../lib/types';
import { Options } from './Options';

vi.mock('../lib/db', () => ({
  resetDB: vi.fn(async () => {}),
  getAllLogs: vi.fn(async () => []),
  getAchievements: vi.fn(async () => []),
}));

beforeEach(async () => {
  installChromeMock();
  vi.clearAllMocks();
  await setSettings(DEFAULT_SETTINGS);
});

describe('Options', () => {
  it('loads and displays the stored daily goal', async () => {
    render(<Options />);
    expect(await screen.findByDisplayValue(String(DEFAULT_SETTINGS.dailyGoalMl))).toBeInTheDocument();
  });

  it('rejects an interval below the minimum without saving', async () => {
    render(<Options />);
    const intervalInput = await screen.findByDisplayValue(String(DEFAULT_SETTINGS.intervalMinutes));
    fireEvent.change(intervalInput, { target: { value: '2' } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Minimum interval is 5 minutes');
  });

  it('reveals active-hours time inputs once the toggle is checked', async () => {
    render(<Options />);
    const toggle = await screen.findByLabelText('Limit reminders to active hours');
    fireEvent.click(toggle);
    await waitFor(() => expect(screen.getByLabelText('Start')).toBeInTheDocument());
    expect(screen.getByLabelText('End')).toBeInTheDocument();
  });

  it('calls resetDB after confirming the reset action', async () => {
    const { resetDB } = await import('../lib/db');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Options />);
    fireEvent.click(await screen.findByText('Reset all data'));
    await waitFor(() => expect(resetDB).toHaveBeenCalledTimes(1));
  });

  it('does not call resetDB when the confirmation is declined', async () => {
    const { resetDB } = await import('../lib/db');
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<Options />);
    fireEvent.click(await screen.findByText('Reset all data'));
    expect(resetDB).not.toHaveBeenCalled();
  });
});

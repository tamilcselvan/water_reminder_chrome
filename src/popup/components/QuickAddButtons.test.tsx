import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { installChromeMock } from '../../testUtils/chromeMock';
import { __resetDBConnectionForTests } from '../../lib/db';
import { setSettings } from '../../lib/storage';
import { DEFAULT_SETTINGS } from '../../lib/types';
import { QuickAddButtons } from './QuickAddButtons';

beforeEach(async () => {
  installChromeMock();
  __resetDBConnectionForTests();
  await indexedDB.deleteDatabase('hydro-db');
  await setSettings(DEFAULT_SETTINGS);
});

describe('QuickAddButtons', () => {
  it('calls onLogged after a preset button logs a drink', async () => {
    const onLogged = vi.fn();
    render(<QuickAddButtons onLogged={onLogged} />);
    fireEvent.click(screen.getByText('+250ml'));
    await waitFor(() => expect(onLogged).toHaveBeenCalledTimes(1));
  });

  it('logs a valid custom amount and calls onLogged', async () => {
    const onLogged = vi.fn();
    render(<QuickAddButtons onLogged={onLogged} />);
    fireEvent.change(screen.getByLabelText('Custom amount in ml'), { target: { value: '333' } });
    fireEvent.click(screen.getByText('Add'));
    await waitFor(() => expect(onLogged).toHaveBeenCalledTimes(1));
  });

  it('rejects an out-of-range custom amount without calling onLogged', async () => {
    const onLogged = vi.fn();
    render(<QuickAddButtons onLogged={onLogged} />);
    fireEvent.change(screen.getByLabelText('Custom amount in ml'), { target: { value: '9999' } });
    fireEvent.click(screen.getByText('Add'));
    expect(await screen.findByRole('alert')).toHaveTextContent('between 1 and 5000ml');
    expect(onLogged).not.toHaveBeenCalled();
  });
});

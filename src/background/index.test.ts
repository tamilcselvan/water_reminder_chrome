import { describe, it, expect, beforeEach, vi } from 'vitest';
import { installChromeMock } from '../testUtils/chromeMock';
import { __resetDBConnectionForTests } from '../lib/db';
import { setSettings, setTodayCache } from '../lib/storage';
import { DEFAULT_SETTINGS } from '../lib/types';

async function loadFreshModule() {
  vi.resetModules();
  const mod = await import('./index');
  return mod as typeof import('./index');
}

beforeEach(async () => {
  installChromeMock();
  __resetDBConnectionForTests();
  await indexedDB.deleteDatabase('hydro-db');
});

describe('scheduleNextReminder', () => {
  it('creates the reminder alarm at the computed next time', async () => {
    const handles = installChromeMock();
    await setSettings({ ...DEFAULT_SETTINGS, intervalMinutes: 30, activeHours: null });
    const { scheduleNextReminder } = await loadFreshModule();
    const now = new Date(2026, 2, 5, 10, 0).getTime();
    await scheduleNextReminder(now);
    expect(handles.alarmsCreated['hydro-reminder'].when).toBe(now + 30 * 60_000);
  });
});

describe('updateBadge', () => {
  it('shows a percentage badge before the goal is met', async () => {
    const handles = installChromeMock();
    await setSettings({ ...DEFAULT_SETTINGS, dailyGoalMl: 2000 });
    const now = new Date(2026, 2, 5, 10, 0).getTime();
    await setTodayCache({ dateKey: '2026-03-05', totalMl: 500, goalMetAt: null });
    const { updateBadge } = await loadFreshModule();
    await updateBadge(now);
    expect(handles.badge.text).toBe('25%');
  });

  it('shows a checkmark once the goal is met', async () => {
    const handles = installChromeMock();
    await setSettings({ ...DEFAULT_SETTINGS, dailyGoalMl: 2000 });
    const now = new Date(2026, 2, 5, 10, 0).getTime();
    await setTodayCache({ dateKey: '2026-03-05', totalMl: 2000, goalMetAt: now });
    const { updateBadge } = await loadFreshModule();
    await updateBadge(now);
    expect(handles.badge.text).toBe('✓');
  });
});

describe('fireReminderIfDue', () => {
  it('creates a notification when due and inside active hours', async () => {
    const handles = installChromeMock();
    await setSettings({ ...DEFAULT_SETTINGS, activeHours: null });
    const now = new Date(2026, 2, 5, 10, 0).getTime();
    await setTodayCache({ dateKey: '2026-03-05', totalMl: 0, goalMetAt: null });
    const { fireReminderIfDue } = await loadFreshModule();
    await fireReminderIfDue(now);
    expect(Object.keys(handles.notifications)).toContain('hydro-reminder-notif');
  });

  it('skips the notification and reschedules when the goal is already met', async () => {
    const handles = installChromeMock();
    await setSettings({ ...DEFAULT_SETTINGS, activeHours: null, dailyGoalMl: 100 });
    const now = new Date(2026, 2, 5, 10, 0).getTime();
    await setTodayCache({ dateKey: '2026-03-05', totalMl: 100, goalMetAt: now });
    const { fireReminderIfDue } = await loadFreshModule();
    await fireReminderIfDue(now);
    expect(Object.keys(handles.notifications)).not.toContain('hydro-reminder-notif');
    expect(handles.alarmsCreated['hydro-reminder']).toBeDefined();
  });

  it('skips the notification and reschedules when outside active hours', async () => {
    const handles = installChromeMock();
    await setSettings({
      ...DEFAULT_SETTINGS,
      activeHours: { startMinutes: 8 * 60, endMinutes: 21 * 60 },
    });
    const now = new Date(2026, 2, 5, 3, 0).getTime();
    await setTodayCache({ dateKey: '2026-03-05', totalMl: 0, goalMetAt: null });
    const { fireReminderIfDue } = await loadFreshModule();
    await fireReminderIfDue(now);
    expect(Object.keys(handles.notifications)).not.toContain('hydro-reminder-notif');
  });
});

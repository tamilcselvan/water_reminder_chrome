import { describe, it, expect, beforeEach, vi } from 'vitest';
import { installChromeMock } from '../testUtils/chromeMock';
import { __resetDBConnectionForTests } from '../lib/db';
import { setSettings, setTodayCache } from '../lib/storage';
import { DEFAULT_SETTINGS } from '../lib/types';
import { todayDateKey } from '../lib/dateUtils';

// Chrome's real storage.onChanged / alarms.onAlarm / runtime.onInstalled / onStartup
// callbacks are not awaited by the caller, so after firing a mocked event we flush both
// the microtask queue and one macrotask tick before asserting on the resulting side
// effects (updateBadge/scheduleNextReminder chain several `await`s internally).
async function flushAsync() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

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

  it('reschedules to the very next day\'s window start (not two days out) when the goal is already met inside active hours', async () => {
    const handles = installChromeMock();
    await setSettings({
      ...DEFAULT_SETTINGS,
      activeHours: { startMinutes: 8 * 60, endMinutes: 21 * 60 },
    });
    const now = new Date(2026, 2, 5, 14, 0).getTime();
    await setTodayCache({ dateKey: '2026-03-05', totalMl: 2000, goalMetAt: now });
    const { fireReminderIfDue } = await loadFreshModule();
    await fireReminderIfDue(now);
    expect(handles.alarmsCreated['hydro-reminder'].when).toBe(new Date(2026, 2, 6, 8, 0).getTime());
  });
});

describe('storage.onChanged listener wiring (regression for stale badge on quick-add)', () => {
  it('refreshes the badge when chrome fires storage.onChanged with a todayCache change', async () => {
    const handles = installChromeMock();
    const key = todayDateKey();
    await setSettings({ ...DEFAULT_SETTINGS, dailyGoalMl: 2000 });
    await setTodayCache({ dateKey: key, totalMl: 0, goalMetAt: null });

    // Loading the module registers its top-level chrome.storage.onChanged listener
    // against the mock installed above.
    await loadFreshModule();

    // Simulate what logDrink actually does on every call: write a new todayCache, then
    // let chrome fire the change event (previously only changes.settings was handled).
    await setTodayCache({ dateKey: key, totalMl: 1000, goalMetAt: null });
    handles.fire.storageOnChanged({
      todayCache: {
        oldValue: { dateKey: key, totalMl: 0, goalMetAt: null },
        newValue: { dateKey: key, totalMl: 1000, goalMetAt: null },
      },
    });
    await flushAsync();

    expect(handles.badge.text).toBe('50%');
  });

  it('also refreshes the badge when settings change (the denominator changed too)', async () => {
    const handles = installChromeMock();
    const key = todayDateKey();
    await setSettings({ ...DEFAULT_SETTINGS, dailyGoalMl: 2000 });
    await setTodayCache({ dateKey: key, totalMl: 1000, goalMetAt: null });

    await loadFreshModule();

    await setSettings({ ...DEFAULT_SETTINGS, dailyGoalMl: 4000 });
    handles.fire.storageOnChanged({
      settings: {
        oldValue: { ...DEFAULT_SETTINGS, dailyGoalMl: 2000 },
        newValue: { ...DEFAULT_SETTINGS, dailyGoalMl: 4000 },
      },
    });
    await flushAsync();

    expect(handles.badge.text).toBe('25%');
  });

  it('ignores changes from a non-local storage area', async () => {
    const handles = installChromeMock();
    const key = todayDateKey();
    await setSettings({ ...DEFAULT_SETTINGS, dailyGoalMl: 2000 });
    await setTodayCache({ dateKey: key, totalMl: 0, goalMetAt: null });

    await loadFreshModule();

    await setTodayCache({ dateKey: key, totalMl: 1000, goalMetAt: null });
    handles.fire.storageOnChanged(
      { todayCache: { newValue: { dateKey: key, totalMl: 1000, goalMetAt: null } } },
      'sync',
    );
    await flushAsync();

    expect(handles.badge.text).toBe('');
  });
});

describe('runtime.onStartup', () => {
  it('re-arms the reminder alarm and refreshes the badge, without recreating the heartbeat alarm', async () => {
    const handles = installChromeMock();
    await setSettings({ ...DEFAULT_SETTINGS, dailyGoalMl: 2000, intervalMinutes: 30, activeHours: null });
    await setTodayCache({ dateKey: todayDateKey(), totalMl: 500, goalMetAt: null });

    await loadFreshModule();
    handles.fire.runtimeOnStartup();
    await flushAsync();

    expect(handles.alarmsCreated['hydro-reminder']).toBeDefined();
    expect(handles.badge.text).toBe('25%');
    expect(handles.alarmsCreated['hydro-heartbeat']).toBeUndefined();
  });
});

import { getSettings, getTodayCache } from '../lib/storage';
import { logDrink } from '../lib/logAction';
import { computeNextReminderTime, computeWindowStartAfter, isWithinActiveHours } from '../lib/alarmScheduler';

const REMINDER_ALARM = 'hydro-reminder';
const HEARTBEAT_ALARM = 'hydro-heartbeat';
const SNOOZE_ALARM = 'hydro-snooze';
export const DEFAULT_LOG_AMOUNT_ML = 250;

export async function scheduleNextReminder(now: number = Date.now()): Promise<void> {
  const settings = await getSettings();
  if (!settings.notificationsEnabled) {
    await chrome.alarms.clear(REMINDER_ALARM);
    return;
  }
  const next = computeNextReminderTime(now, settings.intervalMinutes, settings.activeHours);
  await chrome.alarms.create(REMINDER_ALARM, { when: next });
}

export async function updateBadge(now: number = Date.now()): Promise<void> {
  const settings = await getSettings();
  const cache = await getTodayCache(now);
  const pct = Math.min(100, Math.round((cache.totalMl / settings.dailyGoalMl) * 100));
  const text = cache.goalMetAt ? '✓' : `${pct}%`;
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color: cache.goalMetAt ? '#2e7d32' : '#0288d1' });
}

export async function fireReminderIfDue(now: number = Date.now()): Promise<void> {
  const settings = await getSettings();
  const cache = await getTodayCache(now);

  if (cache.goalMetAt) {
    // Pause reminders until the next active window starts. computeWindowStartAfter's
    // contract (see alarmScheduler.test.ts) is: given an instant, return today's window
    // start if that instant is before the window, otherwise TOMORROW's window start
    // relative to that instant's day. Feeding it `now` directly (the goal-met instant,
    // which is normally inside today's active window) therefore correctly yields
    // tomorrow's start. Feeding it `now + 24h` instead — as if reusing that same
    // "inside/after" branch a second time — lands on the day AFTER tomorrow, silently
    // skipping a full day of reminders. When there is no activeHours restriction, the
    // function is a no-op passthrough, so a plain 24h pause is used instead.
    const restart = settings.activeHours
      ? computeWindowStartAfter(now, settings.activeHours)
      : now + 24 * 60 * 60_000;
    await chrome.alarms.create(REMINDER_ALARM, { when: restart });
    return;
  }

  if (!isWithinActiveHours(now, settings.activeHours)) {
    await scheduleNextReminder(now);
    return;
  }

  if (settings.notificationsEnabled) {
    await chrome.notifications.create('hydro-reminder-notif', {
      type: 'basic',
      iconUrl: 'public/icons/icon-128.png',
      title: 'Time to hydrate',
      message: `Log ${DEFAULT_LOG_AMOUNT_ML}ml or snooze 15 minutes.`,
      buttons: [{ title: `Log ${DEFAULT_LOG_AMOUNT_ML}ml` }, { title: 'Snooze 15m' }],
      priority: 1,
    });
  }
  await scheduleNextReminder(now);
}

chrome.runtime.onInstalled.addListener(() => {
  scheduleNextReminder();
  chrome.alarms.create(HEARTBEAT_ALARM, { periodInMinutes: 5 });
  updateBadge();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const now = Date.now();
  if (alarm.name === REMINDER_ALARM || alarm.name === SNOOZE_ALARM) {
    await fireReminderIfDue(now);
  }
  await updateBadge(now);
});

chrome.notifications.onButtonClicked.addListener(async (notifId, buttonIndex) => {
  if (notifId !== 'hydro-reminder-notif') return;
  if (buttonIndex === 0) {
    await logDrink(DEFAULT_LOG_AMOUNT_ML);
    await updateBadge();
  } else if (buttonIndex === 1) {
    await chrome.alarms.create(SNOOZE_ALARM, { when: Date.now() + 15 * 60_000 });
  }
  await chrome.notifications.clear(notifId);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.settings) {
    scheduleNextReminder();
  }
});

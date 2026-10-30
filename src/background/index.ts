import { getSettings, getTodayCache } from '../lib/storage';
import { logDrink } from '../lib/logAction';
import { computeNextReminderTime, computeWindowStartAfter, isWithinActiveHours } from '../lib/alarmScheduler';
import { goalPercent } from '../lib/goal';
import { MIN_INTERVAL_MINUTES } from '../lib/types';

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
  // Clamp defensively at the scheduling seam itself: the options UI already rejects
  // values below MIN_INTERVAL_MINUTES, but a corrupted or externally-written setting
  // (e.g. synced from another source) could still bypass that UI-level validation.
  const intervalMinutes = Math.max(MIN_INTERVAL_MINUTES, settings.intervalMinutes);
  const next = computeNextReminderTime(now, intervalMinutes, settings.activeHours);
  await chrome.alarms.create(REMINDER_ALARM, { when: next });
}

export async function updateBadge(now: number = Date.now()): Promise<void> {
  const settings = await getSettings();
  const cache = await getTodayCache(now);
  const pct = goalPercent(cache.totalMl, settings.dailyGoalMl);
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

function checkAndApplyUpdate(): void {
  if (!chrome.runtime.requestUpdateCheck) return;
  chrome.runtime.requestUpdateCheck((status) => {
    if (status === 'update_available') chrome.runtime.reload();
  });
}

chrome.alarms.create('updateCheck', { periodInMinutes: 30 });
chrome.runtime.onUpdateAvailable.addListener(() => chrome.runtime.reload());

chrome.runtime.onInstalled.addListener(() => {
  scheduleNextReminder();
  chrome.alarms.create(HEARTBEAT_ALARM, { periodInMinutes: 5 });
  updateBadge();
});

// Chrome persists periodic alarms (like HEARTBEAT_ALARM) across browser restarts, so
// onStartup only needs to re-arm the one-shot reminder alarm (lost on restart) and
// refresh the badge to reflect current state — not recreate the heartbeat.
chrome.runtime.onStartup.addListener(() => {
  checkAndApplyUpdate();
  scheduleNextReminder();
  updateBadge();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'updateCheck') {
    checkAndApplyUpdate();
    return;
  }
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
  if (area !== 'local') return;
  if (changes.settings) {
    scheduleNextReminder();
  }
  // The badge must refresh both when a drink is logged (changes.todayCache, written by
  // every logDrink call — e.g. from the popup's quick-add) and when settings change
  // (changes.settings affects the percentage denominator via dailyGoalMl). Without this,
  // a popup quick-add left the badge stale until the next 5-minute heartbeat alarm.
  if (changes.todayCache || changes.settings) {
    updateBadge();
  }
});

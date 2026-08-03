import { useEffect, useState } from 'react';
import { getSettings, setSettings, setTodayCache, setStreak } from '../lib/storage';
import { Settings, DEFAULT_STREAK, MIN_INTERVAL_MINUTES, MIN_DAILY_GOAL_ML, Units } from '../lib/types';
import { todayDateKey } from '../lib/dateUtils';

function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function Options() {
  const [settings, setSettingsState] = useState<Settings | null>(null);
  const [intervalError, setIntervalError] = useState<string | null>(null);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(setSettingsState);
  }, []);

  if (!settings) return <p>Loading…</p>;

  async function save(next: Settings) {
    setSettingsState(next);
    await setSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const handleGoalChange = (value: string) => {
    const ml = Number(value);
    if (!Number.isFinite(ml) || ml < MIN_DAILY_GOAL_ML) {
      setGoalError(`Minimum daily goal is ${MIN_DAILY_GOAL_ML}ml`);
      return;
    }
    setGoalError(null);
    save({ ...settings, dailyGoalMl: ml });
  };

  const handleIntervalChange = (value: string) => {
    const minutes = Number(value);
    if (!Number.isFinite(minutes) || minutes < MIN_INTERVAL_MINUTES) {
      setIntervalError(`Minimum interval is ${MIN_INTERVAL_MINUTES} minutes`);
      return;
    }
    setIntervalError(null);
    save({ ...settings, intervalMinutes: minutes });
  };

  async function handleReset() {
    if (!window.confirm('This clears all logged history, streaks, and achievements. Continue?')) {
      return;
    }
    const { resetDB } = await import('../lib/db');
    await resetDB();
    await setTodayCache({ dateKey: todayDateKey(), totalMl: 0, goalMetAt: null });
    await setStreak(DEFAULT_STREAK);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handleExport() {
    const { getAllLogs, getAchievements } = await import('../lib/db');
    const [logs, achievements] = await Promise.all([getAllLogs(), getAchievements()]);
    const blob = new Blob([JSON.stringify({ settings, logs, achievements }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hydro-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card">
      <h1>Hydro Settings</h1>

      <label>
        Daily goal (ml)
        <input
          type="number"
          value={settings.dailyGoalMl}
          onChange={(e) => handleGoalChange(e.target.value)}
        />
      </label>
      {goalError && <p role="alert">{goalError}</p>}

      <label>
        Reminder interval (minutes)
        <input
          type="number"
          value={settings.intervalMinutes}
          onChange={(e) => handleIntervalChange(e.target.value)}
        />
      </label>
      {intervalError && <p role="alert">{intervalError}</p>}

      <label>
        Units
        <select
          value={settings.units}
          onChange={(e) => save({ ...settings, units: e.target.value as Units })}
        >
          <option value="ml">ml</option>
          <option value="oz">oz</option>
        </select>
      </label>

      <label>
        <input
          type="checkbox"
          checked={settings.activeHours !== null}
          onChange={(e) =>
            save({
              ...settings,
              activeHours: e.target.checked ? { startMinutes: 8 * 60, endMinutes: 21 * 60 } : null,
            })
          }
        />
        Limit reminders to active hours
      </label>

      {settings.activeHours && (
        <div>
          <label>
            Start
            <input
              type="time"
              value={minutesToTimeString(settings.activeHours.startMinutes)}
              onChange={(e) =>
                save({
                  ...settings,
                  activeHours: { ...settings.activeHours!, startMinutes: timeStringToMinutes(e.target.value) },
                })
              }
            />
          </label>
          <label>
            End
            <input
              type="time"
              value={minutesToTimeString(settings.activeHours.endMinutes)}
              onChange={(e) =>
                save({
                  ...settings,
                  activeHours: { ...settings.activeHours!, endMinutes: timeStringToMinutes(e.target.value) },
                })
              }
            />
          </label>
        </div>
      )}

      <label>
        <input
          type="checkbox"
          checked={settings.notificationsEnabled}
          onChange={(e) => save({ ...settings, notificationsEnabled: e.target.checked })}
        />
        Enable notifications
      </label>

      {saved && <p>Saved</p>}

      <div>
        <button onClick={handleExport}>Export data</button>
        <button onClick={handleReset}>Reset all data</button>
      </div>
    </div>
  );
}

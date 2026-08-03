import { describe, it, expect, beforeEach } from 'vitest';
import {
  addLog,
  getAllLogs,
  getLogsSince,
  addAchievement,
  getAchievements,
  resetDB,
  __resetDBConnectionForTests,
} from './db';

beforeEach(async () => {
  __resetDBConnectionForTests();
  await indexedDB.deleteDatabase('hydro-db');
});

describe('logs', () => {
  it('adds and retrieves a log entry', async () => {
    const id = await addLog({ timestampMs: 1000, amountMl: 250 });
    expect(await getAllLogs()).toEqual([{ id, timestampMs: 1000, amountMl: 250 }]);
  });

  it('filters logs by timestamp with getLogsSince', async () => {
    await addLog({ timestampMs: 1000, amountMl: 100 });
    await addLog({ timestampMs: 5000, amountMl: 200 });
    const recent = await getLogsSince(3000);
    expect(recent.map((l) => l.amountMl)).toEqual([200]);
  });
});

describe('achievements', () => {
  it('adds and retrieves an achievement record', async () => {
    await addAchievement({ id: 'first-drop', unlockedAtMs: 999 });
    expect(await getAchievements()).toEqual([{ id: 'first-drop', unlockedAtMs: 999 }]);
  });
});

describe('resetDB', () => {
  it('clears both stores', async () => {
    await addLog({ timestampMs: 1, amountMl: 1 });
    await addAchievement({ id: 'x', unlockedAtMs: 1 });
    await resetDB();
    expect(await getAllLogs()).toEqual([]);
    expect(await getAchievements()).toEqual([]);
  });
});

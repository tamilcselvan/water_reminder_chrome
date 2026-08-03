import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { LogEntry, AchievementRecord } from './types';

interface HydroDB extends DBSchema {
  logs: {
    key: number;
    value: LogEntry;
    indexes: { 'by-timestamp': number };
  };
  achievements: {
    key: string;
    value: AchievementRecord;
  };
}

let dbPromise: Promise<IDBPDatabase<HydroDB>> | null = null;
let dbInstance: IDBPDatabase<HydroDB> | null = null;

function getDB(): Promise<IDBPDatabase<HydroDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HydroDB>('hydro-db', 1, {
      upgrade(db) {
        const logs = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
        logs.createIndex('by-timestamp', 'timestampMs');
        db.createObjectStore('achievements', { keyPath: 'id' });
      },
    }).then((db) => {
      dbInstance = db;
      return db;
    });
  }
  return dbPromise;
}

export async function addLog(entry: Omit<LogEntry, 'id'>): Promise<number> {
  const db = await getDB();
  return db.add('logs', entry as LogEntry);
}

export async function getAllLogs(): Promise<LogEntry[]> {
  const db = await getDB();
  return db.getAll('logs');
}

export async function getLogsSince(sinceMs: number): Promise<LogEntry[]> {
  const db = await getDB();
  const range = IDBKeyRange.lowerBound(sinceMs);
  return db.getAllFromIndex('logs', 'by-timestamp', range);
}

export async function getAchievements(): Promise<AchievementRecord[]> {
  const db = await getDB();
  return db.getAll('achievements');
}

export async function addAchievement(record: AchievementRecord): Promise<void> {
  const db = await getDB();
  await db.put('achievements', record);
}

export async function resetDB(): Promise<void> {
  const db = await getDB();
  await db.clear('logs');
  await db.clear('achievements');
}

export function __resetDBConnectionForTests(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  dbPromise = null;
}

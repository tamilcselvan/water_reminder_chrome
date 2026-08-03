export function dateKeyFromTimestamp(timestampMs: number): string {
  const d = new Date(timestampMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayDateKey(now: number = Date.now()): string {
  return dateKeyFromTimestamp(now);
}

export function minutesSinceLocalMidnight(timestampMs: number): number {
  const d = new Date(timestampMs);
  return d.getHours() * 60 + d.getMinutes();
}

export function previousDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return dateKeyFromTimestamp(dt.getTime());
}

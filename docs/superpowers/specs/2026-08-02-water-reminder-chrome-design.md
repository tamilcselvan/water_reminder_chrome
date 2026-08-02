# Water Reminder Chrome Extension — Design

Date: 2026-08-02

## Purpose

A Chrome extension that reminds the user to drink water at a regular interval and motivates
adherence through streaks, a daily progress ring, achievements, and history stats. All data is
stored locally on-device (no backend, no sync, no external network calls).

## Tech Stack

- Manifest V3 Chrome extension
- React + TypeScript + Vite for the popup and options page UI
- Framer Motion for animations/micro-interactions
- IndexedDB (via the `idb` wrapper) as the local database for the drink log and achievements
- `chrome.storage.local` for settings and fast-access derived state
- `chrome.alarms` for scheduling reminders; `chrome.notifications` for the OS-level reminder with
  action buttons
- Vitest for unit tests of pure logic (`lib/`)

## Architecture

Four pieces, connected through a shared logic module so behavior isn't duplicated:

- **Background service worker** (`src/background/`) — owns `chrome.alarms` scheduling, fires
  `chrome.notifications` with action buttons ("Log {defaultAmount}" / "Snooze 15m"), updates the
  toolbar badge text, and enforces smart-pause rules (active-hours window, goal-met auto-pause).
- **Popup** (`src/popup/`, React root opened from the toolbar icon) — three views:
  - **Today** — progress ring, quick-add buttons (+100/+250/+500ml), custom amount input, streak
    flame.
  - **Stats** — weekly/monthly bar chart and history list, built from `logs`.
  - **Achievements** — badge grid, built from `achievements`.
- **Options page** (`src/options/`, full tab) — daily goal, reminder interval, units (ml/oz),
  active-hours window, notification toggle, data export/reset.
- **Shared core module** (`src/lib/`) — storage access, goal/streak calculations, alarm-scheduling
  math, and achievement rules. Imported by both the background worker and the popup so the two
  surfaces never disagree about "is today's goal met" or "what's the current streak."

## Data Model

### IndexedDB (`hydro-db`, via `idb`)

- `logs` store — one row per drink, append-only: `{ id, timestampMs, amountMl }`. Source of truth
  for history charts and lifetime totals.
- `achievements` store — one row per unlocked badge: `{ id, unlockedAtMs }`.

### `chrome.storage.local`

- `settings`: `{ dailyGoalMl, intervalMinutes, units, activeHours: { start, end } | null,
  notificationsEnabled }`
- `todayCache`: `{ dateKey, totalMl, goalMetAt: timestampMs | null }` — recomputed on every log
  write. Lets the background worker decide whether to pause reminders without touching IndexedDB
  on every alarm tick.
- `streak`: `{ currentStreak, longestStreak, lastGoalMetDateKey }` — updated when goal-met is
  confirmed and again at day rollover.

## Reminder & Smart-Pause Logic

1. On install or settings change, the background worker computes the next alarm time, honoring
   `activeHours` — if the computed time falls outside the window, it's pushed to the window's
   start time (next day if needed).
2. On alarm fire: if `todayCache.goalMetAt` is already set, skip firing and reschedule for the
   next active-hours window start. Otherwise, fire a notification with "Log {defaultAmount}" and
   "Snooze 15m" actions, and schedule the *next* regular-cadence alarm immediately. Snooze creates
   a one-off extra alarm; it does not replace the regular cadence.
3. Any log action (notification button, popup quick-add, or custom amount) goes through the same
   `lib/` function: write to `logs`, recompute and write `todayCache`, update `streak` if the goal
   was just met, update the toolbar badge.
4. Day rollover is detected lazily: any popup open or alarm fire recomputes `dateKey` from the
   current time rather than trusting a previously scheduled rollover alarm. This makes a missed
   midnight alarm (e.g. laptop asleep) self-correct instead of leaving stale state. On rollover,
   `todayCache` resets and the streak increments or resets to 0 based on whether the prior day's
   goal was met.
5. Interval is clamped to a minimum of 5 minutes (Chrome's alarms API has coarse granularity in
   MV3); the options page communicates this minimum.

## Visual & Motion Design

**Theme:** calm aqua/blue gradient. Light mode: `#e0f7fa` → `#4fc3f7` background gradient. Dark
mode (via `prefers-color-scheme`): deep navy → cyan gradient. Rounded cards, water-drop
iconography throughout.

**Motions (Framer Motion), all 150–400ms, purposeful rather than decorative-for-its-own-sake:**

- Progress ring: SVG circle, `strokeDashoffset` animates on mount and on every log with an
  eased (not linear) curve, reading like liquid filling rather than a mechanical sweep.
- Quick-add tap: button does a small scale-bounce; a droplet/ripple burst animates from the tap
  point into the ring.
- Streak flame: idle pulse/flicker loop (scale + opacity); a bigger "ignite" animation plays when
  the streak increments.
- Achievement unlock: badge card scales/flies in with a one-time shimmer sweep, shown the first
  time the popup opens after unlock.
- Tab switches (Today/Stats/Achievements): crossfade + slight slide via `AnimatePresence`.
- Toolbar badge text updates instantly (e.g. `75%`, `✓` at goal) — Chrome doesn't support
  animating the badge itself.

`prefers-reduced-motion` disables purely decorative motion (ripple, flame flicker) while keeping
functional transitions (tab switches, ring fill) at a reduced/instant scale.

## Error Handling

- IndexedDB open failure (e.g. certain incognito/private states) → fall back to an in-memory log
  for the session, show a small non-blocking banner in the popup; settings still function via
  `chrome.storage.local`.
- Notification permission denied → extension still works (badge + popup); options page notes that
  reminders require notification permission.
- Custom amount input is clamped to 1–5000ml and rejects non-numeric input.
- See "Day rollover" above for the missed-midnight-alarm self-correction.

## Testing Approach

- This is a Manifest V3 Chrome extension; it cannot be exercised through the sandboxed browser
  preview tool (that tool only navigates URLs — it can't load an unpacked extension). After
  building, exact steps will be provided to load it via `chrome://extensions` → "Load unpacked" in
  a real Chrome browser, and the golden path will be walked through together: set goal → receive
  reminder → log water (notification and popup paths) → see ring/streak animate → check
  stats/achievements → verify smart-pause (active hours, snooze, goal-met auto-pause).
- Pure logic in `src/lib/` (streak calculation, goal-met detection, alarm-scheduling math,
  achievement unlock rules) gets unit tests via Vitest, since that can be verified without a
  browser.
- Any behavior that can't be verified through available tooling will be stated explicitly rather
  than assumed to work.

## Out of Scope (YAGNI)

- No backend, sync across devices, or account system.
- No calculated goal from body weight/activity (manual entry only, per decision).
- No preset goal profiles.
- No full-screen/in-page overlay reminder style (notifications + badge only, per decision).

# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

Hydro — a Manifest V3 Chrome extension (water-drinking reminder) built with Vite + `@crxjs/vite-plugin`, React 19 + TypeScript, Framer Motion, and Vitest. Zero backend, zero network calls — all data stays on-device.

## Commands

```bash
npm install
npm test             # vitest run — run once
npm run test:watch   # vitest watch mode
npm run build        # tsc --noEmit && vite build (this is the real gate — vitest does NOT type-check)
npm run dev           # vite dev server
```

**Always run both `npm test` and `npm run build` (or at least `npx tsc --noEmit`) before considering a change done.** Vitest uses esbuild, which strips types without checking them — a change can pass every test and still fail `tsc --noEmit`. This has happened multiple times during this project's history (see Known gotchas below).

## Architecture

- `src/background/index.ts` — the service worker. Owns alarm scheduling (`scheduleNextReminder`), badge updates (`updateBadge`), notification firing/handling (`fireReminderIfDue`), and reacts to `chrome.storage.onChanged`. Registers its listeners as an import side effect.
- `src/lib/` — pure, framework-free core shared by the background worker and the UI. Never import React or `chrome.*` UI concerns here.
  - `types.ts` — shared types and constants (`MIN_INTERVAL_MINUTES = 5`, `MIN_AMOUNT_ML = 1`, `MAX_AMOUNT_ML = 5000`, `MIN_DAILY_GOAL_ML = 100`).
  - `dateUtils.ts` — local-time date-key helpers. Prefer calendar-date arithmetic (`previousDateKey`-style `Date` field manipulation) over fixed millisecond offsets — DST transitions break `now - N * DAY_MS` day-walking (this bit the Stats view once; see below).
  - `storage.ts` — `chrome.storage.local` wrapper for `settings`/`todayCache`/`streak`. Both `getTodayCache` and `getStreak` are **self-correcting**: they compare the stored `dateKey` against today's real date and reset if stale. If you add a new stored value with day-based semantics, make sure its getter self-corrects the same way, or it'll show stale data until the next write.
  - `db.ts` — IndexedDB (`hydro-db`) for `logs` and `achievements`, via `idb`. `__resetDBConnectionForTests()` closes the open connection before `indexedDB.deleteDatabase()` — required, or the delete hangs.
  - `goal.ts` / `streak.ts` — pure goal-met and streak-transition logic. `goalPercent()` is the single source of truth for the goal percentage (badge and `ProgressRing` both use it) — don't reintroduce a duplicate formula.
  - `achievements.ts` — the achievement catalog and unlock-detection.
  - `alarmScheduler.ts` — active-hours-aware scheduling math (`isWithinActiveHours`, `computeNextReminderTime`, `computeWindowStartAfter`).
  - `logAction.ts` — `logDrink()` is the **single write path**. Every caller that logs a drink (popup quick-add, popup custom amount, the notification button) must go through this function, not write to storage/db directly.
- `src/popup/` — React popup, 3 tabs (Today/Stats/Achievements). `Popup.tsx` wraps everything in Framer Motion's `<MotionConfig reducedMotion="user">` so any new `motion.*` component automatically respects `prefers-reduced-motion` — except **`opacity` keyframe animations are not covered by that config** (only positional/transform keys are); use `useReducedMotion()` directly for anything that animates opacity in a loop (see `StreakFlame.tsx`).
- `src/options/` — the options page, a separate HTML entry point from the popup.
- `src/testUtils/chromeMock.ts` — in-memory `chrome.*` mock. `installChromeMock()` returns handles including a `fire` namespace that lets tests simulate Chrome firing `storage.onChanged`, `alarms.onAlarm`, `notifications.onButtonClicked`, `runtime.onInstalled`/`onStartup` — use this to test the background worker's actual listener wiring, not just its exported functions in isolation.

## Conventions

- **`logDrink()` is the only place that writes a log.** Never call `addLog`/`setTodayCache`/`setStreak` directly from UI or notification-handler code.
- **Animations:** one-shot/functional transitions should be 150–400ms; ambient/decorative loops (e.g. `StreakFlame`'s pulse) are exempt from that duration cap but must still be disabled under `prefers-reduced-motion`.
- **Amount/interval/goal clamps are enforced in two places on purpose:** once in the UI (reject with a `role="alert"` message) and once at the point of use (e.g. `scheduleNextReminder` clamps `intervalMinutes` against `MIN_INTERVAL_MINUTES`, `updateBadge`/`goalPercent` guard against a zero/negative goal). Don't remove the defensive copy just because the UI already validates — settings can be corrupted or written from outside the UI.
- **Tests use real behavior, not implementation internals** — assert through public interfaces (`screen.getByRole`, `data-testid`, hook return values), not component state.
- No new dependencies without updating the pinned-version list — this project intentionally pins exact versions (see `package.json`) verified to work together.

## Known gotchas (found the hard way — don't reintroduce)

- `@types/chrome`'s `NotificationOptions` is **not generic** — don't write `chrome.notifications.NotificationOptions<true>`.
- Day-bucketing/scheduling math must use calendar-date arithmetic, not `now ± N * 24*60*60*1000` — DST transitions make a "day" 23 or 25 hours long in local time.
- A nested `function` declaration that closes over a variable narrowed by an earlier `if (!x) return` does **not** retain that narrowing in TypeScript the way a `const` arrow function expression does — prefer arrow functions for closures over narrowed outer variables.
- The background worker's `chrome.storage.onChanged` listener must react to `changes.todayCache` (not just `changes.settings`) or the toolbar badge goes stale after a popup log until the next heartbeat alarm.

## Reference docs

- `docs/LOAD_UNPACKED.md` — manual load-unpacked + golden-path verification walkthrough (requires a real Chrome instance).

# Hydro — Water Reminder

A Manifest V3 Chrome extension that reminds you to drink water on a schedule and motivates adherence via a progress ring, streaks, achievements, and a weekly history chart. Everything runs and stays on-device — no backend, no network calls.

## Features

- **Reminders** on a configurable interval (minimum 5 minutes), optionally restricted to an active-hours window (e.g. 08:00–21:00).
- **Notifications** with quick actions: log the default amount or snooze 15 minutes, right from the notification.
- **Today tab**: animated progress ring, streak flame, quick-add buttons (100/250/500ml) plus a custom amount (1–5000ml).
- **Stats tab**: a 7-day bar chart of daily water intake.
- **Achievements tab**: unlockable badges (first log, streak milestones, 100 logs).
- **Toolbar badge**: live percentage of today's goal, switching to a checkmark once met.
- **Options page**: daily goal, reminder interval, units, active hours, notification toggle, data export (JSON), and reset.

## Tech stack

- [Vite](https://vitejs.dev/) + [`@crxjs/vite-plugin`](https://crxjs.dev/vite-plugin) for the extension build
- React 19 + TypeScript
- [Framer Motion](https://www.framer.com/motion/) for animation (respects `prefers-reduced-motion`)
- [`idb`](https://github.com/jakearchibald/idb) (IndexedDB) for logs and achievements; `chrome.storage.local` for settings/today-cache/streak
- [Vitest](https://vitest.dev/) + `@testing-library/react` + `fake-indexeddb` for tests

## Getting started

```bash
npm install
npm run build
```

Then load it as an unpacked extension:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this project's `dist/` folder.

See [docs/LOAD_UNPACKED.md](docs/LOAD_UNPACKED.md) for a full golden-path walkthrough (logging water, checking the badge, notifications, stats, achievements, active hours, export/reset).

## Development

```bash
npm run dev          # Vite dev server (for iterating on UI in isolation)
npm test             # run the test suite once
npm run test:watch   # watch mode
npm run build        # type-check + production build to dist/
```

## Architecture

- `src/background/index.ts` — the service worker: schedules reminder alarms, fires notifications, updates the toolbar badge, and reacts to storage changes.
- `src/lib/` — pure, framework-free core shared by both the background worker and the UI: types, date utilities, storage wrappers (`chrome.storage.local` and IndexedDB), goal/streak logic, the achievements catalog, alarm-scheduling math, and the single `logDrink()` write path used by every caller (quick-add, custom amount, and the notification button).
- `src/popup/` — the React popup (Today / Stats / Achievements tabs), including `useHydroState`, a hook that keeps the UI in sync with `chrome.storage` changes.
- `src/options/` — the extension's options page.
- `src/testUtils/chromeMock.ts` — an in-memory mock of the `chrome.*` extension APIs used across the test suite.

## Permissions & privacy

Manifest permissions are limited to `alarms`, `notifications`, and `storage` — no `host_permissions`, no network access, no remote code. All data (logs, streaks, achievements, settings) stays in the browser's local storage.

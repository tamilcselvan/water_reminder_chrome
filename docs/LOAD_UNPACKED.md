# Loading Hydro as an unpacked extension

1. Run `npm run build` (produces `dist/`).
2. Open `chrome://extensions` in Chrome.
3. Enable "Developer mode" (top-right toggle).
4. Click "Load unpacked" and select this project's `dist/` folder.
5. Pin the "Hydro — Water Reminder" icon to the toolbar for easy access.

## Golden-path walkthrough

1. Click the toolbar icon → **Today** tab. Confirm the progress ring shows `0%` and the
   streak flame shows `0 day streak` on first install.
2. Click **+250ml**. Confirm the ring animates its fill, the total updates, and the badge
   text on the toolbar icon updates to a percentage.
3. Open the extension's options page (right-click the icon → "Options", or via
   `chrome://extensions` → Hydro → "Extension options"). Lower the daily goal to something
   small (e.g. 300ml) and set the reminder interval to 5 minutes (the minimum).
4. Log enough water via the popup to reach the lowered goal. Confirm the badge changes to
   `✓` and the streak count increments to 1.
5. Wait for a reminder notification. (Step 3 sets the reminder interval to 5 minutes, so the
   wait should be short.) Confirm it has "Log 250ml" and "Snooze 15m" buttons, and clicking
   "Log 250ml" updates the popup's total without opening the popup.
6. Check the **Stats** tab — confirm a 7-day bar chart appears with today's bar showing the
   logged total.
7. Check the **Achievements** tab — confirm "First Drop" shows unlocked (full opacity) and
   the rest show locked (dimmed).
8. In Options, toggle "Limit reminders to active hours" and set a narrow window that
   excludes the current time. Confirm no new reminder notification fires while outside the
   window.
9. In Options, click "Export data" — confirm a `hydro-export.json` file downloads containing
   `settings`, `logs`, and `achievements`.
10. In Options, click "Reset all data", confirm the browser confirmation dialog, and confirm
    the Today/Stats/Achievements tabs all return to their zero state.

Any step that doesn't behave as described here should be reported back rather than assumed
fixed.

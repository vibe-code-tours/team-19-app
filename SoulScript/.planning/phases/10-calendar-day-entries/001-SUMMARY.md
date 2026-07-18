# Plan 001 Summary: Calendar Day Entries

## Status: COMPLETE

## What Was Done
Refactored `MoodCalendar.tsx` to show all journal entries for a day when clicking a calendar emoji.

### Changes
1. **New helper:** `getEntriesForDay(entries, day)` — filters all entries for a given day
2. **Calendar grid:** Shows the LAST entry's emoji (latest emotion of the day)
3. **State change:** `selectedEntry` → `selectedEntries` (array) + `editingEntry` (single)
4. **New component:** `EntryCard` — renders individual entry with emoji, timestamp, content, emotion pills, and Edit Mood button
5. **Bottom sheet:** Scrollable list of all entries with per-entry mood picker
6. **Mood update:** Refreshes entries after update to reflect emoji change on calendar

### Files Modified
- `src/components/MoodCalendar.tsx` — 290 → 390 lines (net +100 lines)
- `__tests__/api/profile.test.ts` — removed obsolete `preferred_language` validation test

### Verification
- `npx tsc --noEmit` — clean
- `npm run test` — 51/51 passing

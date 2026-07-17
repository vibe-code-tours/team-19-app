---
phase: 11-dashboard-entry-list-optimistic-updates
reviewed: 2026-07-15T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - __tests__/api/entries.test.ts
  - __tests__/hooks/useCreateEntry.test.tsx
  - __tests__/hooks/useDeleteEntry.test.tsx
  - __tests__/hooks/useTodayEntries.test.tsx
  - __tests__/lib/utils.test.ts
  - src/app/api/entries/route.ts
  - src/app/api/entries/[id]/route.ts
  - src/app/page.tsx
  - src/components/EntryCard.tsx
  - src/components/EntryList.tsx
  - src/components/MoodCalendar.tsx
  - src/hooks/useCreateEntry.ts
  - src/hooks/useDeleteEntry.ts
  - src/hooks/useTodayEntries.ts
  - src/lib/types.ts
  - src/lib/utils.ts
findings:
  critical: 2
  warning: 4
  info: 2
  total: 8
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-07-15T00:00:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

This phase implements optimistic updates for the journal entry list using TanStack Query mutations (`useCreateEntry`, `useDeleteEntry`) with rollback on error, a new `useTodayEntries` query hook, an `EntryCard` component with expand/collapse, and an `EntryList` with Framer Motion animations. The optimistic update pattern is well-structured overall. However, two critical issues exist in the `MoodCalendar` component: the loading state can become permanently stuck when the API returns an error, and the mood update handler silently ignores server failures. Additional warnings involve inconsistent error handling in the undo flow and missing null safety in a few places.

## Critical Issues

### CR-01: MoodCalendar loading state permanently stuck on API error

**File:** `src/components/MoodCalendar.tsx:122-135`
**Issue:** The `useEffect` that fetches calendar entries only calls `setLoading(false)` inside a conditional `if (!cancelled && data.entries)` block. When the API returns a non-200 response (e.g., 401 unauthorized, 500 server error), `data.entries` is `undefined`, so `setLoading(false)` is never invoked. The component remains in the loading skeleton state indefinitely with no way for the user to recover.
**Fix:**
```typescript
useEffect(() => {
  let cancelled = false;
  async function load() {
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    try {
      const res = await fetch(`/api/entries?month=${monthStr}`);
      const data = await res.json();
      if (!cancelled) {
        setEntries(data.entries || []);
        setLoading(false);
      }
    } catch {
      if (!cancelled) {
        setEntries([]);
        setLoading(false);
      }
    }
  }
  load();
  return () => { cancelled = true; };
}, [year, month]);
```

### CR-02: MoodCalendar handleMoodUpdate ignores server errors

**File:** `src/components/MoodCalendar.tsx:147-166`
**Issue:** The `handleMoodUpdate` function fires a PATCH request but never checks `res.ok`. If the server returns an error (e.g., 400 invalid emotion, 404 entry not found, 500 server error), the function still sets `moodUpdateSuccess` to `true` and shows "Mood updated" to the user. The calendar then refreshes via `setCurrentDate(new Date(currentDate))`, but the entry's mood was never actually changed on the server.
**Fix:**
```typescript
async function handleMoodUpdate(
  entryId: string,
  newMood: string,
  newEmoji: string
) {
  try {
    const res = await fetch(`/api/entries/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ primary_emotion: newMood, emoji: newEmoji }),
    });
    if (!res.ok) {
      // Show error state instead of success
      return;
    }
    setMoodUpdateSuccess(true);
    setTimeout(() => {
      setMoodUpdateSuccess(false);
      setShowMoodPicker(false);
      setEditingEntry(null);
      setCurrentDate(new Date(currentDate));
    }, 1500);
  } catch {
    // Handle network error
  }
}
```

## Warnings

### WR-01: handleUndo proceeds silently when delete fails

**File:** `src/app/page.tsx:110-119`
**Issue:** The `handleUndo` function calls `deleteEntry.mutateAsync(toast.entryId)` but the `catch` block is completely empty. If the server-side delete fails, the optimistic rollback in `useDeleteEntry` re-adds the entry to the cache (correct), but `handleUndo` still unconditionally restores the content and clears the toast on lines 117-119. The user perceives the undo as successful, but the entry still exists on the server and will reappear on the next refetch.
**Fix:** Either show a brief error notification when the delete fails, or at minimum do not clear the toast so the user can retry:
```typescript
async function handleUndo() {
  if (!toast) return;
  try {
    await deleteEntry.mutateAsync(toast.entryId);
    setContent(savedDraft);
    setSavedDraft("");
    setToast(null);
  } catch {
    // Optionally show error: "Could not undo. Entry may reappear."
    // Do NOT clear toast/savedDraft so user sees the entry reappear from rollback
  }
}
```

### WR-02: supabase client created on every render and used as useEffect dependency

**File:** `src/app/page.tsx:35,64`
**Issue:** `createClient()` is called in the component body on every render (line 35), and the resulting `supabase` object is listed as a dependency of the `useEffect` on line 64. While `createBrowserClient` from `@supabase/ssr` is designed to return a singleton, this pattern is fragile. If the library's behavior changes or if `createBrowserClient` ever returns a new reference, the effect would re-run on every render, causing redundant profile fetches. The `supabase` variable should be created outside the component or stabilized with `useRef`.
**Fix:**
```typescript
// Move to module scope or use useRef
const supabase = createClient();

// Or inside component:
const supabaseRef = useRef(createClient());
const supabase = supabaseRef.current;
```

### WR-03: EntryCard crashes if secondary_emotions is null/undefined

**File:** `src/components/EntryCard.tsx:47`
**Issue:** `entry.secondary_emotions.map(...)` is called without a null check. While the `JournalEntry` type declares `secondary_emotions: string[]`, stale cache data from optimistic updates or API edge cases could produce entries with `null` or `undefined` for this field, causing a runtime crash. The same issue exists in `MoodCalendar.tsx:88`.
**Fix:**
```typescript
{entry.secondary_emotions?.map((emotion) => (
  // ...
))}
```

### WR-04: entries/route.ts decrypt called without null-checking content_iv

**File:** `src/app/api/entries/route.ts:58`
**Issue:** The line `decrypt(e.content, e.content_iv)` will throw if `content_iv` is `null` or `undefined`. This can happen if a database row has corrupted data or was inserted without encryption. The thrown error is caught by the outer catch block, which returns a generic 500, but the actual cause is obscured and the entire entries fetch fails for all entries.
**Fix:**
```typescript
const decryptedEntries = entries?.map((e) => ({
  ...e,
  content: e.content_iv ? decrypt(e.content, e.content_iv) : e.content,
})) || [];
```

## Info

### IN-01: MoodCalendar uses raw fetch instead of TanStack Query

**File:** `src/components/MoodCalendar.tsx:122-135`
**Issue:** The rest of the application uses TanStack Query for data fetching (`useTodayEntries`, `useCreateEntry`, `useDeleteEntry`), but `MoodCalendar` uses raw `fetch` with `useState` and `useEffect`. This means the calendar page lacks automatic refetching, caching, deduplication, and consistent error/loading state management that the dashboard enjoys. It also means the calendar entries and dashboard entries use different data paths, so changes made on the dashboard are not reflected on the calendar without manual state manipulation (line 164: `setCurrentDate(new Date(currentDate))`).
**Fix:** Consider creating a `useMonthEntries(year, month)` hook using TanStack Query, similar to `useTodayEntries`, to unify the data fetching pattern.

### IN-02: Encryption module has redundant non-null assertion

**File:** `src/lib/encryption.ts:7-8`
**Issue:** `process.env.ENCRYPTION_KEY!` uses a non-null assertion, and the immediately following line checks `if (!keyHex)`. The `!` assertion is unnecessary since the runtime check already handles the null case. Removing it would make the code more honest about the possibility of a missing env var.
**Fix:**
```typescript
const keyHex = process.env.ENCRYPTION_KEY;
if (!keyHex) throw new Error("ENCRYPTION_KEY environment variable is not set");
```

---

_Reviewed: 2026-07-15T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

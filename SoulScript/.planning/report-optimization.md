# Report Optimization - Session Summary

## Date: July 18, 2026

## Overview
Fixed multiple issues with the report generation flow to improve performance and correctness.

## Issues Fixed

### 1. Month Display Bug
**Problem:** When clicking "Generate AI Report" from the Mood Calendar while viewing June, the report page would show July data instead.

**Root Cause:** The calendar navigation to `/report` didn't pass the month parameter, so the report page defaulted to the current month.

**Fix:** Updated `MoodCalendar.tsx` to pass the month as a query parameter:
```typescript
// Before
onClick={() => router.push("/report")}

// After
onClick={() => router.push(`/report?month=${year}-${String(month + 1).padStart(2, '0')}`)}
```

**File:** `SoulScript/src/components/MoodCalendar.tsx` (line 221)

---

### 2. Unnecessary POST Calls
**Problem:** The report page always called POST on load, even when a cached report already existed and was up-to-date.

**Root Cause:** No staleness check to determine if the report needed regeneration.

**Fix:** Added intelligent staleness check to avoid unnecessary API calls.

**Files Modified:**
- `SoulScript/src/app/api/report/route.ts` (GET endpoint)
- `SoulScript/src/hooks/useReport.ts`
- `SoulScript/src/app/report/page.tsx`

---

### 3. Missing Timestamp Data
**Problem:** Client couldn't determine if new entries existed since the report was last generated.

**Fix:** Updated GET endpoint to return timestamps:
```typescript
// Added to GET response
latestEntryTime: string | null;      // Most recent entry timestamp
reportCreatedAt: string | null;      // When report was last generated
```

**Implementation in GET endpoint:**
```typescript
// Calculate latest entry time
const latestEntryTime = entries && entries.length > 0
  ? entries.reduce((latest, entry) =>
      new Date(entry.created_at) > new Date(latest) ? entry.created_at : latest
    , entries[0].created_at)
  : null;

return NextResponse.json({
  stats: { ... },
  report: report ? { ... } : null,
  latestEntryTime,
  reportCreatedAt: report?.created_at || null,
});
```

---

### 4. Stale Report Timestamps
**Problem:** When a report was regenerated via POST, the `created_at` timestamp wasn't updated, breaking staleness detection.

**Root Cause:** The upsert operation didn't include `created_at`, so it only set the timestamp on INSERT, not UPDATE.

**Fix:** Explicitly update `created_at` on every regeneration:
```typescript
const { data: savedReport } = await supabase
  .from("monthly_reports")
  .upsert({
    user_id: user.id,
    month_year: month,
    summary_overview: report.summary_overview,
    dominant_mood: report.dominant_mood,
    pattern_insights: report.pattern_insights,
    actionable_recommendations: report.actionable_recommendations,
    created_at: new Date().toISOString(), // ← Updates on every regeneration
  }, { onConflict: "user_id,month_year" })
```

---

### 5. Staleness Check Logic
**Problem:** Need to determine when to call POST vs use cached report.

**Fix:** Added staleness check in report page useEffect:
```typescript
useEffect(() => {
  if (isLoading || !hasEnoughEntries || generatedRef.current) return;
  generatedRef.current = true;

  // Check if report is up-to-date
  if (report && latestEntryTime && reportCreatedAt) {
    const hasNewEntries = new Date(latestEntryTime) > new Date(reportCreatedAt);
    if (!hasNewEntries) return; // Report is current, skip POST
  }

  // Call POST if needed
  async function generate() { ... }
  generate();
}, []);
```

**Decision Logic:**
- **No report exists** → Call POST (generate new report)
- **Report exists + new entries** → Call POST (regenerate with new data)
- **Report exists + no new entries** → Skip POST (use cached report)

---

## Files Modified

| File | Changes |
|------|---------|
| `SoulScript/src/components/MoodCalendar.tsx` | Pass month parameter when navigating to report |
| `SoulScript/src/app/api/report/route.ts` | Add timestamps to GET response, update created_at on POST |
| `SoulScript/src/hooks/useReport.ts` | Add timestamp fields to ReportResponse interface |
| `SoulScript/src/app/report/page.tsx` | Add staleness check before calling POST |

---

## Performance Improvements

### Before
- Every page load → POST call to generate/report
- Unnecessary API calls even with cached reports
- Reports could become stale if new entries added

### After
- First load → GET request only (fast)
- POST only called when:
  - No report exists
  - New entries added since last generation
- Reports automatically update when new entries are added
- Cached reports load instantly

---

## Testing Scenarios

### Scenario 1: First Time Viewing Month
1. User navigates to `/report?month=2026-06`
2. GET returns `report: null`
3. Staleness check: `report` is null → Call POST
4. POST generates report, sets `created_at`
5. Report displayed

### Scenario 2: View Existing Report (No Changes)
1. User navigates to `/report?month=2026-06`
2. GET returns `report` with `created_at = "2026-07-18T02:55:45Z"`
3. GET returns `latestEntryTime = "2026-07-18T02:50:00Z"`
4. Staleness check: `2:50 AM < 2:55 AM` → Skip POST
5. Cached report displayed instantly

### Scenario 3: View Report After New Entry
1. User adds entry at `2026-07-18T05:10:37Z`
2. User navigates to `/report?month=2026-06`
3. GET returns `report` with `created_at = "2026-07-18T02:55:45Z"`
4. GET returns `latestEntryTime = "2026-07-18T05:10:37Z"`
5. Staleness check: `5:10 AM > 2:55 AM` → Call POST
6. POST regenerates report, updates `created_at` to `5:10 AM`
7. Updated report displayed

### Scenario 4: View Report for Different Month
1. User views June in calendar
2. User clicks "Generate AI Report"
3. Navigates to `/report?month=2026-06` (not July)
4. Correct month's report displayed

---

## Edge Cases Handled

1. **No entries for month:** `latestEntryTime` is null, staleness check skipped, POST called if no report
2. **Report exists but no entries:** `hasEnoughEntries` is false, useEffect returns early
3. **Multiple entries:** `latestEntryTime` correctly identifies most recent entry
4. **Timezone handling:** Uses UTC dates to avoid timezone-related bugs
5. **Concurrent requests:** `generatedRef.current` prevents duplicate POST calls

---

## Conventional Commit

```
fix: optimize report generation with staleness check

- Pass month parameter from calendar to report page
- Add timestamps (latestEntryTime, reportCreatedAt) to GET response
- Update created_at on report regeneration
- Skip POST call when report is up-to-date (no new entries)
- Fix month display bug where June showed July data
```

---

## Future Improvements

1. **Manual refresh button:** Allow users to force regeneration even if report is current
2. **Background updates:** Use webhooks or polling to detect new entries and auto-regenerate
3. **Report versioning:** Keep history of previous report versions
4. **Partial updates:** Update only changed sections instead of full regeneration
5. **Cache invalidation:** Implement smarter cache invalidation based on entry timestamps

---

## Related Files

- `SoulScript/src/app/report/page.tsx` - Report page component
- `SoulScript/src/app/api/report/route.ts` - Report API endpoints (GET/POST)
- `SoulScript/src/hooks/useReport.ts` - React Query hook for report data
- `SoulScript/src/components/MoodCalendar.tsx` - Calendar component with report navigation
- `SoulScript/src/lib/report-stats.ts` - Statistics computation utilities

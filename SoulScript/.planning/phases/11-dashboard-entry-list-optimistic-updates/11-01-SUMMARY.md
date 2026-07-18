---
phase: 11-dashboard-entry-list-optimistic-updates
plan: 01
subsystem: data-layer
tags: [tanstack-query, optimistic-updates, typescript, vitest, api]

# Dependency graph
requires:
  - phase: 10-calendar-day-entries
    provides: "Calendar UI with entry overlay and mood picker"
provides:
  - "Shared JournalEntry interface in src/lib/types.ts"
  - "relativeTime utility in src/lib/utils.ts"
  - "useTodayEntries hook for fetching today's entries"
  - "useCreateEntry hook with optimistic insert"
  - "useDeleteEntry hook with optimistic remove"
  - "GET /api/entries extended with day (YYYY-MM-DD) param"
affects: [11-02-entry-card-entry-list, 11-03-dashboard-refactor]

# Tech tracking
tech-stack:
  added: []
  patterns: ["TanStack Query optimistic updates with rollback", "conditional query operators (lte vs lt)"]

key-files:
  created:
    - src/lib/types.ts
    - src/lib/utils.ts
    - src/hooks/useTodayEntries.ts
    - src/hooks/useCreateEntry.ts
    - src/hooks/useDeleteEntry.ts
    - __tests__/lib/utils.test.ts
    - __tests__/hooks/useTodayEntries.test.tsx
    - __tests__/hooks/useCreateEntry.test.tsx
    - __tests__/hooks/useDeleteEntry.test.tsx
  modified:
    - src/app/api/entries/route.ts
    - __tests__/api/entries.test.ts

key-decisions:
  - "Day param uses .lte (inclusive) while month param uses .lt (exclusive) for correct boundary behavior"
  - "Optimistic temp entries use crypto.randomUUID() not Date.now() to avoid collisions"
  - "Test files use .tsx extension for JSX QueryClientProvider wrapper"

patterns-established:
  - "Optimistic update pattern: cancelQueries -> snapshot -> setQueryData -> onError rollback -> onSettled invalidate"
  - "Mutation context typing: explicit generic parameter for onMutate return type"

requirements-completed: [R7]

# Metrics
duration: 14min
completed: 2026-07-15
---

# Phase 11 Plan 01: Data Layer Foundation Summary

**Shared JournalEntry types, relativeTime utility, TanStack Query hooks for optimistic create/delete, and GET /api/entries day-param extension**

## Performance

- **Duration:** 14 min
- **Started:** 2026-07-15T16:19:35Z
- **Completed:** 2026-07-15T16:33:06Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishes
- Extracted JournalEntry interface to shared types file (single source of truth)
- Created relativeTime utility with 5 time ranges (just now, minutes, hours, days, formatted date)
- Extended GET /api/entries to accept day (YYYY-MM-DD) query param with correct boundary handling
- Built 3 TanStack Query hooks with full optimistic update patterns (cancel, snapshot, rollback, invalidate)
- 83 tests passing (32 new), build passes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared types, utils, extend GET /api/entries with day param** - `760f244` (feat)
2. **Task 2: Create TanStack Query hooks with optimistic updates** - `dcf2e2b` (feat)
3. **Fix: Add explicit context types to mutation hooks** - `cbbc539` (fix)

## Files Created/Modified
- `src/lib/types.ts` - Shared JournalEntry interface
- `src/lib/utils.ts` - relativeTime utility function
- `src/hooks/useTodayEntries.ts` - Fetch today's entries via TanStack Query
- `src/hooks/useCreateEntry.ts` - Optimistic entry creation with temp ID
- `src/hooks/useDeleteEntry.ts` - Optimistic entry deletion with rollback
- `src/app/api/entries/route.ts` - Extended GET with day param, conditional lte/lt
- `__tests__/lib/utils.test.ts` - 12 relativeTime tests
- `__tests__/api/entries.test.ts` - 7 additional day-param tests
- `__tests__/hooks/useTodayEntries.test.tsx` - 4 useTodayEntries tests
- `__tests__/hooks/useCreateEntry.test.tsx` - 5 useCreateEntry tests
- `__tests__/hooks/useDeleteEntry.test.tsx` - 4 useDeleteEntry tests

## Decisions Made
- Day param uses `.lte` (inclusive end-of-day at T23:59:59.999) while month param keeps `.lt` (exclusive first day of next month)
- Optimistic temp entries use `crypto.randomUUID()` for unique IDs (not Date.now() which can collide)
- Test files use `.tsx` extension because vitest's oxc plugin requires it for JSX in test wrappers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added .lte method to chainable mock**
- **Found during:** Task 1 (RED phase for day-param API tests)
- **Issue:** Existing chainable mock in entries.test.ts lacked `.lte` method needed for day-param query
- **Fix:** Added `lte: vi.fn().mockReturnThis()` to chainable function
- **Files modified:** `__tests__/api/entries.test.ts`
- **Verification:** Tests pass with lte mock
- **Committed in:** 760f244 (Task 1 commit)

**2. [Rule 1 - Bug] Renamed test files from .ts to .tsx**
- **Found during:** Task 2 (RED phase for hook tests)
- **Issue:** Vitest's oxc plugin cannot parse JSX in .ts files, causing transform errors
- **Fix:** Renamed all hook test files to .tsx extension
- **Files modified:** `__tests__/hooks/useTodayEntries.test.tsx`, `__tests__/hooks/useCreateEntry.test.tsx`, `__tests__/hooks/useDeleteEntry.test.tsx`
- **Verification:** Tests pass after rename
- **Committed in:** dcf2e2b (Task 2 commit)

**3. [Rule 2 - Missing Critical] Added jsdom environment directive**
- **Found during:** Task 2 (GREEN phase)
- **Issue:** renderHook requires DOM environment (document object) not available in default vitest node environment
- **Fix:** Added `// @vitest-environment jsdom` directive to all hook test files
- **Files modified:** `__tests__/hooks/useTodayEntries.test.tsx`, `__tests__/hooks/useCreateEntry.test.tsx`, `__tests__/hooks/useDeleteEntry.test.tsx`
- **Verification:** Tests pass with jsdom environment
- **Committed in:** dcf2e2b (Task 2 commit)

**4. [Rule 1 - Bug] Added explicit context types to mutation hooks**
- **Found during:** Build verification (post-Task 2)
- **Issue:** TypeScript build error: `Property 'previous' does not exist on type '{}'` — TanStack Query defaults context type to `{}`
- **Fix:** Added explicit 4th generic type parameter to `useMutation` for context typing
- **Files modified:** `src/hooks/useCreateEntry.ts`, `src/hooks/useDeleteEntry.ts`
- **Verification:** Build passes, tests pass
- **Committed in:** cbbc539 (fix commit)

---

**Total deviations:** 4 auto-fixed (1 blocking, 1 bug, 1 missing critical, 1 bug)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
- Vitest's oxc plugin does not support JSX in .ts files (requires .tsx extension)
- renderHook requires jsdom environment (not configured globally in vitest.config.ts)

## Known Stubs
None - all hooks are fully implemented with real API calls and optimistic update logic.

## Threat Flags
None - all files created/modified match the threat model. No new security surface introduced.

## Next Phase Readiness
- All hooks ready for use in EntryCard and EntryList components
- GET /api/entries supports both month and day params (backward compatible)
- Optimistic update patterns established for Phase 11 Plan 02 to follow

## Self-Check: PASSED

All 11 files verified on disk. All 3 commits verified in git log. 83 tests passing. Build succeeds.

---
*Phase: 11-dashboard-entry-list-optimistic-updates*
*Plan: 01*
*Completed: 2026-07-15*

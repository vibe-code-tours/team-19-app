---
phase: 11-dashboard-entry-list-optimistic-updates
plan: 02
subsystem: ui-layer
tags: [framer-motion, tanstack-query, responsive-layout, accordion, optimistic-updates]

# Dependency graph
requires:
  - phase: 11-dashboard-entry-list-optimistic-updates
    plan: 01
    provides: "Shared JournalEntry types, relativeTime utility, TanStack Query hooks"
provides:
  - "EntryCard component with accordion expand/collapse"
  - "EntryList component with animated list and empty state"
  - "Responsive side-by-side dashboard layout (40/60 split)"
  - "TanStack Query integration for optimistic create/delete on dashboard"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: ["Framer Motion popLayout AnimatePresence", "responsive side-by-side with sticky left panel", "accordion expand with height animation"]

key-files:
  created:
    - src/components/EntryCard.tsx
    - src/components/EntryList.tsx
  modified:
    - src/app/page.tsx
    - src/components/MoodCalendar.tsx

key-decisions:
  - "Desktop layout uses 40/60 split with sticky left panel for textarea"
  - "EntryCard uses layout='position' for smooth AnimatePresence transitions"
  - "EntryList uses AnimatePresence mode='popLayout' for list reflow animation"

patterns-established:
  - "Responsive dashboard layout: md:flex-row with md:w-[40%]/md:w-[60%] split"
  - "Mobile-first header visibility: flex md:hidden for mobile, hidden md:flex for desktop"
  - "Accordion pattern: useState toggle + AnimatePresence with height 0->auto"

requirements-completed: [R7]

# Metrics
duration: 4min
completed: 2026-07-15
---

# Phase 11 Plan 02: Entry Card & Entry List Summary

**EntryCard component with accordion expand, EntryList with animated list, responsive dashboard layout with TanStack Query integration**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-15T16:40:53Z
- **Completed:** 2026-07-15T16:45:18Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishes
- Created EntryCard component with compact view (emoji, relative time, content preview) and accordion expand to show full content + emotion pills
- Created EntryList component with AnimatePresence popLayout for animated add/remove, empty state with breathing glassmorphism, and loading skeletons
- Refactored dashboard page to responsive side-by-side layout (40% textarea left, 60% entry list right on desktop; stacked on mobile)
- Integrated TanStack Query hooks (useTodayEntries, useCreateEntry, useDeleteEntry) for optimistic create/delete
- Updated MoodCalendar to use shared JournalEntry type from @/lib/types
- 83 tests passing, build succeeds, lint clean (only pre-existing warnings)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create EntryCard and EntryList components** - `b4b0704` (feat)
2. **Task 2: Refactor dashboard page — responsive layout + TanStack Query integration** - `e4a888f` (feat)
3. **Task 3: Update MoodCalendar imports + run full verification** - `7b3edaa` (refactor)

## Files Created/Modified
- `src/components/EntryCard.tsx` - Compact entry card with accordion expand, emoji, relative time, content preview, emotion pills
- `src/components/EntryList.tsx` - Animated scrollable entry list with AnimatePresence popLayout, empty state, loading skeletons
- `src/app/page.tsx` - Refactored to responsive side-by-side layout with TanStack Query integration
- `src/components/MoodCalendar.tsx` - Updated to use shared JournalEntry type from @/lib/types

## Decisions Made
- Desktop layout uses 40/60 split with sticky left panel so textarea stays visible while scrolling entries
- EntryCard uses layout="position" for smooth AnimatePresence transitions during expand/collapse
- EntryList uses AnimatePresence mode="popLayout" for list reflow animation when entries are added/removed
- Mobile header buttons use "flex md:hidden" to show only on mobile; desktop relies on the sticky left panel

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs
None - all components are fully implemented with real data from TanStack Query hooks.

## Threat Flags
None - all files created/modified match the threat model. No new security surface introduced.

## Self-Check: PASSED

All 4 files verified on disk. All 3 commits verified in git log. 83 tests passing. Build succeeds.

---
*Phase: 11-dashboard-entry-list-optimistic-updates*
*Plan: 02*
*Completed: 2026-07-15*

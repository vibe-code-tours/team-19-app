# Plan: Refactor Report Page

## Goals
- Split 634-line `page.tsx` into focused, testable pieces
- Remove duplicated utility helpers (currently duplicated between `page.tsx` and old `MonthlyReport.tsx`)
- Delete unused old `MonthlyReport.tsx`
- Keep all existing behavior intact

## No functional changes — pure extraction
The page does exactly the same thing; code just moves to files where it belongs.

## Step 1: Extract shared utilities → `src/lib/report-utils.ts`
Move (delete from page, import instead):
- `formatMonth()`
- `splitInsights()` 
- `parseRecommendations()`
- `getBarColor()`

## Step 2: Create section components in `src/components/report/`
Each is a pure presentational component receiving its data as props.

| File | What it takes from page.tsx |
|---|---|
| `src/components/report/ReportHeader.tsx` | month, entryCount, daysJournaled |
| `src/components/report/BigPicture.tsx` | dominantMood, emoji, summary |
| `src/components/report/EmotionalLandscape.tsx` | moodDistribution[] |
| `src/components/report/PatternRecognition.tsx` | insights[] (already split) |
| `src/components/report/EmotionalRhythm.tsx` | streak, dominantMood, emoji, daysJournaled |
| `src/components/report/MomentWorthNoting.tsx` | summary |
| `src/components/report/ActionableFrameworks.tsx` | recommendations[] (already parsed) |
| `src/components/report/ClosingReflection.tsx` | (static content) |

Also create a barrel `src/components/report/index.ts`.

## Step 3: Extract state screens into `src/components/report/`
- `ReportGenerating.tsx` — spinner state
- `ReportSkeleton.tsx` — loading skeleton (moved from inline JSX)
- `ReportError.tsx` — error state with retry button

## Step 4: Clean up `page.tsx`
Drops from ~634 lines to ~150 lines:
- Remove all extracted utility functions (import from `report-utils`)
- Remove all extracted section component JSX (import from `components/report/`)
- Remove inline skeleton/error/generating JSX (import the wrappers)
- Keep: searchParams reading, hook call, auto-generation effect, PNG export, layout wrapper, save-PNG button

## Step 5: Update test files
- Delete old `MonthlyReport.test.tsx` (tests old component being removed)
- Add `__tests__/lib/report-utils.test.ts` for the extracted utilities

## Step 6: Delete old `src/components/MonthlyReport.tsx`
No longer imported anywhere.

## What stays the same
- `src/hooks/useReport.ts` — untouched
- `src/lib/report-stats.ts` — untouched
- `src/app/api/report/route.ts` — untouched
- `src/lib/ai/report.ts` — untouched
- All existing tests for API routes, hooks, and stats — untouched

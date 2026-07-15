---
phase: 11
phase_slug: dashboard-entry-list-optimistic-updates
date: 2026-07-15
---

# Validation Strategy — Phase 11: Dashboard Entry List + Optimistic Updates

## Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 |
| Config file | vitest.config.ts |
| Quick run command | `npm run test` |
| Full suite command | `npm run test:coverage` |

## Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File |
|--------|----------|-----------|-------------------|------|
| R7 | Entry list displays today's entries | unit | `npm run test -- --testPathPattern entry` | `__tests__/hooks/useTodayEntries.test.ts` |
| R7 | Optimistic create inserts temp entry | unit | `npm run test -- --testPathPattern optimistic` | `__tests__/hooks/useCreateEntry.test.ts` |
| R7 | Optimistic delete removes entry from cache | unit | `npm run test -- --testPathPattern optimistic` | `__tests__/hooks/useDeleteEntry.test.ts` |
| R7 | GET /api/entries accepts day param | unit | `npm run test -- --testPathPattern entries` | `__tests__/api/entries.test.ts` (extend) |
| R7 | relativeTime utility returns correct strings | unit | `npm run test -- --testPathPattern utils` | `__tests__/lib/utils.test.ts` |
| R7 | EntryCard renders emoji, timestamp, preview | unit | `npm run test -- --testPathPattern EntryCard` | `__tests__/components/EntryCard.test.tsx` |
| R7 | EntryList renders list or empty state | unit | `npm run test -- --testPathPattern EntryList` | `__tests__/components/EntryList.test.tsx` |

## Sampling Rate

- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test:coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

## Wave 0 Gaps

- [ ] `__tests__/hooks/useTodayEntries.test.ts` — covers entry fetching hook
- [ ] `__tests__/hooks/useCreateEntry.test.ts` — covers optimistic create
- [ ] `__tests__/hooks/useDeleteEntry.test.ts` — covers optimistic delete
- [ ] `__tests__/lib/utils.test.ts` — covers relativeTime utility
- [ ] `__tests__/components/EntryCard.test.tsx` — covers EntryCard rendering
- [ ] `__tests__/components/EntryList.test.tsx` — covers EntryList rendering + empty state
- [ ] Extend `__tests__/api/entries.test.ts` — add tests for `day` param

## Verification Commands

| Check | Command | When |
|-------|---------|------|
| Type check | `npx tsc --noEmit` | Each task |
| Unit tests | `npm run test` | Each task |
| Build | `npm run build` | Plan 2 Task 3 (final) |
| Lint | `npm run lint` | Plan 2 Task 3 (final) |

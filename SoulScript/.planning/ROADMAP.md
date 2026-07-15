# Roadmap

## Phase 1: Foundation ✅

**Status:** Complete
**Requirements:** R1, R2, R3, R4, R13

- [x] Next.js 16 project setup with TypeScript + Tailwind
- [x] Supabase client setup (server + browser)
- [x] Database schema + RLS policies
- [x] Encryption module (AES-256-GCM)
- [x] Language detection (Burmese/English)
- [x] Design tokens + globals.css
- [x] Proxy (middleware) for auth

## Phase 2: Auth + Dashboard ✅

**Status:** Complete
**Requirements:** R1, R5, R11

- [x] Login page (Google + email)
- [x] Signup page with validation
- [x] Auth callback route
- [x] Dashboard with greeting, textarea, undo toast
- [x] Character counter (4500 warn, 5000 max)
- [x] Rate limiting (10/day)
- [x] Skeleton loading states

## Phase 3: API Routes ✅

**Status:** Complete
**Requirements:** R6, R8, R9, R11

- [x] POST /api/analyze (AI sentiment)
- [x] POST /api/report (monthly report)
- [x] PATCH /api/entries/[id] (mood override)
- [x] DELETE /api/entries/[id] (soft delete)
- [x] GET/PATCH /api/profile
- [x] DELETE /api/account

## Phase 4: Calendar + Report ✅

**Status:** Complete
**Requirements:** R7, R8

- [x] MoodCalendar component with month grid
- [x] Entry overlay with emotion pills
- [x] Mood picker (Edit Mood)
- [x] TanStack Query provider setup
- [x] MonthlyReport component (3 stages)
- [x] Calendar "Reveal" card trigger
- [x] Loading/error/success states
- [x] Staggered Framer Motion animations

## Phase 5: Settings + Polish ✅

**Status:** Complete
**Requirements:** R9, R10

- [x] Settings page (profile, language, delete)
- [x] Language toggle persistence
- [x] Account deletion with confirmation
- [x] 404 page

## Phase 6: Testing ✅

**Status:** Complete
**Requirements:** R12

- [x] Encryption tests (roundtrip, unicode, edge cases)
- [x] Mood themes tests (validation, fallback)
- [x] Language detection tests
- [x] MonthlyReport component tests

---

## Phase 7: Core Gaps — Language, Navigation, Undo

**Goal:** Fix the 4 critical SPEC compliance gaps
**Mode:** mvp
**Requirements:** R4, R5, R7, R9.2

**Success Criteria:**

1. `getSystemPromptLanguage()` function exists and works
2. AI analysis fetches `preferred_language` from user profile
3. Dashboard has a link/icon to navigate to calendar
4. Calendar has a link back to dashboard
5. Undo restores textarea to pre-submission state
6. `npm run build` + `npm run test` pass

**Plans:**

- [ ] 7.1: Implement `getSystemPromptLanguage()` in language.ts + integrate in analyze route
- [ ] 7.2: Add navigation links (dashboard → calendar gear icon, calendar → back button)
- [ ] 7.3: Fix undo to preserve and restore draft text

## Phase 8: Animation & UX Polish

**Goal:** Match SPEC animation and responsive design requirements
**Mode:** mvp
**Requirements:** R7, R8, R13

**Success Criteria:**

1. Submission text fades and floats upward (Framer Motion)
2. Mobile bottom sheet opens for calendar day tap (375px)
3. Calendar overlay morphs from grid cell using `layoutId`
4. Monthly report uses `staggerChildren` instead of fixed delays
5. Calendar empty state has breathing glassmorphism overlay
6. Button hover transitions use cubic-bezier scaling

**Plans:**

- [ ] 8.1: Add submission fade-up animation on dashboard
- [ ] 8.2: Implement mobile bottom sheet for calendar overlay
- [ ] 8.3: Add `layoutId` to calendar grid cells + overlay for morph transition
- [ ] 8.4: Convert report to `staggerChildren` variant pattern
- [ ] 8.5: Add breathing overlay to calendar empty state

## Phase 9: Extended Testing + Cleanup

**Goal:** Complete SPEC §11 test coverage + remove dead code
**Mode:** mvp
**Requirements:** R12

**Success Criteria:**

1. All 5 API route test files created and passing
2. `npm run test` passes with all 22+ tests
3. Unused `ai` package removed from package.json
4. React Query either integrated or removed

**Plans:**

- [ ] 9.1: Create `__tests__/api/analyze.test.ts`
- [ ] 9.2: Create `__tests__/api/report.test.ts`
- [ ] 9.3: Create `__tests__/api/entries.test.ts`
- [ ] 9.4: Create `__tests__/api/profile.test.ts`
- [ ] 9.5: Create `__tests__/api/account.test.ts`
- [ ] 9.6: Remove unused `ai` package, decide on React Query (integrate or remove)

## Phase 10: Calendar Day Entries ✅

**Goal:** Show all journal entries for a day when clicking the calendar emoji
**Mode:** mvp
**Requirements:** R7, R8

**Success Criteria:**

1. Calendar grid shows the latest entry's emoji per day (no change)
2. Clicking a day opens a scrollable list of ALL entries for that day
3. Each entry shows its own emoji, timestamp, content, and emotion pills
4. "Edit Mood" works on each individual entry
5. Empty days still show the dashed border placeholder
6. `npm run build` + `npm run test` pass

**Plans:**

- [x] 10.1: Replace `getEntryForDay()` with `getEntriesForDay()` returning all entries
- [x] 10.2: Update calendar grid to show last entry's emoji per day
- [x] 10.3: Change `selectedEntry` state to `JournalEntry[] | null`
- [x] 10.4: Redesign bottom sheet as scrollable entry list
- [x] 10.5: Add per-entry "Edit Mood" with mood picker
- [x] 10.6: Verify build + tests pass

## Phase 11: Dashboard Entry List + Optimistic Updates

**Goal:** Display today's journal entries below the dashboard textarea with instant optimistic updates via TanStack Query
**Mode:** mvp
**Requirements:** R7
**Plans:** 2 plans

**Success Criteria:**

1. Dashboard shows a scrollable list of today's entries below the textarea
2. Each entry displays emoji, timestamp, content preview, and emotion pills
3. New entries appear instantly after submission (optimistic update)
4. Undo removes the entry from the list immediately
5. Rate limit (10/day) is reflected in the UI
6. TanStack Query is used for all data fetching (replacing raw fetch)
7. `npm run build` + `npm run test` pass

Plans:
**Wave 1**

- [ ] 11-01-PLAN.md — TDD: shared types, utils, TanStack Query hooks, API day param

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 11-02-PLAN.md — EntryCard, EntryList components, dashboard responsive layout + hook integration

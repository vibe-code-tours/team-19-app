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

## Phase 7: TanStack Query Integration
**Status:** Not Started
**Requirements:** (implicit from SPEC §2)

- [ ] Convert dashboard entry fetching to useQuery
- [ ] Convert calendar entry fetching to useQuery
- [ ] Add useMutation for entry submission
- [ ] Optimistic updates for mood override
- [ ] Background refetch for calendar

## Phase 8: Animation Polish
**Status:** Not Started
**Requirements:** (implicit from SPEC §1, §10)

- [ ] Page-level AnimatePresence transitions
- [ ] Calendar month switch animation
- [ ] Mobile bottom sheet for entry overlay
- [ ] Button hover scale transitions

## Phase 9: Extended Testing
**Status:** Not Started
**Requirements:** R12

- [ ] API route integration tests (mock Supabase)
- [ ] Dashboard submit flow test
- [ ] Calendar entry rendering test
- [ ] Settings profile update test
- [ ] Auth redirect logic test

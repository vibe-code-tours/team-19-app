# Phase Plan: Monthly Report UI + Calendar Trigger

## Objective
Complete the Monthly Report feature end-to-end: wire the calendar trigger to the existing API, build the report display component, and set up TanStack Query for data fetching.

## Research Summary
- **API:** `POST /api/report` with `{ month: "YYYY-MM" }` — fully implemented, returns `{ report }` with 3-stage data
- **Calendar:** "Reveal This Month's Journey" card exists but has no click handler (lines 197-209 of MoodCalendar.tsx)
- **TanStack Query:** Installed (`^5.101.2`) but not configured — no QueryClient, no provider, no hooks used
- **Spec:** §9.4 requires 3-stage layout (Big Picture, Pattern Recognition, Actionable Frameworks) with staggered Framer Motion animations

---

## Tasks

### Task 1: Set Up TanStack Query Provider
**Files:** Create `src/components/Providers.tsx`, Modify `src/app/layout.tsx`

- Create `Providers.tsx` — client component wrapping `QueryClientProvider`
- Instantiate `QueryClient` with default options (staleTime: 5min, retry: 1)
- Wrap `{children}` in `<Providers>` in layout.tsx
- Keep existing font metadata and HTML structure intact

**Verification:** Build passes, no hydration errors

---

### Task 2: Build MonthlyReport Component
**Files:** Create `src/components/MonthlyReport.tsx`

Three-stage vertical layout per SPEC §9.4:

1. **The Big Picture** — Full-width glass card with:
   - Dominant mood emoji (large, centered, 56px)
   - Mood name in Playfair Display
   - Count: "This month, you felt [mood] on [X] of [Y] days."
   - Background radial glow matching dominant mood

2. **Pattern Recognition** — Glass card with 2-3 insight blocks:
   - Each insight: left accent border (3px indigo) + quote text
   - Parse `pattern_insights` string (split by sentences or newlines)

3. **Actionable Frameworks** — 2-3 recommendation cards:
   - Each: icon (lucide), title, description
   - Parse `actionable_recommendations` array
   - Map titles to icons (sunrise → Morning Breathing, moon → Digital Detox, pen-line → Gratitude)

**Props:** `{ report: ReportData, entryCount: number, daysInMonth: number }`

**Animation:** Staggered fade-in from bottom using Framer Motion:
```tsx
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
```

**Verification:** Component renders with mock data, animations work

---

### Task 3: Wire Calendar Trigger
**Files:** Modify `src/components/MoodCalendar.tsx`

Changes:
1. Add state: `report`, `reportLoading`, `reportError`
2. Add `handleGenerateReport` function:
   - Call `POST /api/report` with `{ month: "YYYY-MM" }`
   - Handle <10 entries error (show encouraging message)
   - Handle AI error (show retry button)
   - On success, set report state
3. Make "Reveal This Month's Journey" card clickable:
   - `onClick={handleGenerateReport}`
   - Show loading skeleton while generating
   - Show report component when data returns
4. Conditionally render:
   - If `report` exists → show `<MonthlyReport>` below calendar
   - If `reportLoading` → show skeleton
   - If `reportError` → show error card with retry
   - If entries < 10 → show "Keep journaling" message

**Verification:** Click card → loading → report appears (or error message)

---

### Task 4: Add Report Tests
**Files:** Create `__tests__/components/MonthlyReport.test.tsx`

Test cases:
- Renders all 3 sections with valid report data
- Handles empty `actionable_recommendations` gracefully
- Shows correct entry count and days
- Framer Motion animations mount without error

**Verification:** `npm run test` passes

---

### Task 5: Final Verification
- `npm run build` passes
- `npm run lint` passes (0 errors)
- `npm run test` passes
- Manual: calendar → click trigger → report renders

---

## Acceptance Criteria
- [ ] TanStack Query provider configured and wrapping app
- [ ] MonthlyReport component displays all 3 stages (Big Picture, Patterns, Frameworks)
- [ ] Calendar "Reveal" card triggers report generation on click
- [ ] Loading state shows skeleton during generation
- [ ] Error state shows message with retry button
- [ ] <10 entries shows encouraging message
- [ ] Staggered Framer Motion animations on report sections
- [ ] All tests pass
- [ ] Build + lint clean

## Files Changed
| Action | File |
|--------|------|
| Create | `src/components/Providers.tsx` |
| Create | `src/components/MonthlyReport.tsx` |
| Create | `__tests__/components/MonthlyReport.test.tsx` |
| Modify | `src/app/layout.tsx` |
| Modify | `src/components/MoodCalendar.tsx` |

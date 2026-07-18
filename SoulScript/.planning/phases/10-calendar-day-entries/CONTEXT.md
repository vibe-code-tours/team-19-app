# Phase 10 Context

## Scope
Single-file refactor of `MoodCalendar.tsx` to show all entries per day.

## Key Files
- `src/components/MoodCalendar.tsx` — main component (430 lines)
- `src/app/api/entries/route.ts` — API already returns all entries for month

## Dependencies
- Phase 4 (Calendar + Report) — complete
- Phase 8 (Animation & UX Polish) — complete

## Constraints
- Keep existing Framer Motion animations (layoutId, bottom sheet drag)
- Maintain glassmorphism design system
- Mobile-first (375px baseline)
- Max 10 entries per day (rate limit)

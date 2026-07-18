# Phase 11: Dashboard Entry List + Optimistic Updates - Context

**Gathered:** 2026-07-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Display today's journal entries below the dashboard textarea with instant optimistic updates via TanStack Query. On desktop, a side-by-side layout (textarea left, entries right); on mobile, stacked vertically. Each entry is a compact card that expands on click to show full content.

</domain>

<decisions>
## Implementation Decisions

### Entry Card Content
- **D-01:** Compact cards by default showing: emoji, relative timestamp (e.g. "2h ago"), content preview (~100 chars), primary + secondary emotion pills
- **D-02:** Click/tap expands the card like an accordion to reveal full content
- **D-03:** Emotion pills show primary emotion as a colored pill + secondary emotions as smaller pills (matches calendar overlay style from Phase 10)

### Empty State
- **D-04:** When no entries exist today, show an SVG/emoji illustration with text below (e.g., "No entries yet today. Start writing above!")
- **D-05:** Use a simple SVG or emoji-based illustration — no external image assets needed

### Animation & Transitions
- **D-06:** New entries slide up from below with a subtle fade (matches existing fade-up animation on textarea)
- **D-07:** Undo removes entry with fade-out + collapse animation; other entries shift up to fill the gap
- **D-08:** Use Framer Motion `AnimatePresence` + `layout` animations for smooth entry/exit

### Layout & Scroll Behavior
- **D-09:** Desktop (≥768px): side-by-side layout — textarea panel (~40% width) on left, entry list panel (~60% width) on right
- **D-10:** Mobile (<768px): stacked vertically — textarea on top, entry list below
- **D-11:** Entry list scrolls independently on desktop (textarea stays fixed); on mobile, page scrolls naturally
- **D-12:** Breakpoint at 768px (standard tablet breakpoint)

### TanStack Query Integration
- **D-13:** Use `useTodayEntries()` hook for fetching today's entries with query key `['entries', 'today']`
- **D-14:** Use `useCreateEntry()` mutation with optimistic update — insert temporary entry immediately, replace on server response
- **D-15:** Query staleTime of 30 seconds for today's entries
- **D-16:** Invalidate `['entries', 'today']` after undo/delete to refresh from server

### Claude's Discretion
- Exact content preview length (100 chars suggested, adjust for card proportions)
- Entry card glassmorphism styling (follow existing `.glass` utility pattern)
- Relative timestamp implementation (use `date-fns` formatDistanceToNow or simple custom function)
- Accordion expand/collapse animation timing

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Dashboard & Entry Components
- `src/app/page.tsx` — Current dashboard implementation (343 lines, self-contained client component)
- `src/components/MoodCalendar.tsx` — Calendar component with JournalEntry type definition (lines 8-16) and entry display patterns

### API Routes
- `src/app/api/entries/route.ts` — GET entries (currently accepts `month` param, needs `day` param extension)
- `src/app/api/analyze/route.ts` — POST create entry + AI analysis (used for optimistic update)
- `src/app/api/entries/[id]/route.ts` — PATCH/DELETE individual entries (used for undo)

### TanStack Query Setup
- `src/components/Providers.tsx` — QueryClient provider (5min staleTime, 1 retry)
- `src/app/layout.tsx` — Root layout mounting Providers

### Types & Utilities
- `src/lib/mood-themes.ts` — MOOD_THEMES gradient mappings, MOOD_EMOJIS
- `src/lib/ai/types.ts` — AnalysisResult interface
- `src/lib/encryption.ts` — AES-256-GCM encrypt/decrypt

### Styling
- `src/app/globals.css` — Glassmorphism utilities (.glass, .glass-strong, .mood-glow), dark theme

No external specs — requirements fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **JournalEntry interface** (MoodCalendar.tsx:8-16): `id, content, primary_emotion, emoji, secondary_emotions[], bg_glow_gradient, created_at` — needs to be extracted to shared type
- **Glassmorphism utilities** (.glass, .glass-strong): reusable card styling for entry cards
- **Framer Motion**: already installed and used for animations throughout the app
- **Supabase client** (`src/lib/supabase/client.ts`): browser client for auth/session

### Established Patterns
- **Data fetching**: Currently raw `fetch` + `useState` + `useEffect` — this phase introduces TanStack Query as the new pattern
- **Optimistic updates**: No existing pattern — this phase establishes it
- **API response shape**: `{ entries: JournalEntry[] }` from GET /api/entries
- **Entry creation**: POST /api/analyze returns `{ entry: JournalEntry }`

### Integration Points
- **Dashboard page** (`src/app/page.tsx`): Main integration point — add entry list below textarea
- **Providers** (`src/components/Providers.tsx`): QueryClient already configured, no changes needed
- **GET /api/entries**: Needs `day` query param extension for single-day filtering

</code_context>

<specifics>
## Specific Ideas

- The user explicitly wants side-by-side on desktop, stacked on mobile — this is a layout change from the current single-column design
- Accordion expand on click — not a separate detail view, inline expansion
- Compact cards should feel like the calendar overlay entry cards but smaller
- Undo should feel seamless — entry disappears smoothly without jarring layout shift

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-Dashboard Entry List + Optimistic Updates*
*Context gathered: 2026-07-15*

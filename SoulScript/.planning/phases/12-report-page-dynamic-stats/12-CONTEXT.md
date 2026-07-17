# Phase 12: Report Page Dynamic Stats - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace all hardcoded stats on the report page (`src/app/report/page.tsx`) with real data calculated from the database. The current page has static mock data for entry counts, mood percentages, insights, recommendations, and emotional rhythm patterns. This phase makes the report dynamic by fetching real journal entry data and displaying actual AI-generated insights.

</domain>

<decisions>
## Implementation Decisions

### API Design
- **D-01:** Create a new `GET /api/report?month=YYYY-MM` endpoint — separate from the existing `POST /api/report` which generates AI reports
- **D-02:** Response shape is nested: `{ stats: { entryCount, daysJournaled, moodDistribution, streak }, report: { summary, dominantMood, insights, recommendations } }`
- **D-03:** No caching — recalculate aggregated stats from DB on each request for simplicity and data freshness

### Word Count Storage
- **D-04:** Skip word count entirely — no DB migration needed, no word count displayed in the report

### Empty State Handling
- **D-05:** When <10 entries exist in a month, show partial stats (entry count, mood distribution, days journaled) but hide AI-generated sections
- **D-06:** AI-generated sections (Pattern Recognition, Actionable Frameworks, Emotional Rhythm) are hidden entirely when <10 entries — no placeholders or lock icons

### Claude's Discretion
- Exact styling of stat cards (follow existing glassmorphism patterns from `src/app/globals.css`)
- Streak calculation logic (consecutive days with entries)
- Month-over-month comparison implementation (if data available for previous month)
- Loading and error states for the GET /api/report request
- Whether to use TanStack Query or raw fetch for the report data

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API Routes
- `src/app/api/report/route.ts` — Existing POST endpoint that generates AI reports (92 lines). New GET endpoint should be added here or in a separate file.
- `src/app/api/entries/route.ts` — GET entries endpoint (accepts `month` param). Useful reference for query patterns.

### Report Components
- `src/app/report/page.tsx` — Current report page with all hardcoded data (270 lines). Primary file to refactor.
- `src/components/MonthlyReport.tsx` — Reusable report component with 3-stage layout (193 lines). Receives `report`, `entryCount`, `daysInMonth` as props.

### AI Integration
- `src/lib/ai/report.ts` — `callAIForReport()` function that generates AI report from entries (42 lines)
- `src/lib/ai/types.ts` — `ReportResult` interface: `{ summary_overview, dominant_mood, pattern_insights, actionable_recommendations }`

### Database Schema
- `supabase/migrations/001_initial_schema.sql` — Schema for `journal_entries` (content, primary_emotion, emoji, secondary_emotions, created_at) and `monthly_reports` (summary_overview, dominant_mood, pattern_insights, actionable_recommendations)

### Types & Utilities
- `src/lib/types.ts` — `JournalEntry` interface: `{ id, content, primary_emotion, emoji, secondary_emotions[], bg_glow_gradient, created_at }`
- `src/lib/mood-themes.ts` — `MOOD_EMOJIS` mapping and mood-related constants

### Styling
- `src/app/globals.css` — Glassmorphism utilities (`.glass`, `.glass-strong`), dark theme, mood glow gradients

### Design Reference
- `.planning/monthly-report-redesign.md` — Redesign spec with mood distribution chart, month comparison, journaling stats (completed phases 1-4)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **MonthlyReport component** (`src/components/MonthlyReport.tsx`): Already receives `report`, `entryCount`, `daysInMonth` — can be extended with new props for mood distribution, streak, etc.
- **MOOD_EMOJIS** (`src/components/MonthlyReport.tsx:23-34`): Emotion-to-emoji mapping, reusable for mood distribution display
- **MOOD_OPTIONS** (`src/components/MoodCalendar.tsx:32-43`): Full list of moods with emojis, can be used for mood distribution calculation
- **Glassmorphism utilities** (`.glass`, `.glass-strong`): Reusable card styling for stat cards

### Established Patterns
- **API response shape**: `{ data: T }` or `{ error: string }` pattern used across all API routes
- **Supabase queries**: Server-side via `src/lib/supabase/server.ts`, client-side via `src/lib/supabase/client.ts`
- **TanStack Query**: Used in dashboard (Phase 11) for data fetching with `useQuery`/`useMutation`

### Integration Points
- **Report page** (`src/app/report/page.tsx`): Main integration point — replace hardcoded data with fetched data
- **GET /api/report**: New endpoint to create — should follow existing route handler patterns
- **MonthlyReport component**: May need additional props for mood distribution, streak, etc.

</code_context>

<specifics>
## Specific Ideas

- The report page currently has a beautiful UI layout — preserve the glassmorphism design while making data dynamic
- Mood distribution should show as horizontal bar chart with percentages (per redesign spec)
- "Emotional Rhythm" section (day-of-week patterns) requires analyzing entry timestamps — this is complex and may need AI or statistical analysis
- "Moment Worth Noting" section needs to identify the entry with highest emotional clarity — unclear how to define "clarity" without AI analysis

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-Report Page Dynamic Stats*
*Context gathered: 2026-07-17*

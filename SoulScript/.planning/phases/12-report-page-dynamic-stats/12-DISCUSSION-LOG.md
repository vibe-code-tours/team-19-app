# Phase 12: Report Page Dynamic Stats - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-17
**Phase:** 12-report-page-dynamic-stats
**Areas discussed:** API Design, Word Count Storage, Empty State Handling

---

## API Design

### How should the report data be fetched?

| Option | Description | Selected |
|--------|-------------|----------|
| New GET endpoint | Create GET /api/report?month=YYYY-MM that returns aggregated stats + AI report data. Clean separation: POST generates, GET fetches. | ✓ |
| Extend POST response | Add a new field to POST /api/report response that includes aggregated stats alongside the AI report. | |
| Split stats and AI endpoints | Two endpoints: GET /api/report/stats for raw DB stats, GET /api/report/ai for AI insights. Most flexible but more endpoints. | |

**User's choice:** New GET endpoint
**Notes:** Clean separation of concerns — POST generates, GET fetches.

### What shape should the GET /api/report response have?

| Option | Description | Selected |
|--------|-------------|----------|
| Nested stats + report | `{ stats: { entryCount, wordCount, daysJournaled, moodDistribution, streak }, report: { summary, dominantMood, insights, recommendations } }` | ✓ |
| Flat structure | All fields at top level: `{ entryCount, wordCount, moodDistribution, dominantMood, insights, recommendations, ... }` | |

**User's choice:** Nested stats + report
**Notes:** Clear separation between raw stats and AI-generated insights.

### Should aggregated stats be cached?

| Option | Description | Selected |
|--------|-------------|----------|
| No caching | Always recalculate from DB on each request. Simple, always fresh, but more DB reads. | ✓ |
| Cache in monthly_reports | Store stats in the monthly_reports table alongside AI data. Update when new entries are added. | |
| Client-side caching only | Use TanStack Query staleTime (e.g., 5 minutes) on the client. Reduces API calls but stale data possible. | |

**User's choice:** No caching
**Notes:** Simplicity and data freshness over performance.

---

## Word Count Storage

### How should word count be handled?

| Option | Description | Selected |
|--------|-------------|----------|
| Store in DB | Add word_count column to journal_entries (requires SQL migration). Calculate once on entry creation. | |
| Calculate on read | Decrypt content and count words each time report is requested. No migration needed, but slower. | |
| Skip word count | Don't show word count at all. Simplifies the implementation. | ✓ |

**User's choice:** Skip word count
**Notes:** No DB migration needed, simpler implementation.

---

## Empty State Handling

### What should happen with <10 entries?

| Option | Description | Selected |
|--------|-------------|----------|
| Partial stats | Show whatever stats are available (entry count, mood distribution) even with <10 entries. Hide AI-generated sections. | ✓ |
| Progress indicator | Show a 'Not enough data' message with a progress indicator (e.g., '7 more entries to unlock'). | |
| Hide until ready | Hide the report page entirely until 10+ entries exist. Redirect to calendar or show a placeholder. | |

**User's choice:** Partial stats
**Notes:** Users can see their progress even before reaching the 10-entry threshold.

### How should AI sections appear with <10 entries?

| Option | Description | Selected |
|--------|-------------|----------|
| Hide AI sections | Show basic stats but hide Pattern Recognition, Actionable Frameworks, and Emotional Rhythm sections entirely. | ✓ |
| Placeholder text | Show placeholder text like 'Generate 3 more entries to unlock AI insights' in the AI sections. | |
| Locked sections | Show the sections with a lock icon and 'Unlock with more entries' CTA. | |

**User's choice:** Hide AI sections
**Notes:** Clean UX — no clutter from empty AI sections.

---

## Claude's Discretion

- Exact styling of stat cards (follow existing glassmorphism patterns)
- Streak calculation logic (consecutive days with entries)
- Month-over-month comparison implementation
- Loading and error states for the GET /api/report request
- Whether to use TanStack Query or raw fetch for the report data

## Deferred Ideas

None — discussion stayed within phase scope.

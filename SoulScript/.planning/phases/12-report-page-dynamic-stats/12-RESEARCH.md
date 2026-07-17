# Phase 12: Report Page Dynamic Stats - Research

**Researched:** 2026-07-17
**Domain:** Data aggregation, API design, TanStack Query data fetching, dynamic report rendering
**Confidence:** HIGH

## Summary

Phase 12 replaces all hardcoded mock data on `src/app/report/page.tsx` with real data from the database. The report page currently has 270 lines of static UI with hardcoded emotion percentages, pattern insights, emotional rhythm data, and a "moment worth noting" quote. This phase creates a new `GET /api/report?month=YYYY-MM` endpoint that returns aggregated stats (entry count, mood distribution, streak) and the AI-generated report from the `monthly_reports` table, then wires the report page to fetch and display this data.

The key technical challenges are: (1) computing mood distribution from raw `journal_entries` rows grouped by `primary_emotion`, (2) calculating streak as the longest consecutive run of days with at least one entry, (3) determining the "moment worth noting" entry (highest emotional clarity), and (4) handling the empty state when fewer than 10 entries exist for the month. No new npm packages are required -- the project already has `@tanstack/react-query`, `supabase-js`, `framer-motion`, and `lucide-react`.

**Primary recommendation:** Create a `GET /api/report` route handler in the same file as the existing POST handler, use `select` with `{ count: 'exact' }` and client-side grouping for mood distribution (Supabase JS does not support GROUP BY natively), compute streak in application code, and create a `useReport` hook following the existing `useTodayEntries` pattern.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Create a new `GET /api/report?month=YYYY-MM` endpoint -- separate from the existing `POST /api/report`
- **D-02:** Response shape is nested: `{ stats: { entryCount, daysJournaled, moodDistribution, streak }, report: { summary, dominantMood, insights, recommendations } }`
- **D-03:** No caching -- recalculate aggregated stats from DB on each request
- **D-04:** Skip word count entirely -- no DB migration needed, no word count displayed
- **D-05:** When <10 entries exist in a month, show partial stats (entry count, mood distribution, days journaled) but hide AI-generated sections
- **D-06:** AI-generated sections (Pattern Recognition, Actionable Frameworks, Emotional Rhythm) are hidden entirely when <10 entries -- no placeholders or lock icons

### Claude's Discretion
- Exact styling of stat cards (follow existing glassmorphism patterns from `src/app/globals.css`)
- Streak calculation logic (consecutive days with entries)
- Month-over-month comparison implementation (if data available for previous month)
- Loading and error states for the GET /api/report request
- Whether to use TanStack Query or raw fetch for the report data

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R7 | Mood Calendar -- Month grid with emoji circles, mood picker, month navigation | Phase 12 builds on calendar data: GET /api/report fetches same `journal_entries` table filtered by month, reuses Supabase query pattern from `src/app/api/entries/route.ts` |
| R8 | Monthly Report -- Trigger, min 10 entries, 3-stage layout, staggered animations, POST /api/report, upserts | Phase 12 creates GET /api/report to fetch existing report data, replaces hardcoded UI with dynamic data, preserves 3-stage layout and animations |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Fetching aggregated report data | API / Backend | -- | GET /api/report computes stats server-side from DB |
| Mood distribution calculation | API / Backend | -- | Server-side query + client-side grouping (no RPC needed) |
| Streak calculation | API / Backend | -- | Consecutive day analysis requires date math, belongs on server |
| "Moment Worth Noting" selection | API / Backend | -- | Server picks entry with highest clarity score from decrypted entries |
| Report page rendering | Browser / Client | -- | Client component fetches data and renders with Framer Motion |
| Loading/error state UX | Browser / Client | -- | Client handles loading spinner, error display, empty state |
| Data fetching orchestration | Browser / Client | -- | TanStack Query hook manages cache, refetch, optimistic updates |

## Standard Stack

### Core (no new packages needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | 5.101.2 | Data fetching hook for report endpoint | Already installed, project convention for data fetching |
| supabase-js | 2.110.1 | Server-side DB queries for aggregated stats | Already installed, project convention |
| framer-motion | 12.42.2 | Staggered animations on report sections | Already installed, existing animation pattern |
| lucide-react | 1.24.0 | Icons (Sparkles, Shield, TrendingUp, Brain, Heart) | Already installed, existing icon set |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/ssr | 0.12.0 | Server-side Supabase client with cookie auth | GET /api/report handler, same as all API routes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side mood grouping | PostgreSQL RPC function | RPC would be slightly faster but adds migration complexity; client-side grouping on ~31 rows/month is trivial |
| TanStack Query hook | Raw fetch + useState | Query hook gives automatic caching, loading states, error handling for free; existing project pattern |

## Package Legitimacy Audit

No new packages are being installed in this phase. All dependencies are already present in `package.json`.

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    api/
      report/
        route.ts        # ADD GET handler to existing file (currently only has POST)
    report/
      page.tsx          # REFACTOR: replace hardcoded data with fetched data
  hooks/
    useReport.ts        # NEW: TanStack Query hook for GET /api/report
```

### Pattern 1: GET handler alongside POST in same route file
**What:** Next.js App Router allows multiple exported HTTP method handlers in a single `route.ts` file.
**When to use:** When the same resource has multiple HTTP methods (e.g., POST to generate, GET to fetch).
**Example:**
```typescript
// Source: src/app/api/report/route.ts (existing POST)
// ADD this export to the same file:

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Invalid month format. Use YYYY-MM" },
        { status: 400 }
      );
    }

    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1).toISOString();
    const endDate = new Date(year, monthNum, 1).toISOString();

    // Fetch entries for mood distribution + stats
    const { data: entries, error } = await supabase
      .from("journal_entries")
      .select("primary_emotion, emoji, created_at")
      .eq("user_id", user.id)
      .gte("created_at", startDate)
      .lt("created_at", endDate)
      .is("deleted_at", null);

    if (error) throw error;

    // Fetch existing AI report (may be null if <10 entries)
    const { data: report } = await supabase
      .from("monthly_reports")
      .select("summary_overview, dominant_mood, pattern_insights, actionable_recommendations")
      .eq("user_id", user.id)
      .eq("month_year", month)
      .single();

    // Compute aggregated stats
    const moodDistribution = computeMoodDistribution(entries || []);
    const daysJournaled = computeDaysJournaled(entries || []);
    const streak = computeStreak(entries || []);

    return NextResponse.json({
      stats: {
        entryCount: entries?.length || 0,
        daysJournaled,
        moodDistribution,
        streak,
      },
      report: report ? {
        summary: report.summary_overview,
        dominantMood: report.dominant_mood,
        insights: report.pattern_insights,
        recommendations: report.actionable_recommendations,
      } : null,
    });
  } catch (error) {
    console.error("Report fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}
```

### Pattern 2: Client-side mood distribution computation
**What:** Since Supabase JS does not support GROUP BY, fetch the `primary_emotion` column for all entries in the month and group in application code.
**When to use:** When the dataset is small (max ~310 entries/month at 10/day limit) and server-side aggregation adds complexity.
**Example:**
```typescript
// Source: Implemented for this phase

interface MoodDistributionItem {
  emotion: string;
  emoji: string;
  count: number;
  percentage: number;
}

function computeMoodDistribution(
  entries: { primary_emotion: string; emoji: string }[]
): MoodDistributionItem[] {
  const total = entries.length;
  if (total === 0) return [];

  const counts: Record<string, { count: number; emoji: string }> = {};
  for (const entry of entries) {
    const key = entry.primary_emotion;
    if (!counts[key]) {
      counts[key] = { count: 0, emoji: entry.emoji };
    }
    counts[key].count++;
  }

  return Object.entries(counts)
    .map(([emotion, { count, emoji }]) => ({
      emotion,
      emoji,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}
```

### Pattern 3: Streak calculation (consecutive days)
**What:** Find the longest run of consecutive calendar days that have at least one journal entry.
**When to use:** When displaying "best streak" or "current streak" in journaling stats.
**Example:**
```typescript
// Source: Implemented for this phase

interface StreakResult {
  current: number;   // consecutive days ending today (or yesterday)
  best: number;       // longest run in the month
}

function computeStreak(
  entries: { created_at: string }[]
): StreakResult {
  if (entries.length === 0) return { current: 0, best: 0 };

  // Extract unique day strings (YYYY-MM-DD)
  const days = new Set(
    entries.map((e) => new Date(e.created_at).toISOString().slice(0, 10))
  );
  const sortedDays = Array.from(days).sort();

  // Find best streak
  let best = 1;
  let current = 1;
  let bestRun = 1;
  let currentRun = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentRun++;
    } else {
      currentRun = 1;
    }
    if (currentRun > bestRun) bestRun = currentRun;
  }

  // Current streak: count backwards from today
  const today = new Date().toISOString().slice(0, 10);
  let currentStreak = 0;
  let checkDate = new Date(today);

  // If today has no entry, start from yesterday
  if (!days.has(today)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (days.has(checkDate.toISOString().slice(0, 10))) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return { current: currentStreak, best: bestRun };
}
```

### Pattern 4: TanStack Query hook for report data
**What:** Custom hook wrapping `useQuery` for the GET /api/report endpoint, following the existing `useTodayEntries` pattern.
**When to use:** When a page needs to fetch and cache data from an API endpoint.
**Example:**
```typescript
// Source: Following pattern from src/hooks/useTodayEntries.ts

"use client";

import { useQuery } from "@tanstack/react-query";

interface ReportStats {
  entryCount: number;
  daysJournaled: number;
  moodDistribution: { emotion: string; emoji: string; count: number; percentage: number }[];
  streak: { current: number; best: number };
}

interface ReportData {
  summary: string;
  dominantMood: string;
  insights: string;
  recommendations: string[];
}

interface ReportResponse {
  stats: ReportStats;
  report: ReportData | null;
}

export function useReport(month: string) {
  return useQuery<ReportResponse>({
    queryKey: ["report", month],
    queryFn: async () => {
      const res = await fetch(`/api/report?month=${encodeURIComponent(month)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch report");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes, matching project convention
    enabled: !!month && /^\d{4}-\d{2}$/.test(month),
  });
}
```

### Anti-Patterns to Avoid
- **Hardcoding mood percentages in the component:** The current page has `pct: 45` for Joy, etc. These must be replaced with computed values from the API response.
- **Showing AI sections when <10 entries:** D-05 and D-06 explicitly require hiding Pattern Recognition, Actionable Frameworks, and Emotional Rhythm when there are fewer than 10 entries. Do not show placeholder cards or lock icons.
- **Decrypting entries client-side:** All decryption happens server-side in the API handler. The client never sees encrypted content.
- **Trusting client-sent user IDs:** The userId is extracted from the Supabase session server-side, never from the request body. [VERIFIED: existing pattern in src/app/api/report/route.ts]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Loading/error states | Manual boolean flags + conditional rendering | TanStack Query `isLoading`, `error`, `isError` | Handles race conditions, retries, cache |
| Month date range calculation | Custom date library | Native `new Date(year, month-1, 1)` + `new Date(year, month, 1)` | Already used in existing API routes |
| Auth session extraction | Custom JWT parsing | `supabase.auth.getUser()` | RLS-compatible, handles cookie refresh |
| Mood emoji lookup | Hardcoded emoji in component | `MOOD_EMOJIS` from `src/lib/mood-themes.ts` | Single source of truth, already exists |

## Common Pitfalls

### Pitfall 1: Supabase JS does not support GROUP BY
**What goes wrong:** Attempting `.select('primary_emotion').group('primary_emotion')` throws an error because the Supabase JS client does not expose PostgreSQL GROUP BY.
**Why it happens:** Developers familiar with raw SQL expect the JS client to mirror all SQL features.
**How to avoid:** Fetch the `primary_emotion` column for all entries in the month, then group and count in application code. With max ~310 entries/month (10/day limit), this is trivially fast.
**Warning signs:** TypeScript error on `.group()` method; runtime error from PostgREST.

### Pitfall 2: Streak calculation timezone issues
**What goes wrong:** Streak shows wrong count because `new Date()` creates a UTC timestamp that differs from the user's local day boundary.
**Why it happens:** JavaScript `Date` methods like `getDate()` use local timezone, but `toISOString()` returns UTC.
**How to avoid:** Use `toISOString().slice(0, 10)` consistently for day-key extraction, and compute "today" using the same UTC slicing. The existing `useTodayEntries` hook demonstrates this pattern correctly.
**Warning signs:** Streak off by one day; streak resets at midnight UTC instead of local midnight.

### Pitfall 3: Missing `deleted_at` filter
**What goes wrong:** Soft-deleted entries appear in mood distribution and streak calculations.
**Why it happens:** Forgetting `.is("deleted_at", null)` in the query.
**How to avoid:** Always include `.is("deleted_at", null)` in queries against `journal_entries`. This is already done in every existing query in the codebase.
**Warning signs:** Entry count higher than expected; mood distribution includes deleted entries.

### Pitfall 4: Report page currently imports from wrong path
**What goes wrong:** The current `src/app/report/page.tsx` is a standalone 270-line file that does not use the `MonthlyReport` component at all -- it has all its own hardcoded sections.
**Why it happens:** The report page was created as a standalone redesign and never integrated with the existing `MonthlyReport` component.
**How to avoid:** Decide whether to (a) refactor the report page to use `MonthlyReport` component, or (b) keep the standalone page and just replace hardcoded data with dynamic data. Option (b) is safer and preserves the current UI design.
**Warning signs:** Duplicate section rendering; inconsistent styling between calendar report and standalone report.

### Pitfall 5: "Moment Worth Noting" clarity definition
**What goes wrong:** The "moment worth noting" section needs to identify the entry with "highest emotional clarity" -- but this is not defined anywhere in the database schema.
**Why it happens:** The original mock data had a hardcoded quote. Making it dynamic requires a definition.
**How to avoid:** Use the AI report's `summary_overview` text as the "moment worth noting" content. This is the AI's synthesis of the user's journal entries for the month, which naturally captures the most meaningful moment. This avoids needing to decrypt individual entries or define a clarity heuristic.
**Warning signs:** Ambiguous selection; always showing the same entry.

## Code Examples

### GET /api/report complete handler
```typescript
// Source: New code for Phase 12 -- to be added to src/app/api/report/route.ts

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Invalid month format. Use YYYY-MM" },
        { status: 400 }
      );
    }

    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1).toISOString();
    const endDate = new Date(year, monthNum, 1).toISOString();

    // 1. Fetch entries for aggregated stats (no content -- no need to decrypt)
    const { data: entries, error } = await supabase
      .from("journal_entries")
      .select("primary_emotion, emoji, created_at, secondary_emotions")
      .eq("user_id", user.id)
      .gte("created_at", startDate)
      .lt("created_at", endDate)
      .is("deleted_at", null);

    if (error) throw error;

    // 2. Fetch existing AI report (may be null if <10 entries generated)
    const { data: report } = await supabase
      .from("monthly_reports")
      .select("summary_overview, dominant_mood, pattern_insights, actionable_recommendations")
      .eq("user_id", user.id)
      .eq("month_year", month)
      .single();

    // 3. Compute stats in application code
    const entryList = entries || [];
    const moodDistribution = computeMoodDistribution(entryList);
    const daysJournaled = computeDaysJournaled(entryList);
    const streak = computeStreak(entryList);

    return NextResponse.json({
      stats: {
        entryCount: entryList.length,
        daysJournaled,
        moodDistribution,
        streak,
      },
      report: report ? {
        summary: report.summary_overview,
        dominantMood: report.dominant_mood,
        insights: report.pattern_insights,
        recommendations: report.actionable_recommendations,
      } : null,
    });
  } catch (error) {
    console.error("Report fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}
```

### Report page data fetching integration
```typescript
// Source: Pattern for src/app/report/page.tsx refactoring

"use client";

import { useSearchParams } from "next/navigation";
import { useReport } from "@/hooks/useReport";
import { format } from "date-fns"; // or manual YYYY-MM formatting

export default function ReportPage() {
  const searchParams = useSearchParams();
  const month = searchParams.get("month") || format(new Date(), "yyyy-MM");
  const { data, isLoading, error } = useReport(month);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  if (!data) {
    return null;
  }

  const { stats, report } = data;
  const hasEnoughEntries = stats.entryCount >= 10;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ... existing layout ... */}
      <ReportHeader stats={stats} month={month} />
      <MoodDistribution distribution={stats.moodDistribution} />
      {hasEnoughEntries && report && (
        <>
          <PatternRecognition insights={report.insights} />
          <EmotionalRhythm entries={entries} />
          <ActionableFrameworks recommendations={report.recommendations} />
        </>
      )}
      {/* ... existing actions ... */}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded mock data in report page | Dynamic data from GET /api/report | Phase 12 | Report shows real user data |
| MonthlyReport component unused by report page | Standalone report page with dynamic data | Phase 12 | Preserves current UI, replaces data source |
| No GET /api/report endpoint | GET /api/report returns stats + report | Phase 12 | Client can fetch report data on demand |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `monthly_reports` table already has data for months where POST /api/report was called with >=10 entries | Standard Stack | Report sections would show null even with >=10 entries; low risk since POST creates reports |
| A2 | Using `report.summary_overview` as the "moment worth noting" content is sufficient -- the AI summary naturally captures the most meaningful insight from the month | Common Pitfalls | The highlighted moment might not feel personal enough; low risk, can adjust to show dominant mood quote instead |
| A3 | No DB migration is needed since all data is already in `journal_entries` and `monthly_reports` tables | Architecture Patterns | If the response shape requires new columns, a migration would be needed; D-04 confirms skip word count |

## Open Questions (RESOLVED)

1. **Should the report page use `useSearchParams` to get the current month, or default to the current month?** (RESOLVED)
   - What we know: The calendar page lets users navigate months. The report should show the same month.
   - What's unclear: How the report page receives the month parameter (URL param vs. default to current month).
   - **Resolution:** Default to current month from `new Date().toISOString().slice(0, 7)`, but accept `?month=YYYY-MM` URL param via `useSearchParams()` for future calendar-to-report navigation. Implemented in Plan 02 Task 2.

2. **Should the "Emotional Rhythm" section (day-of-week patterns) use AI or statistical analysis?** (RESOLVED)
   - What we know: The current hardcoded data shows "Monday: Productive & Focused", "Wednesday: Reflective & Calm", etc.
   - What's unclear: Whether to compute day-of-week mood patterns from raw entries, or rely on the AI-generated `pattern_insights` text.
   - **Resolution:** Derive day-of-week patterns from entries by grouping by day of week and finding the dominant emotion per day. This is a simple statistical approach using the entries already fetched for mood distribution -- no additional DB queries needed. Implemented in Plan 02 Task 2.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Dev/build | Yes | -- | -- |
| npm | Package manager | Yes | -- | -- |
| Supabase project | DB queries | Assumed | -- | -- |

**Missing dependencies with no fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 |
| Config file | vitest.config.ts (inferred from package.json scripts) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R7 | Mood Calendar fetches entries by month | unit | `npm run test -- __tests__/api/entries.test.ts` | Yes |
| R8 | Report page fetches dynamic stats via GET /api/report | unit | `npm run test -- __tests__/api/report.test.ts` | Yes (POST only) |
| R8 | Mood distribution computed correctly | unit | `npm run test -- __tests__/lib/report-stats.test.ts` | No -- Wave 0 gap |
| R8 | Streak calculation correct | unit | `npm run test -- __tests__/lib/report-stats.test.ts` | No -- Wave 0 gap |
| R8 | useReport hook calls correct endpoint | unit | `npm run test -- __tests__/hooks/useReport.test.ts` | No -- Wave 0 gap |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test:coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `__tests__/lib/report-stats.test.ts` -- covers `computeMoodDistribution`, `computeStreak`, `computeDaysJournaled`
- [ ] `__tests__/hooks/useReport.test.ts` -- covers `useReport` hook
- [ ] Update `__tests__/api/report.test.ts` -- add GET handler tests alongside existing POST tests

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `supabase.auth.getUser()` in GET handler -- same as all API routes |
| V4 Access Control | yes | RLS policies on `journal_entries` and `monthly_reports` tables; userId from session |
| V5 Input Validation | yes | Month format validation with regex `/^\d{4}-\d{2}$/` |
| V6 Cryptography | no | No new encryption; entries queried without content field for stats |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized data access | Information Disclosure | RLS policies + server-side userId extraction from session |
| Month parameter injection | Tampering | Regex validation of month format before DB query |
| Excessive data disclosure | Information Disclosure | Select only needed columns (`primary_emotion, emoji, created_at, secondary_emotions`), never `content` |

## Sources

### Primary (HIGH confidence)
- Context7 `/supabase/supabase-js` -- Supabase JS client query patterns, RPC method, select with count
- Context7 `/tanstack/query` -- useQuery, queryOptions, custom hook patterns
- Existing codebase: `src/app/api/report/route.ts` -- POST handler pattern, auth extraction, Supabase query pattern
- Existing codebase: `src/app/api/entries/route.ts` -- GET handler pattern, month param parsing, date range filtering
- Existing codebase: `src/hooks/useTodayEntries.ts` -- TanStack Query hook pattern

### Secondary (MEDIUM confidence)
- [CITED: Supabase docs] -- Supabase JS does not support GROUP BY natively; client-side grouping recommended for small datasets
- [CITED: TanStack Query docs] -- useQuery v5 requires explicit queryKey, supports staleTime, enabled options

### Tertiary (LOW confidence)
- [RESOLVED] -- The "moment worth noting" content uses `report.summary_overview` from the AI report. No entry-level decryption or clarity heuristic needed.
- [RESOLVED] -- The Emotional Rhythm section is derived from day-of-week grouping of entries, a simple statistical approach using already-fetched data.

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH -- all packages already installed, versions verified
- Architecture: HIGH -- follows existing API route and hook patterns exactly
- Pitfalls: HIGH -- documented from codebase analysis and Supabase JS limitations

**Research date:** 2026-07-17
**Valid until:** 2026-08-17 (30 days -- stable stack, no fast-moving dependencies)

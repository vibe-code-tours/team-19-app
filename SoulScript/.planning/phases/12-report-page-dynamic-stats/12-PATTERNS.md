# Phase 12: Report Page Dynamic Stats - Pattern Map

**Mapped:** 2026-07-17
**Files analyzed:** 7
**Analogs found:** 7 / 7

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/api/report/route.ts` | controller | request-response | `src/app/api/entries/route.ts` | exact |
| `src/lib/report-stats.ts` | utility | transform | `src/lib/mood-themes.ts` | role-match |
| `src/hooks/useReport.ts` | hook | request-response | `src/hooks/useTodayEntries.ts` | exact |
| `src/app/report/page.tsx` | component | request-response | `src/app/report/page.tsx` (self) | exact |
| `__tests__/lib/report-stats.test.ts` | test | transform | `__tests__/lib/mood-themes.test.ts` | role-match |
| `__tests__/hooks/useReport.test.tsx` | test | request-response | `__tests__/hooks/useTodayEntries.test.tsx` | exact |
| `__tests__/api/report.test.ts` | test | request-response | `__tests__/api/report.test.ts` (self) | exact |

## Pattern Assignments

### `src/app/api/report/route.ts` (controller, request-response) -- MODIFY

**Analog:** `src/app/api/entries/route.ts` (GET handler, lines 1-70)

**Imports pattern** (lines 1-4 of entries route):
```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { decrypt } from "@/lib/encryption";
```

**Auth pattern** (entries route lines 7-12, identical to existing POST in report route):
```typescript
const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Month param parsing** (entries route lines 16-37 -- reuse this exact pattern for GET /api/report):
```typescript
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
```

**Supabase query pattern** (entries route lines 40-52 -- for GET /api/report, select only stats columns, no content):
```typescript
const { data: entries, error } = await supabase
  .from("journal_entries")
  .select("primary_emotion, emoji, created_at, secondary_emotions")
  .eq("user_id", user.id)
  .gte("created_at", startDate)
  .lt("created_at", endDate)
  .is("deleted_at", null);

if (error) throw error;
```

**Error handling pattern** (entries route lines 63-68, identical in all API routes):
```typescript
} catch (error) {
  console.error("Entries fetch error:", error);
  return NextResponse.json(
    { error: "Failed to fetch entries" },
    { status: 500 }
  );
}
```

**Existing POST handler** (report route lines 6-91) -- keep as-is, ADD new `export async function GET(...)` below it.

**New imports needed:** Add `import { NextRequest } from "next/server"` if using NextRequest, otherwise `Request` suffices.

---

### `src/lib/report-stats.ts` (utility, transform) -- NEW

**Analog:** `src/lib/mood-themes.ts` (lines 1-32)

**Module structure pattern** -- pure functions + typed exports, no side effects:
```typescript
// From mood-themes.ts: exports constants and pure helper functions
export const MOOD_EMOJIS: Record<string, string> = { ... };
export function validateGlowTheme(input: string): string { ... }
```

**Mood emoji mapping** (mood-themes.ts lines 14-25 -- reuse for mood distribution):
```typescript
export const MOOD_EMOJIS: Record<string, string> = {
  joy: "😊",
  sadness: "😢",
  anger: "😠",
  fear: "😨",
  surprise: "😲",
  disgust: "🤢",
  calm: "😌",
  love: "💜",
  anxious: "😰",
  uncertain: "💭",
};
```

**Functions to implement:**
- `computeMoodDistribution(entries)` -- group by `primary_emotion`, count, compute percentage, sort by count descending
- `computeDaysJournaled(entries)` -- unique days from `created_at` timestamps
- `computeStreak(entries)` -- longest consecutive day run + current streak counting backwards from today

**Types to export:**
```typescript
interface MoodDistributionItem {
  emotion: string;
  emoji: string;
  count: number;
  percentage: number;
}

interface StreakResult {
  current: number;
  best: number;
}
```

---

### `src/hooks/useReport.ts` (hook, request-response) -- NEW

**Analog:** `src/hooks/useTodayEntries.ts` (lines 1-34)

**Hook structure pattern** (useTodayEntries lines 1-34 -- copy this exact shape):
```typescript
"use client";

import { useQuery } from "@tanstack/react-query";

export function useReport(month: string) {
  return useQuery<ReportResponse>({
    queryKey: ["report", month],
    staleTime: 30_000,
    queryFn: async () => {
      const res = await fetch(
        `/api/report?month=${encodeURIComponent(month)}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch report");
      }
      return res.json();
    },
    enabled: !!month && /^\d{4}-\d{2}$/.test(month),
  });
}
```

**Key differences from useTodayEntries:**
- Query key: `["report", month]` (parameterized by month)
- `enabled` guard: validates month format before fetching
- Response shape: `{ stats: {...}, report: {...} | null }` (nested)
- Error handling: parse error JSON from non-ok response (same pattern as `useCreateEntry.ts` line 18)

---

### `src/app/report/page.tsx` (component, request-response) -- MODIFY

**Analog:** `src/app/report/page.tsx` (self -- 270 lines, replace hardcoded data with dynamic)

**Component structure** (report page lines 1-6 -- keep imports, add query hook):
```typescript
"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import NavBar from "@/components/NavBar";
import { Sparkles, Shield, TrendingUp, Brain, Heart, Lightbulb, ArrowRight } from "lucide-react";
import { useReport } from "@/hooks/useReport";
```

**Framer Motion variants** (report page lines 8-19 -- keep exactly):
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
```

**Loading/skeleton pattern** (from `src/app/page.tsx` lines 126-136):
```typescript
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="skeleton h-10 w-3/4 rounded-lg" />
        <div className="skeleton h-5 w-1/2 rounded-lg" />
        <div className="skeleton h-56 w-full rounded-xl" />
      </div>
    </div>
  );
}
```

**Glassmorphism card pattern** (from report page line 69):
```typescript
<div className="glass rounded-2xl p-8 text-center space-y-4 bg-gradient-to-b from-violet-500/[0.08] via-cyan-500/[0.04] to-transparent">
```

**Mood distribution bar pattern** (from report page lines 94-109 -- replace hardcoded array with `data.stats.moodDistribution.map(...)`):
```typescript
{distribution.map((item) => (
  <div key={item.emotion} className="space-y-1.5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm">{item.emoji}</span>
        <span className="text-sm text-text-primary">{item.emotion}</span>
      </div>
      <span className="text-sm font-semibold text-text-primary">{item.percentage}%</span>
    </div>
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full bg-accent rounded-full"
        style={{ width: `${item.percentage}%` }}
      />
    </div>
  </div>
))}
```

**Empty state gating** (D-05/D-06 -- hide AI sections when < 10 entries):
```typescript
const hasEnoughEntries = stats.entryCount >= 10;
// ...
{hasEnoughEntries && report && (
  <>
    {/* Pattern Recognition, Emotional Rhythm, Actionable Frameworks */}
  </>
)}
```

**Keep existing UI layout preserved:** The glassmorphism cards, section headers (`THE BIG PICTURE`, `EMOTIONAL LANDSCAPE`, etc.), animations, and NavBar are already correct -- only replace hardcoded data values with fetched data.

---

## Shared Patterns

### Authentication
**Source:** `src/app/api/entries/route.ts` lines 7-12 (used identically in ALL API routes)
**Apply to:** `src/app/api/report/route.ts` GET handler
```typescript
const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Error Handling
**Source:** `src/app/api/entries/route.ts` lines 63-68 (used identically in ALL API routes)
**Apply to:** `src/app/api/report/route.ts` GET handler
```typescript
} catch (error) {
  console.error("Report fetch error:", error);
  return NextResponse.json(
    { error: "Failed to fetch report" },
    { status: 500 }
  );
}
```

### Supabase Query Filter
**Source:** `src/app/api/entries/route.ts` lines 40-52 (canonical query pattern)
**Apply to:** Any Supabase query against `journal_entries`
```typescript
const { data, error } = await supabase
  .from("journal_entries")
  .select("...")  // only needed columns
  .eq("user_id", user.id)
  .gte("created_at", startDate)
  .lt("created_at", endDate)
  .is("deleted_at", null);
```

### TanStack Query Hook
**Source:** `src/hooks/useTodayEntries.ts` lines 1-34 (canonical hook pattern)
**Apply to:** `src/hooks/useReport.ts`
```typescript
"use client";
import { useQuery } from "@tanstack/react-query";

export function useHookName(params) {
  return useQuery<ResponseType>({
    queryKey: ["resource", params],
    staleTime: 30_000,
    queryFn: async () => {
      const res = await fetch(`/api/resource?...`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch");
      }
      return res.json();
    },
    enabled: !!params,
  });
}
```

### Test Structure (Hook Tests)
**Source:** `__tests__/hooks/useTodayEntries.test.tsx` lines 1-122
**Apply to:** `__tests__/hooks/useReport.test.tsx`
- `@vitest-environment jsdom` directive
- `createWrapper()` with QueryClientProvider
- `vi.stubGlobal("fetch", mockFetch)` for fetch mocking
- `renderHook` + `waitFor` for async assertions
- Tests: correct URL called, data returned, error handling

### Test Structure (API Route Tests)
**Source:** `__tests__/api/report.test.ts` lines 1-130
**Apply to:** Update existing file with GET tests
- `vi.hoisted()` for mock variables
- `vi.mock("@/lib/supabase/server", ...)` for Supabase mock
- `chainable()` helper for chained Supabase query mocking
- Tests: 401 unauthenticated, 400 invalid params, 200 success, 500 error

### Glassmorphism Styling
**Source:** `src/app/globals.css` lines 106-118
**Apply to:** All card elements in report page
```css
.glass {
  background: var(--color-glass);
  border: 1px solid var(--color-glass-border);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}
```
Usage: `<div className="glass rounded-2xl p-5 ...">`

### Skeleton Loading State
**Source:** `src/app/globals.css` lines 150-171 + `src/app/page.tsx` lines 126-136
**Apply to:** Report page loading state
```html
<div className="skeleton h-10 w-3/4 rounded-lg" />
```

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/lib/report-stats.ts` | utility | transform | No existing stat-computation utility; closest is `mood-themes.ts` for mood mapping constants only |

## Metadata

**Analog search scope:** `src/app/api/`, `src/hooks/`, `src/lib/`, `src/components/`, `src/app/report/`, `src/app/page.tsx`, `src/app/settings/`, `__tests__/`
**Files scanned:** 15
**Pattern extraction date:** 2026-07-17

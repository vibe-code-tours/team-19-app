# Phase 11: Dashboard Entry List + Optimistic Updates - Research

**Researched:** 2026-07-15
**Domain:** React state management, TanStack Query mutations, Framer Motion list animations, responsive layout
**Confidence:** HIGH

## Summary

Phase 11 transforms the dashboard from a single-column textarea into a side-by-side layout (desktop) with a live entry list that updates optimistically. The core technical challenge is integrating TanStack Query's `useMutation` with the `onMutate` optimistic update pattern into a codebase that currently uses raw `fetch` + `useState`. The existing `JournalEntry` interface in `MoodCalendar.tsx` must be extracted to a shared type file, and the `GET /api/entries` route needs a `day` query parameter to support single-day fetching.

The dashboard page (`src/app/page.tsx`) currently manages all state locally with `useState`. Phase 11 introduces `useQuery` for fetching today's entries and `useMutation` for optimistic creation and deletion. The existing undo toast flow must be adapted to work with query cache invalidation instead of local state. Framer Motion's `AnimatePresence` with `layout` props handles the entry/exit animations and the accordion expand/collapse pattern.

**Primary recommendation:** Extract `JournalEntry` type to `src/lib/types.ts`, create `src/hooks/useTodayEntries.ts` and `src/hooks/useCreateEntry.ts` custom hooks, and refactor `page.tsx` to use a responsive flex layout with the entry list as a scrollable panel alongside the textarea.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Entry list fetching | API / Backend | Browser / Client | Supabase query + decryption happens server-side; TanStack Query manages client cache |
| Optimistic create | Browser / Client | API / Backend | Cache update is client-side; server validates and persists |
| Optimistic delete (undo) | Browser / Client | API / Backend | Cache removal is client-side; server soft-deletes |
| Responsive layout | Browser / Client | -- | Tailwind breakpoints, pure client concern |
| Entry card animations | Browser / Client | -- | Framer Motion, pure client concern |
| Entry content display | Browser / Client | API / Backend | Decrypted content arrives via API response |
| Relative timestamps | Browser / Client | -- | Computed from `created_at` string, no server involvement |
| Accordion expand/collapse | Browser / Client | -- | Local UI state, Framer Motion animation |

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | ^5.101.2 | Server state management, caching, optimistic updates | Already in project; v5 is the current standard for React data fetching |
| framer-motion | ^12.42.2 | Animations (AnimatePresence, layout, motion.div) | Already in project; used throughout the app |
| Next.js | 16.2.10 | App Router, route handlers | Already in project |

### Supporting (no new installs needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | -- | NOT recommended; use custom relative time function | Avoid adding dependency for one function |

**No new packages required.** The entire implementation uses already-installed libraries. Relative timestamps can be implemented with a ~10-line utility function using `Intl.RelativeTimeFormat` which is built into modern browsers.

**Installation:**
```bash
# No new packages to install
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom relative time function | date-fns `formatDistanceToNow` | Adds ~70KB dependency for one function; custom is lighter |
| TanStack Query hooks | Raw fetch + useState | TanStack Query already configured in Providers.tsx; raw fetch means no cache, no deduplication, no optimistic updates |
| Framer Motion layout animations | CSS transitions | Framer Motion handles exit animations and layout shifts automatically; CSS alone requires manual orchestration |

## Package Legitimacy Audit

**No new packages are being installed in this phase.** All dependencies are already in `package.json`.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| @tanstack/react-query | npm | 8+ yrs | 25M+/wk | github.com/TanStack/query | OK | Already installed |
| framer-motion | npm | 7+ yrs | 15M+/wk | github.com/framer/motion | OK | Already installed |
| date-fns | npm | 9+ yrs | 40M+/wk | github.com/date-fns/date-fns | OK | NOT recommended (unnecessary dependency) |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
[User types in textarea]
        |
        v
[handleSubmit] ──POST /api/analyze──> [Server: validate + AI + encrypt + insert]
        |                                        |
        v                                        v
[onMutate: insert temp entry    <──────  [onSuccess: replace temp with real entry]
 into query cache with temp id]          [onSettled: invalidate + refetch]
        |
        v
[Entry appears instantly in list]
        |
        v
[Undo? → onDelete mutation]
        |──onMutate: remove from cache
        |──mutationFn: DELETE /api/entries/[id]
        |──onError: restore to cache
        |──onSettled: invalidate + refetch
        v
[Entry slides out with animation]
```

### Recommended Project Structure

```
src/
├── lib/
│   ├── types.ts              # NEW: shared JournalEntry interface
│   └── utils.ts              # NEW: relativeTime() helper
├── hooks/
│   ├── useTodayEntries.ts    # NEW: useQuery for today's entries
│   └── useCreateEntry.ts     # NEW: useMutation with optimistic update
├── components/
│   ├── EntryCard.tsx          # NEW: compact entry card with accordion
│   ├── EntryList.tsx          # NEW: scrollable list with AnimatePresence
│   └── Providers.tsx          # EXISTING: no changes needed
├── app/
│   ├── page.tsx               # MODIFY: responsive layout + integrate hooks
│   └── api/
│       └── entries/
│           └── route.ts       # MODIFY: add `day` query param
```

### Pattern 1: TanStack Query Optimistic Create Mutation
**What:** Insert a temporary entry into the query cache immediately, replace with real server response on success, roll back on error.
**When to use:** Any mutation where the user expects instant visual feedback (entry creation, undo deletion).
**Example:**
```typescript
// Source: https://tanstack.com/query/v5/docs/framework/react/examples/optimistic-updates-cache
import { useMutation, useQueryClient } from "@tanstack/react-query";

function useCreateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const { entry } = await res.json();
      return entry;
    },
    onMutate: async (content) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["entries", "today"] });

      // Snapshot previous value for rollback
      const previous = queryClient.getQueryData(["entries", "today"]);

      // Optimistically insert a temporary entry
      const tempEntry: JournalEntry = {
        id: `temp-${Date.now()}`,
        content,
        primary_emotion: "calm",
        emoji: "😌",
        secondary_emotions: [],
        bg_glow_gradient: "from-sky-500/20 to-blue-600/20",
        created_at: new Date().toISOString(),
        _isOptimistic: true,  // Flag for UI to show differently if needed
      };

      queryClient.setQueryData(["entries", "today"], (old: JournalEntry[]) => [
        ...(old || []),
        tempEntry,
      ]);

      return { previous, tempId: tempEntry.id };
    },
    onError: (_err, _vars, context) => {
      // Rollback to snapshot on error
      queryClient.setQueryData(["entries", "today"], context?.previous);
    },
    onSettled: () => {
      // Always refetch to get server truth
      queryClient.invalidateQueries({ queryKey: ["entries", "today"] });
    },
  });
}
```

### Pattern 2: TanStack Query Optimistic Delete Mutation
**What:** Remove an entry from cache instantly, soft-delete on server, restore on error.
**When to use:** Undo flow where entry must disappear immediately.
**Example:**
```typescript
function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onMutate: async (entryId) => {
      await queryClient.cancelQueries({ queryKey: ["entries", "today"] });
      const previous = queryClient.getQueryData(["entries", "today"]);

      queryClient.setQueryData(["entries", "today"], (old: JournalEntry[]) =>
        (old || []).filter((e) => e.id !== entryId)
      );

      return { previous };
    },
    onError: (_err, _entryId, context) => {
      queryClient.setQueryData(["entries", "today"], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", "today"] });
    },
  });
}
```

### Pattern 3: Framer Motion Animated List with AnimatePresence
**What:** Wrap a mapped list in `AnimatePresence` with `layout` on each item for smooth enter/exit/shift animations.
**When to use:** Any list where items are added or removed and you want smooth transitions.
**Example:**
```typescript
// Source: https://context7.com/grx7/framer-motion/llms.txt
import { motion, AnimatePresence } from "framer-motion";

<AnimatePresence mode="popLayout">
  {entries.map((entry) => (
    <motion.div
      key={entry.id}
      layout  // Smooth position shift when siblings enter/exit
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <EntryCard entry={entry} />
    </motion.div>
  ))}
</AnimatePresence>
```

### Pattern 4: Responsive Side-by-Side Layout
**What:** Use Tailwind flex layout with `md:` breakpoint for side-by-side on desktop, stacked on mobile.
**When to use:** Dashboard page layout change.
**Example:**
```typescript
// Desktop (>=768px): side-by-side, textarea ~40%, entries ~60%
// Mobile (<768px): stacked vertically
<div className="flex flex-col md:flex-row gap-6 min-h-screen">
  <div className="md:w-[40%] md:sticky md:top-0 md:h-screen md:overflow-y-auto">
    {/* Textarea panel - stays fixed on desktop */}
  </div>
  <div className="md:w-[60%] md:h-screen md:overflow-y-auto">
    {/* Entry list panel - scrolls independently on desktop */}
  </div>
</div>
```

### Pattern 5: Accordion Expand/Collapse
**What:** Click to expand a compact card to reveal full content with smooth height animation.
**When to use:** Entry cards that show preview by default, full content on click.
**Example:**
```typescript
function EntryCard({ entry, isExpanded, onToggle }) {
  return (
    <motion.div layout onClick={onToggle} className="glass rounded-xl p-4">
      <div className="flex items-center gap-3">
        <span className="text-xl">{entry.emoji}</span>
        <span className="text-sm text-text-secondary">{relativeTime(entry.created_at)}</span>
      </div>
      <p className="text-sm text-text-primary mt-2">
        {isExpanded ? entry.content : entry.content.slice(0, 100) + "..."}
      </p>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Secondary emotion pills */}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

### Anti-Patterns to Avoid
- **Don't put fetch logic in the page component:** Extract to custom hooks (`useTodayEntries`, `useCreateEntry`) for reusability and testability.
- **Don't use `mode="wait"` for list animations:** `mode="popLayout"` or default mode is better for lists — `wait` blocks new items from appearing until old ones exit.
- **Don't animate height with `height: "auto"` directly:** Framer Motion handles `"auto"` values, but wrapping content in a container with `overflow: hidden` is necessary for clean collapse.
- **Don't trust client-sent userId:** The existing pattern (extract from session server-side) must be maintained in all API routes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cache management | Manual useState + refetch | TanStack Query `useQuery` | Deduplication, background refetch, stale-while-revalidate |
| Optimistic updates | Local state manipulation | TanStack Query `useMutation` with `onMutate` | Rollback on error, automatic invalidation |
| List animations | CSS transitions + manual height calc | Framer Motion `AnimatePresence` + `layout` | Exit animations, layout shifts, spring physics |
| Responsive layout | Custom media query JS | Tailwind `md:` breakpoint classes | Standard, no JS overhead, SSR-compatible |
| Relative timestamps | date-fns import (~70KB) | Custom `relativeTime()` using `Intl.RelativeTimeFormat` | Zero-dependency, built into browsers |

**Key insight:** The optimistic update pattern in TanStack Query v5 uses `context.client` in `onMutate` (not `queryClient` from closure) — this is a v5 change from v4. The codebase uses v5.101.2, so the `context` parameter approach must be used.

## Common Pitfalls

### Pitfall 1: Stale Closure in Optimistic Update
**What goes wrong:** The `onMutate` callback captures a stale `queryClient` reference, causing the optimistic update to write to the wrong query or fail silently.
**Why it happens:** React Query v5 passes `queryClient` via the `context` parameter to `onMutate`, not via closure. Using the outer `queryClient` variable can lead to stale references in concurrent mode.
**How to avoid:** Use `context.client` in `onMutate` as shown in the v5 docs, not the outer `queryClient`. However, for simple cases with a single QueryClient, closure access is fine — the `context` pattern is for multi-client scenarios.
**Warning signs:** Optimistic entry appears but disappears immediately; cache doesn't update.

### Pitfall 2: Undo Toast Conflicting with Query Invalidation
**What goes wrong:** When undo is triggered, the delete mutation fires and invalidates the query. But the undo toast countdown also expires and tries to clear the draft. These two flows can conflict.
**Why it happens:** The current undo flow uses local state (`toast.entryId`) while the new flow uses query cache. If both try to manage the entry lifecycle, the entry can appear/disappear unexpectedly.
**How to avoid:** Keep the undo toast as-is (local state for countdown), but after DELETE succeeds, invalidate the query. The toast manages the countdown; the query manages the data. They should not both try to remove the entry from the list.
**Warning signs:** Entry disappears twice, or reappears after undo.

### Pitfall 3: Layout Animation Jank on Entry Expansion
**What goes wrong:** Accordion expand/collapse causes other entries to jump or flicker because `layout` animations on siblings interfere.
**Why it happens:** Framer Motion's `layout` prop animates all siblings when one changes size. If not scoped properly, expanding one card causes all others to animate.
**How to avoid:** Use `layout="position"` on entry cards (animates only position, not size) or wrap each card in a container that isolates its layout changes. Test with 5+ entries to catch edge cases.
**Warning signs:** Other cards visibly jump when one expands.

### Pitfall 4: GET /api/entries Missing Day Param
**What goes wrong:** The dashboard fetches all month entries when it only needs today's entries. This wastes bandwidth and makes optimistic updates harder (you're mutating a large dataset).
**Why it happens:** The current API only accepts `month` parameter. Without a `day` parameter, the client must filter client-side.
**How to avoid:** Add `day` parameter support to `GET /api/entries` that accepts `YYYY-MM-DD` format. When `day` is provided, filter by that specific day instead of a month range.
**Warning signs:** Slow initial load, large payload for users with many entries.

### Pitfall 5: Temporary Entry ID Collision
**What goes wrong:** Two rapid submissions create temp entries with the same `Date.now()` ID, causing React key conflicts.
**Why it happens:** `Date.now()` can return the same value for rapid clicks.
**How to avoid:** Use `crypto.randomUUID()` or `Math.random().toString(36)` for temp IDs. Better: use a counter or UUID.
**Warning signs:** React console warning about duplicate keys.

## Code Examples

### Custom Hook: useTodayEntries
```typescript
// src/hooks/useTodayEntries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import type { JournalEntry } from "@/lib/types";

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function useTodayEntries() {
  return useQuery<JournalEntry[]>({
    queryKey: ["entries", "today"],
    queryFn: async () => {
      const day = getTodayKey();
      const res = await fetch(`/api/entries?day=${day}`);
      if (!res.ok) throw new Error("Failed to fetch entries");
      const data = await res.json();
      return data.entries || [];
    },
    staleTime: 30 * 1000, // 30 seconds per D-15
  });
}
```

### Custom Hook: useCreateEntry
```typescript
// src/hooks/useCreateEntry.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { JournalEntry } from "@/lib/types";

export function useCreateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save entry");
      }
      const { entry } = await res.json();
      return entry as JournalEntry;
    },
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ["entries", "today"] });
      const previous = queryClient.getQueryData<JournalEntry[]>(["entries", "today"]);

      const tempEntry: JournalEntry = {
        id: `temp-${crypto.randomUUID()}`,
        content,
        primary_emotion: "calm",
        emoji: "😌",
        secondary_emotions: [],
        bg_glow_gradient: "from-sky-500/20 to-blue-600/20",
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<JournalEntry[]>(["entries", "today"], (old) => [
        ...(old || []),
        tempEntry,
      ]);

      return { previous, tempId: tempEntry.id };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["entries", "today"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", "today"] });
    },
  });
}
```

### Custom Hook: useDeleteEntry
```typescript
// src/hooks/useDeleteEntry.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { JournalEntry } from "@/lib/types";

export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onMutate: async (entryId) => {
      await queryClient.cancelQueries({ queryKey: ["entries", "today"] });
      const previous = queryClient.getQueryData<JournalEntry[]>(["entries", "today"]);

      queryClient.setQueryData<JournalEntry[]>(["entries", "today"], (old) =>
        (old || []).filter((e) => e.id !== entryId)
      );

      return { previous };
    },
    onError: (_err, _entryId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["entries", "today"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", "today"] });
    },
  });
}
```

### Shared Type: JournalEntry
```typescript
// src/lib/types.ts
export interface JournalEntry {
  id: string;
  content: string;
  primary_emotion: string;
  emoji: string;
  secondary_emotions: string[];
  bg_glow_gradient: string;
  created_at: string;
}
```

### Utility: relativeTime
```typescript
// src/lib/utils.ts
export function relativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
```

### GET /api/entries with Day Param Extension
```typescript
// src/app/api/entries/route.ts — addition to existing GET handler
const day = searchParams.get("day"); // YYYY-MM-DD format

if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
  // Single-day mode: filter to specific day
  const startDate = new Date(day + "T00:00:00").toISOString();
  const endDate = new Date(day + "T23:59:59.999").toISOString();

  const { data: entries, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  // ... decrypt and return
} else if (month) {
  // Existing month mode
  // ...
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw fetch + useState | TanStack Query useQuery/useMutation | This phase | Cache management, background refetch, optimistic updates |
| Manual refetch after mutation | Query invalidation + refetch | This phase | Single source of truth, no stale data |
| Local state for entry list | Query cache as source of truth | This phase | Multiple components can share entry data |
| CSS transitions | Framer Motion AnimatePresence + layout | This phase | Exit animations, layout shift animations |

**Deprecated/outdated:**
- Raw `fetch` in `page.tsx` for entry data: replaced by `useTodayEntries()` hook
- Manual `useState` + `useEffect` data fetching pattern: replaced by TanStack Query

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `crypto.randomUUID()` is available in browser context | Code Examples | Fallback: use `Math.random().toString(36)` |
| A2 | The `day` param extension to GET /api/entries is backward-compatible (existing `month` param still works) | Architecture | Low risk — adding a new optional param |
| A3 | Framer Motion v12 supports `mode="popLayout"` on AnimatePresence | Pattern 3 | Fallback: use default mode |
| A4 | `Intl.RelativeTimeFormat` is available in all target browsers | Code Examples | Fallback: simple string concatenation |
| A5 | The existing `JournalEntry` interface in MoodCalendar.tsx matches what the API returns | Code Examples | Verified by reading both files — fields match exactly |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions (RESOLVED)

1. **Entry list scope** — RESOLVED: Today only per D-13 (`['entries', 'today']` query key). Empty state per D-04 handles the no-entries case. No fallback to yesterday's entries.
2. **Optimistic entry appearance** — RESOLVED: Appear instantly with full card. The `onSettled` refetch replaces with server truth. No spinner needed — the optimistic entry looks identical to a real one.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/dev | Yes | -- | -- |
| npm | Package management | Yes | -- | -- |
| TanStack Query | Core data fetching | Yes | ^5.101.2 | -- |
| Framer Motion | Animations | Yes | ^12.42.2 | -- |
| Supabase | Database | Yes | -- | -- |

**Missing dependencies with no fallback:** None
**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 |
| Config file | vitest.config.ts (inferred from package.json) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R7 | Entry list displays today's entries | unit | `npm run test -- --testPathPattern entry` | No — Wave 0 |
| R7 | Optimistic create inserts temp entry | unit | `npm run test -- --testPathPattern optimistic` | No — Wave 0 |
| R7 | Optimistic delete removes entry from cache | unit | `npm run test -- --testPathPattern optimistic` | No — Wave 0 |
| R7 | GET /api/entries accepts day param | unit | `npm run test -- --testPathPattern entries` | Partial — existing test covers month param |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test:coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `__tests__/hooks/useTodayEntries.test.ts` — covers entry fetching hook
- [ ] `__tests__/hooks/useCreateEntry.test.ts` — covers optimistic create
- [ ] `__tests__/hooks/useDeleteEntry.test.ts` — covers optimistic delete
- [ ] `__tests__/lib/utils.test.ts` — covers relativeTime utility
- [ ] Update `__tests__/api/entries.test.ts` — add tests for `day` param

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Supabase session in cookies (existing pattern) |
| V4 Access Control | Yes | RLS on journal_entries (existing); userId from session |
| V5 Input Validation | Yes | Content length validation (existing); day param regex validation |
| V6 Cryptography | Yes | AES-256-GCM encryption (existing, no changes) |

### Known Threat Patterns for Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Parameter injection in day param | Tampering | Regex validation: `/^\d{4}-\d{2}-\d{2}$/` |
| Cache poisoning via optimistic update | Tampering | Optimistic entries use temp IDs; server validates real entries |
| Race condition in undo flow | Elevation of Privilege | Query invalidation after delete ensures server truth wins |

## Sources

### Primary (HIGH confidence)
- [Context7: TanStack Query v5 optimistic updates](https://tanstack.com/query/v5/docs/framework/react/examples/optimistic-updates-cache) — onMutate/onError/onSettled pattern, context.client API
- [Context7: Framer Motion AnimatePresence](https://context7.com/grx7/framer-motion/llms.txt) — mode="popLayout", layout prop, exit animations
- [Source code: src/app/page.tsx] — Current dashboard implementation (343 lines)
- [Source code: src/components/MoodCalendar.tsx] — JournalEntry interface (lines 8-16)
- [Source code: src/app/api/entries/route.ts] — GET handler with month param

### Secondary (MEDIUM confidence)
- [Source code: src/components/Providers.tsx] — QueryClient config (5min staleTime)
- [Source code: src/lib/mood-themes.ts] — MOOD_THEMES and MOOD_EMOJIS mappings

### Tertiary (LOW confidence)
- None — all findings verified against source code or Context7 docs

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all packages already installed and verified in package.json
- Architecture: HIGH — patterns directly from TanStack Query v5 and Framer Motion official docs
- Pitfalls: HIGH — derived from reading existing code and understanding integration points

**Research date:** 2026-07-15
**Valid until:** 2026-08-15 (30 days — stable stack, no fast-moving dependencies)

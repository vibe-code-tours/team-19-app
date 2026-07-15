# Phase 11: Dashboard Entry List + Optimistic Updates - Pattern Map

**Mapped:** 2026-07-15
**Files analyzed:** 13 (7 new, 2 modified, 4 tests)
**Analogs found:** 9 / 13

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/types.ts` | utility | transform | `src/lib/ai/types.ts` | role-match |
| `src/lib/utils.ts` | utility | transform | N/A — no existing utils | none |
| `src/hooks/useTodayEntries.ts` | hook | request-response | N/A — first custom hook | none |
| `src/hooks/useCreateEntry.ts` | hook | CRUD | N/A — first optimistic mutation | none |
| `src/hooks/useDeleteEntry.ts` | hook | CRUD | N/A — first optimistic mutation | none |
| `src/components/EntryCard.tsx` | component | request-response | `src/components/MoodCalendar.tsx` (lines 53-111, EntryCard) | exact |
| `src/components/EntryList.tsx` | component | request-response | `src/components/MoodCalendar.tsx` (lines 364-462, overlay list) | role-match |
| `src/app/page.tsx` (MODIFY) | controller | request-response | `src/app/page.tsx` (current, self-analog) | exact |
| `src/app/api/entries/route.ts` (MODIFY) | controller | request-response | `src/app/api/entries/route.ts` (current, self-analog) | exact |
| `__tests__/hooks/useTodayEntries.test.ts` | test | — | `__tests__/api/entries.test.ts` | role-match |
| `__tests__/hooks/useCreateEntry.test.ts` | test | — | `__tests__/api/analyze.test.ts` | role-match |
| `__tests__/hooks/useDeleteEntry.test.ts` | test | — | `__tests__/api/entries.test.ts` (DELETE tests) | role-match |
| `__tests__/lib/utils.test.ts` | test | — | `__tests__/lib/mood-themes.test.ts` | role-match |

## Pattern Assignments

### `src/lib/types.ts` (utility, transform)

**Analog:** `src/lib/ai/types.ts`

**Imports pattern** (no imports needed — pure type definitions):
```typescript
// src/lib/ai/types.ts — reference for type-only file structure
export interface AnalysisResult {
  primary_emotion: string;
  emoji: string;
  secondary_emotions: string[];
  glow_theme: string;
}
```

**Core pattern** — shared type file with exported interfaces:
```typescript
// NEW: src/lib/types.ts
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

**Note:** The JournalEntry interface currently lives in `src/components/MoodCalendar.tsx` lines 8-16. Extract to this shared file and update all imports (MoodCalendar.tsx, new hooks, EntryCard, EntryList).

---

### `src/lib/utils.ts` (utility, transform)

**No analog.** First utility file in the project.

**Pattern from RESEARCH.md** — pure function, no dependencies:
```typescript
// NEW: src/lib/utils.ts
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

---

### `src/hooks/useTodayEntries.ts` (hook, request-response)

**No analog.** First custom hook in the project.

**Existing data-fetching pattern to replace** (from `src/app/page.tsx` lines 88-96):
```typescript
// CURRENT: raw fetch in page.tsx
const res = await fetch("/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content: content.slice(0, MAX_LENGTH) }),
});
if (!res.ok) {
  const data = await res.json();
  throw new Error(data.error || "Failed to save entry");
}
const { entry } = await res.json();
```

**Pattern from RESEARCH.md** — TanStack Query useQuery:
```typescript
// NEW: src/hooks/useTodayEntries.ts
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

---

### `src/hooks/useCreateEntry.ts` (hook, CRUD — optimistic create)

**No analog.** First optimistic mutation in the project.

**Existing create pattern** (from `src/app/page.tsx` lines 80-112) — raw fetch + local state:
```typescript
// CURRENT: handleSubmit in page.tsx
const res = await fetch("/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content: content.slice(0, MAX_LENGTH) }),
});
if (!res.ok) {
  const data = await res.json();
  throw new Error(data.error || "Failed to save entry");
}
const { entry } = await res.json();
setSavedDraft(content);
setJustSubmitted(true);
setToast({ entryId: entry.id, countdown: 4 });
setContent("");
```

**Pattern from RESEARCH.md** — optimistic mutation with onMutate/onError/onSettled:
```typescript
// NEW: src/hooks/useCreateEntry.ts
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

---

### `src/hooks/useDeleteEntry.ts` (hook, CRUD — optimistic delete)

**No analog.** First optimistic delete mutation.

**Existing undo pattern** (from `src/app/page.tsx` lines 114-120):
```typescript
// CURRENT: handleUndo in page.tsx
async function handleUndo() {
  if (!toast) return;
  await fetch(`/api/entries/${toast.entryId}`, { method: "DELETE" });
  setContent(savedDraft);
  setSavedDraft("");
  setToast(null);
}
```

**Pattern from RESEARCH.md** — optimistic delete with cache removal:
```typescript
// NEW: src/hooks/useDeleteEntry.ts
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

---

### `src/components/EntryCard.tsx` (component, request-response)

**Analog:** `src/components/MoodCalendar.tsx` lines 53-111 (EntryCard)

**Imports pattern** (follow MoodCalendar.tsx lines 1-6):
```typescript
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { JournalEntry } from "@/lib/types";
import { relativeTime } from "@/lib/utils";
```

**Core card pattern** (adapted from MoodCalendar.tsx lines 53-111):
```typescript
// MoodCalendar.tsx EntryCard — reference for glass styling + emotion pills
function EntryCard({
  entry,
  onEditMood,
}: {
  entry: JournalEntry;
  onEditMood: () => void;
}) {
  return (
    <div className="glass rounded-xl p-4 space-y-3">
      {/* Entry Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-xl">{entry.emoji}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary capitalize">
              {entry.primary_emotion}
            </p>
            <p className="text-xs text-text-secondary">
              {new Date(entry.created_at).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
      {/* Entry Content */}
      <p className="text-[14px] text-text-primary leading-relaxed">
        {entry.content}
      </p>
      {/* Emotion Pills */}
      {entry.secondary_emotions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entry.secondary_emotions.map((emotion) => (
            <span
              key={emotion}
              className="px-2 py-0.5 glass rounded-full text-[11px] font-medium text-text-secondary capitalize"
            >
              {emotion}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

**New accordion pattern** (from RESEARCH.md Pattern 5):
```typescript
// NEW: EntryCard with accordion expand/collapse
function EntryCard({ entry }: { entry: JournalEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout="position"
      onClick={() => setIsExpanded(!isExpanded)}
      className="glass rounded-xl p-4 cursor-pointer"
    >
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
            className="overflow-hidden"
          >
            {entry.secondary_emotions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {entry.secondary_emotions.map((emotion) => (
                  <span
                    key={emotion}
                    className="px-2 py-0.5 glass rounded-full text-[11px] font-medium text-text-secondary capitalize"
                  >
                    {emotion}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

---

### `src/components/EntryList.tsx` (component, request-response)

**Analog:** `src/components/MoodCalendar.tsx` lines 364-462 (overlay entry list)

**Imports pattern** (follow MoodCalendar.tsx lines 1-6):
```typescript
"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { JournalEntry } from "@/lib/types";
import EntryCard from "./EntryCard";
```

**Core animated list pattern** (adapted from MoodCalendar.tsx lines 412-458 + RESEARCH.md Pattern 3):
```typescript
// MoodCalendar.tsx — reference for AnimatePresence list rendering
<div className="flex-1 overflow-y-auto space-y-4 -mx-2 px-2">
  {selectedEntries.map((entry) => (
    <div key={entry.id}>
      <EntryCard entry={entry} onEditMood={...} />
    </div>
  ))}
</div>

// NEW: EntryList with AnimatePresence for smooth add/remove
<AnimatePresence mode="popLayout">
  {entries.map((entry) => (
    <motion.div
      key={entry.id}
      layout
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

**Empty state pattern** (from MoodCalendar.tsx lines 346-360):
```typescript
// MoodCalendar.tsx — reference for empty state with glassmorphism
{entries.length === 0 && (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mt-8 glass-strong rounded-2xl p-6 text-center space-y-3"
  >
    <div className="breathe mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
      <span className="text-2xl">✨</span>
    </div>
    <p className="text-text-secondary text-sm leading-relaxed">
      Your mood constellation awaits. Start journaling to see your emotions map.
    </p>
  </motion.div>
)}
```

---

### `src/app/page.tsx` (MODIFY — controller, request-response)

**Analog:** self-analog (current implementation, 343 lines)

**Current layout pattern** (lines 139-189) — single column, max-w-lg centered:
```typescript
// CURRENT: single-column layout
<div className="min-h-screen flex flex-col">
  {/* Header */}
  <div className="flex justify-end gap-1 p-5">...</div>
  {/* Content */}
  <div className="flex-1 flex flex-col px-5 pb-8 max-w-lg mx-auto w-full gap-7">
    {/* Logo, Greeting, Textarea, Character Counter, Error, Submit Button */}
  </div>
  {/* Undo Toast */}
</div>
```

**New responsive layout pattern** (from RESEARCH.md Pattern 4):
```typescript
// NEW: responsive side-by-side layout
<div className="min-h-screen flex flex-col md:flex-row">
  {/* Header (mobile only) */}
  <div className="md:hidden flex justify-end gap-1 p-5">...</div>
  {/* Textarea Panel */}
  <div className="md:w-[40%] md:sticky md:top-0 md:h-screen md:overflow-y-auto">
    {/* Header (desktop) */}
    <div className="hidden md:flex justify-end gap-1 p-5">...</div>
    {/* Logo, Greeting, Textarea, Submit — existing content */}
  </div>
  {/* Entry List Panel */}
  <div className="md:w-[60%] md:h-screen md:overflow-y-auto px-5 pb-8">
    <EntryList />
  </div>
</div>
```

**Undo toast pattern** (lines 315-340) — keep existing, but integrate with useDeleteEntry:
```typescript
// CURRENT: undo toast (keep this, wire to useDeleteEntry mutation)
<AnimatePresence>
  {toast && (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 left-4 right-4 mx-auto max-w-sm glass-strong rounded-xl p-4 flex items-center justify-between"
    >
      ...
      <button onClick={handleUndo} className="text-sm font-medium text-accent hover:underline">
        Undo
      </button>
    </motion.div>
  )}
</AnimatePresence>
```

**Key integration point:** Replace raw `fetch` in `handleSubmit` (lines 80-112) with `useCreateEntry()` mutation. Replace `handleUndo` (lines 114-120) with `useDeleteEntry()` mutation.

---

### `src/app/api/entries/route.ts` (MODIFY — controller, request-response)

**Analog:** self-analog (current implementation, 55 lines)

**Current month-only pattern** (lines 5-55):
```typescript
// CURRENT: only accepts month param
const { searchParams } = new URL(request.url);
const month = searchParams.get("month"); // YYYY-MM format
if (!month || !/^\d{4}-\d{2}$/.test(month)) {
  return NextResponse.json({ error: "Invalid month format. Use YYYY-MM" }, { status: 400 });
}
```

**Auth pattern** (lines 7-13) — must maintain:
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Query pattern** (lines 30-37) — must maintain for both month and day modes:
```typescript
const { data: entries, error } = await supabase
  .from("journal_entries")
  .select("*")
  .eq("user_id", user.id)
  .gte("created_at", startDate)
  .lt("created_at", endDate)
  .is("deleted_at", null)
  .order("created_at", { ascending: true });
```

**Decryption pattern** (lines 42-45) — must maintain:
```typescript
const decryptedEntries = entries?.map((e) => ({
  ...e,
  content: decrypt(e.content, e.content_iv),
})) || [];
```

**New day param extension** (from RESEARCH.md):
```typescript
// ADD: day param support (YYYY-MM-DD format)
const day = searchParams.get("day");

if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
  // Single-day mode
  const startDate = new Date(day + "T00:00:00").toISOString();
  const endDate = new Date(day + "T23:59:59.999").toISOString();
  // ... query with gte/lte
} else if (month && /^\d{4}-\d{2}$/.test(month)) {
  // Existing month mode (keep as-is)
} else {
  return NextResponse.json({ error: "Provide day (YYYY-MM-DD) or month (YYYY-MM)" }, { status: 400 });
}
```

---

### Test Files

**Analog:** `__tests__/api/entries.test.ts` (134 lines)

**Test structure pattern** (lines 1-38):
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));
```

**Chainable mock pattern** (lines 22-38):
```typescript
function chainable(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: [], error: null }),
    ...overrides,
  };
  chain.then = chain.then.bind(chain);
  return chain;
}
```

**Test file structure** (from `__tests__/api/entries.test.ts`):
- `describe("GET /api/entries")` — auth, validation, success cases
- `describe("PATCH /api/entries/[id]")` — auth, validation, success cases
- `describe("DELETE /api/entries/[id]")` — auth, success cases

**For hook tests**, mock `@tanstack/react-query` and `fetch`:
```typescript
// NEW: __tests__/hooks/useTodayEntries.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTodayEntries } from "@/hooks/useTodayEntries";

// Mock fetch
global.fetch = vi.fn();

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

---

## Shared Patterns

### Authentication (Server-Side)
**Source:** `src/app/api/entries/route.ts` lines 7-13
**Apply to:** `src/app/api/entries/route.ts` modification (day param addition)
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Client-Side Supabase
**Source:** `src/app/page.tsx` lines 4, 32
**Apply to:** `src/app/page.tsx` modification
```typescript
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
```

### Glass Styling
**Source:** `src/app/globals.css` lines 40-52
**Apply to:** EntryCard, EntryList, empty states
```css
.glass {
  background: var(--color-glass);
  border: 1px solid var(--color-glass-border);
  backdrop-filter: blur(24px);
}
.glass-strong {
  background: var(--color-glass-strong);
  border: 1px solid var(--color-glass-border);
  backdrop-filter: blur(24px);
}
```

### Emotion Pill Styling
**Source:** `src/components/MoodCalendar.tsx` lines 97-108
**Apply to:** EntryCard secondary emotions
```typescript
<span className="px-2 py-0.5 glass rounded-full text-[11px] font-medium text-text-secondary capitalize">
  {emotion}
</span>
```

### Framer Motion Undo Toast
**Source:** `src/app/page.tsx` lines 315-340
**Apply to:** page.tsx modification (keep existing, wire to useDeleteEntry)
```typescript
<AnimatePresence>
  {toast && (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 left-4 right-4 mx-auto max-w-sm glass-strong rounded-xl p-4 flex items-center justify-between"
    >
      ...
    </motion.div>
  )}
</AnimatePresence>
```

### QueryClient Provider
**Source:** `src/components/Providers.tsx` lines 1-22
**Apply to:** All hooks (useQuery/useMutation work within this provider)
```typescript
const [queryClient] = useState(
  () => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5 * 60 * 1000, retry: 1 },
    },
  })
);
```

### Error Handling (API Routes)
**Source:** `src/app/api/entries/route.ts` lines 48-54
**Apply to:** API route modification
```typescript
} catch (error) {
  console.error("Entries fetch error:", error);
  return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
}
```

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/hooks/useTodayEntries.ts` | hook | request-response | No custom hooks exist yet; first TanStack Query integration |
| `src/hooks/useCreateEntry.ts` | hook | CRUD | No optimistic update pattern exists yet; first useMutation |
| `src/hooks/useDeleteEntry.ts` | hook | CRUD | No optimistic delete pattern exists yet; first useMutation |
| `src/lib/utils.ts` | utility | transform | No utility module exists yet; relativeTime is first function |
| `__tests__/hooks/useTodayEntries.test.ts` | test | — | No hook tests exist yet; needs React Testing Library renderHook |
| `__tests__/hooks/useCreateEntry.test.ts` | test | — | No mutation hook tests exist yet |
| `__tests__/hooks/useDeleteEntry.test.ts` | test | — | No mutation hook tests exist yet |
| `__tests__/lib/utils.test.ts` | test | — | No utility tests exist yet |

## Metadata

**Analog search scope:** `src/app/`, `src/components/`, `src/lib/`, `src/app/api/`, `__tests__/`
**Files scanned:** 12 source files, 8 test files
**Pattern extraction date:** 2026-07-15

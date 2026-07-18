# TanStack React Query (Optimistic Updates)

## Overview

SoulScript uses TanStack React Query v5 for data fetching and mutations. The key pattern is optimistic updates — the UI updates instantly while the server request runs in the background, with automatic rollback on failure.

## Provider Setup (`src/components/Providers.tsx`)

```typescript
const [queryClient] = useState(
  () => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
      },
    },
  })
);
```

- `staleTime: 5min` — data is considered fresh for 5 minutes, preventing refetch on every mount
- `retry: 1` — one retry on failure before showing error state
- Created with `useState` to avoid re-creating on re-renders

## Query: Today's Entries (`src/hooks/useTodayEntries.ts`)

```typescript
export function useTodayEntries() {
  return useQuery<JournalEntry[]>({
    queryKey: ["entries", "today"],
    staleTime: 30_000,  // 30s for today's entries (more real-time)
    queryFn: async () => {
      const { start, end } = getTodayRange();
      const res = await fetch(`/api/entries?start=${start}&end=${end}`);
      const data = await res.json();
      return data.entries || [];
    },
  });
}
```

**UTC-aware date boundaries:**

```typescript
function getTodayRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return { start: start.toISOString(), end: end.toISOString() };
}
```

Uses `getUTCDate()` instead of `getDate()` to compute boundaries in the user's local day but send UTC timestamps to the server.

## Mutation: Create Entry (`src/hooks/useCreateEntry.ts`)

This is the core optimistic update pattern:

```typescript
return useMutation<JournalEntry, Error, { content: string }, { previous: JournalEntry[] | undefined; tempId: string }>({
  mutationFn: async ({ content }) => {
    const res = await fetch("/api/analyze", { method: "POST", body: JSON.stringify({ content }) });
    const { entry } = await res.json();
    return entry;
  },

  // 1. Optimistic update — runs BEFORE the server responds
  onMutate: async ({ content }) => {
    await queryClient.cancelQueries({ queryKey: ["entries", "today"] });
    const previous = queryClient.getQueryData<JournalEntry[]>(["entries", "today"]);

    const tempEntry: JournalEntry = {
      id: `temp-${crypto.randomUUID()}`,
      content,
      primary_emotion: "",
      emoji: "",
      secondary_emotions: [],
      bg_glow_gradient: "from-sky-500/20 to-blue-600/20",
      created_at: new Date().toISOString(),
    };

    queryClient.setQueryData<JournalEntry[]>(["entries", "today"], (old) => [
      tempEntry, ...(old || []),
    ]);

    return { previous, tempId: tempEntry.id };
  },

  // 2. Rollback on error — restore the snapshot
  onError: (_err, _variables, context) => {
    if (context?.previous !== undefined) {
      queryClient.setQueryData(["entries", "today"], context.previous);
    }
  },

  // 3. Always refetch server truth — success or failure
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["entries", "today"] });
  },
});
```

### The 4-Step Pattern

1. **Cancel queries** — prevent race conditions with in-flight refetches
2. **Snapshot** — save current cache state for potential rollback
3. **Optimistic set** — insert temp entry at the top of the list
4. **Rollback/Invalidate** — on error, restore snapshot; on settle, refetch server truth

### Temp Entry Design

The temp entry uses a `temp-` prefix ID and empty emotion fields. After the server responds, `onSettled` triggers a refetch that replaces the temp entry with the real one (including AI-analyzed emotions).

## Mutation: Delete Entry (`src/hooks/useDeleteEntry.ts`)

Same pattern, but removes instead of inserting:

```typescript
onMutate: async (entryId) => {
  await queryClient.cancelQueries({ queryKey: ["entries", "today"] });
  const previous = queryClient.getQueryData<JournalEntry[]>(["entries", "today"]);

  queryClient.setQueryData<JournalEntry[]>(["entries", "today"], (old) =>
    (old || []).filter((e) => e.id !== entryId)
  );

  return { previous };
},
```

## Undo Pattern (Dashboard)

The dashboard uses a 4-second countdown toast for undo:

```typescript
const entry = await createEntry.mutateAsync({ content });
setToast({ entryId: entry.id, countdown: 4 });

async function handleUndo() {
  await deleteEntry.mutateAsync(toast.entryId);
  setContent(savedDraft);  // restore textarea content
}
```

The toast auto-dismisses after 4 seconds. During that window, the user can tap "Undo" to delete the entry and restore their text.

## Key Decisions

- **Different stale times** — 5 minutes globally, 30 seconds for today's entries (need fresher data)
- **`onSettled` not `onSuccess`** — always refetch even after errors, ensuring consistency
- **No `onSuccess` callback** — the optimistic update handles UI feedback; `onSettled` ensures server truth
- **Typed mutation context** — the 4th generic parameter types the `context` object passed between `onMutate` → `onError`

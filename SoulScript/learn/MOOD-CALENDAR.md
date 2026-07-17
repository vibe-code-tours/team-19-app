# Mood Calendar — Refactoring Learnings

## Session Date: 2026-07-16

---

## 1. What We Did

### Goal
Refactor the monolithic `MoodCalendar` component (552 lines) into a clean, composable architecture aligned with the Pencil design spec.

### Scope
- Created `useCalendar` hook with TanStack Query for data fetching and derived stats
- Extracted 4 presentational components: `CalendarGrid`, `StatCards`, `RecentEntries`, `MoodTrend`
- Rewrote `MoodCalendar` as a thin orchestrator (~260 lines)
- Added "Today" button in month navigation
- Added mood legend below calendar grid
- Replaced hardcoded stats with dynamic data
- Replaced static bar chart with entry-driven mood trend

### Approach
**Design-first workflow:**
1. Analyzed Pencil design (`soulscript.pen`) — Calendar Tablet + Desktop frames
2. Diff'd design against existing code to identify gaps
3. Created extraction plan with component boundaries
4. Built hook → components → orchestrator in sequence
5. Verified with `npm run build` + `npm run test`

---

## 2. Architecture Decisions

### Monolith → Orchestrator Pattern
| Before | After |
|--------|-------|
| 1 file, 552 lines | 6 files, ~60-100 lines each |
| Mixed data + presentation | Hook owns data, components own UI |
| Hardcoded stats | Dynamic from API |
| No "Today" button | "Today" pill in month nav |
| No mood legend | 6-item color legend |
| Static bar chart | Entry-driven bar chart |

### Component Responsibilities
| Component | Responsibility | Data Source |
|-----------|---------------|-------------|
| `useCalendar` | Month navigation, entry fetching, derived stats | `/api/entries?month=YYYY-MM` via TanStack Query |
| `CalendarGrid` | Calendar grid, month nav, weekday header, mood legend | Props from `useCalendar` |
| `StatCards` | 3 stat cards (entries, streak, positive %) | Props from `useCalendar.stats` |
| `RecentEntries` | Last 3 journal entries list | Props from `useCalendar.stats.recentEntries` |
| `MoodTrend` | Bar chart + mood summary | Props from `useCalendar` |
| `MoodCalendar` | Orchestrator, entry overlay/modal | Composes all above |

### Data Flow
```
useCalendar (hook)
  ├─ entries: JournalEntry[]          ← fetch from API
  ├─ stats.uniqueDays                 ← computed
  ├─ stats.streak                     ← computed (consecutive days)
  ├─ stats.positivePercentage         ← computed (joy/calm/love/surprise)
  ├─ stats.moodDistribution           ← computed (emotion → count/percentage)
  ├─ stats.recentEntries              ← computed (last 3, sorted by date)
  ├─ prevMonth() / nextMonth() / goToToday()  ← state setters
  │
  └─→ MoodCalendar (orchestrator)
        ├─→ StatCards(entryCount, streak, positivePercentage)
        ├─→ CalendarGrid(entries, year, month, daysInMonth, firstDay, ...)
        ├─→ RecentEntries(recentEntries, onEntryClick)
        ├─→ MoodTrend(entries, moodDistribution, daysInMonth)
        └─→ Entry Overlay (modal, mood picker)
```

---

## 3. Key Patterns

### TanStack Query for Calendar Data

```typescript
const { data: entries = [], isLoading } = useQuery<JournalEntry[]>({
  queryKey: ["entries", "month", monthKey],
  staleTime: 30_000,
  queryFn: async () => {
    const res = await fetch(`/api/entries?month=${monthKey}`);
    if (!res.ok) throw new Error("Failed to fetch entries");
    const data = await res.json();
    return data.entries || [];
  },
});
```

**Why TanStack Query over raw fetch + useEffect:**
- Automatic caching — switching months and back doesn't refetch
- `staleTime: 30_000` prevents redundant requests
- `isLoading` state for free (no manual loading flag)
- Error handling built in
- Query key invalidation on mood update

### Streak Calculation Algorithm

```typescript
function computeStreak(entries: JournalEntry[]): number {
  const daySet = new Set(
    entries.map((e) => {
      const d = new Date(e.created_at);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  let streak = 0;
  const now = new Date();

  for (let i = 0; i < 365; i++) {
    const check = new Date(now);
    check.setDate(check.getDate() - i);
    const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;

    if (daySet.has(key)) {
      streak++;
    } else if (i > 0) {
      break;  // Gap found — streak ends
    }
  }

  return streak;
}
```

**Key insight:** Uses `Set` for O(1) lookup. Iterates backwards from today. Breaks on first gap (but allows today to be missing if yesterday was journaled).

### Mood Color Mapping

```typescript
const MOOD_COLORS: Record<string, string> = {
  joy: "#F59E0B",
  calm: "#0EA5E9",
  love: "#EC4899",
  sadness: "#3B82F6",
  anger: "#EF4444",
  fear: "#8B5CF6",
  surprise: "#22D3EE",
  anxious: "#EAB308",
  uncertain: "#475569",
  disgust: "#10B981",
};
```

Used for:
- Calendar day cell glow (`boxShadow: 0 0 6px ${color}20`)
- Bar chart fill colors (`${color}40` for 25% opacity)
- Today cell accent border

### Today Cell Highlighting

```tsx
{isToday ? (
  <div className="bg-gradient-to-b from-accent/20 to-accent/8
    border border-accent
    shadow-[0_0_12px_rgba(124,92,252,0.3)]">
    {/* day number + emoji */}
  </div>
) : (
  <div className="border border-dashed border-white/[0.07]">
    {/* day number only */}
  </div>
)}
```

Today gets: gradient fill, solid accent border, purple glow shadow. Other days with entries get mood-colored glow. Empty days get dashed border.

### Positive Percentage Calculation

```typescript
const POSITIVE_EMOTIONS = new Set(["joy", "calm", "love", "surprise"]);

const positiveCount = entries.filter((e) =>
  POSITIVE_EMOTIONS.has(e.primary_emotion)
).length;
const positivePercentage = entries.length > 0
  ? Math.round((positiveCount / entries.length) * 100)
  : 0;
```

Selects 4 "positive" emotions. Used in the StatCards "Positive days" metric.

---

## 4. Design Alignment

### Pencil Design vs Implementation

| Design Element | Pencil | Implementation |
|----------------|--------|----------------|
| Month nav | Prev/next pill buttons + "Today" pill | ✅ 32px rounded buttons + Today pill with dot |
| Weekday header | MON-SUN, uppercase, letter-spaced | ✅ `tracking-[1.5px]`, `text-[11px]` |
| Day cells | Rounded rect, day number + emoji | ✅ `rounded-lg`, flex column layout |
| Today cell | Accent gradient + border + glow | ✅ `from-accent/20 to-accent/8` + `border-accent` |
| Mood legend | 6 items with colored dots | ✅ Joy, Calm, Love, Neutral, Sad, Angry |
| Stat cards | Icon + value + label | ✅ Phosphor icons, Geist Mono values |
| Journal entries | Lock icon, preview, time, chevron | ✅ Lucide icons, line-clamp-2 |
| Mood trend bar | Per-day colored bars | ✅ Dynamic height based on entries |
| CTA section | Below content row | ✅ `router.push("/report")` |

### Responsive Layout

```
Mobile:  Single column (calendar → entries → trend → CTA)
Tablet:  Single column with wider max-w-5xl
Desktop: Two-column (calendar left, right panel 340px)
```

---

## 5. File Structure

```
src/
├── hooks/
│   └── useCalendar.ts              # NEW: Calendar data hook
├── components/
│   ├── CalendarGrid.tsx            # NEW: Calendar grid + month nav + legend
│   ├── StatCards.tsx               # NEW: 3 stat cards row
│   ├── RecentEntries.tsx           # NEW: Recent journal entries list
│   ├── MoodTrend.tsx               # NEW: Bar chart + mood summary
│   └── MoodCalendar.tsx            # REWRITTEN: Orchestrator (~260 lines)
```

---

## 6. What's Working

| Feature | Status | Notes |
|---------|--------|-------|
| Month navigation (prev/next) | ✅ | Triggers TanStack Query refetch |
| "Today" button | ✅ | Resets to current month |
| Calendar grid with mood colors | ✅ | Day cells glow with emotion color |
| Today highlighting | ✅ | Accent gradient + border + shadow |
| Mood legend | ✅ | 6 items below calendar grid |
| Stat cards (dynamic) | ✅ | Entries, streak, positive % from API |
| Recent entries (dynamic) | ✅ | Last 3 from API, with lock + preview |
| Mood trend bar chart | ✅ | Per-day bars colored by dominant mood |
| Entry overlay modal | ✅ | Spring animation + drag to dismiss |
| Mood override picker | ✅ | 5-column grid, PATCH to API |
| Generate AI Report CTA | ✅ | Navigates to `/report` |
| Empty state | ✅ | "Start journaling" prompt |
| Loading skeleton | ✅ | Shimmer animation placeholders |
| Build passes | ✅ | `npm run build` clean |
| Tests pass | ✅ | 107/107 tests passing |

---

## 7. Key Learnings

### Component Extraction Strategy

**When to extract:**
- When a section has its own data dependencies → separate hook
- When a section is visually distinct and reusable → separate component
- When a section exceeds ~100 lines → candidate for extraction

**Extraction order:**
1. Hook first (data logic) — test it independently
2. Leaf components (no children) — `StatCards`, `RecentEntries`
3. Complex components — `CalendarGrid`, `MoodTrend`
4. Orchestrator last — compose everything

### TanStack Query vs Raw Fetch

| Concern | Raw Fetch | TanStack Query |
|---------|-----------|----------------|
| Caching | Manual `useState` + cleanup flag | Automatic, keyed by queryKey |
| Loading state | Manual `setLoading(true/false)` | `isLoading` for free |
| Refetching | Manual `useEffect` dependency | Automatic on key change |
| Error handling | Manual try/catch + state | `error` object for free |
| Stale data | `cancelled` flag pattern | `staleTime` config |

**Verdict:** TanStack Query is strictly better for any server-state fetching. The old `useEffect` + `cancelled` flag pattern is an anti-pattern.

### Memoization with `useMemo`

```typescript
const stats = useMemo<CalendarStats>(() => {
  // expensive computation
}, [entries]);
```

**Why memoize:** The stats computation (streak, mood distribution, positive %) runs on every render. With `useMemo`, it only recomputes when `entries` changes. This matters because `MoodCalendar` re-renders on modal open/close, mood picker state changes, etc.

### Pencil Design → Code Translation

1. **Read the design** — `get_screenshot` for visual, `batch_get` for structure
2. **Map nodes to components** — each visual section = one component
3. **Extract design tokens** — `get_variables` → CSS custom properties
4. **Build incrementally** — hook → leaf components → orchestrator
5. **Verify visually** — `npm run dev` + browser check

---

## 8. Anti-Patterns to Avoid

### Don't Mix Data Fetching in Presentational Components
```tsx
// BAD: CalendarGrid fetches its own data
function CalendarGrid() {
  const [entries, setEntries] = useState([]);
  useEffect(() => { /* fetch */ }, []);
  // ...
}

// GOOD: Receive data as props
function CalendarGrid({ entries, year, month, ... }: CalendarGridProps) {
  // Pure presentation
}
```

### Don't Hardcode Stats
```tsx
// BAD: Streak is always 3
<p>3</p>

// GOOD: Streak comes from data
<p>{stats.streak}</p>
```

### Don't Forget Cleanup in useEffect
```typescript
// BAD: State update after unmount
useEffect(() => {
  fetch(url).then(data => setState(data));
}, []);

// GOOD: Cleanup flag
useEffect(() => {
  let cancelled = false;
  fetch(url).then(data => {
    if (!cancelled) setState(data);
  });
  return () => { cancelled = true; };
}, []);
```

Or better: use TanStack Query which handles this automatically.

### Don't Create New Objects in Render
```tsx
// BAD: New array every render
const sorted = [...entries].sort(...);

// GOOD: Memoize
const sorted = useMemo(() => [...entries].sort(...), [entries]);
```

---

## 9. Commands Reference

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run test                   # Run test suite
npm run lint                   # ESLint check

# Verify refactoring
npm run build 2>&1 | tail -20  # Check for TypeScript/build errors
npm run test                   # Ensure 107 tests still pass
```

---

## 10. Next Steps

| Feature | Priority | Notes |
|---------|----------|-------|
| Mood trend bar chart with real heights | Medium | Currently uses `Math.random()` for bar heights — should use actual entry count per day |
| Calendar day cell click → show all entries for that day | Low | Currently shows latest entry only |
| Month selector dropdown | Low | Design shows caret-down icon for month picker |
| Skeleton loading for stat cards | Low | Cards show blank while loading |
| Framer Motion entrance animations | Low | Components appear without stagger animation |

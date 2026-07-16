# Mood Calendar System

## Overview

The MoodCalendar component (`src/components/MoodCalendar.tsx`) renders an interactive monthly calendar where each day shows the emoji from the user's latest journal entry. Tapping a day opens a bottom sheet with entry details and a mood override picker.

## Calendar Grid Calculation

### Days in Month

```typescript
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
```

Trick: day 0 of the next month gives the last day of the current month.

### First Day Offset (Monday = 0)

```typescript
function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0, Sunday = 6
}
```

Converts JavaScript's Sunday-first `getDay()` to Monday-first for the grid.

### Grid Rendering

```tsx
{/* Empty cells before first day */}
{Array.from({ length: firstDay }).map((_, i) => (
  <div key={`empty-${i}`} className="aspect-square" />
))}

{/* Day cells */}
{Array.from({ length: daysInMonth }).map((_, i) => {
  const day = i + 1;
  const dayEntries = getEntriesForDay(entries, day);
  const latestEntry = dayEntries.length > 0 ? dayEntries[dayEntries.length - 1] : null;
  // render emoji or empty circle
})}
```

- `aspect-square` keeps cells proportional
- Empty cells before day 1 align the grid
- Latest entry wins (most recent emoji shown)

## Bottom Sheet Pattern

The overlay uses different alignment for mobile vs desktop:

```tsx
<motion.div
  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50
    flex items-end sm:items-center justify-center"
>
```

- **Mobile (`items-end`):** sheet slides up from bottom
- **Desktop (`sm:items-center`):** centered modal

### Spring Animation

```tsx
transition={{ type: "spring", damping: 30, stiffness: 300 }}
```

Spring physics give the sheet a natural bounce when opened.

### Drag to Dismiss

```tsx
drag="y"
dragConstraints={{ top: 0 }}  // can only drag down
dragElastic={0.2}              // rubber band at top
onDragEnd={(_, info) => {
  if (info.offset.y > 100 || info.velocity.y > 500) {
    setSelectedEntries(null);  // dismiss
  }
}}
```

Two dismiss conditions: dragged down 100px+ OR flicked down at 500+ velocity. The `dragConstraints: { top: 0 }` prevents dragging upward.

## Entry Overlay

Inside the sheet, entries are rendered as `EntryCard` components in a scrollable container:

```tsx
<div className="flex-1 overflow-y-auto space-y-4 -mx-2 px-2">
  {selectedEntries.map((entry) => (
    <EntryCard key={entry.id} entry={entry} onEditMood={...} />
  ))}
</div>
```

The `-mx-2 px-2` trick creates edge-to-edge scrolling while maintaining inner padding.

## Mood Override

Users can change an entry's mood via a PATCH API call:

```typescript
async function handleMoodUpdate(entryId, newMood, newEmoji) {
  await fetch(`/api/entries/${entryId}`, {
    method: "PATCH",
    body: JSON.stringify({ primary_emotion: newMood, emoji: newEmoji }),
  });
  // show success message for 1.5s, then close picker
  setMoodUpdateSuccess(true);
  setTimeout(() => {
    setShowMoodPicker(false);
    setEditingEntry(null);
    setCurrentDate(new Date(currentDate));  // trigger re-render
  }, 1500);
}
```

The mood picker is a 5-column grid of predefined moods (`MOOD_OPTIONS`), each with a name and emoji.

### Server-Side Validation

The PATCH route validates against `MOOD_THEMES`:

```typescript
if (primary_emotion && !(primary_emotion in MOOD_THEMES)) {
  return NextResponse.json({ error: "Invalid primary_emotion" }, { status: 400 });
}
```

## Soft Delete

Entries are soft-deleted (not hard-deleted) to support undo:

```typescript
// DELETE handler in src/app/api/entries/[id]/route.ts
await supabase
  .from("journal_entries")
  .update({ deleted_at: new Date().toISOString() })
  .eq("id", id)
  .eq("user_id", user.id)
  .is("deleted_at", null);  // prevent double-delete
```

All queries filter `.is("deleted_at", null)` to exclude deleted entries.

## Data Fetching

The calendar fetches all entries for the displayed month:

```typescript
useEffect(() => {
  async function load() {
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    const res = await fetch(`/api/entries?month=${monthStr}`);
    const data = await res.json();
    if (!cancelled && data.entries) {
      setEntries(data.entries);
    }
  }
  load();
  return () => { cancelled = true; };
}, [year, month]);
```

Uses a cleanup flag to prevent state updates on unmounted components.

## Key Decisions

- **Monday-first calendar** — matches international standard
- **Latest entry per day** — shows the most recent emoji, not all entries
- **Bottom sheet on mobile** — follows iOS/Android gesture patterns
- **Soft delete** — enables undo and preserves data integrity
- **UTC boundaries** — client computes local-day boundaries as UTC timestamps

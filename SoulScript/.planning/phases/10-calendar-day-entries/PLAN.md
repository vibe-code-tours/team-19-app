# Phase 10: Calendar Day Entries

## Objective
When a user clicks a day on the calendar, show ALL journal entries for that day in a scrollable list — not just the first one. The calendar grid still shows the latest emoji per day.

## Context

### Current Behavior
- `getEntryForDay(day)` uses `entries.find()` — returns only the FIRST entry
- Clicking opens a bottom sheet with that single entry
- API already returns ALL entries for the month (decrypted, ordered by `created_at`)

### Target Behavior
- Calendar grid shows the LAST entry's emoji (latest emotion of the day)
- Clicking opens a scrollable list of ALL entries (up to 10 per day)
- Each entry has its own emoji, timestamp, content, emotion pills, and Edit Mood button

## Implementation Tasks

### Task 1: Update Entry Lookup Function
**File:** `src/components/MoodCalendar.tsx`

Replace `getEntryForDay` with `getEntriesForDay`:
```typescript
function getEntriesForDay(day: number): JournalEntry[] {
  return entries.filter((e) => {
    const d = new Date(e.created_at);
    return d.getDate() === day;
  });
}
```

### Task 2: Update Calendar Grid
**File:** `src/components/MoodCalendar.tsx`

- Use `getEntriesForDay(day)` instead of `getEntryForDay(day)`
- Show the LAST entry's emoji (latest emotion)
- Update click handler to pass the full array

```typescript
const dayEntries = getEntriesForDay(day);
const latestEntry = dayEntries.length > 0 ? dayEntries[dayEntries.length - 1] : null;

return (
  <button
    key={day}
    onClick={() => dayEntries.length > 0 && setSelectedEntries(dayEntries)}
    className="aspect-square flex items-center justify-center relative"
  >
    {latestEntry ? (
      <motion.div
        layoutId={`entry-${latestEntry.id}`}
        className="w-full h-full rounded-full glass flex items-center justify-center"
      >
        <span className="text-lg">{latestEntry.emoji}</span>
      </motion.div>
    ) : (
      <div className="w-8 h-8 rounded-full border border-dashed border-glass-border" />
    )}
  </button>
);
```

### Task 3: Update State Type
**File:** `src/components/MoodCalendar.tsx`

Change state from single entry to array:
```typescript
// Before
const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

// After
const [selectedEntries, setSelectedEntries] = useState<JournalEntry[] | null>(null);
const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
```

### Task 4: Redesign Bottom Sheet
**File:** `src/components/MoodCalendar.tsx`

Replace the single-entry overlay with a scrollable list:

```tsx
<AnimatePresence>
  {selectedEntries && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={() => {
        setSelectedEntries(null);
        setEditingEntry(null);
        setShowMoodPicker(false);
      }}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 || info.velocity.y > 500) {
            setSelectedEntries(null);
            setEditingEntry(null);
            setShowMoodPicker(false);
          }
        }}
        className="glass rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-text-primary">
            {new Date(selectedEntries[0].created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h3>
          <p className="text-sm text-text-secondary">
            {selectedEntries.length} {selectedEntries.length === 1 ? "entry" : "entries"}
          </p>
        </div>

        <div className="h-px bg-glass-border mb-4" />

        {/* Scrollable Entry List */}
        <div className="flex-1 overflow-y-auto space-y-4 -mx-2 px-2">
          {selectedEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEditMood={() => setEditingEntry(entry)}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

### Task 5: Extract EntryCard Component
**File:** `src/components/MoodCalendar.tsx`

Create a reusable `EntryCard` component for each entry in the list:

```tsx
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
            <p className="text-sm font-medium text-text-primary">
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
        <button
          onClick={onEditMood}
          className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-full text-xs text-text-secondary hover:text-text-primary"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit
        </button>
      </div>

      {/* Entry Content */}
      <p className="text-[14px] text-text-primary leading-relaxed">
        {entry.content}
      </p>

      {/* Emotion Pills */}
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
    </div>
  );
}
```

### Task 6: Update Mood Picker to Work with editingEntry
**File:** `src/components/MoodCalendar.tsx`

The mood picker should now target `editingEntry` instead of `selectedEntry`:

```tsx
{/* Mood Picker — slides in below the entry being edited */}
<AnimatePresence>
  {showMoodPicker && editingEntry && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden"
    >
      {moodUpdateSuccess ? (
        <p className="text-center text-sm text-green-400 py-3">Mood updated ✓</p>
      ) : (
        <div className="grid grid-cols-5 gap-2 pt-2">
          {MOOD_OPTIONS.map((mood) => (
            <button
              key={mood.name}
              onClick={() => handleMoodUpdate(editingEntry.id, mood.name, mood.emoji)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <span className="text-xl">{mood.emoji}</span>
              <span className="text-[10px] text-text-secondary capitalize">{mood.name}</span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )}
</AnimatePresence>
```

### Task 7: Update handleMoodUpdate
**File:** `src/components/MoodCalendar.tsx`

After mood update, refresh the entries list and clear editing state:

```typescript
async function handleMoodUpdate(entryId: string, newMood: string, newEmoji: string) {
  await fetch(`/api/entries/${entryId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ primary_emotion: newMood, emoji: newEmoji }),
  });

  setMoodUpdateSuccess(true);
  setTimeout(() => {
    setMoodUpdateSuccess(false);
    setShowMoodPicker(false);
    setEditingEntry(null);
    // Refresh entries to show updated emoji on calendar
    setCurrentDate(new Date(currentDate));
  }, 1500);
}
```

## Files Modified
- `src/components/MoodCalendar.tsx` — all changes in this file

## Verification
1. `npm run build` — no errors
2. `npm run test` — all tests pass
3. Manual test: create multiple entries for one day, verify calendar shows latest emoji, clicking shows all entries scrollable

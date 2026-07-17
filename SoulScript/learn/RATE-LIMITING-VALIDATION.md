# Rate Limiting & Input Validation

## Overview

SoulScript uses a dual-layer validation approach: client-side validation for UX feedback and server-side validation for security enforcement. Rate limiting prevents abuse of the AI API.

## Client-Side Validation (`src/app/page.tsx`)

### Constants

```typescript
const MIN_LENGTH = 10;
const MAX_LENGTH = 5000;
const WARN_LENGTH = 4500;
```

### Character Counter

```tsx
const charCount = content.length;
const isOverWarn = charCount >= WARN_LENGTH;
const isOverMax = charCount >= MAX_LENGTH;

<span className={`text-xs ${
  isOverMax ? "text-red-400" : isOverWarn ? "text-amber-400" : "text-text-muted"
}`}>
  {charCount} / {MAX_LENGTH}
</span>
```

- **< 4500:** neutral gray
- **4500-4999:** amber warning
- **≥ 5000:** red (hard stop)

### Input Prevention

```tsx
onChange={(e) => {
  if (e.target.value.length <= MAX_LENGTH) {
    setContent(e.target.value);
  }
}}
```

Prevents typing beyond 5000 characters at the input level.

### Submit Guard

```typescript
const canSubmit = charCount >= MIN_LENGTH && !createEntry.isPending;
```

Button is disabled when content is too short or a submission is in progress.

## Server-Side Validation (`src/app/api/analyze/route.ts`)

### Type Check

```typescript
if (!content || typeof content !== "string") {
  return NextResponse.json({ error: "Content is required" }, { status: 400 });
}
```

### Minimum Length

```typescript
if (content.trim().length < MIN_LENGTH) {
  return NextResponse.json(
    { error: `Entry must be at least ${MIN_LENGTH} characters` },
    { status: 400 }
  );
}
```

### Content Truncation

```typescript
const truncatedContent = content.slice(0, MAX_LENGTH);
```

Silently truncates to 5000 chars before sending to AI (belt-and-suspenders with client-side check).

### Rate Limiting

```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);

const { count } = await supabase
  .from("journal_entries")
  .select("*", { count: "exact", head: true })
  .eq("user_id", user.id)
  .gte("created_at", today.toISOString())
  .is("deleted_at", null);

if (count && count >= DAILY_LIMIT) {
  return NextResponse.json(
    { error: "You've reached your daily limit of 10 entries. Come back tomorrow!" },
    { status: 429 }
  );
}
```

- **10 entries per day** per user
- Counted via Supabase `count: "exact"` with `head: true` (no data transfer)
- Filters by user ID and today's date range
- Excludes soft-deleted entries
- Returns 429 Too Many Requests

## Mood Override Validation (`src/app/api/entries/[id]/route.ts`)

### Emotion Allowlist

```typescript
if (primary_emotion && !(primary_emotion in MOOD_THEMES)) {
  return NextResponse.json({ error: "Invalid primary_emotion" }, { status: 400 });
}
```

Only allows emotions from the predefined `MOOD_THEMES` object.

### Emoji Validation

```typescript
if (emoji && typeof emoji === "string" && [...emoji].length !== 1) {
  return NextResponse.json({ error: "Emoji must be a single character" }, { status: 400 });
}
```

Uses spread operator `[...emoji]` to handle multi-byte emoji correctly.

### Ownership Check

```typescript
.eq("user_id", user.id)
.is("deleted_at", null)
```

Ensures the entry belongs to the authenticated user and hasn't been deleted.

## Report Validation (`src/app/api/report/route.ts`)

### Month Format

```typescript
if (!month || !/^\d{4}-\d{2}$/.test(month)) {
  return NextResponse.json(
    { error: "Invalid month format. Use YYYY-MM" },
    { status: 400 }
  );
}
```

### Entry Count

```typescript
if (!entries || entries.length < 10) {
  return NextResponse.json({
    error: "Keep journaling! You need at least 10 entries to unlock your monthly journey.",
    count: entries?.length || 0,
  }, { status: 400 });
}
```

## Why Dual Validation?

| Concern | Client | Server |
|---------|--------|--------|
| UX feedback | ✅ instant | ❌ network delay |
| Security | ❌ can be bypassed | ✅ enforced |
| Rate limiting | ❌ not reliable | ✅ authoritative |
| Type checking | ⚠️ TypeScript only | ✅ runtime |

Client validation improves UX (instant feedback, no network round-trip). Server validation is the source of truth (can't be bypassed with DevTools).

## Key Decisions

- **10 entries/day** — reasonable limit for journaling without feeling restrictive
- **4500 warning** — gives users a heads-up before hitting the hard limit
- **`count: "exact"` with `head: true`** — efficient count query without transferring rows
- **Soft-deleted entries excluded** — rate limit only counts active entries
- **429 status code** — standard HTTP status for rate limiting
- **Truncation over rejection** — silently truncate rather than error on long content

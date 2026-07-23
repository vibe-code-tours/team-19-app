# Rate Limiting & Input Validation

## Overview

SoulScript uses a dual-layer validation approach: client-side validation for UX feedback and server-side validation for security enforcement. Rate limiting uses an in-memory counter to prevent abuse of the AI API and sensitive operations.

## Architecture

### Rate Limiting Strategy

Rate limiting is handled by `src/lib/rate-limit.ts` using an in-memory `Map<string, { count, resetAt }>`. Each endpoint registers its own limit configuration:

| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| `analyze:post` | 10 | day | journal entries |
| `report:post` | 3 | day | monthly report generation (AI call) |
| `profile:patch` | 10 | hour | profile updates |
| `account:delete` | 1 | hour | account deletion |

### Why In-Memory Over Supabase

The original implementation counted rows in Supabase tables (`journal_entries`, `monthly_reports`, `user_profiles`). This had a critical flaw:

- **`user_profiles` has exactly 1 row per user** — counting rows there always returns 0 or 1, so the limit could never be reached
- **Race condition** — `SELECT count` and the actual `INSERT`/`UPDATE`/`DELETE` were separate queries, so concurrent requests could all pass the check

The in-memory `Map` approach:
- **No database round-trip** — fast and independent of DB latency
- **No race condition** — each request atomically checks+increments in the same tick
- **No schema migration or data loss**
- **Resets on server restart** — acceptable for a personal journaling app

> To swap to a production-grade persistent store (Upstash Redis, etc.), only `src/lib/rate-limit.ts` needs to change — the route handlers remain untouched.

## Implementation (`src/lib/rate-limit.ts`)

```typescript
type WindowUnit = "minute" | "hour" | "day";

interface RateLimitConfig {
  max: number;           // Max requests in the window
  window: WindowUnit;    // Time window unit
  endpoint: string;      // Unique endpoint key
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: Date;
}
```

### Core Algorithm

```typescript
const counters = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, config: RateLimitConfig): RateLimitResult {
  const key = `${userId}:${endpoint}`;
  const now = Date.now();
  const entry = counters.get(key);

  // No prior request or window expired — start fresh
  if (!entry || now > entry.resetAt) {
    counters.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: max - 1, ... };
  }

  // Window still active — check
  if (entry.count >= max) {
    return { allowed: false, remaining: 0, ... };
  }

  // Under limit — increment
  entry.count++;
  return { allowed: true, remaining: max - entry.count, ... };
}
```

The `counters` Map is module-scoped — it lives for the lifetime of the Node.js process. On hot-reload (Next.js dev), it resets, which is acceptable since dev limits are per-session.

### Edge Cases Handled

- **Fresh user / window expired**: `entry` is `undefined` or `resetAt` in the past → start a fresh window with `count: 1`
- **At limit**: `entry.count >= max` → return `allowed: false` with remaining `0` and the window's reset time
- **Under limit**: increment and return remaining count

### Test Isolation

```typescript
export function resetRateLimits(): void {
  counters.clear();
}
```

Every test suite calls `resetRateLimits()` in `beforeEach` to prevent cross-test pollution.

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

## Manual Testing (via Browser)

You can test rate limiting directly from the browser — no terminal or shell script needed.

### Analyze Endpoint (10/day)

1. Open the app and log in.
2. Open DevTools (`F12` / `Cmd+Option+I`) → Console tab.
3. Paste this snippet and press Enter. It will submit 11 journal entries in a loop. The 11th should be blocked:

   ```javascript
   (async () => {
     for (let i = 1; i <= 11; i++) {
       const res = await fetch("/api/analyze", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ content: `Rate limit test entry number ${i}. This is a test entry to verify the rate limiting works correctly.` }),
       });
       console.log(`#${i} → ${res.status}${res.status === 429 ? " ⛔ RATE LIMITED" : ""}`);
     }
   })();
   ```

   Expected: `#1 → 200` through `#10 → 200`, then `#11 → 429 ⛔ RATE LIMITED`.

### Profile Endpoint (10/hour)

1. Open DevTools Console on the app.
2. Run this snippet to attempt 11 profile updates:

   ```javascript
   (async () => {
     for (let i = 1; i <= 11; i++) {
       const res = await fetch("/api/profile", {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ display_name: `Test User ${i}` }),
       });
       console.log(`#${i} → ${res.status}${res.status === 429 ? " ⛔ RATE LIMITED" : ""}`);
     }
   })();
   ```

   Expected: `#1 → 200` through `#10 → 200`, then `#11 → 429 ⛔ RATE LIMITED`.

### Report Endpoint (3/day)

1. Open DevTools Console on the app.
2. Run this snippet to attempt 4 report generations:

   ```javascript
   (async () => {
     for (let i = 1; i <= 4; i++) {
       const res = await fetch("/api/report", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ month: "2026-07" }),
       });
       const data = await res.json();
       console.log(`#${i} → ${res.status}${res.status === 429 ? " ⛔ RATE LIMITED" : ""}`, data);
     }
   })();
   ```

   Expected: First few return `200` or `400` (if fewer than 10 entries exist for the month), but the 4th should be `429 ⛔ RATE LIMITED`.

### Account Endpoint (1/hour)

⚠️ **This permanently deletes your account and all data.** Only run if you're sure.

1. Open DevTools Console.
2. Run the first request:
   ```javascript
   await fetch("/api/account", { method: "DELETE" }).then(r => r.status);
   ```
   Expected: `200`.
3. Run the second request immediately after:
   ```javascript
   await fetch("/api/account", { method: "DELETE" }).then(r => r.status);
   ```
   Expected: `429` (rate limited).

### How to Reset Counters

Since the rate limiter lives in memory, **restart the dev server** to clear all counters:
1. Stop the server (`Ctrl+C` in the terminal).
2. Start it again (`npm run dev`).
3. Log in again and re-run the test snippets.

## Why Dual Validation?

| Concern | Client | Server |
|---------|--------|--------|
| UX feedback | ✅ instant | ❌ network delay |
| Security | ❌ can be bypassed | ✅ enforced |
| Rate limiting | ❌ not reliable | ✅ authoritative |
| Type checking | ⚠️ TypeScript only | ✅ runtime |

Client validation improves UX (instant feedback, no network round-trip). Server validation is the source of truth (can't be bypassed with DevTools).

## Key Decisions

- **In-memory over database** — simpler, faster, no race conditions, no migration needed
- **10 entries/day** — reasonable limit for journaling without feeling restrictive
- **4500 warning** — gives users a heads-up before hitting the hard limit
- **429 status code** — standard HTTP status for rate limiting
- **Truncation over rejection** — silently truncate rather than error on long content

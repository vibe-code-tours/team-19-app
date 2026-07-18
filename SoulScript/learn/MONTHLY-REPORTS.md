# Monthly Report Generation

## Overview

Monthly reports are AI-generated summaries of a user's journaling month. They follow a 3-stage layout: Big Picture → Pattern Recognition → Actionable Frameworks. Reports are cached via upsert to avoid regeneration.

## API Route (`src/app/api/report/route.ts`)

### Minimum Entry Threshold

```typescript
if (!entries || entries.length < 10) {
  return NextResponse.json({
    error: "Keep journaling! You need at least 10 entries to unlock your monthly journey.",
    count: entries?.length || 0,
  }, { status: 400 });
}
```

Requires at least 10 entries before generating a report. This ensures the AI has enough data for meaningful pattern recognition.

### Decryption Before Analysis

Entries are stored encrypted. The report route decrypts them before sending to the AI:

```typescript
const decryptedEntries = entries.map((e) => ({
  ...e,
  content: decrypt(e.content, e.content_iv),
}));
```

### Upsert Caching

Reports use a unique constraint on `(user_id, month_year)`:

```typescript
await supabase.from("monthly_reports").upsert({
  user_id: user.id,
  month_year: month,
  summary_overview: report.summary_overview,
  dominant_mood: report.dominant_mood,
  pattern_insights: report.pattern_insights,
  actionable_recommendations: report.actionable_recommendations.map(r => JSON.stringify(r)),
}, { onConflict: "user_id,month_year" });
```

The upsert means:
- First generation: inserts new report
- Subsequent requests: updates existing report
- No duplicate reports per user per month

Recommendations are serialized as JSON strings because the DB column is `text[]`.

## AI Prompt Design

The prompt requests four fields:

1. **`summary_overview`** — 2-3 sentence month overview
2. **`dominant_mood`** — most frequent emotion (1 word)
3. **`pattern_insights`** — 2-3 sentences about emotional patterns (NOT an array)
4. **`actionable_recommendations`** — array of `{ title, description }` objects

The prompt explicitly says "do NOT use an array" for insights because the AI sometimes returns arrays despite instructions.

## 3-Stage Layout (`src/components/MonthlyReport.tsx`)

### Stage 1: The Big Picture

Shows the dominant mood emoji, mood name, and a stat ("you felt X on N of D days").

### Stage 2: Pattern Recognition

Insights are split from a single string into individual sentences:

```typescript
function splitInsights(text: string): string[] {
  // Handle JSON array format (AI sometimes returns this)
  if (text.trimStart().startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.slice(0, 3);
    } catch { /* fall through */ }
  }
  // Split by sentence boundaries
  return text.split(/(?<[.!?])\s+|\n/).map(s => s.trim()).filter(s => s.length > 0).slice(0, 3);
}
```

### Stage 3: Actionable Frameworks

Recommendations are parsed from JSON strings:

```typescript
function parseRecommendations(items: string[]): Recommendation[] {
  return items.map((item) => {
    if (item.trimStart().startsWith("{")) {
      try {
        const parsed = JSON.parse(item);
        if (parsed.title && parsed.description) return parsed;
      } catch { /* fall through */ }
    }
    return { title: item, description: "" };  // legacy format
  });
}
```

Handles both the new `{ title, description }` format and legacy plain-string format.

## Staggered Animations

Each stage animates in sequence using Framer Motion variants:

```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
```

Applied via:

```tsx
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  <motion.div variants={itemVariants}>...</motion.div>  {/* Stage 1 */}
  <motion.div variants={itemVariants}>...</motion.div>  {/* Stage 2 */}
  <motion.div variants={itemVariants}>...</motion.div>  {/* Stage 3 */}
</motion.div>
```

Children inherit the stagger timing from the parent.

## Report Trigger

The calendar shows a "Reveal This Month's Journey" button when entries exist but no report has been generated:

```tsx
{entries.length > 0 && !report && !reportLoading && !reportError && (
  <button onClick={handleGenerateReport}>
    <span className="text-2xl">✨</span>
    <h3>Reveal This Month's Journey</h3>
    <p>{entries.length} of {daysInMonth} days journaled — tap to generate insights</p>
  </button>
)}
```

Loading state shows skeleton placeholders; error state shows a retry button.

## Key Decisions

- **10-entry minimum** — ensures AI has enough data for meaningful analysis
- **Upsert caching** — prevents expensive re-generation; one report per user per month
- **Defensive parsing** — handles both array and sentence-string formats from AI
- **Serialized recommendations** — stored as `text[]` with JSON-stringified objects
- **No streaming** — reports are generated in one shot; loading skeleton covers the wait

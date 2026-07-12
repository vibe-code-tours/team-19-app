# Monthly Report Screen Redesign — GSD Planning

> **Status: ✅ COMPLETE — All Phases Done**
> Created: 2026-07-12
> Last Updated: 2026-07-12
> Created: 2026-07-12

## 1. Problem Statement

The Monthly Report screen is **text-heavy and visually uniform** — every section looks the same. Users cannot quickly:
- Understand the full emotional picture (only dominant mood shown, no distribution)
- Prioritize which insights matter most (all 3 pattern cards look identical)
- Take action on recommendations (cards are static, no clear CTAs)
- See their overall activity level (no entry count, streak, or comparison)

## 2. Job-to-be-Done (JTBD)

> "When I open my monthly report, I want to **quickly understand my emotional patterns this month and get actionable advice** — so I can improve my wellbeing and feel motivated to keep journaling."

## 3. Emil Kowalski Design Principles Applied

| Principle | Application |
|---|---|
| **Visual hierarchy** | The dominant mood should dominate. Secondary insights should be visually subordinate. |
| **Scannable at a glance** | Mood distribution chart lets users see the full picture in 2 seconds. |
| **Progressive disclosure** | Big Picture → Mood Distribution → Insights → Recommendations (ordered by importance). |
| **Minimalist, intentional** | Remove the bottom spacer. Each card earns its place. |
| **Touch-friendly** | Recommendation cards should have clear CTAs (e.g., "Start now" button). |
| **Data visualization** | Replace text-only mood count with a visual chart (donut or bar). |
| **Meaningful micro-details** | Month-over-month comparison, entry count, streak info. |

## 4. Current State Audit

### What Exists
- Report header with back arrow + title (✓ works)
- Big Picture card with radial gradient, emoji, mood name, count (⚠️ only shows dominant mood)
- Pattern Recognition section with 3 insight cards (⚠️ all identical, no hierarchy)
- Actionable Frameworks section with 3 rec cards (⚠️ no CTAs, static)
- Bottom spacer (⚠️ wastes space)

### What's Broken
- **No mood distribution** — only dominant mood shown, no full picture
- **No visual hierarchy** — all 3 insight cards look the same
- **No action CTAs** — recommendation cards are passive text
- **No activity stats** — no entry count, streak, or comparison
- **No share option** — users can't share their insights
- **Bottom spacer wastes space** — should use padding per mobile app guide
- **Section labels are tiny** — 11px, easy to miss

## 5. Redesign Plan — Phased Execution

### Phase 1: Visual Hierarchy (Must Have) ✅ COMPLETE
**Goal:** Make the report scannable and the dominant mood pop.

| Task | Details | Impact | Status |
|---|---|---|---|
| Enhance Big Picture card | Add entry count ("12 entries · 3,847 words"), month-over-month trend arrow (↑ 15% more calm), and larger emoji. | 🔴 Critical | ✅ Done |
| Add mood distribution chart | Replace text-only count with a horizontal bar chart or donut showing all 5 moods with percentages. | 🔴 Critical | ✅ Done |
| Differentiate insight cards | Number them (01, 02, 03), add mood tag (e.g., "Anxiety", "Calm", "Gratitude"), use different accent colors per insight. | 🟡 Quality | ✅ Done |
| Remove bottom spacer | Replace with proper padding per mobile app guide. | 🟡 Quality | ✅ Done |

### Phase 2: Actionability (Should Have) ✅ COMPLETE
**Goal:** Make recommendations tappable and motivating.

| Task | Details | Impact | Status |
|---|---|---|---|
| Add CTAs to recommendation cards | "Start now" button or "Learn more" link on each card. | 🟡 Quality | ✅ Done |
| Add recommendation tags | Label each rec with the mood it addresses (e.g., "For Calm", "For Sleep"). | 🟡 Quality | ✅ Done |
| Add completion state | Show which recommendations the user has already tried (checkmark). | 🟢 Nice | ⏭️ Deferred |

### Phase 3: Context & Comparison (Should Have) ✅ COMPLETE
**Goal:** Give users a sense of progress over time.

| Task | Details | Impact | Status |
|---|---|---|---|
| Add month-over-month comparison | "VS JUNE" card with trend arrows: +15% Calm, -8% Anxiety, +22% Joy. | 🟡 Quality | ✅ Done |
| Add journaling stats | Stats card with Days (12), Words (3.8K), Best Streak (5) + motivational note. | 🟢 Nice | ✅ Done |
| Add share button | Share icon in header for sharing monthly summary. | 🟢 Nice | ✅ Done |

### Phase 4: Polish (Nice to Have) — ✅ COMPLETE
**Goal:** Elevate the experience.

| Task | Details | Impact | Status |
|---|---|---|---|
| Mood timeline | Small horizontal timeline showing mood changes throughout the month. | 🟢 Nice | ✅ Done |
| Personalized greeting | "Great month, Alex! You found more calm than ever." at top of Big Picture card. | 🟢 Nice | ✅ Done |
| Animated mood transitions | Smooth transitions between mood states (not applicable to static design). | 🟢 Nice | ⏭️ Deferred |

### 📋 Handoff Notes for Phase 4

**Screen:** Monthly Report (`v5hRQ5`)
**Content wrapper:** Report Content (`qTE5E`)
**Current children (in order):**
1. Report Header (`ENDRb`) — back arrow, title, share icon
2. Big Picture (`B8M6Se`) — emoji, mood name, entry count, trend pill
3. Pattern Recognition (`M7XcC`) — 3 numbered insight cards with mood tags
4. Actionable Frameworks (`lrswc`) — 3 rec cards with CTAs and mood tags
5. Mood Distribution Card (`tYyT6`) — horizontal bar + chips
6. Month Comparison (`FNJjw`) — VS JUNE with trend arrows
7. Journaling Stats (`tlTcT`) — Days, Words, Best Streak + note

**Phase 4 tasks:**
- **Mood timeline:** Insert after Big Picture, before Pattern Recognition. Horizontal row of 31 small dots, colored by mood, showing the month's emotional journey at a glance.
- **Personalized greeting:** Insert at the top of Big Picture card. "Great month, Alex! You found more calm than ever." (14px, $text-secondary)

**Design tokens available:**
- `$mood-dot-joy` (#F59E0B), `$mood-dot-calm` (#0EA5E9), `$mood-dot-love` (#EC4899), `$mood-dot-sadness` (#3B82F6), `$mood-dot-anger` (#EF4444)
- `$accent-primary` (#818CF8), `$accent-glow-soft` (#818CF820)
- `$glass` (#FFFFFF0D), `$glass-border` (#FFFFFF1A), `$glass-strong` (#FFFFFF14)
- `$text-primary` (#F5F5F5), `$text-secondary` (#94A3B8), `$text-muted` (#64748B)

**To continue:** Read `.planning/monthly-report-redesign.md`, then implement Phase 4 tasks on screen `v5hRQ5`.

> **Phase 4 completed on 2026-07-12.** All redesign phases are now complete.

## 6. Screen Structure (New)

```
Monthly Report (390×fit_content, vertical, clip)
├── Status Bar (62px)
├── Report Content (vertical, padding [0,20], gap 20)
│   ├── Report Header (horizontal, space_between)
│   │   ├── ← Back arrow
│   │   ├── "July Mind Journey" (Playfair Display, 20px, bold)
│   │   └── [Share icon]
│   ├── Big Picture Card (glass, vertical, gap 12, padding 24)
│   │   ├── "THE BIG PICTURE" (11px, accent, bold)
│   │   ├── 😌 (64px emoji)
│   │   ├── "Calm" (28px, Playfair, bold)
│   │   ├── "12 of 31 days · 3,847 words" (13px, muted)
│   │   └── "↑ 15% more calm than June" (12px, accent, pill)
│   ├── Mood Distribution (glass card, vertical, gap 12)
│   │   ├── "MOOD DISTRIBUTION" (11px, accent, bold)
│   │   ├── Horizontal bar chart (segmented by mood color)
│   │   └── Mood chips row: [Joy 43%] [Calm 14%] [Love 14%] ...
│   ├── Pattern Recognition (vertical, gap 12)
│   │   ├── "PATTERN RECOGNITION" (11px, accent, bold)
│   │   ├── Insight 01 (glass card, numbered, mood tag)
│   │   ├── Insight 02
│   │   └── Insight 03
│   ├── Actionable Frameworks (vertical, gap 12)
│   │   ├── "ACTIONABLE FRAMEWORKS" (11px, accent, bold)
│   │   ├── Rec Card 1 (icon + title + desc + "Start now" CTA)
│   │   ├── Rec Card 2
│   │   └── Rec Card 3
│   └── Month Comparison (glass card, horizontal, space_between)
│       ├── "vs June" (13px, muted)
│       └── Trend arrows: [+15% calm] [-8% anxiety]
```

## 7. Big Picture Card Design

### Current
```
┌─────────────────────────────┐
│      THE BIG PICTURE        │
│            😌               │
│          Calm               │
│  12 of 31 days              │
└─────────────────────────────┘
```

### New
```
┌─────────────────────────────┐
│      THE BIG PICTURE        │
│            😌               │
│          Calm               │
│  12 of 31 days · 3,847 words│
│  ┌───────────────────────┐  │
│  │ ↑ 15% more calm       │  │
│  │   than June           │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

## 8. Mood Distribution Design

### Horizontal Bar Chart
```
┌─────────────────────────────┐
│      MOOD DISTRIBUTION      │
│  ████████████░░░░░░░░░░░░░  │  ← Joy (43%), Calm (14%), etc.
│                             │
│  ● Joy 43%  ● Calm 14%     │
│  ● Love 14% ● Sad 14%      │
│  ● Angry 14%                │
└─────────────────────────────┘
```

## 9. Insight Card Design (Differentiated)

### Current (all identical)
```
┌─────────────────────────────┐
│ ▌ We noticed anxiety peaks  │
│ ▌ typically follow late-    │
│ ▌ night productivity...     │
└─────────────────────────────┘
```

### New (numbered + mood tag)
```
┌─────────────────────────────┐
│ 01 · Anxiety                │
│ ▌ We noticed anxiety peaks  │
│ ▌ typically follow late-    │
│ ▌ night productivity...     │
└─────────────────────────────┘
```

## 10. Recommendation Card Design (with CTA)

### Current (passive)
```
┌─────────────────────────────┐
│ 🌅 Morning Breathing        │
│ Start each day with 5 min   │
│ of intentional breath.      │
└─────────────────────────────┘
```

### New (actionable)
```
┌─────────────────────────────┐
│ 🌅 Morning Breathing        │
│ For: Calm                   │
│ Start each day with 5 min   │
│ of intentional breath.      │
│ ┌─────────────────────────┐ │
│ │     Start now →         │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

## 11. Execution Order

1. ✅ **Enhance Big Picture card** (entry count, trend, larger emoji)
2. ✅ **Add mood distribution chart** (horizontal bar + chips)
3. ✅ **Differentiate insight cards** (numbering, mood tags, colors)
4. ✅ **Remove bottom spacer** (replace with padding)
5. ✅ **Add CTAs to recommendation cards** ("Start now" button)
6. ✅ **Add recommendation tags** (mood label)
7. ✅ **Add month-over-month comparison** (VS JUNE card with trend arrows)
8. ✅ **Add journaling stats** (Days, Words, Best Streak + note)
9. ✅ **Add share button** (header)
10. ✅ **Screenshot & verify** layout, contrast, alignment

## 12. Success Criteria

- [x] Big Picture card shows entry count and word count
- [x] Month-over-month trend is visible (trend pill + VS JUNE card)
- [x] Mood distribution chart shows all 5 moods with percentages
- [x] Insight cards are visually differentiated (numbered, tagged)
- [x] Recommendation cards have clear CTAs ("Start now →")
- [x] Recommendation cards show which mood they address ("For: Calm")
- [x] No wasted space (no bottom spacer)
- [x] All text meets contrast requirements on dark bg
- [x] Touch targets are ≥44px
- [x] Screen fits content without overflow

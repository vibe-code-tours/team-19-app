# Calendar Screen Redesign — GSD Planning

> **Status: ✅ ALL PHASES COMPLETE**
> Completed: 2026-07-12

## 1. Problem Statement

The current calendar screen in SoulScript fails its core job: **helping users scan their emotional patterns over time at a glance**. Users cannot quickly determine:
- What date a mood entry belongs to (no day numbers)
- Which day is today (no indicator)
- What mood they felt on a given day (emojis too small, no color coding)
- Their journaling consistency (no streak/progress visualization)
- The overall mood distribution for the month (no summary)

## 2. Job-to-be-Done (JTBD)

> "When I open the calendar, I want to **instantly see my emotional journey this month** — which days I journaled, what I felt, and how consistent I've been — so I can recognize patterns and feel motivated to keep going."

## 3. Emil Kowalski Design Principles Applied

| Principle | Application |
|---|---|
| **Minimalist, intentional** | Remove empty week row 6 (spacers). Each element earns its place. |
| **Scannable at a glance** | Mood-colored dots below day numbers — color = instant mood recognition. |
| **Touch-friendly (44pt+)** | Day cells remain 44×50px with generous tap targets. |
| **Progressive disclosure** | Calendar grid is primary. Mood summary and report are secondary, below fold. |
| **Subtle visual cues** | Today gets a soft accent ring, not a loud highlight. Mood dots are 5px — present but not screaming. |
| **Dark mode done right** | Use existing glass variables. High contrast text on dark bg. Muted tones for inactive elements. |
| **Meaningful micro-details** | Streak pill with 🔥 emoji. Progress text showing "X of 31 days". Mood distribution bar. |

## 4. Current State Audit

### What Exists
- Month header with chevron nav (✓ works)
- Weekday labels Mon-Sun (✓ works)
- Calendar grid with 6 week rows (⚠️ row 6 is all spacers)
- Journaled days show emoji icons in glass circles (⚠️ too small, no color coding)
- Empty days show faint ring outlines (⚠️ looks like placeholder, not intentional)
- "Reveal This Month's Journey" card at bottom (⚠️ generic, no data preview)
- Bottom spacer (⚠️ wastes space)

### What's Broken
- **No day numbers** — fundamental calendar UX failure
- **No today indicator** — users don't know where they are in the month
- **No mood color differentiation** — all journaled days look identical
- **No progress/streak** — no motivation to continue journaling
- **Week Row 6 is empty spacers** — July 2026 only needs 5 weeks
- **No tab bar** — no navigation context
- **Report card is text-only** — no visual mood preview

## 5. Redesign Plan — Phased Execution

### Phase 1: Foundation (Must Have) ✅ COMPLETE
**Goal:** Make the calendar functional and scannable.

| Task | Details | Impact | Status |
|---|---|---|---|
| Add day numbers to every cell | 13px, centered, Inter font. Muted for empty days, primary for journaled, accent for today. | 🔴 Critical | ✅ Done |
| Add today indicator | Subtle accent ring (40px ellipse, $accent-primary stroke, $accent-glow-soft fill) behind today's number. | 🔴 Critical | ✅ Done |
| Remove Week Row 6 | July 2026 starts Wed, ends Fri — only 5 weeks needed. Delete the empty spacer row. | 🟡 Quality | ✅ Done |
| Remove bottom spacer | Replace with proper padding per mobile app guide. | 🟡 Quality | ✅ Done |

### Phase 2: Mood Intelligence (Should Have) ✅ COMPLETE
**Goal:** Make mood patterns visible and scannable.

| Task | Details | Impact | Status |
|---|---|---|---|
| Add mood-colored dots | 5px circles below day numbers. Color mapped: joy=#F59E0B, calm=#0EA5E9, love=#EC4899, sadness=#3B82F6, anger=#EF4444. | 🔴 Critical | ✅ Done |
| Add mood distribution bar | Horizontal segmented bar below calendar showing proportional mood colors for the month. | 🟡 Quality | ✅ Done |
| Add progress summary | "7 of 31 days journaled" text below month header. | 🟢 Nice | ✅ Done |

### Phase 3: Motivation & Context (Should Have) ✅ COMPLETE
**Goal:** Keep users engaged and coming back.

| Task | Details | Impact | Status |
|---|---|---|---|
| Add streak badge | Pill with 🔥 + "3 day streak" text in accent color, positioned top-right of progress row. | 🟡 Quality | ✅ Done |
| Redesign report trigger | Show mood distribution mini-preview inside the card instead of just text. Make it feel data-rich. | 🟡 Quality | ✅ Done |
| Add tab bar | Bottom capsule tab bar with Home, Calendar (active), Settings icons. iOS Liquid Glass style. | 🟢 Nice | ✅ Done |

### Phase 4: Polish (Nice to Have) ✅ COMPLETE
**Goal:** Elevate the experience.

| Task | Details | Impact | Status |
|---|---|---|---|
| Selected day mini-card | Tapping a journaled day shows a subtle glass card with the entry snippet and mood label. | 🟢 Nice | ✅ Done |
| Monthly mood donut | Small donut chart in the report card showing mood proportions. | 🟢 Nice | ✅ Done |
| Transition polish | Smooth month navigation transitions. | 🟢 Nice | ⏭️ Deferred (animation, not static) |
| Today glow | Soft outer shadow on today's accent ring for visual pop. | 🟢 Nice | ✅ Done |
| Streak pill glow | Subtle accent glow on streak badge. | 🟢 Nice | ✅ Done |
| Empty day dimming | 50% opacity on empty cells for visual hierarchy. | 🟢 Nice | ✅ Done |
| AI insight | Pattern recognition text in report card. | 🟢 Nice | ✅ Done |

## 6. New Variables Needed

| Variable | Type | Value | Purpose |
|---|---|---|---|
| `mood-dot-joy` | color | `#F59E0B` | Solid amber for joy mood dots |
| `mood-dot-calm` | color | `#0EA5E9` | Solid sky for calm mood dots |
| `mood-dot-love` | color | `#EC4899` | Solid pink for love mood dots |
| `mood-dot-sadness` | color | `#3B82F6` | Solid blue for sadness mood dots |
| `mood-dot-anger` | color | `#EF4444` | Solid red for anger mood dots |
| `accent-glow-soft` | color | `#818CF820` | Very subtle accent glow for today ring |

## 7. Screen Structure (New)

```
Calendar Screen (390×844, vertical, clip)
├── Status Bar (62px)
├── Calendar Content (vertical, padding [0,20], gap 16)
│   ├── Month Header (horizontal, space_between)
│   │   ├── ◀ chevron-left
│   │   ├── "July 2026" (Playfair Display, 22px, bold)
│   │   └── ▶ chevron-right
│   ├── Progress Row (horizontal, space_between)
│   │   ├── "7 of 31 days journaled" (Inter, 13px, muted)
│   │   └── Streak Pill (capsule, accent glow bg)
│   │       ├── 🔥 emoji
│   │       └── "3 day streak" (12px, accent)
│   ├── Weekday Labels (horizontal, space_around)
│   │   └── M T W T F S S (12px, muted, bold)
│   ├── Calendar Grid (vertical, gap 4)
│   │   ├── Week Row 1 (7 cells)
│   │   │   ├── Empty cells (no number)
│   │   │   ├── Day cell: [number + mood dot]
│   │   │   └── Today cell: [accent ring + number + mood dot]
│   │   ├── Week Row 2 (7 cells)
│   │   ├── Week Row 3 (7 cells)
│   │   ├── Week Row 4 (7 cells)
│   │   └── Week Row 5 (7 cells)
│   ├── Mood Summary Row (horizontal, gap 8)
│   │   └── Mood chips: [colored dot + label + count]
│   ├── Report Card (glass, vertical, gap 8, padding 16)
│   │   ├── "Monthly Insights" (16px, heading)
│   │   ├── Mood distribution mini-bar (horizontal segments)
│   │   └── "Tap to explore →" (13px, muted)
│   └── Tab Bar (horizontal, glass capsule)
│       ├── 🏠 Home
│       ├── 📅 Calendar (active, accent)
│       └── ⚙️ Settings
```

## 8. Cell Design Spec

### Empty Day
```
┌──────────┐
│          │
│    14    │  ← 13px, $text-muted, weight 500
│          │
│    ·     │  ← 5px ellipse, transparent
└──────────┘
```

### Today ( journaled)
```
┌──────────┐
│  ╭────╮  │  ← 40px ellipse ring, $accent-primary stroke
│  │ 12 │  │  ← 13px, $accent-primary, weight 700
│  ╰────╯  │
│    ●     │  ← 5px ellipse, mood color
└──────────┘
```

### Journaled Day
```
┌──────────┐
│          │
│    25    │  ← 13px, $text-primary, weight 500
│          │
│    ●     │  ← 5px ellipse, mood color (#F59E0B for joy)
└──────────┘
```

## 9. Mood Color Mapping

| Mood | Emoji | Dot Color | Hex |
|---|---|---|---|
| Joy | 😊 🌟 | Amber | `#F59E0B` |
| Calm | 😌 | Sky Blue | `#0EA5E9` |
| Love | 💜 | Pink | `#EC4899` |
| Sadness | 😢 | Blue | `#3B82F6` |
| Anger | 😤 | Red | `#EF4444` |
| Fear | 😨 | Purple | `#8B5CF6` |
| Anxious | 😰 | Yellow | `#EAB308` |

## 10. Execution Order

1. ✅ **Add new variables** (mood dots, accent glow soft)
2. ✅ **Replace Calendar Content frame** with new layout structure
3. ✅ **Build month header** (nav arrows + title)
4. ✅ **Build progress row** (progress text + streak pill)
5. ✅ **Build weekday labels** (M T W T F S S)
6. ✅ **Build calendar grid** (5 weeks × 7 cells with day numbers + mood dots)
7. ✅ **Build mood summary row** (colored dot chips)
8. ✅ **Build report card** (glass card with mini mood bar + donut + insight)
9. ✅ **Build tab bar** (bottom capsule navigation)
10. ✅ **Adjust screen height** to fit content
11. ✅ **Add selected day card** (entry preview + mood pill)
12. ✅ **Add polish effects** (glows, dimming, donut chart)
13. ✅ **Screenshot & verify** layout, contrast, alignment

## 11. Success Criteria

- [x] Every day cell shows its date number
- [x] Today is clearly distinguishable with accent ring + glow
- [x] Journaled days have visible mood-colored dots
- [x] Empty days are visually distinct from journaled days (50% opacity)
- [x] No wasted space (no empty spacer rows)
- [x] Progress info visible at a glance ("7 of 31 days journaled")
- [x] Streak badge present and readable (with glow)
- [x] Mood summary shows color distribution (chips + donut + bar)
- [x] Tab bar provides navigation context
- [x] All text meets contrast requirements on dark bg
- [x] Touch targets are ≥44px
- [x] Screen fits content without overflow
- [x] Selected day card shows entry preview
- [x] Report card includes AI insight
- [x] Mood donut chart with legend

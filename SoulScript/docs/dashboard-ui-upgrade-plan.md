# Dashboard UI Upgrade Plan

**Date:** 2026-07-12
**Status:** Planning
**Approach:** GSD (Get Shit Done) — Incremental, preserve existing functionality

---

## 1. Reference Analysis

### Visual Design Breakdown (from reference image)

| Element | Reference Design | Current State | Gap |
|---------|-----------------|---------------|-----|
| **Background** | Deep indigo gradient + crescent moon + scattered stars + soft cloud wisps | Linear gradient `#0B0F19 → #1E1B4B`, no celestial elements | Add moon, stars, clouds as decorative layer |
| **Navigation** | Bottom nav bar: Home, Calendar, + (center, prominent), Insights, Profile | Top nav bar: Home, Calendar, Report, Settings | **Replace top nav with bottom nav** |
| **Journal Composer** | "Today's Journal" card with lock icon + "Encrypted & Private" badge, glass card | Textarea with glow, no section label | Add section header with privacy badge |
| **Stats Row** | 3 glass cards: Current Streak (fire), Days Journalled (calendar), Most Felt mood (emoji) | 3 cards with similar data | Refine styling to match reference |
| **AI Insight** | "AI Insight Preview" card with cosmic orb, insight text, "View Insights →" | Same structure exists | Minor styling refinements |
| **Mood Calendar** | Mini calendar widget on dashboard showing "Your Mood Calendar" with "View Calendar" link | Only exists on `/calendar` page | **Add mini calendar to dashboard** |
| **Quick Actions** | Grid: "New Entry", "Voice Entry", "Photo Entry" with icons | Does not exist | **Add Quick Actions section** |
| **Greeting** | "Good evening, Aye Pyae" with subtitle "Your mood is a symphony, let's feel it" | Similar greeting exists | Add user avatar, refine subtitle |
| **Card Style** | Glassmorphism with rounded corners, subtle borders, soft shadows | Similar glass style | Refine border opacity, shadow depth |

---

## 2. Scope Definition

### What Changes (UI Only)

| Area | Change Type | Priority |
|------|-------------|----------|
| Bottom Navigation | Replace top nav with bottom nav (5 items) | P0 — Core layout change |
| Dreamy Background | Add moon, stars, clouds decorative layer | P1 — Atmosphere |
| Journal Composer | Add "Today's Journal" header + privacy badge | P1 — Structure |
| Mini Calendar Widget | Add compact calendar to dashboard | P1 — Feature parity |
| Quick Actions Grid | Add action cards (New Entry, Voice Entry, Photo Entry) | P2 — Enhancement |
| Stats Row Styling | Refine card design to match reference | P2 — Polish |
| Greeting Area | Add user avatar, refine subtitle | P2 — Polish |
| AI Insight Card | Minor styling refinements | P3 — Polish |

### What Stays the Same (No Changes)

| Component/Feature | Reason |
|-------------------|--------|
| Supabase integration | Data layer is solid, no changes needed |
| AI mood analysis (`/api/analyze`) | Working correctly |
| Encryption/decryption | Security layer intact |
| Auth flow (login/signup/callback) | Separate concern |
| Settings page | Separate page |
| Monthly report generation | Separate feature |
| Mood themes system | Reuse as-is |
| Existing routes | Preserve all navigation targets |

---

## 3. Architecture Decisions

### Navigation: Top → Bottom

| Decision | Choice | Why |
|----------|--------|-----|
| Nav position | Bottom | Matches reference, more natural for mobile-first journaling |
| Center button | Prominent "+" FAB | Primary action (new entry) gets visual priority |
| Nav items | Home, Calendar, +, Insights, Profile | 5 items matches reference |
| Active state | Accent color icon + label | Clear visual feedback |
| Safe area | Respect iPhone notch/home indicator | iOS/Android compliance |

### Mini Calendar on Dashboard

| Decision | Choice | Why |
|----------|--------|-----|
| Placement | Below AI Insight, above Quick Actions | Matches reference layout |
| Size | Compact (not full calendar page) | Dashboard widget, not full view |
| Interaction | Tapping "View Calendar" navigates to `/calendar` | Links to existing full calendar |
| Data source | Reuse existing `/api/entries` endpoint | No new API needed |

### Quick Actions

| Decision | Choice | Why |
|----------|--------|-----|
| Actions | New Entry, Voice Entry, Photo Entry | Matches reference |
| "New Entry" | Scrolls to textarea / opens composer | Primary action |
| "Voice Entry" | Shows "Coming soon" toast | Not in scope, placeholder |
| "Photo Entry" | Shows "Coming soon" toast | Not in scope, placeholder |
| Layout | 3-column grid | Matches reference |

### Dreamy Background

| Decision | Choice | Why |
|----------|--------|-----|
| Implementation | CSS-only (no canvas/WebGL) | Simple, performant, no dependencies |
| Elements | Crescent moon + 15-20 stars + 2 cloud wisps | Matches reference |
| Positioning | Fixed/absolute behind content | Decorative layer |
| Animation | Subtle CSS keyframe twinkle on stars | Atmosphere without distraction |

---

## 4. Component Design

### 4.1 Bottom Navigation Bar

```
┌─────────────────────────────────────────────────────┐
│   🏠        📅        ➕        💡        👤        │
│  Home    Calendar    New     Insights   Profile     │
│                     Entry                           │
└─────────────────────────────────────────────────────┘
```

**Structure:**
- Fixed to bottom of viewport
- Full width, glassmorphism background
- 5 items evenly spaced
- Center "+" button: larger, accent color, raised above bar
- Active item: accent icon + label
- Inactive: muted icon + label

**Responsive:**
- Mobile: Standard bottom bar
- Tablet/Desktop: Could convert to side nav or keep bottom (TBD — for now, keep bottom for consistency)

### 4.2 Dreamy Background Layer

```
┌─────────────────────────────┐
│  ·  ·    ☆     ·  ·   🌙   │
│     ·  ☁️    ·     ·        │
│  ·     ·   ☆    ·     ·    │
│     ☁️    ·    ·  ☆     ·  │
│  ·    ·     ·     ·    ·   │
│     ·    ·    ☆    ·       │
└─────────────────────────────┘
```

**Elements:**
- Moon: CSS gradient circle with shadow overlay for crescent effect
- Stars: Small dots with CSS `twinkle` animation (opacity pulse)
- Clouds: Soft blurred shapes with low opacity

**CSS approach:**
```css
/* Moon */
.moon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #F5F5F5, #C8D0E0);
  box-shadow: 0 0 20px rgba(245, 245, 245, 0.3);
}
.moon-shadow {
  /* Overlaid circle matching bg color to create crescent */
}

/* Stars */
.star {
  width: 3px;
  height: 3px;
  background: #FFFFFF;
  border-radius: 50%;
  animation: twinkle 3s ease-in-out infinite;
}

/* Clouds */
.cloud {
  background: rgba(255, 255, 255, 0.03);
  filter: blur(12px);
  border-radius: 50%;
}
```

### 4.3 Journal Composer Card

```
┌──────────────────────────────────────────────┐
│  📖 Today's Journal            🔒 Encrypted  │
│  July 12, 2026 • 8:15 PM                     │
│  ──────────────────────────────────────────  │
│  What's on your mind today?                  │
│  Write freely, no pressure, just you...      │
│                                               │
│                                  0 / 5000    │
└──────────────────────────────────────────────┘
```

**Changes from current:**
- Add "Today's Journal" header with book emoji
- Add "Encrypted & Private" badge with lock icon
- Add date/time subtitle
- Keep existing textarea, character counter, glow effect

### 4.4 Mini Calendar Widget

```
┌──────────────────────────────────────────────┐
│  Your Mood Calendar              View Calendar│
│  ──────────────────────────────────────────  │
│  Mo  Tu  We  Th  Fr  Sa  Su                  │
│      1   2   3   4   5   6                   │
│  7   8   9  10  11 [12] 13                   │
│ 14  15  16  17  18  19  20                   │
│  ──────────────────────────────────────────  │
│  😌 Calm  🌙 Sad  🔥 Joy  · No entry        │
└──────────────────────────────────────────────┘
```

**Structure:**
- Glass card with month grid
- Days with entries show mood emoji
- Current day highlighted
- "View Calendar" link navigates to `/calendar`
- Legend at bottom showing mood colors

### 4.5 Quick Actions Grid

```
┌────────────┐ ┌────────────┐ ┌────────────┐
│    ✏️      │ │    🎤      │ │    📷      │
│ New Entry  │ │ Voice Entry│ │ Photo Entry│
└────────────┘ └────────────┘ └────────────┘
```

**Structure:**
- 3-column grid
- Each card: icon + label
- Glass styling with subtle hover effect
- "New Entry" → scrolls to textarea
- "Voice Entry" / "Photo Entry" → "Coming soon" toast

---

## 5. File Changes

### New Files

| File | Purpose |
|------|---------|
| `src/components/BottomNav.tsx` | Bottom navigation bar component |
| `src/components/DreamyBackground.tsx` | Celestial background layer (moon, stars, clouds) |
| `src/components/MiniCalendar.tsx` | Compact calendar widget for dashboard |
| `src/components/QuickActions.tsx` | Quick action cards grid |
| `src/components/JournalComposer.tsx` | Refactored journal textarea with header |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/AppShell.tsx` | Replace TopNav with BottomNav, add DreamyBackground |
| `src/app/page.tsx` | Integrate new components, restructure layout |
| `src/app/globals.css` | Add moon/star/cloud CSS, twinkle animation, bottom nav styles |
| `src/components/StatsRow.tsx` | Minor styling refinements |

### Deleted Files

| File | Reason |
|------|--------|
| `src/components/TopNav.tsx` | Replaced by BottomNav |

### Unchanged Files

| File | Reason |
|------|--------|
| All API routes | Data layer intact |
| `src/lib/*` | Utilities intact |
| Auth pages | Separate concern |
| Settings page | Separate concern |
| `MoodCalendar.tsx` | Full calendar page, not dashboard widget |
| `MonthlyReport.tsx` | Separate feature |

---

## 6. Implementation Order

### Phase 1: Foundation (Do First)

| Step | Task | Files | Depends On |
|------|------|-------|------------|
| 1.1 | Create `DreamyBackground.tsx` component | New | — |
| 1.2 | Add moon/star/cloud CSS to `globals.css` | Modify | — |
| 1.3 | Create `BottomNav.tsx` component | New | — |
| 1.4 | Update `AppShell.tsx` to use BottomNav + DreamyBackground | Modify | 1.1, 1.3 |
| 1.5 | Remove `TopNav.tsx` | Delete | 1.4 |

### Phase 2: Dashboard Components

| Step | Task | Files | Depends On |
|------|------|-------|------------|
| 2.1 | Create `JournalComposer.tsx` (header + textarea wrapper) | New | — |
| 2.2 | Create `MiniCalendar.tsx` widget | New | — |
| 2.3 | Create `QuickActions.tsx` grid | New | — |
| 2.4 | Update `StatsRow.tsx` styling | Modify | — |

### Phase 3: Dashboard Assembly

| Step | Task | Files | Depends On |
|------|------|-------|------------|
| 3.1 | Restructure `page.tsx` layout | Modify | 2.1-2.4 |
| 3.2 | Integrate all new components | Modify | 3.1 |
| 3.3 | Test responsive behavior | — | 3.2 |

### Phase 4: Polish

| Step | Task | Files | Depends On |
|------|------|-------|------------|
| 4.1 | Refine animations (entrance, hover) | Modify | 3.3 |
| 4.2 | Test on mobile/tablet/desktop | — | 4.1 |
| 4.3 | Fix any visual issues | Modify | 4.2 |

---

## 7. Data Flow (No Changes)

### Existing Data Sources — Reused As-Is

| Component | Data Source | Endpoint |
|-----------|-------------|----------|
| StatsRow | `journal_entries` | Direct Supabase query |
| AIInsightCard | `journal_entries` | Direct Supabase query |
| RecentEntries | `journal_entries` | Direct Supabase query |
| MiniCalendar | `journal_entries` | `/api/entries?month=YYYY-MM` |
| JournalComposer | Submit → `/api/analyze` | POST |

### No New API Routes Needed

All dashboard data is already available through existing endpoints or direct Supabase queries.

---

## 8. Styling Approach

### CSS Additions to `globals.css`

```css
/* Dreamy Background */
.dreamy-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.moon {
  position: absolute;
  top: 60px;
  right: 40px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #F5F5F5, #C8D0E0);
  box-shadow: 0 0 20px rgba(245, 245, 245, 0.3);
}

.moon-shadow {
  position: absolute;
  top: 4px;
  left: 8px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-background);
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #FFFFFF;
  border-radius: 50%;
  animation: twinkle 3s ease-in-out infinite;
}

.star--bright {
  width: 3px;
  height: 3px;
  background: var(--color-accent);
  filter: drop-shadow(0 0 4px var(--color-accent));
}

.cloud {
  position: absolute;
  background: rgba(255, 255, 255, 0.03);
  filter: blur(12px);
  border-radius: 50%;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* Bottom Navigation */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 72px;
  background: rgba(11, 15, 25, 0.85);
  backdrop-filter: blur(24px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 50;
}

.bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--color-text-muted);
  transition: color 200ms ease;
}

.bottom-nav__item--active {
  color: var(--color-accent);
}

.bottom-nav__fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-top: -28px;
  box-shadow: 0 4px 20px rgba(129, 140, 248, 0.4);
}
```

### Tailwind Additions (if needed)

Most styling uses existing design tokens. New utility classes:
- `.bottom-nav` — bottom navigation container
- `.bottom-nav__item` — nav item
- `.bottom-nav__fab` — floating action button
- `.dreamy-bg` — background layer
- `.moon`, `.moon-shadow` — crescent moon
- `.star`, `.star--bright` — stars
- `.cloud` — cloud wisps

---

## 9. Responsive Behavior

| Breakpoint | Bottom Nav | Mini Calendar | Quick Actions | Background |
|------------|------------|---------------|---------------|------------|
| Mobile (< 640px) | Standard bottom bar | Full width, compact | 3-col grid | Moon + stars visible |
| Tablet (640-1024px) | Standard bottom bar | Full width | 3-col grid | Moon + stars visible |
| Desktop (> 1024px) | Standard bottom bar | Max-width 400px | 3-col grid | Moon + stars visible |

---

## 10. Accessibility

| Concern | Solution |
|---------|----------|
| Bottom nav touch targets | Minimum 44x44px per item |
| Safe area insets | `padding-bottom: env(safe-area-inset-bottom)` |
| Color contrast | All text meets WCAG AA against dark backgrounds |
| Reduced motion | Respect `prefers-reduced-motion` for star animations |
| Screen reader | Proper `aria-label` on nav items and FAB |

---

## 11. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Bottom nav conflicts with existing routes | Low | Medium | Test all navigation paths |
| Mini calendar performance with many entries | Low | Low | Limit to current month, lazy load |
| Background layer blocks interactions | Low | High | `pointer-events: none` on background |
| Safe area not respected on iOS | Medium | Medium | Test on real device, use `env()` |
| Breaking existing glassmorphism | Low | Medium | Careful CSS specificity management |

---

## 12. Testing Checklist

### Visual Testing
- [ ] Bottom nav renders correctly on mobile
- [ ] Bottom nav renders correctly on desktop
- [ ] Dreamy background visible but non-intrusive
- [ ] Moon, stars, clouds positioned correctly
- [ ] Star twinkle animation works
- [ ] Journal composer card matches reference
- [ ] Mini calendar displays current month
- [ ] Mini calendar shows mood emojis on entries
- [ ] Quick actions grid renders 3 columns
- [ ] Stats row styling matches reference
- [ ] AI insight card styling matches reference

### Functional Testing
- [ ] Bottom nav: Home → `/`
- [ ] Bottom nav: Calendar → `/calendar`
- [ ] Bottom nav: + → scrolls to textarea
- [ ] Bottom nav: Insights → toast "Coming soon"
- [ ] Bottom nav: Profile → `/settings`
- [ ] Mini calendar: "View Calendar" → `/calendar`
- [ ] Quick action: "New Entry" → scrolls to textarea
- [ ] Quick action: "Voice Entry" → "Coming soon" toast
- [ ] Quick action: "Photo Entry" → "Coming soon" toast
- [ ] Journal submission still works
- [ ] Undo toast still works
- [ ] Stats still load from Supabase
- [ ] AI insight still loads
- [ ] Recent entries still load

### Responsive Testing
- [ ] Mobile (375px): Layout correct
- [ ] Tablet (768px): Layout correct
- [ ] Desktop (1280px): Layout correct
- [ ] iPhone safe area respected
- [ ] Android navigation bar respected

---

## 13. Commit Strategy

```
feat: add dreamy background layer with moon, stars, clouds

feat: replace top nav with bottom navigation bar

feat: add mini calendar widget to dashboard

feat: add quick actions grid to dashboard

feat: refactor journal composer with header and privacy badge

style: refine stats row and AI insight card styling

fix: responsive layout adjustments for all breakpoints
```

---

## 14. Rollback Plan

If any phase breaks existing functionality:

1. **Git revert** the specific commit
2. **Or** cherry-pick individual commits to keep working changes
3. All existing data logic is untouched — no database rollback needed

---

## 15. Success Criteria

| Criterion | Target |
|-----------|--------|
| Visual match to reference | 90%+ similarity |
| All existing functionality works | 100% |
| No new API routes needed | Confirmed |
| Mobile-first responsive | All breakpoints tested |
| Performance | No visible lag on animations |
| Accessibility | WCAG AA compliant |

---

## 16. Out of Scope

| Feature | Reason |
|---------|--------|
| Voice Entry | Requires new API + speech recognition |
| Photo Entry | Requires new API + file upload + storage |
| Full calendar redesign | Current calendar works, separate concern |
| Settings page changes | Separate page, not dashboard |
| Auth flow changes | Separate concern |
| New database tables | Data layer is solid |
| New API endpoints | Existing endpoints sufficient |

---

## 17. Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| Framer Motion | Dev | Already installed |
| Tailwind CSS 4 | Dev | Already installed |
| Supabase | Service | Already configured |
| No new packages | — | — |

---

## 18. Next Steps

1. **Approve this plan** — Review and confirm scope
2. **Start Phase 1** — Foundation (DreamyBackground + BottomNav)
3. **Iterate** — Build, test, refine each phase
4. **Ship** — Merge to main when all phases complete

---

*Plan created: 2026-07-12*
*Last updated: 2026-07-12*

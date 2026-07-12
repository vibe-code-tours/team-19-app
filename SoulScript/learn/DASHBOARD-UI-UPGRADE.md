# Dashboard UI Upgrade — GSD Learnings

## Session Date: 2026-07-11 → 2026-07-12

---

## 1. What We Did

### Goal
Upgrade the SoulScript dashboard from a monolithic journal form into a complete, polished experience with responsive top navigation, stats, AI insights, and recent entries.

### Scope
- Replaced bottom nav bar with responsive top navigation (hamburger on mobile, horizontal links on tablet/desktop)
- Added 3 new dashboard components: StatsRow, AIInsightCard, RecentEntries
- Added AppShell wrapper for route-conditional nav/footer rendering
- Added minimal Footer component
- Created full desktop dashboard layout in Pencil MCP
- Created Dreamy Background for desktop matching mobile design

### Approach
**Design-first workflow:**
1. Updated design spec (`docs/superpowers/specs/2026-07-11-dashboard-ui-upgrade-design.md`)
2. Built all components in Pencil MCP (`soulscript.pen`)
3. Implemented in code on `feat/ui-upgrade` branch

---

## 2. Architecture Decisions

### Top Nav vs Bottom Nav
| Decision | Choice | Why |
|----------|--------|-----|
| Navigation position | Top | More conventional for web, better discoverability |
| Mobile pattern | Hamburger dropdown | Saves vertical space, familiar mobile UX |
| Desktop pattern | Horizontal links | Always visible, no extra tap needed |
| Active state | Accent text + underline | Clear visual hierarchy, matches theme |

### Component Architecture
| Component | Responsibility | Data Source |
|-----------|---------------|-------------|
| `AppShell` | Route-conditional nav/footer | `usePathname()` |
| `TopNav` | Navigation with responsive hamburger | `usePathname()` for active state |
| `Footer` | Minimal links + copyright | Static |
| `StatsRow` | Streak, entry count, dominant mood | Supabase `journal_entries` |
| `AIInsightCard` | Dynamic insight from recent entries | Supabase `journal_entries` (7 days) |
| `RecentEntries` | Last 3 journal entries | Supabase `journal_entries` |

### Responsive Strategy
| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, hamburger nav, compact spacing |
| Tablet | 640px – 1024px | Single column, horizontal nav, wider content |
| Desktop | > 1024px | Centered single column, max-width 800px |

---

## 3. Implementation Flow

### Phase 1: Design (Pencil MCP)
1. Created reusable Top Nav component with hamburger icon
2. Created Mobile Nav Dropdown with menu items
3. Removed deprecated Bottom Nav and old Header
4. Built full Desktop Dashboard frame (1200px wide)
5. Created Desktop Dreamy Background (scaled moon, stars, clouds)
6. Created Footer component with instances for both layouts

### Phase 2: Spec Update
1. Added Responsive Design Rules section (breakpoints, spacing, typography scales)
2. Updated Component 1 (Top Nav) with responsive behavior + hamburger menu docs
3. Added Component 6 (Footer) section
4. Added complete Desktop Dashboard Pencil IDs reference
5. Added Dreamy Background section with animation CSS specs

### Phase 3: Code Implementation
1. Created `TopNav.tsx` — responsive hamburger + desktop links
2. Created `Footer.tsx` — minimal footer with links
3. Created `AppShell.tsx` — route-conditional wrapper
4. Created `StatsRow.tsx` — Supabase data fetching + streak calculation
5. Created `AIInsightCard.tsx` — dynamic insight generation
6. Created `RecentEntries.tsx` — last 3 entries with mood pills
7. Modified `layout.tsx` — wrapped children in AppShell
8. Modified `page.tsx` — removed old header, added new components

---

## 4. Key Learnings

### Pencil MCP Patterns

#### Reusable Components
- Create components with `reusable: true` for elements used in multiple layouts
- Use ref instances with descendant overrides for variations
- **Gotcha:** Copy operations create new random child IDs — can't update children by old IDs

#### Layout Constraints
- `fill_container` width requires parent to have flexbox layout
- Absolute-positioned elements need explicit dimensions (not `fill_container`)
- `fit_content` height works for auto-sizing frames with mixed content

#### Desktop vs Mobile Design
- Don't copy mobile frames to desktop — create from scratch with proportional scaling
- Scale all values (moon, stars, spacing) proportionally for larger canvases
- Use `layoutPosition: "absolute"` for background layers behind scrollable content

### Responsive Navigation

#### Hamburger Menu Pattern
```
Mobile: logo + hamburger icon → dropdown menu
Tablet/Desktop: logo + horizontal nav links
```

#### Implementation Details
- Use `md:` Tailwind breakpoint to toggle between mobile/desktop layouts
- `md:hidden` for hamburger (visible only on mobile)
- `hidden md:flex` for desktop nav links
- Framer Motion `AnimatePresence` for dropdown slide animation

#### Active State Detection
- `usePathname()` from Next.js for current route
- Compare `pathname === href` for exact match (not `includes`)
- Active: accent color text + bottom border indicator
- Inactive: secondary text, hover to primary

### Supabase Data Fetching

#### Client-Side Pattern
```tsx
const supabase = createClient(); // Browser client

useEffect(() => {
  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from("journal_entries")
      .select("...")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    
    if (data) setState(data);
  }
  loadData();
}, [supabase]);
```

#### Streak Calculation Algorithm
1. Get all entry dates, deduplicate to unique days
2. Sort descending (most recent first)
3. Check if most recent is today or yesterday (otherwise streak = 0)
4. Count consecutive days backwards from there

#### AI Insight Generation
1. Fetch last 7 days of entries
2. Count emotion frequency → find dominant emotion
3. Count entries by hour → find peak journaling time
4. Generate dynamic text: "You've been feeling more {mood} this week. You tend to journal most {timeOfDay}."

### Route-Conditional Rendering

#### AppShell Pattern
```tsx
const authRoutes = ["/login", "/signup", "/auth/callback"];
const isAuthPage = authRoutes.some((route) => pathname.startsWith(route));

if (isAuthPage) return <>{children}</>; // No nav/footer
return (
  <div className="flex min-h-full flex-col">
    <TopNav />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);
```

---

## 5. File Structure (New/Modified)

```
src/
├── app/
│   ├── layout.tsx              # MODIFIED: Added AppShell wrapper
│   └── page.tsx                # MODIFIED: Removed old header, added new components
├── components/
│   ├── AppShell.tsx            # NEW: Route-conditional nav/footer wrapper
│   ├── TopNav.tsx              # NEW: Responsive top navigation
│   ├── Footer.tsx              # NEW: Minimal footer
│   ├── StatsRow.tsx            # NEW: Streak, entries, mood stats
│   ├── AIInsightCard.tsx       # NEW: Dynamic AI insight preview
│   └── RecentEntries.tsx       # NEW: Last 3 journal entries
docs/
└── superpowers/
    └── specs/
        └── 2026-07-11-dashboard-ui-upgrade-design.md  # UPDATED: Responsive rules, components
learn/
└── DASHBOARD-UI-UPGRADE.md     # NEW: This file
```

---

## 6. What's Working

| Feature | Status | Notes |
|---------|--------|-------|
| Top navigation (desktop) | ✅ | Horizontal links with active state |
| Top navigation (mobile) | ✅ | Hamburger dropdown with animation |
| StatsRow | ✅ | Real Supabase data, streak calculation |
| AIInsightCard | ✅ | Dynamic insight from 7-day analysis |
| RecentEntries | ✅ | Last 3 entries with mood pills |
| Footer | ✅ | Minimal with links |
| AppShell | ✅ | Hides nav/footer on auth pages |
| Responsive layout | ✅ | Mobile/tablet/desktop breakpoints |
| Dreamy Background | ✅ | Mobile + desktop versions in Pencil |

---

## 7. What's Missing (Future Work)

| Feature | Priority | Notes |
|---------|----------|-------|
| Dreamy Background in code | Medium | CSS animations for stars/moon (static in Pencil) |
| "View all entries" navigation | Low | Link exists, no route yet |
| "View Insights" navigation | Low | Button exists, no route yet |
| TanStack Query integration | Medium | Currently using raw fetch + useState |
| Skeleton loading for new components | Low | StatsRow/AIInsightCard show blank while loading |
| Framer Motion entrance animations | Low | Components appear without animation |

---

## 8. Commands Reference

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run lint                   # ESLint check

# Git
git checkout feat/ui-upgrade   # Switch to feature branch
git status                     # Check changes
git diff                       # Review diffs

# Pencil MCP
# Use get_editor_state(include_schema: true) to see current state
# Use batch_design() for creating/updating components
# Use get_screenshot() to verify visual output
```

---

## 9. Design Tokens Reference (Responsive)

```css
/* Spacing Scale */
--page-padding-mobile: 20px;
--page-padding-tablet: 32px;
--page-padding-desktop: 40px;

--section-gap-mobile: 28px;
--section-gap-tablet: 32px;
--section-gap-desktop: 36px;

--card-padding-mobile: 16px;
--card-padding-tablet: 20px;
--card-padding-desktop: 24px;

/* Typography Scale */
--greeting-mobile: 28px;
--greeting-tablet: 32px;
--greeting-desktop: 36px;

--stat-value-mobile: 20px;
--stat-value-tablet: 22px;
--stat-value-desktop: 24px;

/* Breakpoints */
--bp-mobile: 640px;
--bp-tablet: 1024px;
```

---

## 10. Anti-Patterns to Avoid

### Don't Copy Pencil Frames Between Sizes
- Copying mobile frames to desktop creates random child IDs
- Create desktop frames from scratch with proportional scaling
- Reference mobile component structure but rebuild elements

### Don't Use `fill_container` for Absolute Elements
- Absolute-positioned elements need explicit dimensions
- Use fixed width/height or percentage of parent
- `fill_container` requires flexbox parent layout

### Don't Skip Route-Conditional Rendering
- Always check `usePathname()` before rendering nav/footer
- Auth pages (login/signup) should not show navigation
- Use `startsWith()` for route matching to catch nested routes

### Don't Fetch Data at Module Level
- Supabase client creation must happen inside components
- Use `useEffect` for async data fetching
- Always check `user` existence before querying user-specific data

---

## 11. Next Steps

1. **Implement Dreamy Background in code** — CSS keyframe animations for stars, moon glow
2. **Add TanStack Query** — Replace raw fetch + useState with query hooks
3. **Add skeleton loading** — Show placeholders while StatsRow/AIInsightCard load
4. **Create routes for "View all entries" and "View Insights"** — Wire up navigation links
5. **Add entrance animations** — Framer Motion for component appearance

---

## 12. GSD Checklist

- [x] Design spec updated with responsive rules
- [x] Pencil components built for mobile + desktop
- [x] Code implementation on feature branch
- [x] All new components fetch real data from Supabase
- [x] Responsive breakpoints working (mobile/tablet/desktop)
- [x] Hamburger menu with animation on mobile
- [x] Active state detection for navigation
- [x] Route-conditional nav/footer rendering
- [x] Learn file documenting process and patterns

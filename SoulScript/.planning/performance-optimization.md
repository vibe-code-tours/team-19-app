# Performance Optimization Analysis

## Framer Motion — 4 files, ~30KB gzipped

| File | Usage |
|------|-------|
| `src/app/page.tsx:6` | Textarea glow animation, undo toast |
| `src/components/MoodCalendar.tsx:5` | Calendar day hover, modal transitions |
| `src/components/MonthlyReport.tsx:1` | Report fade-in |
| `src/app/settings/page.tsx:1` | Settings page transitions |

**Why it's heavy:** Framer Motion includes a full animation engine, physics simulations, and gesture handling — you're using basic fade/slide that CSS can do in 0kb.

---

## No dynamic imports — 2 large components

| Component | Size | Loaded |
|-----------|------|--------|
| `src/components/MoodCalendar.tsx` | ~15KB | Always, even on `/` |
| `src/components/MonthlyReport.tsx` | ~6KB | Always, even on `/` |

**Why it matters:** Both are only used on `/calendar`, but bundled into main page.

---

## `<img>` instead of `<Image>`

| File | Line |
|------|------|
| `src/app/page.tsx:193` | `<img src="/logo-horizontal.png" ... />` |

**Why it matters:** No lazy loading, no WebP conversion, no responsive sizing.

---

## Changes Applied

| Change | Impact |
|--------|--------|
| ✅ Removed Framer Motion | -30KB gzipped bundle |
| ✅ Added CSS animations | `fadeIn`, `slideUp` in globals.css |
| ✅ Dynamic import MoodCalendar | Lazy-loaded on `/calendar` only |
| ✅ Replaced `<img>` with `<Image>` | Optimized images in page.tsx & MoodCalendar.tsx |

## Files Modified

- `src/app/page.tsx` — CSS transitions, next/image
- `src/components/MoodCalendar.tsx` — CSS transitions, next/image
- `src/components/MonthlyReport.tsx` — CSS stagger animation
- `src/app/settings/page.tsx` — CSS modal transitions
- `src/app/calendar/page.tsx` — Dynamic import
- `src/app/globals.css` — New animation keyframes
- `package.json` — Removed framer-motion

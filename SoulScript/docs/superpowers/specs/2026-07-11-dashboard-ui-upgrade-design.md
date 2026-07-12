# Dashboard UI Upgrade — Design Spec

**Date:** 2026-07-12 (updated)
**Approach:** A — Top Nav + Stats + AI Insight + Recent Entries
**Scope:** Layout/spacing polish + 4 new components + entrance animations
**Pencil file:** `soulscript.pen`
**Status:** Implemented in Pencil MCP

---

## Overview

Upgraded the Dashboard from a monolithic journal form into a complete, polished experience with responsive top navigation. Replaced the bottom navigation bar with a top navigation bar that works across desktop and mobile. Added 3 new components (Stats Row, AI Insight Preview, Recent Entries) and refined spacing, typography, glassmorphism, and entrance animations.

**Before:** Single `page.tsx` (307 lines) with greeting, textarea, character counter, submit button.

**After:** Full dashboard with top navigation, stats, AI insight preview, journal entry, and recent history.

---

## Final Layout Order (top to bottom)

```
┌─────────────────────────────────────────────────────┐
│  Status Bar                                          │
│  Top Nav (Logo + Nav Links + Active State)           │
│  ──────────────────────────────────────────────────  │
│  Greeting                                            │
│  Textarea (with glow)                                │
│  Release to Calendar button                          │
│  Stats Row (3 cards)                                 │
│  Motivation text                                     │
│  AI Insight Preview card                             │
│  Recent Entries (2 cards)                            │
└─────────────────────────────────────────────────────┘
```

---

## Design Tokens (existing, no changes needed)

All tokens are already defined in `soulscript.pen` variables:
- `$accent-primary: #818CF8`
- `$text-primary: #F5F5F5`, `$text-secondary: #94A3B8`, `$text-muted: #64748B`
- `$glass: #FFFFFF0D`, `$glass-border: #FFFFFF1A`, `$glass-strong: #FFFFFF14`
- `$radius-sm: 8`, `$radius-md: 12`, `$radius-lg: 16`, `$radius-xl: 24`, `$radius-pill: 9999`
- `$font-heading: Playfair Display`, `$font-body: Inter`

---

## Responsive Design Rules

### Breakpoints
| Token | Width | Description |
|-------|-------|-------------|
| Mobile | < 640px | Single column, compact spacing, max-width 390px |
| Tablet | 640px – 1024px | Single column, wider content, max-width 640px |
| Desktop | > 1024px | Single column centered, max-width 800px |

### Layout Behavior
- **Content container:** Always centered horizontally, max-width scales with breakpoint
- **Top Nav:** Full width at all sizes, logo visible on tablet+
- **Stats Row:** Always 3 cards in a row, cards grow wider on larger screens
- **AI Insight Card:** Full width at all sizes, more padding on desktop
- **Recent Entries:** Full width at all sizes, max-width capped at 800px

### Spacing Scale
| Token | Mobile | Tablet | Desktop |
|-------|--------|--------|---------|
| Page padding | 20px | 32px | 40px |
| Section gap | 28px | 32px | 36px |
| Card padding | 16px | 20px | 24px |
| Nav height | 56px | 60px | 64px |

### Typography Scale
| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Greeting | 28px | 32px | 36px |
| Subtitle | 16px | 17px | 18px |
| Nav links | 13px | 14px | 14px |
| Stat values | 20px | 22px | 24px |
| Body text | 14px | 15px | 15px |

### Desktop Layout (>= 1024px)
```
┌──────────────────────────────────────────────────────────────┐
│                    📖 SoulScript   Home Calendar Report Settings │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│              Good evening, Alex.                              │
│              How does your soul feel tonight?                │
│                                                              │
│    ┌──────────────────────────────────────────────┐          │
│    │         Write your thoughts here...           │          │
│    │                                               │          │
│    └──────────────────────────────────────────────┘          │
│                                                              │
│              [ Release to Calendar ]                          │
│                                                              │
│    ┌─────────┐ ┌─────────┐ ┌─────────┐                      │
│    │  🔥 3   │ │ 📅 12   │ │ 😌 Calm │                      │
│    │  streak │ │  July   │ │  mood   │                      │
│    └─────────┘ └─────────┘ └─────────┘                      │
│      keep going, you are doing great ✨                       │
│                                                              │
│    ┌──────────────────────────────────────────────┐          │
│    │  ✨  AI Insight Preview                       │          │
│    │  "You've been feeling more calm..."          │          │
│    │          [ View Insights → ]                  │          │
│    └──────────────────────────────────────────────┘          │
│                                                              │
│    ┌──────────────────────────────────────────────┐          │
│    │  😌 July 10, 2026              Calm          │          │
│    │  Today was a good day...                     │          │
│    └──────────────────────────────────────────────┘          │
│    ┌──────────────────────────────────────────────┐          │
│    │  🌙 July 9, 2026             Sadness         │          │
│    │  Had a rough night...                        │          │
│    └──────────────────────────────────────────────┘          │
│      View all entries →                                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Component 1: Top Navigation Bar

### What
Fixed top navigation with logo, horizontal nav links, and active state indicator. Responsive layout that adapts from mobile (compact) to desktop (full-width). Glassmorphism style matching the app's dark theme.

### Where
Fixed to top of viewport, full width. Sits below the Status Bar. Replaces both the old Header (settings icon) and Bottom Nav.

### Structure
- **Container:** Frame, horizontal layout, `justifyContent: space_between`, `alignItems: center`
- **Width:** `fill_container`
- **Height:** 56px
- **Background:** `rgba(11, 15, 25, 0.85)` with semi-transparent fill
- **Border bottom:** 1px `rgba(255, 255, 255, 0.06)`
- **Padding:** `[0, 20]`

### Layout
```
┌─────────────────────────────────────────────────────┐
│  📖 SoulScript    Home  Calendar  Report  Settings   │
│  (logo+name)     (nav links with active state)      │
└─────────────────────────────────────────────────────┘
```

### Left section: Logo + App Name
- **Logo:** 📖 emoji, 20px
- **App Name:** "SoulScript", Playfair Display, 16px, bold, `$text-primary`
- **Gap:** 8px between logo and name

### Center/Right section: Nav Links
- Horizontal layout, gap: 24px
- Each link: text only (no icons), Inter medium, 13px
- **Active link:** `$accent-primary` text, with underline indicator (2px, `$accent-primary`, bottom border)
- **Inactive link:** `$text-secondary` text, hover → `$text-primary`

### Nav Links
| Link | Route | Active Color | Inactive Color |
|------|-------|--------------|----------------|
| Home | `/` | `$accent-primary` | `$text-secondary` |
| Calendar | `/calendar` | `$accent-primary` | `$text-secondary` |
| Report | `/report` | `$accent-primary` | `$text-secondary` |
| Settings | `/settings` | `$accent-primary` | `$text-secondary` |

### Active state
- Text: `$accent-primary`, Inter semibold, 13px
- Underline: 2px solid `$accent-primary`, full width of text

### Inactive state
- Text: `$text-secondary`, Inter medium, 13px
- No underline
- Hover: `$text-primary`

### Responsive behavior
- **Mobile (< 640px):** Compact layout, logo + name visible, hamburger icon on right (replaces nav links). Height 56px. Tapping hamburger opens a dropdown menu with nav links.
- **Tablet (640px – 1024px):** Full layout with horizontal nav links, height 60px, padding [0, 32px]
- **Desktop (> 1024px):** Full layout, height 64px, padding [0, 40px], max-width 1200px centered, nav links 14px

### Mobile Hamburger Menu
- **Trigger:** Hamburger icon (3 horizontal lines), 20px, `$text-secondary`
- **Dropdown:** Glass card, vertical layout, gap 4, padding 8, cornerRadius `$radius-md`
- **Position:** Below the nav bar, right-aligned
- **Menu items:** Home, Calendar, Report, Settings — text only, 14px, `$text-secondary`
- **Active item:** `$accent-primary` text with left border indicator
- **Animation:** Slide down from top with opacity fade (200ms ease-out)

### Pencil IDs
- Top Nav (component): `gLJMH`
  - Logo Section: `PZzhE`, Logo Emoji: `akIVv`, App Name: `llFEB`
  - Hamburger Button: `wZvbR` (lines: `YKovF`, `dXggv`, `F7UJhA`)
  - Nav Links (tablet+): `YMnp5`
    - Tab Home: `jpe1x`, Home Label: `F80Hk`, Active Underline: `x2Oiz`
    - Tab Calendar: `jiwb4`, Calendar Label: `e78Cg`
    - Tab Report: `pV7rS`, Report Label: `eAAuV`
    - Tab Settings: `H9j07G`, Settings Label: `D1E5Y`
- Mobile Nav Dropdown: `DkU1m`
  - Menu Home: `b9ToL`, Active Indicator: `Y90joh`
  - Menu Calendar: `ZfJEq`
  - Menu Report: `AB1Yv`
  - Menu Settings: `uROkm`

---

## Component 2: Stats Row

### What
Horizontal row of 3 stat cards showing streak, entry count, and dominant mood. Cards are vertically centered and have subtle glow effects. Motivational text sits below.

### Where
Below the "Release to Calendar" button, above the motivation text.

### Visual Spec
```
┌──────────┐ ┌──────────┐ ┌──────────┐
│  🔥      │ │  📅      │ │  😌      │
│  3       │ │  12      │ │  Calm    │
│  day     │ │  July    │ │ dominant │
│  streak  │ │          │ │  mood    │
└──────────┘ └──────────┘ └──────────┘
  keep going, you are doing great ✨
```

### Structure
- **Container:** Frame, horizontal layout, `gap: 12`, `width: fill_container`, `alignItems: "center"`
- **Each card:** Frame, vertical layout, `gap: 4`, `alignItems: center`
  - `fill: $glass`
  - `stroke: $glass-border`, `strokeWidth: 1`
  - `cornerRadius: $radius-md` (12px)
  - `padding: [14, 12]`
  - `width: fill_container`
  - `effect: { type: "shadow", shadowType: "outer", offset: {x:0, y:0}, blur: 16, spread: 0, color: "#818CF815" }`

### Responsive behavior
- **Mobile (< 640px):** gap 12, padding [14, 12], stat values 20px
- **Tablet (640px – 1024px):** gap 16, padding [16, 16], stat values 22px
- **Desktop (> 1024px):** gap 20, padding [18, 20], stat values 24px

### Card content
| Card | Icon | Value | Label |
|------|------|-------|-------|
| Streak | `flame`, accent, 18px | "3", bold, 20px | "day streak", 11px |
| Entries | `calendar`, accent, 18px | "12", bold, 20px | "July", 11px |
| Mood | 😌 emoji, 20px | "Calm", bold, 16px | "dominant mood", 11px |

### Motivation text
- Below stats row, full width
- `"keep going, you are doing great ✨"`
- Inter, regular, 12px, `$text-muted`
- `textGrowth: fixed-width`, `width: fill_container`

### Pencil IDs
- Stats Row: `bO0oC`
- Streak Card: `h5JPWG`, Entries Card: `wHfrr`, Mood Card: `E7Os9`
- Motivation Text: `H7a7D`

---

## Component 3: AI Insight Preview Card

### What
A wide glass card that previews AI-powered journal insights. Features a dreamy cosmic orb illustration, a sample insight, and a "View Insights" CTA.

### Where
Below motivation text, above Recent Entries.

### Visual Spec
```
┌──────────────────────────────────────────┐
│    ✨                   AI Insight Preview │
│  (cosmic orb)                            │
│                                          │
│  "You've been feeling more calm and      │
│   reflective this week. You tend to      │
│   journal most in the evening."          │
│                                          │
│          [ View Insights → ]             │
└──────────────────────────────────────────┘
```

### Structure
- **Container:** Frame, vertical layout, `gap: 16`, `width: fill_container`
  - `fill: $glass`, `stroke: $glass-border`, `strokeWidth: 1`
  - `cornerRadius: $radius-xl` (24px), `padding: 20`

### Responsive behavior
- **Mobile (< 640px):** padding 20, gap 16
- **Tablet (640px – 1024px):** padding 24, gap 18
- **Desktop (> 1024px):** padding 28, gap 20, max-width 800px centered

### Layout inside card
- **Top section:** Horizontal, `justifyContent: space_between`, `alignItems: center`
  - Left: Cosmic orb (64px, radial gradient accent → transparent, blur 20px glow)
  - Right: Title stack — "AI Insight Preview" (15px semiBold) + "✨" (14px)
- **Insight text:** Inter regular, 14px, `$text-secondary`, lineHeight 1.6
- **CTA button:** "View Insights →", pill shape, `$accent-primary` fill, white text

### Cosmic Orb
- Ellipse 64x64, radial gradient `#818CF8` → `#6366F1` → transparent
- Blur effect radius 20px for glow
- Inner core ellipse 48x48 centered

### Pencil IDs
- AI Insight Card: `h3JkK`
- Cosmic Orb: `SHSIn`, Orb Glow: `dcT14`, Orb Core: `FmiAU`
- CTA Button: `cgTAK`

---

## Component 4: Recent Entries List

### What
Vertical stack of recent journal entry cards, showing mood, date, and truncated text.

### Where
Below AI Insight Card, above Bottom Nav.

### Visual Spec
```
┌──────────────────────────────┐
│  😌  July 10, 2026    Calm   │
│  ─────────────────────────── │
│  Today was a good day. I     │
│  felt calm and connected...  │
└──────────────────────────────┘
┌──────────────────────────────┐
│  🌙  July 9, 2026   Sadness  │
│  ─────────────────────────── │
│  Had a rough night. couldn't │
│  stop thinking about...      │
└──────────────────────────────┘
  View all entries →
```

### Structure
- **Container:** Frame, vertical layout, `gap: 12`, `width: fill_container`
- **Each card:** Frame, vertical layout, `gap: 12`
  - `fill: $glass`, `stroke: $glass-border`, `strokeWidth: 1`
  - `cornerRadius: $radius-lg` (16px), `padding: 16`
  - `width: fill_container`

### Responsive behavior
- **Mobile (< 640px):** gap 12, padding 16
- **Tablet (640px – 1024px):** gap 14, padding 18
- **Desktop (> 1024px):** gap 16, padding 20, max-width 800px centered

### Card layout
- **Header row:** mood emoji (20px) + date (12px, `$text-secondary`) | mood pill (mood color, 11px)
- **Divider:** 1px `rgba(255,255,255,0.06)`
- **Entry text:** Inter regular, 14px, `$text-primary`, lineHeight 1.6

### "View all entries →" link
- Inter medium, 13px, `$accent-primary`
- Below the entry cards

### Pencil IDs
- Recent Entries: `Akvqa`
- Entry Card 1: `f07wk`, Entry Card 2: `vO8WS`
- View All Link: `yBgZ4`

---

## Component 6: Footer

### What
Minimal footer with divider, navigation links, and copyright text. Appears at the bottom of all authenticated pages.

### Where
Below Recent Entries, at the bottom of the content area.

### Structure
- **Container:** Frame, vertical layout, `gap: 12`, `alignItems: center`, `padding: [20, 20]`
- **Width:** `fill_container`

### Elements
1. **Divider:** 1px `rgba(255, 255, 255, 0.06)`, full width
2. **Footer Links:** Horizontal layout, `gap: 20`, centered
   - Privacy, Terms, Help — Inter regular, 12px, `$text-muted`
3. **Copyright:** "© 2026 SoulScript. All rights reserved." — Inter regular, 11px, `$text-muted`, centered

### Responsive behavior
- Same layout at all sizes
- Links and text remain centered
- Padding scales: Mobile 20px, Tablet 32px, Desktop 40px

### Pencil IDs
- Footer Component: `PMqIi`
  - Divider: `WF7Ov`
  - Footer Links: `OpNwD`
  - Privacy Link: `yl4P3`, Terms Link: `toy8t`, Help Link: `uFvWa`
  - Copyright: `j9XAGs`
- Mobile Footer (instance): `eQJ2U`
- Desktop Footer (instance): `WaLpF`

---

## Removed: Bottom Navigation Bar

The bottom navigation bar has been replaced by the Top Navigation Bar (Component 1). The following Pencil nodes are deprecated:
- Bottom Nav: `jNPYZ`
- Tab Home: `udQaJ`, Tab Calendar: `Lkhz3`, Tab Report: `rKRaV`, Tab Settings: `ipXmm`

---

## Existing Components (unchanged)

### Status Bar
- Time "9:41", battery/signal icons
- Height: 62px, horizontal, `justifyContent: space_between`
- Pencil ID: `fQNA9`

### Header
- Settings icon on the right
- Pencil ID: `SNLKD`

### Greeting Section
- "Good evening, Alex." — Playfair Display, 28px, bold
- "How does your soul feel tonight?" — Inter, 16px, `$text-secondary`
- Pencil ID: `YHJKk`

### Journal Textarea
- Glass card with glow effect behind it
- Placeholder: "Write your thoughts here..."
- Character counter: "0 / 5000"
- Pencil ID: `z7yg7s` (glow layer), `JeHZ7` (counter)

### Release to Calendar Button
- Pill shape, `$accent-primary` fill, send icon + label
- Pencil ID: `x4DwL0`

---

## Component 5: Dreamy Background

### What
A decorative background layer behind all Dashboard content. Features a crescent moon, scattered stars (regular + bright accent + glow), and soft clouds. Creates a nighttime sanctuary atmosphere that matches the dark indigo theme.

### Where
Behind all content, inside the Dashboard frame. Uses `layoutPosition: "absolute"` to sit behind the vertical layout flow.

### Visual Spec
```
┌─────────────────────────────┐
│  ·  ·    ☆     ·  ·   🌙   │
│     ·  ☁️    ·     ·        │
│  ·     ·   ☆    ·     ·    │
│     ☁️    ·    ·  ☆     ·  │
│  ·    ·     ·     ·    ·   │
│     ·    ·    ☆    ·       │
│  ·    ☆     ·    ·    ·    │
│     ·    ·     ·    ☆   ·  │
└─────────────────────────────┘
```

### Elements
| Element | Count | Size | Fill | Effect |
|---------|-------|------|------|--------|
| Moon (outer glow) | 1 | 56px | radial gradient `#F5F5F540` → transparent | blur 10px |
| Moon (core) | 1 | 42px | radial gradient `#F5F5F5` → `#C8D0E0` → transparent | — |
| Moon (shadow) | 1 | 32px | `#0B0F19` (matches bg) | — |
| Regular stars | 20 | 3-4px | `#FFFFFF` | opacity 0.5-0.6 |
| Bright accent stars | 7 | 5-6px | `#818CF8` | blur 4px, opacity 0.6-0.7 |
| Glow stars | 3 | 5px | `#FFFFFF` | blur 3px, opacity 0.55 |
| Clouds | 2 | 110-130px | `#FFFFFF08` | blur 12-14px |

### Moon position
- Top right area: x=275, y=50
- Crescent created by overlaying a shadow ellipse on the core

### Star distribution
- Scattered across full 390x600 canvas
- Regular stars: random positions, small, subtle
- Bright stars: accent color (`#818CF8`), larger, with blur glow
- Glow stars: white, medium, with blur for shimmer effect

### Clouds
- Soft translucent shapes using SVG path geometry
- Blurred for a dreamy, out-of-focus look
- Positioned at y=130 and y=310

### Animation (code implementation)
Pencil is static — twinkle animation must be implemented in CSS/Framer Motion:

```css
@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes twinkle-slow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

.star {
  animation: twinkle 3s ease-in-out infinite;
}

.bright-star {
  animation: twinkle 2s ease-in-out infinite;
  filter: drop-shadow(0 0 4px #818CF8);
}

.glow-star {
  animation: twinkle-slow 4s ease-in-out infinite;
}
```

**Stagger delays** for natural randomness:
```css
.star:nth-child(odd) { animation-delay: 0s; }
.star:nth-child(even) { animation-delay: 1.5s; }
.bright-star:nth-child(1) { animation-delay: 0s; }
.bright-star:nth-child(2) { animation-delay: 0.7s; }
.bright-star:nth-child(3) { animation-delay: 1.4s; }
/* ... etc, spread across 0-2s range */
```

**Moon glow pulse** (optional):
```css
@keyframes moon-glow {
  0%, 100% { filter: blur(10px) brightness(1); }
  50% { filter: blur(12px) brightness(1.1); }
}
```

**Reduced motion:**
```css
@media (prefers-reduced-motion: reduce) {
  .star, .bright-star, .glow-star {
    animation: none;
    opacity: 0.5;
  }
}
```

### Pencil IDs
- Dreamy Background: `kLuxo`
- Moon: `k64fz`, Moon Core: `BL8sz`, Moon Shadow: `SD4BK`
- Cloud 1: `tbNSk`, Cloud 2: `DhXCu`
- Regular stars: `U4m5zB` through `SLW6J` (20 nodes)
- Bright stars: `iEkgd` through `Upe0E` (7 nodes)
- Glow stars: `fkptQ`, `y1WBz6`, `xFtbM` (3 nodes)

---

## Pencil MCP Node IDs (complete reference)

```
Dashboard Frame:        TzWN4
Content Wrapper:        vKLAA
Status Bar:             fQNA9
Top Nav (component):    gLJMH
Top Nav (instance):     H3Wt7A
  Logo:                 akIVv (emoji) + llFEB (text)
  Nav Links:            YMnp5
  Active Indicator:     x2Oiz
Header:                 SNLKD (deprecated — replaced by Top Nav)
Greeting Section:       YHJKk
Glow Layer (textarea):  z7yg7s
Character Counter:      JeHZ7
Button Row:             x4DwL0
Stats Row:              bO0oC
  Streak Card:          h5JPWG
  Entries Card:         wHfrr
  Mood Card:            E7Os9
Motivation Text:        H7a7D
AI Insight Card:        h3JkK
  Cosmic Orb:           SHSIn
  CTA Button:           cgTAK
Recent Entries:         Akvqa
  Entry Card 1:         f07wk
  Entry Card 2:         vO8WS
  View All Link:        yBgZ4
Bottom Nav:             jNPYZ (deprecated — replaced by Top Nav)
  Tab Home:             udQaJ
  Tab Calendar:         Lkhz3
  Tab Report:           rKRaV
  Tab Settings:         ipXmm
Dreamy Background:      kLuxo
  Moon:                 k64fz
  Moon Core:            BL8sz
  Moon Shadow:          SD4BK
  Cloud 1:              tbNSk
  Cloud 2:              DhXCu
  Stars (20):           U4m5zB — SLW6J
  Bright Stars (7):     iEkgd — Upe0E
  Glow Stars (3):       fkptQ, y1WBz6, xFtbM
```

---

## File references
- Pencil design: `soulscript.pen`
- Current dashboard: `src/app/page.tsx`
- Components: `src/components/`
- Design tokens: `soulscript.pen` variables
- Mood themes: `src/lib/mood-themes.ts`

---

## Desktop Dashboard (Pencil IDs)

```
Dashboard Desktop:       N54tyf
Desktop Top Nav:         dw09i
  Logo Section:          xBF8s
  Logo Emoji:            beccK
  App Name:              TCQi7
  Nav Links:             e3L5kf
  Tab Home:              h1pRyi
  Tab Calendar:          P9g4h
  Tab Report:            nSs0E
  Tab Settings:          Pxa6x
Desktop Content Wrapper: AGC34
Content Container:       W1tE7
Greeting Section:        EK9Z9
  Greeting Title:        DcUgd
  Greeting Subtitle:     RwT9E
Textarea Wrapper:        dwCMO
  Textarea Glow:         M2toM8
  Textarea Card:         f4Aih
Character Counter:       i1CxwV
Button Row:              E3GBU
  Submit Button:         ux6av
Stats Row:               FThbh
  Streak Card:           v40UzF
  Entries Card:          Gx5x2
  Mood Card:             h8hGNQ
Motivation Text:         b4voZ
AI Insight Card:         HPtOr
  Cosmic Orb:            x6nvi + ZLGFE
  CTA Button:            GdQKn
Recent Entries:          v4FHZm
  Entry Card 1:          fRLp3
  Entry Card 2:          f1S8g7
  View All Link:         M2wSKZ
Desktop Dreamy Background: jBUXv
  Moon:                 JPqEY
  Moon Core:            DcKQz
  Moon Shadow:          UFxEG
  Cloud 1:              Tz8Id
  Cloud 2:              dt7YM
  Stars (20):           aKq02 — hixYy
  Bright Stars (7):     b2Rj3g — fHmCS
  Glow Stars (3):       TArjm, ODnqr, bagqs
```

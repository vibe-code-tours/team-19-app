# Glassmorphism Design System & CSS Animations

## Overview

SoulScript uses a dark glassmorphism design system built on Tailwind CSS 4. The design features semi-transparent glass panels, breathing mood glow animations, a dreamy starfield background, and accessibility support for reduced motion.

## Tailwind CSS 4 Theme (`src/app/globals.css`)

### Theme Variables

```css
@import "tailwindcss";

@theme inline {
  --color-background: #0B0F19;
  --color-foreground: #F5F5F5;
  --color-midnight: #1E1B4B;
  --color-glass: rgba(255, 255, 255, 0.05);
  --color-glass-border: rgba(255, 255, 255, 0.1);
  --color-glass-strong: rgba(255, 255, 255, 0.08);
  --color-text-primary: #F5F5F5;
  --color-text-secondary: #94A3B8;
  --color-text-muted: #64748B;
  --color-accent: #818CF8;
  --color-accent-glow: #6366F1;
  --font-heading: "Playfair Display", Georgia, serif;
  --font-body: "Inter", system-ui, sans-serif;
}
```

- `@theme inline` defines Tailwind CSS 4 custom theme tokens
- Colors are used as `text-text-primary`, `bg-glass`, `border-glass-border`, etc.
- Fonts are applied via `font-[family-name:var(--font-playfair)]` in components

## Glassmorphism Classes

### `.glass`

```css
.glass {
  background: var(--color-glass);
  border: 1px solid var(--color-glass-border);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}
```

- 5% white background + 10% white border
- 24px backdrop blur for frosted glass effect
- `-webkit-` prefix for Safari support

### `.glass-strong`

Same as `.glass` but with 8% white background (slightly more opaque).

### Where Used

- Calendar day cells, bottom sheet, entry cards
- Undo toast, error states, mood picker
- Monthly report stages, settings cards

## Mood Glow Animation

```css
.mood-glow {
  background: radial-gradient(
    ellipse at center,
    rgba(99, 102, 241, 0.15) 0%,
    rgba(99, 102, 241, 0.05) 50%,
    transparent 100%
  );
  animation: breathe 4s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.02); }
}
```

- Radial gradient with indigo accent color
- Pulses between 60-100% opacity and 100-102% scale
- 4-second cycle creates a gentle "breathing" effect
- Applied as a background layer behind the textarea (`absolute inset-0`)

## Skeleton Loading Shimmer

```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

- Three-stop gradient with white opacity
- Background position animates from -200% to 200%, creating a sweeping highlight
- Used for loading states in calendar, dashboard, and report

## Dreamy Background System

### Stars

```css
.star { animation: twinkle 3s ease-in-out infinite; }
.bright-star { animation: twinkle 2s ease-in-out infinite; filter: drop-shadow(0 0 4px #818CF8); }
.glow-star { animation: twinkle-slow 4s ease-in-out infinite; filter: blur(1px); }

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes twinkle-slow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
```

Three star types with different speeds and effects:
- `.star` — standard twinkle (3s)
- `.bright-star` — faster twinkle (2s) with indigo glow
- `.glow-star` — slow fade (4s) with blur for depth

### Clouds

```css
.cloud {
  background: rgba(255, 255, 255, 0.03);
  filter: blur(12px);
  border-radius: 50%;
}
```

Near-invisible, heavily blurred circles for atmospheric depth.

### Background Gradient

```css
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, #0B0F19 0%, #1E1B4B 50%, #0B0F19 100%);
  z-index: -1;
}
```

Three-stop vertical gradient: dark → midnight indigo → dark. Creates depth behind all content.

## Fade-in-Up Animation

```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out forwards;
}
```

Utility class for one-time entrance animations.

## Accessibility: Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .star, .bright-star, .glow-star {
    animation: none;
    opacity: 0.5;
  }
}
```

Disables all star animations and sets a static opacity when the user has `prefers-reduced-motion` enabled. This respects the user's OS-level accessibility setting.

## Responsive Scaling

```css
@media (min-width: 1024px) {
  .moon { width: 72px !important; height: 72px !important; }
  .cloud { height: 44px !important; }
}
```

Desktop gets larger decorative elements. Uses `!important` to override inline styles set by JavaScript.

## Body Height Fix

```css
html, body {
  min-height: 100vh;
  min-height: 100dvh;  /* dynamic viewport height — accounts for mobile browser chrome */
}
```

`100dvh` prevents the "jump" on mobile browsers when the URL bar appears/disappears.

## Key Decisions

- **5% white glass** — subtle enough for dark theme, visible enough for depth
- **24px blur** — strong enough for frosted effect without performance issues
- **Indigo accent** (#818CF8) — consistent mood glow and star highlights
- **`prefers-reduced-motion`** — respects accessibility; stars become static
- **`dvh` unit** — handles mobile browser chrome properly
- **CSS animations over JS** — GPU-accelerated, no React re-renders

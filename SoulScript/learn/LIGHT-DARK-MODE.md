# Light/Dark Mode Theme Toggle

## Overview

SoulScript supports light and dark mode with a manual toggle in Settings. Uses `next-themes` for theme management and CSS variables for colors.

## Architecture

- **`next-themes`** — handles theme state, localStorage, system preference
- **`@theme`** — defines light mode defaults as CSS custom properties (runtime)
- **`html.dark` overrides** — redefines variables for dark mode (no `!important` needed)

## Key Files

| File | Purpose |
|------|---------|
| `src/app/globals.css` | Theme variables + dark mode overrides |
| `src/app/layout.tsx` | ThemeProvider wrapper |
| `src/components/Providers.tsx` | Reads localStorage on mount |
| `src/app/settings/page.tsx` | Appearance toggle using `useTheme()` |

## Theme Setup

### layout.tsx

```tsx
import { ThemeProvider } from "next-themes";

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

- `attribute="class"` — adds `dark` class to `<html>`
- `defaultTheme="system"` — follows OS preference
- `enableSystem` — listens for system preference changes

### globals.css

```css
/* Light mode defaults */
@theme {
  --color-text-primary: #1E1B4B;
  --color-text-secondary: #475569;
  --color-text-muted: #94A3B8;
  --color-glass: rgba(255, 255, 255, 0.8);
}

/* Dark mode overrides */
html.dark {
  --color-text-primary: #F0EDF6;
  --color-text-secondary: #8B8AA0;
  --color-text-muted: #5A5970;
  --color-glass: rgba(255, 255, 255, 0.03);
}
```

## Why `@theme` (not `@theme inline`)?

Tailwind CSS 4 offers two ways to define theme variables:

- **`@theme inline`** — compiles utility classes with hardcoded values at build time. CSS custom properties are defined but utilities ignore them:
  ```css
  /* Generated: hardcoded value, not var() */
  .text-text-primary { color: #1E1B4B; }
  ```
  Runtime overrides (like `html.dark`) can't change these without `!important`.

- **`@theme`** — keeps variables as CSS custom properties. Utility classes reference them via `var()`:
  ```css
  /* Generated: references the custom property */
  .text-text-primary { color: var(--color-text-primary); }
  ```
  When `html.dark` redefines the variable, utilities pick up the new value automatically. No `!important` needed.

## Toggle Component

```tsx
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

const { theme, setTheme } = useTheme();
const [mounted, setMounted] = useState(false);

useEffect(() => setMounted(true), []);

{mounted && (
  <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
    {theme === "dark" ? "Dark mode" : "Light mode"}
  </button>
)}
```

- `mounted` check prevents hydration mismatch
- `useTheme()` handles localStorage and DOM updates

## How It Works

1. **First visit**: follows system preference (`prefers-color-scheme`)
2. **User toggles**: saves to localStorage, adds/removes `dark` class
3. **Page reload**: reads localStorage, applies saved theme
4. **CSS variables**: update immediately when class changes

## Theme Colors

### Light Mode (default)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-text-primary` | `#1E1B4B` | Headings, labels |
| `--color-text-secondary` | `#475569` | Body text |
| `--color-text-muted` | `#94A3B8` | Captions, hints |
| `--color-glass` | `rgba(255, 255, 255, 0.8)` | Card backgrounds |
| `--color-glass-border` | `#E0D6FF` | Card borders |
| `--color-background` | `#EDE9FE` | Page background |

### Dark Mode (`html.dark`)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-text-primary` | `#F0EDF6` | Headings, labels |
| `--color-text-secondary` | `#8B8AA0` | Body text |
| `--color-text-muted` | `#5A5970` | Captions, hints |
| `--color-glass` | `rgba(255, 255, 255, 0.03)` | Card backgrounds |
| `--color-glass-border` | `rgba(255, 255, 255, 0.08)` | Card borders |
| `--color-background` | `#0B0F19` | Page background |

## Key Decisions

- **`next-themes`** — production-ready, handles SSR/SSG, no FOUC
- **Light mode default** — matches soulscript.pen design
- **`@theme` over `@theme inline`** — keeps variables as custom properties so `html.dark` overrides work without `!important`
- **`mounted` check** — prevents hydration mismatch in React
- **System preference fallback** — respects OS when no explicit choice

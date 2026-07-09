# SoulScript Implementation Learnings

## Session Date: 2026-07-08

---

## 1. Architecture Decisions

### Tech Stack Choice
| Decision | Choice | Why |
|----------|--------|-----|
| Framework | Next.js 16 (App Router) | SSR for auth, API routes, React Server Components |
| Styling | Tailwind CSS 4 | Rapid prototyping, consistent design tokens |
| Database | Supabase (PostgreSQL) | Built-in auth, RLS, real-time subscriptions |
| AI | OpenAI + OpenRouter fallback | Resilience via provider fallback pattern |
| State | TanStack Query (planned) | Optimistic updates, caching, background refetch |
| Animation | Framer Motion | Layout morphing, AnimatePresence for toasts |
| Testing | Vitest | Fast, TypeScript-native, ESM-first |

### Design System
- **Fonts:** Playfair Display (headings) + Inter (body) — serif journal feel
- **Colors:** Deep midnight gradient (#0B0F19 → #1E1B4B) with glassmorphism
- **Glass effect:** `bg-white/5 backdrop-blur-xl border border-white/10`
- **Design tool:** Pencil MCP for visual design before code

---

## 2. Implementation Flow

### GSD Approach (What We Should Have Done)
1. ✅ Read SPEC.md thoroughly
2. ✅ Design screens in Pencil MCP (7 screens)
3. ⚠️ Should have used `/gsd-execute-phase` for structured implementation
4. ✅ Built features sequentially with verification

### What Actually Happened
1. **Design Phase:** Created 7 Pencil screens (Dashboard, Calendar, Overlay, Report, Login, Settings, 404)
2. **Setup Phase:** Next.js init, dependencies, directory structure
3. **Core Libraries:** Encryption, mood-themes, language detection
4. **Auth:** Login, signup, callback, proxy (middleware)
5. **Dashboard:** Main page with greeting, textarea, undo toast
6. **API Routes:** analyze, report, entries/[id], profile, account
7. **Calendar:** MoodCalendar component with overlay
8. **Settings:** Profile, language toggle, delete account
9. **Tests:** 16 unit tests passing

---

## 3. Key Learnings

### Next.js 16 Breaking Changes
- **`middleware.ts` → `proxy.ts`**: The middleware convention is deprecated. Use `proxy.ts` with `export function proxy()` instead of `export function middleware()`
- **Supabase client is async**: `createClient()` returns a Promise in Next.js 16 — must `await` it
- **Static generation + env vars**: Pages with Supabase client at module level fail at build time. Use `export const dynamic = "force-dynamic"` or lazy-load env vars

### Encryption Module
- **Don't initialize crypto at module level**: `Buffer.from(process.env.KEY, 'hex')` runs at import time and fails if env var is missing
- **Solution:** Lazy-load via a `getKey()` function that reads `process.env` at call time

### React Patterns
- **Avoid setState in effects**: ESLint rules flag synchronous `setState` calls in effect bodies. Use functional updates or restructure to avoid cascading renders
- **Toast countdown pattern**: Instead of `if (countdown <= 0) setToast(null)` in effect, handle termination inside the functional update: `return prev.countdown <= 1 ? null : { ...prev, countdown: prev.countdown - 1 }`

### Pencil MCP Design
- **Glassmorphism without backdrop-blur**: Pencil doesn't support CSS backdrop-blur on canvas. Simulate with semi-transparent fills + borders
- **Glow effects**: Use radial gradients with low opacity + blur filter on separate rectangles
- **findEmptySpace**: Always call first when placing root-level frames to avoid overlaps
- **placeholder: true**: Required on new root frames during creation, remove when done

---

## 4. File Structure

```
SoulScript/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard (main)
│   │   ├── layout.tsx            # Root layout with fonts
│   │   ├── globals.css           # Tailwind + glassmorphism styles
│   │   ├── not-found.tsx         # 404 page
│   │   ├── login/page.tsx        # Login with Google + email
│   │   ├── signup/page.tsx       # Signup with validation
│   │   ├── settings/page.tsx     # Profile, language, delete
│   │   ├── calendar/page.tsx     # Calendar wrapper
│   │   ├── auth/callback/        # OAuth callback handler
│   │   └── api/
│   │       ├── analyze/route.ts  # AI sentiment analysis
│   │       ├── report/route.ts   # Monthly report generation
│   │       ├── entries/[id]/     # Mood override + soft delete
│   │       ├── profile/route.ts  # User profile CRUD
│   │       └── account/route.ts  # Account deletion
│   ├── components/
│   │   └── MoodCalendar.tsx      # Calendar with overlay
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts         # Server-side Supabase client
│   │   │   └── client.ts         # Browser Supabase client
│   │   ├── encryption.ts         # AES-256-GCM encrypt/decrypt
│   │   ├── mood-themes.ts        # Mood theme validation
│   │   └── language.ts           # Burmese/English detection
│   └── proxy.ts                  # Auth middleware (Next.js 16)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── __tests__/
│   └── lib/
│       ├── encryption.test.ts
│       ├── mood-themes.test.ts
│       └── language.test.ts
├── soulscript.pen                # Pencil design file
├── SPEC.md                       # MVP specification
└── .env.example                  # Environment variables
```

---

## 5. What's Missing (Per SPEC)

| Feature | Status | Notes |
|---------|--------|-------|
| TanStack Query integration | ❌ | Dashboard uses raw fetch + useState |
| Calendar month navigation transitions | ⚠️ | Basic prev/next, no animated transitions |
| Bottom sheet on mobile | ⚠️ | Uses fixed overlay, not native bottom sheet |
| Report UI component | ⚠️ | API exists, no dedicated page component |
| Framer Motion page transitions | ⚠️ | Used in toasts/overlays, not page-level |
| Rate limit error UX | ✅ | API returns 429, UI shows error |
| Character counter warning | ✅ | Warns at 4500, hard stops at 5000 |
| Skeleton loading states | ✅ | Dashboard and calendar have skeletons |
| Language toggle persistence | ✅ | PATCH /api/profile updates preferred_language |
| Account deletion cascade | ✅ | Deletes entries, reports, profile, signs out |

---

## 6. Testing Strategy

### What's Tested
- **Encryption:** Roundtrip, different IVs, empty string, unicode, long text
- **Mood Themes:** Theme count, gradient format, validation, fallback
- **Language Detection:** Burmese, English, empty, mixed, numbers

### What Needs Tests (Future)
- API route integration tests (mock Supabase)
- Dashboard submit flow (mock fetch)
- Calendar entry rendering
- Settings profile update flow
- Auth redirect logic in proxy

---

## 7. Design Tokens Reference

```css
/* Colors */
--background: #0B0F19        /* Deep midnight */
--color-midnight: #1E1B4B    /* Gradient end */
--color-glass: rgba(255,255,255,0.05)
--color-glass-border: rgba(255,255,255,0.1)
--color-accent: #818CF8      /* Indigo-400 */
--color-text-primary: #F5F5F5
--color-text-secondary: #94A3B8
--color-text-muted: #64748B

/* Typography */
--font-heading: "Playfair Display"
--font-body: "Inter"

/* Glassmorphism */
.glass {
  background: var(--color-glass);
  border: 1px solid var(--color-glass-border);
  backdrop-filter: blur(24px);
}
```

---

## 8. Commands Reference

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint check
npm run test         # Vitest run
npm run test:coverage # Coverage report
```

---

## 9. Environment Setup

```bash
# Generate encryption key
openssl rand -hex 32

# Required env vars (see .env.example)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENROUTER_API_KEY=
ENCRYPTION_KEY=
```

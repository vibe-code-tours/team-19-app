# SoulScript Implementation Learnings

## Session Date: 2026-07-08 (Updated: 2026-07-09)

---

## 1. Architecture Decisions

### Tech Stack Choice
| Decision | Choice | Why |
|----------|--------|-----|
| Framework | Next.js 16 (App Router) | SSR for auth, API routes, React Server Components |
| Styling | Tailwind CSS 4 | Rapid prototyping, consistent design tokens |
| Database | Supabase (PostgreSQL) | Built-in auth, RLS, real-time subscriptions |
| AI | OpenRouter (free tier) | No-cost AI inference via OpenAI SDK with custom base URL |
| State | API routes with server-side decryption | Secure data fetching, encryption key never exposed to client |
| Animation | Framer Motion | Layout morphing, AnimatePresence for toasts |
| Testing | Vitest | Fast, TypeScript-native, ESM-first |

### Design System
- **Fonts:** Playfair Display (headings) + Inter (body) — serif journal feel
- **Colors:** Deep midnight gradient (#0B0F19 → #1E1B4B) with glassmorphism
- **Glass effect:** `bg-white/5 backdrop-blur-xl border border-white/10`
- **Design tool:** Pencil MCP for visual design before code

---

## 2. Implementation Flow

### What Actually Happened
1. **Design Phase:** Created 7 Pencil screens (Dashboard, Calendar, Overlay, Report, Login, Settings, 404)
2. **Setup Phase:** Next.js init, dependencies, directory structure
3. **Core Libraries:** Encryption, mood-themes, language detection
4. **Auth:** Login, signup, callback, proxy (middleware)
5. **Dashboard:** Main page with greeting, textarea, undo toast
6. **API Routes:** analyze, report, entries, entries/[id], profile, account
7. **Calendar:** MoodCalendar component with overlay (server-side decryption)
8. **Settings:** Profile with Google avatar, language toggle, delete account
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
- **Server-side only**: `ENCRYPTION_KEY` is not exposed to client (no `NEXT_PUBLIC_` prefix). All decryption must happen server-side via API routes.

### OpenRouter Integration
- **Use OpenAI SDK with custom base URL**: OpenRouter is OpenAI-compatible, so use `new OpenAI({ baseURL: "https://openrouter.ai/api/v1" })` instead of raw fetch
- **Strip markdown code blocks**: Some models return JSON wrapped in ````json ... ````. Parse with regex to clean before `JSON.parse()`
- **Free tier models**: `meta-llama/llama-3-8b-instruct` works well for sentiment analysis

### Account Deletion
- **Service role key required**: `supabase.auth.admin.deleteUser()` needs `SUPABASE_SERVICE_ROLE_KEY`, not the anon key
- **Create separate admin client**: Use `createClient` from `@supabase/supabase-js` (not `@supabase/ssr`) with service role key for admin operations

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
│   │   ├── settings/page.tsx     # Profile with Google avatar, language, delete
│   │   ├── calendar/page.tsx     # Calendar wrapper
│   │   ├── auth/callback/        # OAuth callback handler
│   │   └── api/
│   │       ├── analyze/route.ts  # AI sentiment analysis (OpenRouter)
│   │       ├── report/route.ts   # Monthly report generation (OpenRouter)
│   │       ├── entries/route.ts  # Fetch entries with server-side decryption
│   │       ├── entries/[id]/     # Mood override + soft delete
│   │       ├── profile/route.ts  # User profile CRUD
│   │       └── account/route.ts  # Account deletion (with auth user)
│   ├── components/
│   │   ├── MoodCalendar.tsx      # Calendar with overlay
│   │   ├── MonthlyReport.tsx     # Report display component
│   │   └── Providers.tsx         # TanStack Query provider
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
| Report UI component | ✅ | MonthlyReport component with 3-stage layout |
| Framer Motion page transitions | ⚠️ | Used in toasts/overlays, not page-level |
| Rate limit error UX | ✅ | API returns 429, UI shows error |
| Character counter warning | ✅ | Warns at 4500, hard stops at 5000 |
| Skeleton loading states | ✅ | Dashboard and calendar have skeletons |
| Language toggle persistence | ✅ | PATCH /api/profile updates preferred_language |
| Account deletion cascade | ✅ | Deletes entries, reports, profile, auth user |
| Google profile avatar | ✅ | Settings shows Google OAuth avatar |
| Server-side decryption | ✅ | Calendar fetches via API route with decryption |

---

## 6. Testing Strategy

### What's Tested
- **Encryption:** Roundtrip, different IVs, empty string, unicode, long text
- **Mood Themes:** Theme count, gradient format, validation, fallback
- **Language Detection:** Burmese, English, empty, mixed, numbers
- **MonthlyReport Component:** Renders all 3 sections, handles edge cases

### What Needs Tests (Future)
- API route integration tests (mock Supabase)
- Dashboard submit flow (mock fetch)
- Calendar entry rendering via API
- Settings profile update flow
- Auth redirect logic in proxy
- Account deletion with auth user removal

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
OPENROUTER_API_KEY=
ENCRYPTION_KEY=
```

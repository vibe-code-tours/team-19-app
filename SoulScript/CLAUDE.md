<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SoulScript — Project Guide

## Overview
SoulScript is a micro-journaling and mood-mapping app. Users write short journal entries; AI analyzes emotion/mood; results are displayed on an interactive calendar with monthly reports.

## Tech Stack
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS 4, glassmorphism dark theme
- **Animation:** Framer Motion
- **Database/Auth:** Supabase (PostgreSQL + Auth + RLS) via `@supabase/ssr` + `@supabase/supabase-js`
- **AI:** OpenRouter (Llama 3 8B) via OpenAI SDK with structured JSON outputs
- **Data Fetching:** TanStack React Query (v5)
- **Testing:** Vitest + @testing-library/react
- **Path alias:** `@/` → `./src/`

## Project Structure
```
src/
  app/
    api/           # Route handlers (analyze, report, entries, profile, account)
    auth/          # OAuth callback
    calendar/      # Main calendar page
    login/         # Login page
    signup/        # Signup page
    settings/      # User settings
    layout.tsx     # Root layout
    page.tsx       # Landing/redirect
  components/      # Shared React components
  lib/
    encryption.ts  # AES-256-GCM for journal content
    language.ts    # i18n helpers
    mood-themes.ts # Mood → gradient/theme mappings
    supabase/      # Client + server Supabase utilities
  proxy.ts         # Middleware: protects /api/* routes
supabase/
  migrations/      # SQL migrations (no Prisma)
__tests__/         # Unit/integration tests (mirrors src/ structure)
```

## Key Patterns
- **Auth:** Supabase session in cookies. `proxy.ts` middleware protects all `/api/*` routes. `userId` extracted server-side from session, never trusted from client body.
- **Encryption:** Journal content encrypted with AES-256-GCM before DB storage. Decryption happens server-side only.
- **Rate Limiting:** Max 10 journal entries per user per day, checked server-side before AI calls.
- **AI Responses:** Always `response_format: json_object` for structured output. Validate on client.
- **Monthly Reports:** 3-stage layout — Big Picture → Pattern Recognition → Actionable Frameworks.
- **Data Fetching:** Use TanStack Query hooks. API routes handle Supabase queries server-side.

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest
npm run test:coverage # Vitest with coverage
```

## Conventions
- Use `@/` path alias for all imports from `src/`.
- Keep components in `src/components/`. Route-specific logic stays in `src/app/`.
- All Supabase queries go through `src/lib/supabase/` utilities.
- Encrypted fields: use `encryption.ts` helpers, never store plaintext journal content.
- Tests live in `__tests__/` mirroring the `src/` structure.
- SQL migrations go in `supabase/migrations/` — no ORM.

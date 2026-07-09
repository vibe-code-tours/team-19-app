# Requirements

Source: SPEC.md (primary), PLAN.md (phase details)

## R1: Authentication
- Google OAuth + Email/Password via Supabase Auth
- Pages: /login, /signup, /auth/callback
- Proxy (middleware) protects /api/* and /settings
- Session stored in cookies via @supabase/ssr
- Auto-create user_profiles on signup via DB trigger

## R2: Database
- Tables: journal_entries, monthly_reports, user_profiles
- Row-Level Security on all tables
- SQL migrations in /supabase/migrations/
- Soft delete for journal entries (deleted_at)

## R3: Encryption
- AES-256-GCM for journal content
- Unique IV per entry
- ENCRYPTION_KEY in env var (lazy-loaded)

## R4: Language Detection
- Burmese (U+1000-U+109F) vs English detection
- User default in profile, per-entry override
- AI uses single bilingual prompt

## R5: Dashboard
- Dynamic time-based greeting
- Auto-resizing textarea with breathing glow
- Character counter (warn 4500, max 5000)
- "Release to Calendar" button (min 10 chars)
- Undo toast with 4-second countdown

## R6: AI Sentiment Analysis
- POST /api/analyze with { content }
- Returns: primary_emotion, emoji, secondary_emotions, glow_theme
- OpenAI primary, OpenRouter fallback
- Structured outputs (JSON schema)
- Validate glow_theme against MOOD_THEMES allowlist

## R7: Mood Calendar
- Month grid with emoji circles for logged days
- Dotted rings for empty days
- Click logged day → overlay with entry details
- Mood picker (PATCH /api/entries/[id])
- Month navigation

## R8: Monthly Report
- Trigger: "Reveal This Month's Journey" card
- Minimum 10 entries required
- 3-stage layout: Big Picture → Pattern Recognition → Actionable Frameworks
- Staggered Framer Motion animations
- POST /api/report with { month: "YYYY-MM" }
- Upserts (no duplicates on re-generation)

## R9: Settings
- Profile section (display name, email, avatar)
- Language toggle (Burmese/English)
- Danger zone: delete account with confirmation modal
- Requires typing "DELETE" to confirm

## R10: 404 Page
- Glassmorphism card centered
- "Lost in the sanctuary?" heading
- Return Home button

## R11: Rate Limiting
- Max 10 journal entries per user per day
- HTTP 429 with message

## R12: Testing
- Unit tests for API routes, utilities, edge cases
- Vitest framework
- Test files in __tests__/

## R13: Responsive Design
- Mobile-first (375px minimum)
- Breakpoints: sm (640px), md (768px), lg (1024px)
- No hamburger menu — single-page experience
- Bottom sheet on mobile for calendar overlay

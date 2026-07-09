# SoulScript

A micro-journaling & mood mapping app — your digital sanctuary for self-reflection and emotional awareness.

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19)
- **Database & Auth:** Supabase (Google OAuth + email)
- **AI:** OpenRouter (free tier) — mood analysis and sentiment insights
- **Styling:** Tailwind CSS 4 + glassmorphism design system
- **Animation:** Framer Motion
- **Testing:** Vitest + Testing Library
- **Encryption:** AES-256-GCM (server-side entry decryption)
- **Design:** 7-screen prototype in Pencil MCP (`soulscript.pen`)

## Features

- **Journaling** — write micro-entries with undo support
- **Mood Analysis** — AI-powered sentiment detection and mood mapping
- **Mood Calendar** — visual monthly overview of your emotional landscape
- **Monthly Report** — AI-generated insights on your journaling patterns
- **Settings** — profile with Google avatar, language toggle (EN/MM), account management
- **Encryption** — AES-256-GCM encryption for entry privacy (decrypted server-side)
- **404 Page** — glassmorphism-styled not-found experience

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (database + auth)
- An [OpenRouter](https://openrouter.ai) API key (free tier available)

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd SoulScript

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase and OpenRouter credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests with Vitest
npm run test:coverage # Run tests with coverage
```

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes (analyze, report, entries, profile, account)
│   ├── auth/callback/    # Supabase OAuth callback handler
│   ├── calendar/         # Mood calendar page
│   ├── login/            # Login page
│   ├── settings/         # Settings page
│   └── signup/           # Signup page
├── components/           # MoodCalendar, MonthlyReport, Providers
├── lib/                  # Utilities (encryption, mood-themes, language, Supabase clients)
└── proxy.ts             # Route protection middleware
```

## Deployment

Deploy to [Vercel](https://vercel.com/new) — the easiest option for Next.js apps.

```bash
npm run build
```

Check out the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for more options.

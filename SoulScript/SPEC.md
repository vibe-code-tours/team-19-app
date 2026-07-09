# MVP Specification: "SoulScript" Micro-Journaling & Mood Mapping App

## 1. Project Vision & Aesthetic
SoulScript is a stunning, minimalist "digital sanctuary" for emotional tracking and mindful reflection.

* **Aesthetic Theme:** Cozy Glassmorphism / Therapeutic Dark Mode.
* **Color Palette:** Deep midnight blue background (`#0B0F19` transitioning to `#1E1B4B`) with semi-transparent frosted-glass UI containers (`bg-white/5 backdrop-blur-xl border border-white/10`).
* **Visual Effects:** Dynamic background radial glows (`shadow-[0_0_80px_rgba(...)]`) that shift soft hue spectrums based on the logged or active mood state.
* **Typography:** Elegant serif typeface for headings (e.g., *Lora* or *Playfair Display*) to invoke a traditional journal feel, paired with an ultra-clean sans-serif (e.g., *Inter*) for high legibility in body copy and metadata.
* **Motion Design:** Fluid, organic micro-interactions powered by custom timing configurations to create a relaxing, high-end therapeutic UX.

---

## 2. Technical Stack (MVP Scope)
* **Frontend Framework:** Next.js 16 (React 19) utilizing the App Router with TypeScript.
* **Styling & UI System:** Tailwind CSS 4 with glassmorphism design system.
* **Animation Framework:** Framer Motion (essential for fluid layout morphing and fading states).
* **Database, Auth & ORM:** **Supabase** (PostgreSQL + Auth + Row-Level Security). All queries use the Supabase JS client (`@supabase/ssr` + `@supabase/supabase-js`). No separate ORM.
* **AI Processing Engine:** **OpenRouter** free-tier (`meta-llama/llama-3-8b-instruct`) implemented through the OpenAI SDK with custom base URL. All AI responses use **structured outputs** (`response_format: json_object`) to guarantee valid JSON.
* **Client Data Layer:** API routes with server-side decryption for secure data fetching.

---

## 3. Authentication
* **Providers:** Google OAuth + Email/Password via Supabase Auth.
* **Client Setup:** Two utilities — `lib/supabase/server.ts` (for Route Handlers and Server Components) and `lib/supabase/client.ts` (for Client Components), following the `@supabase/ssr` pattern.
* **Middleware:** `proxy.ts` at project root protects all `/api/*` routes. Checks for a valid Supabase session via cookies, redirects unauthenticated requests to `/login`. Refreshes expiring sessions automatically.
* **Session Handling:** Supabase session stored in cookies via `@supabase/ssr`. The `userId` is extracted from the session in Route Handlers — never trusted from the client request body.
* **Pages:**
  * **`/signup`** — Two paths side by side: a prominent **Google OAuth** button (top) for one-tap sign-up, followed by a divider ("or sign up with email"), then an email/password form with display name, email, password, and confirm password fields. Password rules: min 8 characters, at least 1 number and 1 special character. On submit: creates account via `supabase.auth.signUp()`, auto-creates `user_profiles` row with display name (from input or Google profile) and default language `'burmese'`. Redirect to `/`. Google users get display name pre-filled from their Google profile. Duplicate email and weak password show inline errors.
  * **`/login`** — Same layout: **Google OAuth** button (top) + email/password form. If user signed up with Google and has no password, show hint: *"Signed up with Google? Use the Google button above."* Post-login redirect to `/`. Link to `/signup` for new users. Forgot password deferred past MVP.
  * **`/auth/callback`** — GET handler for OAuth redirect. Exchanges auth code for session via `supabase.auth.exchangeCodeForSession()`. Redirects to `/`.
* **Account Deletion:** Users can delete their account from a settings page. Deletion cascades to all journal entries, monthly reports, and user profile. Supabase Auth user is deleted via `supabase.auth.admin.deleteUser()` using the service role key. Confirmation modal required before deletion.
* **Rate Limiting:** Max **10 journal entries per user per day**. Checked via a Supabase query counting today's non-deleted entries before calling AI. Returns HTTP 429 with a message: *"You've reached your daily limit of 10 entries. Come back tomorrow!"*

---

## 4. Database Schema & Migrations
All schema defined via SQL migrations in `/supabase/migrations/`. No Prisma.

### Initial Migration (`001_initial_schema.sql`)

```sql
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  content text not null, -- stored encrypted with AES-256-GCM
  content_iv text not null, -- initialization vector for decryption
  primary_emotion varchar(50) not null,
  emoji varchar(10) not null,
  secondary_emotions text[] not null,
  bg_glow_gradient text not null,
  deleted_at timestamptz default null, -- soft delete for undo mechanic
  created_at timestamptz default now() not null
);

create index idx_journal_entries_user_date
  on journal_entries (user_id, created_at desc)
  where deleted_at is null;

create table monthly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  month_year varchar(7) not null, -- format: 'YYYY-MM'
  summary_overview text not null,
  dominant_mood varchar(50) not null,
  pattern_insights text not null,
  actionable_recommendations text[] not null,
  created_at timestamptz default now() not null,
  constraint unique_user_month unique (user_id, month_year)
);

create index idx_monthly_reports_user_month
  on monthly_reports (user_id, month_year);

create table user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique not null,
  display_name varchar(100),
  preferred_language varchar(10) default 'burmese' not null, -- 'burmese' or 'english'
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_user_profiles_user_id
  on user_profiles (user_id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### Row-Level Security

```sql
alter table journal_entries enable row level security;
alter table monthly_reports enable row level security;
alter table user_profiles enable row level security;

create policy "Users can only access their own entries"
  on journal_entries for all
  using (user_id = auth.uid());

create policy "Users can only access their own reports"
  on monthly_reports for all
  using (user_id = auth.uid());

create policy "Users can only access their own profile"
  on user_profiles for all
  using (user_id = auth.uid());
```

---

## 5. Mood Theme Validation (`lib/mood-themes.ts`)

A shared constant mapping mood names to valid Tailwind gradient classes. The AI's `glow_theme` response is validated against this allowlist before persisting — unknown values fall back to the default slate gradient.

```ts
export const MOOD_THEMES: Record<string, string> = {
  joy: "from-amber-500/20 to-yellow-600/20",
  sadness: "from-blue-500/20 to-indigo-600/20",
  anger: "from-red-500/20 to-orange-600/20",
  fear: "from-purple-500/20 to-violet-600/20",
  surprise: "from-cyan-500/20 to-teal-600/20",
  disgust: "from-green-500/20 to-emerald-600/20",
  calm: "from-sky-500/20 to-blue-600/20",
  love: "from-pink-500/20 to-rose-600/20",
  anxious: "from-yellow-500/20 to-amber-600/20",
  uncertain: "from-slate-700/20 to-slate-900/20",
};

export const DEFAULT_THEME = "from-slate-700/20 to-slate-900/20";

export function validateGlowTheme(input: string): string {
  return Object.values(MOOD_THEMES).includes(input) ? input : DEFAULT_THEME;
}
```

---

## 6. Encryption at Rest (`lib/encryption.ts`)

Journal entry content is encrypted before storage using **AES-256-GCM**. Each entry uses a unique initialization vector (IV). The encryption key is stored in an environment variable (`ENCRYPTION_KEY`), never in code.

```ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encrypt(text: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return { encrypted: encrypted + ':' + authTag, iv: iv.toString('hex') };
}

export function decrypt(encryptedText: string, ivHex: string): string {
  const [encrypted, authTag] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

**Flow:**
1. User submits entry → API encrypts `content` before `supabase.from('journal_entries').insert()`
2. API reads entry for AI analysis → decrypts in-memory, sends plaintext to AI
3. Calendar overlay fetches entry → decrypts before rendering
4. Monthly report aggregation → decrypts all entries in the month before sending to AI

**Note:** `primary_emotion`, `emoji`, `secondary_emotions`, and `bg_glow_gradient` are stored in plaintext — only the journal content is encrypted.

---

## 7. Language Detection (`lib/language.ts`)

Hybrid approach: user sets a default language in settings (persisted to `user_profiles.preferred_language`, defaults to Burmese). Per-entry detection runs as a safety net using Myanmar Unicode script range. Detection result is used for logging and analytics — the AI always uses a single bilingual prompt.

```ts
export function detectLanguage(text: string): 'burmese' | 'english' {
  const burmeseChars = text.match(/[\u1000-\u109F]/g)?.length ?? 0;
  return burmeseChars > 0 ? 'burmese' : 'english';
}

export function getSystemPromptLanguage(
  entryText: string,
  userDefault: 'burmese' | 'english'
): 'burmese' | 'english' {
  const detected = detectLanguage(entryText);
  return detected; // Unicode detection always overrides user default
}
```

**Flow:**
1. Fetch user profile → get `preferred_language` (default: `'burmese'`)
2. On entry submission → run `detectLanguage(text)` as safety net
3. If Burmese characters detected → confirm Burmese input (regardless of user default)
4. If only Latin characters → confirm English input
5. Pass resolved language to AI call — but AI always uses a single bilingual prompt that handles both languages and returns English emotion labels

---

## 8. Responsive Design

The app must be **mobile-first and functional on all screen sizes**.

* **Breakpoints:** Tailwind defaults — `sm:` (640px), `md:` (768px), `lg:` (1024px).
* **Dashboard:** Text area and greeting stack vertically on mobile. Full-width on desktop.
* **Calendar:** Month grid reduces cell size on mobile. Emojis remain readable. Tapping a day opens a **bottom sheet** on mobile (instead of a centered modal) for thumb-friendly access.
* **Monthly Report:** Reading scroll stacks vertically on mobile. Cards go full-width. Typography scales down slightly for readability on small screens.
* **Navigation:** No hamburger menu — the app is a single-page experience with the calendar as the main navigation element.

---

## 9. MVP Feature Specifications & Component Layout

### Feature 9.1: The Sanctuary Dashboard (`/app/page.tsx`)
* **Dynamic Greeting:** Large serif typography welcoming the user based on local time (e.g., *"Good evening, Alex. How does your soul feel tonight?"*). Display name pulled from `user_profiles.display_name` or email prefix as fallback.
* **Loading State:** Skeleton shimmer matching glassmorphism style — pulsing frosted-glass placeholder for the greeting and text area.
* **Error State:** Glassmorphism card with error message and a retry button. Gentle animation on appearance.
* **Empty State (no entries yet):** Encouraging message with subtle breathing animation: *"Welcome to your sanctuary. Begin your journey by sharing how you feel."*
* **Interactive Text Area:** A completely borderless, auto-resizing text entry space. It features a soft background radial glow (`var(--mood-glow)`) that breathes/pulses slightly as the user types. Placeholder text: *"Write your thoughts here..."*
* **Character Counter:** Subtle counter below the text area showing current length. Warns at 4500 characters, hard stops at 5000.
* **Submission Mechanic:** A button labeled **"Release to Calendar"**. Button is disabled until the entry meets the minimum length (10 characters). On click:
  1. Fire API call immediately — entry is saved to DB.
  2. Trigger Framer Motion animation: text fades and floats upwards.
  3. Display a **Saved ✓** toast with a 4-second countdown and an **Undo** button.
  4. During countdown, the entry exists in the DB but is soft-deletable.
  5. If user clicks **Undo**, soft-delete the entry from DB, restore textarea and draft to pre-submission state.
  6. After countdown expires or user dismisses toast, entry is permanent. Clear draft, reset state.

### Feature 9.2: Daily AI Sentiment Analysis Workflow (`/app/api/analyze/route.ts`)
* **Endpoint Type:** Next.js Route Handler (POST), protected by middleware. Extracts `userId` from the Supabase session — never from the request body.
* **Request Body:** `{ content: string }`
* **AI Provider:** **OpenRouter** free-tier (`meta-llama/llama-3-8b-instruct`) via OpenAI SDK with custom base URL. All responses use **structured outputs** (`response_format: json_object`) to guarantee valid JSON.
* **Language Detection:** Hybrid approach — user sets a default language in settings (persisted to Supabase `user_profiles` table, defaults to Burmese). Per-entry detection runs as a safety net using Myanmar Unicode script range (U+1000–U+109F): if Burmese characters are present, override to Burmese system prompt; if text contains only Latin characters, use English prompt. This handles mixed-language entries and bilingual users without external dependencies.
* **Supported Languages:** Entries accepted in **Burmese or English**.
* **Minimum Entry Length:** User must write a full sentence (at least 10 characters). UI disables submit button until threshold is met. API rejects entries below this with a validation error.
* **Maximum Entry Length:** No hard limit. Entries beyond 5000 characters are truncated before sending to AI (with user warning).
* **AI Call:** Sends the journal text to OpenRouter via OpenAI SDK. System prompt returns `{ primary_emotion, emoji, secondary_emotions, glow_theme }`.
* **System Prompt Constraint:** > "You are an empathetic, highly analytical, emotionally intelligent AI psychologist. The input text may be in Burmese or English. Analyze the text payload regardless of language. Always return emotion labels in English. Return a strictly valid JSON object containing: 'primary_emotion' (1 word, in English), 'emoji' (1 character), 'secondary_emotions' (string array of 1-3 terms in English — only include emotions you genuinely identify in the text; if the input is sparse, infer from tone, brevity, or word choice — do not pad), and 'glow_theme' (a valid Tailwind gradient class from the allowed mood themes)."
* **Validation:**
  - `glow_theme` is validated against the `MOOD_THEMES` allowlist via `validateGlowTheme()`.
  - `secondary_emotions` must contain 1-3 items; pad to 1 with `"neutral"` if empty, trim to 3 if longer.
* **Database Insert:** `supabase.from('journal_entries').insert({...})`
* **Edge Case Strategy:** If the text is empty or meaningless string noise, default cleanly to `primary_emotion: "Uncertain"`, `emoji: "💭"`, `bg_glow_gradient: DEFAULT_THEME`.
* **Error Handling:** If the API call fails, the textarea is **not cleared**. An error toast notification is displayed to the user, allowing them to retry without losing their entry.

### Feature 9.3: The Mood Constellation Calendar (`/components/MoodCalendar.tsx`)
* **Visual Blueprint:** Standard calendar month layout stripped of heavy boxes.
* **Data Fetch:** Queries `journal_entries` with `.is('deleted_at', null)` to exclude soft-deleted entries.
* **Loading State:** Skeleton grid — pulsing frosted-glass circles matching the calendar layout.
* **Error State:** Glassmorphism card with error message and retry button, same style as dashboard error.
* **Logged Days:** Renders a high-definition emoji inside a softly pulsing circle matching the recorded `bgGlowGradient`.
* **Empty / Future Days:** Rendered as a minimalist, thin-bordered dotted ring that pulses subtly when hovered to signify available log space.
* **Empty State (zero entries ever):** A soft glassmorphism overlay floats above the empty calendar grid with a subtle breathing animation: *"Your mood constellation awaits. Start journaling to see your emotions map."* The overlay fades out once the first entry is logged and never reappears.
* **Overlay View:** Clicking a logged day leverages Framer Motion's `layoutId` to morph smoothly into an elegant focal modal card. This card blurs the background grid, displaying the complete text entry alongside the 1-3 secondary emotions (rendered as dynamic emotion pills).
* **No Delete:** Entries cannot be deleted from the calendar. The only way to undo is within 4 seconds of creation via the dashboard toast. This keeps journaling intentional — once committed, it stays.
* **Month Navigation:** Prev/next month controls with animated transitions.
* **Mood Override Interaction:** (NEW)
  - Tapping the emotion emoji or "Edit Mood" opens a lightweight popover selector
  - User can tap to select a new primary emotion from the `MOOD_THEMES` list 
    (shows emoji + emotion name)
  - Selected mood updates the `primary_emotion` and `bg_glow_gradient` in the database 
    via an API PATCH route
  - Confirmation is subtle: *"Mood updated ✓"* toast, overlay closes, calendar re-renders with new glow

### Feature 9.3.1: Mood Override API (`/app/api/entries/[id]/route.ts`)
* **Endpoint:** PATCH, protected by middleware. Extracts `userId` from session.
* **Request Body:** `{ primary_emotion?: string, emoji?: string }`
* **Validation:**
  - `primary_emotion` must be a key in `MOOD_THEMES`. If invalid, return 400.
  - `emoji` must be a single character. If invalid, return 400.
  - At least one field must be provided. If both missing, return 400.
* **Database Update:** `supabase.from('journal_entries').update({ primary_emotion, emoji, bg_glow_gradient: MOOD_THEMES[primary_emotion] }).eq('id', entryId).eq('user_id', userId)` — the `user_id` filter ensures RLS enforcement.
* **Response:** Updated entry object with decrypted content.
* **Edge Case:** If entry ID doesn't belong to the user, return 404. If entry doesn't exist, return 404.

### Feature 9.3.1.1: Entry Soft-Delete API (`/app/api/entries/[id]/route.ts`)
* **Endpoint:** DELETE, protected by middleware. Extracts `userId` from session.
* **Purpose:** Soft-delete an entry (sets `deleted_at` to now). Used by the undo mechanic on the dashboard.
* **Database Update:** `supabase.from('journal_entries').update({ deleted_at: new Date().toISOString() }).eq('id', entryId).eq('user_id', userId).is('deleted_at', null)`
* **Response:** 200 with `{ success: true }`.
* **Edge Case:** If entry doesn't exist or is already soft-deleted, return 404.

### Feature 9.3.2: User Profile API (`/app/api/profile/route.ts`)
* **GET:** Returns the user's profile from `user_profiles` table. Profile is guaranteed to exist (auto-created by database trigger on signup). If somehow missing (edge case), return 404 with a message to contact support.
* **PATCH:** Updates `display_name` and/or `preferred_language` in `user_profiles`. Validates `preferred_language` is either `'burmese'` or `'english'`. Returns 400 if invalid.
* **Response:** Updated profile object.

### Feature 9.3.3: Account Deletion API (`/app/api/account/route.ts`)
* **Endpoint:** DELETE, protected by middleware. Extracts `userId` from session.
* **Flow:**
  1. Delete all `journal_entries` where `user_id = userId`.
  2. Delete all `monthly_reports` where `user_id = userId`.
  3. Delete `user_profiles` where `user_id = userId`.
  4. Delete the Supabase Auth user via `supabase.auth.admin.deleteUser(userId)` using a separate admin client with `SUPABASE_SERVICE_ROLE_KEY`.
* **Confirmation:** The UI shows a confirmation modal: *"This will permanently delete your account and all journal entries. This action cannot be undone."* User must type "DELETE" to confirm.
* **Response:** 200 on success. Client redirects to `/login`.
* **Error Handling:** If any step fails, abort the entire deletion, show error toast, and log the failure. Partial deletion is not acceptable — either all data is deleted or nothing is.

### Feature 9.4: Monthly "Mind Journey" Report (`/components/MonthlyReport.tsx`)
* **Trigger Mechanism:** Displays a custom card at the end of the calendar grid labeled *"Reveal This Month's Journey"*. **On-demand click** — the user must explicitly click to generate the report.
* **Loading State:** Pulsing frosted-glass skeleton matching the report card layout.
* **Error State:** Glassmorphism card with error message and retry button.
* **Minimum Data:** Requires at least **10 journal entries** for the target month. If < 10 entries, display a message: *"Keep journaling! You need at least 10 entries to unlock your monthly journey."*
* **AI Analysis Endpoint (`/app/api/report/route.ts`):** Accepts `{ month: "YYYY-MM" }`. Fetches the target month's entries via `supabase.from('journal_entries').select('*').eq('user_id', userId).gte('created_at', startDate).lt('created_at', endDate).is('deleted_at', null)`. Decrypts entries server-side, aggregates data points, and calls OpenRouter to return the structured report payload. Upserts via `supabase.from('monthly_reports').upsert({...})`.
* **AI Provider:** **OpenRouter** free-tier via OpenAI SDK with custom base URL.
* **UI Presentation:** Three stages, vertically stacked, each animating in sequentially with Framer Motion (staggered fade-in from bottom):
  * *The Big Picture:* Full-width card with dominant mood emoji (large, centered), mood name, and a count: *"This month, you felt [mood] on [X] of [Y] days."* Background glow matches the dominant mood gradient.
  * *Pattern Recognition:* Glassmorphism card with 2-3 insights. Each insight is a quote-style block with a subtle left border accent. Examples: *"We noticed anxiety peaks typically follow late-night productivity mentions."* / *"Your calmest days tended to fall on weekends."* Handles variable-length secondary emotions (1-3 per entry).
  * *Actionable Frameworks:* 2-3 recommendation cards in a grid (stacks on mobile). Each card has an icon, title, and short description. Examples: "Morning Breathing Exercise", "Digital Detox Evenings", "Gratitude Journaling".
* **Caching:** Report is upserted — no duplicates on re-generation.

### Feature 9.5: User Settings (`/app/settings/page.tsx`)
* **Page Access:** Protected route — redirect to `/login` if unauthenticated.
* **Profile Section:**
  - Profile image (Google OAuth users see their Google avatar; email users see initials)
  - Display name input (editable, persisted to `user_profiles.display_name`)
  - Email display (read-only, from Supabase Auth)
* **Language Preference:**
  - Toggle: **Burmese** / **English** — persisted to `user_profiles.preferred_language`
  - Default: Burmese
  - This sets the default AI system prompt language. Per-entry Unicode detection can still override.
* **Danger Zone:**
  - **Delete Account** button — opens confirmation modal
  - Modal requires typing "DELETE" to confirm
  - Calls DELETE `/api/account`
  - On success: redirect to `/login`
* **UI:** Same glassmorphism style as the rest of the app. Mobile-first layout with stacked sections.
* **Navigation:** Accessible via a subtle gear icon in the top-right corner of the dashboard, or a "Settings" link in the greeting area.

### Feature 9.6: 404 Page (`/app/not-found.tsx`)
* **Design:** Glassmorphism card centered on the page with a soft breathing glow animation.
* **Content:** Large serif heading: *"Lost in the sanctuary?"* followed by a gentle message: *"This page doesn't exist. Let's guide you back."*
* **CTA:** A "Return Home" button that navigates to `/`.
* **Animation:** The glow shifts to the `uncertain` mood gradient (`from-slate-700/20 to-slate-900/20`).

---

## 10. UI Quality & Animation Benchmarks
To ensure visual standards:
1. All active overlay items must utilize explicit glass properties: `bg-white/5 backdrop-blur-xl border border-white/10`.
2. Page-level transitions must utilize Framer Motion `<AnimatePresence>` to prevent awkward abrupt snapping or clipping.
3. Every button hover transition must scale gracefully via `transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1)`.
4. All toast messages and system copy maintain the gentle, reflective voice established in the greeting.

---

## 11. Testing Strategy
Unit tests using **Vitest** (fast, TypeScript-native, works with Next.js).

### Test Coverage Scope
* **API Routes:** Unit tests for `/api/analyze`, `/api/report`, `/api/entries/[id]` (mood override), `/api/profile` (user profile), and `/api/account` (deletion) — test validation, AI provider fallback, encryption/decryption, rate limiting, and error handling.
* **Utilities:** Unit tests for `lib/encryption.ts` (encrypt/decrypt roundtrip), `lib/mood-themes.ts` (validateGlowTheme), `lib/language.ts` (Unicode detection), `lib/supabase/*` (mocked).
* **Edge Cases:** Empty entries, entries below minimum length, entries exceeding max length, malformed AI responses, rate limit exceeded, mood override with invalid emotion, account deletion with partial failure, profile missing (trigger edge case).

### Test Files Location
```
/__tests__/
  /api/
    analyze.test.ts
    report.test.ts
    entries.test.ts
    profile.test.ts
    account.test.ts
  /lib/
    encryption.test.ts
    mood-themes.test.ts
    language.test.ts
```

### Commands
* `npm run test` — run all tests
* `npm run test:coverage` — generate coverage report

---

## 12. Verification Criteria
After each phase:
- `npm run build` passes
- `npm run lint` passes
- `npm run test` passes
- Manual test: login with Google, create entry, see calendar, generate report
- Verify RLS: attempt to query entries without session → blocked
- Verify AI validation: malformed glow_theme falls back to default
- Verify entry validation: submit < 10 characters → blocked with error
- Verify error state: fail API call → textarea preserved, error toast shown
- Verify encryption: check DB content column is encrypted ciphertext, not plaintext
- Verify decryption: calendar overlay displays decrypted entry text
- Verify mood override: change mood on entry, confirm emoji and glow update
- Verify language detection: write Burmese text → AI analyzes correctly and returns English emotion labels
- Verify settings: change language preference → persists across page reload
- Verify Google avatar: login with Google → settings shows Google profile picture
- Verify account deletion: delete account, confirm all data removed (entries, reports, profile, auth user), redirected to login
- Verify profile trigger: create new auth user → profile auto-created with display name from OAuth or email prefix
- Verify mobile: test on 375px width (iPhone SE) — bottom sheet opens, calendar readable

---

## 13. Environment Configuration

All required environment variables. A `.env.example` file must be committed to the repo with placeholder values.

| Variable | Purpose | Source |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key | Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key — used for account deletion (`auth.admin.deleteUser`) | Supabase dashboard → Settings → API |
| `OPENROUTER_API_KEY` | OpenRouter API access — AI provider (free tier) | OpenRouter dashboard → Keys |
| `ENCRYPTION_KEY` | AES-256-GCM encryption key — 32 bytes, hex-encoded (64 hex chars) | Self-generated via `openssl rand -hex 32` |

### `.env.example`
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Provider (OpenRouter)
OPENROUTER_API_KEY=your_openrouter_api_key

# Encryption
ENCRYPTION_KEY=generate_with_openssl_rand_hex_32
```

### Key Generation
```bash
# Generate a secure encryption key
openssl rand -hex 32
```

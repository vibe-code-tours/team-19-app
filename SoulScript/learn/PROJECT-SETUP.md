# Project Setup Guide

## Session Date: 2026-07-09

---

## 1. Supabase Project Creation

1. Go to [supabase.com](https://supabase.com) → Sign in with GitHub
2. Click **"New project"**
3. Fill in:
   - **Organization:** (your org or create one)
   - **Project name:** `soulscript`
   - **Database password:** (save this somewhere safe)
   - **Region:** (closest to your users)
4. Click **"Create new project"** — wait ~2 minutes for it to spin up

---

## 2. Getting Supabase URL & Keys

After project creation:

1. In your project dashboard, click the **gear icon** (Settings) in the left sidebar
2. Click **"API"** under Project Settings
3. You'll see two sections:

### Project URL

- Found under **Project URL** section
- Looks like: `https://your-project-id.supabase.co`
- Copy this → `NEXT_PUBLIC_SUPABASE_URL`

### API Keys

Found under **Project API keys** section:

| Key | What it is | Copy to |
|-----|------------|---------|
| **anon public** | Safe for client-side use, respects RLS | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role** | Admin access, bypasses RLS — **never expose to client** | `SUPABASE_SERVICE_ROLE_KEY` |

Click the **eye icon** to reveal the service_role key, then copy it.

### Add to `.env`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Note:** The `service_role` key is used in `src/app/api/account/route.ts` for deleting auth users. Never commit it to git or expose it in client-side code.

---

## 3. Database Schema Migration

Schema file: `supabase/migrations/001_initial_schema.sql`

### Option A: SQL Editor (Quick & Manual)

1. Open `supabase/migrations/001_initial_schema.sql`
2. Copy the entire contents
3. Go to Supabase Dashboard → **SQL Editor** → **New query**
4. Paste → Click **"Run"**

One shot, done.

### Option B: Supabase CLI (Proper Migration Flow)

Recommended for ongoing development with multiple schema changes.

**Install:**

```bash
npm install -g supabase
```

**Link to remote project:**

```bash
supabase link --project-ref your-project-id
```

Prompted for your database password (set during project creation).

**Run migration:**

```bash
supabase db push
```

Reads everything in `supabase/migrations/` and applies to remote database.

**Future migrations:**

```bash
# Create new migration file
supabase migration new add_new_feature

# Edit generated file in supabase/migrations/
# Push to remote
supabase db push
```

| Approach | When to use |
|----------|-------------|
| **SQL Editor** | One-time setup, quick fix, testing |
| **Supabase CLI** | Ongoing development, team collaboration, production |

---

## 4. Verifying Tables & RLS

### Check RLS is Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('journal_entries', 'monthly_reports', 'user_profiles');
```

All three should show `rowsecurity = true`.

### Verify Policies Exist

```sql
SELECT policyname, tablename, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

Should return 3 policies — one per table, all using `user_id = auth.uid()`.

### Verify Trigger Exists

```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

Should return one row.

### Test RLS Blocks Unauthenticated Access

```sql
-- Returns empty result (RLS blocks it)
SELECT * FROM journal_entries;
```

Without RLS, you'd see all rows. With RLS and no session, you get nothing.

### Verify Profile Auto-Creation After Signup

```sql
SELECT * FROM user_profiles;
```

After signing up, a row should appear with your `display_name` and `preferred_language = 'burmese'`.

---

## 5. Google OAuth Setup

### Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or select existing)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the **OAuth consent screen** first:
   - User type: **External**
   - App name: `SoulScript`
   - Add your email as developer contact
6. Back to **Create OAuth client ID**:
   - Application type: **Web application**
   - Name: `SoulScript`
   - **Authorized redirect URIs:** add:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
     (Find project ref in Supabase Dashboard → Settings → API → Project URL)
7. Copy the **Client ID** and **Client Secret**

### Supabase Configuration

1. Dashboard → **Authentication** → **Providers**
2. Enable **Google**
3. Paste Client ID and Client Secret from Google
4. Redirect URL stays as-is: `https://<your-project-ref>.supabase.co/auth/v1/callback`

### How the Redirect Flow Works

```
User clicks "Google" on localhost
  → Google redirects to Supabase callback (fixed URL)
    → Supabase exchanges code for session
      → Supabase redirects back to YOUR app (localhost:3000/auth/callback)
```

| Where | URL | Notes |
|-------|-----|-------|
| **Supabase** (Providers → Google) | `https://<ref>.supabase.co/auth/v1/callback` | Fixed, don't change |
| **Google Cloud Console** (Authorized redirect URIs) | `https://<ref>.supabase.co/auth/v1/callback` | You add this here |
| **Your code** (`signup/`, `login/`) | `http://localhost:3000/auth/callback` | Where Supabase sends user back |

---

## 6. End-to-End Verification

1. Run `npm run dev`
2. Go to `http://localhost:3000`
3. Should redirect to `/login`
4. Sign up with email (or Google)
5. After signup, redirected to `/` (dashboard)
6. Check **Authentication** → **Users** — user appears
7. Check **Table Editor** → **user_profiles** — row auto-created

---

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| "Unauthorized" on page load | Check `.env` has correct Supabase URL and keys |
| Google OAuth fails | Verify redirect URI in Google Cloud Console matches Supabase callback URL |
| Profile not auto-created | Check trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created'` |
| RLS blocking valid queries | Check policies: `SELECT * FROM pg_policies WHERE schemaname = 'public'` |
| Build fails with env vars | Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set |

# Database Schema, Migrations & Row-Level Security

## Overview

SoulScript uses Supabase (PostgreSQL) with raw SQL migrations. The schema has three tables, a trigger for auto-creating user profiles, and RLS policies for data isolation.

## Schema (`supabase/migrations/001_initial_schema.sql`)

### `journal_entries`

```sql
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  content text not null,           -- encrypted content
  content_iv text not null,        -- encryption IV
  primary_emotion varchar(50) not null,
  emoji varchar(10) not null,
  secondary_emotions text[] not null,  -- PostgreSQL array
  bg_glow_gradient text not null,
  deleted_at timestamptz default null,  -- soft delete
  created_at timestamptz default now() not null
);
```

**Partial index** for active entries:

```sql
create index idx_journal_entries_user_date
  on journal_entries (user_id, created_at desc)
  where deleted_at is null;
```

Only indexes non-deleted entries, making queries faster and smaller.

### `monthly_reports`

```sql
create table monthly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  month_year varchar(7) not null,     -- "2024-01" format
  summary_overview text not null,
  dominant_mood varchar(50) not null,
  pattern_insights text not null,
  actionable_recommendations text[] not null,
  created_at timestamptz default now() not null,
  constraint unique_user_month unique (user_id, month_year)
);
```

**Unique constraint** ensures one report per user per month. Used for upsert (`onConflict: "user_id,month_year"`).

### `user_profiles`

```sql
create table user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique not null,
  display_name varchar(100),
  preferred_language varchar(10) default 'burmese' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
```

One profile per user (unique constraint on `user_id`).

## Auto-Create Profile Trigger

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (user_id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

When a new user signs up:
1. Trigger fires on `auth.users` insert
2. Creates a profile with display name from OAuth metadata or email prefix
3. `security definer` — runs with the function owner's privileges (bypasses RLS)

### Display Name Priority

1. `raw_user_meta_data->>'full_name'` (Google OAuth)
2. `raw_user_meta_data->>'name'` (some providers)
3. `split_part(email, '@', 1)` (email prefix fallback)

## Row-Level Security (RLS)

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

### How RLS Works

- `enable row level security` — activates RLS on the table
- `for all` — applies to SELECT, INSERT, UPDATE, DELETE
- `using (user_id = auth.uid())` — row's `user_id` must match the authenticated user's ID
- `auth.uid()` — returns the current user's UUID from the JWT

### Defense in Depth

RLS is a backup to application-level auth:
1. **Proxy middleware** — blocks unauthenticated API requests
2. **Route handler** — verifies `user` from Supabase session
3. **RLS policy** — database-level enforcement even if steps 1-2 are bypassed

## Why Raw SQL (Not an ORM)

- **Simplicity** — three tables don't warrant ORM complexity
- **Transparency** — SQL migrations are easy to review and debug
- **Supabase compatibility** — Supabase's dashboard can directly edit/inspect raw SQL
- **No Prisma overhead** — faster builds, smaller bundle

## Migration Pattern

Migrations go in `supabase/migrations/` with numeric prefixes:

```
supabase/migrations/
  001_initial_schema.sql
```

Applied via Supabase CLI or dashboard. Each migration is idempotent-safe (uses `create table` not `create table if not exists`, relying on migration ordering).

## Key Decisions

- **Soft delete** — `deleted_at` column instead of `DELETE` queries; preserves data for undo
- **Partial index** — only indexes active entries for better query performance
- **UUID primary keys** — `gen_random_uuid()` for distributed generation, no sequences
- **PostgreSQL arrays** — `text[]` for `secondary_emotions` and `actionable_recommendations`
- **Trigger for profiles** — automatic profile creation on signup, no application code needed
- **RLS over middleware alone** — database-level security as defense in depth

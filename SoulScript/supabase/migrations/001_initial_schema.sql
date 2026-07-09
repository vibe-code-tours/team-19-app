create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  content text not null,
  content_iv text not null,
  primary_emotion varchar(50) not null,
  emoji varchar(10) not null,
  secondary_emotions text[] not null,
  bg_glow_gradient text not null,
  deleted_at timestamptz default null,
  created_at timestamptz default now() not null
);

create index idx_journal_entries_user_date
  on journal_entries (user_id, created_at desc)
  where deleted_at is null;

create table monthly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  month_year varchar(7) not null,
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
  preferred_language varchar(10) default 'burmese' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_user_profiles_user_id
  on user_profiles (user_id);

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

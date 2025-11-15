-- migration: create core schema for development refresher training
-- purpose: introduce enums, helper functions, profiles & topics tables, indexes, rls enforcement, and policies
-- considerations: all data is user-owned, so policies restrict access to authenticated users only; anon role is explicitly denied

set check_function_bodies = false;

-- ensure pgcrypto is available for gen_random_uuid()
create extension if not exists pgcrypto with schema public;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'experience_level_enum'
  ) then
    create type public.experience_level_enum as enum ('junior', 'mid', 'senior');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'topic_status_enum'
  ) then
    create type public.topic_status_enum as enum ('to_do', 'in_progress', 'completed');
  end if;
end;
$$;

-- shared trigger function to keep updated_at columns synchronized
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- user profiles table (one-to-one with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  experience_level public.experience_level_enum not null,
  years_away smallint not null check (years_away between 0 and 60),
  activity_streak integer not null default 0 check (activity_streak >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- review topics table with hierarchical relationship
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  parent_id uuid references public.topics (id) on delete cascade,
  title text not null,
  description text,
  status public.topic_status_enum not null default 'to_do',
  technology text not null,
  leetcode_links jsonb not null default '[]'::jsonb check (jsonb_typeof(leetcode_links) = 'array'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (parent_id is null or parent_id <> id)
);

-- keep updated_at fresh automatically
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_topics_updated_at
before update on public.topics
for each row execute function public.set_updated_at();

-- indexes tuned for common access patterns (per-user dashboards, hierarchies, and status filtering)
create index if not exists idx_topics_user_id on public.topics (user_id);
create index if not exists idx_topics_parent_id on public.topics (parent_id);
create index if not exists idx_topics_status on public.topics (status);
create index if not exists idx_topics_user_status on public.topics (user_id, status);

-- enable rls so that policies can enforce per-user isolation
alter table public.profiles enable row level security;
alter table public.topics enable row level security;

--------------------------------------------------------------------------------
-- rls policies for public.profiles
--------------------------------------------------------------------------------

-- allow authenticated users to read their own profile row
create policy profiles_select_authenticated
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

-- deny anon role any read access to profiles
create policy profiles_select_anon_deny
  on public.profiles
  for select
  to anon
  using (false);

-- restrict inserts so users can only create their own profile record
create policy profiles_insert_authenticated
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

-- prevent anon inserts entirely
create policy profiles_insert_anon_deny
  on public.profiles
  for insert
  to anon
  with check (false);

-- allow authenticated users to update their own profile data
create policy profiles_update_authenticated
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- block anon updates explicitly
create policy profiles_update_anon_deny
  on public.profiles
  for update
  to anon
  using (false)
  with check (false);

-- authenticated users may delete their own profile if needed (will also remove related data via cascade)
create policy profiles_delete_authenticated
  on public.profiles
  for delete
  to authenticated
  using (id = auth.uid());

-- anon role cannot delete profiles
create policy profiles_delete_anon_deny
  on public.profiles
  for delete
  to anon
  using (false);

--------------------------------------------------------------------------------
-- rls policies for public.topics
--------------------------------------------------------------------------------

-- allow authenticated users to read only their own topics
create policy topics_select_authenticated
  on public.topics
  for select
  to authenticated
  using (user_id = auth.uid());

-- deny anon users any visibility into topics
create policy topics_select_anon_deny
  on public.topics
  for select
  to anon
  using (false);

-- authenticated users can create topics tied to their account
create policy topics_insert_authenticated
  on public.topics
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- block anon inserts
create policy topics_insert_anon_deny
  on public.topics
  for insert
  to anon
  with check (false);

-- authenticated users can update their own topics and all descendants
create policy topics_update_authenticated
  on public.topics
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- explicit deny for anon updates
create policy topics_update_anon_deny
  on public.topics
  for update
  to anon
  using (false)
  with check (false);

-- authenticated users can delete only their own topics; cascading fk cleanup handles child topics
create policy topics_delete_authenticated
  on public.topics
  for delete
  to authenticated
  using (user_id = auth.uid());

-- anon users cannot delete topics
create policy topics_delete_anon_deny
  on public.topics
  for delete
  to anon
  using (false);


-- DreamPath: recommendations table + RLS
-- Run this in Supabase SQL Editor once per environment.

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  user_interests text not null,
  user_subjects text not null,
  user_career_goal text not null,
  user_grade text not null,
  result_json jsonb not null
);

create index if not exists recommendations_user_id_created_at_idx
  on public.recommendations (user_id, created_at desc);

alter table public.recommendations enable row level security;

drop policy if exists "recommendations_select_own" on public.recommendations;
create policy "recommendations_select_own"
  on public.recommendations
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "recommendations_insert_own" on public.recommendations;
create policy "recommendations_insert_own"
  on public.recommendations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "recommendations_delete_own" on public.recommendations;
create policy "recommendations_delete_own"
  on public.recommendations
  for delete
  to authenticated
  using (auth.uid() = user_id);

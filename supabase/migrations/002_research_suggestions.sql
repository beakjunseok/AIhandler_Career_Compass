-- DreamPath: research_suggestions table + RLS
-- 생기부 탐구 보고서 주제 추천 결과 저장.

create table if not exists public.research_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  target_department text not null,
  career_goal text not null,
  user_grade text not null,
  interest_topic text not null,
  result_json jsonb not null
);

create index if not exists research_suggestions_user_id_created_at_idx
  on public.research_suggestions (user_id, created_at desc);

alter table public.research_suggestions enable row level security;

drop policy if exists "research_suggestions_select_own" on public.research_suggestions;
create policy "research_suggestions_select_own"
  on public.research_suggestions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "research_suggestions_insert_own" on public.research_suggestions;
create policy "research_suggestions_insert_own"
  on public.research_suggestions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "research_suggestions_delete_own" on public.research_suggestions;
create policy "research_suggestions_delete_own"
  on public.research_suggestions
  for delete
  to authenticated
  using (auth.uid() = user_id);

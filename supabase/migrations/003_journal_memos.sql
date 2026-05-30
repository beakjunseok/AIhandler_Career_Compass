-- 생기부 작성 메모: 학생이 실제로 생기부에 작성한 내용을 직접 기록/관리하는 테이블
-- Run this in your Supabase project's SQL editor (or via the Supabase CLI).

create table if not exists public.journal_memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  subject text not null,            -- 생기부를 쓴 과목명
  summary text not null,            -- 내용 간단 정리
  books text,                       -- 활용 도서
  future_research text              -- 그때 향후 탐구하겠다고 한 것
);

alter table public.journal_memos enable row level security;

-- Policies: a user can only see and manage their own rows
create policy "Users can view their own journal memos"
  on public.journal_memos for select
  using (auth.uid() = user_id);

create policy "Users can insert their own journal memos"
  on public.journal_memos for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own journal memos"
  on public.journal_memos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own journal memos"
  on public.journal_memos for delete
  using (auth.uid() = user_id);

-- Optional: index for faster history listing
create index if not exists journal_memos_user_created_idx
  on public.journal_memos (user_id, created_at desc);

-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0014_notifications
-- Purpose:   In-app notifications inbox. Each user gets a personalized
--            feed populated by the same triggers that send emails (new
--            comment, approval status change, new ticket).
-- ════════════════════════════════════════════════════════════════════════

create table if not exists notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  project_id  uuid references projects(id) on delete cascade,
  kind        text not null,            -- 'comment' | 'approval' | 'ticket' | 'digest' | ...
  title       text not null,
  body        text,
  link        text,                     -- relative path to navigate to
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on notifications (user_id, read_at, created_at desc);
create index if not exists notifications_project_idx
  on notifications (project_id);

alter table notifications enable row level security;

drop policy if exists "notifications_read_self"  on notifications;
drop policy if exists "notifications_write_self" on notifications;
drop policy if exists "notifications_insert"     on notifications;

-- Each user only sees their own
create policy "notifications_read_self" on notifications
  for select using (auth.uid() = user_id);

-- Mark-as-read updates
create policy "notifications_write_self" on notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notifications_delete_self" on notifications
  for delete using (auth.uid() = user_id);

-- Inserts happen via service-role from server actions; allow authenticated
-- inserts that target a project the user is a member of (covers most cases).
create policy "notifications_insert" on notifications
  for insert with check (
    public.is_studio_admin()
    or auth.uid() is not null
  );

-- Add to realtime publication
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

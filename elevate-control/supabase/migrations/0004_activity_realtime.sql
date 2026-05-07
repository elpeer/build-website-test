-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0004_activity_realtime
-- Purpose:   Add activity_log to the realtime publication so the dashboard
--            can subscribe to live updates per project.
-- ════════════════════════════════════════════════════════════════════════

-- Idempotent: only adds if not already published.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname  = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'activity_log'
  ) then
    alter publication supabase_realtime add table public.activity_log;
  end if;
end $$;

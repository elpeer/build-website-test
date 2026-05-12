-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0025_progress_override
-- Purpose:   Let the PM manually override the auto-calculated progress
--            percentage on the client overview, with an optional note
--            ("what's left") rendered under it.
-- ════════════════════════════════════════════════════════════════════════

alter table public.projects
  add column if not exists progress_override smallint
    check (progress_override is null or (progress_override between 0 and 100));

alter table public.projects
  add column if not exists progress_note text;

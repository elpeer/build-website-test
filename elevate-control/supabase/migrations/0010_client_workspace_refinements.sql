-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0010_client_workspace_refinements
-- Purpose:
--   1. project_files.category — split files within a workspace into
--      logical sections (e.g. spec: interview / content_spec /
--      client_materials; finance: signed_quote / invoice).
--   2. comment_threads.priority — for support tickets (low/normal/high/urgent).
--   3. comment_threads.title is already there from 0009 — used as ticket
--      subject when context_type='ticket'. No schema change needed.
-- ════════════════════════════════════════════════════════════════════════

alter table project_files
  add column if not exists category text;

create index if not exists project_files_category_idx
  on project_files (project_id, workspace, category);

alter table comment_threads
  add column if not exists priority text not null default 'normal'
    check (priority in ('low','normal','high','urgent'));

create index if not exists comment_threads_priority_idx
  on comment_threads (project_id, priority);

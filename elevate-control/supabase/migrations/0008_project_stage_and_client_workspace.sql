-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0008_project_stage_and_client_workspace
-- Purpose:
--   Adds the funnel-stage tracker to projects + a per-project per-workspace
--   override table so the studio can manually unlock specific workspaces
--   ahead of the auto-lock derived from the stage.
-- ════════════════════════════════════════════════════════════════════════

-- Funnel stages — order matters (lower index = earlier). The dashboard's
-- card lock logic is derived from this order. `live` is terminal.
do $$ begin
  create type project_stage as enum (
    'quote', 'spec', 'design', 'frontend', 'backend', 'qa',
    'integrations', 'launch', 'live'
  );
exception when duplicate_object then null;
end $$;

alter table projects
  add column if not exists current_stage project_stage not null default 'quote';

create index if not exists projects_current_stage_idx on projects (current_stage);

-- Optional per-project overrides for the workspace lock state. A row here
-- forces a workspace to a specific state regardless of the stage funnel.
-- Workspace slugs: finance, spec, design, development, qa, content,
-- integrations, launch, training.
create table if not exists client_workspace_overrides (
  project_id      uuid not null references projects(id) on delete cascade,
  workspace       text not null,
  unlocked        boolean not null default false,
  message         text,                       -- shown to the client when locked
  set_by          uuid references profiles(id) on delete set null,
  set_at          timestamptz not null default now(),
  primary key (project_id, workspace)
);

alter table client_workspace_overrides enable row level security;

drop policy if exists "client_overrides_read" on client_workspace_overrides;
create policy "client_overrides_read" on client_workspace_overrides
  for select using (
    public.is_studio_admin() or public.is_project_member(project_id)
  );

drop policy if exists "client_overrides_write" on client_workspace_overrides;
create policy "client_overrides_write" on client_workspace_overrides
  for all using (public.is_studio_admin() or public.is_project_member(project_id))
            with check (public.is_studio_admin() or public.is_project_member(project_id));

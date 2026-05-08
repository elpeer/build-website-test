-- ─── Project links — external URLs alongside files ───────────────────
-- Used by workspaces where a "material" can be either an uploaded file
-- (project_files) or an external URL (this table). Examples: brand book
-- in design, client materials in spec, frontend / cms entries in dev.
create table if not exists project_links (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references projects(id) on delete cascade,
  workspace    text,
  category     text,
  url          text not null,
  label        text,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists project_links_project_idx on project_links (project_id);
create index if not exists project_links_workspace_idx on project_links (project_id, workspace, category);

alter table project_links enable row level security;
drop policy if exists "project_links_read"  on project_links;
drop policy if exists "project_links_write" on project_links;
create policy "project_links_read"  on project_links
  for select using (public.is_studio_admin() or public.is_project_member(project_id));
create policy "project_links_write" on project_links
  for all using (public.is_studio_admin() or public.is_project_member(project_id))
            with check (public.is_studio_admin() or public.is_project_member(project_id));

-- ─── Development workspace: explicit "kind" on approvals ──────────────
-- Used to split frontend (HTML/page) approvals from CMS (admin/backend)
-- approvals in the same workspace. Defaults to 'frontend' for legacy data.
alter table public.client_approvals
  add column if not exists kind text not null default 'frontend';
create index if not exists client_approvals_kind_idx
  on client_approvals (project_id, workspace, kind);

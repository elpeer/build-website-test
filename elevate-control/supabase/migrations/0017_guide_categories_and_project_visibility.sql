-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0017_guide_categories_and_project_visibility
-- Purpose:   Replace the free-text category column on guide_articles with
--            a managed guide_categories table, and let studio admins target
--            specific guides at specific projects (instead of only the
--            global library + per-project hide overrides).
-- ════════════════════════════════════════════════════════════════════════

-- ── Categories ────────────────────────────────────────────────────────
create table if not exists guide_categories (
  id              uuid primary key default uuid_generate_v4(),
  slug            text unique not null,
  label           text not null,
  position        int  not null default 0,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

alter table guide_categories enable row level security;

drop policy if exists "guide_categories_read"  on guide_categories;
drop policy if exists "guide_categories_write" on guide_categories;
create policy "guide_categories_read" on guide_categories
  for select using (auth.uid() is not null);
create policy "guide_categories_write" on guide_categories
  for all using (public.is_studio_admin())
            with check (public.is_studio_admin());

-- Seed the categories that previously lived as text values, so existing
-- guides keep their grouping.
insert into guide_categories (slug, label, position) values
  ('general',   'כללי',       10),
  ('wordpress', 'וורדפרס',    20),
  ('clickup',   'ClickUp',    30),
  ('figma',     'Figma',      40),
  ('launch',    'עליה לאוויר', 50)
on conflict (slug) do nothing;

-- Add the FK column. Keep the legacy `category` text column for backward
-- compat — it still works as a fallback display label if category_id is
-- null, and lets us migrate at our own pace.
alter table guide_articles
  add column if not exists category_id uuid references guide_categories(id) on delete set null;
create index if not exists guide_articles_category_id_idx on guide_articles (category_id, position);

-- Backfill category_id for existing rows by slug match against the
-- legacy `category` text column.
update guide_articles g
   set category_id = c.id
  from guide_categories c
 where g.category_id is null
   and g.category = c.slug;

-- ── Project-targeted guides ───────────────────────────────────────────
-- A guide is either 'global' (visible to every project's training
-- workspace, modulo per-project hidden overrides) or 'project' (visible
-- only to the projects listed in project_guide_assignments).
alter table guide_articles
  add column if not exists visibility text not null default 'global'
    check (visibility in ('global', 'project'));

create table if not exists project_guide_assignments (
  project_id   uuid not null references projects(id) on delete cascade,
  guide_id     uuid not null references guide_articles(id) on delete cascade,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  primary key (project_id, guide_id)
);
create index if not exists project_guide_assignments_guide_idx
  on project_guide_assignments (guide_id);

alter table project_guide_assignments enable row level security;

drop policy if exists "project_guide_assignments_read"  on project_guide_assignments;
drop policy if exists "project_guide_assignments_write" on project_guide_assignments;
create policy "project_guide_assignments_read" on project_guide_assignments
  for select using (public.is_studio_admin() or public.is_project_member(project_id));
create policy "project_guide_assignments_write" on project_guide_assignments
  for all using (public.is_studio_admin())
            with check (public.is_studio_admin());

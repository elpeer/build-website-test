-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0011_guides_library
-- Purpose:   Studio-curated guide articles (Markdown + screenshots + video).
--            Available to every project's training workspace; per-project
--            opt-out via project_guide_overrides.
-- ════════════════════════════════════════════════════════════════════════

create table if not exists guide_articles (
  id              uuid primary key default uuid_generate_v4(),
  slug            text unique not null,
  title           text not null,
  description     text,
  content_md      text not null default '',
  video_url       text,
  cover_url       text,
  category        text,                       -- 'wordpress', 'clickup', 'general', etc.
  published       boolean not null default true,
  position        int not null default 0,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists guide_articles_category_idx on guide_articles (category, position);

create trigger trg_guide_articles_touch
  before update on guide_articles
  for each row execute function touch_updated_at();

alter table guide_articles enable row level security;

drop policy if exists "guides_read_authenticated" on guide_articles;
create policy "guides_read_authenticated" on guide_articles
  for select using (auth.uid() is not null and published);

drop policy if exists "guides_admin_write" on guide_articles;
create policy "guides_admin_write" on guide_articles
  for all using (public.is_studio_admin())
            with check (public.is_studio_admin());

-- Per-project hidden guides (so we can hide irrelevant ones for a client)
create table if not exists project_guide_overrides (
  project_id      uuid not null references projects(id) on delete cascade,
  guide_id        uuid not null references guide_articles(id) on delete cascade,
  hidden          boolean not null default false,
  primary key (project_id, guide_id)
);

alter table project_guide_overrides enable row level security;

drop policy if exists "project_guide_overrides_read"  on project_guide_overrides;
drop policy if exists "project_guide_overrides_write" on project_guide_overrides;
create policy "project_guide_overrides_read" on project_guide_overrides
  for select using (public.is_studio_admin() or public.is_project_member(project_id));
create policy "project_guide_overrides_write" on project_guide_overrides
  for all using (public.is_studio_admin() or public.is_project_member(project_id))
            with check (public.is_studio_admin() or public.is_project_member(project_id));

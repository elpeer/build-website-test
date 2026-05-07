-- ════════════════════════════════════════════════════════════════════════
-- Elevate Control — Initial schema
-- ════════════════════════════════════════════════════════════════════════
-- Migration:    0001_initial_schema
-- Author:       Elevate Digital Studio
-- Description:  Core entities (projects, pages, CPTs, sections, designs)
--               + RLS policies + auth helpers
-- ════════════════════════════════════════════════════════════════════════

-- ─── Extensions ─────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";    -- fuzzy search on names

-- ════════════════════════════════════════════════════════════════════════
-- 1. ENUMS
-- ════════════════════════════════════════════════════════════════════════

-- Roles inside the studio
create type user_role as enum (
  'super_admin',   -- agency owner, full access
  'pm',            -- project manager, sees all projects in their scope
  'designer',
  'developer',
  'client'         -- external, read-only on projects they're invited to
);

-- Project lifecycle states
create type project_status as enum (
  'draft',         -- kickoff in progress, not yet active
  'active',        -- ongoing development
  'on_hold',
  'review',        -- awaiting client review
  'completed',     -- delivered
  'archived'       -- moved to archive (read-only)
);

-- Per-page lifecycle (pages = WP pages, including CPT main pages)
create type page_status as enum (
  'planned',       -- exists in the tree, no design yet
  'designed',      -- design uploaded
  'sectioned',    -- sections defined and locked
  'in_dev',        -- developer is building
  'built',         -- HTML / WP implementation done
  'reviewed',      -- internal review passed
  'live'           -- shipped to client / production
);

-- Per-section lifecycle (more granular than page)
create type section_status as enum (
  'planned',       -- proposed, not yet confirmed
  'confirmed',     -- designer/PM approved structure
  'in_dev',
  'built',
  'reviewed'
);

-- What kind of "page" entity this is
create type page_type as enum (
  'page',          -- regular WP Page
  'archive',       -- CPT archive (a Page that lists a CPT)
  'single',        -- CPT single template
  'system',        -- 404, search, etc.
  'service'        -- non-CPT service page (transport, car-rental)
);

-- Viewport for design files
create type design_viewport as enum (
  'desktop',
  'tablet',
  'mobile'
);

-- Activity log — what kind of action
create type activity_kind as enum (
  'created',
  'updated',
  'deleted',
  'status_changed',
  'design_uploaded',
  'section_added',
  'section_removed',
  'commented',
  'claude_action'  -- Claude Code did something
);

-- ════════════════════════════════════════════════════════════════════════
-- 2. PROFILES (extends auth.users)
-- ════════════════════════════════════════════════════════════════════════

create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text unique not null,
  full_name       text,
  avatar_url      text,
  role            user_role not null default 'designer',
  studio_admin    boolean not null default false,  -- shortcut for super-admin checks
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-create a profile row when a user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ════════════════════════════════════════════════════════════════════════
-- 3. PROJECTS
-- ════════════════════════════════════════════════════════════════════════

create table projects (
  id                uuid primary key default uuid_generate_v4(),
  slug              text unique not null,             -- e.g. 'ninja-tours'
  name              text not null,                    -- e.g. 'Ninja Tours'
  client_name       text,                             -- client company name
  description       text,
  status            project_status not null default 'draft',

  -- Branding (extracted from the homepage design once it's locked)
  -- Keys: primary, accent, bg, ink, mid, line, etc. + typography_hebrew, typography_latin
  design_tokens     jsonb not null default '{}'::jsonb,
  logo_url          text,
  logo_dark_url     text,

  -- Git
  github_repo       text,                             -- "owner/repo"
  github_html_path  text default 'static-html',       -- folder for HTML deliverable
  github_theme_path text default 'wp-theme',          -- folder for WP theme

  -- Workflow flags
  has_wordpress     boolean not null default true,
  has_mobile_design boolean not null default true,    -- does designer ship mobile too?

  -- Dates
  kickoff_at        timestamptz,
  target_at         timestamptz,
  launched_at       timestamptz,

  -- Authors
  created_by        uuid references profiles(id) on delete set null,
  pm_id             uuid references profiles(id) on delete set null,

  -- Timestamps
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  archived_at       timestamptz
);

create index projects_status_idx       on projects (status) where archived_at is null;
create index projects_pm_idx           on projects (pm_id);
create index projects_slug_trgm_idx    on projects using gin (slug gin_trgm_ops);
create index projects_name_trgm_idx    on projects using gin (name gin_trgm_ops);

-- ════════════════════════════════════════════════════════════════════════
-- 4. PROJECT MEMBERS
-- ════════════════════════════════════════════════════════════════════════

create type member_role as enum (
  'owner',         -- usually the studio admin
  'pm',
  'designer',
  'developer',
  'reviewer',      -- internal QA
  'client'         -- external, limited access
);

create table project_members (
  project_id      uuid not null references projects(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  role            member_role not null,
  added_at        timestamptz not null default now(),
  added_by        uuid references profiles(id) on delete set null,
  primary key (project_id, user_id)
);

create index project_members_user_idx on project_members (user_id);

-- ════════════════════════════════════════════════════════════════════════
-- 5. CUSTOM POST TYPES (per project)
-- ════════════════════════════════════════════════════════════════════════

create table cpts (
  id                  uuid primary key default uuid_generate_v4(),
  project_id          uuid not null references projects(id) on delete cascade,
  slug                text not null,                 -- e.g. 'attraction'
  name_he             text,                          -- e.g. 'אטרקציות'
  name_en             text,                          -- e.g. 'Attractions'
  description         text,

  has_archive         boolean not null default true, -- has a public listing page
  has_single          boolean not null default true, -- has a public single template
  is_slider_only      boolean not null default false,

  -- ACF schema for per-post fields (JSON describing the field group)
  field_schema        jsonb not null default '[]'::jsonb,

  "order"             int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (project_id, slug)
);

create index cpts_project_idx on cpts (project_id);

-- ════════════════════════════════════════════════════════════════════════
-- 6. TAXONOMIES (per CPT)
-- ════════════════════════════════════════════════════════════════════════

create table taxonomies (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references projects(id) on delete cascade,
  cpt_id          uuid not null references cpts(id) on delete cascade,
  slug            text not null,                     -- e.g. 'attraction-category'
  name_he         text,
  name_en         text,
  hierarchical    boolean not null default false,    -- categories vs tags
  terms           jsonb not null default '[]'::jsonb,-- array of term names
  created_at      timestamptz not null default now(),
  unique (cpt_id, slug)
);

create index taxonomies_project_idx on taxonomies (project_id);
create index taxonomies_cpt_idx on taxonomies (cpt_id);

-- ════════════════════════════════════════════════════════════════════════
-- 7. SECTION DEFINITIONS (catalog of available section layouts)
-- ════════════════════════════════════════════════════════════════════════
-- These are SHARED across all projects — they mirror the section_recipes
-- in the elevate-website-builder skill and the FC layouts in the WP theme.
-- Per-project overrides are possible but discouraged.

create table section_definitions (
  id              uuid primary key default uuid_generate_v4(),
  slug            text unique not null,              -- e.g. 'home_hero'
  name_he         text,
  name_en         text,
  description     text,

  -- Visual aid
  preview_url     text,                              -- thumbnail
  recipe_id       text,                              -- maps to section-recipes.md

  -- Content schema (ACF subfield definitions in JSON)
  content_schema  jsonb not null default '[]'::jsonb,

  -- Whether the section pulls from a CPT (and if so, which)
  cpt_driven      boolean not null default false,
  cpt_slug        text,

  -- Categorization for the chooser UI
  category        text,                              -- 'hero', 'listing', 'cta', etc.
  is_global       boolean not null default true,     -- available to all projects

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index section_definitions_category_idx on section_definitions (category);

-- ════════════════════════════════════════════════════════════════════════
-- 8. PAGES (per project)
-- ════════════════════════════════════════════════════════════════════════

create table pages (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references projects(id) on delete cascade,

  slug            text not null,                     -- e.g. 'home', 'about', 'destinations'
  name_he         text,
  name_en         text,
  description     text,

  type            page_type not null default 'page',
  cpt_id          uuid references cpts(id) on delete set null,  -- only when type IN (archive, single)

  -- Public URL pattern (e.g. '/destination/{slug}/' for singles)
  url_pattern     text,

  -- Status & ordering
  status          page_status not null default 'planned',
  "order"         int not null default 0,

  -- Notes from designer / PM (editable WYSIWYG)
  notes           text,

  -- Authors
  created_by      uuid references profiles(id) on delete set null,
  assigned_to     uuid references profiles(id) on delete set null,

  -- Timestamps
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (project_id, slug)
);

create index pages_project_idx on pages (project_id);
create index pages_status_idx  on pages (status);
create index pages_order_idx   on pages (project_id, "order");

-- ════════════════════════════════════════════════════════════════════════
-- 9. SECTIONS (instances on pages)
-- ════════════════════════════════════════════════════════════════════════

create table sections (
  id                    uuid primary key default uuid_generate_v4(),
  page_id               uuid not null references pages(id) on delete cascade,
  definition_id         uuid references section_definitions(id) on delete restrict,
  definition_slug       text not null,               -- e.g. 'home_hero' (denormalized for speed)

  "order"               int not null default 0,
  status                section_status not null default 'planned',
  section_id_override   text,                        -- custom anchor id

  -- Content (mirrors what would go in the ACF group)
  content               jsonb not null default '{}'::jsonb,

  -- Designer's annotations on this section
  notes                 text,

  -- A region of the page design that this section corresponds to
  -- (set when the designer crops the design)
  design_id             uuid,                        -- → designs.id (added FK below)
  design_crop           jsonb,                       -- { x, y, width, height } as % of design

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index sections_page_idx on sections (page_id, "order");
create index sections_status_idx on sections (status);

-- ════════════════════════════════════════════════════════════════════════
-- 10. DESIGNS (uploaded design files)
-- ════════════════════════════════════════════════════════════════════════

create table designs (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references projects(id) on delete cascade,
  page_id         uuid references pages(id) on delete cascade,  -- nullable: full-project design refs

  viewport        design_viewport not null default 'desktop',
  storage_path    text not null,                     -- path inside Supabase Storage bucket
  file_url        text not null,                     -- public or signed URL
  file_size_bytes bigint,
  mime_type       text,
  width_px        int,
  height_px       int,

  -- AI analysis result (populated by Claude Vision when integrated)
  ai_analysis     jsonb,                             -- { sections: [...], colors: [...], fonts: [...] }
  ai_analyzed_at  timestamptz,

  -- Designer's notes on the file (free text)
  notes           text,

  uploaded_by     uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index designs_project_idx on designs (project_id);
create index designs_page_idx on designs (page_id);

-- Now we can add the FK from sections.design_id
alter table sections
  add constraint sections_design_id_fkey
  foreign key (design_id) references designs(id) on delete set null;

-- ════════════════════════════════════════════════════════════════════════
-- 11. ACTIVITY LOG (audit trail)
-- ════════════════════════════════════════════════════════════════════════

create table activity_log (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references projects(id) on delete cascade,

  actor_id        uuid references profiles(id) on delete set null,
  actor_label     text,                              -- 'Claude (claude-opus-4)' for AI actions

  kind            activity_kind not null,
  entity_type     text not null,                     -- 'project' | 'page' | 'section' | 'design' | …
  entity_id       uuid,
  summary         text,                              -- one-line description
  metadata        jsonb,                             -- before/after snapshots, etc.

  created_at      timestamptz not null default now()
);

create index activity_log_project_idx on activity_log (project_id, created_at desc);
create index activity_log_entity_idx on activity_log (entity_type, entity_id);

-- ════════════════════════════════════════════════════════════════════════
-- 12. UPDATED_AT TRIGGERS
-- ════════════════════════════════════════════════════════════════════════

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_touch        before update on profiles            for each row execute function touch_updated_at();
create trigger trg_projects_touch        before update on projects            for each row execute function touch_updated_at();
create trigger trg_cpts_touch            before update on cpts                for each row execute function touch_updated_at();
create trigger trg_pages_touch           before update on pages               for each row execute function touch_updated_at();
create trigger trg_sections_touch        before update on sections            for each row execute function touch_updated_at();
create trigger trg_section_defs_touch    before update on section_definitions for each row execute function touch_updated_at();

-- ════════════════════════════════════════════════════════════════════════
-- 13. RLS — ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════════
-- Service role (used by Claude/server) bypasses all of these.
-- Anon role has no access.
-- Authenticated users see what they're a member of, period.
-- super_admin / studio_admin sees everything.

-- Helper: is the current user a studio admin?
create or replace function public.is_studio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select studio_admin or role = 'super_admin' from profiles where id = auth.uid()),
    false
  );
$$;

-- Helper: is the current user a member of the given project?
create or replace function public.is_project_member(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from project_members
    where project_id = p_project_id
      and user_id = auth.uid()
  );
$$;

-- Enable RLS on every user-facing table
alter table profiles            enable row level security;
alter table projects            enable row level security;
alter table project_members     enable row level security;
alter table cpts                enable row level security;
alter table taxonomies          enable row level security;
alter table pages               enable row level security;
alter table sections            enable row level security;
alter table designs             enable row level security;
alter table activity_log        enable row level security;
alter table section_definitions enable row level security;

-- ─── PROFILES ────────────────────────────────────────────────────────
create policy "users see all profiles in their scope"
  on profiles for select
  to authenticated
  using (true);

create policy "users update their own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "studio admins manage profiles"
  on profiles for all
  to authenticated
  using (is_studio_admin())
  with check (is_studio_admin());

-- ─── PROJECTS ────────────────────────────────────────────────────────
create policy "members see their projects"
  on projects for select
  to authenticated
  using (
    is_studio_admin()
    or is_project_member(id)
  );

create policy "studio admins manage projects"
  on projects for all
  to authenticated
  using (is_studio_admin())
  with check (is_studio_admin());

create policy "PMs update their projects"
  on projects for update
  to authenticated
  using (
    pm_id = auth.uid()
    or is_studio_admin()
  )
  with check (
    pm_id = auth.uid()
    or is_studio_admin()
  );

-- ─── PROJECT_MEMBERS ─────────────────────────────────────────────────
create policy "members see other members of their projects"
  on project_members for select
  to authenticated
  using (
    is_studio_admin()
    or is_project_member(project_id)
  );

create policy "studio admins manage memberships"
  on project_members for all
  to authenticated
  using (is_studio_admin())
  with check (is_studio_admin());

-- ─── PAGES / SECTIONS / CPTs / TAXONOMIES / DESIGNS — same pattern ───
do $$
declare
  t text;
begin
  foreach t in array array['cpts','taxonomies','pages','sections','designs','activity_log']
  loop
    execute format($f$
      create policy "members read %1$s"
        on %1$I for select
        to authenticated
        using (
          is_studio_admin()
          or is_project_member(project_id)
        );
    $f$, t);

    execute format($f$
      create policy "members write %1$s"
        on %1$I for all
        to authenticated
        using (
          is_studio_admin()
          or is_project_member(project_id)
        )
        with check (
          is_studio_admin()
          or is_project_member(project_id)
        );
    $f$, t);
  end loop;
end $$;

-- Sections is special — it has no project_id, only page_id
drop policy if exists "members read sections" on sections;
drop policy if exists "members write sections" on sections;

create policy "members read sections via page"
  on sections for select
  to authenticated
  using (
    is_studio_admin()
    or exists (
      select 1 from pages p
      where p.id = sections.page_id
        and is_project_member(p.project_id)
    )
  );

create policy "members write sections via page"
  on sections for all
  to authenticated
  using (
    is_studio_admin()
    or exists (
      select 1 from pages p
      where p.id = sections.page_id
        and is_project_member(p.project_id)
    )
  )
  with check (
    is_studio_admin()
    or exists (
      select 1 from pages p
      where p.id = sections.page_id
        and is_project_member(p.project_id)
    )
  );

-- ─── SECTION_DEFINITIONS (global catalog) ────────────────────────────
create policy "all authenticated users read section definitions"
  on section_definitions for select
  to authenticated
  using (true);

create policy "studio admins manage section definitions"
  on section_definitions for all
  to authenticated
  using (is_studio_admin())
  with check (is_studio_admin());

-- ════════════════════════════════════════════════════════════════════════
-- 14. SEED DATA — section_definitions (the catalog from the skill)
-- ════════════════════════════════════════════════════════════════════════

insert into section_definitions (slug, name_he, name_en, category, recipe_id, cpt_driven, cpt_slug) values
  ('home_hero',           'Hero (עמוד בית)',          'Home Hero',                  'hero',     'recipe-1',  false, null),
  ('page_hero',           'Hero (עמודי קטלוג)',       'Page Hero',                  'hero',     null,        false, null),
  ('service_hero',        'Hero (שירותים)',           'Service Hero',               'hero',     null,        false, null),
  ('travel_type_hero',    'Hero (CPT פנימי)',         'Travel-Type Hero',           'hero',     null,        false, null),

  ('why_us',              'למה אנחנו',                 'Why Us',                     'feature',  null,        false, null),
  ('process',             'תהליך עבודה',                'Process Timeline',           'feature',  'recipe-6',  false, null),
  ('content_media',       'תוכן + תמונה',              'Content + Media',            'feature',  null,        false, null),
  ('about_with_sidebar',  'תוכן עם סיידבר',             'About with Sidebar',         'content',  null,        false, null),
  ('meta_strip',          'רצועת מטא',                 'Meta Strip',                 'utility',  null,        false, null),
  ('image_separator',     'מפריד תמונה',                'Image Separator',            'utility',  null,        false, null),
  ('itinerary',           'מסלול ימים',                 'Itinerary Timeline',         'feature',  null,        false, null),
  ('tips',                'טיפים',                     'Tips',                       'feature',  null,        false, null),

  ('trip_types',          'סליידר סוגי טיולים',          'Trip Types Slider',          'listing',  null,        true,  'travel-type'),
  ('attractions',         'אטרקציות (טאבים)',           'Attractions (homepage)',     'listing',  null,        true,  'attraction'),
  ('attractions_listing', 'אטרקציות (קטלוג)',           'Attractions Listing',        'listing',  null,        true,  'attraction'),
  ('destinations',        'יעדים',                      'Destinations',               'listing',  null,        true,  'destination'),
  ('hotels_listing',      'מלונות (קטלוג)',             'Hotels Listing',             'listing',  null,        true,  'hotel'),
  ('use_cases',           'Use Cases (סליידר)',         'Use Cases Slider',           'listing',  null,        true,  'use-case'),
  ('use_cases_listing',   'Use Cases (קטלוג)',          'Use Cases Listing',          'listing',  null,        true,  'use-case'),
  ('testimonials',        'המלצות לקוחות',              'Client Reviews',             'listing',  null,        true,  'client-review'),

  ('partners',             'שותפים (לוגואים)',          'Partners',                   'social',   null,        false, null),
  ('contact',              'צור קשר',                  'Contact',                    'cta',      null,        false, null),
  ('service_types',        'סוגי שירות',                'Service Types',              'listing',  null,        false, null),
  ('service_info',         'מידע שירות (3 עמודות)',     'Service Info',               'feature',  null,        false, null),
  ('faq',                  'שאלות נפוצות',              'FAQ',                        'feature',  null,        false, null);

-- ════════════════════════════════════════════════════════════════════════
-- 15. STORAGE BUCKETS (will be created via separate migration / dashboard)
-- ════════════════════════════════════════════════════════════════════════
-- TODO: create buckets `designs`, `logos`, `previews` via Supabase dashboard
--       or in a follow-up migration that uses storage.create_bucket()

-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0024_ascii_slugs
-- Purpose:   Vercel's edge layer 404s on URLs that contain non-ASCII
--            bytes in dynamic segments. Convert every existing
--            project/page slug that contains Hebrew (or any other
--            non-ASCII) characters into ASCII via transliteration.
--            Going forward, slugify() in the app produces ASCII-only
--            output so this migration is a one-time clean-up.
--
-- Detection:  octet_length(slug) > char_length(slug) — true iff the
--             slug contains any multi-byte (non-ASCII) char in UTF-8.
-- ════════════════════════════════════════════════════════════════════════

-- Hebrew transliteration. Multi-char sequences (sh/ts/ch) need
-- replace; single chars go through translate().
create or replace function public._translit_he(s text)
returns text
language sql
immutable
as $$
  with multi as (
    select replace(replace(replace(replace(
             lower(coalesce(s, '')),
           'ש','sh'), 'צ','ts'), 'ץ','ts'), 'ח','ch') as v
  )
  select translate(
    multi.v,
    'אבגדהוזטיכךלמםנןסעפףקרת',
    'abgdhvztyklkmmnnsappkrt'
  )
  from multi;
$$;

-- After transliteration, drop anything that's still not [a-z0-9-],
-- collapse whitespace + repeated dashes, trim leading/trailing
-- dashes. Output is guaranteed to be valid for a URL segment.
create or replace function public._slug_normalize(s text)
returns text
language sql
immutable
as $$
  with stage1 as (select public._translit_he(s) as v),
       stage2 as (select regexp_replace(stage1.v, '[^a-z0-9[:space:]-]', '', 'g') as v from stage1),
       stage3 as (select regexp_replace(stage2.v, '[[:space:]]+', '-', 'g') as v from stage2),
       stage4 as (select regexp_replace(stage3.v, '-+', '-', 'g') as v from stage3)
  select regexp_replace(stage4.v, '^-|-$', '', 'g') from stage4;
$$;

-- ─── Projects ─────────────────────────────────────────────────────────
-- Append a short id suffix when transliteration would clash with an
-- existing project's slug (two Hebrew names → same ASCII).
update public.projects
   set slug = public._slug_normalize(slug) || '-' || left(id::text, 6)
 where octet_length(slug) > char_length(slug)
   and public._slug_normalize(slug) <> ''
   and exists (
     select 1 from public.projects p2
      where p2.id <> projects.id
        and p2.slug = public._slug_normalize(projects.slug)
   );

update public.projects
   set slug = public._slug_normalize(slug)
 where octet_length(slug) > char_length(slug)
   and public._slug_normalize(slug) <> '';

-- Edge case: slug had no transliterable chars (e.g. emoji-only).
update public.projects
   set slug = 'project-' || left(id::text, 8)
 where octet_length(slug) > char_length(slug)
    or slug = '';

-- ─── Pages ────────────────────────────────────────────────────────────
update public.pages
   set slug = public._slug_normalize(slug) || '-' || left(id::text, 6)
 where octet_length(slug) > char_length(slug)
   and public._slug_normalize(slug) <> ''
   and exists (
     select 1 from public.pages p2
      where p2.project_id = pages.project_id
        and p2.id <> pages.id
        and p2.slug = public._slug_normalize(pages.slug)
   );

update public.pages
   set slug = public._slug_normalize(slug)
 where octet_length(slug) > char_length(slug)
   and public._slug_normalize(slug) <> '';

update public.pages
   set slug = 'page-' || left(id::text, 8)
 where octet_length(slug) > char_length(slug)
    or slug = '';

-- Drop the helper functions — one-shot migration utilities.
drop function if exists public._slug_normalize(text);
drop function if exists public._translit_he(text);

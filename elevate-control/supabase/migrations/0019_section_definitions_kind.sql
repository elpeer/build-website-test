-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0019_section_definitions_kind
-- Purpose:   Categorize sections by structural role so the section
--            library can filter them by kind (hero / content / cta /
--            feature / form / testimonial / gallery / process / etc.).
--            The kind is independent from `context` (page / cpt_archive /
--            cpt_inner / system) which already exists.
-- ════════════════════════════════════════════════════════════════════════

alter table public.section_definitions
  add column if not exists kind text;

-- Heuristic backfill from slug — best-effort for the common families.
update public.section_definitions
   set kind = 'hero'
 where kind is null and (slug ilike 'hero%' or slug ilike '%hero');
update public.section_definitions
   set kind = 'cta'
 where kind is null and (slug ilike '%cta%' or slug ilike 'call_to_action%');
update public.section_definitions
   set kind = 'feature'
 where kind is null and (slug ilike 'feature%' or slug ilike '%why_us%' or slug ilike 'usp%');
update public.section_definitions
   set kind = 'testimonial'
 where kind is null and slug ilike '%testimonial%';
update public.section_definitions
   set kind = 'gallery'
 where kind is null and (slug ilike '%gallery%' or slug ilike '%collage%');
update public.section_definitions
   set kind = 'form'
 where kind is null and (slug ilike '%form%' or slug ilike 'contact%' or slug ilike '%newsletter%');
update public.section_definitions
   set kind = 'cpt_grid'
 where kind is null and (slug ilike 'cpt_grid%' or slug ilike '%_grid' or slug ilike '%_listing');
update public.section_definitions
   set kind = 'process'
 where kind is null and (slug ilike '%process%' or slug ilike '%steps%' or slug ilike '%timeline%');
update public.section_definitions
   set kind = 'faq'
 where kind is null and slug ilike '%faq%';
update public.section_definitions
   set kind = 'partners'
 where kind is null and (slug ilike '%partners%' or slug ilike '%clients_logos%' or slug ilike '%logos%');
update public.section_definitions
   set kind = 'image_separator'
 where kind is null and (slug ilike '%separator%' or slug ilike '%divider%' or slug ilike '%full_image%');
update public.section_definitions
   set kind = 'content'
 where kind is null and (slug = 'content_block' or slug ilike '%content%' or slug ilike '%text%' or slug ilike '%media%');
-- Anything still null → 'other' so the filter has a stable bucket.
update public.section_definitions set kind = 'other' where kind is null;

create index if not exists section_definitions_kind_idx
  on public.section_definitions (kind);

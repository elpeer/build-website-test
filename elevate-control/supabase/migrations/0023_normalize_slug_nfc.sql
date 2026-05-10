-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0023_normalize_slug_nfc
-- Purpose:   Slugs created before slugify() enforced NFC normalization
--            could have been saved in NFD form, which causes 404s when
--            the dynamic route delivers the same characters in NFC and
--            the .eq('slug', …) lookup misses. Renormalize all existing
--            project + page slugs to NFC.
-- ════════════════════════════════════════════════════════════════════════

update public.projects
   set slug = normalize(slug, NFC)
 where slug is distinct from normalize(slug, NFC);

update public.pages
   set slug = normalize(slug, NFC)
 where slug is distinct from normalize(slug, NFC);

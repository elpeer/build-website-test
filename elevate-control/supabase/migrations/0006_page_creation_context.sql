-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0006_page_creation_context
-- Purpose:   Pages produced by materializeAnalysis (or by suggest-page-
--            structure) carry a JSONB context blob explaining *why* they
--            exist — which design + page + section triggered them, what
--            their siblings are, and (later) the proposed/approved
--            structure for the page.
-- ════════════════════════════════════════════════════════════════════════

alter table pages
  add column if not exists creation_context jsonb;

create index if not exists pages_creation_context_idx
  on pages using gin (creation_context);

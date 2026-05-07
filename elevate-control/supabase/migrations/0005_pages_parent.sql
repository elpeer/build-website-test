-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0005_pages_parent
-- Purpose:   Add parent_id to pages so the site tree can express hierarchy
--            (a page belongs under another page — e.g. team members under
--            "About", terms under footer/utility).
-- ════════════════════════════════════════════════════════════════════════

alter table pages
  add column if not exists parent_id uuid references pages(id) on delete set null;

create index if not exists pages_parent_idx on pages (parent_id);

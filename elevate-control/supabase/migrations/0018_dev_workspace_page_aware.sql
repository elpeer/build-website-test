-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0018_dev_workspace_page_aware
-- Purpose:   Tie development-workspace approvals to pages from the site
--            tree, and add an optional per-page CMS URL override that
--            takes precedence over the auto-derived staging_url + slug.
-- ════════════════════════════════════════════════════════════════════════

alter table public.client_approvals
  add column if not exists page_id uuid references public.pages(id) on delete set null;

create index if not exists client_approvals_page_idx
  on public.client_approvals (page_id, kind);

alter table public.pages
  add column if not exists cms_url_override text;

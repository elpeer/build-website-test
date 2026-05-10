-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0020_pages_preview_override_and_dev_status
-- Purpose:   Per-page manual preview URL override (wins over the GitHub
--            auto-detection) + a dev-workflow status enum that gates
--            client visibility in the development workspace.
-- ════════════════════════════════════════════════════════════════════════

alter table public.pages
  add column if not exists preview_url_override text;

alter table public.pages
  add column if not exists dev_status text not null default 'in_dev'
  check (dev_status in ('in_dev', 'awaiting_pm', 'pm_approved', 'client_visible'));

create index if not exists pages_dev_status_idx
  on public.pages (project_id, dev_status);

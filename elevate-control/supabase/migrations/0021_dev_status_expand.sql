-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0021_dev_status_expand
-- Purpose:   Expand pages.dev_status with two more values:
--              * 'awaiting_dev'        — new default for fresh pages
--              * 'client_visible_full' — same as 'client_visible' plus
--                                         exposes the CMS tab to the client
--            Existing rows are preserved as-is. The existing
--            'client_visible' value now means "frontend only".
-- ════════════════════════════════════════════════════════════════════════

alter table public.pages
  drop constraint if exists pages_dev_status_check;

alter table public.pages
  alter column dev_status set default 'awaiting_dev',
  add constraint pages_dev_status_check
    check (dev_status in (
      'awaiting_dev',
      'in_dev',
      'awaiting_pm',
      'pm_approved',
      'client_visible',
      'client_visible_full'
    ));

-- Add a client-facing fix_note field to checklist items so QA bug reports
-- can live inline on each check, instead of bouncing through the comments
-- thread.
alter table public.checklist_items
  add column if not exists client_note text;

-- Payment milestones (finance workspace) carry an amount in agorot. We
-- store it on every checklist item to keep the schema flat — only the
-- finance workspace renders it.
alter table public.checklist_items
  add column if not exists amount_cents bigint;

-- Note: cms_user / cms_password / external_content_url live in the
-- existing projects.workspace_settings JSON, no schema change needed.

-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0027_comment_acknowledge
-- Purpose:   Let a comment message be marked "handled / clear" (✓). A
--            message from the other side that isn't acknowledged yet is
--            rendered highlighted ("new"); clicking ✓ stamps who/when and
--            clears the highlight. Shared state — both sides see it.
-- ════════════════════════════════════════════════════════════════════════

alter table public.comment_messages
  add column if not exists acknowledged_at timestamptz;

alter table public.comment_messages
  add column if not exists acknowledged_by uuid
    references public.profiles(id) on delete set null;

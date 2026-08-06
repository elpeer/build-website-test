-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0026_comment_reply_to
-- Purpose:   Let a comment message reply to a specific earlier message in
--            the same thread (quoted / nested reply). The author + a short
--            snippet of the parent are denormalized onto the reply so the
--            UI can render the quote without a self-join, and so it
--            survives the parent being deleted.
-- ════════════════════════════════════════════════════════════════════════

alter table public.comment_messages
  add column if not exists reply_to_id uuid
    references public.comment_messages(id) on delete set null;

alter table public.comment_messages
  add column if not exists reply_to_author text;

alter table public.comment_messages
  add column if not exists reply_to_snippet text;

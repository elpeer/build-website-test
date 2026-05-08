-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0018_guide_badge
-- Purpose:   Optional badge text on a guide so the studio can highlight
--            popular / new / recommended guides with a small colored pill
--            on the card. Free-text so any label works.
-- ════════════════════════════════════════════════════════════════════════

alter table public.guide_articles
  add column if not exists badge text;

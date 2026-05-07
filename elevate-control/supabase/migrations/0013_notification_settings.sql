-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0013_notification_settings
-- Purpose:   Per-user notification preferences (daily digest opt-in,
--            preferred delivery hour). Used by /api/cron/daily-digest.
-- ════════════════════════════════════════════════════════════════════════

alter table profiles
  add column if not exists daily_digest_enabled boolean not null default false,
  add column if not exists daily_digest_hour    int     not null default 9 check (daily_digest_hour between 0 and 23),
  add column if not exists digest_last_sent_at  timestamptz;

create index if not exists profiles_digest_idx
  on profiles (daily_digest_hour)
  where daily_digest_enabled = true;

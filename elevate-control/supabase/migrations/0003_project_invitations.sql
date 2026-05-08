-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0003_project_invitations
-- Purpose:   Pending email-based invitations to projects. When a user signs
--            up later with a matching email, they're auto-attached to the
--            relevant project_members rows.
-- ════════════════════════════════════════════════════════════════════════

create table project_invitations (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references projects(id) on delete cascade,
  email           text not null,
  role            member_role not null default 'designer',
  invited_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  accepted_at     timestamptz,

  unique (project_id, email)
);

create index project_invitations_email_idx on project_invitations (lower(email));

alter table project_invitations enable row level security;

-- Only project members + studio admins can read invitations
create policy "project_invitations_read" on project_invitations
  for select using (
    public.is_studio_admin() or public.is_project_member(project_id)
  );

-- Only project members + studio admins can write
create policy "project_invitations_write" on project_invitations
  for all using (
    public.is_studio_admin() or public.is_project_member(project_id)
  ) with check (
    public.is_studio_admin() or public.is_project_member(project_id)
  );

-- ─── Auto-attach helper ─────────────────────────────────────────────────
-- Called from a server action after sign-in. Looks at the current user's
-- email, finds matching pending invitations, inserts project_members rows,
-- and marks the invitations accepted. Idempotent.
create or replace function public.accept_pending_invitations()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id   uuid := auth.uid();
  v_email     text;
  v_count     int := 0;
begin
  if v_user_id is null then
    return 0;
  end if;

  select email into v_email from auth.users where id = v_user_id;
  if v_email is null then
    return 0;
  end if;

  with attached as (
    insert into project_members (project_id, user_id, role, added_by)
    select pi.project_id, v_user_id, pi.role, pi.invited_by
    from project_invitations pi
    where lower(pi.email) = lower(v_email)
      and pi.accepted_at is null
    on conflict (project_id, user_id) do nothing
    returning project_id
  )
  update project_invitations pi
     set accepted_at = now()
   where lower(pi.email) = lower(v_email)
     and pi.accepted_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.accept_pending_invitations() to authenticated;

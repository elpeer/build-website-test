-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0007_studio_invitations_and_brand
-- Purpose:
--   1. New `studio_invitations` table — invite a user to the studio
--      itself (not a specific project). On first sign-in, the user gets
--      the configured global role + optional studio_admin flag.
--   2. `accept_studio_invitations()` SECURITY DEFINER RPC — applies any
--      pending invitations matching the current user's email.
--   3. `auto_attach_pms_to_project()` trigger — every time a project is
--      created, automatically add every profile with role='pm' (and
--      every studio_admin) as a project_member with role='pm'/'owner'.
--      PMs can still be removed per-project after the fact.
--   4. Add `vercel_url` to projects (the project's deployed front-end).
-- ════════════════════════════════════════════════════════════════════════

-- ─── 1. Studio invitations ─────────────────────────────────────────────
create table if not exists studio_invitations (
  id            uuid primary key default uuid_generate_v4(),
  email         text not null,
  role          user_role not null default 'designer',
  studio_admin  boolean not null default false,
  invited_by    uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  accepted_at   timestamptz,
  unique (email)
);

create index if not exists studio_invitations_email_idx on studio_invitations (lower(email));

alter table studio_invitations enable row level security;

-- Only studio admins can read or write studio invitations.
drop policy if exists "studio_invitations_admin_read" on studio_invitations;
create policy "studio_invitations_admin_read" on studio_invitations
  for select using (public.is_studio_admin());

drop policy if exists "studio_invitations_admin_write" on studio_invitations;
create policy "studio_invitations_admin_write" on studio_invitations
  for all using (public.is_studio_admin())
            with check (public.is_studio_admin());

-- ─── 2. Auto-accept on first sign-in ───────────────────────────────────
create or replace function public.accept_studio_invitations()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email   text;
  v_count   int := 0;
begin
  if v_user_id is null then return 0; end if;
  select email into v_email from auth.users where id = v_user_id;
  if v_email is null then return 0; end if;

  -- Apply each unaccepted invitation matching this email.
  update profiles p
     set role         = i.role,
         studio_admin = i.studio_admin
    from studio_invitations i
   where lower(i.email) = lower(v_email)
     and i.accepted_at is null
     and p.id = v_user_id;

  with marked as (
    update studio_invitations i
       set accepted_at = now()
     where lower(i.email) = lower(v_email)
       and i.accepted_at is null
    returning 1
  )
  select count(*) into v_count from marked;

  return v_count;
end;
$$;

grant execute on function public.accept_studio_invitations() to authenticated;

-- ─── 3. Auto-attach PMs to every new project ───────────────────────────
create or replace function public.auto_attach_pms_to_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert every profile with role='pm' OR studio_admin=true as a member
  -- of the new project. Skip if they're already a member (e.g. the creator
  -- has already been added with role='owner').
  insert into project_members (project_id, user_id, role, added_by)
  select new.id,
         p.id,
         case
           when new.created_by = p.id              then 'owner'::member_role
           when p.studio_admin                      then 'pm'::member_role
           else 'pm'::member_role
         end,
         new.created_by
    from profiles p
   where (p.role = 'pm' or p.studio_admin = true)
     and not exists (
       select 1 from project_members pm
        where pm.project_id = new.id and pm.user_id = p.id
     );
  return new;
end;
$$;

drop trigger if exists trg_auto_attach_pms on projects;
create trigger trg_auto_attach_pms
  after insert on projects
  for each row execute function public.auto_attach_pms_to_project();

-- ─── 4. Vercel URL on projects ─────────────────────────────────────────
alter table projects
  add column if not exists vercel_url text;

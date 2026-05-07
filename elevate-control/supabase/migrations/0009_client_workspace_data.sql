-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0009_client_workspace_data
-- Purpose:   Backbone for the client dashboard workspaces — approvals,
--            comment threads + messages, checklist items, project files,
--            workspace-level settings.
-- ════════════════════════════════════════════════════════════════════════

-- ─── Approvals (per workspace) ────────────────────────────────────────
create table if not exists client_approvals (
  id                  uuid primary key default uuid_generate_v4(),
  project_id          uuid not null references projects(id) on delete cascade,
  workspace           text not null,
  title               text not null,
  description         text,
  link_url            text,
  thumbnail_url       text,
  metadata            jsonb,
  status              text not null default 'pending'
                        check (status in ('pending','approved','changes_requested','rejected')),
  status_note         text,
  status_changed_by   uuid references profiles(id) on delete set null,
  status_changed_at   timestamptz,
  position            int not null default 0,
  created_by          uuid references profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists client_approvals_project_idx on client_approvals (project_id);
create index if not exists client_approvals_workspace_idx on client_approvals (project_id, workspace);

create trigger trg_client_approvals_touch
  before update on client_approvals
  for each row execute function touch_updated_at();

alter table client_approvals enable row level security;
drop policy if exists "client_approvals_read"  on client_approvals;
drop policy if exists "client_approvals_write" on client_approvals;
create policy "client_approvals_read"  on client_approvals
  for select using (public.is_studio_admin() or public.is_project_member(project_id));
create policy "client_approvals_write" on client_approvals
  for all using (public.is_studio_admin() or public.is_project_member(project_id))
            with check (public.is_studio_admin() or public.is_project_member(project_id));

-- ─── Comment threads + messages ───────────────────────────────────────
create table if not exists comment_threads (
  id                  uuid primary key default uuid_generate_v4(),
  project_id          uuid not null references projects(id) on delete cascade,
  context_type        text not null,    -- 'approval' | 'workspace' | 'page' | 'section'
  context_id          uuid,             -- approval/page/section id; null for workspace-level
  workspace           text,             -- always set when context_type='workspace'
  title               text,
  status              text not null default 'open'
                        check (status in ('open','in_progress','resolved','wont_fix')),
  created_by          uuid references profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists comment_threads_project_idx on comment_threads (project_id);
create index if not exists comment_threads_context_idx on comment_threads (context_type, context_id);

create trigger trg_comment_threads_touch
  before update on comment_threads
  for each row execute function touch_updated_at();

alter table comment_threads enable row level security;
drop policy if exists "comment_threads_read"  on comment_threads;
drop policy if exists "comment_threads_write" on comment_threads;
create policy "comment_threads_read"  on comment_threads
  for select using (public.is_studio_admin() or public.is_project_member(project_id));
create policy "comment_threads_write" on comment_threads
  for all using (public.is_studio_admin() or public.is_project_member(project_id))
            with check (public.is_studio_admin() or public.is_project_member(project_id));

create table if not exists comment_messages (
  id                  uuid primary key default uuid_generate_v4(),
  thread_id           uuid not null references comment_threads(id) on delete cascade,
  author_id           uuid references profiles(id) on delete set null,
  author_label        text,
  body                text not null default '',
  attachments         jsonb not null default '[]'::jsonb,  -- [{url, name, mime, size_bytes}]
  created_at          timestamptz not null default now()
);
create index if not exists comment_messages_thread_idx on comment_messages (thread_id, created_at);

alter table comment_messages enable row level security;
drop policy if exists "comment_messages_read"  on comment_messages;
drop policy if exists "comment_messages_write" on comment_messages;
create policy "comment_messages_read" on comment_messages
  for select using (
    exists (select 1 from comment_threads t
             where t.id = comment_messages.thread_id
               and (public.is_studio_admin() or public.is_project_member(t.project_id)))
  );
create policy "comment_messages_write" on comment_messages
  for all using (
    exists (select 1 from comment_threads t
             where t.id = comment_messages.thread_id
               and (public.is_studio_admin() or public.is_project_member(t.project_id)))
  ) with check (
    exists (select 1 from comment_threads t
             where t.id = comment_messages.thread_id
               and (public.is_studio_admin() or public.is_project_member(t.project_id)))
  );

-- ─── Checklist items (per workspace) ──────────────────────────────────
create table if not exists checklist_items (
  id                  uuid primary key default uuid_generate_v4(),
  project_id          uuid not null references projects(id) on delete cascade,
  workspace           text not null,
  title               text not null,
  description         text,
  link_url            text,
  input_type          text,             -- 'text' | 'code' | 'url' | 'file' | null
  input_value         text,
  attachment_url      text,
  status              text not null default 'pending'
                        check (status in ('pending','in_progress','done','na')),
  status_changed_by   uuid references profiles(id) on delete set null,
  status_changed_at   timestamptz,
  position            int not null default 0,
  created_by          uuid references profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists checklist_items_project_idx on checklist_items (project_id);
create index if not exists checklist_items_workspace_idx on checklist_items (project_id, workspace);

create trigger trg_checklist_items_touch
  before update on checklist_items
  for each row execute function touch_updated_at();

alter table checklist_items enable row level security;
drop policy if exists "checklist_items_read"  on checklist_items;
drop policy if exists "checklist_items_write" on checklist_items;
create policy "checklist_items_read"  on checklist_items
  for select using (public.is_studio_admin() or public.is_project_member(project_id));
create policy "checklist_items_write" on checklist_items
  for all using (public.is_studio_admin() or public.is_project_member(project_id))
            with check (public.is_studio_admin() or public.is_project_member(project_id));

-- ─── Project files (general uploads) ──────────────────────────────────
create table if not exists project_files (
  id                  uuid primary key default uuid_generate_v4(),
  project_id          uuid not null references projects(id) on delete cascade,
  workspace           text,
  filename            text not null,
  storage_path        text not null,
  file_url            text not null,
  mime_type           text,
  size_bytes          bigint,
  notes               text,
  uploaded_by         uuid references profiles(id) on delete set null,
  created_at          timestamptz not null default now()
);
create index if not exists project_files_project_idx on project_files (project_id);
create index if not exists project_files_workspace_idx on project_files (project_id, workspace);

alter table project_files enable row level security;
drop policy if exists "project_files_read"  on project_files;
drop policy if exists "project_files_write" on project_files;
create policy "project_files_read"  on project_files
  for select using (public.is_studio_admin() or public.is_project_member(project_id));
create policy "project_files_write" on project_files
  for all using (public.is_studio_admin() or public.is_project_member(project_id))
            with check (public.is_studio_admin() or public.is_project_member(project_id));

-- ─── Workspace settings (per-project freeform JSON) ───────────────────
alter table projects
  add column if not exists workspace_settings jsonb not null default '{}'::jsonb;

-- ─── Storage bucket for client files (comments + uploads) ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-files', 'client-files', false,
  52428800, -- 50 MB
  array[
    'image/png','image/jpeg','image/webp','image/gif',
    'application/pdf', 'application/zip',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ]
)
on conflict (id) do nothing;

drop policy if exists "client_files_read"   on storage.objects;
drop policy if exists "client_files_insert" on storage.objects;
drop policy if exists "client_files_delete" on storage.objects;

create policy "client_files_read" on storage.objects
  for select using (
    bucket_id = 'client-files'
    and (
      public.is_studio_admin()
      or public.is_project_member((storage.foldername(name))[1]::uuid)
    )
  );

create policy "client_files_insert" on storage.objects
  for insert with check (
    bucket_id = 'client-files'
    and auth.uid() is not null
    and (
      public.is_studio_admin()
      or public.is_project_member((storage.foldername(name))[1]::uuid)
    )
  );

create policy "client_files_delete" on storage.objects
  for delete using (
    bucket_id = 'client-files'
    and (
      public.is_studio_admin()
      or public.is_project_member((storage.foldername(name))[1]::uuid)
    )
  );

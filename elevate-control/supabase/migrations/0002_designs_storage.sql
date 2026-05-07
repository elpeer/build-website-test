-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0002_designs_storage
-- Purpose:   Create the `designs` storage bucket + RLS policies for design
--            file uploads. Files are scoped to a project; only project
--            members can read; only authenticated members can write.
-- ════════════════════════════════════════════════════════════════════════

-- Create the bucket. Public:false → all reads go through signed URLs.
-- (We can switch to public later if we want share links without auth.)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'designs',
  'designs',
  false,
  52428800, -- 50 MB cap per file
  array['image/png','image/jpeg','image/webp','image/gif','application/pdf']
)
on conflict (id) do nothing;

-- ─── Path convention ────────────────────────────────────────────────────
-- All design files live under: <project_id>/<uuid>.<ext>
-- The first path segment is the project_id, which gives us a clean way
-- to enforce project-membership-based RLS via storage.foldername().

-- ─── RLS policies ───────────────────────────────────────────────────────

-- READ: project members + studio admins
create policy "designs_read_members" on storage.objects
  for select using (
    bucket_id = 'designs'
    and (
      public.is_studio_admin()
      or public.is_project_member((storage.foldername(name))[1]::uuid)
    )
  );

-- INSERT: project members + studio admins
create policy "designs_insert_members" on storage.objects
  for insert with check (
    bucket_id = 'designs'
    and auth.uid() is not null
    and (
      public.is_studio_admin()
      or public.is_project_member((storage.foldername(name))[1]::uuid)
    )
  );

-- DELETE: project members + studio admins
create policy "designs_delete_members" on storage.objects
  for delete using (
    bucket_id = 'designs'
    and (
      public.is_studio_admin()
      or public.is_project_member((storage.foldername(name))[1]::uuid)
    )
  );

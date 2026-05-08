-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0012_guide_rich_content
-- Purpose:   Switch guides to rich HTML (output of Tiptap) and add a public
--            storage bucket for pasted screenshots inside the editor.
-- ════════════════════════════════════════════════════════════════════════

-- Rich HTML content. Existing content_md kept around for backward compat.
alter table guide_articles
  add column if not exists content_html text not null default '';

-- Public bucket for inline images pasted into guides. Public reads (so the
-- HTML embeds work everywhere, including in email digests) — only studio
-- admins can write/delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'guide-images', 'guide-images', true,
  10485760, -- 10 MB
  array['image/png','image/jpeg','image/webp','image/gif']
)
on conflict (id) do nothing;

drop policy if exists "guide_images_read"   on storage.objects;
drop policy if exists "guide_images_insert" on storage.objects;
drop policy if exists "guide_images_delete" on storage.objects;

create policy "guide_images_read" on storage.objects
  for select using (bucket_id = 'guide-images');

create policy "guide_images_insert" on storage.objects
  for insert with check (
    bucket_id = 'guide-images'
    and auth.uid() is not null
    and public.is_studio_admin()
  );

create policy "guide_images_delete" on storage.objects
  for delete using (
    bucket_id = 'guide-images'
    and public.is_studio_admin()
  );

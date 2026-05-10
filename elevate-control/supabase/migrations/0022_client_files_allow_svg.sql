-- ════════════════════════════════════════════════════════════════════════
-- Migration: 0022_client_files_allow_svg
-- Purpose:   Allow SVG uploads in the 'client-files' storage bucket so
--            studios can upload brand-book logos in vector form.
--            The original bucket created in 0009 was inserted with
--            `on conflict do nothing`, so re-running that migration
--            would not pick up new mime types. This migration patches
--            the existing bucket in place.
--
-- NOTE: SVG can contain inline JavaScript. Only studio members upload
--       to brand-book categories, but be cautious about rendering
--       user-supplied SVGs inline elsewhere.
-- ════════════════════════════════════════════════════════════════════════

update storage.buckets
   set allowed_mime_types = array[
     'image/png','image/jpeg','image/webp','image/gif','image/svg+xml',
     'application/pdf', 'application/zip',
     'application/msword',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
     'application/vnd.ms-excel',
     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
     'text/plain', 'text/csv'
   ]
 where id = 'client-files';

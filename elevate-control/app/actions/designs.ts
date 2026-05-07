'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import type { DesignViewport } from '@/lib/supabase/database.types';

type Result<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

const ALLOWED_VIEWPORTS: DesignViewport[] = ['desktop', 'tablet', 'mobile'];
const ALLOWED_MIME = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf',
]);
const MAX_BYTES = 50 * 1024 * 1024;

const EXT_FOR_MIME: Record<string, string> = {
  'image/png':       'png',
  'image/jpeg':      'jpg',
  'image/webp':      'webp',
  'image/gif':       'gif',
  'application/pdf': 'pdf',
};

/**
 * Upload a design file to the `designs` Supabase Storage bucket.
 * The file is stored at <project_id>/<random-uuid>.<ext>, and a row is
 * inserted in the `designs` table linking storage path → project (and
 * optionally → page).
 */
export async function uploadDesign(formData: FormData): Promise<Result<{ id: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const projectId   = formData.get('project_id')   as string | null;
  const projectSlug = formData.get('project_slug') as string | null;
  const pageId      = (formData.get('page_id')     as string | null) || null;
  const pageSlug    = (formData.get('page_slug')   as string | null) || null;
  const viewport    = (formData.get('viewport')    as string | null) || 'desktop';
  const notes       = (formData.get('notes')       as string | null)?.trim() || null;
  const file        =  formData.get('file') as File | null;

  if (!projectId) return { ok: false, error: 'project_id חסר' };
  if (!file || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'לא נבחר קובץ' };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: `הקובץ גדול מדי (מקסימום ${MAX_BYTES / 1024 / 1024}MB)` };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, error: `סוג קובץ לא נתמך: ${file.type}` };
  }
  if (!ALLOWED_VIEWPORTS.includes(viewport as DesignViewport)) {
    return { ok: false, error: `viewport לא חוקי: ${viewport}` };
  }

  const ext = EXT_FOR_MIME[file.type] ?? 'bin';
  const storagePath = `${projectId}/${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('designs')
    .upload(storagePath, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('design upload error:', uploadError);
    return { ok: false, error: `כשל בהעלאה: ${uploadError.message}` };
  }

  // Signed URL (1 year) — bucket is private
  const { data: signed } = await supabase.storage
    .from('designs')
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

  const fileUrl = signed?.signedUrl ?? '';

  const { data: design, error: insertError } = await supabase
    .from('designs')
    .insert({
      project_id:      projectId,
      page_id:         pageId,
      viewport:        viewport as DesignViewport,
      storage_path:    storagePath,
      file_url:        fileUrl,
      file_size_bytes: file.size,
      mime_type:       file.type,
      notes,
      uploaded_by:     user.id,
    })
    .select('id')
    .single<{ id: string }>();

  if (insertError || !design) {
    // Try to clean up the orphan storage object
    await supabase.storage.from('designs').remove([storagePath]);
    return { ok: false, error: insertError?.message ?? 'שגיאה לא ידועה' };
  }

  await supabase.from('activity_log').insert({
    project_id:  projectId,
    actor_id:    user.id,
    kind:        'design_uploaded',
    entity_type: 'design',
    entity_id:   design.id,
    summary:     `הועלה עיצוב (${viewport}): ${file.name}`,
  });

  if (projectSlug) revalidatePath(`/projects/${projectSlug}/designs`);
  if (projectSlug && pageSlug) revalidatePath(`/projects/${projectSlug}/${pageSlug}`);
  return { ok: true, data: { id: design.id } };
}

export async function deleteDesign(
  designId: string,
  ctx: { projectSlug: string }
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { data: design } = await supabase
    .from('designs')
    .select('id, project_id, storage_path')
    .eq('id', designId)
    .single<{ id: string; project_id: string; storage_path: string }>();

  if (!design) return { ok: false, error: 'העיצוב לא נמצא' };

  // Storage first — if it fails, leave the row to retry
  const { error: storageError } = await supabase.storage
    .from('designs')
    .remove([design.storage_path]);

  if (storageError) {
    console.warn('design storage remove failed (continuing):', storageError);
  }

  const { error: deleteError } = await supabase
    .from('designs')
    .delete()
    .eq('id', designId);

  if (deleteError) return { ok: false, error: deleteError.message };

  await supabase.from('activity_log').insert({
    project_id:  design.project_id,
    actor_id:    user.id,
    kind:        'deleted',
    entity_type: 'design',
    entity_id:   design.id,
    summary:     'נמחק עיצוב',
  });

  revalidatePath(`/projects/${ctx.projectSlug}/designs`);
  return { ok: true };
}

export async function updateDesignNotes(
  designId: string,
  ctx: { projectSlug: string },
  notes: string
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from('designs').update({ notes }).eq('id', designId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${ctx.projectSlug}/designs`);
  return { ok: true };
}

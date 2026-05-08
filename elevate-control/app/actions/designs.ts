'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { DesignViewport } from '@/lib/supabase/database.types';

type Result<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

const ALLOWED_VIEWPORTS: DesignViewport[] = ['desktop', 'tablet', 'mobile'];

/**
 * Record a design that the client just uploaded directly to Supabase Storage.
 * The client handles the actual file transfer (avoids Vercel's body size cap
 * on Server Actions); we only insert the metadata row + signed URL here.
 */
export async function recordDesignUpload(input: {
  projectId:   string;
  projectSlug: string;
  pageId:      string | null;
  pageSlug:    string | null;
  viewport:    string;
  storagePath: string;
  fileSize:    number;
  mimeType:    string;
  fileName:    string;
  notes:       string | null;
}): Promise<Result<{ id: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  if (!input.projectId) return { ok: false, error: 'project_id חסר' };
  if (!ALLOWED_VIEWPORTS.includes(input.viewport as DesignViewport)) {
    return { ok: false, error: `viewport לא חוקי: ${input.viewport}` };
  }
  if (!input.storagePath.startsWith(`${input.projectId}/`)) {
    return { ok: false, error: 'נתיב אחסון לא תקין' };
  }

  // Sign a long-lived URL for the gallery (bucket is private)
  const { data: signed } = await supabase.storage
    .from('designs')
    .createSignedUrl(input.storagePath, 60 * 60 * 24 * 365);

  const fileUrl = signed?.signedUrl ?? '';

  const { data: design, error: insertError } = await supabase
    .from('designs')
    .insert({
      project_id:      input.projectId,
      page_id:         input.pageId,
      viewport:        input.viewport as DesignViewport,
      storage_path:    input.storagePath,
      file_url:        fileUrl,
      file_size_bytes: input.fileSize,
      mime_type:       input.mimeType,
      notes:           input.notes,
      uploaded_by:     user.id,
    })
    .select('id')
    .single<{ id: string }>();

  if (insertError || !design) {
    await supabase.storage.from('designs').remove([input.storagePath]);
    return { ok: false, error: insertError?.message ?? 'שגיאה לא ידועה' };
  }

  await supabase.from('activity_log').insert({
    project_id:  input.projectId,
    actor_id:    user.id,
    kind:        'design_uploaded',
    entity_type: 'design',
    entity_id:   design.id,
    summary:     `הועלה עיצוב (${input.viewport}): ${input.fileName}`,
  });

  if (input.projectSlug) revalidatePath(`/projects/${input.projectSlug}/designs`);
  if (input.projectSlug && input.pageSlug) {
    revalidatePath(`/projects/${input.projectSlug}/${input.pageSlug}`);
  }
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

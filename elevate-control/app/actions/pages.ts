'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';
import type { PageType } from '@/lib/supabase/database.types';

type CreatePageResult =
  | { ok: true; pageId: string; slug: string }
  | { ok: false; error: string };

const ALLOWED_TYPES: PageType[] = ['page', 'archive', 'single', 'system', 'service'];

/**
 * Create a new page inside a project. The current user must be a member.
 */
export async function createPage(formData: FormData): Promise<CreatePageResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const projectId  = formData.get('project_id')   as string | null;
  const projectSlug = formData.get('project_slug') as string | null;
  const nameHe     = (formData.get('name_he')     as string | null)?.trim() ?? '';
  const slugInput  = (formData.get('slug')        as string | null)?.trim() ?? '';
  const typeInput  =  formData.get('type')        as string | null;
  const cptIdInput = (formData.get('cpt_id')      as string | null)?.trim() || null;

  if (!projectId)  return { ok: false, error: 'project_id חסר' };
  if (!nameHe)     return { ok: false, error: 'שם העמוד הוא שדה חובה' };

  const type = (ALLOWED_TYPES.includes(typeInput as PageType) ? typeInput : 'page') as PageType;
  const needsCpt = type === 'archive' || type === 'single';
  if (needsCpt && !cptIdInput) {
    return { ok: false, error: 'עמוד מסוג זה דורש בחירת CPT' };
  }
  const cptId = needsCpt ? cptIdInput : null;
  const slug = slugify(slugInput || nameHe);
  if (!slug) return { ok: false, error: 'לא הצלחנו ליצור slug תקין מהשם' };

  // Compute next order — last + 1
  const { data: lastPage } = await supabase
    .from('pages')
    .select('order')
    .eq('project_id', projectId)
    .order('order', { ascending: false })
    .limit(1)
    .single<{ order: number }>();

  const nextOrder = (lastPage?.order ?? 0) + 10;

  const { data: page, error: insertError } = await supabase
    .from('pages')
    .insert({
      project_id: projectId,
      name_he: nameHe,
      slug,
      type,
      cpt_id: cptId,
      order: nextOrder,
      status: 'planned',
      created_by: user.id,
    })
    .select('id, slug')
    .single<{ id: string; slug: string }>();

  if (insertError) {
    if (insertError.code === '23505') {
      return { ok: false, error: `Slug "${slug}" כבר קיים בפרויקט. בחר שם או slug אחר.` };
    }
    console.error('createPage insert error:', insertError);
    return { ok: false, error: insertError.message };
  }
  if (!page) return { ok: false, error: 'העמוד נוצר אבל ה-DB לא החזיר תוצאה' };

  // Activity log
  await supabase.from('activity_log').insert({
    project_id: projectId,
    actor_id: user.id,
    kind: 'created',
    entity_type: 'page',
    entity_id: page.id,
    summary: `נוסף עמוד: ${nameHe}`,
  });

  // Revalidate the project page so the new page shows immediately
  if (projectSlug) revalidatePath(`/projects/${projectSlug}`);

  return { ok: true, pageId: page.id, slug: page.slug };
}

type DeletePageResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Delete a page. Cascades to its sections (FK cascade); designs that pointed
 * at it become unattached (page_id → null). Children pages (parent_id) are
 * orphaned to top-level rather than deleted.
 */
export async function deletePage(
  pageId: string,
  projectSlug: string
): Promise<DeletePageResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { data: page } = await supabase
    .from('pages')
    .select('id, project_id, name_he, slug')
    .eq('id', pageId)
    .single<{ id: string; project_id: string; name_he: string | null; slug: string }>();
  if (!page) return { ok: false, error: 'העמוד לא נמצא' };

  // Promote children to top-level (parent_id = null) so the tree stays sane
  await supabase.from('pages').update({ parent_id: null }).eq('parent_id', pageId);

  const { error } = await supabase.from('pages').delete().eq('id', pageId);
  if (error) return { ok: false, error: error.message };

  await supabase.from('activity_log').insert({
    project_id:  page.project_id,
    actor_id:    user.id,
    kind:        'deleted',
    entity_type: 'page',
    entity_id:   page.id,
    summary:     `נמחק עמוד: ${page.name_he ?? page.slug}`,
  });

  revalidatePath(`/projects/${projectSlug}`);
  return { ok: true };
}

type UpdatePageStatusResult = { ok: boolean; error?: string };

/**
 * Quick status flip for a page from the project detail view.
 */
export async function updatePageStatus(
  pageId: string,
  projectSlug: string,
  newStatus: string
): Promise<UpdatePageStatusResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { error } = await supabase
    .from('pages')
    .update({ status: newStatus })
    .eq('id', pageId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${projectSlug}`);
  return { ok: true };
}

/**
 * Persist a new tree state for a project — order + parent for each page in
 * one round-trip. Caller computes the full new state client-side.
 */
export async function reorderAndReparentPages(
  projectSlug: string,
  updates: Array<{ id: string; parent_id: string | null; order: number }>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };
  if (updates.length === 0) return { ok: true };

  for (const u of updates) {
    const { data, error } = await supabase
      .from('pages')
      .update({ parent_id: u.parent_id, order: u.order })
      .eq('id', u.id)
      .select('id');
    if (error) {
      console.error('reorderAndReparentPages update', { id: u.id, error });
      return { ok: false, error: error.message };
    }
    if (!data?.length) {
      return { ok: false, error: 'לא הצלחנו לעדכן עמוד — בדקו הרשאות' };
    }
  }

  revalidatePath(`/projects/${projectSlug}`);
  return { ok: true };
}


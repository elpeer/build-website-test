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
  const cptId = cptIdInput;
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

/** Per-page CMS URL override for the development workspace. Pass null
 *  to clear and fall back to auto-derived staging_url + slug. */
export async function setPageCmsUrlOverride(
  pageId: string,
  projectSlug: string,
  url: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };
  const { error } = await supabase
    .from('pages')
    .update({ cms_url_override: url?.trim() || null })
    .eq('id', pageId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectSlug}`);
  revalidatePath(`/client/${projectSlug}/development`);
  return { ok: true };
}

/** Per-page MANUAL preview URL — wins over the GitHub-detected one.
 *  Used in the frontend tab of the dev workspace. */
export async function setPagePreviewUrlOverride(
  pageId: string,
  projectSlug: string,
  url: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };
  const { error } = await supabase
    .from('pages')
    .update({ preview_url_override: url?.trim() || null })
    .eq('id', pageId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectSlug}`);
  revalidatePath(`/client/${projectSlug}/development`);
  return { ok: true };
}

const DEV_STATUSES = [
  'awaiting_dev',
  'in_dev',
  'awaiting_pm',
  'pm_approved',
  'client_visible',       // frontend tab only
  'client_visible_full',  // frontend + CMS tabs
] as const;
export type PageDevStatus = typeof DEV_STATUSES[number];

/** Dev-workflow status. 'client_visible' exposes the page in the
 *  client-facing dev workspace's frontend tab; 'client_visible_full'
 *  also exposes it in the CMS tab. */
export async function setPageDevStatus(
  pageId: string,
  projectSlug: string,
  status: PageDevStatus
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!DEV_STATUSES.includes(status)) return { ok: false, error: 'סטטוס לא חוקי' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };
  const { error } = await supabase
    .from('pages')
    .update({ dev_status: status })
    .eq('id', pageId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectSlug}`);
  revalidatePath(`/client/${projectSlug}/development`);
  return { ok: true };
}

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


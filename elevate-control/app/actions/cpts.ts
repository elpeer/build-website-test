'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';
import type { Json } from '@/lib/supabase/database.types';

type Result<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

interface ProjectCtx {
  projectId: string;
  projectSlug: string;
}

async function logActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ctx: { projectId: string; userId: string; kind: string; entityType: string; entityId: string; summary: string }
) {
  await supabase.from('activity_log').insert({
    project_id:  ctx.projectId,
    actor_id:    ctx.userId,
    kind:        ctx.kind,
    entity_type: ctx.entityType,
    entity_id:   ctx.entityId,
    summary:     ctx.summary,
  });
}

// ─── CPTs ─────────────────────────────────────────────────────────────

export async function createCpt(formData: FormData): Promise<Result<{ slug: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const projectId   = formData.get('project_id')   as string | null;
  const projectSlug = formData.get('project_slug') as string | null;
  const nameHe      = (formData.get('name_he') as string | null)?.trim() ?? '';
  const nameEn      = (formData.get('name_en') as string | null)?.trim() ?? '';
  const slugInput   = (formData.get('slug')    as string | null)?.trim() ?? '';
  const description = (formData.get('description') as string | null)?.trim() || null;
  const hasArchive  = formData.get('has_archive') === 'on';
  const hasSingle   = formData.get('has_single')  === 'on';

  if (!projectId) return { ok: false, error: 'project_id חסר' };
  if (!nameHe && !nameEn) return { ok: false, error: 'שם CPT הוא שדה חובה' };

  const slug = slugify(slugInput || nameEn || nameHe);
  if (!slug) return { ok: false, error: 'לא הצלחנו ליצור slug תקין' };

  const { data: lastCpt } = await supabase
    .from('cpts')
    .select('order')
    .eq('project_id', projectId)
    .order('order', { ascending: false })
    .limit(1)
    .single<{ order: number }>();

  const nextOrder = (lastCpt?.order ?? 0) + 10;

  const { data: cpt, error } = await supabase
    .from('cpts')
    .insert({
      project_id:  projectId,
      slug,
      name_he:     nameHe || null,
      name_en:     nameEn || null,
      description,
      has_archive: hasArchive,
      has_single:  hasSingle,
      order:       nextOrder,
    })
    .select('id, slug')
    .single<{ id: string; slug: string }>();

  if (error) {
    if (error.code === '23505') return { ok: false, error: `Slug "${slug}" כבר קיים בפרויקט.` };
    return { ok: false, error: error.message };
  }
  if (!cpt) return { ok: false, error: 'שגיאה: ה-CPT נוצר אבל לא הוחזר' };

  await logActivity(supabase, {
    projectId, userId: user.id, kind: 'created',
    entityType: 'cpt', entityId: cpt.id,
    summary: `נוסף CPT: ${nameHe || nameEn || slug}`,
  });

  if (projectSlug) revalidatePath(`/projects/${projectSlug}/cpts`);
  return { ok: true, data: { slug: cpt.slug } };
}

export async function updateCpt(
  cptId: string,
  ctx: ProjectCtx,
  patch: {
    name_he?: string;
    name_en?: string;
    description?: string | null;
    has_archive?: boolean;
    has_single?: boolean;
    is_slider_only?: boolean;
    field_schema?: Json;
  }
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { error } = await supabase.from('cpts').update(patch).eq('id', cptId);
  if (error) return { ok: false, error: error.message };

  await logActivity(supabase, {
    projectId: ctx.projectId, userId: user.id, kind: 'updated',
    entityType: 'cpt', entityId: cptId, summary: 'עודכן CPT',
  });

  revalidatePath(`/projects/${ctx.projectSlug}/cpts`);
  return { ok: true };
}

export async function deleteCpt(cptId: string, ctx: ProjectCtx): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { error } = await supabase.from('cpts').delete().eq('id', cptId);
  if (error) return { ok: false, error: error.message };

  await logActivity(supabase, {
    projectId: ctx.projectId, userId: user.id, kind: 'deleted',
    entityType: 'cpt', entityId: cptId, summary: 'נמחק CPT',
  });

  revalidatePath(`/projects/${ctx.projectSlug}/cpts`);
  return { ok: true };
}

// ─── Taxonomies ────────────────────────────────────────────────────────

export async function createTaxonomy(formData: FormData): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const projectId    = formData.get('project_id')   as string | null;
  const projectSlug  = formData.get('project_slug') as string | null;
  const cptId        = formData.get('cpt_id')       as string | null;
  const cptSlug      = formData.get('cpt_slug')     as string | null;
  const nameHe       = (formData.get('name_he') as string | null)?.trim() ?? '';
  const slugInput    = (formData.get('slug')    as string | null)?.trim() ?? '';
  const hierarchical = formData.get('hierarchical') === 'on';

  if (!projectId || !cptId) return { ok: false, error: 'מזהי פרויקט/CPT חסרים' };
  if (!nameHe) return { ok: false, error: 'שם הטקסונומיה הוא שדה חובה' };

  const slug = slugify(slugInput || nameHe);
  if (!slug) return { ok: false, error: 'לא הצלחנו ליצור slug תקין' };

  const { error } = await supabase.from('taxonomies').insert({
    project_id: projectId,
    cpt_id: cptId,
    slug,
    name_he: nameHe,
    hierarchical,
    terms: [],
  });

  if (error) {
    if (error.code === '23505') return { ok: false, error: `Slug "${slug}" כבר קיים ב-CPT.` };
    return { ok: false, error: error.message };
  }

  if (projectSlug && cptSlug) revalidatePath(`/projects/${projectSlug}/cpts/${cptSlug}`);
  return { ok: true };
}

export async function updateTaxonomyTerms(
  taxonomyId: string,
  ctx: { projectSlug: string; cptSlug: string },
  terms: string[]
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { error } = await supabase
    .from('taxonomies')
    .update({ terms: terms as unknown as Json })
    .eq('id', taxonomyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${ctx.projectSlug}/cpts/${ctx.cptSlug}`);
  return { ok: true };
}

export async function deleteTaxonomy(
  taxonomyId: string,
  ctx: { projectSlug: string; cptSlug: string }
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { error } = await supabase.from('taxonomies').delete().eq('id', taxonomyId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${ctx.projectSlug}/cpts/${ctx.cptSlug}`);
  return { ok: true };
}

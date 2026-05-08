'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type Result =
  | { ok: true }
  | { ok: false; error: string };

interface PageContext {
  pageId: string;
  projectId: string;
  projectSlug: string;
  pageSlug: string;
}

async function logActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ctx: { projectId: string; userId: string; kind: string; entityId: string; summary: string }
) {
  await supabase.from('activity_log').insert({
    project_id: ctx.projectId,
    actor_id: ctx.userId,
    kind: ctx.kind,
    entity_type: 'section',
    entity_id: ctx.entityId,
    summary: ctx.summary,
  });
}

/**
 * Add a section instance to a page from the section_definitions catalog.
 * The new section goes at the end (highest order + 10).
 */
export async function addSection(
  ctx: PageContext,
  definitionSlug: string
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  // Look up the definition to grab its id (for FK) and label (for activity log)
  const { data: definition } = await supabase
    .from('section_definitions')
    .select('id, slug, name_he, name_en')
    .eq('slug', definitionSlug)
    .single<{ id: string; slug: string; name_he: string | null; name_en: string | null }>();

  if (!definition) return { ok: false, error: `לא נמצאה הגדרה לסקשן "${definitionSlug}"` };

  // Compute next order — last + 10
  const { data: lastSection } = await supabase
    .from('sections')
    .select('order')
    .eq('page_id', ctx.pageId)
    .order('order', { ascending: false })
    .limit(1)
    .single<{ order: number }>();

  const nextOrder = (lastSection?.order ?? 0) + 10;

  const { data: section, error } = await supabase
    .from('sections')
    .insert({
      page_id:         ctx.pageId,
      definition_id:   definition.id,
      definition_slug: definition.slug,
      order:           nextOrder,
      status:          'planned',
      content:         {},
    })
    .select('id')
    .single<{ id: string }>();

  if (error || !section) {
    console.error('addSection error:', error);
    return { ok: false, error: error?.message ?? 'שגיאה לא ידועה' };
  }

  await logActivity(supabase, {
    projectId: ctx.projectId,
    userId:    user.id,
    kind:      'section_added',
    entityId:  section.id,
    summary:   `נוסף סקשן: ${definition.name_he ?? definition.name_en ?? definition.slug}`,
  });

  revalidatePath(`/projects/${ctx.projectSlug}/${ctx.pageSlug}`);
  return { ok: true };
}

/**
 * Update a section's notes / status / content.
 */
export async function updateSection(
  sectionId: string,
  ctx: PageContext,
  patch: { notes?: string; status?: string; content?: Record<string, unknown> }
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { error } = await supabase
    .from('sections')
    .update(patch)
    .eq('id', sectionId);

  if (error) return { ok: false, error: error.message };

  await logActivity(supabase, {
    projectId: ctx.projectId,
    userId:    user.id,
    kind:      'updated',
    entityId:  sectionId,
    summary:   `עודכן סקשן`,
  });

  revalidatePath(`/projects/${ctx.projectSlug}/${ctx.pageSlug}`);
  return { ok: true };
}

/**
 * Remove a section.
 */
export async function deleteSection(
  sectionId: string,
  ctx: PageContext
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { error } = await supabase
    .from('sections')
    .delete()
    .eq('id', sectionId);

  if (error) return { ok: false, error: error.message };

  await logActivity(supabase, {
    projectId: ctx.projectId,
    userId:    user.id,
    kind:      'deleted',
    entityId:  sectionId,
    summary:   `נמחק סקשן`,
  });

  revalidatePath(`/projects/${ctx.projectSlug}/${ctx.pageSlug}`);
  return { ok: true };
}

/**
 * Move a section up (decrease order) or down (increase order) by swapping
 * the `order` field with its neighbor. Simple two-row swap, no batch.
 */
export async function moveSection(
  sectionId: string,
  ctx: PageContext,
  direction: 'up' | 'down'
): Promise<Result> {
  const supabase = await createClient();

  // Get this section's current order
  const { data: current } = await supabase
    .from('sections')
    .select('id, order, page_id')
    .eq('id', sectionId)
    .single<{ id: string; order: number; page_id: string }>();
  if (!current) return { ok: false, error: 'הסקשן לא נמצא' };

  // Find the neighbor
  const cmp = direction === 'up' ? 'lt' : 'gt';
  const neighbourQuery = supabase
    .from('sections')
    .select('id, order')
    .eq('page_id', current.page_id);

  // Use the right comparator + ordering
  const { data: neighbour } =
    direction === 'up'
      ? await neighbourQuery
          .lt('order', current.order)
          .order('order', { ascending: false })
          .limit(1)
          .single<{ id: string; order: number }>()
      : await neighbourQuery
          .gt('order', current.order)
          .order('order', { ascending: true })
          .limit(1)
          .single<{ id: string; order: number }>();
  void cmp;

  if (!neighbour) return { ok: true };  // already at the edge

  // Swap orders. Two updates — supabase doesn't have transactions in REST,
  // but the worst-case is a transient inconsistent order, no data loss.
  await supabase.from('sections').update({ order: neighbour.order }).eq('id', current.id);
  await supabase.from('sections').update({ order: current.order }).eq('id', neighbour.id);

  revalidatePath(`/projects/${ctx.projectSlug}/${ctx.pageSlug}`);
  return { ok: true };
}

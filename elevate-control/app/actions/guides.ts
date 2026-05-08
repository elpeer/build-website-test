'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';

type Result<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

async function requireStudioAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'אינך מחובר' };
  const { data: profile } = await supabase
    .from('profiles').select('studio_admin').eq('id', user.id).single<{ studio_admin: boolean }>();
  if (!profile?.studio_admin) return { ok: false as const, error: 'נדרש Studio Admin' };
  return { ok: true as const, supabase, userId: user.id };
}

export async function createGuide(formData: FormData): Promise<Result<{ id: string }>> {
  const auth = await requireStudioAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const title       = (formData.get('title') as string | null)?.trim() ?? '';
  const description = (formData.get('description') as string | null)?.trim() || null;
  const slugInput   = (formData.get('slug') as string | null)?.trim() ?? '';
  const category    = (formData.get('category') as string | null)?.trim() || null;
  const categoryId  = (formData.get('category_id') as string | null)?.trim() || null;
  const videoUrl    = (formData.get('video_url') as string | null)?.trim() || null;
  const coverUrl    = (formData.get('cover_url') as string | null)?.trim() || null;
  const visibility  = ((formData.get('visibility') as string | null)?.trim() || 'global') as 'global' | 'project';
  const badge       = (formData.get('badge') as string | null)?.trim() || null;
  const contentHtml = (formData.get('content_html') as string | null) ?? '';

  if (!title) return { ok: false, error: 'כותרת חובה' };
  const slug = slugify(slugInput || title);

  const { data, error } = await auth.supabase
    .from('guide_articles')
    .insert({
      slug, title, description, category, category_id: categoryId, visibility, badge,
      video_url: videoUrl, cover_url: coverUrl,
      content_md: '',
      content_html: contentHtml,
      created_by: auth.userId,
    })
    .select('id').single<{ id: string }>();
  if (error) {
    if (error.code === '23505') return { ok: false, error: `slug "${slug}" קיים כבר` };
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: 'נכשל' };

  revalidatePath('/admin/guides');
  return { ok: true, data };
}

export async function updateGuide(
  id: string,
  patch: {
    title?: string; description?: string | null;
    category?: string | null; category_id?: string | null;
    visibility?: 'global' | 'project';
    video_url?: string | null; cover_url?: string | null;
    badge?: string | null;
    position?: number;
    content_md?: string; content_html?: string; published?: boolean;
  }
): Promise<Result> {
  const auth = await requireStudioAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase.from('guide_articles').update(patch).eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/guides');
  return { ok: true };
}

/**
 * Move a guide one slot up or down within its category bucket. The
 * caller decides direction; we swap positions with the closest neighbor
 * that shares the same category_id (NULL is treated as its own bucket).
 */
export async function moveGuide(
  id: string,
  direction: 'up' | 'down'
): Promise<Result> {
  const auth = await requireStudioAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: current } = await auth.supabase
    .from('guide_articles')
    .select('id, position, category_id')
    .eq('id', id)
    .single<{ id: string; position: number; category_id: string | null }>();
  if (!current) return { ok: false, error: 'מדריך לא נמצא' };

  // Build filters first (filter builder), then add transforms at the end.
  let q = auth.supabase.from('guide_articles').select('id, position');
  if (current.category_id === null) q = q.is('category_id', null);
  else                              q = q.eq('category_id', current.category_id);
  if (direction === 'up')   q = q.lt('position', current.position);
  else                      q = q.gt('position', current.position);

  const { data: neighborRows, error: neighborErr } = await q
    .order('position', { ascending: direction === 'down' })
    .limit(1);
  if (neighborErr) {
    console.error('moveGuide neighbor lookup', neighborErr);
    return { ok: false, error: neighborErr.message };
  }
  const neighbor = neighborRows?.[0] as { id: string; position: number } | undefined;
  if (!neighbor) return { ok: true }; // already at the edge — no-op

  // Swap the two positions; .select() guards against RLS-zero-row bugs.
  const r1 = await auth.supabase.from('guide_articles')
    .update({ position: neighbor.position }).eq('id', current.id).select('id');
  if (r1.error) { console.error('moveGuide a', r1.error); return { ok: false, error: r1.error.message }; }
  if (!r1.data?.length) return { ok: false, error: 'לא הצלחנו לעדכן את המדריך' };

  const r2 = await auth.supabase.from('guide_articles')
    .update({ position: current.position }).eq('id', neighbor.id).select('id');
  if (r2.error) { console.error('moveGuide b', r2.error); return { ok: false, error: r2.error.message }; }
  if (!r2.data?.length) return { ok: false, error: 'לא הצלחנו לעדכן את השכן' };

  revalidatePath('/admin/guides');
  return { ok: true };
}

/**
 * Persist a full new order for guides inside one category bucket.
 * Caller passes the ordered list of guide ids that share the same
 * category_id; we write position values (i+1)*10 in a single round-trip.
 * Use this for drag-and-drop where the result is the entire new order.
 */
export async function reorderGuidesInCategory(
  categoryId: string | null,
  orderedIds: string[]
): Promise<Result> {
  const auth = await requireStudioAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (orderedIds.length === 0) return { ok: true };

  // One UPDATE per row + .select() so we know the row actually changed
  // (RLS misconfiguration would silently 0-affect otherwise).
  for (let i = 0; i < orderedIds.length; i++) {
    const { data, error } = await auth.supabase
      .from('guide_articles')
      .update({ position: (i + 1) * 10 })
      .eq('id', orderedIds[i])
      .select('id');
    if (error) {
      console.error('reorderGuidesInCategory update failed', { id: orderedIds[i], error });
      return { ok: false, error: error.message };
    }
    if (!data || data.length === 0) {
      console.error('reorderGuidesInCategory affected 0 rows', { id: orderedIds[i] });
      return { ok: false, error: 'לא הצלחנו לעדכן — בדקו הרשאות' };
    }
  }
  void categoryId;

  revalidatePath('/admin/guides');
  return { ok: true };
}

/** Persist a full new order for the guide_categories list. */
export async function reorderGuideCategories(
  orderedIds: string[]
): Promise<Result> {
  const auth = await requireStudioAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (orderedIds.length === 0) return { ok: true };

  for (let i = 0; i < orderedIds.length; i++) {
    const { data, error } = await auth.supabase
      .from('guide_categories')
      .update({ position: (i + 1) * 10 })
      .eq('id', orderedIds[i])
      .select('id');
    if (error) {
      console.error('reorderGuideCategories update failed', { id: orderedIds[i], error });
      return { ok: false, error: error.message };
    }
    if (!data || data.length === 0) {
      console.error('reorderGuideCategories affected 0 rows', { id: orderedIds[i] });
      return { ok: false, error: 'לא הצלחנו לעדכן — בדקו הרשאות' };
    }
  }

  revalidatePath('/admin/guides');
  return { ok: true };
}

/** Same swap pattern, for guide categories. */
export async function moveGuideCategory(
  id: string,
  direction: 'up' | 'down'
): Promise<Result> {
  const auth = await requireStudioAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: current } = await auth.supabase
    .from('guide_categories')
    .select('id, position').eq('id', id)
    .single<{ id: string; position: number }>();
  if (!current) return { ok: false, error: 'קטגוריה לא נמצאה' };

  let q = auth.supabase.from('guide_categories').select('id, position');
  if (direction === 'up')   q = q.lt('position', current.position);
  else                      q = q.gt('position', current.position);

  const { data: neighborRows, error: neighborErr } = await q
    .order('position', { ascending: direction === 'down' })
    .limit(1);
  if (neighborErr) {
    console.error('moveGuideCategory neighbor lookup', neighborErr);
    return { ok: false, error: neighborErr.message };
  }
  const neighbor = neighborRows?.[0] as { id: string; position: number } | undefined;
  if (!neighbor) return { ok: true };

  const r1 = await auth.supabase.from('guide_categories')
    .update({ position: neighbor.position }).eq('id', current.id).select('id');
  if (r1.error) { console.error('moveGuideCategory a', r1.error); return { ok: false, error: r1.error.message }; }
  if (!r1.data?.length) return { ok: false, error: 'לא הצלחנו לעדכן קטגוריה' };

  const r2 = await auth.supabase.from('guide_categories')
    .update({ position: current.position }).eq('id', neighbor.id).select('id');
  if (r2.error) { console.error('moveGuideCategory b', r2.error); return { ok: false, error: r2.error.message }; }
  if (!r2.data?.length) return { ok: false, error: 'לא הצלחנו לעדכן שכן' };

  revalidatePath('/admin/guides');
  return { ok: true };
}

// ─── Categories ───────────────────────────────────────────────────────

export async function createGuideCategory(input: {
  slug: string; label: string; position?: number;
}): Promise<Result<{ id: string }>> {
  const auth = await requireStudioAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const slug  = slugify(input.slug || input.label);
  const label = input.label.trim();
  if (!label) return { ok: false, error: 'תווית קטגוריה חובה' };

  const { data, error } = await auth.supabase
    .from('guide_categories')
    .insert({ slug, label, position: input.position ?? 0, created_by: auth.userId })
    .select('id').single<{ id: string }>();
  if (error) {
    if (error.code === '23505') return { ok: false, error: `slug "${slug}" קיים כבר` };
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: 'נכשל' };

  revalidatePath('/admin/guides');
  return { ok: true, data };
}

export async function updateGuideCategory(
  id: string,
  patch: { slug?: string; label?: string; position?: number }
): Promise<Result> {
  const auth = await requireStudioAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const update: Record<string, unknown> = {};
  if (patch.slug !== undefined)  update.slug  = slugify(patch.slug);
  if (patch.label !== undefined) update.label = patch.label.trim();
  if (patch.position !== undefined) update.position = patch.position;

  const { error } = await auth.supabase.from('guide_categories').update(update).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/guides');
  return { ok: true };
}

export async function deleteGuideCategory(id: string): Promise<Result> {
  const auth = await requireStudioAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  // Detach guides first (set category_id to null) so the FK doesn't block
  // the delete.
  await auth.supabase.from('guide_articles').update({ category_id: null }).eq('category_id', id);

  const { error } = await auth.supabase.from('guide_categories').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/guides');
  return { ok: true };
}

// ─── Per-project assignments ──────────────────────────────────────────

export async function setGuideAssignments(
  guideId: string,
  projectIds: string[]
): Promise<Result> {
  const auth = await requireStudioAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  // Replace the assignment set: delete all then re-insert. Tiny scale
  // (a guide is targeted at a handful of projects) so this is fine.
  await auth.supabase.from('project_guide_assignments').delete().eq('guide_id', guideId);

  if (projectIds.length > 0) {
    const rows = projectIds.map(pid => ({
      project_id: pid, guide_id: guideId, created_by: auth.userId,
    }));
    const { error } = await auth.supabase.from('project_guide_assignments').insert(rows);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath('/admin/guides');
  return { ok: true };
}

export async function deleteGuide(id: string): Promise<Result> {
  const auth = await requireStudioAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase.from('guide_articles').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/guides');
  return { ok: true };
}

export async function setGuideHidden(
  projectId: string,
  projectSlug: string,
  guideId: string,
  hidden: boolean
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { error } = await supabase
    .from('project_guide_overrides')
    .upsert({ project_id: projectId, guide_id: guideId, hidden },
            { onConflict: 'project_id,guide_id' });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/client/${projectSlug}/training`);
  return { ok: true };
}

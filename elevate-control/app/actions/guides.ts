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
  const contentHtml = (formData.get('content_html') as string | null) ?? '';

  if (!title) return { ok: false, error: 'כותרת חובה' };
  const slug = slugify(slugInput || title);

  const { data, error } = await auth.supabase
    .from('guide_articles')
    .insert({
      slug, title, description, category, category_id: categoryId, visibility,
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

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
  if (!user) return { ok: false as const, error: 'אינך מחובר', supabase: null };
  const { data: profile } = await supabase
    .from('profiles').select('studio_admin').eq('id', user.id).single<{ studio_admin: boolean }>();
  if (!profile?.studio_admin) return { ok: false as const, error: 'נדרשות הרשאות Studio Admin', supabase: null };
  return { ok: true as const, supabase };
}

export async function createSectionDefinition(formData: FormData): Promise<Result<{ id: string }>> {
  const auth = await requireStudioAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const supabase = auth.supabase;

  const slugInput = (formData.get('slug')   as string | null)?.trim() ?? '';
  const nameHe    = (formData.get('name_he')as string | null)?.trim() || null;
  const nameEn    = (formData.get('name_en')as string | null)?.trim() || null;
  const description = (formData.get('description') as string | null)?.trim() || null;
  const category  = (formData.get('category')as string | null)?.trim() || null;
  const recipeId  = (formData.get('recipe_id') as string | null)?.trim() || null;
  const cptDriven = formData.get('cpt_driven') === 'on';
  const cptSlug   = (formData.get('cpt_slug') as string | null)?.trim() || null;

  const slug = slugify(slugInput || nameEn || nameHe || '');
  if (!slug) return { ok: false, error: 'לא הצלחנו לייצר slug' };
  if (!nameHe && !nameEn) return { ok: false, error: 'צריך שם בעברית או באנגלית' };

  const { data, error } = await supabase
    .from('section_definitions')
    .insert({
      slug, name_he: nameHe, name_en: nameEn, description,
      category, recipe_id: recipeId,
      cpt_driven: cptDriven, cpt_slug: cptDriven ? cptSlug : null,
      is_global: true,
    })
    .select('id')
    .single<{ id: string }>();

  if (error) {
    if (error.code === '23505') return { ok: false, error: `slug "${slug}" כבר קיים` };
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: 'יצירה נכשלה' };

  revalidatePath('/admin/section-definitions');
  revalidatePath('/section-library');
  return { ok: true, data };
}

export async function updateSectionDefinition(
  id: string,
  patch: {
    name_he?: string | null; name_en?: string | null; description?: string | null;
    category?: string | null; kind?: string | null; recipe_id?: string | null;
    cpt_driven?: boolean; cpt_slug?: string | null;
  }
): Promise<Result> {
  const auth = await requireStudioAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const supabase = auth.supabase;

  const cleanPatch: Record<string, unknown> = { ...patch };
  if (patch.cpt_driven === false) cleanPatch.cpt_slug = null;

  const { error } = await supabase
    .from('section_definitions')
    .update(cleanPatch)
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/section-definitions');
  revalidatePath('/section-library');
  return { ok: true };
}

export async function deleteSectionDefinition(id: string): Promise<Result> {
  const auth = await requireStudioAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const supabase = auth.supabase;

  // Check usage — refuse to delete if any sections reference this slug
  const { data: ref } = await supabase
    .from('section_definitions').select('slug').eq('id', id).single<{ slug: string }>();
  if (ref) {
    const { count } = await supabase
      .from('sections')
      .select('id', { count: 'exact', head: true })
      .eq('definition_slug', ref.slug);
    if ((count ?? 0) > 0) {
      return { ok: false, error: `הסקשן בשימוש ב-${count} מקומות. לא ניתן למחוק.` };
    }
  }

  const { error } = await supabase.from('section_definitions').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/section-definitions');
  revalidatePath('/section-library');
  return { ok: true };
}

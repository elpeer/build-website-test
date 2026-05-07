'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import type { BrandTokens } from '@/lib/brand-tokens';

type Result = { ok: true } | { ok: false; error: string };

export async function updateProjectBrand(
  projectId: string,
  projectSlug: string,
  patch: { brand_tokens?: BrandTokens; vercel_url?: string | null }
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const update: Record<string, unknown> = {};
  if (patch.brand_tokens !== undefined) update.design_tokens = patch.brand_tokens as unknown as Json;
  if (patch.vercel_url   !== undefined) update.vercel_url    = patch.vercel_url?.trim() || null;

  const { error } = await supabase.from('projects').update(update).eq('id', projectId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${projectSlug}`);
  revalidatePath(`/projects/${projectSlug}/settings`);
  return { ok: true };
}

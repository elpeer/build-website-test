'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type Result = { ok: true } | { ok: false; error: string };

export async function updateProfile(formData: FormData): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const fullName  = (formData.get('full_name')  as string | null)?.trim() || null;
  const avatarUrl = (formData.get('avatar_url') as string | null)?.trim() || null;

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, avatar_url: avatarUrl })
    .eq('id', user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/settings');
  return { ok: true };
}

export async function updateDigestSettings(input: {
  enabled: boolean;
  hour: number;
}): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const hour = Math.max(0, Math.min(23, Math.floor(input.hour)));

  const { error } = await supabase
    .from('profiles')
    .update({ daily_digest_enabled: input.enabled, daily_digest_hour: hour })
    .eq('id', user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/settings');
  return { ok: true };
}

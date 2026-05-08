'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type Result = { ok: true } | { ok: false; error: string };

export async function markNotificationRead(id: string): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id).eq('user_id', user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/');
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id).is('read_at', null);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/');
  return { ok: true };
}

export async function deleteNotification(id: string): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { error } = await supabase
    .from('notifications').delete()
    .eq('id', id).eq('user_id', user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/');
  return { ok: true };
}

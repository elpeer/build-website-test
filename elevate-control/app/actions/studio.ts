'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/supabase/database.types';

type Result<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

const ALLOWED_ROLES: UserRole[] = ['super_admin', 'pm', 'designer', 'developer', 'client'];

async function requireStudioAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'אינך מחובר' };
  const { data: profile } = await supabase
    .from('profiles').select('studio_admin').eq('id', user.id).single<{ studio_admin: boolean }>();
  if (!profile?.studio_admin) return { ok: false as const, error: 'נדרשות הרשאות Studio Admin' };
  return { ok: true as const, supabase, userId: user.id };
}

/**
 * Invite someone to the studio (not to a specific project).
 * If they already have a profile, we update their global role + studio_admin
 * flag immediately. Otherwise, we record a studio_invitations row and fire
 * an auth invite — when they accept and sign in, accept_studio_invitations
 * applies the configured role.
 */
export async function inviteToStudio(formData: FormData): Promise<Result<{ status: 'updated' | 'invited' }>> {
  const auth = await requireStudioAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const email        = ((formData.get('email') as string | null) ?? '').trim().toLowerCase();
  const roleInput    =  (formData.get('role')  as string | null) ?? 'designer';
  const studioAdmin  =  formData.get('studio_admin') === 'on';

  if (!email || !email.includes('@')) return { ok: false, error: 'כתובת מייל לא תקינה' };
  const role: UserRole = ALLOWED_ROLES.includes(roleInput as UserRole)
    ? (roleInput as UserRole)
    : 'designer';

  // Service-role client so we can look up profiles by email regardless of RLS
  const admin = createServiceClient();

  const { data: existing } = await admin
    .from('profiles')
    .select('id, email')
    .ilike('email', email)
    .limit(1)
    .maybeSingle<{ id: string; email: string }>();

  if (existing) {
    const { error } = await admin
      .from('profiles')
      .update({ role, studio_admin: studioAdmin })
      .eq('id', existing.id);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/studio-members');
    return { ok: true, data: { status: 'updated' } };
  }

  // Not on the platform — store invitation + fire auth invite.
  const { error: inviteError } = await admin
    .from('studio_invitations')
    .upsert({ email, role, studio_admin: studioAdmin, invited_by: auth.userId },
            { onConflict: 'email' });
  if (inviteError) return { ok: false, error: inviteError.message };

  try {
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    });
  } catch (e) {
    console.warn('inviteUserByEmail failed (non-fatal):', (e as Error).message);
  }

  revalidatePath('/admin/studio-members');
  return { ok: true, data: { status: 'invited' } };
}

/**
 * Update a user's global role and/or studio_admin flag. Studio admins can
 * see and edit everyone; you can't change your own studio_admin flag (to
 * avoid locking yourself out of admin).
 */
export async function updateStudioMember(
  profileId: string,
  patch: { role?: UserRole; studio_admin?: boolean }
): Promise<Result> {
  const auth = await requireStudioAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (profileId === auth.userId && patch.studio_admin === false) {
    return { ok: false, error: 'לא ניתן להסיר את עצמך מ-Studio Admin' };
  }
  if (patch.role && !ALLOWED_ROLES.includes(patch.role)) {
    return { ok: false, error: 'תפקיד לא חוקי' };
  }

  const update: Record<string, unknown> = {};
  if (patch.role !== undefined)         update.role         = patch.role;
  if (patch.studio_admin !== undefined) update.studio_admin = patch.studio_admin;

  const { error } = await auth.supabase.from('profiles').update(update).eq('id', profileId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/studio-members');
  return { ok: true };
}

export async function cancelStudioInvitation(invitationId: string): Promise<Result> {
  const auth = await requireStudioAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase.from('studio_invitations').delete().eq('id', invitationId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/studio-members');
  return { ok: true };
}

/**
 * Apply any pending studio_invitations whose email matches the current
 * user. Run this from the dashboard / projects list so newly-signed-in
 * users get their permissions on first visit.
 */
export async function acceptPendingStudioInvitations(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data, error } = await supabase.rpc('accept_studio_invitations');
  if (error) {
    console.warn('accept_studio_invitations failed:', error.message);
    return 0;
  }
  return (data as number) ?? 0;
}

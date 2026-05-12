'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/notify';
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

  // Not on the platform — provision an auth user with a password so the
  // member can sign in immediately. Profile + role come from the
  // on_auth_user_created trigger followed by the role update below.
  const passwordInput = ((formData.get('password') as string | null) ?? '').trim();
  const password = passwordInput.length >= 8 ? passwordInput : randomPassword();

  const { data: created, error: createErr } =
    await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (createErr || !created?.user) {
    return { ok: false, error: createErr?.message ?? 'יצירת המשתמש נכשלה' };
  }

  await admin
    .from('profiles')
    .update({ role, studio_admin: studioAdmin })
    .eq('id', created.user.id);

  const { data: inviter } = await admin
    .from('profiles').select('full_name').eq('id', auth.userId).maybeSingle<{ full_name: string | null }>();

  await sendWelcomeEmail({
    email,
    inviterName: inviter?.full_name ?? null,
    isStudioMember: true,
  });

  revalidatePath('/admin/studio-members');
  return { ok: true, data: { status: 'invited' } };
}

function randomPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const buf = new Uint32Array(12);
  crypto.getRandomValues(buf);
  return Array.from(buf, b => chars[b % chars.length]).join('');
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

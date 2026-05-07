'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { MemberRole } from '@/lib/supabase/database.types';

type Result<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

const ALLOWED_ROLES: MemberRole[] = ['owner', 'pm', 'designer', 'developer', 'reviewer', 'client'];

interface ProjectCtx {
  projectId: string;
  projectSlug: string;
}

/**
 * Invite a user to a project by email.
 *  - If the email already has a profile → add to project_members immediately.
 *  - Otherwise → store in project_invitations (auto-attached on their first sign-in).
 *
 * The caller (auth check) must already be a project member (RLS will enforce
 * project_invitations writes).
 */
export async function inviteMember(formData: FormData): Promise<Result<{ status: 'attached' | 'invited' }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const projectId   = formData.get('project_id')   as string | null;
  const projectSlug = formData.get('project_slug') as string | null;
  const email       = ((formData.get('email') as string | null) ?? '').trim().toLowerCase();
  const roleInput   =  (formData.get('role')  as string | null) ?? 'designer';

  if (!projectId) return { ok: false, error: 'project_id חסר' };
  if (!email || !email.includes('@')) return { ok: false, error: 'כתובת מייל לא תקינה' };

  const role: MemberRole = ALLOWED_ROLES.includes(roleInput as MemberRole)
    ? (roleInput as MemberRole)
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
    // Already on the platform — add directly
    const { error: insertError } = await admin
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id:    existing.id,
        role,
        added_by:   user.id,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        return { ok: false, error: 'משתמש זה כבר חבר בפרויקט' };
      }
      return { ok: false, error: insertError.message };
    }

    await admin.from('activity_log').insert({
      project_id:  projectId,
      actor_id:    user.id,
      kind:        'member_added',
      entity_type: 'project_member',
      entity_id:   null,
      summary:     `נוסף לצוות: ${email} (${role})`,
    });

    if (projectSlug) revalidatePath(`/projects/${projectSlug}/team`);
    return { ok: true, data: { status: 'attached' } };
  }

  // Not yet on the platform — record a pending invitation
  const { error: inviteError } = await supabase
    .from('project_invitations')
    .upsert({
      project_id: projectId,
      email,
      role,
      invited_by: user.id,
    }, { onConflict: 'project_id,email' });

  if (inviteError) return { ok: false, error: inviteError.message };

  await supabase.from('activity_log').insert({
    project_id:  projectId,
    actor_id:    user.id,
    kind:        'member_invited',
    entity_type: 'project_invitation',
    entity_id:   null,
    summary:     `נשלחה הזמנה: ${email} (${role})`,
  });

  // Optionally trigger an actual auth invite email (service-role only).
  // This will create an auth user and send a magic-link email. Safe to call —
  // if the user already exists in auth.users, it errors quietly and we move on.
  try {
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    });
  } catch (e) {
    console.warn('inviteUserByEmail failed (non-fatal):', (e as Error).message);
  }

  if (projectSlug) revalidatePath(`/projects/${projectSlug}/team`);
  return { ok: true, data: { status: 'invited' } };
}

export async function updateMemberRole(
  ctx: ProjectCtx,
  userId: string,
  role: MemberRole
): Promise<Result> {
  if (!ALLOWED_ROLES.includes(role)) {
    return { ok: false, error: `תפקיד לא חוקי: ${role}` };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { error } = await supabase
    .from('project_members')
    .update({ role })
    .eq('project_id', ctx.projectId)
    .eq('user_id', userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${ctx.projectSlug}/team`);
  return { ok: true };
}

export async function removeMember(
  ctx: ProjectCtx,
  userId: string
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  if (userId === user.id) {
    return { ok: false, error: 'לא ניתן להסיר את עצמך מהצוות' };
  }

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', ctx.projectId)
    .eq('user_id', userId);

  if (error) return { ok: false, error: error.message };

  await supabase.from('activity_log').insert({
    project_id:  ctx.projectId,
    actor_id:    user.id,
    kind:        'member_removed',
    entity_type: 'project_member',
    entity_id:   null,
    summary:     'הוסר חבר צוות',
  });

  revalidatePath(`/projects/${ctx.projectSlug}/team`);
  return { ok: true };
}

export async function cancelInvitation(
  ctx: ProjectCtx,
  invitationId: string
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('project_invitations')
    .delete()
    .eq('id', invitationId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${ctx.projectSlug}/team`);
  return { ok: true };
}

/**
 * Run on every authenticated dashboard load. If the user has any pending
 * email invitations, attach them to project_members and mark them accepted.
 * Cheap RPC — uses the SECURITY DEFINER function on the DB.
 */
export async function acceptPendingInvitations(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data, error } = await supabase.rpc('accept_pending_invitations');
  if (error) {
    console.warn('accept_pending_invitations failed:', error.message);
    return 0;
  }
  return (data as number) ?? 0;
}

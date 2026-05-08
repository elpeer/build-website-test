'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';

/**
 * Send a magic-link to the given email. Supabase emails the link;
 * the user clicks it, lands on /auth/callback, and gets a session.
 */
export async function signInWithMagicLink(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim().toLowerCase();
  const redirectAfter = formData.get('redirect') as string | null;

  if (!email || !email.includes('@')) {
    redirect('/sign-in?error=invalid-email');
  }

  const supabase = await createClient();
  const callback = new URL('/auth/callback', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000');
  if (redirectAfter) callback.searchParams.set('next', redirectAfter);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callback.toString(),
      // Don't auto-create users — admin must invite them first
      shouldCreateUser: false,
    },
  });

  if (error) {
    console.error('signInWithMagicLink error:', error.message);
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/sign-in?sent=1');
}

/**
 * Sign in with email + password. Bypasses magic-link rate limits, useful
 * when SMTP is throttled or for users who prefer a stable credential.
 * The admin must seed the password first via setUserPassword().
 */
export async function signInWithPassword(formData: FormData) {
  const email    = (formData.get('email')    as string | null)?.trim().toLowerCase();
  const password = (formData.get('password') as string | null) ?? '';
  const redirectAfter = (formData.get('redirect') as string | null) || null;

  if (!email || !email.includes('@')) {
    redirect('/sign-in?error=invalid-email');
  }
  if (!password) {
    redirect('/sign-in?error=missing-password');
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email!, password });
  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent('email/password לא תקינים')}`);
  }

  revalidatePath('/', 'layout');
  redirect(redirectAfter || '/projects');
}

/**
 * Studio-admin only: set or reset a password for a user. Uses the service
 * role to call Supabase Auth Admin API directly. The new password lets
 * the user sign in via signInWithPassword without needing a magic link.
 */
export async function setUserPassword(
  userId: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  // Only studio admins may set passwords
  const { data: me } = await supabase.from('profiles')
    .select('studio_admin').eq('id', user.id).single<{ studio_admin: boolean }>();
  if (!me?.studio_admin) return { ok: false, error: 'אין לך הרשאה' };

  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: 'סיסמה חייבת להיות באורך 8 תווים לפחות' };
  }

  const admin = createServiceClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Sign the current user out and bounce to the sign-in screen.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/sign-in');
}

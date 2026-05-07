'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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
 * Sign the current user out and bounce to the sign-in screen.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/sign-in');
}

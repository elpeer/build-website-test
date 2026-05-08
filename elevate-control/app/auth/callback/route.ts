/**
 * Magic-link callback: Supabase Auth redirects here after the user clicks
 * the link in their email. We exchange the code for a session, then bounce
 * the user to whatever they originally tried to visit (or to /projects).
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/projects';

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing-code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('exchangeCodeForSession error:', error.message);
    return NextResponse.redirect(`${origin}/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  // Force the safe-redirect: only allow same-origin paths
  const safeNext = next.startsWith('/') ? next : '/projects';
  return NextResponse.redirect(`${origin}${safeNext}`);
}

/**
 * Supabase client for SERVER-SIDE usage:
 *   - Server Components
 *   - Server Actions
 *   - Route Handlers
 *
 * Uses cookies() from next/headers to read the user's session.
 * Respects RLS — operates as the authenticated user.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// NB: not using the <Database> generic until we run `pnpm db:types` against
// the live schema. The hand-written placeholder types break supabase-js'
// Insert/Update inference (Partial<Row> + recursive Json collapses to never).
// Loose typing here means individual queries cast the result to local types.

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll throws inside Server Components — middleware handles refresh there
          }
        },
      },
    }
  );
}

/**
 * Service-role client — BYPASSES RLS. Use sparingly and only for admin operations
 * (migrations, scheduled jobs, MCP server tool calls) where the calling code has
 * already done its own authorization check.
 */
export function createServiceClient() {
  if (!process.env.SUPABASE_SECRET_KEY) {
    throw new Error('SUPABASE_SECRET_KEY is not set');
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY,
    {
      cookies: {
        getAll() { return []; },
        setAll() { /* no-op */ },
      },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

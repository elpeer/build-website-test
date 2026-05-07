/**
 * Supabase client for BROWSER usage (Client Components only).
 * Reads/writes cookies via document — session refresh happens in middleware.
 */

import { createBrowserClient } from '@supabase/ssr';

// NB: untyped until `pnpm db:types` is run — see lib/supabase/server.ts
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

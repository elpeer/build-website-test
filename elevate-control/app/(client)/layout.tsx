import { redirect } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { LogOut, Home, Eye, Pencil } from 'lucide-react';
import { signOut } from '@/app/actions/auth';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, studio_admin')
    .eq('id', user.id)
    .single<{ id: string; email: string; full_name: string | null; role: string; studio_admin: boolean }>();

  // Look at the URL to know if we're already in client preview mode
  const h = await headers();
  const url = h.get('x-invoke-path') ?? h.get('x-pathname') ?? '/';
  const search = h.get('x-invoke-query') ?? '';
  const isStudioAdmin = profile?.studio_admin || (profile?.role && profile.role !== 'client');
  const previewing = search.includes('as=client');

  // Build the toggle target — flip the as=client param
  const togglePath = (() => {
    // The header may not be set on Vercel; fall back to anchoring the link to the current location
    // We just emit a relative URL with the right query string — the browser keeps the rest.
    return previewing ? '?' : '?as=client';
  })();
  void url;

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M3 12l2-2 7-7 7 7 2 2v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/>
              </svg>
            </div>
            <span className="text-base font-bold">Elevate</span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            {isStudioAdmin && (
              <>
                <Link href="/projects" className="inline-flex items-center gap-1 text-muted-fg hover:text-brand">
                  <Home className="h-3.5 w-3.5" />
                  לדאשבורד הסטודיו
                </Link>
                <a href={togglePath}
                   className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                     previewing
                       ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                       : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                   }`}>
                  {previewing ? (
                    <>
                      <Pencil className="h-3 w-3" />
                      חזרה לעריכה
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" />
                      צפייה כלקוח
                    </>
                  )}
                </a>
              </>
            )}
            <span className="hidden text-muted-fg md:inline" dir="ltr">{profile?.email ?? user.email}</span>
            <form action={async () => { 'use server'; await signOut(); }}>
              <button type="submit" className="inline-flex items-center gap-1 text-muted-fg hover:text-red-600">
                <LogOut className="h-3.5 w-3.5" />
                התנתק
              </button>
            </form>
          </div>
        </div>
      </header>

      {previewing && isStudioAdmin && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto max-w-6xl px-6 py-2 text-center text-xs font-medium text-amber-900">
            👀 אתה רואה כעת את המסך כפי שלקוח רואה אותו — כפתורי העלאה/עריכה מוסתרים.
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogOut, Home } from 'lucide-react';
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
            {(profile?.studio_admin || profile?.role !== 'client') && (
              <Link href="/projects" className="inline-flex items-center gap-1 text-muted-fg hover:text-brand">
                <Home className="h-3.5 w-3.5" />
                לדאשבורד הסטודיו
              </Link>
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

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

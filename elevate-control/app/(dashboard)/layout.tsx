import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // Edge case — auth user without a profile row. Shouldn't happen with the trigger.
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-fg">לא נמצא פרופיל. צרו קשר עם מנהל המערכת.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted">
      <Sidebar user={profile} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={profile} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

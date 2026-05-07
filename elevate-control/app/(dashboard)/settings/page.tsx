import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from '@/components/settings/profile-form';
import { SignOutButton } from '@/components/settings/sign-out-button';

export const metadata = { title: 'הגדרות' };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, studio_admin, created_at')
    .eq('id', user.id)
    .single<{
      id: string; email: string; full_name: string | null;
      avatar_url: string | null; role: string; studio_admin: boolean; created_at: string;
    }>();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">הגדרות</h1>
        <p className="mt-1 text-sm text-muted-fg">
          הפרופיל שלך במערכת.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>פרופיל</CardTitle>
          <CardDescription>שם, אווטאר, ופרטי החיבור.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            email={profile?.email ?? user.email ?? ''}
            fullName={profile?.full_name ?? ''}
            avatarUrl={profile?.avatar_url ?? ''}
            role={profile?.role ?? ''}
            studioAdmin={profile?.studio_admin ?? false}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>חיבור</CardTitle>
          <CardDescription>ניתוק החשבון מהמכשיר הזה.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  );
}

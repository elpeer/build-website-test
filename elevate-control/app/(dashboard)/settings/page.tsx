import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from '@/components/settings/profile-form';
import { DigestSettings } from '@/components/settings/digest-settings';
import { SignOutButton } from '@/components/settings/sign-out-button';

export const metadata = { title: 'הגדרות' };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, studio_admin, created_at, daily_digest_enabled, daily_digest_hour')
    .eq('id', user.id)
    .single<{
      id: string; email: string; full_name: string | null;
      avatar_url: string | null; role: string; studio_admin: boolean; created_at: string;
      daily_digest_enabled: boolean; daily_digest_hour: number;
    }>();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">הגדרות</h1>
        <p className="mt-1 text-sm text-muted-fg">
          הפרופיל וההתראות שלך במערכת.
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
          <CardTitle>התראות מייל</CardTitle>
          <CardDescription>סיכום יומי של פעילות הפרויקטים שלך.</CardDescription>
        </CardHeader>
        <CardContent>
          <DigestSettings
            enabled={profile?.daily_digest_enabled ?? false}
            hour={profile?.daily_digest_hour ?? 9}
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

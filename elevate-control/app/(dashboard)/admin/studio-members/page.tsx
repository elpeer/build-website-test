import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudioMembersAdmin } from '@/components/admin/studio-members-admin';
import { Users } from 'lucide-react';

export const metadata = { title: 'חברי סטודיו — אדמין' };

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  studio_admin: boolean;
  created_at: string;
}

interface InvitationRow {
  id: string;
  email: string;
  role: string;
  studio_admin: boolean;
  created_at: string;
  accepted_at: string | null;
}

export default async function StudioMembersAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles').select('studio_admin').eq('id', user.id).single<{ studio_admin: boolean }>();
  if (!profile?.studio_admin) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-fg">
            העמוד הזה זמין רק ל-Studio Admins.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, studio_admin, created_at')
    .neq('role', 'client')
    .order('created_at', { ascending: true });
  const profiles = (profilesData ?? []) as ProfileRow[];

  const { data: invitesData } = await supabase
    .from('studio_invitations')
    .select('id, email, role, studio_admin, created_at, accepted_at')
    .is('accepted_at', null)
    .neq('role', 'client')
    .order('created_at', { ascending: false });
  const invitations = (invitesData ?? []) as InvitationRow[];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Users className="h-7 w-7" />
          חברי סטודיו
        </h1>
        <p className="mt-1 text-sm text-muted-fg">
          הזמנת אנשים לסטודיו, קביעת תפקיד גלובלי וסימון Studio Admins.
          PMs ו-Studio Admins מצורפים אוטומטית לכל פרויקט חדש.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{profiles.length} משתמשים פעילים, {invitations.length} ממתינים</CardTitle>
          <CardDescription>
            תפקיד <code>pm</code> או דגל Studio Admin → הצירוף האוטומטי לפרויקטים חדשים.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudioMembersAdmin
            currentUserId={user.id}
            profiles={profiles}
            invitations={invitations}
          />
        </CardContent>
      </Card>
    </div>
  );
}

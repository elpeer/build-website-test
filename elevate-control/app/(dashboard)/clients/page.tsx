import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InviteClientForm } from '@/components/team/invite-client-form';
import { SetPasswordButton } from '@/components/team/set-password-button';
import { Users, FolderKanban } from 'lucide-react';

export const metadata = { title: 'לקוחות' };

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  studio_admin: boolean;
  created_at: string;
}

interface MembershipRow {
  user_id: string;
  role: string;
  project_id: string;
  projects: { slug: string; name: string } | null;
}

const PROJECT_ROLE_LABELS: Record<string, string> = {
  owner: 'בעלים', pm: 'PM', designer: 'מעצב', developer: 'מפתח', reviewer: 'סוקר', client: 'לקוח',
};

const PROJECT_ROLE_COLORS: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-800', pm: 'bg-blue-100 text-blue-700',
  designer: 'bg-purple-100 text-purple-700', developer: 'bg-green-100 text-green-700',
  reviewer: 'bg-teal-100 text-teal-700', client: 'bg-zinc-100 text-zinc-700',
};

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: meProfile } = await supabase
    .from('profiles').select('studio_admin').eq('id', user.id)
    .single<{ studio_admin: boolean }>();
  const canSetPassword = !!meProfile?.studio_admin;

  // Only client-role profiles.
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, studio_admin, created_at')
    .eq('role', 'client')
    .order('created_at', { ascending: true });
  const profiles = (profilesData ?? []) as ProfileRow[];

  // Project memberships for those clients
  const userIds = profiles.map(p => p.id);
  const { data: membershipsData } = userIds.length
    ? await supabase
        .from('project_members')
        .select('user_id, role, project_id, projects(slug, name)')
        .in('user_id', userIds)
    : { data: [] as MembershipRow[] };

  const memberships = (membershipsData ?? []) as unknown as MembershipRow[];
  const membershipsByUser = new Map<string, MembershipRow[]>();
  for (const m of memberships) {
    const arr = membershipsByUser.get(m.user_id) ?? [];
    arr.push(m);
    membershipsByUser.set(m.user_id, arr);
  }

  // Project list for the invite-client form
  const { data: projectsData } = await supabase
    .from('projects')
    .select('id, slug, name')
    .order('created_at', { ascending: false });
  const projects = (projectsData ?? []) as { id: string; slug: string; name: string }[];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Users className="h-7 w-7" />
          לקוחות
        </h1>
        <p className="mt-1 text-sm text-muted-fg">
          ניהול הלקוחות שלכם — הזמנה, שיוך לפרויקטים, קביעת סיסמה ועריכה.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>הזמנת לקוח חדש</CardTitle>
          <CardDescription>
            לקוח קיים ייוסף לפרויקט מיידית. אם המייל לא רשום עדיין — תישלח הזמנה
            והוא יצורף בכניסה הראשונה. אפשר לקבוע סיסמה ראשונית מיידית.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteClientForm projects={projects} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{profiles.length} לקוחות</CardTitle>
          <CardDescription>
            כל לקוח רשום משויך לפרויקט אחד או יותר. שינוי סיסמה נעשה מהשורה שלו.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-fg">
              עדיין לא הוזמנו לקוחות. השתמשו בכפתור &quot;הזמן לקוח לפרויקט&quot; למעלה.
            </p>
          ) : (
            <ul className="space-y-3">
              {profiles.map(p => {
                const userMemberships = membershipsByUser.get(p.id) ?? [];
                const label = p.full_name ?? p.email;
                const initial = label.charAt(0).toUpperCase();
                return (
                  <li key={p.id} className="rounded-md border border-border bg-background p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-base font-semibold text-brand">
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{label}</p>
                        <p className="text-xs text-muted-fg" dir="ltr">{p.email}</p>
                        {userMemberships.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {userMemberships.map(m => (
                              <Link
                                key={m.project_id}
                                href={m.projects ? `/projects/${m.projects.slug}/team` : '#'}
                                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs hover:border-brand"
                              >
                                <FolderKanban className="h-3 w-3 text-muted-fg" />
                                <span>{m.projects?.name ?? '?'}</span>
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${PROJECT_ROLE_COLORS[m.role] ?? 'bg-zinc-100'}`}>
                                  {PROJECT_ROLE_LABELS[m.role] ?? m.role}
                                </span>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-amber-700">⚠ עדיין לא משויך לפרויקט</p>
                        )}
                        {canSetPassword && (
                          <SetPasswordButton userId={p.id} userLabel={p.email} />
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

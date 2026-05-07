import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamManagement } from '@/components/team/team-management';
import type { MemberRole } from '@/lib/supabase/database.types';

interface Props {
  params: Promise<{ slug: string }>;
}

interface MemberJoinRow {
  user_id: string;
  role: MemberRole;
  profiles: { email: string; full_name: string | null; avatar_url: string | null } | null;
}

interface InvitationRow {
  id: string;
  email: string;
  role: MemberRole;
  created_at: string;
  accepted_at: string | null;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: `צוות · ${slug}` };
}

export default async function TeamPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, name')
    .eq('slug', slug)
    .single<{ id: string; slug: string; name: string }>();

  if (!project) notFound();

  const { data: membersData } = await supabase
    .from('project_members')
    .select('user_id, role, profiles(email, full_name, avatar_url)')
    .eq('project_id', project.id);

  const members = ((membersData ?? []) as unknown as MemberJoinRow[]).map(m => ({
    user_id:    m.user_id,
    role:       m.role,
    email:      m.profiles?.email ?? 'unknown',
    full_name:  m.profiles?.full_name ?? null,
    avatar_url: m.profiles?.avatar_url ?? null,
  }));

  const { data: invitationsData } = await supabase
    .from('project_invitations')
    .select('id, email, role, created_at, accepted_at')
    .eq('project_id', project.id)
    .is('accepted_at', null)
    .order('created_at', { ascending: false });

  const invitations = ((invitationsData ?? []) as InvitationRow[]).map(i => ({
    id:         i.id,
    email:      i.email,
    role:       i.role,
    created_at: i.created_at,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href={`/projects/${project.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-fg hover:text-brand"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        חזרה ל-{project.name}
      </Link>

      <header>
        <h1 className="text-3xl font-bold tracking-tight">צוות הפרויקט</h1>
        <p className="mt-1 text-sm text-muted-fg">
          הוסיפו מעצבים, מפתחים, ולקוחות לפרויקט. משתמשים חדשים יקבלו מייל הזמנה ויצורפו אוטומטית בכניסה הראשונה.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>חברי צוות</CardTitle>
          <CardDescription>
            {members.length} פעילים · {invitations.length} ממתינים
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamManagement
            projectId={project.id}
            projectSlug={project.slug}
            currentUserId={user.id}
            members={members}
            invitations={invitations}
          />
        </CardContent>
      </Card>
    </div>
  );
}

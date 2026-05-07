import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Calendar, User, Globe, Smartphone, Database, Image as ImageIcon, Users, Activity } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatDateHe } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTree } from '@/components/projects/page-tree';
import { ActivityFeed } from '@/components/activity/activity-feed';
import type { PageStatus, PageType } from '@/lib/supabase/database.types';

interface Props {
  params: Promise<{ slug: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'בהכנה', active: 'פעיל', on_hold: 'בהמתנה',
  review: 'בסקירה', completed: 'הושלם', archived: 'בארכיון',
};

interface PageRow {
  id: string;
  slug: string;
  name_he: string | null;
  type: PageType;
  status: PageStatus;
  order: number;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('projects')
    .select('name')
    .eq('slug', slug)
    .single();
  return { title: data?.name ?? 'פרויקט' };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !project) {
    notFound();
  }

  // Member count + a few names
  const { data: members } = await supabase
    .from('project_members')
    .select('role, profiles(email, full_name)')
    .eq('project_id', project.id);

  // Project's pages (page tree)
  const { data: pagesData } = await supabase
    .from('pages')
    .select('id, slug, name_he, type, status, order')
    .eq('project_id', project.id)
    .order('order', { ascending: true });

  const pages: PageRow[] = (pagesData ?? []) as PageRow[];

  // Project's CPTs (for the page form's archive/single picker)
  const { data: cptsData } = await supabase
    .from('cpts')
    .select('id, slug, name_he, name_en')
    .eq('project_id', project.id)
    .order('order', { ascending: true });

  const cpts = (cptsData ?? []) as { id: string; slug: string; name_he: string | null; name_en: string | null }[];

  // Recent activity
  const { data: activitiesData } = await supabase
    .from('activity_log')
    .select('id, project_id, actor_id, actor_label, kind, entity_type, entity_id, summary, created_at')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const activities = (activitiesData ?? []) as Array<{
    id: string; project_id: string; actor_id: string | null; actor_label: string | null;
    kind: string; entity_type: string; entity_id: string | null; summary: string | null; created_at: string;
  }>;
  const actorIds = Array.from(new Set(activities.map(a => a.actor_id).filter(Boolean) as string[]));

  const profilesById: Record<string, { id: string; email: string; full_name: string | null }> = {};
  if (actorIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', actorIds);
    for (const p of (profilesData ?? []) as { id: string; email: string; full_name: string | null }[]) {
      profilesById[p.id] = p;
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-fg hover:text-brand"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        חזרה לפרויקטים
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              {STATUS_LABELS[project.status] ?? project.status}
            </span>
          </div>
          {project.client_name && (
            <p className="mt-1 text-sm text-muted-fg">לקוח: {project.client_name}</p>
          )}
        </div>
      </header>

      {project.description && (
        <Card>
          <CardContent className="prose prose-sm max-w-none pt-6 text-foreground">
            <p>{project.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5" />
              תאריך יעד
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatDateHe(project.target_at)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <User className="h-3.5 w-3.5" />
              חברי צוות
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{members?.length ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <Globe className="h-3.5 w-3.5" />
              WordPress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{project.has_wordpress ? 'כן' : 'לא'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <Smartphone className="h-3.5 w-3.5" />
              עיצוב מובייל
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{project.has_mobile_design ? 'כן' : 'לא'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/projects/${project.slug}/cpts`}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-brand hover:bg-brand/5"
        >
          <Database className="h-4 w-4" />
          ניהול CPTs ({cpts.length})
        </Link>
        <Link
          href={`/projects/${project.slug}/designs`}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-brand hover:bg-brand/5"
        >
          <ImageIcon className="h-4 w-4" />
          גלריית עיצובים
        </Link>
        <Link
          href={`/projects/${project.slug}/team`}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-brand hover:bg-brand/5"
        >
          <Users className="h-4 w-4" />
          צוות ({members?.length ?? 0})
        </Link>
        <Link
          href={`/projects/${project.slug}/activity`}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-brand hover:bg-brand/5"
        >
          <Activity className="h-4 w-4" />
          פעילות מלאה
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>עץ עמודים</CardTitle>
          <CardDescription>
            הגדירו את עמודי האתר וה-CPTs ({pages.length} עמודים)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PageTree
            projectId={project.id as string}
            projectSlug={project.slug as string}
            pages={pages}
            cpts={cpts}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>פעילות אחרונה</CardTitle>
          <CardDescription>10 הפעולות האחרונות (מתעדכן בזמן אמת)</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityFeed
            projectId={project.id}
            initialActivities={activities}
            profiles={profilesById}
            limit={10}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>פרטי הפרויקט</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-border py-2">
            <span className="text-muted-fg">Slug</span>
            <code className="rounded bg-muted px-2 py-0.5 text-xs">{project.slug}</code>
          </div>
          <div className="flex justify-between border-b border-border py-2">
            <span className="text-muted-fg">נוצר ב-</span>
            <span>{formatDateHe(project.created_at)}</span>
          </div>
          <div className="flex justify-between border-b border-border py-2">
            <span className="text-muted-fg">עודכן לאחרונה</span>
            <span>{formatDateHe(project.updated_at)}</span>
          </div>
          {project.github_repo && (
            <div className="flex justify-between py-2">
              <span className="text-muted-fg">GitHub</span>
              <code className="rounded bg-muted px-2 py-0.5 text-xs" dir="ltr">{project.github_repo}</code>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

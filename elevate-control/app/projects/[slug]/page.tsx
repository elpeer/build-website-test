import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Calendar, User, Globe, Smartphone } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatDateHe } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  params: Promise<{ slug: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'בהכנה', active: 'פעיל', on_hold: 'בהמתנה',
  review: 'בסקירה', completed: 'הושלם', archived: 'בארכיון',
};

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

      <Card>
        <CardHeader>
          <CardTitle>עץ עמודים</CardTitle>
          <CardDescription>הגדירו את עמודי האתר וה-CPTs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border-2 border-dashed border-border bg-muted/30 p-8 text-center">
            <p className="text-sm text-muted-fg">
              עורך העמודים יתווסף בעדכון הבא. בינתיים תוכלו להגדיר עמודים ידנית דרך SQL.
            </p>
          </div>
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

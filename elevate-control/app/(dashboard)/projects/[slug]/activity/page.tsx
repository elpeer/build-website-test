import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityFeed } from '@/components/activity/activity-feed';

interface Props {
  params: Promise<{ slug: string }>;
}

interface ActivityRecord {
  id: string;
  project_id: string;
  actor_id: string | null;
  actor_label: string | null;
  kind: string;
  entity_type: string;
  entity_id: string | null;
  summary: string | null;
  created_at: string;
}

interface ProfileRecord {
  id: string;
  email: string;
  full_name: string | null;
}

export async function generateMetadata({ params }: Props) {
  const { slug: _slugRaw } = await params; const slug = _slugRaw.normalize('NFC');
  return { title: `פעילות · ${slug}` };
}

export default async function ActivityPage({ params }: Props) {
  const { slug: _slugRaw } = await params; const slug = _slugRaw.normalize('NFC');
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, name')
    .eq('slug', slug)
    .single<{ id: string; slug: string; name: string }>();

  if (!project) notFound();

  const { data: activities } = await supabase
    .from('activity_log')
    .select('id, project_id, actor_id, actor_label, kind, entity_type, entity_id, summary, created_at')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = (activities ?? []) as ActivityRecord[];
  const actorIds = Array.from(new Set(rows.map(r => r.actor_id).filter(Boolean) as string[]));

  const profiles: Record<string, ProfileRecord> = {};
  if (actorIds.length > 0) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', actorIds);
    for (const p of (profileData ?? []) as ProfileRecord[]) {
      profiles[p.id] = p;
    }
  }

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
        <h1 className="text-3xl font-bold tracking-tight">פעילות הפרויקט</h1>
        <p className="mt-1 text-sm text-muted-fg">
          כל הפעולות שבוצעו על העמודים, הסקשנים, ה-CPTs והעיצובים. מתעדכן בזמן אמת.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>פעילות אחרונה</CardTitle>
          <CardDescription>{rows.length} אירועים אחרונים</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityFeed
            projectId={project.id}
            initialActivities={rows}
            profiles={profiles}
          />
        </CardContent>
      </Card>
    </div>
  );
}

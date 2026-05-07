import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/projects/project-card';
import { Plus, FolderOpen } from 'lucide-react';

export const metadata = { title: 'פרויקטים' };

const STATUS_LABELS: Record<string, string> = {
  draft:     'בהכנה',
  active:    'פעילים',
  on_hold:   'בהמתנה',
  review:    'בסקירה',
  completed: 'הושלמו',
  archived:  'בארכיון',
};

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, slug, name, client_name, status, logo_url, target_at, updated_at, pm_id')
    .is('archived_at', null)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('projects query error:', error.message);
  }

  // Group by status for the dashboard view
  const grouped = (projects ?? []).reduce<Record<string, typeof projects>>((acc, p) => {
    (acc[p.status] ??= []).push(p);
    return acc;
  }, {});

  const orderedStatuses: Array<keyof typeof STATUS_LABELS> = [
    'active', 'review', 'draft', 'on_hold', 'completed',
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">פרויקטים</h1>
          <p className="mt-1 text-sm text-muted-fg">
            כל הפרויקטים הפעילים של הסטודיו ({projects?.length ?? 0})
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href="/projects/new">
            <Plus className="ms-1 h-4 w-4" />
            פרויקט חדש
          </Link>
        </Button>
      </header>

      {!projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card py-16">
          <FolderOpen className="h-12 w-12 text-muted-fg" />
          <h2 className="mt-4 text-lg font-semibold">אין עדיין פרויקטים</h2>
          <p className="mt-1 max-w-sm text-center text-sm text-muted-fg">
            התחילו ביצירת פרויקט ראשון. לחצו על "פרויקט חדש" למעלה כדי להגדיר לקוח, צוות, ומבנה ראשוני.
          </p>
          <Button asChild className="mt-4" variant="accent">
            <Link href="/projects/new">
              <Plus className="ms-1 h-4 w-4" />
              צרו פרויקט ראשון
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {orderedStatuses.map(status => {
            const items = grouped[status];
            if (!items?.length) return null;
            return (
              <section key={status}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-fg">
                  {STATUS_LABELS[status]} <span className="font-normal">({items.length})</span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map(p => (
                    <ProjectCard key={p.id} project={p} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

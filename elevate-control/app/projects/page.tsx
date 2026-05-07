import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/projects/project-card';
import { Plus, FolderOpen } from 'lucide-react';
import type { ProjectStatus } from '@/lib/supabase/database.types';

export const metadata = { title: 'פרויקטים' };

// Local row type for what we select. Keeps page-level inference stable and
// independent of the placeholder Database types until `pnpm db:types` runs.
type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  client_name: string | null;
  status: ProjectStatus;
  logo_url: string | null;
  target_at: string | null;
  updated_at: string;
  pm_id: string | null;
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft:     'בהכנה',
  active:    'פעילים',
  on_hold:   'בהמתנה',
  review:    'בסקירה',
  completed: 'הושלמו',
  archived:  'בארכיון',
};

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .select('id, slug, name, client_name, status, logo_url, target_at, updated_at, pm_id')
    .is('archived_at', null)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('projects query error:', error.message);
  }

  const projects: ProjectRow[] = (data ?? []) as ProjectRow[];

  // Group by status for the dashboard view
  const grouped: Partial<Record<ProjectStatus, ProjectRow[]>> = {};
  for (const p of projects) {
    (grouped[p.status] ??= []).push(p);
  }

  const orderedStatuses: ProjectStatus[] = [
    'active', 'review', 'draft', 'on_hold', 'completed',
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">פרויקטים</h1>
          <p className="mt-1 text-sm text-muted-fg">
            כל הפרויקטים הפעילים של הסטודיו ({projects.length})
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href="/projects/new">
            <Plus className="ms-1 h-4 w-4" />
            פרויקט חדש
          </Link>
        </Button>
      </header>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card py-16">
          <FolderOpen className="h-12 w-12 text-muted-fg" />
          <h2 className="mt-4 text-lg font-semibold">אין עדיין פרויקטים</h2>
          <p className="mt-1 max-w-sm text-center text-sm text-muted-fg">
            התחילו ביצירת פרויקט ראשון. לחצו על <span className="font-semibold text-foreground">פרויקט חדש</span> למעלה כדי להגדיר לקוח, צוות, ומבנה ראשוני.
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

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { acceptPendingInvitations } from '@/app/actions/team';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectCard } from '@/components/projects/project-card';
import { Plus, FolderOpen, FileText, Rocket, Hammer } from 'lucide-react';
import type { ProjectStatus, PageStatus } from '@/lib/supabase/database.types';

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

  // Auto-attach any pending email invitations matching this user — idempotent,
  // and the RPC is cheap. Runs before the project query so newly attached
  // projects show up immediately.
  await acceptPendingInvitations();

  const { data, error } = await supabase
    .from('projects')
    .select('id, slug, name, client_name, status, logo_url, target_at, updated_at, pm_id')
    .is('archived_at', null)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('projects query error:', error.message);
  }

  const projects: ProjectRow[] = (data ?? []) as ProjectRow[];

  // Page-level stats: count per (project_id, status) for progress bars + aggregate
  const projectIds = projects.map(p => p.id);
  const { data: pageStatsData } = projectIds.length
    ? await supabase
        .from('pages')
        .select('project_id, status')
        .in('project_id', projectIds)
    : { data: [] as { project_id: string; status: PageStatus }[] };

  const pageStats = (pageStatsData ?? []) as { project_id: string; status: PageStatus }[];
  const pagesByProject = new Map<string, { total: number; live: number; in_dev: number }>();
  for (const row of pageStats) {
    const cur = pagesByProject.get(row.project_id) ?? { total: 0, live: 0, in_dev: 0 };
    cur.total += 1;
    if (row.status === 'live') cur.live += 1;
    if (['in_dev', 'built', 'reviewed'].includes(row.status)) cur.in_dev += 1;
    pagesByProject.set(row.project_id, cur);
  }

  const enrichedProjects = projects.map(p => {
    const s = pagesByProject.get(p.id) ?? { total: 0, live: 0, in_dev: 0 };
    return { ...p, pages_total: s.total, pages_live: s.live };
  });

  // Aggregate stats
  const totalPages = pageStats.length;
  const livePages  = pageStats.filter(r => r.status === 'live').length;
  const buildingPages = pageStats.filter(r => ['in_dev', 'built', 'reviewed'].includes(r.status)).length;

  // Group by status for the dashboard view
  const grouped: Partial<Record<ProjectStatus, typeof enrichedProjects>> = {};
  for (const p of enrichedProjects) {
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

      {projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand/10 text-brand">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-fg">פרויקטים פעילים</p>
                <p className="text-xl font-bold">{projects.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-fg">סה״כ עמודים</p>
                <p className="text-xl font-bold">{totalPages}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                <Hammer className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-fg">בפיתוח / בנייה</p>
                <p className="text-xl font-bold">{buildingPages}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-50 text-green-700">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-fg">בייצור (live)</p>
                <p className="text-xl font-bold">{livePages}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

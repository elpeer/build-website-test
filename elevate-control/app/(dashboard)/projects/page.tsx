import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { acceptPendingInvitations } from '@/app/actions/team';
import { acceptPendingStudioInvitations } from '@/app/actions/studio';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectCard } from '@/components/projects/project-card';
import { formatDateHe } from '@/lib/utils';
import {
  Plus, FolderOpen, FileText, Rocket, Hammer, AlertTriangle, Calendar,
  MessageCircle, ChevronLeft, FileCheck,
} from 'lucide-react';
import {
  STAGE_LABELS, type ProjectStage,
} from '@/lib/client-workspaces';
import type { ProjectStatus, PageStatus } from '@/lib/supabase/database.types';

export const metadata = { title: 'דאשבורד · פרויקטים' };

type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  client_name: string | null;
  status: ProjectStatus;
  current_stage: ProjectStage;
  logo_url: string | null;
  target_at: string | null;
  workspace_settings: Record<string, Record<string, string | null>> | null;
  updated_at: string;
  pm_id: string | null;
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'בהכנה', active: 'פעילים', on_hold: 'בהמתנה',
  review: 'בסקירה', completed: 'הושלמו', archived: 'בארכיון',
};

// Suggested next step per funnel stage
const NEXT_STEP_BY_STAGE: Record<ProjectStage, string> = {
  quote:        'שלח הצעת מחיר חתומה ועדכן שלב',
  spec:         'העלה סיכום ראיון ומסמך אפיון',
  design:       'שתף עיצובים לאישור הלקוח',
  frontend:     'דחף עמודי פרונט ראשונים לגיט',
  backend:      'חבר CMS וקטעי שדות ACF',
  qa:           'הרץ checklist בדיקות מול הלקוח',
  integrations: 'אסוף פיקסלים וקודי מעקב מהלקוח',
  launch:       'תאם תאריך וזמן עליה',
  live:         'שלב הדרכה ושירות',
};

// Page-status weights for the progress %
const PAGE_WEIGHTS: Record<PageStatus, number> = {
  planned: 0, designed: 15, sectioned: 30, in_dev: 50,
  built: 70, reviewed: 85, live: 100,
};

export default async function ProjectsPage() {
  const supabase = await createClient();
  await acceptPendingInvitations();
  await acceptPendingStudioInvitations();

  const { data: { user } } = await supabase.auth.getUser();
  const greetingName = user?.email?.split('@')[0] ?? 'שלום';

  const { data, error } = await supabase
    .from('projects')
    .select('id, slug, name, client_name, status, current_stage, logo_url, target_at, workspace_settings, updated_at, pm_id')
    .is('archived_at', null)
    .order('updated_at', { ascending: false });
  if (error) console.error('projects query error:', error.message);

  const projects: ProjectRow[] = (data ?? []) as ProjectRow[];
  const projectIds = projects.map(p => p.id);

  // Aggregates in parallel
  const [
    { data: pageStatsData },
    { data: openThreadsData },
    { data: pendingApprovalsData },
    { data: urgentTicketsData },
  ] = await Promise.all([
    projectIds.length
      ? supabase.from('pages').select('project_id, status').in('project_id', projectIds)
      : Promise.resolve({ data: [] as { project_id: string; status: PageStatus }[] }),
    projectIds.length
      ? supabase.from('comment_threads').select('project_id, status, priority, context_type')
          .in('project_id', projectIds)
          .neq('status', 'resolved').neq('status', 'wont_fix')
      : Promise.resolve({ data: [] as { project_id: string; status: string; priority: string; context_type: string }[] }),
    projectIds.length
      ? supabase.from('client_approvals').select('project_id').in('project_id', projectIds).eq('status', 'pending')
      : Promise.resolve({ data: [] as { project_id: string }[] }),
    projectIds.length
      ? supabase.from('comment_threads').select('project_id')
          .in('project_id', projectIds)
          .eq('context_type', 'ticket').eq('priority', 'urgent')
          .neq('status', 'resolved').neq('status', 'wont_fix')
      : Promise.resolve({ data: [] as { project_id: string }[] }),
  ]);

  const pageStats     = (pageStatsData         ?? []) as { project_id: string; status: PageStatus }[];
  const openThreads   = (openThreadsData       ?? []) as { project_id: string; status: string; priority: string; context_type: string }[];
  const pendingApps   = (pendingApprovalsData  ?? []) as { project_id: string }[];
  const urgentTix     = (urgentTicketsData     ?? []) as { project_id: string }[];

  const aggBy = <K extends string, V>(
    items: { project_id: string }[],
    initial: V, reducer: (acc: V, item: { project_id: string } & Record<K, unknown>) => V
  ) => {
    const m = new Map<string, V>();
    for (const it of items) {
      m.set(it.project_id, reducer(m.get(it.project_id) ?? initial, it as never));
    }
    return m;
  };

  const pagesByProject = aggBy<'status', { total: number; live: number; weighted: number }>(pageStats,
    { total: 0, live: 0, weighted: 0 },
    (acc, it) => {
      const status = (it as unknown as { status: PageStatus }).status;
      return {
        total:    acc.total + 1,
        live:     acc.live + (status === 'live' ? 1 : 0),
        weighted: acc.weighted + (PAGE_WEIGHTS[status] ?? 0),
      };
    });
  const threadsByProject  = aggBy<never, number>(openThreads, 0, acc => acc + 1);
  const approvalsByProject = aggBy<never, number>(pendingApps, 0, acc => acc + 1);
  const urgentByProject    = aggBy<never, number>(urgentTix, 0, acc => acc + 1);

  // Compute health + enrichment per project
  const enriched = projects.map(p => {
    const pages    = pagesByProject.get(p.id) ?? { total: 0, live: 0, weighted: 0 };
    const openComm = threadsByProject.get(p.id) ?? 0;
    const pendApp  = approvalsByProject.get(p.id) ?? 0;
    const urgent   = urgentByProject.get(p.id) ?? 0;

    const settings = p.workspace_settings ?? {};
    const launchAt = settings.launch?.launch_at ?? null;
    const targetDate = launchAt ?? p.target_at ?? null;

    const progress = pages.total > 0 ? Math.round(pages.weighted / pages.total) : 0;

    // Overdue if there's a date in the past and we haven't reached 'live' stage
    const overdue = targetDate
      ? (new Date(targetDate).getTime() < Date.now() && p.current_stage !== 'live')
      : false;

    // Health score: 100 minus penalties for unresolved items
    const healthRaw = 100 - urgent * 25 - openComm * 4 - pendApp * 2 - (overdue ? 30 : 0);
    const health = Math.max(0, Math.min(100, healthRaw));

    // Days until target
    const daysToTarget = targetDate
      ? Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86400000)
      : null;

    return {
      ...p,
      pages_total: pages.total,
      pages_live:  pages.live,
      progress,
      open_comments: openComm,
      pending_approvals: pendApp,
      urgent_tickets: urgent,
      target_date: targetDate,
      days_to_target: daysToTarget,
      overdue,
      health,
    };
  });

  // Aggregate top stats
  const totalPages    = pageStats.length;
  const livePages     = pageStats.filter(r => r.status === 'live').length;
  const buildingPages = pageStats.filter(r => ['in_dev', 'built', 'reviewed'].includes(r.status)).length;

  // Needs attention: any project with urgent tickets / open comments / pending approvals / overdue
  const attention = enriched
    .filter(p => p.urgent_tickets > 0 || p.open_comments > 0 || p.pending_approvals > 0 || p.overdue)
    .sort((a, b) => a.health - b.health);

  // Upcoming launches: target within the next 14 days, not overdue
  const upcoming = enriched
    .filter(p => p.days_to_target !== null && p.days_to_target >= 0 && p.days_to_target <= 14 && p.current_stage !== 'live')
    .sort((a, b) => (a.days_to_target ?? 0) - (b.days_to_target ?? 0));

  // Group by status for the rest
  const grouped: Partial<Record<ProjectStatus, typeof enriched>> = {};
  for (const p of enriched) {
    (grouped[p.status] ??= []).push(p);
  }
  const orderedStatuses: ProjectStatus[] = ['active', 'review', 'draft', 'on_hold', 'completed'];

  return (
    <div className="mx-auto max-w-6xl space-y-8">

      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-fg">{new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">שלום, {greetingName}</h1>
          <p className="mt-1 text-sm text-muted-fg">
            {projects.length} פרויקטים פעילים · {attention.length} דורשים תשומת לב
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href="/projects/new">
            <Plus className="ms-1 h-4 w-4" />
            פרויקט חדש
          </Link>
        </Button>
      </header>

      {/* Top KPI strip */}
      {projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={<FolderOpen className="h-5 w-5" />} bg="brand" label="פרויקטים פעילים" value={projects.length.toString()} />
          <KpiCard icon={<FileText className="h-5 w-5" />} bg="blue" label="סה״כ עמודים" value={totalPages.toString()} />
          <KpiCard icon={<Hammer className="h-5 w-5" />} bg="amber" label="בפיתוח/בנייה" value={buildingPages.toString()} />
          <KpiCard icon={<Rocket className="h-5 w-5" />} bg="green" label="בייצור" value={livePages.toString()} />
        </div>
      )}

      {/* Needs attention */}
      {attention.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              דורש תשומת לב ({attention.length})
            </CardTitle>
            <CardDescription>פרויקטים עם פריטים פתוחים, איחורים או טיקטים דחופים</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {attention.slice(0, 8).map(p => (
                <AttentionRow key={p.id} project={p} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Upcoming launches */}
      {upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              עליות קרובות ({upcoming.length})
            </CardTitle>
            <CardDescription>תאריך עליה לאוויר ב-14 הימים הקרובים</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {upcoming.map(p => (
                <li key={p.id}>
                  <Link href={`/projects/${p.slug}`}
                        className="flex items-center gap-3 rounded-md border border-border bg-background p-3 transition-colors hover:border-brand">
                    <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md ${
                      (p.days_to_target ?? 0) <= 3 ? 'bg-red-100 text-red-700' :
                      (p.days_to_target ?? 0) <= 7 ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      <span className="text-lg font-bold leading-none">{p.days_to_target}</span>
                      <span className="text-[10px]">ימים</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-xs text-muted-fg">
                        {STAGE_LABELS[p.current_stage]} · {p.progress}% · {formatDateHe(p.target_date)}
                      </p>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-muted-fg rtl:rotate-180" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card py-16">
          <FolderOpen className="h-12 w-12 text-muted-fg" />
          <h2 className="mt-4 text-lg font-semibold">אין עדיין פרויקטים</h2>
          <p className="mt-1 max-w-sm text-center text-sm text-muted-fg">
            התחילו ביצירת פרויקט ראשון.
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

// ─── Sub-components ───────────────────────────────────────────────────────

function KpiCard({ icon, bg, label, value }: {
  icon: React.ReactNode; bg: 'brand' | 'blue' | 'amber' | 'green';
  label: string; value: string;
}) {
  const cls = {
    brand: 'bg-brand/10 text-brand',
    blue:  'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-green-50 text-green-700',
  }[bg];
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${cls}`}>{icon}</div>
        <div>
          <p className="text-xs text-muted-fg">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface EnrichedProject {
  id: string; slug: string; name: string; client_name: string | null;
  current_stage: ProjectStage;
  progress: number; health: number;
  open_comments: number; pending_approvals: number; urgent_tickets: number;
  overdue: boolean; days_to_target: number | null;
}

function AttentionRow({ project }: { project: EnrichedProject }) {
  const healthCls = project.health >= 70 ? 'text-green-700 bg-green-50'
                  : project.health >= 40 ? 'text-amber-800 bg-amber-50'
                  : 'text-red-700 bg-red-50';
  const nextStep = NEXT_STEP_BY_STAGE[project.current_stage];
  return (
    <li>
      <Link href={`/projects/${project.slug}`}
            className="flex items-center gap-3 rounded-md border border-border bg-background p-3 transition-colors hover:border-brand">
        <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md font-bold ${healthCls}`}>
          <span className="text-base leading-none">{project.health}</span>
          <span className="text-[10px]">health</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{project.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-fg">
            <span>{STAGE_LABELS[project.current_stage]}</span>
            <span>·</span>
            <span>{project.progress}%</span>
            {project.urgent_tickets > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-red-700">
                <AlertTriangle className="h-3 w-3" />
                {project.urgent_tickets} דחוף
              </span>
            )}
            {project.open_comments > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-blue-700">
                <MessageCircle className="h-3 w-3" />
                {project.open_comments}
              </span>
            )}
            {project.pending_approvals > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-amber-800">
                <FileCheck className="h-3 w-3" />
                {project.pending_approvals}
              </span>
            )}
            {project.overdue && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-red-700">
                <Calendar className="h-3 w-3" />
                איחור
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-foreground">→ {nextStep}</p>
        </div>
        <ChevronLeft className="h-4 w-4 text-muted-fg rtl:rotate-180" />
      </Link>
    </li>
  );
}


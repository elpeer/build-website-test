import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ChevronLeft, Calendar, MessageCircle, TrendingUp, FileText,
  Settings, Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatDateHe } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTree } from '@/components/projects/page-tree';
import { ActivityFeed } from '@/components/activity/activity-feed';
import { GithubPanel } from '@/components/projects/github-panel';
import { GithubActivity } from '@/components/projects/github-activity';
import { PagesPreviewBoard } from '@/components/projects/pages-preview-board';
import { StageControl } from '@/components/projects/stage-control';
import { ClientCommentsFeed } from '@/components/projects/client-comments-feed';
import { WorkspaceNavigator } from '@/components/projects/workspace-navigator';
import { FloatingToc, type TocItem } from '@/components/projects/floating-toc';
import type { ProjectStage } from '@/lib/client-workspaces';
import type { PageStatus, PageType } from '@/lib/supabase/database.types';

interface Props {
  params: Promise<{ slug: string }>;
}

interface PageRow {
  id: string;
  slug: string;
  name_he: string | null;
  type: PageType;
  status: PageStatus;
  order: number;
  parent_id: string | null;
}

// Weighted progress per page status (rough but useful at a glance)
const PROGRESS_WEIGHTS: Record<PageStatus, number> = {
  planned: 0, designed: 15, sectioned: 30, in_dev: 50,
  built: 70, reviewed: 85, live: 100,
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('projects').select('name').eq('slug', slug).single();
  return { title: data?.name ?? 'פרויקט' };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('projects').select('*').eq('slug', slug).single();
  if (error || !project) notFound();

  // Pages
  const { data: pagesData } = await supabase
    .from('pages').select('id, slug, name_he, type, status, order, parent_id')
    .eq('project_id', project.id).order('order', { ascending: true });
  const pages: PageRow[] = (pagesData ?? []) as PageRow[];

  // CPTs (still needed for the "create page" form)
  const { data: cptsData } = await supabase
    .from('cpts').select('id, slug, name_he, name_en')
    .eq('project_id', project.id).order('order', { ascending: true });
  const cpts = (cptsData ?? []) as { id: string; slug: string; name_he: string | null; name_en: string | null }[];

  // Activity
  const { data: activitiesData } = await supabase
    .from('activity_log')
    .select('id, project_id, actor_id, actor_label, kind, entity_type, entity_id, summary, created_at')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false }).limit(10);
  const activities = (activitiesData ?? []) as Array<{
    id: string; project_id: string; actor_id: string | null; actor_label: string | null;
    kind: string; entity_type: string; entity_id: string | null; summary: string | null; created_at: string;
  }>;
  const actorIds = Array.from(new Set(activities.map(a => a.actor_id).filter(Boolean) as string[]));
  const profilesById: Record<string, { id: string; email: string; full_name: string | null }> = {};
  if (actorIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles').select('id, email, full_name').in('id', actorIds);
    for (const p of (profilesData ?? []) as { id: string; email: string; full_name: string | null }[]) {
      profilesById[p.id] = p;
    }
  }

  // Stats
  const totalPages = pages.length;
  const progressPercent = totalPages === 0 ? 0
    : Math.round(pages.reduce((s, p) => s + (PROGRESS_WEIGHTS[p.status] ?? 0), 0) / totalPages);

  const { count: openCommentsCount } = await supabase
    .from('comment_threads')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', project.id)
    .neq('status', 'resolved').neq('status', 'wont_fix');

  // Target date — prefer launch.launch_at workspace setting, fall back to project.target_at
  const settings = (project.workspace_settings as Record<string, Record<string, string | null>>) ?? {};
  const launchAt = settings.launch?.launch_at ?? null;
  const targetDate = launchAt ?? project.target_at ?? null;

  const tocItems: TocItem[] = [
    { id: 'stats',     label: 'סטטיסטיקות',    emoji: '📊' },
    { id: 'stages',    label: 'שלבי פרויקט',  emoji: '🚦' },
    { id: 'workspaces', label: 'אזורי עבודה',  emoji: '🧩' },
    { id: 'pages',     label: 'עץ עמודים',     emoji: '📑' },
    { id: 'previews',  label: 'לינקי תצוגה',   emoji: '🌐' },
    { id: 'comments',  label: 'תגובות לקוח',   emoji: '💬' },
    { id: 'github',    label: 'GitHub',         emoji: '⚙️' },
    { id: 'activity',  label: 'פעילות',        emoji: '⏱️' },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid gap-8 xl:grid-cols-[1fr_220px]">
        <div className="min-w-0 space-y-8">

          <Link href="/projects"
                className="inline-flex items-center gap-1 text-sm text-muted-fg hover:text-brand">
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            חזרה לפרויקטים
          </Link>

          {/* Header — no card background */}
          <header className="space-y-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                {project.client_name && (
                  <p className="text-sm uppercase tracking-wider text-muted-fg">{project.client_name}</p>
                )}
                <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{project.name}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <Link href={`/projects/${project.slug}/ask`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-brand/30 bg-brand/5 px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/10">
                  <Sparkles className="h-4 w-4" />
                  שאל את Claude
                </Link>
                <Link href={`/projects/${project.slug}/settings`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-muted-fg transition-colors hover:border-brand hover:text-brand">
                  <Settings className="h-4 w-4" />
                  הגדרות
                </Link>
              </div>
            </div>

            {project.description && (
              <p className="max-w-3xl text-base text-muted-fg">{project.description}</p>
            )}
          </header>

          {/* Stats */}
          <section id="stats" className="scroll-mt-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<Calendar className="h-4 w-4" />} label="תאריך עליה לאוויר"
                value={targetDate ? formatDateHe(targetDate) : 'לא נקבע'}
                hint={targetDate ? null : 'הגדר ב-workspace עליה לאוויר'}
              />
              <StatCard
                icon={<MessageCircle className="h-4 w-4" />} label="תגובות פתוחות"
                value={(openCommentsCount ?? 0).toString()}
                hint={openCommentsCount ? 'לקוח ממתין למענה' : 'הכל סגור'}
                accent={(openCommentsCount ?? 0) > 0 ? 'amber' : 'green'}
              />
              <StatCard
                icon={<TrendingUp className="h-4 w-4" />} label="התקדמות הפרויקט"
                value={`${progressPercent}%`}
                progress={progressPercent}
              />
              <StatCard
                icon={<FileText className="h-4 w-4" />} label="עמודים בפרויקט"
                value={totalPages.toString()}
                hint={`${pages.filter(p => p.status === 'live').length} בייצור`}
              />
            </div>
          </section>

          {/* Stages */}
          <section id="stages" className="scroll-mt-6">
            <StageControl
              projectId={project.id as string}
              projectSlug={project.slug as string}
              currentStage={(project.current_stage as ProjectStage) ?? 'quote'}
            />
          </section>

          {/* Workspaces */}
          <section id="workspaces" className="scroll-mt-6">
            <WorkspaceNavigator
              projectId={project.id as string}
              projectSlug={project.slug as string}
              currentStage={(project.current_stage as ProjectStage) ?? 'quote'}
            />
          </section>

          {/* Page tree */}
          <section id="pages" className="scroll-mt-6">
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
          </section>

          {/* Previews */}
          <section id="previews" className="scroll-mt-6">
            <PagesPreviewBoard
              projectId={project.id as string}
              projectSlug={project.slug as string}
            />
          </section>

          {/* Client comments */}
          <section id="comments" className="scroll-mt-6">
            <ClientCommentsFeed
              projectId={project.id as string}
              projectSlug={project.slug as string}
            />
          </section>

          {/* GitHub */}
          <section id="github" className="scroll-mt-6 space-y-6">
            <GithubPanel
              projectId={project.id as string}
              projectSlug={project.slug as string}
              initialRepo={(project.github_repo as string | null) ?? null}
              initialHtmlPath={(project.github_html_path as string | null) ?? null}
              initialThemePath={(project.github_theme_path as string | null) ?? null}
            />
            <GithubActivity repo={(project.github_repo as string | null) ?? null} />
          </section>

          {/* Activity */}
          <section id="activity" className="scroll-mt-6">
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
          </section>
        </div>

        {/* Floating TOC sidebar */}
        <FloatingToc items={tocItems} />
      </div>
    </div>
  );
}

interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string | null;
  progress?: number;
  accent?: 'green' | 'amber';
}

function StatCard({ icon, label, value, hint, progress, accent }: StatProps) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className={`flex items-center gap-1.5 text-xs font-medium ${
        accent === 'green' ? 'text-green-700'
        : accent === 'amber' ? 'text-amber-800'
        : 'text-muted-fg'
      }`}>
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {typeof progress === 'number' && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {hint && (
        <p className="mt-1.5 text-xs text-muted-fg">{hint}</p>
      )}
    </div>
  );
}

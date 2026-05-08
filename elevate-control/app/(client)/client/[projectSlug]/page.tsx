import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StageTracker } from '@/components/client/stage-tracker';
import { WorkspaceCard } from '@/components/client/workspace-card';
import {
  WORKSPACES, isWorkspaceUnlocked, STAGE_LABELS,
  type ProjectStage,
} from '@/lib/client-workspaces';
import { Calendar, MessageCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: Promise<{ projectSlug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { projectSlug } = await params;
  return { title: `אזור הלקוח · ${projectSlug}` };
}

interface OverrideRow { workspace: string; unlocked: boolean; message: string | null }

export default async function ClientDashboardPage({ params }: Props) {
  const { projectSlug } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, name, client_name, description, current_stage, vercel_url, target_at, kickoff_at, launched_at, workspace_settings')
    .eq('slug', projectSlug)
    .single<{
      id: string; slug: string; name: string; client_name: string | null;
      description: string | null; current_stage: ProjectStage;
      vercel_url: string | null; target_at: string | null;
      kickoff_at: string | null; launched_at: string | null;
      workspace_settings: Record<string, Record<string, string | null>> | null;
    }>();
  if (!project) notFound();

  const { data: overridesData } = await supabase
    .from('client_workspace_overrides')
    .select('workspace, unlocked, message')
    .eq('project_id', project.id);
  const overrides = (overridesData ?? []) as OverrideRow[];
  const overrideBySlug = new Map(overrides.map(o => [o.workspace, o]));

  // Unread comment threads visible to the client (open or in_progress)
  const { count: openCommentsCount } = await supabase
    .from('comment_threads')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', project.id)
    .neq('status', 'resolved').neq('status', 'wont_fix');

  // Pick a target date: launch.launch_at if set, else target_at
  const launchAt = project.workspace_settings?.launch?.launch_at ?? null;
  const targetDate = launchAt ?? project.target_at ?? null;

  const stageIdx = ['quote','spec','design','frontend','backend','qa','integrations','launch','live']
    .indexOf(project.current_stage);
  const totalStages = 8; // 'live' is terminal
  const progressPercent = Math.round((stageIdx / totalStages) * 100);

  return (
    <div className="space-y-5">

      {/* Compact header — name + client + summary in one block */}
      <header className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {project.client_name && (
              <p className="truncate text-xs uppercase tracking-wider text-muted-fg">
                {project.client_name}
              </p>
            )}
            <h1 className="mt-0.5 truncate text-xl font-bold sm:text-2xl">{project.name}</h1>
          </div>
          <div className="shrink-0 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            {STAGE_LABELS[project.current_stage]}
          </div>
        </div>

        {project.description && (
          <p className="text-sm text-muted-fg line-clamp-2">{project.description}</p>
        )}

        {/* Mini stats strip */}
        <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
          <Stat
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="עליה לאוויר"
            value={targetDate ? new Date(targetDate).toLocaleDateString('he-IL', { day:'numeric', month:'short' }) : 'לא נקבע'} />
          <Stat
            icon={<ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />}
            label="התקדמות"
            value={`${progressPercent}%`} />
          <Stat
            icon={<MessageCircle className="h-3.5 w-3.5" />}
            label="תגובות פתוחות"
            value={String(openCommentsCount ?? 0)}
            accent={(openCommentsCount ?? 0) > 0 ? 'amber' : undefined} />
        </div>
      </header>

      {/* Stage tracker — scrollable on small screens */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-fg">
          שלבי הפרויקט
        </h2>
        <StageTracker
          currentStage={project.current_stage}
          kickoffAt={project.kickoff_at}
          targetAt={targetDate}
          launchedAt={project.launched_at}
        />
      </section>

      {/* Workspace cards — primary CTA region */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-fg">
          אזורי עבודה
        </h2>
        <p className="mb-3 text-sm text-muted-fg">
          לחצו על אזור פתוח כדי לראות את התוכן, להגיב ולאשר.
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {WORKSPACES.map(w => {
            const override = overrideBySlug.get(w.slug);
            const unlocked = isWorkspaceUnlocked(w, project.current_stage, override);
            return (
              <WorkspaceCard
                key={w.slug}
                projectSlug={project.slug}
                workspace={w}
                unlocked={unlocked}
                lockedMessage={override?.message ?? w.lockedMsg}
              />
            );
          })}
        </div>
      </section>

      {/* Helpful first-time hint */}
      {(openCommentsCount ?? 0) === 0 && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          💡 התחילו מהאזור הראשון הפתוח. בכל אזור תוכלו לראות מה הצוות העלה,
          להגיב, ולאשר מה שנראה לכם בסדר. נחזור אליכם תוך כמה שעות אחרי שתשאירו תגובה.
        </div>
      )}

      {project.vercel_url && (
        <Link href={project.vercel_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:border-brand">
          🌐 צפו בגרסת הפיתוח של האתר
        </Link>
      )}
    </div>
  );
}

function Stat({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: string; accent?: 'amber';
}) {
  return (
    <div className={`flex flex-col items-center text-center sm:items-start sm:text-start ${
      accent === 'amber' ? 'text-amber-800' : ''
    }`}>
      <p className="flex items-center gap-1 text-[11px] text-muted-fg sm:text-xs">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold sm:text-base">{value}</p>
    </div>
  );
}

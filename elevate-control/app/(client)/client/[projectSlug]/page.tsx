import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StageTracker } from '@/components/client/stage-tracker';
import { WorkspaceCard } from '@/components/client/workspace-card';
import {
  WORKSPACES, isWorkspaceUnlocked,
  type ProjectStage,
} from '@/lib/client-workspaces';

interface Props {
  params: Promise<{ projectSlug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { projectSlug } = await params;
  return { title: `אזור הלקוח · ${projectSlug}` };
}

interface OverrideRow {
  workspace: string;
  unlocked: boolean;
  message: string | null;
}

export default async function ClientDashboardPage({ params }: Props) {
  const { projectSlug } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, name, client_name, current_stage, vercel_url, target_at, kickoff_at, launched_at')
    .eq('slug', projectSlug)
    .single<{
      id: string; slug: string; name: string; client_name: string | null;
      current_stage: ProjectStage; vercel_url: string | null;
      target_at: string | null; kickoff_at: string | null; launched_at: string | null;
    }>();
  if (!project) notFound();

  const { data: overridesData } = await supabase
    .from('client_workspace_overrides')
    .select('workspace, unlocked, message')
    .eq('project_id', project.id);
  const overrides = (overridesData ?? []) as OverrideRow[];
  const overrideBySlug = new Map(overrides.map(o => [o.workspace, o]));

  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{project.name}</h1>
        {project.client_name && (
          <p className="mt-1 text-sm text-muted-fg">{project.client_name}</p>
        )}
      </header>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-fg">
          התקדמות הפרויקט
        </h2>
        <StageTracker
          currentStage={project.current_stage}
          kickoffAt={project.kickoff_at}
          targetAt={project.target_at}
          launchedAt={project.launched_at}
        />
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-fg">
          אזורי עבודה
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}

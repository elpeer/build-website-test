import { notFound } from 'next/navigation';
import { Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { WorkspaceContent } from '@/components/client/workspace-content';
import { WorkspaceSideMenu, WorkspaceMobileBar } from '@/components/projects/workspace-side-menu';
import {
  WORKSPACE_BY_SLUG, isWorkspaceUnlocked,
  type WorkspaceSlug, type ProjectStage,
} from '@/lib/client-workspaces';
import type { Json } from '@/lib/supabase/database.types';

interface Props {
  params: Promise<{ slug: string; workspace: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug, workspace } = await params;
  const meta = WORKSPACE_BY_SLUG[workspace as WorkspaceSlug];
  return { title: `${meta?.label ?? workspace} · ${slug}` };
}

export default async function StudioWorkspaceManagePage({ params }: Props) {
  const { slug, workspace } = await params;
  const meta = WORKSPACE_BY_SLUG[workspace as WorkspaceSlug];
  if (!meta) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, name, current_stage, workspace_settings')
    .eq('slug', slug)
    .single<{
      id: string; slug: string; name: string;
      current_stage: ProjectStage;
      workspace_settings: Json | null;
    }>();
  if (!project) notFound();

  const { data: override } = await supabase
    .from('client_workspace_overrides')
    .select('unlocked, message')
    .eq('project_id', project.id).eq('workspace', workspace)
    .maybeSingle<{ unlocked: boolean; message: string | null }>();

  const unlockedForClient = isWorkspaceUnlocked(meta, project.current_stage, override);

  const settingsAll = (project.workspace_settings as Record<string, Record<string, string | null>>) ?? {};
  const workspaceSettings = settingsAll[meta.slug] ?? {};

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid gap-8 xl:grid-cols-[1fr_220px]">
        <div className="min-w-0 space-y-6">

          <WorkspaceMobileBar
            projectId={project.id}
            projectSlug={project.slug}
            currentSlug={meta.slug}
            currentStage={project.current_stage}
          />

          <header className="flex items-start gap-4">
            <span className="text-4xl">{meta.emoji}</span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{meta.label}</h1>
              <p className="mt-1 text-sm text-muted-fg">{meta.blurb}</p>
              {!unlockedForClient && (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-800">
                  <Lock className="h-3 w-3" />
                  נעול ללקוח כרגע · {override?.message ?? meta.lockedMsg}
                </p>
              )}
            </div>
          </header>

          <WorkspaceContent
            projectId={project.id}
            projectSlug={project.slug}
            workspace={meta}
            workspaceSettings={workspaceSettings}
            currentUserId={user.id}
            isStudio
          />
        </div>

        <WorkspaceSideMenu
          projectId={project.id}
          projectSlug={project.slug}
          projectName={project.name}
          currentSlug={meta.slug}
          currentStage={project.current_stage}
        />
      </div>
    </div>
  );
}

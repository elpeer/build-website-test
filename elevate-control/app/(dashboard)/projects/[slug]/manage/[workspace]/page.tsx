import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ExternalLink, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { WorkspaceContent } from '@/components/client/workspace-content';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/projects/${project.slug}`}
              className="inline-flex items-center gap-1 text-sm text-muted-fg hover:text-brand">
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          חזרה ל-{project.name}
        </Link>
        <Link href={`/client/${project.slug}/${meta.slug}?as=client`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200">
          <ExternalLink className="h-3 w-3" />
          תצוגת לקוח
        </Link>
      </div>

      <header className="flex items-center gap-4">
        <span className="text-4xl">{meta.emoji}</span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{meta.label}</h1>
          <p className="mt-1 text-sm text-muted-fg">{meta.blurb}</p>
          {!unlockedForClient && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
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
  );
}

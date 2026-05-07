import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import {
  WORKSPACE_BY_SLUG, isWorkspaceUnlocked,
  type WorkspaceSlug, type ProjectStage,
} from '@/lib/client-workspaces';
import { WorkspaceStub } from '@/components/client/workspace-stub';

interface Props {
  params: Promise<{ projectSlug: string; workspace: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { projectSlug, workspace } = await params;
  const meta = WORKSPACE_BY_SLUG[workspace as WorkspaceSlug];
  return { title: `${meta?.label ?? workspace} · ${projectSlug}` };
}

export default async function ClientWorkspacePage({ params }: Props) {
  const { projectSlug, workspace } = await params;
  const meta = WORKSPACE_BY_SLUG[workspace as WorkspaceSlug];
  if (!meta) notFound();

  const supabase = await createClient();
  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, name, current_stage')
    .eq('slug', projectSlug)
    .single<{ id: string; slug: string; name: string; current_stage: ProjectStage }>();
  if (!project) notFound();

  const { data: override } = await supabase
    .from('client_workspace_overrides')
    .select('unlocked, message')
    .eq('project_id', project.id)
    .eq('workspace', workspace)
    .maybeSingle<{ unlocked: boolean; message: string | null }>();

  const unlocked = isWorkspaceUnlocked(meta, project.current_stage, override);

  return (
    <div className="space-y-6">
      <Link href={`/client/${project.slug}`}
            className="inline-flex items-center gap-1 text-sm text-muted-fg hover:text-brand">
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        חזרה לדאשבורד
      </Link>

      <header className="flex items-center gap-4">
        <span className="text-4xl">{meta.emoji}</span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{meta.label}</h1>
          <p className="mt-1 text-sm text-muted-fg">{meta.blurb}</p>
        </div>
      </header>

      {!unlocked ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
          <Lock className="mx-auto h-10 w-10 text-muted-fg" />
          <h2 className="mt-4 text-lg font-semibold">השלב הזה עדיין נעול</h2>
          <p className="mt-2 text-sm text-muted-fg">{override?.message ?? meta.lockedMsg}</p>
        </div>
      ) : (
        <WorkspaceStub workspace={meta} projectSlug={project.slug} />
      )}
    </div>
  );
}

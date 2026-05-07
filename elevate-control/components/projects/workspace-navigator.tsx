import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { WORKSPACES, isWorkspaceUnlocked, type ProjectStage } from '@/lib/client-workspaces';
import { Lock, MessageCircle, FileCheck, ListChecks, Files } from 'lucide-react';

interface Props {
  projectId: string;
  projectSlug: string;
  currentStage: ProjectStage;
}

interface OverrideRow {
  workspace: string;
  unlocked: boolean;
}
interface CountRow { workspace: string }

/**
 * Server component — pulls per-workspace counts (open threads, pending
 * approvals, files, checklist items) so the studio sees a quick health
 * pulse before opening each workspace.
 */
export async function WorkspaceNavigator({ projectId, projectSlug, currentStage }: Props) {
  const supabase = await createClient();

  const [
    { data: overridesData },
    { data: openThreadsData },
    { data: pendingApprovalsData },
    { data: filesData },
    { data: checklistData },
  ] = await Promise.all([
    supabase.from('client_workspace_overrides').select('workspace, unlocked').eq('project_id', projectId),
    supabase.from('comment_threads').select('workspace, context_type')
      .eq('project_id', projectId)
      .neq('status', 'resolved').neq('status', 'wont_fix'),
    supabase.from('client_approvals').select('workspace').eq('project_id', projectId).eq('status', 'pending'),
    supabase.from('project_files').select('workspace').eq('project_id', projectId),
    supabase.from('checklist_items').select('workspace').eq('project_id', projectId).neq('status', 'done'),
  ]);

  const overrideBySlug = new Map(((overridesData ?? []) as OverrideRow[]).map(o => [o.workspace, o]));
  const countBy = (rows: CountRow[] | null | undefined) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.workspace, (m.get(r.workspace) ?? 0) + 1);
    return m;
  };
  const threads     = countBy(openThreadsData as CountRow[] | null);
  const pendingApps = countBy(pendingApprovalsData as CountRow[] | null);
  const files       = countBy(filesData as CountRow[] | null);
  const openTodo    = countBy(checklistData as CountRow[] | null);

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">אזורי עבודה של הפרויקט</h3>
        <p className="text-xs text-muted-fg">לחיצה על כל אזור פותחת את עמוד הניהול שלו</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {WORKSPACES.map(w => {
          const override = overrideBySlug.get(w.slug);
          const unlocked = isWorkspaceUnlocked(w, currentStage, override);
          const c = {
            threads: threads.get(w.slug) ?? 0,
            pending: pendingApps.get(w.slug) ?? 0,
            files:   files.get(w.slug) ?? 0,
            todo:    openTodo.get(w.slug) ?? 0,
          };
          return (
            <Link key={w.slug}
                  href={`/projects/${projectSlug}/manage/${w.slug}`}
                  className={`group flex items-start gap-3 rounded-md border p-3 transition-colors ${
                    unlocked
                      ? 'border-border bg-background hover:border-brand hover:bg-brand/5'
                      : 'border-dashed border-border bg-muted/30 hover:border-brand/40'
                  }`}>
              <span className="text-2xl">{w.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold">{w.label}</p>
                  {!unlocked && <Lock className="h-3 w-3 text-muted-fg" />}
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-fg">{w.blurb}</p>
                {(c.threads || c.pending || c.todo || c.files) > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                    {c.threads > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-blue-700">
                        <MessageCircle className="h-3 w-3" /> {c.threads}
                      </span>
                    )}
                    {c.pending > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-amber-800">
                        <FileCheck className="h-3 w-3" /> {c.pending}
                      </span>
                    )}
                    {c.todo > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-50 px-1.5 py-0.5 text-purple-700">
                        <ListChecks className="h-3 w-3" /> {c.todo}
                      </span>
                    )}
                    {c.files > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-zinc-700">
                        <Files className="h-3 w-3" /> {c.files}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

import Link from 'next/link';
import { ChevronLeft, Lock, ExternalLink, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import {
  WORKSPACES, isWorkspaceUnlocked,
  type WorkspaceSlug, type ProjectStage,
} from '@/lib/client-workspaces';

interface Props {
  projectId: string;
  projectSlug: string;
  projectName: string;
  currentSlug: WorkspaceSlug;
  currentStage: ProjectStage;
}

interface OverrideRow { workspace: string; unlocked: boolean }

/**
 * Sticky side menu used on /projects/[slug]/manage/[workspace] — lets the
 * studio jump between all 9 workspace screens without going back to the
 * project dashboard. Includes a back arrow and a "view as client" link.
 */
export async function WorkspaceSideMenu({
  projectId, projectSlug, projectName, currentSlug, currentStage,
}: Props) {
  const supabase = await createClient();
  const { data: overridesData } = await supabase
    .from('client_workspace_overrides')
    .select('workspace, unlocked')
    .eq('project_id', projectId);
  const overrideBySlug = new Map(((overridesData ?? []) as OverrideRow[]).map(o => [o.workspace, o]));

  return (
    <aside aria-label="ניווט אזורי עבודה" className="hidden xl:block">
      <nav className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pe-2 space-y-3">
        <Link href={`/projects/${projectSlug}`}
              className="inline-flex items-center gap-1 text-xs text-muted-fg hover:text-brand">
          <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          חזרה ל-{projectName}
        </Link>

        <p className="mt-2 ps-3 text-xs font-semibold uppercase tracking-wider text-muted-fg">
          אזורי עבודה
        </p>

        <ul className="space-y-1 border-s border-border ps-4">
          {WORKSPACES.map(w => {
            const override = overrideBySlug.get(w.slug);
            const unlockedForClient = isWorkspaceUnlocked(w, currentStage, override);
            const active = w.slug === currentSlug;
            return (
              <li key={w.slug}>
                <Link href={`/projects/${projectSlug}/manage/${w.slug}`}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                        active
                          ? 'bg-brand/10 font-medium text-brand'
                          : 'text-muted-fg hover:bg-muted hover:text-foreground'
                      }`}>
                  <span className="text-base">{w.emoji}</span>
                  <span className="flex-1 truncate">{w.label}</span>
                  {!unlockedForClient && (
                    <Lock className="h-3 w-3 shrink-0 text-amber-600" aria-label="נעול ללקוח" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-border pt-3">
          <Link href={`/client/${projectSlug}/${currentSlug}?as=client`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200">
            <Eye className="h-3 w-3" />
            תצוגת לקוח
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </nav>
    </aside>
  );
}

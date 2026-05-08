import Link from 'next/link';
import { Lock, LayoutDashboard } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import {
  WORKSPACES, isWorkspaceUnlocked,
  type WorkspaceSlug, type ProjectStage,
} from '@/lib/client-workspaces';

interface OverrideRow { workspace: string; unlocked: boolean }

async function fetchOverrides(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('client_workspace_overrides')
    .select('workspace, unlocked')
    .eq('project_id', projectId);
  return new Map(((data ?? []) as OverrideRow[]).map(o => [o.workspace, o]));
}

interface Props {
  projectId: string;
  projectSlug: string;
  projectName: string;
  currentSlug: WorkspaceSlug | null; // null on the dashboard root
  currentStage: ProjectStage;
}

/**
 * Vertical sticky rail (lg+ only). The layout positions it on the right edge
 * by placing it as the first child of an RTL flex container.
 */
export async function ClientSideMenu({
  projectId, projectSlug, projectName, currentSlug, currentStage,
}: Props) {
  const overrideBySlug = await fetchOverrides(projectId);

  return (
    <aside aria-label="ניווט פרויקט" className="hidden w-56 shrink-0 lg:block">
      <nav className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pe-2 space-y-3">
        <Link href={`/client/${projectSlug}`}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                currentSlug === null
                  ? 'bg-brand/10 font-semibold text-brand'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`}>
          <LayoutDashboard className="h-4 w-4" />
          <span>סקירה כללית</span>
        </Link>

        <p className="ps-3 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-fg">
          {projectName}
        </p>

        <ul className="space-y-1">
          {WORKSPACES.map(w => {
            const override = overrideBySlug.get(w.slug);
            const unlocked = isWorkspaceUnlocked(w, currentStage, override);
            const active = w.slug === currentSlug;
            const baseClasses = 'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors';
            const stateClasses = active
              ? 'bg-brand/10 font-medium text-brand'
              : unlocked
                ? 'text-zinc-700 hover:bg-zinc-100'
                : 'text-zinc-400 cursor-not-allowed';
            return (
              <li key={w.slug}>
                {unlocked ? (
                  <Link href={`/client/${projectSlug}/${w.slug}`} className={`${baseClasses} ${stateClasses}`}>
                    <span className="text-base">{w.emoji}</span>
                    <span className="flex-1 truncate">{w.label}</span>
                  </Link>
                ) : (
                  <span className={`${baseClasses} ${stateClasses}`} aria-disabled="true">
                    <span className="text-base opacity-60">{w.emoji}</span>
                    <span className="flex-1 truncate">{w.label}</span>
                    <Lock className="h-3 w-3 shrink-0" />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

/**
 * Horizontal chip bar — visible only below lg. Pins to the top of the scroll
 * container so it stays visible while the user scrolls within a workspace.
 */
export async function ClientMobileBar({
  projectId, projectSlug, currentSlug, currentStage,
}: Pick<Props, 'projectId' | 'projectSlug' | 'currentSlug' | 'currentStage'>) {
  const overrideBySlug = await fetchOverrides(projectId);

  return (
    <nav aria-label="ניווט פרויקט"
         className="sticky top-0 z-20 -mx-6 mb-2 border-b border-border bg-background/95 backdrop-blur lg:hidden">
      <ul className="flex items-center gap-1 overflow-x-auto whitespace-nowrap px-6 py-2">
        <li className="shrink-0">
          <Link href={`/client/${projectSlug}`}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                  currentSlug === null
                    ? 'bg-brand text-white font-semibold'
                    : 'bg-muted text-muted-fg hover:bg-muted/80'
                }`}>
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>סקירה</span>
          </Link>
        </li>
        {WORKSPACES.map(w => {
          const override = overrideBySlug.get(w.slug);
          const unlocked = isWorkspaceUnlocked(w, currentStage, override);
          const active = w.slug === currentSlug;
          const baseClasses = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors';
          const stateClasses = active
            ? 'bg-brand text-white font-medium'
            : unlocked
              ? 'bg-muted text-muted-fg hover:bg-muted/80'
              : 'bg-muted/40 text-zinc-400';
          return (
            <li key={w.slug} className="shrink-0">
              {unlocked ? (
                <Link href={`/client/${projectSlug}/${w.slug}`} className={`${baseClasses} ${stateClasses}`}>
                  <span>{w.emoji}</span>
                  <span>{w.label}</span>
                </Link>
              ) : (
                <span className={`${baseClasses} ${stateClasses}`} aria-disabled="true">
                  <span>{w.emoji}</span>
                  <span>{w.label}</span>
                  <Lock className="h-3 w-3" />
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

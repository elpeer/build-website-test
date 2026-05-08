import Link from 'next/link';
import { Lock, ChevronLeft } from 'lucide-react';
import type { WorkspaceMeta } from '@/lib/client-workspaces';

interface Props {
  projectSlug: string;
  workspace: WorkspaceMeta;
  unlocked: boolean;
  lockedMessage: string;
}

export function WorkspaceCard({ projectSlug, workspace, unlocked, lockedMessage }: Props) {
  const inner = (
    <div
      className={`flex h-full flex-col gap-2 rounded-lg border p-3 transition-all sm:gap-3 sm:rounded-xl sm:p-4 ${
        unlocked
          ? 'cursor-pointer border-border bg-background hover:-translate-y-0.5 hover:border-brand hover:shadow-md'
          : 'cursor-not-allowed border-dashed border-border bg-muted/40 opacity-70'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl sm:text-3xl">{workspace.emoji}</span>
        {!unlocked && <Lock className="h-4 w-4 text-muted-fg" />}
      </div>

      <div>
        <h3 className="text-sm font-semibold sm:text-base">{workspace.label}</h3>
        <p className="mt-0.5 hidden text-xs text-muted-fg sm:line-clamp-2 sm:block sm:text-sm">
          {workspace.blurb}
        </p>
      </div>

      {!unlocked ? (
        <p className="mt-auto line-clamp-2 text-[11px] italic text-muted-fg sm:text-xs">
          {lockedMessage}
        </p>
      ) : (
        <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-brand sm:text-sm">
          כניסה
          <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180 sm:h-4 sm:w-4" />
        </span>
      )}
    </div>
  );

  if (unlocked) {
    return <Link href={`/client/${projectSlug}/${workspace.slug}`}>{inner}</Link>;
  }
  return inner;
}

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
      className={`flex h-full flex-col gap-3 rounded-xl border p-5 transition-all ${
        unlocked
          ? 'cursor-pointer border-border bg-background hover:-translate-y-0.5 hover:border-brand hover:shadow-md'
          : 'cursor-not-allowed border-dashed border-border bg-muted/40 opacity-70'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl">{workspace.emoji}</span>
        {!unlocked && <Lock className="h-4 w-4 text-muted-fg" />}
      </div>

      <div>
        <h3 className="text-lg font-semibold">{workspace.label}</h3>
        <p className="mt-1 text-sm text-muted-fg">{workspace.blurb}</p>
      </div>

      {!unlocked ? (
        <p className="mt-auto text-xs italic text-muted-fg">{lockedMessage}</p>
      ) : (
        <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-brand">
          כניסה
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </span>
      )}
    </div>
  );

  if (unlocked) {
    return <Link href={`/client/${projectSlug}/${workspace.slug}`}>{inner}</Link>;
  }
  return inner;
}

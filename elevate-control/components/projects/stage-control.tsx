'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { setProjectStage } from '@/app/actions/project-stages';
import { PROJECT_STAGES, STAGE_LABELS, type ProjectStage } from '@/lib/client-workspaces';
import { Button } from '@/components/ui/button';
import { GitBranch, ExternalLink, AlertCircle } from 'lucide-react';

interface Props {
  projectId: string;
  projectSlug: string;
  currentStage: ProjectStage;
}

export function StageControl({ projectId, projectSlug, currentStage }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<ProjectStage>(currentStage);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: ProjectStage) {
    setStage(next);
    setError(null);
    startTransition(async () => {
      const result = await setProjectStage(projectId, projectSlug, next);
      if (!result.ok) { setError(result.error); setStage(currentStage); }
      else router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-md border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <GitBranch className="h-4 w-4" />
          שלב הפרויקט
        </h3>
        <Link
          href={`/client/${projectSlug}`}
          className="inline-flex items-center gap-1 rounded-md bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/20"
          target="_blank" rel="noopener noreferrer"
        >
          <ExternalLink className="h-3 w-3" />
          תצוגת לקוח
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PROJECT_STAGES.map(s => {
          const selected = stage === s;
          return (
            <button key={s} type="button"
                    onClick={() => handleChange(s)}
                    disabled={isPending}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selected
                        ? 'bg-brand text-white'
                        : 'bg-muted text-muted-fg hover:bg-muted/80'
                    }`}>
              {STAGE_LABELS[s]}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-fg">
        השלב קובע אילו אזורי עבודה זמינים ללקוח בדאשבורד שלו.
      </p>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span>
        </div>
      )}
    </div>
  );
}

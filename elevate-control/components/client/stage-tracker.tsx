import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { PROJECT_STAGES, STAGE_LABELS, type ProjectStage } from '@/lib/client-workspaces';

interface Props {
  currentStage: ProjectStage;
  kickoffAt?: string | null;
  targetAt?: string | null;
  launchedAt?: string | null;
}

export function StageTracker({ currentStage, kickoffAt, targetAt, launchedAt }: Props) {
  const idx = PROJECT_STAGES.indexOf(currentStage);
  const total = PROJECT_STAGES.length - 1; // 'live' is the terminal state
  const percent = Math.round((idx / total) * 100);

  return (
    <div className="space-y-4 rounded-lg border border-border bg-background p-5">
      {/* Progress bar */}
      <div>
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-semibold">{STAGE_LABELS[currentStage]}</span>
          <span className="text-xs text-muted-fg">{percent}% מהדרך</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-brand transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* Steps */}
      <ol className="grid gap-2 sm:grid-cols-3 md:grid-cols-9">
        {PROJECT_STAGES.map((stage, i) => {
          const done    = i < idx;
          const current = i === idx;
          return (
            <li key={stage}
                className={`flex items-center gap-1.5 rounded-md border p-2 text-xs ${
                  done    ? 'border-green-200 bg-green-50 text-green-800'
                  : current ? 'border-brand bg-brand/5 text-brand font-semibold'
                  :           'border-border bg-muted/30 text-muted-fg'
                }`}>
              {done    ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
               : current ? <Clock        className="h-3.5 w-3.5 shrink-0 animate-pulse" />
               :           <Circle       className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{STAGE_LABELS[stage]}</span>
            </li>
          );
        })}
      </ol>

      {/* Dates */}
      {(kickoffAt || targetAt || launchedAt) && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-3 text-xs text-muted-fg">
          {kickoffAt && <span>קיק-אוף: {new Date(kickoffAt).toLocaleDateString('he-IL')}</span>}
          {targetAt  && <span>תאריך יעד: {new Date(targetAt).toLocaleDateString('he-IL')}</span>}
          {launchedAt && <span>עלה לאוויר: {new Date(launchedAt).toLocaleDateString('he-IL')}</span>}
        </div>
      )}
    </div>
  );
}

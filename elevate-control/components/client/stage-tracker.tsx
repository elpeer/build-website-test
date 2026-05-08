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
  const total = PROJECT_STAGES.length - 1; // 'live' is terminal
  const percent = Math.round((idx / total) * 100);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-3 sm:p-4">
      {/* Progress bar */}
      <div>
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-semibold">{STAGE_LABELS[currentStage]}</span>
          <span className="text-xs text-muted-fg">{percent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-brand transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* Steps — single row scrollable on mobile */}
      <ol className="-mx-3 flex gap-1.5 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:px-0">
        {PROJECT_STAGES.map((stage, i) => {
          const done    = i < idx;
          const current = i === idx;
          return (
            <li key={stage}
                className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${
                  done    ? 'border-green-200 bg-green-50 text-green-800'
                  : current ? 'border-brand bg-brand text-white font-semibold'
                  :           'border-border bg-muted/30 text-muted-fg'
                }`}>
              {done    ? <CheckCircle2 className="h-3 w-3 shrink-0" />
               : current ? <Clock        className="h-3 w-3 shrink-0 animate-pulse" />
               :           <Circle       className="h-3 w-3 shrink-0" />}
              <span>{STAGE_LABELS[stage]}</span>
            </li>
          );
        })}
      </ol>

      {/* Dates */}
      {(kickoffAt || targetAt || launchedAt) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-2 text-xs text-muted-fg">
          {kickoffAt   && <span>קיק-אוף: {new Date(kickoffAt).toLocaleDateString('he-IL')}</span>}
          {targetAt    && <span>יעד: {new Date(targetAt).toLocaleDateString('he-IL')}</span>}
          {launchedAt  && <span>עלה לאוויר: {new Date(launchedAt).toLocaleDateString('he-IL')}</span>}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setProjectProgress } from '@/app/actions/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, Save, RotateCcw, Check } from 'lucide-react';

interface Props {
  projectId: string;
  projectSlug: string;
  initialPercent: number | null;
  initialNote: string | null;
  /** Value the client will see if the override is cleared. */
  fallbackPercent: number;
}

/** Compact inline editor for the progress percent + green note shown
 *  on the client overview. Designed to live in a thin strip on the
 *  studio project page, not a full card. */
export function ProgressOverrideEditor({
  projectId, projectSlug, initialPercent, initialNote, fallbackPercent,
}: Props) {
  const router = useRouter();
  const [percent, setPercent] = useState<string>(initialPercent != null ? String(initialPercent) : '');
  const [note, setNote] = useState<string>(initialNote ?? '');
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number>(0);
  const [isPending, startTransition] = useTransition();

  const showSaved = savedAt > 0 && Date.now() - savedAt < 2500;
  const trimmed = percent.trim();
  const parsed = trimmed === '' ? null : Number(trimmed);
  const validPercent = parsed === null || (Number.isFinite(parsed) && parsed >= 0 && parsed <= 100);
  const dirty =
    (percent.trim() !== (initialPercent != null ? String(initialPercent) : '')) ||
    (note.trim() !== (initialNote ?? ''));
  const hasOverride = initialPercent != null || (initialNote ?? '').trim() !== '';

  function save() {
    if (!validPercent) { setError('0-100'); return; }
    setError(null);
    startTransition(async () => {
      const r = await setProjectProgress(projectId, projectSlug, parsed, note);
      if (!r.ok) { setError(r.error); return; }
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  function reset() {
    setPercent(''); setNote(''); setError(null);
    startTransition(async () => {
      const r = await setProjectProgress(projectId, projectSlug, null, null);
      if (!r.ok) { setError(r.error); return; }
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-sm">
      <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-fg">
        <TrendingUp className="h-3.5 w-3.5" />
        <span>התקדמות (תצוגת לקוח):</span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Input value={percent} type="number" min="0" max="100"
               dir="ltr" className="h-8 w-16 font-mono text-center text-sm"
               onChange={e => { setPercent(e.target.value); setError(null); }}
               placeholder={String(fallbackPercent)} />
        <span className="text-xs text-muted-fg">%</span>
      </div>

      <Input value={note}
             onChange={e => { setNote(e.target.value); setError(null); }}
             placeholder="הערה ללקוח (מה נשאר)"
             className="h-8 min-w-[180px] flex-1 text-sm" />

      {dirty && (
        <Button type="button" variant="accent" size="sm" onClick={save}
                disabled={isPending || !validPercent} className="h-8">
          <Save className="ms-1 h-3.5 w-3.5" />
          שמור
        </Button>
      )}
      {hasOverride && !dirty && (
        <Button type="button" variant="ghost" size="sm" onClick={reset}
                disabled={isPending} title="חזרה לחישוב אוטומטי" className="h-8">
          <RotateCcw className="ms-1 h-3.5 w-3.5" />
          איפוס
        </Button>
      )}

      {error && <span className="text-xs text-red-700">{error}</span>}
      {showSaved && !error && (
        <span className="flex items-center gap-1 text-xs text-green-700">
          <Check className="h-3 w-3" /> נשמר
        </span>
      )}
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setProjectProgress } from '@/app/actions/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  projectId: string;
  projectSlug: string;
  initialPercent: number | null;
  initialNote: string | null;
  /** Fallback shown when the override is cleared — same value the
   *  client sees by default. */
  fallbackPercent: number;
}

export function ProgressOverrideEditor({
  projectId, projectSlug, initialPercent, initialNote, fallbackPercent,
}: Props) {
  const router = useRouter();
  const [percent, setPercent] = useState<string>(initialPercent != null ? String(initialPercent) : '');
  const [note, setNote] = useState<string>(initialNote ?? '');
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number>(0);
  const [isPending, startTransition] = useTransition();

  const showSaved = savedAt > 0 && Date.now() - savedAt < 3000;
  const trimmedPercent = percent.trim();
  const parsed = trimmedPercent === '' ? null : Number(trimmedPercent);
  const validPercent = parsed === null || (Number.isFinite(parsed) && parsed >= 0 && parsed <= 100);

  function save() {
    if (!validPercent) {
      setError('האחוז חייב להיות בין 0 ל-100');
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await setProjectProgress(projectId, projectSlug, parsed, note);
      if (!r.ok) { setError(r.error); return; }
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  function reset() {
    setPercent('');
    setNote('');
    startTransition(async () => {
      const r = await setProjectProgress(projectId, projectSlug, null, null);
      if (!r.ok) { setError(r.error); return; }
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">אחוז התקדמות לתצוגת הלקוח</CardTitle>
        <CardDescription>
          ידני &mdash; דורס את האחוז שמחושב לפי שלב הפרויקט.
          השאירו ריק כדי לחזור לחישוב האוטומטי ({fallbackPercent}%).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <label className="block text-xs text-muted-fg">אחוז (0-100)</label>
            <Input value={percent} type="number" min="0" max="100"
                   dir="ltr" className="font-mono text-sm"
                   onChange={e => { setPercent(e.target.value); setError(null); }}
                   placeholder={`ברירת מחדל: ${fallbackPercent}`} />
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-xs text-muted-fg">הערה ללקוח (מה נשאר)</label>
          <Textarea value={note} rows={2}
                    onChange={e => { setNote(e.target.value); setError(null); }}
                    placeholder="לדוגמה: ממתינים לאישור עיצוב עמוד הבית" />
          <p className="text-[11px] text-muted-fg">
            תוצג בצבע ירוק מתחת למספר בתצוגת הלקוח.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span>
          </div>
        )}
        {showSaved && !error && (
          <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-2 text-xs text-green-700">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>נשמר.</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="accent" size="sm" onClick={save}
                  disabled={isPending || !validPercent}>
            <Save className="ms-1 h-3.5 w-3.5" />
            {isPending ? 'שומר...' : 'שמור'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={reset}
                  disabled={isPending}>
            <RotateCcw className="ms-1 h-3.5 w-3.5" />
            איפוס (חזרה לחישוב אוטומטי)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

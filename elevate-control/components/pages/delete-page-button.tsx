'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deletePage } from '@/app/actions/pages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface Props {
  pageId: string;
  pageSlug: string;
  pageName: string;
  projectSlug: string;
  sectionsCount: number;
  designsCount: number;
  childrenCount: number;
}

export function DeletePageButton({
  pageId, pageSlug, pageName, projectSlug,
  sectionsCount, designsCount, childrenCount,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const requiredText = pageSlug;
  const matches = confirmText.trim() === requiredText;

  function handleDelete() {
    if (!matches) return;
    setError(null);
    startTransition(async () => {
      const result = await deletePage(pageId, projectSlug);
      if (result.ok) {
        router.push(`/projects/${projectSlug}`);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="ms-1 h-3.5 w-3.5" />
        מחק עמוד
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => !isPending && setOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">מחיקת עמוד</h2>
            <p className="mt-1 text-sm text-muted-fg">
              עומדים למחוק את <span className="font-semibold text-foreground">{pageName}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={isPending}
            className="text-muted-fg hover:text-foreground"
            aria-label="סגור"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">המחיקה תגרור:</p>
          <ul className="list-disc space-y-0.5 ps-5 text-xs">
            <li>{sectionsCount} סקשנים יימחקו (cascade).</li>
            <li>{designsCount} עיצובים שיוייכו לעמוד יישמרו אבל יאבדו את השיוך.</li>
            <li>{childrenCount} עמודי-בן (אם יש) יוצאו מתחת לעמוד הזה ל-root.</li>
            <li className="font-semibold">פעולה זו אינה הפיכה.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm_slug" className="text-xs">
            כדי לאשר, הקלידו <code className="rounded bg-muted px-1.5 font-mono">{requiredText}</code>
          </label>
          <Input
            id="confirm_slug"
            value={confirmText}
            dir="ltr"
            className="font-mono"
            onChange={e => setConfirmText(e.target.value)}
            autoFocus
            disabled={isPending}
          />
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
            ביטול
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={!matches || isPending}
            className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
          >
            <Trash2 className="ms-1 h-4 w-4" />
            {isPending ? 'מוחק...' : 'מחק לצמיתות'}
          </Button>
        </div>
      </div>
    </div>
  );
}

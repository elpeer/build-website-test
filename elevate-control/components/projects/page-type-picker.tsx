'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setPageType } from '@/app/actions/pages';
import { FileText, Folder, Layers, AlertTriangle, Settings, Check, AlertCircle } from 'lucide-react';
import type { PageType } from '@/lib/supabase/database.types';

interface Props {
  pageId: string;
  projectSlug: string;
  initialType: PageType;
}

const TYPE_ICONS: Record<PageType, React.ComponentType<{ className?: string }>> = {
  page: FileText, archive: Folder, single: Layers, system: AlertTriangle, service: Settings,
};
const TYPE_LABELS: Record<PageType, string> = {
  page: 'עמוד רגיל', archive: 'ארכיון CPT', single: 'עמוד פנימי CPT',
  system: 'עמוד מערכת', service: 'עמוד שירות',
};

/** Studio control to change a page's type after creation. Mirrors the
 *  button-group used in the page-tree "add page" form, but persists
 *  immediately on click via setPageType. */
export function PageTypePicker({ pageId, projectSlug, initialType }: Props) {
  const router = useRouter();
  const [type, setType] = useState<PageType>(initialType);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number>(0);
  const [isPending, startTransition] = useTransition();

  const showSaved = savedAt > 0 && Date.now() - savedAt < 2500;

  function change(next: PageType) {
    if (next === type || isPending) return;
    const prev = type;
    setType(next); // optimistic
    setError(null);
    startTransition(async () => {
      const r = await setPageType(pageId, projectSlug, next);
      if (!r.ok) { setType(prev); setError(r.error); return; }
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-fg">סוג עמוד</span>
        {showSaved && !error && (
          <span className="flex items-center gap-1 text-xs text-green-700">
            <Check className="h-3 w-3" /> נשמר
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TYPE_ICONS) as PageType[]).map(t => {
          const Icon = TYPE_ICONS[t];
          const selected = type === t;
          return (
            <button key={t} type="button" onClick={() => change(t)} disabled={isPending}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors disabled:opacity-60 ${
                      selected
                        ? 'border-brand bg-brand/5 text-brand'
                        : 'border-border bg-background text-muted-fg hover:border-brand/40'
                    }`}>
              <Icon className="h-3.5 w-3.5" />
              {TYPE_LABELS[t]}
            </button>
          );
        })}
      </div>
      {error && (
        <div className="mt-2 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span>
        </div>
      )}
    </div>
  );
}

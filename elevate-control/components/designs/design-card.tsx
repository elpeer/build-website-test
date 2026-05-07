'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteDesign } from '@/app/actions/designs';
import { Button } from '@/components/ui/button';
import { Trash2, Monitor, Tablet, Smartphone, FileText, Sparkles, ExternalLink } from 'lucide-react';
import type { DesignViewport } from '@/lib/supabase/database.types';

interface DesignRow {
  id: string;
  viewport: DesignViewport;
  storage_path: string;
  file_url: string;
  mime_type: string | null;
  notes: string | null;
  created_at: string;
  page_slug: string | null;
  page_name: string | null;
  ai_analyzed_at: string | null;
}

interface Props {
  design: DesignRow;
  projectSlug: string;
}

const VIEWPORT_ICONS: Record<DesignViewport, typeof Monitor> = {
  desktop: Monitor, tablet: Tablet, mobile: Smartphone,
};
const VIEWPORT_LABELS: Record<DesignViewport, string> = {
  desktop: 'דסקטופ', tablet: 'טאבלט', mobile: 'מובייל',
};

export function DesignCard({ design, projectSlug }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('למחוק את העיצוב? הקובץ יימחק לצמיתות.')) return;
    startTransition(async () => {
      const result = await deleteDesign(design.id, { projectSlug });
      if (result.ok) { setDeleted(true); router.refresh(); }
    });
  }

  if (deleted) return null;

  const Icon = VIEWPORT_ICONS[design.viewport];
  const isImage = design.mime_type?.startsWith('image/');
  const date = new Date(design.created_at).toLocaleDateString('he-IL');

  // The card is a Link only when we have a page slug — that's where the
  // analysis panel lives. Otherwise it's a passive tile (rare — only happens
  // for designs uploaded before the page was attached).
  const detailHref = design.page_slug
    ? `/projects/${projectSlug}/${design.page_slug}/designs/${design.id}`
    : null;

  const inner = (
    <article className="group flex flex-col overflow-hidden rounded-md border border-border bg-background transition-shadow hover:shadow-md">
      <div className="relative aspect-video bg-muted">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={design.file_url} alt={design.notes ?? `עיצוב ${design.viewport}`}
               className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-fg">
            <FileText className="h-12 w-12" />
          </div>
        )}
        <span className="absolute top-2 start-2 inline-flex items-center gap-1 rounded-full bg-background/95 px-2 py-1 text-xs font-medium shadow">
          <Icon className="h-3.5 w-3.5" />
          {VIEWPORT_LABELS[design.viewport]}
        </span>
        {design.ai_analyzed_at && (
          <span className="absolute top-2 end-2 inline-flex items-center gap-1 rounded-full bg-brand/90 px-2 py-1 text-xs font-medium text-white shadow">
            <Sparkles className="h-3 w-3" />
            נותח
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {design.page_slug && (
          <p className="text-xs">
            <span className="text-muted-fg">עמוד: </span>
            <span className="font-medium">{design.page_name ?? design.page_slug}</span>
          </p>
        )}
        {design.notes && <p className="line-clamp-2 text-sm text-foreground">{design.notes}</p>}
        <p className="text-xs text-muted-fg">{date}</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          {!detailHref ? (
            <a href={design.file_url} target="_blank" rel="noopener noreferrer"
               onClick={e => e.stopPropagation()}
               className="inline-flex items-center gap-1 text-xs text-brand hover:underline">
              <ExternalLink className="h-3.5 w-3.5" />
              פתח קובץ
            </a>
          ) : <span />}
          <Button type="button" variant="ghost" size="icon" onClick={handleDelete}
                  disabled={isPending} aria-label="מחק"
                  className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );

  if (detailHref) {
    return <Link href={detailHref} className="block">{inner}</Link>;
  }
  return inner;
}

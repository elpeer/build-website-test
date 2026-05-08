'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, PlayCircle, BookOpen } from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';

export interface GuideListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  cover_url: string | null;
  video_url: string | null;
}

export interface CategoryOption { slug: string; label: string }

const FALLBACK_LABELS: Record<string, string> = {
  general: 'כללי', wordpress: 'WordPress', clickup: 'ClickUp',
  figma: 'Figma', launch: 'עליה לאוויר',
  woocommerce: 'WooCommerce', polylang: 'Polylang',
  forms: 'טפסים', seo: 'SEO',
};

interface Props {
  guides: GuideListItem[];
  projectSlug: string;
  categories?: CategoryOption[];
}

export function GuidesList({ guides, projectSlug, categories = [] }: Props) {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string>('');

  const labelFor = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach(c => m.set(c.slug, c.label));
    Object.entries(FALLBACK_LABELS).forEach(([k, v]) => { if (!m.has(k)) m.set(k, v); });
    return m;
  }, [categories]);

  // Build the chip list from categories that actually have guides in this
  // result set, so empty buckets don't clutter the UI.
  const availableCats = useMemo(() => {
    const used = new Set<string>();
    guides.forEach(g => { if (g.category) used.add(g.category); });
    return Array.from(used).sort();
  }, [guides]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guides.filter(g => {
      if (activeCat && g.category !== activeCat) return false;
      if (!q) return true;
      const hay = `${g.title} ${g.description ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [guides, query, activeCat]);

  if (guides.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-fg">
        עדיין לא הוגדרו מדריכים.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput value={query} onChange={setQuery}
                     placeholder={`חיפוש ב-${guides.length} מדריכים...`}
                     className="flex-1" />
        {availableCats.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setActiveCat('')}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      activeCat === ''
                        ? 'bg-brand text-white font-medium'
                        : 'bg-muted text-muted-fg hover:bg-muted/80'
                    }`}>
              הכל ({guides.length})
            </button>
            {availableCats.map(slug => {
              const count = guides.filter(g => g.category === slug).length;
              const active = activeCat === slug;
              return (
                <button key={slug} type="button"
                        onClick={() => setActiveCat(active ? '' : slug)}
                        className={`rounded-full px-3 py-1 text-xs transition-colors ${
                          active
                            ? 'bg-brand text-white font-medium'
                            : 'bg-muted text-muted-fg hover:bg-muted/80'
                        }`}>
                  {labelFor.get(slug) ?? slug} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-fg">
          לא נמצאו מדריכים תואמים. נסו ביטוי אחר.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map(g => (
            <Link key={g.id}
                  href={`/client/${projectSlug}/training/${g.slug}`}
                  className="group flex gap-3 overflow-hidden rounded-lg border border-border bg-background p-3 transition-shadow hover:shadow-md">
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md bg-muted">
                {g.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.cover_url} alt={g.title}
                       className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-fg">
                    <BookOpen className="h-6 w-6" />
                  </div>
                )}
                {g.video_url && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                    <PlayCircle className="h-6 w-6" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="truncate font-medium group-hover:text-brand">{g.title}</h4>
                  {g.category && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-fg">
                      {labelFor.get(g.category) ?? g.category}
                    </span>
                  )}
                </div>
                {g.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-fg">{g.description}</p>
                )}
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-brand">
                  קרא/י <ExternalLink className="h-3 w-3" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

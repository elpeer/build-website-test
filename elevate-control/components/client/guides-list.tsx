'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, PlayCircle, BookOpen, Star } from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';

export interface GuideListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  cover_url: string | null;
  video_url: string | null;
  badge: string | null;
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(g => (
            <Link key={g.id}
                  href={`/client/${projectSlug}/training/${g.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-shadow hover:shadow-md">
              {g.cover_url && (
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.cover_url} alt={g.title}
                       className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  {g.video_url && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                      <PlayCircle className="h-10 w-10" />
                    </span>
                  )}
                </div>
              )}
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                {g.badge && (
                  <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {g.badge}
                  </span>
                )}
                <div className="flex items-start gap-2">
                  {!g.cover_url && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand/10 text-brand">
                      <BookOpen className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <h4 className="text-sm font-semibold leading-snug group-hover:text-brand">
                    {g.title}
                  </h4>
                </div>
                {g.description && (
                  <p className="line-clamp-2 text-xs text-muted-fg">{g.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  {g.category && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-fg">
                      {labelFor.get(g.category) ?? g.category}
                    </span>
                  )}
                  <span className="ms-auto inline-flex items-center gap-1 text-xs font-medium text-brand">
                    קרא/י
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addSection } from '@/app/actions/sections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, X, AlertCircle } from 'lucide-react';

interface SectionDefinition {
  id: string;
  slug: string;
  name_he: string | null;
  name_en: string | null;
  category: string | null;
  description: string | null;
}

interface PageContext {
  pageId: string;
  projectId: string;
  projectSlug: string;
  pageSlug: string;
}

interface Props {
  ctx: PageContext;
  definitions: SectionDefinition[];
}

const CATEGORY_LABELS: Record<string, string> = {
  hero:    'Hero',
  feature: 'Feature',
  listing: 'Listings (CPT-driven)',
  content: 'Content',
  utility: 'Utility',
  social:  'Social',
  cta:     'CTA',
};

export function AddSectionPicker({ ctx, definitions }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Group by category
  const filtered = definitions.filter(d => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      d.slug.toLowerCase().includes(q) ||
      d.name_he?.toLowerCase().includes(q) ||
      d.name_en?.toLowerCase().includes(q)
    );
  });

  const grouped = filtered.reduce<Record<string, SectionDefinition[]>>((acc, d) => {
    const cat = d.category ?? 'other';
    (acc[cat] ??= []).push(d);
    return acc;
  }, {});

  const orderedCategories = ['hero', 'feature', 'listing', 'content', 'utility', 'social', 'cta', 'other']
    .filter(c => grouped[c]?.length);

  function handleAdd(definitionSlug: string) {
    setError(null);
    startTransition(async () => {
      const result = await addSection(ctx, definitionSlug);
      if (result.ok) {
        setOpen(false);
        setFilter('');
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
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full justify-center border-dashed py-6"
      >
        <Plus className="ms-1 h-4 w-4" />
        הוסיפו סקשן
      </Button>
    );
  }

  return (
    <div className="space-y-4 rounded-md border border-border bg-muted/30 p-4">

      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold">בחירת סקשן</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { setOpen(false); setFilter(''); setError(null); }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-fg start-3" />
        <Input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="חיפוש לפי שם או slug..."
          className="ps-9"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="max-h-[24rem] space-y-4 overflow-y-auto">
        {orderedCategories.map(cat => (
          <section key={cat}>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-fg">
              {CATEGORY_LABELS[cat] ?? cat} <span className="font-normal">({grouped[cat].length})</span>
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {grouped[cat].map(d => (
                <button
                  key={d.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleAdd(d.slug)}
                  className="group flex flex-col items-start gap-1 rounded-md border border-border bg-background p-3 text-start transition-colors hover:border-brand hover:bg-brand/5 disabled:opacity-50"
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="font-medium text-sm">{d.name_he ?? d.name_en ?? d.slug}</span>
                    <Plus className="h-3.5 w-3.5 shrink-0 text-muted-fg transition-colors group-hover:text-brand" />
                  </div>
                  <code className="text-xs text-muted-fg" dir="ltr">{d.slug}</code>
                </button>
              ))}
            </div>
          </section>
        ))}

        {orderedCategories.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-fg">
            לא נמצאו סקשנים תואמים לחיפוש.
          </p>
        )}
      </div>

    </div>
  );
}

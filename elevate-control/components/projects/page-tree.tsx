'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPage } from '@/app/actions/pages';
import { slugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, FileText, Layers, Folder, AlertTriangle, Settings, AlertCircle, ChevronLeft } from 'lucide-react';
import type { PageStatus, PageType } from '@/lib/supabase/database.types';

interface PageRow {
  id: string;
  slug: string;
  name_he: string | null;
  type: PageType;
  status: PageStatus;
  order: number;
  parent_id?: string | null;
}

const TYPE_LABELS: Record<PageType, string> = {
  page:    'עמוד רגיל',
  archive: 'ארכיון CPT',
  single:  'עמוד פנימי CPT',
  system:  'עמוד מערכת',
  service: 'עמוד שירות',
};

const TYPE_ICONS: Record<PageType, React.ComponentType<{ className?: string }>> = {
  page:    FileText,
  archive: Folder,
  single:  Layers,
  system:  AlertTriangle,
  service: Settings,
};

const STATUS_LABELS: Record<PageStatus, string> = {
  planned:   'מתוכנן',
  designed:  'עוצב',
  sectioned: 'חולק לסקשנים',
  in_dev:    'בפיתוח',
  built:     'נבנה',
  reviewed:  'נסקר',
  live:      'בייצור',
};

const STATUS_PILLS: Record<PageStatus, string> = {
  planned:   'bg-zinc-100 text-zinc-700',
  designed:  'bg-blue-50 text-blue-700',
  sectioned: 'bg-indigo-50 text-indigo-700',
  in_dev:    'bg-amber-50 text-amber-800',
  built:     'bg-purple-50 text-purple-700',
  reviewed:  'bg-teal-50 text-teal-700',
  live:      'bg-green-50 text-green-700',
};

interface CptOption {
  id: string;
  slug: string;
  name_he: string | null;
  name_en: string | null;
}

interface Props {
  projectId: string;
  projectSlug: string;
  pages: PageRow[];
  cpts?: CptOption[];
}

export function PageTree({ projectId, projectSlug, pages, cpts = [] }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(pages.length === 0);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [type, setType] = useState<PageType>('page');
  const [cptId, setCptId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const needsCpt = type === 'archive' || type === 'single';

  function onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setName(value);
    if (!slugManuallyEdited) setSlug(slugify(value));
  }

  function handleSubmit(formData: FormData) {
    formData.set('slug', slug);
    formData.set('type', type);
    if (needsCpt) {
      if (!cptId) { setError('בחרו CPT לעמוד מסוג זה'); return; }
      formData.set('cpt_id', cptId);
    }
    setError(null);
    startTransition(async () => {
      const result = await createPage(formData);
      if (result.ok) {
        setName('');
        setSlug('');
        setSlugManuallyEdited(false);
        setType('page');
        setCptId('');
        setShowForm(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">

      {/* Existing pages — hierarchical site tree */}
      {pages.length > 0 && (
        <SiteTree pages={pages} projectSlug={projectSlug} />
      )}

      {/* Add page button / form */}
      {!showForm ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowForm(true)}
          className="w-full justify-center border-dashed py-6"
        >
          <Plus className="ms-1 h-4 w-4" />
          הוסיפו עמוד
        </Button>
      ) : (
        <form
          action={handleSubmit}
          className="space-y-4 rounded-md border border-border bg-muted/30 p-4"
        >
          <input type="hidden" name="project_id"   value={projectId} />
          <input type="hidden" name="project_slug" value={projectSlug} />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="page_name_he">
                שם העמוד <span className="text-accent">*</span>
              </Label>
              <Input
                id="page_name_he"
                name="name_he"
                value={name}
                onChange={onNameChange}
                placeholder="לדוגמה: עמוד הבית"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="page_slug">
                Slug <span className="text-accent">*</span>
              </Label>
              <Input
                id="page_slug"
                value={slug}
                onChange={e => { setSlugManuallyEdited(true); setSlug(slugify(e.target.value)); }}
                dir="ltr"
                className="font-mono text-start"
                placeholder="home"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>סוג עמוד</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TYPE_LABELS) as PageType[]).map(t => {
                const Icon = TYPE_ICONS[t];
                const selected = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                      selected
                        ? 'border-brand bg-brand/5 text-brand'
                        : 'border-border bg-background text-muted-fg hover:border-brand/40'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {needsCpt && (
            <div className="space-y-2">
              <Label htmlFor="page_cpt_id">
                CPT מקושר <span className="text-accent">*</span>
              </Label>
              {cpts.length === 0 ? (
                <p className="text-sm text-muted-fg">
                  אין CPTs מוגדרים בפרויקט. <a href={`/projects/${projectSlug}/cpts`} className="text-brand underline">הוסיפו CPT</a> תחילה.
                </p>
              ) : (
                <select
                  id="page_cpt_id"
                  value={cptId}
                  onChange={e => setCptId(e.target.value)}
                  className="block h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  required
                >
                  <option value="">— בחרו CPT —</option>
                  {cpts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name_he ?? c.name_en ?? c.slug} ({c.slug})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setShowForm(false); setError(null); }}
            >
              ביטול
            </Button>
            <Button type="submit" variant="accent" disabled={isPending || !name}>
              {isPending ? 'מוסיף...' : 'הוסיפו עמוד'}
            </Button>
          </div>
        </form>
      )}

    </div>
  );
}

// ─── Site tree (recursive, nested by parent_id) ────────────────────────────

function SiteTree({ pages, projectSlug }: { pages: PageRow[]; projectSlug: string }) {
  // Bucket children by parent_id
  const childrenByParent = new Map<string | null, PageRow[]>();
  for (const p of pages) {
    const key = p.parent_id ?? null;
    const list = childrenByParent.get(key) ?? [];
    list.push(p);
    childrenByParent.set(key, list);
  }
  const roots = childrenByParent.get(null) ?? [];

  return <ul className="space-y-2">{roots.map(p => <TreeNode key={p.id} page={p} all={childrenByParent} projectSlug={projectSlug} depth={0} />)}</ul>;
}

function TreeNode({
  page, all, projectSlug, depth,
}: {
  page: PageRow;
  all: Map<string | null, PageRow[]>;
  projectSlug: string;
  depth: number;
}) {
  const Icon = TYPE_ICONS[page.type];
  const children = all.get(page.id) ?? [];

  return (
    <li>
      <Link
        href={`/projects/${projectSlug}/${page.slug}`}
        style={depth > 0 ? { marginInlineStart: `${depth * 16}px` } : undefined}
        className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-4 py-3 transition-colors hover:border-brand hover:bg-brand/5"
      >
        <div className="flex min-w-0 items-center gap-3">
          {depth > 0 && <span className="text-muted-fg">↳</span>}
          <Icon className="h-4 w-4 shrink-0 text-muted-fg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{page.name_he ?? page.slug}</p>
            <p className="truncate text-xs text-muted-fg">
              <code className="rounded bg-muted px-1.5 py-0.5">/{page.slug}</code>
              <span className="mx-2">·</span>
              {TYPE_LABELS[page.type]}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_PILLS[page.status]}`}>
            {STATUS_LABELS[page.status]}
          </span>
          <ChevronLeft className="h-4 w-4 text-muted-fg rtl:rotate-180" />
        </div>
      </Link>
      {children.length > 0 && (
        <ul className="mt-2 space-y-2">
          {children.map(c => <TreeNode key={c.id} page={c} all={all} projectSlug={projectSlug} depth={depth + 1} />)}
        </ul>
      )}
    </li>
  );
}

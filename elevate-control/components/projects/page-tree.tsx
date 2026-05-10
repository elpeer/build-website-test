'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createPage, reorderAndReparentPages,
  setPagePreviewUrlOverride, setPageCmsUrlOverride, setPageDevStatus,
  type PageDevStatus,
} from '@/app/actions/pages';
import { slugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchInput } from '@/components/ui/search-input';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, FileText, Layers, Folder, AlertTriangle, Settings, AlertCircle, ChevronLeft,
  GripVertical, IndentIncrease, IndentDecrease, ExternalLink, CheckCircle2, X, Edit2,
} from 'lucide-react';
import type { PageStatus, PageType } from '@/lib/supabase/database.types';

interface PageRow {
  id: string;
  slug: string;
  name_he: string | null;
  type: PageType;
  status: PageStatus;
  dev_status?: PageDevStatus;
  order: number;
  parent_id?: string | null;
  preview_url_override?: string | null;
  cms_url_override?: string | null;
}

const DEV_STATUS_LABELS: Record<PageDevStatus, string> = {
  awaiting_dev:        'ממתין לפיתוח',
  in_dev:              'בפיתוח',
  awaiting_pm:         'ממתין לבדיקת מנהל',
  pm_approved:         'מאושר ע״י מנהל',
  client_visible:      'מאושר לצפיית לקוח פרונט',
  client_visible_full: 'מאושר לצפיית לקוח ניהול',
};

const DEV_STATUS_PILLS: Record<PageDevStatus, string> = {
  awaiting_dev:        'bg-zinc-50 text-zinc-600 border-zinc-200',
  in_dev:              'bg-amber-50 text-amber-800 border-amber-200',
  awaiting_pm:         'bg-blue-50 text-blue-700 border-blue-200',
  pm_approved:         'bg-purple-50 text-purple-700 border-purple-200',
  client_visible:      'bg-green-50 text-green-700 border-green-200',
  client_visible_full: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

export interface PreviewInfo {
  status: 'found' | 'missing';
  previewUrl: string | null;
}

const TYPE_ICONS: Record<PageType, React.ComponentType<{ className?: string }>> = {
  page: FileText, archive: Folder, single: Layers, system: AlertTriangle, service: Settings,
};

const STATUS_LABELS: Record<PageStatus, string> = {
  planned: 'מתוכנן', designed: 'עוצב', sectioned: 'סקשנים', in_dev: 'פיתוח',
  built: 'נבנה', reviewed: 'נסקר', live: 'באוויר',
};

const STATUS_PILLS: Record<PageStatus, string> = {
  planned: 'bg-zinc-100 text-zinc-700',
  designed: 'bg-blue-50 text-blue-700',
  sectioned: 'bg-indigo-50 text-indigo-700',
  in_dev: 'bg-amber-50 text-amber-800',
  built: 'bg-purple-50 text-purple-700',
  reviewed: 'bg-teal-50 text-teal-700',
  live: 'bg-green-50 text-green-700',
};

interface Props {
  projectId: string;
  projectSlug: string;
  pages: PageRow[];
  /** Map<pageId, PreviewInfo> — populated server-side from GitHub/Vercel. */
  previews?: Record<string, PreviewInfo>;
  /** Base URL used to derive CMS link as `${cmsBaseUrl}/${page.slug}`
   *  when no manual override is set on the row. */
  cmsBaseUrl?: string | null;
}

export function PageTree({ projectId, projectSlug, pages, previews = {}, cmsBaseUrl = null }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(pages.length === 0);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [type, setType] = useState<PageType>('page');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [reorderError, setReorderError] = useState<string | null>(null);

  // Optimistic mirror of pages — drag/indent updates this immediately.
  const [tree, setTree] = useState(pages);
  useEffect(() => { setTree(pages); }, [pages]);

  const hasFilter = query.trim().length > 0;
  const filtered = useMemo(() => {
    if (!hasFilter) return tree;
    const q = query.trim().toLowerCase();
    return tree.filter(p =>
      (p.name_he ?? '').toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
    );
  }, [tree, query, hasFilter]);

  /** Render order = depth-first traversal of tree, returning {page, depth}.
   *  Used by both the visual list and the sortable context. */
  const flatRender = useMemo(() => {
    const childrenByParent = new Map<string | null, PageRow[]>();
    filtered.forEach(p => {
      const k = p.parent_id ?? null;
      const arr = childrenByParent.get(k) ?? [];
      arr.push(p);
      childrenByParent.set(k, arr);
    });
    childrenByParent.forEach(arr => arr.sort((a, b) => a.order - b.order));

    const out: Array<{ page: PageRow; depth: number }> = [];
    const walk = (parentId: string | null, depth: number) => {
      (childrenByParent.get(parentId) ?? []).forEach(p => {
        out.push({ page: p, depth });
        walk(p.id, depth + 1);
      });
    };
    walk(null, 0);

    // When filter is active and only deeper pages match, ancestors aren't
    // in the filtered set — we still render those matches as a flat list
    // (depth 0) so search results don't get hidden under invisible parents.
    if (hasFilter) {
      const visibleIds = new Set(filtered.map(p => p.id));
      const renderedIds = new Set(out.map(r => r.page.id));
      filtered.filter(p => !renderedIds.has(p.id) && visibleIds.has(p.id))
        .forEach(p => out.push({ page: p, depth: 0 }));
    }
    return out;
  }, [filtered, hasFilter]);

  function commitTree(nextTree: PageRow[], updates: Array<{ id: string; parent_id: string | null; order: number }>) {
    setTree(nextTree);
    startTransition(async () => {
      const r = await reorderAndReparentPages(projectSlug, updates);
      if (!r.ok) {
        setReorderError(`שינוי עץ נכשל: ${r.error}`);
        setTree(pages);
        return;
      }
      setReorderError(null);
      router.refresh();
    });
  }

  /** Recompute the whole tree's order/parent fields based on the current
   *  flatRender + given mutations on a specific page. Returns the next
   *  tree array + the list of updates to send to the server. */
  function rebuildAfter(mutator: (siblings: Map<string | null, PageRow[]>) => void) {
    const childrenByParent = new Map<string | null, PageRow[]>();
    tree.forEach(p => {
      const k = p.parent_id ?? null;
      const arr = childrenByParent.get(k) ?? [];
      arr.push(p);
      childrenByParent.set(k, arr);
    });
    childrenByParent.forEach(arr => arr.sort((a, b) => a.order - b.order));

    mutator(childrenByParent);

    const nextTree: PageRow[] = [];
    const updates: Array<{ id: string; parent_id: string | null; order: number }> = [];
    childrenByParent.forEach((arr, parentKey) => {
      arr.forEach((p, i) => {
        const newOrder = (i + 1) * 10;
        const newParent = parentKey;
        const changed = p.order !== newOrder || (p.parent_id ?? null) !== newParent;
        const next = changed ? { ...p, order: newOrder, parent_id: newParent } : p;
        nextTree.push(next);
        if (changed) updates.push({ id: p.id, parent_id: newParent, order: newOrder });
      });
    });
    return { nextTree, updates };
  }

  function handleReorder(activeId: string, overId: string) {
    if (activeId === overId) return;
    const { nextTree, updates } = rebuildAfter((siblings) => {
      // Find which bucket the active belongs to and move it next to over (if same bucket).
      // If over is in a different bucket — do nothing (user must use indent/outdent).
      let activeBucket: PageRow[] | undefined;
      let activeKey: string | null = null;
      siblings.forEach((arr, key) => {
        if (arr.find(p => p.id === activeId)) { activeBucket = arr; activeKey = key; }
      });
      if (!activeBucket) return;
      const overInBucket = activeBucket.findIndex(p => p.id === overId);
      const fromIdx = activeBucket.findIndex(p => p.id === activeId);
      if (overInBucket < 0) return;
      const moved = arrayMove(activeBucket, fromIdx, overInBucket);
      siblings.set(activeKey, moved);
    });
    if (updates.length > 0) commitTree(nextTree, updates);
  }

  function handleIndent(pageId: string) {
    // Make this page a child of its previous sibling.
    const { nextTree, updates } = rebuildAfter((siblings) => {
      siblings.forEach((arr, key) => {
        const idx = arr.findIndex(p => p.id === pageId);
        if (idx <= 0) return;
        const newParent = arr[idx - 1].id;
        const me = arr.splice(idx, 1)[0];
        const targetBucket = siblings.get(newParent) ?? [];
        targetBucket.push({ ...me, parent_id: newParent });
        siblings.set(newParent, targetBucket);
        siblings.set(key, arr);
      });
    });
    if (updates.length > 0) commitTree(nextTree, updates);
  }

  function handleOutdent(pageId: string) {
    // Move this page out one level — sibling of its current parent.
    const me = tree.find(p => p.id === pageId);
    if (!me?.parent_id) return; // already at root
    const parent = tree.find(p => p.id === me.parent_id);
    const grandParentId: string | null = parent?.parent_id ?? null;

    const { nextTree, updates } = rebuildAfter((siblings) => {
      // remove from current bucket
      const fromKey = me.parent_id as string;
      const fromArr = siblings.get(fromKey) ?? [];
      const removed = fromArr.filter(p => p.id !== pageId);
      siblings.set(fromKey, removed);
      // add to grandparent bucket right after current parent
      const gpArr = siblings.get(grandParentId) ?? [];
      const parentIdx = gpArr.findIndex(p => p.id === me.parent_id);
      const insertAt = parentIdx >= 0 ? parentIdx + 1 : gpArr.length;
      gpArr.splice(insertAt, 0, { ...me, parent_id: grandParentId });
      siblings.set(grandParentId, gpArr);
    });
    if (updates.length > 0) commitTree(nextTree, updates);
  }

  function onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setName(value);
    if (!slugManuallyEdited) setSlug(slugify(value));
  }

  function handleSubmit(formData: FormData) {
    formData.set('slug', slug);
    formData.set('type', type);
    setError(null);
    startTransition(async () => {
      const result = await createPage(formData);
      if (result.ok) {
        setName(''); setSlug(''); setSlugManuallyEdited(false);
        setType('page'); setShowForm(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      {reorderError && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          <span className="flex-1">{reorderError}</span>
          <button type="button" onClick={() => setReorderError(null)}
                  className="text-red-700 hover:text-red-900">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {tree.length > 3 && (
        <SearchInput value={query} onChange={setQuery}
                     placeholder={`חיפוש בעמודים... (${tree.length})`} />
      )}

      {flatRender.length > 0 ? (
        <SortableTreeList
          items={flatRender}
          previews={previews}
          cmsBaseUrl={cmsBaseUrl}
          projectSlug={projectSlug}
          onReorder={handleReorder}
          onIndent={handleIndent}
          onOutdent={handleOutdent}
          isPending={isPending}
          dragDisabled={hasFilter}
        />
      ) : tree.length > 0 ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-fg">
          לא נמצאו עמודים תואמים ל-&quot;{query}&quot;.
        </div>
      ) : null}

      {!showForm ? (
        <Button type="button" variant="outline"
                onClick={() => setShowForm(true)}
                className="w-full justify-center border-dashed py-4">
          <Plus className="ms-1 h-4 w-4" />
          הוסיפו עמוד
        </Button>
      ) : (
        <form action={handleSubmit}
              className="space-y-4 rounded-md border border-border bg-muted/30 p-4">
          <input type="hidden" name="project_id"   value={projectId} />
          <input type="hidden" name="project_slug" value={projectSlug} />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="page_name_he">שם העמוד <span className="text-accent">*</span></Label>
              <Input id="page_name_he" name="name_he" value={name} onChange={onNameChange}
                     placeholder="לדוגמה: עמוד הבית" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="page_slug">Slug <span className="text-accent">*</span></Label>
              <Input id="page_slug" value={slug}
                     onChange={e => { setSlugManuallyEdited(true); setSlug(slugify(e.target.value)); }}
                     dir="ltr" className="font-mono text-start" placeholder="home" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>סוג עמוד</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TYPE_ICONS) as PageType[]).map(t => {
                const Icon = TYPE_ICONS[t];
                const selected = type === t;
                const labels: Record<PageType, string> = {
                  page: 'עמוד רגיל', archive: 'ארכיון CPT', single: 'עמוד פנימי CPT',
                  system: 'עמוד מערכת', service: 'עמוד שירות',
                };
                return (
                  <button key={t} type="button" onClick={() => setType(t)}
                          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                            selected
                              ? 'border-brand bg-brand/5 text-brand'
                              : 'border-border bg-background text-muted-fg hover:border-brand/40'
                          }`}>
                    <Icon className="h-3.5 w-3.5" />
                    {labels[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost"
                    onClick={() => { setShowForm(false); setError(null); }}>
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

// ─── Sortable flat tree (depth shown via indent) ──────────────────────────

function SortableTreeList({
  items, previews, cmsBaseUrl, projectSlug, onReorder, onIndent, onOutdent, isPending, dragDisabled,
}: {
  items: Array<{ page: PageRow; depth: number }>;
  previews: Record<string, PreviewInfo>;
  cmsBaseUrl: string | null;
  projectSlug: string;
  onReorder: (activeId: string, overId: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  isPending: boolean;
  dragDisabled: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    onReorder(String(active.id), String(over.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i.page.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-1">
          {items.map(({ page, depth }) => {
            const previewKey = page.id;
            const preview = previews[previewKey];
            const canOutdent = !!page.parent_id;
            // canIndent only if there's a previous sibling at same depth.
            const myIdx = items.findIndex(i => i.page.id === page.id);
            const prevAtSameDepth = items[myIdx - 1]?.depth === depth && items[myIdx - 1]?.page.parent_id === (page.parent_id ?? null);
            return (
              <SortableTreeRow
                key={page.id}
                page={page}
                depth={depth}
                preview={preview}
                cmsBaseUrl={cmsBaseUrl}
                projectSlug={projectSlug}
                canIndent={!!prevAtSameDepth}
                canOutdent={canOutdent}
                onIndent={() => onIndent(page.id)}
                onOutdent={() => onOutdent(page.id)}
                isPending={isPending}
                dragDisabled={dragDisabled}
              />
            );
          })}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableTreeRow({
  page, depth, preview, cmsBaseUrl, projectSlug, canIndent, canOutdent,
  onIndent, onOutdent, isPending, dragDisabled,
}: {
  page: PageRow;
  depth: number;
  preview?: PreviewInfo;
  cmsBaseUrl: string | null;
  projectSlug: string;
  canIndent: boolean;
  canOutdent: boolean;
  onIndent: () => void;
  onOutdent: () => void;
  isPending: boolean;
  dragDisabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id, disabled: dragDisabled,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  const Icon = TYPE_ICONS[page.type];

  return (
    <li ref={setNodeRef} style={style}>
      <div className="flex items-center gap-1.5 rounded-md border border-border bg-background ps-1 pe-2 py-1.5 hover:border-brand/40"
           style={{ marginInlineStart: `${depth * 20}px` }}>

        {!dragDisabled ? (
          <button type="button" {...attributes} {...listeners}
                  className="cursor-grab touch-none rounded p-1 text-muted-fg hover:bg-muted hover:text-brand active:cursor-grabbing"
                  aria-label="גרור לשינוי סדר">
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span className="inline-block w-5" />
        )}

        <button type="button" onClick={onOutdent} disabled={!canOutdent || isPending}
                className="rounded p-1 text-muted-fg hover:bg-muted hover:text-brand disabled:opacity-25"
                aria-label="הוצא מההיררכיה">
          <IndentDecrease className="h-3.5 w-3.5 rtl:scale-x-[-1]" />
        </button>
        <button type="button" onClick={onIndent} disabled={!canIndent || isPending}
                className="rounded p-1 text-muted-fg hover:bg-muted hover:text-brand disabled:opacity-25"
                aria-label="הזח (הפוך לבן של הקודם)">
          <IndentIncrease className="h-3.5 w-3.5 rtl:scale-x-[-1]" />
        </button>

        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-fg" />

        <Link href={`/projects/${projectSlug}/${page.slug}`}
              className="min-w-0 flex-1 hover:text-brand">
          <span className="truncate text-sm font-medium">{page.name_he ?? page.slug}</span>
          <span className="ms-2 text-[11px] text-muted-fg" dir="ltr">/{page.slug}</span>
        </Link>

        <LinkInput
          page={page}
          kind="frontend"
          autoUrl={preview?.previewUrl ?? null}
          autoStatus={preview?.status ?? null}
          projectSlug={projectSlug}
        />
        <LinkInput
          page={page}
          kind="cms"
          autoUrl={cmsBaseUrl && page.slug ? `${cmsBaseUrl}/${page.slug}` : null}
          autoStatus={null}
          projectSlug={projectSlug}
        />

        <DevStatusPicker page={page} projectSlug={projectSlug} />

        <Link href={`/projects/${projectSlug}/${page.slug}`}
              className="shrink-0 rounded p-1 text-muted-fg hover:bg-muted hover:text-brand"
              aria-label="פתח עמוד">
          <ChevronLeft className="h-3.5 w-3.5" />
        </Link>
      </div>
    </li>
  );
}

/** Inline link field — works for both 'frontend' and 'cms' kinds. The
 *  pill shows the resolved URL (override > auto), the pencil toggles
 *  paste-edit mode without leaving the tree, and the resolved URL is
 *  always clickable with target=_blank. */
function LinkInput({
  page, kind, autoUrl, autoStatus, projectSlug,
}: {
  page: PageRow;
  kind: 'frontend' | 'cms';
  autoUrl: string | null;
  autoStatus: 'found' | 'missing' | null;
  projectSlug: string;
}) {
  const router = useRouter();
  const override = (kind === 'frontend' ? page.preview_url_override : page.cms_url_override) ?? '';
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(override);
  const [, startTransition] = useTransition();

  const resolved = override || autoUrl;
  const isFrontend = kind === 'frontend';
  const label = isFrontend ? 'פרונט' : 'ניהול';
  const colorClass = isFrontend
    ? 'bg-green-50 text-green-700 hover:bg-green-100'
    : 'bg-purple-50 text-purple-700 hover:bg-purple-100';

  async function persist(next: string | null) {
    return isFrontend
      ? setPagePreviewUrlOverride(page.id, projectSlug, next)
      : setPageCmsUrlOverride(page.id, projectSlug, next);
  }

  function save() {
    startTransition(async () => {
      await persist(value || null);
      setEditing(false);
      router.refresh();
    });
  }
  function clear() {
    startTransition(async () => {
      await persist(null);
      setValue('');
      setEditing(false);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-[11px] font-semibold text-muted-fg">{label}:</span>
        <input value={value} dir="ltr" autoFocus
               onChange={e => setValue(e.target.value)}
               onKeyDown={e => {
                 if (e.key === 'Enter') save();
                 if (e.key === 'Escape') { setValue(override); setEditing(false); }
               }}
               placeholder="https://..."
               className="h-7 w-48 rounded border border-border bg-background px-2 text-xs font-mono" />
        <button type="button" onClick={save}
                className="rounded p-1 text-green-600 hover:bg-green-50" aria-label="שמור">
          <CheckCircle2 className="h-3.5 w-3.5" />
        </button>
        {override && (
          <button type="button" onClick={clear}
                  className="rounded p-1 text-red-600 hover:bg-red-50" aria-label="נקה override">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button type="button" onClick={() => { setValue(override); setEditing(false); }}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-100" aria-label="ביטול">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {resolved ? (
        <a href={resolved} target="_blank" rel="noopener noreferrer"
           className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${colorClass}`}
           title={`פתח (${label}): ${resolved}${override ? ' · ידני' : (autoUrl ? ' · אוטומטי' : '')}`}>
          {label}
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : isFrontend && autoStatus === 'missing' ? (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800"
              title="לא נמצא קובץ HTML תואם ב-GitHub">
          {label}
          <AlertTriangle className="h-3 w-3" />
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500"
              title={`לא הוגדר לינק ${label}`}>
          {label}
        </span>
      )}
      <button type="button" onClick={() => setEditing(true)}
              className="rounded p-1 text-muted-fg hover:bg-muted hover:text-brand"
              aria-label={`ערוך לינק ${label}`}
              title={`הדבק לינק ${label}`}>
        <Edit2 className="h-3 w-3" />
      </button>
    </div>
  );
}

/** Inline dev_status dropdown — colored pill that the studio can flip
 *  without entering the page. 'client_visible' exposes the page on
 *  the client's frontend tab; 'client_visible_full' also exposes it
 *  on the CMS tab. */
function DevStatusPicker({ page, projectSlug }: { page: PageRow; projectSlug: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const current: PageDevStatus = page.dev_status ?? 'awaiting_dev';
  const visible = current === 'client_visible' || current === 'client_visible_full';

  function setStatus(next: PageDevStatus) {
    if (next === current) return;
    startTransition(async () => {
      await setPageDevStatus(page.id, projectSlug, next);
      router.refresh();
    });
  }

  return (
    <select value={current}
            onChange={e => setStatus(e.target.value as PageDevStatus)}
            title={visible ? 'גלוי ללקוח בפיתוח' : 'לא גלוי ללקוח עדיין'}
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium focus:outline-none ${DEV_STATUS_PILLS[current]}`}>
      {(Object.keys(DEV_STATUS_LABELS) as PageDevStatus[]).map(s => (
        <option key={s} value={s}>{DEV_STATUS_LABELS[s]}</option>
      ))}
    </select>
  );
}

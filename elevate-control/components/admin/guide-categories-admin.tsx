'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createGuideCategory, updateGuideCategory, deleteGuideCategory,
} from '@/app/actions/guides';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Trash2, Save, X, Tag } from 'lucide-react';

export interface CategoryRow {
  id: string;
  slug: string;
  label: string;
  position: number;
  guide_count?: number;
}

interface Props { categories: CategoryRow[] }

/** Studio-only inline manager for guide categories. Lives next to the
 *  guides list on the admin page. */
export function GuideCategoriesAdmin({ categories }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newSlug,  setNewSlug]  = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleCreate() {
    if (!newLabel.trim()) return;
    setError(null);
    startTransition(async () => {
      const r = await createGuideCategory({
        label: newLabel,
        slug:  newSlug || newLabel,
        position: (categories.at(-1)?.position ?? 0) + 10,
      });
      if (r.ok) { setNewLabel(''); setNewSlug(''); setAdding(false); router.refresh(); }
      else { setError(r.error); }
    });
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-1.5">
        {categories.map(c => (
          <CategoryRowItem key={c.id} cat={c}
                           editing={editingId === c.id}
                           onEdit={() => setEditingId(c.id)}
                           onCancel={() => setEditingId(null)}
                           onSaved={() => { setEditingId(null); router.refresh(); }} />
        ))}
        {categories.length === 0 && (
          <li className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-fg">
            עדיין לא הוגדרו קטגוריות.
          </li>
        )}
      </ul>

      {adding ? (
        <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
          <div className="grid gap-2 md:grid-cols-2">
            <Input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                   placeholder="שם קטגוריה (למשל: שיווק)" />
            <Input value={newSlug} dir="ltr" className="font-mono text-sm"
                   onChange={e => setNewSlug(e.target.value)}
                   placeholder="slug (אופציונלי, יווצר מהשם)" />
          </div>
          {error && <p className="text-xs text-red-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm"
                    onClick={() => { setAdding(false); setError(null); setNewLabel(''); setNewSlug(''); }}>
              <X className="ms-1 h-3.5 w-3.5" />
              ביטול
            </Button>
            <Button type="button" variant="accent" size="sm"
                    onClick={handleCreate} disabled={!newLabel.trim()}>
              <Save className="ms-1 h-3.5 w-3.5" />
              צור
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm"
                onClick={() => setAdding(true)}
                className="w-full justify-center border-dashed">
          <Plus className="ms-1 h-3.5 w-3.5" />
          הוסיפו קטגוריה
        </Button>
      )}
    </div>
  );
}

function CategoryRowItem({
  cat, editing, onEdit, onCancel, onSaved,
}: {
  cat: CategoryRow;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(cat.label);
  const [slug,  setSlug]  = useState(cat.slug);
  const [, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await updateGuideCategory(cat.id, { label, slug });
      onSaved();
    });
  }
  function handleDelete() {
    const inUse = (cat.guide_count ?? 0) > 0;
    const msg = inUse
      ? `הקטגוריה משויכת ל-${cat.guide_count} מדריכים. בעת מחיקה הם יישארו ללא קטגוריה. למחוק?`
      : `למחוק את "${cat.label}"?`;
    if (!confirm(msg)) return;
    startTransition(async () => {
      await deleteGuideCategory(cat.id);
      onSaved();
    });
  }

  if (editing) {
    return (
      <li className="flex items-center gap-2 rounded-md border border-brand bg-brand/5 p-2">
        <Tag className="h-4 w-4 shrink-0 text-brand" />
        <Input value={label} className="h-8 flex-1 text-sm"
               onChange={e => setLabel(e.target.value)} />
        <Input value={slug} dir="ltr" className="h-8 w-32 font-mono text-xs"
               onChange={e => setSlug(e.target.value)} />
        <button type="button" onClick={save}
                className="rounded p-1 text-green-600 hover:bg-green-50" aria-label="שמור">
          <Save className="h-4 w-4" />
        </button>
        <button type="button"
                onClick={() => { setLabel(cat.label); setSlug(cat.slug); onCancel(); }}
                className="rounded p-1 text-zinc-600 hover:bg-zinc-100" aria-label="ביטול">
          <X className="h-4 w-4" />
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 rounded-md border border-border bg-background p-2">
      <Tag className="h-4 w-4 shrink-0 text-muted-fg" />
      <span className="flex-1 text-sm font-medium">{cat.label}</span>
      <code dir="ltr" className="text-xs text-muted-fg">{cat.slug}</code>
      {cat.guide_count !== undefined && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-fg">
          {cat.guide_count} מדריכים
        </span>
      )}
      <button type="button" onClick={onEdit}
              className="rounded p-1 text-muted-fg hover:text-brand" aria-label="ערוך">
        <Edit2 className="h-4 w-4" />
      </button>
      <button type="button" onClick={handleDelete}
              className="rounded p-1 text-red-600 hover:bg-red-50" aria-label="מחק">
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

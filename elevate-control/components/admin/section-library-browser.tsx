'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateSectionDefinition, deleteSectionDefinition,
} from '@/app/actions/section-definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchInput } from '@/components/ui/search-input';
import {
  Database, Edit2, Trash2, Save, X, AlertCircle,
} from 'lucide-react';

export interface DefinitionRow {
  id: string;
  slug: string;
  name_he: string | null;
  name_en: string | null;
  description: string | null;
  category: string | null;
  kind: string | null;
  recipe_id: string | null;
  cpt_driven: boolean;
  cpt_slug: string | null;
  is_global: boolean;
  preview_url: string | null;
  content_schema: unknown;
}

const KIND_LABELS: Record<string, string> = {
  hero: 'Hero', content: 'Content', cta: 'CTA', feature: 'Feature',
  cpt_grid: 'CPT Grid', testimonial: 'Testimonial', gallery: 'Gallery',
  form: 'Form', faq: 'FAQ', process: 'Process', partners: 'Partners',
  image_separator: 'Image Separator', other: 'Other',
};

const CONTEXT_FILTERS = [
  { id: 'all',      label: 'הכל',           match: () => true },
  { id: 'page',     label: 'עמוד רגיל',      match: (d: DefinitionRow) => !d.cpt_driven },
  { id: 'cpt',      label: 'CPT',           match: (d: DefinitionRow) => d.cpt_driven },
];

interface Props {
  definitions: DefinitionRow[];
  canEdit: boolean;
}

export function SectionLibraryBrowser({ definitions, canEdit }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery]         = useState('');
  const [kindFilter, setKindFilter]       = useState<string>('');
  const [contextFilter, setContextFilter] = useState<string>('all');

  // Build a chip list from the kinds that actually have definitions.
  const kindChips = useMemo(() => {
    const counts = new Map<string, number>();
    definitions.forEach(d => {
      const k = d.kind ?? 'other';
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([k, count]) => ({ k, count, label: KIND_LABELS[k] ?? k }));
  }, [definitions]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ctx = CONTEXT_FILTERS.find(c => c.id === contextFilter)!;
    return definitions.filter(d => {
      if (!ctx.match(d)) return false;
      if (kindFilter && (d.kind ?? 'other') !== kindFilter) return false;
      if (!q) return true;
      const hay = `${d.slug} ${d.name_he ?? ''} ${d.name_en ?? ''} ${d.description ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [definitions, query, kindFilter, contextFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-2">
        <SearchInput value={query} onChange={setQuery}
                     placeholder={`חיפוש ב-${definitions.length} סקשנים...`} />
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-fg">סוג:</span>
          <button type="button" onClick={() => setKindFilter('')}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    kindFilter === ''
                      ? 'bg-brand text-white font-medium'
                      : 'bg-muted text-muted-fg hover:bg-muted/80'
                  }`}>
            הכל ({definitions.length})
          </button>
          {kindChips.map(c => (
            <button key={c.k} type="button"
                    onClick={() => setKindFilter(kindFilter === c.k ? '' : c.k)}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      kindFilter === c.k
                        ? 'bg-brand text-white font-medium'
                        : 'bg-muted text-muted-fg hover:bg-muted/80'
                    }`}>
              {c.label} ({c.count})
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-fg">תוכן:</span>
          {CONTEXT_FILTERS.map(c => (
            <button key={c.id} type="button" onClick={() => setContextFilter(c.id)}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      contextFilter === c.id
                        ? 'bg-brand text-white font-medium'
                        : 'bg-muted text-muted-fg hover:bg-muted/80'
                    }`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-fg">
          לא נמצאו סקשנים תואמים לפילטר.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(d => (
            <DefinitionCard key={d.id} def={d} canEdit={canEdit}
                            isEditing={editingId === d.id}
                            onEdit={() => setEditingId(d.id)}
                            onCancel={() => setEditingId(null)}
                            onSaved={() => { setEditingId(null); router.refresh(); }} />
          ))}
        </div>
      )}
    </div>
  );
}

function DefinitionCard({
  def, canEdit, isEditing, onEdit, onCancel, onSaved,
}: {
  def: DefinitionRow;
  canEdit: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [nameHe, setNameHe]   = useState(def.name_he ?? '');
  const [nameEn, setNameEn]   = useState(def.name_en ?? '');
  const [desc, setDesc]       = useState(def.description ?? '');
  const [kind, setKind]       = useState(def.kind ?? 'other');
  const [cptDriven, setCptDriven] = useState(def.cpt_driven);
  const [cptSlug, setCptSlug] = useState(def.cpt_slug ?? '');
  const [error, setError]     = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const r = await updateSectionDefinition(def.id, {
        name_he: nameHe || null,
        name_en: nameEn || null,
        description: desc || null,
        kind: kind || null,
        cpt_driven: cptDriven,
        cpt_slug: cptDriven ? (cptSlug || null) : null,
      });
      if (!r.ok) { setError(r.error); return; }
      onSaved();
    });
  }
  function handleDelete() {
    if (!confirm(`למחוק את "${def.name_he ?? def.slug}"?`)) return;
    startTransition(async () => {
      await deleteSectionDefinition(def.id);
      onSaved();
    });
  }

  if (isEditing) {
    return (
      <article className="space-y-2 rounded-md border border-brand bg-brand/5 p-3 sm:col-span-2 lg:col-span-3">
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <Label className="text-xs">שם בעברית</Label>
            <Input value={nameHe} onChange={e => setNameHe(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">שם באנגלית</Label>
            <Input value={nameEn} dir="ltr" onChange={e => setNameEn(e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="text-xs">תיאור</Label>
          <Textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <Label className="text-xs">סוג בלוק (kind)</Label>
            <select value={kind} onChange={e => setKind(e.target.value)}
                    className="block h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
              {Object.entries(KIND_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">CPT slug (אם CPT-driven)</Label>
            <Input value={cptSlug} dir="ltr" className="font-mono"
                   onChange={e => setCptSlug(e.target.value)}
                   placeholder="attractions / products / team" disabled={!cptDriven} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={cptDriven}
                 onChange={e => setCptDriven(e.target.checked)} className="h-4 w-4" />
          <span>סקשן זה מושך תוכן מ-CPT</span>
        </label>
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="ms-1 h-3.5 w-3.5" /> ביטול
          </Button>
          <Button type="button" variant="accent" size="sm" onClick={handleSave}>
            <Save className="ms-1 h-3.5 w-3.5" /> שמור
          </Button>
        </div>
      </article>
    );
  }

  return (
    <article className="space-y-2 rounded-md border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">{def.name_he ?? def.name_en ?? def.slug}</h3>
        <div className="flex shrink-0 items-center gap-1">
          {def.cpt_driven && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
              <Database className="h-3 w-3" />
              CPT
            </span>
          )}
          {canEdit && (
            <>
              <button type="button" onClick={onEdit}
                      className="rounded p-1 text-muted-fg hover:text-brand" aria-label="ערוך">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={handleDelete}
                      className="rounded p-1 text-red-600 hover:text-red-700" aria-label="מחק">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {def.kind && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-fg">
            {KIND_LABELS[def.kind] ?? def.kind}
          </span>
        )}
        <code className="text-[11px] text-muted-fg" dir="ltr">{def.slug}</code>
      </div>
      {def.description && <p className="text-sm text-muted-fg">{def.description}</p>}
      {def.cpt_slug && (
        <p className="text-xs text-purple-700">
          טוען מ-CPT: <code dir="ltr">{def.cpt_slug}</code>
        </p>
      )}
    </article>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTaxonomy, updateTaxonomyTerms, deleteTaxonomy } from '@/app/actions/cpts';
import { slugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Tag, Trash2, X, AlertCircle, Save } from 'lucide-react';

interface TaxonomyRow {
  id: string;
  slug: string;
  name_he: string | null;
  hierarchical: boolean;
  terms: string[];
}

interface Props {
  projectId: string;
  projectSlug: string;
  cptId: string;
  cptSlug: string;
  taxonomies: TaxonomyRow[];
}

export function TaxonomyEditor({ projectId, projectSlug, cptId, cptSlug, taxonomies }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [nameHe, setNameHe] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [hierarchical, setHierarchical] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set('slug', slug);
    setError(null);
    startTransition(async () => {
      const result = await createTaxonomy(formData);
      if (result.ok) {
        setNameHe(''); setSlug(''); setSlugManual(false); setHierarchical(false);
        setShowForm(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete(taxId: string) {
    if (!confirm('למחוק את הטקסונומיה?')) return;
    startTransition(async () => {
      await deleteTaxonomy(taxId, { projectSlug, cptSlug });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {taxonomies.length > 0 && (
        <ul className="space-y-3">
          {taxonomies.map(tax => (
            <TaxonomyRowItem
              key={tax.id}
              taxonomy={tax}
              projectSlug={projectSlug}
              cptSlug={cptSlug}
              onDelete={() => handleDelete(tax.id)}
              isPending={isPending}
            />
          ))}
        </ul>
      )}

      {!showForm ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowForm(true)}
          className="w-full justify-center border-dashed py-4"
        >
          <Plus className="ms-1 h-4 w-4" />
          הוסיפו טקסונומיה
        </Button>
      ) : (
        <form action={handleSubmit} className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
          <input type="hidden" name="project_id"   value={projectId} />
          <input type="hidden" name="project_slug" value={projectSlug} />
          <input type="hidden" name="cpt_id"       value={cptId} />
          <input type="hidden" name="cpt_slug"     value={cptSlug} />

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tax_name">שם הטקסונומיה <span className="text-accent">*</span></Label>
              <Input
                id="tax_name"
                name="name_he"
                value={nameHe}
                onChange={e => {
                  setNameHe(e.target.value);
                  if (!slugManual) setSlug(slugify(e.target.value));
                }}
                placeholder="קטגוריות אטרקציה"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tax_slug">Slug</Label>
              <Input
                id="tax_slug"
                value={slug}
                onChange={e => { setSlugManual(true); setSlug(slugify(e.target.value)); }}
                dir="ltr"
                className="font-mono text-start"
                placeholder="attraction-category"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="hierarchical"
              checked={hierarchical}
              onChange={e => setHierarchical(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <span>היררכי (כמו קטגוריות, לא תגיות)</span>
          </label>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setError(null); }}>
              ביטול
            </Button>
            <Button type="submit" variant="accent" size="sm" disabled={isPending || !nameHe}>
              {isPending ? 'מוסיף...' : 'הוסף'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function TaxonomyRowItem({
  taxonomy, projectSlug, cptSlug, onDelete, isPending,
}: {
  taxonomy: TaxonomyRow;
  projectSlug: string;
  cptSlug: string;
  onDelete: () => void;
  isPending: boolean;
}) {
  const router = useRouter();
  const [terms, setTerms] = useState<string[]>(taxonomy.terms);
  const [draft, setDraft] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, startSaving] = useTransition();

  function addTerm() {
    const t = draft.trim();
    if (!t || terms.includes(t)) return;
    setTerms([...terms, t]);
    setDraft('');
    setDirty(true);
  }

  function removeTerm(t: string) {
    setTerms(terms.filter(x => x !== t));
    setDirty(true);
  }

  function save() {
    startSaving(async () => {
      await updateTaxonomyTerms(taxonomy.id, { projectSlug, cptSlug }, terms);
      setDirty(false);
      router.refresh();
    });
  }

  return (
    <li className="rounded-md border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-fg" />
            <p className="font-medium">{taxonomy.name_he ?? taxonomy.slug}</p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-fg">
              {taxonomy.hierarchical ? 'היררכי' : 'שטוח'}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-fg">
            <code className="rounded bg-muted px-1.5 py-0.5" dir="ltr">{taxonomy.slug}</code>
            <span className="mx-2">·</span>
            {terms.length} ערכים
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={isPending}
          className="text-red-600 hover:text-red-700 disabled:opacity-30"
          aria-label="מחק"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 space-y-2 border-t border-border pt-3">
        {terms.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {terms.map(t => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs text-brand">
                {t}
                <button type="button" onClick={() => removeTerm(t)} className="hover:text-red-600" aria-label={`הסר ${t}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTerm(); } }}
            placeholder="הוסף ערך ולחץ Enter"
            className="flex-1"
          />
          <Button type="button" variant="outline" size="sm" onClick={addTerm} disabled={!draft.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
          {dirty && (
            <Button type="button" variant="accent" size="sm" onClick={save} disabled={saving}>
              <Save className="ms-1 h-4 w-4" />
              {saving ? '...' : 'שמור'}
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

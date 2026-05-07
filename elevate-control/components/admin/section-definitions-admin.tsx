'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createSectionDefinition, updateSectionDefinition, deleteSectionDefinition,
} from '@/app/actions/section-definitions';
import { slugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit2, Save, X, AlertCircle, Database } from 'lucide-react';

interface DefinitionRow {
  id: string;
  slug: string;
  name_he: string | null;
  name_en: string | null;
  description: string | null;
  category: string | null;
  recipe_id: string | null;
  cpt_driven: boolean;
  cpt_slug: string | null;
}

interface Props { definitions: DefinitionRow[]; }

const CATEGORIES = ['hero', 'feature', 'listing', 'content', 'utility', 'social', 'cta'];

export function SectionDefinitionsAdmin({ definitions }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Create form state
  const [nameHe, setNameHe] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('content');
  const [recipeId, setRecipeId] = useState('');
  const [cptDriven, setCptDriven] = useState(false);
  const [cptSlug, setCptSlug] = useState('');

  function resetForm() {
    setNameHe(''); setNameEn(''); setSlug(''); setSlugManual(false);
    setDescription(''); setCategory('content'); setRecipeId('');
    setCptDriven(false); setCptSlug('');
  }

  function handleCreate(formData: FormData) {
    formData.set('slug', slug);
    setError(null);
    startTransition(async () => {
      const result = await createSectionDefinition(formData);
      if (result.ok) { resetForm(); setShowForm(false); router.refresh(); }
      else setError(result.error);
    });
  }

  function handleDelete(id: string, label: string) {
    if (!confirm(`למחוק את "${label}"?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteSectionDefinition(id);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      {/* Add */}
      {!showForm ? (
        <Button type="button" variant="outline" onClick={() => setShowForm(true)} className="w-full justify-center border-dashed py-6">
          <Plus className="ms-1 h-4 w-4" />
          הוסיפו סקשן חדש לקטלוג
        </Button>
      ) : (
        <form action={handleCreate} className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label className="text-xs">שם בעברית</Label>
              <Input name="name_he" value={nameHe} onChange={e => setNameHe(e.target.value)} placeholder="Hero ראשי" />
            </div>
            <div>
              <Label className="text-xs">Name (English)</Label>
              <Input name="name_en" value={nameEn} dir="ltr"
                     onChange={e => {
                       setNameEn(e.target.value);
                       if (!slugManual) setSlug(slugify(e.target.value));
                     }} placeholder="Hero Main" />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label className="text-xs">Slug</Label>
              <Input value={slug} dir="ltr" className="font-mono"
                     onChange={e => { setSlugManual(true); setSlug(slugify(e.target.value)); }}
                     placeholder="home_hero" />
            </div>
            <div>
              <Label className="text-xs">Recipe ID (אופציונלי)</Label>
              <Input name="recipe_id" value={recipeId} dir="ltr" className="font-mono"
                     onChange={e => setRecipeId(e.target.value)} placeholder="hero-default" />
            </div>
          </div>
          <div>
            <Label className="text-xs">תיאור</Label>
            <Textarea name="description" rows={2} value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="הסבר קצר על מטרת הסקשן ומתי משתמשים בו" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label className="text-xs">קטגוריה</Label>
              <select name="category" value={category} onChange={e => setCategory(e.target.value)}
                      className="block h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="cpt_driven" checked={cptDriven}
                       onChange={e => setCptDriven(e.target.checked)} className="h-4 w-4" />
                <span>טוען תוכן מ-CPT</span>
              </label>
            </div>
          </div>
          {cptDriven && (
            <div>
              <Label className="text-xs">CPT slug ברירת מחדל</Label>
              <Input name="cpt_slug" value={cptSlug} dir="ltr" className="font-mono"
                     onChange={e => setCptSlug(e.target.value)}
                     placeholder="attraction" />
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => { setShowForm(false); resetForm(); setError(null); }}>
              ביטול
            </Button>
            <Button type="submit" variant="accent" disabled={isPending || (!nameHe && !nameEn)}>
              {isPending ? 'מוסיף...' : 'הוסיפו'}
            </Button>
          </div>
        </form>
      )}

      {error && !showForm && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}

      {/* List */}
      <ul className="space-y-2">
        {definitions.map(d => (
          <DefinitionItem
            key={d.id}
            def={d}
            isEditing={editingId === d.id}
            onEdit={() => setEditingId(d.id)}
            onCancel={() => { setEditingId(null); setError(null); }}
            onDelete={() => handleDelete(d.id, d.name_he ?? d.slug)}
            onSaved={() => { setEditingId(null); router.refresh(); }}
            onError={(e) => setError(e)}
          />
        ))}
      </ul>
    </div>
  );
}

interface ItemProps {
  def: DefinitionRow;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onSaved: () => void;
  onError: (e: string) => void;
}

function DefinitionItem({ def, isEditing, onEdit, onCancel, onDelete, onSaved, onError }: ItemProps) {
  const [nameHe, setNameHe]         = useState(def.name_he ?? '');
  const [nameEn, setNameEn]         = useState(def.name_en ?? '');
  const [description, setDescription] = useState(def.description ?? '');
  const [category, setCategory]     = useState(def.category ?? 'content');
  const [recipeId, setRecipeId]     = useState(def.recipe_id ?? '');
  const [cptDriven, setCptDriven]   = useState(def.cpt_driven);
  const [cptSlug, setCptSlug]       = useState(def.cpt_slug ?? '');
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateSectionDefinition(def.id, {
        name_he: nameHe || null, name_en: nameEn || null,
        description: description || null,
        category: category || null, recipe_id: recipeId || null,
        cpt_driven: cptDriven, cpt_slug: cptDriven ? (cptSlug || null) : null,
      });
      if (result.ok) onSaved();
      else onError(result.error);
    });
  }

  if (!isEditing) {
    return (
      <li className="flex items-start justify-between gap-3 rounded-md border border-border bg-background p-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{def.name_he ?? def.name_en ?? def.slug}</p>
            {def.cpt_driven && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                <Database className="h-3 w-3" />
                CPT
              </span>
            )}
            {def.category && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-fg">{def.category}</span>
            )}
          </div>
          <p className="text-xs text-muted-fg" dir="ltr">{def.slug}</p>
          {def.description && <p className="mt-1 text-sm text-muted-fg">{def.description}</p>}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} aria-label="ערוך">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={onDelete} aria-label="מחק">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="space-y-2 rounded-md border border-brand bg-brand/5 p-3">
      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <Label className="text-xs">שם עברית</Label>
          <Input value={nameHe} onChange={e => setNameHe(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">שם אנגלית</Label>
          <Input value={nameEn} dir="ltr" onChange={e => setNameEn(e.target.value)} />
        </div>
      </div>
      <div>
        <Label className="text-xs">תיאור</Label>
        <Textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <Label className="text-xs">קטגוריה</Label>
          <select value={category} onChange={e => setCategory(e.target.value)}
                  className="block h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs">Recipe ID</Label>
          <Input value={recipeId} dir="ltr" className="font-mono" onChange={e => setRecipeId(e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={cptDriven} onChange={e => setCptDriven(e.target.checked)} className="h-4 w-4" />
        <span>CPT-driven</span>
      </label>
      {cptDriven && (
        <div>
          <Label className="text-xs">CPT slug</Label>
          <Input value={cptSlug} dir="ltr" className="font-mono" onChange={e => setCptSlug(e.target.value)} />
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          <X className="ms-1 h-3.5 w-3.5" />
          ביטול
        </Button>
        <Button type="button" variant="accent" size="sm" onClick={handleSave} disabled={isPending}>
          <Save className="ms-1 h-3.5 w-3.5" />
          {isPending ? 'שומר...' : 'שמור'}
        </Button>
      </div>
    </li>
  );
}

'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createCpt, deleteCpt } from '@/app/actions/cpts';
import { slugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Database, ChevronLeft, Trash2, AlertCircle } from 'lucide-react';

interface CptRow {
  id: string;
  slug: string;
  name_he: string | null;
  name_en: string | null;
  description: string | null;
  has_archive: boolean;
  has_single: boolean;
  taxonomy_count: number;
  page_count: number;
}

interface Props {
  projectId: string;
  projectSlug: string;
  cpts: CptRow[];
}

export function CptList({ projectId, projectSlug, cpts }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(cpts.length === 0);
  const [nameHe, setNameHe] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState('');
  const [hasArchive, setHasArchive] = useState(true);
  const [hasSingle, setHasSingle] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onNameEnChange(value: string) {
    setNameEn(value);
    if (!slugManual) setSlug(slugify(value));
  }

  function handleSubmit(formData: FormData) {
    formData.set('slug', slug);
    setError(null);
    startTransition(async () => {
      const result = await createCpt(formData);
      if (result.ok) {
        setNameHe(''); setNameEn(''); setSlug(''); setSlugManual(false);
        setDescription(''); setHasArchive(true); setHasSingle(true);
        setShowForm(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete(cptId: string, label: string) {
    if (!confirm(`למחוק את "${label}"? כל הטקסונומיות והעמודים המקושרים ייפגעו.`)) return;
    startTransition(async () => {
      const result = await deleteCpt(cptId, { projectId, projectSlug });
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      {cpts.length > 0 && (
        <ul className="space-y-2">
          {cpts.map(cpt => {
            const label = cpt.name_he ?? cpt.name_en ?? cpt.slug;
            return (
              <li key={cpt.id} className="rounded-md border border-border bg-background">
                <div className="flex items-center gap-3 p-4">
                  <Database className="h-4 w-4 shrink-0 text-muted-fg" />
                  <Link
                    href={`/projects/${projectSlug}/cpts/${cpt.slug}`}
                    className="min-w-0 flex-1 hover:text-brand"
                  >
                    <p className="truncate text-sm font-medium">{label}</p>
                    <p className="truncate text-xs text-muted-fg">
                      <code className="rounded bg-muted px-1.5 py-0.5" dir="ltr">{cpt.slug}</code>
                      <span className="mx-2">·</span>
                      {cpt.taxonomy_count} טקסונומיות
                      <span className="mx-2">·</span>
                      {cpt.page_count} עמודים
                    </p>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    {cpt.has_archive && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">archive</span>
                    )}
                    {cpt.has_single && (
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700">single</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(cpt.id, label)}
                      disabled={isPending}
                      className="text-red-600 hover:text-red-700 disabled:opacity-30"
                      aria-label="מחק"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <Link
                      href={`/projects/${projectSlug}/cpts/${cpt.slug}`}
                      className="text-muted-fg hover:text-brand"
                      aria-label="פתח"
                    >
                      <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!showForm ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowForm(true)}
          className="w-full justify-center border-dashed py-6"
        >
          <Plus className="ms-1 h-4 w-4" />
          הוסיפו CPT
        </Button>
      ) : (
        <form action={handleSubmit} className="space-y-4 rounded-md border border-border bg-muted/30 p-4">
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="project_slug" value={projectSlug} />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cpt_name_he">שם בעברית <span className="text-accent">*</span></Label>
              <Input
                id="cpt_name_he"
                name="name_he"
                value={nameHe}
                onChange={e => setNameHe(e.target.value)}
                placeholder="לדוגמה: אטרקציות"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpt_name_en">Name (English)</Label>
              <Input
                id="cpt_name_en"
                name="name_en"
                value={nameEn}
                onChange={e => onNameEnChange(e.target.value)}
                placeholder="Attractions"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpt_slug">Slug <span className="text-accent">*</span></Label>
            <Input
              id="cpt_slug"
              value={slug}
              onChange={e => { setSlugManual(true); setSlug(slugify(e.target.value)); }}
              dir="ltr"
              className="font-mono text-start"
              placeholder="attraction"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpt_description">תיאור</Label>
            <Textarea
              id="cpt_description"
              name="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="למה ה-CPT הזה משמש? (אופציונלי)"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="has_archive"
                checked={hasArchive}
                onChange={e => setHasArchive(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span>יש עמוד ארכיון</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="has_single"
                checked={hasSingle}
                onChange={e => setHasSingle(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span>יש עמוד פנימי</span>
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setError(null); }}>
              ביטול
            </Button>
            <Button type="submit" variant="accent" disabled={isPending || (!nameHe && !nameEn)}>
              {isPending ? 'מוסיף...' : 'הוסיפו CPT'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

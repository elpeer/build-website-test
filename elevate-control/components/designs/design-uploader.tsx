'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { uploadDesign } from '@/app/actions/designs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Monitor, Tablet, Smartphone, X, AlertCircle } from 'lucide-react';
import type { DesignViewport } from '@/lib/supabase/database.types';

interface PageOption {
  id: string;
  slug: string;
  name_he: string | null;
}

interface Props {
  projectId: string;
  projectSlug: string;
  pages?: PageOption[];
  defaultPageId?: string;
}

const VIEWPORTS: { value: DesignViewport; label: string; icon: typeof Monitor }[] = [
  { value: 'desktop', label: 'דסקטופ', icon: Monitor },
  { value: 'tablet',  label: 'טאבלט',  icon: Tablet },
  { value: 'mobile',  label: 'מובייל', icon: Smartphone },
];

export function DesignUploader({ projectId, projectSlug, pages = [], defaultPageId = '' }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewport, setViewport] = useState<DesignViewport>('desktop');
  const [pageId, setPageId] = useState(defaultPageId);
  const [notes, setNotes] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFile(f: File) {
    setError(null);
    setFile(f);
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
      // Auto-detect viewport from image width
      const img = new Image();
      img.onload = () => {
        if (img.width <= 600) setViewport('mobile');
        else if (img.width <= 1024) setViewport('tablet');
        else setViewport('desktop');
      };
      img.src = url;
    } else {
      setPreviewUrl(null);
    }
  }

  function reset() {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setNotes('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) { setError('בחרו קובץ קודם'); return; }

    const fd = new FormData();
    fd.set('project_id',   projectId);
    fd.set('project_slug', projectSlug);
    fd.set('viewport',     viewport);
    if (pageId) fd.set('page_id', pageId);
    if (notes)  fd.set('notes',   notes);
    fd.set('file', file);

    setError(null);
    startTransition(async () => {
      const result = await uploadDesign(fd);
      if (result.ok) {
        reset();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      onDragEnter={e => { e.preventDefault(); setDragActive(true); }}
      onDragOver={e => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
      onDrop={e => {
        e.preventDefault();
        setDragActive(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
      }}
      className="space-y-4"
    >
      <label
        htmlFor="design_file"
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 text-center transition-colors ${
          dragActive
            ? 'border-brand bg-brand/5'
            : 'border-border bg-muted/30 hover:border-brand/40'
        }`}
      >
        {previewUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="תצוגה מקדימה" className="max-h-48 rounded-md object-contain" />
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); reset(); }}
              className="absolute -top-2 -end-2 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
              aria-label="הסר"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : file ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{file.name}</span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); reset(); }}
              className="text-red-600 hover:text-red-700"
              aria-label="הסר"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-fg" />
            <p className="text-sm font-medium">גררו קובץ או לחצו כדי לבחור</p>
            <p className="text-xs text-muted-fg">PNG, JPG, WEBP, GIF, PDF · עד 50MB</p>
          </>
        )}
        <input
          ref={fileInputRef}
          id="design_file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Viewport</Label>
          <div className="flex gap-2">
            {VIEWPORTS.map(v => {
              const Icon = v.icon;
              const selected = viewport === v.value;
              return (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setViewport(v.value)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                    selected
                      ? 'border-brand bg-brand/5 text-brand'
                      : 'border-border bg-background text-muted-fg hover:border-brand/40'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>

        {pages.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="design_page">שייך לעמוד (אופציונלי)</Label>
            <select
              id="design_page"
              value={pageId}
              onChange={e => setPageId(e.target.value)}
              className="block h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">— ללא שיוך —</option>
              {pages.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name_he ?? p.slug}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="design_notes">הערות (אופציונלי)</Label>
        <Textarea
          id="design_notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="התייחסות לסקשן, גרסה, פידבק..."
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        {file && (
          <Button type="button" variant="ghost" onClick={reset}>
            ניקוי
          </Button>
        )}
        <Button type="submit" variant="accent" disabled={!file || isPending}>
          <Upload className="ms-1 h-4 w-4" />
          {isPending ? 'מעלה...' : 'העלה'}
        </Button>
      </div>
    </form>
  );
}

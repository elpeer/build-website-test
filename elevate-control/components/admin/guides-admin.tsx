'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createGuide, updateGuide, deleteGuide } from '@/app/actions/guides';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Plus, Edit2, Trash2, Eye, EyeOff, ExternalLink, Save, X, AlertCircle,
} from 'lucide-react';

interface GuideRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content_md: string;
  category: string | null;
  video_url: string | null;
  cover_url: string | null;
  published: boolean;
  position: number;
  updated_at: string;
}

interface Props { guides: GuideRow[] }

const CATEGORIES = ['general', 'wordpress', 'clickup', 'figma', 'launch'];

export function GuidesAdmin({ guides }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createGuide(formData);
      if (result.ok) { setShowCreate(false); router.refresh(); }
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      {!showCreate ? (
        <Button type="button" variant="outline"
                onClick={() => setShowCreate(true)}
                className="w-full justify-center border-dashed py-6">
          <Plus className="ms-1 h-4 w-4" />
          הוספת מדריך חדש
        </Button>
      ) : (
        <form action={handleCreate} className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label className="text-xs">כותרת</Label>
              <Input name="title" required placeholder="איך להוסיף מאמר חדש בוורדפרס" />
            </div>
            <div>
              <Label className="text-xs">Slug</Label>
              <Input name="slug" dir="ltr" className="font-mono" placeholder="add-post-wp" />
            </div>
          </div>
          <div>
            <Label className="text-xs">תיאור קצר</Label>
            <Input name="description" placeholder="מדריך קצר על מנגנון העריכה הראשי" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label className="text-xs">קטגוריה</Label>
              <select name="category" defaultValue="general"
                      className="block h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">תמונת Cover (URL)</Label>
              <Input name="cover_url" dir="ltr" className="font-mono" placeholder="https://..." />
            </div>
          </div>
          <div>
            <Label className="text-xs">לינק לוידאו (YouTube / Vimeo / Loom)</Label>
            <Input name="video_url" dir="ltr" className="font-mono" placeholder="https://www.youtube.com/watch?v=..." />
          </div>
          <div>
            <Label className="text-xs">תוכן (Markdown)</Label>
            <Textarea name="content_md" rows={10} dir="rtl"
                      placeholder={`# כותרת\n\nתיאור...\n\n## שלב 1\n...\n\n![צילום מסך](https://...)`} />
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); setError(null); }}>ביטול</Button>
            <Button type="submit" variant="accent">צור מדריך</Button>
          </div>
        </form>
      )}

      <ul className="space-y-2">
        {guides.map(g => (
          <GuideRow key={g.id} guide={g}
                    isEditing={editingId === g.id}
                    onEdit={() => setEditingId(g.id)}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => { setEditingId(null); router.refresh(); }} />
        ))}
      </ul>
    </div>
  );
}

function GuideRow({ guide, isEditing, onEdit, onCancel, onSaved }: {
  guide: GuideRow; isEditing: boolean;
  onEdit: () => void; onCancel: () => void; onSaved: () => void;
}) {
  const [title, setTitle]             = useState(guide.title);
  const [description, setDescription] = useState(guide.description ?? '');
  const [category, setCategory]       = useState(guide.category ?? 'general');
  const [videoUrl, setVideoUrl]       = useState(guide.video_url ?? '');
  const [coverUrl, setCoverUrl]       = useState(guide.cover_url ?? '');
  const [contentMd, setContentMd]     = useState(guide.content_md);
  const [published, setPublished]     = useState(guide.published);
  const [error, setError]             = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateGuide(guide.id, {
        title, description: description || null,
        category, video_url: videoUrl || null,
        cover_url: coverUrl || null,
        content_md: contentMd, published,
      });
      if (result.ok) onSaved(); else setError(result.error);
    });
  }
  function handleDelete() {
    if (!confirm(`למחוק את "${guide.title}"?`)) return;
    startTransition(async () => {
      await deleteGuide(guide.id); onSaved();
    });
  }
  function togglePublished() {
    startTransition(async () => {
      await updateGuide(guide.id, { published: !guide.published });
      onSaved();
    });
  }

  if (!isEditing) {
    return (
      <li className="flex items-start gap-3 rounded-md border border-border bg-background p-3">
        {guide.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={guide.cover_url} alt={guide.title}
               className="h-14 w-20 rounded object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{guide.title}</p>
            {guide.category && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-fg">{guide.category}</span>
            )}
            {!guide.published && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">מוסתר</span>
            )}
          </div>
          {guide.description && <p className="mt-0.5 text-sm text-muted-fg">{guide.description}</p>}
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-fg">
            <code dir="ltr">{guide.slug}</code>
            {guide.video_url && (
              <a href={guide.video_url} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1 text-brand hover:underline">
                <ExternalLink className="h-3 w-3" /> וידאו
              </a>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button type="button" onClick={togglePublished}
                  className="text-muted-fg hover:text-brand"
                  aria-label={guide.published ? 'הסתר' : 'פרסם'}>
            {guide.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button type="button" onClick={onEdit}
                  className="text-muted-fg hover:text-brand" aria-label="ערוך">
            <Edit2 className="h-4 w-4" />
          </button>
          <button type="button" onClick={handleDelete}
                  className="text-red-600 hover:text-red-700" aria-label="מחק">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="space-y-3 rounded-md border border-brand bg-brand/5 p-4">
      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <Label className="text-xs">כותרת</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">קטגוריה</Label>
          <select value={category} onChange={e => setCategory(e.target.value)}
                  className="block h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <Label className="text-xs">תיאור</Label>
        <Input value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <Label className="text-xs">תמונת Cover</Label>
          <Input value={coverUrl} dir="ltr" className="font-mono"
                 onChange={e => setCoverUrl(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">לינק וידאו</Label>
          <Input value={videoUrl} dir="ltr" className="font-mono"
                 onChange={e => setVideoUrl(e.target.value)} />
        </div>
      </div>
      <div>
        <Label className="text-xs">תוכן (Markdown)</Label>
        <Textarea rows={12} value={contentMd}
                  onChange={e => setContentMd(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={published}
               onChange={e => setPublished(e.target.checked)} className="h-4 w-4" />
        <span>פורסם</span>
      </label>
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="ms-1 h-3.5 w-3.5" /> ביטול
        </Button>
        <Button type="button" variant="accent" size="sm" onClick={handleSave}>
          <Save className="ms-1 h-3.5 w-3.5" /> שמור
        </Button>
      </div>
    </li>
  );
}

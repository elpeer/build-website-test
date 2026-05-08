'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createGuide, updateGuide, deleteGuide, setGuideAssignments,
} from '@/app/actions/guides';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Plus, Edit2, Trash2, Eye, EyeOff, ExternalLink, Save, X, AlertCircle,
  Globe, FolderKanban,
} from 'lucide-react';

interface GuideRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content_md: string;
  content_html: string;
  category: string | null;
  category_id: string | null;
  visibility: 'global' | 'project';
  video_url: string | null;
  cover_url: string | null;
  published: boolean;
  position: number;
  updated_at: string;
}

interface CategoryOption { id: string; slug: string; label: string }
interface ProjectOption  { id: string; slug: string; name: string }

interface Props {
  guides: GuideRow[];
  categories: CategoryOption[];
  projects: ProjectOption[];
  /** Map<guideId, projectId[]> — current per-guide assignments. */
  assignmentsByGuide: Record<string, string[]>;
}

export function GuidesAdmin({ guides, categories, projects, assignmentsByGuide }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createHtml, setCreateHtml] = useState('');
  const [createVisibility, setCreateVisibility] = useState<'global' | 'project'>('global');
  const [createAssignedSet, setCreateAssignedSet] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function toggleCreateProject(id: string) {
    setCreateAssignedSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleCreate(formData: FormData) {
    formData.set('content_html', createHtml);
    formData.set('visibility', createVisibility);
    setError(null);
    startTransition(async () => {
      const result = await createGuide(formData);
      if (!result.ok) { setError(result.error); return; }
      // Persist assignments if project visibility was chosen
      if (createVisibility === 'project' && createAssignedSet.size > 0) {
        await setGuideAssignments(result.data.id, Array.from(createAssignedSet));
      }
      setShowCreate(false);
      setCreateHtml('');
      setCreateVisibility('global');
      setCreateAssignedSet(new Set());
      router.refresh();
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
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label className="text-xs">קטגוריה</Label>
              <select name="category_id" defaultValue=""
                      className="block h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                <option value="">— ללא —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">חשיפה</Label>
              <select value={createVisibility}
                      onChange={e => setCreateVisibility(e.target.value as 'global' | 'project')}
                      className="block h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                <option value="global">לכל הלקוחות</option>
                <option value="project">לפרויקטים נבחרים</option>
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

          {createVisibility === 'project' && (
            <div className="rounded-md border border-border bg-background p-3">
              <Label className="text-xs">בחרו פרויקטים שיראו את המדריך</Label>
              <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-md border border-border bg-muted/20 p-2">
                {projects.length === 0 ? (
                  <p className="text-xs text-muted-fg">אין פרויקטים פעילים.</p>
                ) : (
                  projects.map(p => (
                    <label key={p.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted">
                      <input type="checkbox"
                             checked={createAssignedSet.has(p.id)}
                             onChange={() => toggleCreateProject(p.id)} />
                      <span className="flex-1 truncate">{p.name}</span>
                      <code dir="ltr" className="text-[10px] text-muted-fg">{p.slug}</code>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs">תוכן</Label>
            <p className="mb-1 text-[11px] text-muted-fg">
              הקישו <code className="rounded bg-muted px-1">/</code> כדי לפתוח תפריט בלוקים (כותרת, רשימה, ציטוט, תמונה ועוד).
            </p>
            <RichTextEditor
              initialHtml={createHtml}
              onChange={setCreateHtml}
              placeholder="כתבו... הקישו '/' להוספת בלוקים"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost"
                    onClick={() => { setShowCreate(false); setError(null); }}>ביטול</Button>
            <Button type="submit" variant="accent">צור מדריך</Button>
          </div>
        </form>
      )}

      <ul className="space-y-2">
        {guides.map(g => (
          <GuideRowItem key={g.id} guide={g}
                        categories={categories}
                        projects={projects}
                        assignedProjectIds={assignmentsByGuide[g.id] ?? []}
                        isEditing={editingId === g.id}
                        onEdit={() => setEditingId(g.id)}
                        onCancel={() => setEditingId(null)}
                        onSaved={() => { setEditingId(null); router.refresh(); }} />
        ))}
      </ul>
    </div>
  );
}

function GuideRowItem({
  guide, categories, projects, assignedProjectIds,
  isEditing, onEdit, onCancel, onSaved,
}: {
  guide: GuideRow;
  categories: CategoryOption[];
  projects: ProjectOption[];
  assignedProjectIds: string[];
  isEditing: boolean;
  onEdit: () => void; onCancel: () => void; onSaved: () => void;
}) {
  const [title, setTitle]             = useState(guide.title);
  const [description, setDescription] = useState(guide.description ?? '');
  const [categoryId, setCategoryId]   = useState(guide.category_id ?? '');
  const [visibility, setVisibility]   = useState<'global' | 'project'>(guide.visibility);
  const [assignedSet, setAssignedSet] = useState<Set<string>>(new Set(assignedProjectIds));
  const [videoUrl, setVideoUrl]       = useState(guide.video_url ?? '');
  const [coverUrl, setCoverUrl]       = useState(guide.cover_url ?? '');
  const [contentHtml, setContentHtml] = useState(guide.content_html || guide.content_md);
  const [published, setPublished]     = useState(guide.published);
  const [error, setError]             = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggleProject(id: string) {
    setAssignedSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateGuide(guide.id, {
        title, description: description || null,
        category_id: categoryId || null,
        visibility,
        video_url: videoUrl || null,
        cover_url: coverUrl || null,
        content_html: contentHtml, published,
      });
      if (!result.ok) { setError(result.error); return; }
      // Persist assignment list when in 'project' visibility (or when
      // toggling away from it — we still want to clear stale rows).
      const assignmentsResult = await setGuideAssignments(guide.id, Array.from(assignedSet));
      if (!assignmentsResult.ok) { setError(assignmentsResult.error); return; }
      onSaved();
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
    const categoryLabel = categories.find(c => c.id === guide.category_id)?.label ?? guide.category;
    return (
      <li className="flex items-start gap-3 rounded-md border border-border bg-background p-3">
        {guide.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={guide.cover_url} alt={guide.title}
               className="h-14 w-20 rounded object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{guide.title}</p>
            {categoryLabel && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-fg">{categoryLabel}</span>
            )}
            {guide.visibility === 'global' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                <Globe className="h-3 w-3" />
                כל הלקוחות
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700">
                <FolderKanban className="h-3 w-3" />
                {assignedProjectIds.length} פרויקטים
              </span>
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
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                  className="block h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
            <option value="">— ללא —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
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

      <div className="rounded-md border border-border bg-background p-3">
        <Label className="text-xs">חשיפה</Label>
        <div className="mt-1 flex flex-wrap gap-2 text-sm">
          <label className="inline-flex items-center gap-1.5">
            <input type="radio" name={`vis-${guide.id}`}
                   checked={visibility === 'global'}
                   onChange={() => setVisibility('global')} />
            <Globe className="h-3.5 w-3.5" />
            <span>לכל הלקוחות</span>
          </label>
          <label className="inline-flex items-center gap-1.5">
            <input type="radio" name={`vis-${guide.id}`}
                   checked={visibility === 'project'}
                   onChange={() => setVisibility('project')} />
            <FolderKanban className="h-3.5 w-3.5" />
            <span>רק לפרויקטים שאבחר</span>
          </label>
        </div>

        {visibility === 'project' && (
          <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-md border border-border bg-muted/20 p-2">
            {projects.length === 0 ? (
              <p className="text-xs text-muted-fg">אין פרויקטים פעילים.</p>
            ) : (
              projects.map(p => (
                <label key={p.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted">
                  <input type="checkbox"
                         checked={assignedSet.has(p.id)}
                         onChange={() => toggleProject(p.id)} />
                  <span className="flex-1 truncate">{p.name}</span>
                  <code dir="ltr" className="text-[10px] text-muted-fg">{p.slug}</code>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      <div>
        <Label className="text-xs">תוכן</Label>
        <p className="mb-1 text-[11px] text-muted-fg">
          הקישו <code className="rounded bg-muted px-1">/</code> בעורך כדי לפתוח תפריט בלוקים.
        </p>
        <RichTextEditor
          initialHtml={contentHtml}
          onChange={setContentHtml}
        />
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

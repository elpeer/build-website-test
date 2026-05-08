'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createProjectLink, updateProjectLink, deleteProjectLink,
} from '@/app/actions/client-workspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link2, ExternalLink, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

export interface ProjectLinkRow {
  id: string;
  url: string;
  label: string | null;
  created_at: string;
}

interface Props {
  projectId: string;
  projectSlug: string;
  workspace: string;
  category?: string | null;
  links: ProjectLinkRow[];
  isStudio: boolean;
  /** When false and !isStudio, hide the add/delete UI. */
  clientCanEdit?: boolean;
  emptyText?: string;
}

export function LinksList({
  projectId, projectSlug, workspace, category,
  links, isStudio, clientCanEdit = true, emptyText,
}: Props) {
  const canEdit = isStudio || clientCanEdit;
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [url, setUrl]     = useState('');
  const [label, setLabel] = useState('');
  const [, startTransition] = useTransition();

  function handleAdd() {
    if (!url.trim()) return;
    startTransition(async () => {
      const result = await createProjectLink({
        projectId, projectSlug, workspace, category: category ?? null,
        url, label: label || null,
      });
      if (result.ok) {
        setUrl(''); setLabel(''); setAdding(false);
        router.refresh();
      }
    });
  }

  function handleDelete(id: string, displayName: string) {
    if (!confirm(`למחוק את "${displayName}"?`)) return;
    startTransition(async () => {
      await deleteProjectLink(id, { projectSlug, workspace });
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {links.length === 0 ? (
        canEdit ? null : (
          <p className="text-xs text-muted-fg italic">{emptyText ?? 'לא נוספו לינקים.'}</p>
        )
      ) : (
        <ul className="space-y-2">
          {links.map(l => (
            <LinkRow key={l.id} link={l} canEdit={canEdit}
                     onDelete={() => handleDelete(l.id, l.label ?? l.url)}
                     onSave={(patch) => {
                       startTransition(async () => {
                         await updateProjectLink(l.id, { projectSlug, workspace }, patch);
                         router.refresh();
                       });
                     }} />
          ))}
        </ul>
      )}

      {canEdit && (adding ? (
        <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
          <Input value={label} onChange={e => setLabel(e.target.value)}
                 placeholder="שם / תיאור (אופציונלי)" />
          <Input value={url} dir="ltr" className="font-mono text-sm"
                 onChange={e => setUrl(e.target.value)} placeholder="https://..." />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm"
                    onClick={() => { setAdding(false); setUrl(''); setLabel(''); }}>
              ביטול
            </Button>
            <Button type="button" variant="accent" size="sm"
                    onClick={handleAdd} disabled={!url.trim()}>
              הוסף
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm"
                onClick={() => setAdding(true)}
                className="w-full justify-center border-dashed py-2">
          <Plus className="ms-1 h-3.5 w-3.5" />
          <Link2 className="ms-1 h-3.5 w-3.5" />
          הוסיפו לינק
        </Button>
      ))}
    </div>
  );
}

function LinkRow({
  link, canEdit, onDelete, onSave,
}: {
  link: ProjectLinkRow;
  canEdit: boolean;
  onDelete: () => void;
  onSave: (patch: { url?: string; label?: string | null }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl]     = useState(link.url);
  const [label, setLabel] = useState(link.label ?? '');

  function save() {
    onSave({ url, label: label || null });
    setEditing(false);
  }

  return (
    <li className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-brand/10">
        <Link2 className="h-4 w-4 text-brand" />
      </div>
      {editing ? (
        <div className="min-w-0 flex-1 space-y-2">
          <Input value={label} className="h-8 text-sm"
                 onChange={e => setLabel(e.target.value)} placeholder="שם" />
          <Input value={url} dir="ltr" className="h-8 font-mono text-xs"
                 onChange={e => setUrl(e.target.value)} placeholder="https://..." />
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{link.label || link.url}</p>
          {link.label && (
            <p dir="ltr" className="truncate text-xs text-muted-fg">{link.url}</p>
          )}
        </div>
      )}

      {editing ? (
        <>
          <button type="button" onClick={save}
                  className="text-green-600 hover:text-green-700" aria-label="שמור">
            <Check className="h-4 w-4" />
          </button>
          <button type="button"
                  onClick={() => { setUrl(link.url); setLabel(link.label ?? ''); setEditing(false); }}
                  className="text-zinc-600 hover:text-zinc-800" aria-label="ביטול">
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <a href={link.url} target="_blank" rel="noopener noreferrer"
             className="text-brand hover:underline" aria-label="פתח">
            <ExternalLink className="h-4 w-4" />
          </a>
          {canEdit && (
            <>
              <button type="button" onClick={() => setEditing(true)}
                      className="text-muted-fg hover:text-brand" aria-label="ערוך">
                <Edit2 className="h-4 w-4" />
              </button>
              <button type="button" onClick={onDelete}
                      className="text-red-600 hover:text-red-700" aria-label="מחק">
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </>
      )}
    </li>
  );
}

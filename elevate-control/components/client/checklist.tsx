'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createChecklistItem, updateChecklistItem, deleteChecklistItem,
} from '@/app/actions/client-workspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2, Circle, Hourglass, Minus, Plus, Trash2, ExternalLink, Save,
} from 'lucide-react';

export type ChecklistStatus = 'pending' | 'in_progress' | 'done' | 'na';

export interface ChecklistItemRow {
  id: string;
  workspace: string;
  title: string;
  description: string | null;
  link_url: string | null;
  input_type: string | null;     // 'text' | 'code' | 'url' | null
  input_value: string | null;
  attachment_url: string | null;
  status: ChecklistStatus;
  position: number;
}

interface Props {
  projectId: string;
  projectSlug: string;
  workspace: string;
  items: ChecklistItemRow[];
  isStudio: boolean;
}

const STATUS_ICONS: Record<ChecklistStatus, typeof CheckCircle2> = {
  pending: Circle, in_progress: Hourglass, done: CheckCircle2, na: Minus,
};
const STATUS_COLORS: Record<ChecklistStatus, string> = {
  pending:     'text-zinc-400',
  in_progress: 'text-amber-600',
  done:        'text-green-600',
  na:          'text-zinc-300',
};
const STATUS_LABELS: Record<ChecklistStatus, string> = {
  pending: 'ממתין', in_progress: 'בטיפול', done: 'בוצע', na: 'לא רלוונטי',
};

export function Checklist({ projectId, projectSlug, workspace, items, isStudio }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInputType, setNewInputType] = useState<string>('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [, startTransition] = useTransition();

  function handleCreate() {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      const result = await createChecklistItem({
        projectId, projectSlug, workspace,
        title: newTitle, description: newDesc || null,
        link_url: newLinkUrl || null,
        input_type: newInputType || null,
      });
      if (result.ok) {
        setNewTitle(''); setNewDesc(''); setNewInputType(''); setNewLinkUrl('');
        setShowCreate(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {items.map(item => (
          <ChecklistRow key={item.id} item={item}
                        projectSlug={projectSlug} workspace={workspace}
                        isStudio={isStudio} />
        ))}
      </ul>

      {isStudio && (
        !showCreate ? (
          <Button type="button" variant="outline"
                  onClick={() => setShowCreate(true)}
                  className="w-full justify-center border-dashed py-3">
            <Plus className="ms-1 h-4 w-4" />
            הוסיפו פריט
          </Button>
        ) : (
          <div className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
            <Input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                   placeholder="כותרת" />
            <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2}
                      placeholder="תיאור (אופציונלי)" />
            <Input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)}
                   dir="ltr" placeholder="לינק (אופציונלי)" />
            <select value={newInputType} onChange={e => setNewInputType(e.target.value)}
                    className="block h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
              <option value="">ללא קלט</option>
              <option value="text">טקסט (קוד פיקסל / מפתח API)</option>
              <option value="url">URL</option>
              <option value="code">קוד מרובה שורות</option>
            </select>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost"
                      onClick={() => setShowCreate(false)}>ביטול</Button>
              <Button type="button" variant="accent"
                      onClick={handleCreate} disabled={!newTitle.trim()}>הוסף</Button>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function ChecklistRow({
  item, projectSlug, workspace, isStudio,
}: {
  item: ChecklistItemRow;
  projectSlug: string;
  workspace: string;
  isStudio: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(item.input_value ?? '');
  const [dirty, setDirty] = useState(false);
  const [, startTransition] = useTransition();

  const Icon = STATUS_ICONS[item.status];

  function setStatus(next: ChecklistStatus) {
    startTransition(async () => {
      await updateChecklistItem(item.id, { projectSlug, workspace }, { status: next });
      router.refresh();
    });
  }
  function saveValue() {
    startTransition(async () => {
      await updateChecklistItem(item.id, { projectSlug, workspace }, { input_value: value });
      setDirty(false);
      router.refresh();
    });
  }
  function handleDelete() {
    if (!confirm('למחוק?')) return;
    startTransition(async () => {
      await deleteChecklistItem(item.id, { projectSlug, workspace });
      router.refresh();
    });
  }

  return (
    <li className="rounded-md border border-border bg-background p-3">
      <div className="flex items-start gap-3">
        <button type="button"
                onClick={() => setStatus(item.status === 'done' ? 'pending' : 'done')}
                className={`mt-0.5 ${STATUS_COLORS[item.status]} hover:scale-110 transition-transform`}
                aria-label={STATUS_LABELS[item.status]}>
          <Icon className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`font-medium ${item.status === 'done' ? 'text-muted-fg line-through' : ''}`}>
                {item.title}
              </p>
              {item.description && (
                <p className="mt-0.5 text-sm text-muted-fg">{item.description}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <select value={item.status}
                      onChange={e => setStatus(e.target.value as ChecklistStatus)}
                      className="h-7 rounded-full border-0 bg-muted px-2 text-xs">
                {(Object.keys(STATUS_LABELS) as ChecklistStatus[]).map(s =>
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                )}
              </select>
              {isStudio && (
                <button type="button" onClick={handleDelete}
                        className="text-red-600 hover:text-red-700" aria-label="מחק">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          {item.link_url && (
            <a href={item.link_url} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1 text-xs text-brand hover:underline">
              <ExternalLink className="h-3 w-3" />
              פתח לינק
            </a>
          )}
          {item.input_type && (
            <div className="space-y-1.5 pt-1">
              {item.input_type === 'code' ? (
                <Textarea rows={4} value={value} dir="ltr" className="font-mono text-xs"
                          onChange={e => { setValue(e.target.value); setDirty(true); }}
                          placeholder="הדביקו קוד כאן..." />
              ) : (
                <Input value={value}
                       dir={item.input_type === 'url' ? 'ltr' : undefined}
                       className={item.input_type === 'url' ? 'font-mono text-xs' : ''}
                       onChange={e => { setValue(e.target.value); setDirty(true); }}
                       placeholder={item.input_type === 'url' ? 'https://...' : 'ערך...'} />
              )}
              {dirty && (
                <Button type="button" variant="accent" size="sm" onClick={saveValue}>
                  <Save className="ms-1 h-3.5 w-3.5" />
                  שמור
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

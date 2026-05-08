'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createChecklistItem, updateChecklistItem, deleteChecklistItem, recordFile,
} from '@/app/actions/client-workspace';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2, Circle, Hourglass, Minus, Plus, Trash2, ExternalLink, Save,
  Upload, FileText,
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
  client_note: string | null;
  amount_cents: number | null;
  attachment_url: string | null;
  status: ChecklistStatus;
  position: number;
}

function formatAmount(cents: number | null | undefined): string {
  if (cents == null) return '';
  const value = cents / 100;
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(value);
}

interface Props {
  projectId: string;
  projectSlug: string;
  workspace: string;
  items: ChecklistItemRow[];
  isStudio: boolean;
  /** When false and !isStudio, hide the "+ Add item" form. Defaults to false (clients can't add items by default). */
  clientCanAddItems?: boolean;
  /** Show an inline "report a fix / write feedback" textarea per item.
   *  Used in QA so clients can attach concrete issues to each test item
   *  instead of routing them through a separate comments stream. */
  showFixField?: boolean;
  /** Show an amount input per item (and a total at the bottom). Used by
   *  the finance workspace for payment milestones. */
  showAmountField?: boolean;
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

export function Checklist({
  projectId, projectSlug, workspace, items, isStudio,
  clientCanAddItems = false, showFixField = false, showAmountField = false,
}: Props) {
  const canAdd = isStudio || clientCanAddItems;
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInputType, setNewInputType] = useState<string>('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [, startTransition] = useTransition();

  const totalCents  = items.reduce((sum, it) => sum + (it.amount_cents ?? 0), 0);
  const paidCents   = items.filter(i => i.status === 'done').reduce((s, i) => s + (i.amount_cents ?? 0), 0);

  function handleCreate() {
    if (!newTitle.trim()) return;
    const amountCents = newAmount ? Math.round(parseFloat(newAmount) * 100) : null;
    startTransition(async () => {
      const result = await createChecklistItem({
        projectId, projectSlug, workspace,
        title: newTitle, description: newDesc || null,
        link_url: newLinkUrl || null,
        input_type: newInputType || null,
        amount_cents: amountCents,
      });
      if (result.ok) {
        setNewTitle(''); setNewDesc(''); setNewInputType(''); setNewLinkUrl(''); setNewAmount('');
        setShowCreate(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {items.length === 0 && (
          <li className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-fg">
            {canAdd ? 'אין פריטים. הוסיפו פריט.' : 'עדיין לא הוגדרו פריטים.'}
          </li>
        )}
        {items.map(item => (
          <ChecklistRow key={item.id} item={item}
                        projectId={projectId} projectSlug={projectSlug} workspace={workspace}
                        isStudio={isStudio}
                        showFixField={showFixField}
                        showAmountField={showAmountField} />
        ))}
      </ul>

      {showAmountField && items.length > 0 && totalCents > 0 && (
        <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-fg">סה״כ</span>
          <span className="font-semibold">
            {formatAmount(paidCents)} / {formatAmount(totalCents)} שולמו
          </span>
        </div>
      )}

      {canAdd && (
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
            {showAmountField && (
              <Input value={newAmount} type="number" min="0" step="1"
                     onChange={e => setNewAmount(e.target.value)}
                     placeholder="סכום בשקלים (אופציונלי)" />
            )}
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
  item, projectId, projectSlug, workspace, isStudio, showFixField, showAmountField,
}: {
  item: ChecklistItemRow;
  projectId: string;
  projectSlug: string;
  workspace: string;
  isStudio: boolean;
  showFixField: boolean;
  showAmountField: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(item.input_value ?? '');
  const [dirty, setDirty] = useState(false);
  const [fixNote, setFixNote] = useState(item.client_note ?? '');
  const [fixDirty, setFixDirty] = useState(false);
  const [amountStr, setAmountStr] = useState(item.amount_cents != null ? String(item.amount_cents / 100) : '');
  const [amountDirty, setAmountDirty] = useState(false);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  async function handleInvoiceUpload(file: File | undefined) {
    if (!file) return;
    setUploadingInvoice(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const path = `${projectId}/files/${workspace}/invoices/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('client-files').upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) { setUploadingInvoice(false); return; }
      const recorded = await recordFile({
        projectId, projectSlug, workspace,
        category: 'invoice', filename: file.name,
        storagePath: path, mimeType: file.type, sizeBytes: file.size,
      });
      if (recorded.ok) {
        await updateChecklistItem(item.id, { projectSlug, workspace },
          { attachment_url: recorded.data.file_url });
      }
      if (invoiceInputRef.current) invoiceInputRef.current.value = '';
      router.refresh();
    } finally {
      setUploadingInvoice(false);
    }
  }

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
  function saveFixNote() {
    startTransition(async () => {
      await updateChecklistItem(item.id, { projectSlug, workspace }, { client_note: fixNote });
      setFixDirty(false);
      router.refresh();
    });
  }
  function saveAmount() {
    const cents = amountStr ? Math.round(parseFloat(amountStr) * 100) : null;
    startTransition(async () => {
      await updateChecklistItem(item.id, { projectSlug, workspace }, { amount_cents: cents });
      setAmountDirty(false);
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
              {showAmountField && item.amount_cents != null && (
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                  {formatAmount(item.amount_cents)}
                </span>
              )}
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
          {showFixField && (
            <div className="space-y-1.5 pt-1">
              <Textarea rows={2} value={fixNote}
                        onChange={e => { setFixNote(e.target.value); setFixDirty(true); }}
                        placeholder="כתבו פה אם משהו לא תקין או צריך תיקון..." />
              {fixDirty && (
                <Button type="button" variant="accent" size="sm" onClick={saveFixNote}>
                  <Save className="ms-1 h-3.5 w-3.5" />
                  שמור הערה
                </Button>
              )}
            </div>
          )}
          {showAmountField && isStudio && (
            <div className="flex items-end gap-2 pt-1">
              <div className="flex-1 space-y-1">
                <label className="block text-xs text-muted-fg">סכום (₪)</label>
                <Input value={amountStr} type="number" min="0" step="1"
                       onChange={e => { setAmountStr(e.target.value); setAmountDirty(true); }}
                       placeholder="0" />
              </div>
              {amountDirty && (
                <Button type="button" variant="accent" size="sm" onClick={saveAmount}>
                  <Save className="ms-1 h-3.5 w-3.5" />
                  שמור
                </Button>
              )}
            </div>
          )}
          {showAmountField && (
            <div className="space-y-1.5 pt-1">
              {item.attachment_url ? (
                <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs">
                  <FileText className="h-3.5 w-3.5 text-muted-fg" />
                  <a href={item.attachment_url} target="_blank" rel="noopener noreferrer"
                     className="flex-1 text-brand hover:underline">
                    חשבונית
                  </a>
                  <a href={item.attachment_url} target="_blank" rel="noopener noreferrer"
                     className="text-muted-fg hover:text-brand" aria-label="פתח">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  {isStudio && (
                    <Button type="button" variant="ghost" size="sm"
                            onClick={() => invoiceInputRef.current?.click()}
                            disabled={uploadingInvoice}>
                      <Upload className="ms-1 h-3 w-3" />
                      החלף
                    </Button>
                  )}
                </div>
              ) : isStudio ? (
                <Button type="button" variant="outline" size="sm"
                        onClick={() => invoiceInputRef.current?.click()}
                        disabled={uploadingInvoice} className="w-full justify-center border-dashed">
                  <Upload className="ms-1 h-3.5 w-3.5" />
                  {uploadingInvoice ? 'מעלה...' : 'העלאת חשבונית למילסטון'}
                </Button>
              ) : null}
              {isStudio && (
                <input ref={invoiceInputRef} type="file"
                       accept="application/pdf,image/*"
                       className="hidden"
                       onChange={e => handleInvoiceUpload(e.target.files?.[0])} />
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  createTicket, setThreadStatus, setThreadPriority,
} from '@/app/actions/client-workspace';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CommentThread, type CommentMessage } from '@/components/client/comment-thread';
import {
  AlertCircle, Plus, ChevronDown, ChevronUp, Paperclip, X, FileText,
} from 'lucide-react';

type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
type ThreadStatus = 'open' | 'in_progress' | 'resolved' | 'wont_fix';

export interface TicketRow {
  id: string;
  title: string;
  status: ThreadStatus;
  priority: TicketPriority;
  created_at: string;
  updated_at: string;
  messages: CommentMessage[];
}

interface Props {
  projectId: string;
  projectSlug: string;
  tickets: TicketRow[];
  currentUserId: string;
  isStudio: boolean;
}

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'נמוכה', normal: 'רגילה', high: 'גבוהה', urgent: 'דחוף!',
};
const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low:    'bg-zinc-100 text-zinc-600',
  normal: 'bg-blue-100 text-blue-700',
  high:   'bg-amber-100 text-amber-800',
  urgent: 'bg-red-100 text-red-800',
};
const STATUS_LABELS: Record<ThreadStatus, string> = {
  open: 'פתוח', in_progress: 'בטיפול', resolved: 'נסגר', wont_fix: 'נדחה',
};
const STATUS_COLORS: Record<ThreadStatus, string> = {
  open:        'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-800',
  resolved:    'bg-green-100 text-green-700',
  wont_fix:    'bg-zinc-100 text-zinc-600',
};

export function SupportTickets({
  projectId, projectSlug, tickets, currentUserId, isStudio,
}: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [attachments, setAttachments] = useState<{ file: File; previewUrl: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function pickFiles(files: FileList | File[] | null) {
    if (!files) return;
    const arr = Array.from(files);
    setAttachments(prev => [
      ...prev,
      ...arr.map(f => ({ file: f, previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : '' })),
    ]);
  }
  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const it of items) {
      if (it.kind === 'file') {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) { e.preventDefault(); pickFiles(files); }
  }

  async function handleCreate() {
    setError(null);
    if (!title.trim() || !body.trim()) {
      setError('נושא ותוכן הם שדות חובה'); return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const uploaded: { url: string; name: string; mime: string; size_bytes: number }[] = [];
      for (const a of attachments) {
        const ext = a.file.name.split('.').pop()?.toLowerCase() || 'bin';
        const path = `${projectId}/comments/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('client-files')
          .upload(path, a.file, { contentType: a.file.type, upsert: false });
        if (upErr) { setError(`כשל בהעלאה: ${upErr.message}`); setSubmitting(false); return; }
        const { data: signed } = await supabase.storage.from('client-files')
          .createSignedUrl(path, 60 * 60 * 24 * 365);
        uploaded.push({ url: signed?.signedUrl ?? '', name: a.file.name, mime: a.file.type, size_bytes: a.file.size });
      }

      const result = await createTicket({
        projectId, projectSlug,
        title, firstMessage: body, priority,
        attachments: uploaded,
      });
      if (!result.ok) { setError(result.error); setSubmitting(false); return; }

      attachments.forEach(a => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
      setAttachments([]);
      setTitle(''); setBody(''); setPriority('normal');
      setCreating(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  function changePriority(threadId: string, p: TicketPriority) {
    startTransition(async () => {
      await setThreadPriority(threadId, projectSlug, p);
      router.refresh();
    });
  }
  function changeStatus(threadId: string, s: ThreadStatus) {
    startTransition(async () => {
      await setThreadStatus(threadId, projectSlug, s);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {!creating ? (
        <Button type="button" variant="accent" onClick={() => setCreating(true)} className="w-full justify-center py-3">
          <Plus className="ms-1 h-4 w-4" />
          פתח טיקט חדש
        </Button>
      ) : (
        <div className="space-y-3 rounded-md border border-brand bg-brand/5 p-4">
          <div>
            <Label className="text-xs">נושא</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)}
                   placeholder="תאור קצר של הבעיה" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label className="text-xs">דחיפות</Label>
              <select value={priority}
                      onChange={e => setPriority(e.target.value as TicketPriority)}
                      className="block h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map(p =>
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                )}
              </select>
            </div>
          </div>
          <div>
            <Label className="text-xs">תיאור הבעיה</Label>
            <Textarea rows={4} value={body} onChange={e => setBody(e.target.value)}
                      onPaste={handlePaste}
                      placeholder="תארו את הבעיה. אפשר להדביק צילום מסך (Ctrl+V)" />
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <div key={i} className="relative">
                  {a.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.previewUrl} alt={a.file.name}
                         className="h-16 w-16 rounded border border-border object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded border border-border bg-muted">
                      <FileText className="h-6 w-6 text-muted-fg" />
                    </div>
                  )}
                  <button type="button"
                          onClick={() => {
                            const copy = [...attachments];
                            const [r] = copy.splice(i, 1);
                            if (r?.previewUrl) URL.revokeObjectURL(r.previewUrl);
                            setAttachments(copy);
                          }}
                          className="absolute -top-1.5 -end-1.5 rounded-full bg-red-600 p-0.5 text-white"
                          aria-label="הסר">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <input ref={fileInputRef} type="file" multiple
                   accept="image/*,application/pdf"
                   className="hidden"
                   onChange={e => pickFiles(e.target.files)} />
            <Button type="button" variant="ghost" size="sm"
                    onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="ms-1 h-3.5 w-3.5" />
              צרף קובץ
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm"
                      onClick={() => { setCreating(false); setError(null); }}>
                ביטול
              </Button>
              <Button type="button" variant="accent" size="sm"
                      onClick={handleCreate} disabled={submitting}>
                {submitting ? 'פותח...' : 'פתח טיקט'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {tickets.length === 0 && !creating && (
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-fg">
          אין טיקטים פתוחים. לחצו על &quot;פתח טיקט חדש&quot; כדי לדווח על בעיה.
        </div>
      )}

      <ul className="space-y-3">
        {tickets.map(t => {
          const open = openId === t.id;
          const date = new Date(t.updated_at).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
          return (
            <li key={t.id} className="rounded-lg border border-border bg-background">
              <button type="button" onClick={() => setOpenId(open ? null : t.id)}
                      className="flex w-full items-center justify-between gap-3 p-4 text-start hover:bg-muted/30">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="mt-1 text-xs text-muted-fg">
                    {t.messages.length} הודעות · עודכן {date}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[t.priority]}`}>
                  {PRIORITY_LABELS[t.priority]}
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status]}`}>
                  {STATUS_LABELS[t.status]}
                </span>
                {open ? <ChevronUp className="h-4 w-4 text-muted-fg" /> : <ChevronDown className="h-4 w-4 text-muted-fg" />}
              </button>

              {open && (
                <div className="space-y-3 border-t border-border bg-muted/20 p-4">
                  {isStudio && (
                    <div className="flex flex-wrap gap-3 rounded-md border border-border bg-background p-2 text-xs">
                      <label className="flex items-center gap-1">
                        דחיפות:
                        <select value={t.priority}
                                onChange={e => changePriority(t.id, e.target.value as TicketPriority)}
                                className="rounded-md border border-border bg-background px-2 py-0.5">
                          {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map(p =>
                            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                          )}
                        </select>
                      </label>
                      <label className="flex items-center gap-1">
                        סטטוס:
                        <select value={t.status}
                                onChange={e => changeStatus(t.id, e.target.value as ThreadStatus)}
                                className="rounded-md border border-border bg-background px-2 py-0.5">
                          {(Object.keys(STATUS_LABELS) as ThreadStatus[]).map(s =>
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          )}
                        </select>
                      </label>
                    </div>
                  )}

                  <CommentThread
                    projectId={projectId}
                    projectSlug={projectSlug}
                    thread={{ id: t.id, status: t.status }}
                    messages={t.messages}
                    currentUserId={currentUserId}
                    isStudio={isStudio}
                    compact
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

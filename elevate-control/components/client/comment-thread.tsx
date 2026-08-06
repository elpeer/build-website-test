'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  postMessage, setThreadStatus, setMessageAcknowledged, editMessage, deleteMessage,
} from '@/app/actions/client-workspace';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AnnotationCanvas } from '@/components/client/annotation-canvas';
import {
  MessageCircle, Send, Paperclip, X, AlertCircle, CheckCircle2,
  Hourglass, ImageIcon, FileText, Pencil, CornerDownLeft, Check,
  Edit2, Trash2, Save,
} from 'lucide-react';

export interface CommentMessage {
  id: string;
  author_id: string | null;
  author_label: string | null;
  body: string;
  attachments: Array<{ url: string; name: string; mime: string; size_bytes: number }>;
  created_at: string;
  reply_to_id?: string | null;
  reply_to_author?: string | null;
  reply_to_snippet?: string | null;
  acknowledged_at?: string | null;
}

type ThreadStatus = 'open' | 'in_progress' | 'resolved' | 'wont_fix';

interface ThreadInfo {
  id: string | null;
  status: ThreadStatus;
}

interface EnsureSpec {
  projectId: string;
  contextType: 'approval' | 'workspace' | 'page' | 'section';
  contextId?: string | null;
  workspace?: string | null;
  title?: string | null;
}

interface Props {
  projectId: string;
  projectSlug: string;
  thread: ThreadInfo;
  messages: CommentMessage[];
  ensure?: EnsureSpec; // for create-on-first-message
  currentUserId: string;
  isStudio: boolean;
  compact?: boolean;
  composerPlaceholder?: string;
}

const STATUS_LABELS: Record<ThreadStatus, string> = {
  open: 'פתוח', in_progress: 'בטיפול', resolved: 'תוקן', wont_fix: 'נדחה',
};
const STATUS_COLORS: Record<ThreadStatus, string> = {
  open:        'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-800',
  resolved:    'bg-green-100 text-green-700',
  wont_fix:    'bg-zinc-100 text-zinc-600',
};

export function CommentThread({
  projectId, projectSlug, thread, messages: initialMessages,
  ensure, currentUserId, isStudio, compact, composerPlaceholder,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string | null; snippet: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [attachments, setAttachments] = useState<{ file: File; previewUrl: string }[]>([]);
  const [annotating, setAnnotating] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [, startSending] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Live updates via Supabase Realtime
  useEffect(() => {
    if (!thread.id) return;
    const supabase = createClient();
    const channel = supabase.channel(`thread:${thread.id}`)
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'comment_messages',
            filter: `thread_id=eq.${thread.id}` },
          (payload) => {
            const row = payload.new as CommentMessage;
            setMessages(prev => prev.some(m => m.id === row.id) ? prev : [...prev, row]);
          })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [thread.id]);

  // Reconcile with server truth on router.refresh() — useState doesn't
  // re-init from props, so without this a newly-posted message only
  // showed after a full page reload. Union by id; server rows win.
  useEffect(() => {
    setMessages(prev => {
      const byId = new Map<string, CommentMessage>();
      for (const m of prev) byId.set(m.id, m);
      for (const m of initialMessages) byId.set(m.id, { ...byId.get(m.id), ...m });
      return Array.from(byId.values()).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  }, [initialMessages]);

  function pickFiles(files: FileList | File[] | null) {
    if (!files) return;
    const arr = Array.from(files);
    setAttachments(prev => [
      ...prev,
      ...arr.map(f => ({ file: f, previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : '' })),
    ]);
  }

  function removeAttachment(idx: number) {
    setAttachments(prev => {
      const copy = [...prev];
      const [removed] = copy.splice(idx, 1);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return copy;
    });
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const item of items) {
      if (item.kind === 'file') {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) {
      e.preventDefault();
      pickFiles(files);
    }
  }

  async function handleSend() {
    setError(null);
    if (!body.trim() && attachments.length === 0) return;

    setUploading(true);
    try {
      const supabase = createClient();
      // Upload all attachments first (browser → storage)
      const uploaded: { url: string; name: string; mime: string; size_bytes: number }[] = [];
      for (const a of attachments) {
        const ext = a.file.name.split('.').pop()?.toLowerCase() || 'bin';
        const path = `${projectId}/comments/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('client-files').upload(path, a.file, { contentType: a.file.type, upsert: false });
        if (upErr) { setError(`כשל בהעלאה: ${upErr.message}`); setUploading(false); return; }
        const { data: signed } = await supabase.storage
          .from('client-files').createSignedUrl(path, 60 * 60 * 24 * 365);
        uploaded.push({
          url: signed?.signedUrl ?? '',
          name: a.file.name,
          mime: a.file.type,
          size_bytes: a.file.size,
        });
      }

      // Optimistic append — show the message instantly instead of
      // waiting on the server action (which also sends an email).
      const tempId = `temp-${crypto.randomUUID()}`;
      const myLabel = messages.find(m => m.author_id === currentUserId)?.author_label ?? 'אני';
      const replyToSend = replyingTo;
      const sentBody = body;
      const optimistic: CommentMessage = {
        id: tempId,
        author_id: currentUserId,
        author_label: myLabel,
        body: sentBody,
        attachments: uploaded,
        created_at: new Date().toISOString(),
        reply_to_id: replyToSend?.id ?? null,
        reply_to_author: replyToSend?.author ?? null,
        reply_to_snippet: replyToSend?.snippet ?? null,
        acknowledged_at: null,
      };
      setMessages(prev => [...prev, optimistic]);
      setBody('');
      setReplyingTo(null);
      const sentAttachments = attachments;
      setAttachments([]);
      if (fileInputRef.current) fileInputRef.current.value = '';

      startSending(async () => {
        const result = await postMessage({
          threadId: thread.id ?? '',
          projectSlug,
          body: sentBody,
          attachments: uploaded,
          replyTo: replyToSend,
          ensure: !thread.id ? ensure : undefined,
        });
        if (!result.ok) {
          setError(result.error);
          setMessages(prev => prev.filter(m => m.id !== tempId)); // roll back
          return;
        }
        // Swap the temp id for the real one so a later refresh dedupes.
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: result.data.messageId } : m));
        sentAttachments.forEach(a => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
        router.refresh();
      });
    } finally {
      setUploading(false);
    }
  }

  function handleStatusChange(next: ThreadStatus) {
    if (!thread.id) return;
    startSending(async () => {
      await setThreadStatus(thread.id!, projectSlug, next);
      router.refresh();
    });
  }

  function startEdit(id: string, currentBody: string) {
    setEditingId(id);
    setEditBody(currentBody);
  }
  function saveEdit(id: string) {
    const next = editBody.trim();
    if (!next) return;
    setMessages(prev => prev.map(m => m.id === id ? { ...m, body: next } : m)); // optimistic
    setEditingId(null);
    startSending(async () => {
      const r = await editMessage(id, projectSlug, next);
      if (!r.ok) { setError(r.error); }
      router.refresh();
    });
  }
  function handleDelete(id: string) {
    if (!confirm('למחוק את התגובה?')) return;
    setMessages(prev => prev.filter(m => m.id !== id)); // optimistic
    startSending(async () => {
      const r = await deleteMessage(id, projectSlug);
      if (!r.ok) { setError(r.error); router.refresh(); }
      else router.refresh();
    });
  }

  function toggleAck(messageId: string, current: boolean) {
    // optimistic
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, acknowledged_at: current ? null : new Date().toISOString() } : m
    ));
    startSending(async () => {
      await setMessageAcknowledged(messageId, projectSlug, !current);
      router.refresh();
    });
  }

  // How many messages reply to each message id (for the "N תגובות" badge).
  const replyCounts = new Map<string, number>();
  for (const m of messages) {
    if (m.reply_to_id) replyCounts.set(m.reply_to_id, (replyCounts.get(m.reply_to_id) ?? 0) + 1);
  }

  return (
    <div className={`space-y-3 rounded-md border border-border bg-background ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold">
          <MessageCircle className="h-3.5 w-3.5" />
          תגובות ({messages.length})
        </h4>
        {thread.id && (
          <select value={thread.status}
                  onChange={e => handleStatusChange(e.target.value as ThreadStatus)}
                  className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[thread.status]}`}>
            {(Object.keys(STATUS_LABELS) as ThreadStatus[]).map(s =>
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            )}
          </select>
        )}
      </div>

      {messages.length > 0 && (
        <ul className="space-y-2">
          {messages.map(m => {
            const mine = m.author_id === currentUserId;
            const acknowledged = !!m.acknowledged_at;
            const replyCount = replyCounts.get(m.id) ?? 0;
            // "New": a message from the other side that hasn't been marked
            // handled yet — highlighted amber to draw the eye.
            const isNew = !mine && !acknowledged;
            const date = new Date(m.created_at).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
            return (
              <li key={m.id} id={`msg-${m.id}`}
                  className={`scroll-mt-4 rounded-lg border p-3 text-sm transition-colors ${
                isNew
                  ? 'border-amber-300 bg-amber-50'
                  : mine ? 'border-brand/30 bg-brand/5' : 'border-border bg-muted/30'
              }`}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    {m.author_label ?? 'משתמש'}
                    {isNew && (
                      <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
                        חדש
                      </span>
                    )}
                    {replyCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand"
                            title={`${replyCount} תגובות להודעה זו`}>
                        <MessageCircle className="h-2.5 w-2.5" />
                        {replyCount}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-fg">{date}</span>
                    <button type="button"
                            onClick={() => toggleAck(m.id, acknowledged)}
                            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition-colors ${
                              acknowledged
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'text-muted-fg hover:bg-green-50 hover:text-green-700'
                            }`}
                            title={acknowledged ? 'בוטל הסימון' : 'סמן שטופל / ברור'}>
                      <Check className="h-3 w-3" />
                      {acknowledged ? 'טופל' : 'סמן'}
                    </button>
                    <button type="button"
                            onClick={() => {
                              setReplyingTo({
                                id: m.id,
                                author: m.author_label,
                                snippet: (m.body || '(קובץ מצורף)').slice(0, 140),
                              });
                              composerRef.current?.focus();
                            }}
                            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-fg hover:bg-brand/10 hover:text-brand"
                            title="השב על ההודעה הזו">
                      <CornerDownLeft className="h-3 w-3" />
                      השב
                    </button>
                    {mine && editingId !== m.id && (
                      <>
                        <button type="button" onClick={() => startEdit(m.id, m.body)}
                                className="inline-flex items-center rounded p-1 text-[11px] text-muted-fg hover:bg-brand/10 hover:text-brand"
                                title="ערוך">
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button type="button" onClick={() => handleDelete(m.id)}
                                className="inline-flex items-center rounded p-1 text-[11px] text-muted-fg hover:bg-red-50 hover:text-red-600"
                                title="מחק">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {m.reply_to_snippet && (
                  <button type="button"
                          onClick={() => {
                            if (!m.reply_to_id) return;
                            const el = document.getElementById(`msg-${m.reply_to_id}`);
                            if (!el) return;
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.classList.add('ring-2', 'ring-brand');
                            setTimeout(() => el.classList.remove('ring-2', 'ring-brand'), 1400);
                          }}
                          className="mb-1.5 flex w-full items-start gap-1 rounded-md border-s-2 border-brand/40 bg-background/60 px-2 py-1 text-start text-xs text-muted-fg hover:bg-brand/5"
                          title="עבור להודעה המקורית">
                    <CornerDownLeft className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
                    <span className="min-w-0">
                      <span className="font-semibold">בתגובה ל־{m.reply_to_author ?? 'משתמש'}: </span>
                      <span className="italic">{m.reply_to_snippet}</span>
                    </span>
                  </button>
                )}
                {editingId === m.id ? (
                  <div className="space-y-2">
                    <Textarea value={editBody} onChange={e => setEditBody(e.target.value)}
                              rows={2} className="resize-none text-sm" />
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="accent" size="sm"
                              onClick={() => saveEdit(m.id)} disabled={!editBody.trim()}>
                        <Save className="ms-1 h-3.5 w-3.5" />
                        שמור
                      </Button>
                      <Button type="button" variant="ghost" size="sm"
                              onClick={() => { setEditingId(null); setEditBody(''); }}>
                        <X className="ms-1 h-3.5 w-3.5" />
                        ביטול
                      </Button>
                    </div>
                  </div>
                ) : (
                  m.body && <p className="whitespace-pre-wrap">{m.body}</p>
                )}
                {m.attachments?.length > 0 && (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {m.attachments.map((a, i) => (
                      <div key={i}
                           className="group relative flex items-center gap-2 rounded-md border border-border bg-background p-2 text-xs hover:border-brand">
                        {a.mime.startsWith('image/') && (
                          <button type="button"
                                  onClick={(e) => { e.preventDefault(); setAnnotating({ url: a.url, name: a.name }); }}
                                  className="absolute end-1 top-1 z-10 inline-flex items-center gap-1 rounded-full bg-brand/95 px-2 py-1 text-[11px] font-medium text-white shadow-md ring-1 ring-white/20 hover:bg-brand"
                                  title="סמן על התמונה — צייר על המסך וסמן בעיגולים/חצים מה לתקן">
                            <Pencil className="h-3 w-3" />
                            סמן
                          </button>
                        )}
                        <a href={a.url} target="_blank" rel="noopener noreferrer"
                           className="flex flex-1 items-center gap-2">
                          {a.mime.startsWith('image/') ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.url} alt={a.name} className="h-12 w-12 rounded object-cover" />
                          ) : (
                            <FileText className="h-6 w-6 text-muted-fg" />
                          )}
                          <span className="truncate flex-1">{a.name}</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-2 border-t border-border pt-3">
        {replyingTo && (
          <div className="flex items-start gap-2 rounded-md border-s-2 border-brand/50 bg-brand/5 px-2 py-1.5 text-xs">
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-brand">משיב ל־{replyingTo.author ?? 'משתמש'}: </span>
              <span className="text-muted-fg italic">{replyingTo.snippet}</span>
            </div>
            <button type="button" onClick={() => setReplyingTo(null)}
                    className="shrink-0 rounded p-0.5 text-muted-fg hover:bg-muted hover:text-red-600"
                    aria-label="בטל תגובה">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <Textarea ref={composerRef} value={body} onChange={e => setBody(e.target.value)}
                  onPaste={handlePaste}
                  rows={2}
                  placeholder={replyingTo
                    ? `תגובה ל־${replyingTo.author ?? 'משתמש'}...`
                    : (composerPlaceholder ?? (isStudio ? 'תגובה ללקוח...' : 'כתבו הערה (אפשר להדביק צילום מסך)...'))}
                  className="resize-none" />

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((a, i) => (
              <div key={i} className="relative">
                {a.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.previewUrl} alt={a.file.name} className="h-16 w-16 rounded border border-border object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded border border-border bg-muted text-xs">
                    <FileText className="h-6 w-6 text-muted-fg" />
                  </div>
                )}
                <button type="button" onClick={() => removeAttachment(i)}
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
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" multiple
                   accept="image/*,application/pdf,.zip,.doc,.docx,.xls,.xlsx,.txt,.csv"
                   className="hidden"
                   onChange={e => pickFiles(e.target.files)} />
            <Button type="button" variant="ghost" size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}>
              <Paperclip className="ms-1 h-3.5 w-3.5" />
              קובץ
            </Button>
            <span className="text-xs text-muted-fg">
              <ImageIcon className="ms-1 inline h-3 w-3" />
              ניתן להדביק צילום מסך (Ctrl+V)
            </span>
          </div>
          <Button type="button" variant="accent" size="sm" onClick={handleSend}
                  disabled={uploading || (!body.trim() && attachments.length === 0)}>
            <Send className="ms-1 h-3.5 w-3.5" />
            {uploading ? 'שולח...' : 'שלח'}
          </Button>
        </div>
      </div>

      {annotating && (
        <AnnotationCanvas
          imageUrl={annotating.url}
          imageName={annotating.name}
          onCancel={() => setAnnotating(null)}
          onSave={async (blob, filename) => {
            // Upload as a new attachment + post a new message in this thread
            const supabase = createClient();
            const path = `${projectId}/comments/${crypto.randomUUID()}.png`;
            const { error: upErr } = await supabase.storage
              .from('client-files').upload(path, blob, { contentType: 'image/png', upsert: false });
            if (upErr) { setError(`כשל בהעלאה: ${upErr.message}`); return; }
            const { data: signed } = await supabase.storage
              .from('client-files').createSignedUrl(path, 60 * 60 * 24 * 365);

            await postMessage({
              threadId: thread.id ?? '',
              projectSlug,
              body: '',
              attachments: [{
                url: signed?.signedUrl ?? '',
                name: filename,
                mime: 'image/png',
                size_bytes: blob.size,
              }],
              ensure: !thread.id ? ensure : undefined,
            });
            setAnnotating(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

export function ThreadStatusPill({ status }: { status: ThreadStatus }) {
  const Icon = status === 'resolved' ? CheckCircle2
             : status === 'in_progress' ? Hourglass
             : MessageCircle;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[status]}`}>
      <Icon className="h-3 w-3" />
      {STATUS_LABELS[status]}
    </span>
  );
}

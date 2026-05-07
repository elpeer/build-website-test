'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { postMessage, setThreadStatus } from '@/app/actions/client-workspace';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageCircle, Send, Paperclip, X, AlertCircle, CheckCircle2,
  Hourglass, ImageIcon, FileText,
} from 'lucide-react';

export interface CommentMessage {
  id: string;
  author_id: string | null;
  author_label: string | null;
  body: string;
  attachments: Array<{ url: string; name: string; mime: string; size_bytes: number }>;
  created_at: string;
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
  ensure, currentUserId, isStudio, compact,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<{ file: File; previewUrl: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [, startSending] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      startSending(async () => {
        const result = await postMessage({
          threadId: thread.id ?? '',
          projectSlug,
          body,
          attachments: uploaded,
          ensure: !thread.id ? ensure : undefined,
        });
        if (!result.ok) { setError(result.error); return; }

        setBody('');
        attachments.forEach(a => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
        setAttachments([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
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
            const date = new Date(m.created_at).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
            return (
              <li key={m.id} className={`rounded-lg border p-3 text-sm ${
                mine ? 'border-brand/30 bg-brand/5' : 'border-border bg-muted/30'
              }`}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">{m.author_label ?? 'משתמש'}</span>
                  <span className="text-xs text-muted-fg">{date}</span>
                </div>
                {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                {m.attachments?.length > 0 && (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {m.attachments.map((a, i) => (
                      <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-xs hover:border-brand">
                        {a.mime.startsWith('image/') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.url} alt={a.name} className="h-12 w-12 rounded object-cover" />
                        ) : (
                          <FileText className="h-6 w-6 text-muted-fg" />
                        )}
                        <span className="truncate flex-1">{a.name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-2 border-t border-border pt-3">
        <Textarea value={body} onChange={e => setBody(e.target.value)}
                  onPaste={handlePaste}
                  rows={2}
                  placeholder={isStudio ? 'תגובה ללקוח...' : 'כתבו הערה (אפשר להדביק צילום מסך)...'}
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

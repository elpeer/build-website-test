'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setApprovalStatus, deleteApproval } from '@/app/actions/client-workspace';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  CommentThread, type CommentMessage, ThreadStatusPill,
} from '@/components/client/comment-thread';
import {
  CheckCircle2, AlertCircle, XCircle, Clock,
  ChevronDown, ChevronUp, ExternalLink, MessageCircle, Trash2,
} from 'lucide-react';

export type ApprovalStatus = 'pending' | 'approved' | 'changes_requested' | 'rejected';

export interface ApprovalCardData {
  id: string;
  workspace: string;
  title: string;
  description: string | null;
  link_url: string | null;
  thumbnail_url: string | null;
  status: ApprovalStatus;
  status_note: string | null;
  status_changed_at: string | null;
}

interface ThreadInfo {
  id: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'wont_fix';
  messages: CommentMessage[];
}

interface Props {
  approval: ApprovalCardData;
  thread: ThreadInfo;
  projectId: string;
  projectSlug: string;
  workspace: string;
  currentUserId: string;
  isStudio: boolean;
  canDelete?: boolean;
}

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending:            'ממתין לאישור',
  approved:           'אושר',
  changes_requested:  'בקשה לתיקון',
  rejected:           'נדחה',
};
const STATUS_COLORS: Record<ApprovalStatus, string> = {
  pending:           'bg-blue-100 text-blue-700',
  approved:          'bg-green-100 text-green-700',
  changes_requested: 'bg-amber-100 text-amber-800',
  rejected:          'bg-red-100 text-red-700',
};
const STATUS_ICONS: Record<ApprovalStatus, typeof CheckCircle2> = {
  pending:           Clock,
  approved:          CheckCircle2,
  changes_requested: AlertCircle,
  rejected:          XCircle,
};

export function ApprovalCard({
  approval, thread, projectId, projectSlug, workspace,
  currentUserId, isStudio, canDelete,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(thread.messages.length > 0 && thread.status !== 'resolved');
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const Icon = STATUS_ICONS[approval.status];

  function setStatus(next: ApprovalStatus, withNote = false) {
    if (withNote && next !== approval.status) { setShowNote(true); return; }
    setError(null);
    startTransition(async () => {
      const result = await setApprovalStatus(approval.id,
        { projectSlug, workspace }, next, withNote ? note : null);
      if (!result.ok) setError(result.error);
      else { setShowNote(false); setNote(''); router.refresh(); }
    });
  }

  function handleDelete() {
    if (!confirm('למחוק את הפריט?')) return;
    startTransition(async () => {
      await deleteApproval(approval.id, { projectSlug, workspace });
      router.refresh();
    });
  }

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <div className="flex flex-col gap-4 p-4 sm:flex-row">
        {approval.thumbnail_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={approval.thumbnail_url} alt={approval.title}
               className="h-32 w-full rounded-md object-cover sm:w-48 sm:h-32" />
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold">{approval.title}</h3>
              {approval.description && (
                <p className="mt-1 text-sm text-muted-fg">{approval.description}</p>
              )}
            </div>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[approval.status]}`}>
              <Icon className="h-3 w-3" />
              {STATUS_LABELS[approval.status]}
            </span>
          </div>

          {approval.link_url && (
            <a href={approval.link_url} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
              <ExternalLink className="h-3.5 w-3.5" />
              פתח קישור
            </a>
          )}

          {approval.status_note && (
            <p className="rounded-md bg-muted/50 p-2 text-xs italic">
              <span className="font-semibold">הערה: </span>{approval.status_note}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {approval.status !== 'approved' && (
              <Button type="button" variant="accent" size="sm"
                      onClick={() => setStatus('approved')} disabled={isPending}>
                <CheckCircle2 className="ms-1 h-3.5 w-3.5" />
                אשר
              </Button>
            )}
            {approval.status !== 'changes_requested' && (
              <Button type="button" variant="outline" size="sm"
                      onClick={() => setStatus('changes_requested', true)} disabled={isPending}>
                <AlertCircle className="ms-1 h-3.5 w-3.5" />
                בקש תיקון
              </Button>
            )}
            {approval.status !== 'rejected' && isStudio && (
              <Button type="button" variant="outline" size="sm"
                      onClick={() => setStatus('rejected', true)} disabled={isPending}
                      className="text-red-600 hover:bg-red-50">
                <XCircle className="ms-1 h-3.5 w-3.5" />
                דחה
              </Button>
            )}
            {approval.status !== 'pending' && isStudio && (
              <Button type="button" variant="ghost" size="sm"
                      onClick={() => setStatus('pending')} disabled={isPending}>
                החזר ל-ממתין
              </Button>
            )}
            <button type="button" onClick={() => setOpen(o => !o)}
                    className="ms-auto inline-flex items-center gap-1 text-xs text-muted-fg hover:text-brand">
              <MessageCircle className="h-3.5 w-3.5" />
              {thread.messages.length} תגובות
              {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {canDelete && (
              <button type="button" onClick={handleDelete} disabled={isPending}
                      className="text-red-600 hover:text-red-700 disabled:opacity-30" aria-label="מחק">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {thread.id && (
            <div className="pt-1">
              <ThreadStatusPill status={thread.status} />
            </div>
          )}

          {showNote && (
            <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3">
              <Textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
                        placeholder="פרטו מה צריך לשנות..." />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm"
                        onClick={() => { setShowNote(false); setNote(''); }}>
                  ביטול
                </Button>
                <Button type="button" variant="accent" size="sm"
                        onClick={() => setStatus(approval.status === 'changes_requested' ? 'changes_requested' : 'rejected', true)}
                        disabled={isPending || !note.trim()}>
                  שמור
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-muted/20 p-4">
          <CommentThread
            projectId={projectId}
            projectSlug={projectSlug}
            thread={{ id: thread.id, status: thread.status }}
            messages={thread.messages}
            ensure={{
              projectId,
              contextType: 'approval',
              contextId: approval.id,
              workspace,
              title: approval.title,
            }}
            currentUserId={currentUserId}
            isStudio={isStudio}
            compact
          />
        </div>
      )}
    </article>
  );
}

interface CreateProps {
  projectId: string;
  projectSlug: string;
  workspace: string;
  isStudio: boolean;
}

export function CreateApprovalForm({ projectId, projectSlug, workspace, isStudio }: CreateProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isStudio) return null;

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const { createApproval } = await import('@/app/actions/client-workspace');
      const result = await createApproval({
        projectId, projectSlug, workspace,
        title, description: description || null, link_url: linkUrl || null,
      });
      if (!result.ok) { setError(result.error); return; }
      setTitle(''); setDescription(''); setLinkUrl(''); setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button type="button" variant="outline"
              onClick={() => setOpen(true)}
              className="w-full justify-center border-dashed py-3">
        + הוסיפו פריט לאישור
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
      <input value={title} onChange={e => setTitle(e.target.value)}
             placeholder="כותרת"
             className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
      <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                placeholder="תיאור (אופציונלי)" />
      <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} dir="ltr"
             placeholder="https:// (אופציונלי)"
             className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono" />
      {error && <div className="text-xs text-red-700">{error}</div>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>ביטול</Button>
        <Button type="button" variant="accent" onClick={handleSubmit}
                disabled={isPending || !title.trim()}>
          {isPending ? 'מוסיף...' : 'הוסף'}
        </Button>
      </div>
    </div>
  );
}


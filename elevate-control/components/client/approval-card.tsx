'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setApprovalStatus, deleteApproval, updateApproval } from '@/app/actions/client-workspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  CommentThread, type CommentMessage, ThreadStatusPill,
} from '@/components/client/comment-thread';
import {
  CheckCircle2, AlertCircle, XCircle, Clock,
  ExternalLink, MessageCircle, Trash2, Edit2, Save, X,
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
  metadata?: Record<string, unknown> | null;
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
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const meta0 = approval.metadata ?? {};
  const [editing, setEditing] = useState(false);
  const [editTitle,    setEditTitle]    = useState(approval.title);
  const [editDesc,     setEditDesc]     = useState(approval.description ?? '');
  const [editLink,     setEditLink]     = useState(approval.link_url ?? '');
  const [editDesktop,  setEditDesktop]  = useState((meta0.desktop_url as string | undefined) ?? '');
  const [editMobile,   setEditMobile]   = useState((meta0.mobile_url  as string | undefined) ?? '');

  const Icon = STATUS_ICONS[approval.status];
  const isDesign = workspace === 'design';

  function setStatus(next: ApprovalStatus) {
    setError(null);
    startTransition(async () => {
      const result = await setApprovalStatus(approval.id,
        { projectSlug, workspace }, next, null);
      if (!result.ok) setError(result.error);
      else { router.refresh(); }
    });
  }

  function saveEdit() {
    setError(null);
    const newMeta = isDesign
      ? { ...(approval.metadata ?? {}),
          desktop_url: editDesktop || null,
          mobile_url:  editMobile  || null }
      : approval.metadata;
    startTransition(async () => {
      const result = await updateApproval(approval.id, { projectSlug, workspace }, {
        title: editTitle,
        description: editDesc || null,
        link_url: isDesign ? null : (editLink || null),
        metadata: newMeta as never,
      });
      if (!result.ok) setError(result.error);
      else { setEditing(false); router.refresh(); }
    });
  }

  function cancelEdit() {
    setEditTitle(approval.title);
    setEditDesc(approval.description ?? '');
    setEditLink(approval.link_url ?? '');
    setEditDesktop((meta0.desktop_url as string | undefined) ?? '');
    setEditMobile((meta0.mobile_url  as string | undefined) ?? '');
    setEditing(false);
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
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="space-y-2">
                  <Input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                         placeholder="כותרת" />
                  <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2}
                            placeholder="תיאור (אופציונלי)" />
                  {isDesign ? (
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input value={editDesktop} dir="ltr" className="font-mono text-sm"
                             onChange={e => setEditDesktop(e.target.value)}
                             placeholder="🖥️ לינק דסקטופ" />
                      <Input value={editMobile} dir="ltr" className="font-mono text-sm"
                             onChange={e => setEditMobile(e.target.value)}
                             placeholder="📱 לינק מובייל" />
                    </div>
                  ) : (
                    <Input value={editLink} dir="ltr" className="font-mono text-sm"
                           onChange={e => setEditLink(e.target.value)}
                           placeholder="https:// (אופציונלי)" />
                  )}
                </div>
              ) : (
                <>
                  <h3 className="font-semibold">{approval.title}</h3>
                  {approval.description && (
                    <p className="mt-1 text-sm text-muted-fg">{approval.description}</p>
                  )}
                </>
              )}
            </div>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[approval.status]}`}>
              <Icon className="h-3 w-3" />
              {STATUS_LABELS[approval.status]}
            </span>
          </div>

          {!editing && (() => {
            const meta = approval.metadata ?? {};
            const desktop = (meta.desktop_url as string | undefined) ?? null;
            const mobile  = (meta.mobile_url  as string | undefined) ?? null;
            // Dual link: design workspace gets desktop + mobile pills
            if (desktop || mobile) {
              return (
                <div className="flex flex-wrap gap-2">
                  {desktop && (
                    <a href={desktop} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:border-brand">
                      🖥️ דסקטופ
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {mobile && (
                    <a href={mobile} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:border-brand">
                      📱 מובייל
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              );
            }
            if (approval.link_url) {
              return (
                <a href={approval.link_url} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" />
                  פתח קישור
                </a>
              );
            }
            return null;
          })()}

          {approval.status_note && (
            <p className="rounded-md bg-muted/50 p-2 text-xs italic">
              <span className="font-semibold">הערה: </span>{approval.status_note}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {editing ? (
              <>
                <Button type="button" variant="accent" size="sm"
                        onClick={saveEdit} disabled={isPending || !editTitle.trim()}>
                  <Save className="ms-1 h-3.5 w-3.5" />
                  שמור
                </Button>
                <Button type="button" variant="ghost" size="sm"
                        onClick={cancelEdit} disabled={isPending}>
                  <X className="ms-1 h-3.5 w-3.5" />
                  ביטול
                </Button>
              </>
            ) : (
              <>
            {approval.status !== 'approved' && (
              <Button type="button" variant="accent" size="sm"
                      onClick={() => setStatus('approved')} disabled={isPending}>
                <CheckCircle2 className="ms-1 h-3.5 w-3.5" />
                אשר
              </Button>
            )}
            {approval.status !== 'changes_requested' && (
              <Button type="button" variant="outline" size="sm"
                      onClick={() => setStatus('changes_requested')} disabled={isPending}>
                <AlertCircle className="ms-1 h-3.5 w-3.5" />
                בקש תיקון
              </Button>
            )}
            {approval.status !== 'pending' && isStudio && (
              <Button type="button" variant="ghost" size="sm"
                      onClick={() => setStatus('pending')} disabled={isPending}>
                החזר ל-ממתין
              </Button>
            )}
            {thread.messages.length > 0 && (
              <span className="ms-auto inline-flex items-center gap-1 text-xs text-muted-fg">
                <MessageCircle className="h-3.5 w-3.5" />
                {thread.messages.length} {thread.messages.length === 1 ? 'הודעה' : 'הודעות'}
              </span>
            )}
            {canDelete && (
              <>
                <button type="button" onClick={() => setEditing(true)} disabled={isPending}
                        className="text-muted-fg hover:text-brand disabled:opacity-30" aria-label="ערוך">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button type="button" onClick={handleDelete} disabled={isPending}
                        className="text-red-600 hover:text-red-700 disabled:opacity-30" aria-label="מחק">
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
              </>
            )}
          </div>

          {thread.id && (
            <div className="pt-1">
              <ThreadStatusPill status={thread.status} />
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Inline conversation — always visible. The composer supports
          screenshots (paste or upload), so 'request a fix' lives here
          rather than in a separate note dialog. */}
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
          composerPlaceholder={approval.status === 'changes_requested'
            ? 'הוסיפו עוד פרטים על התיקון...'
            : 'בקשו תיקון, הוסיפו צילומי מסך, או כתבו הערה...'}
        />
      </div>
    </article>
  );
}

interface CreateProps {
  projectId: string;
  projectSlug: string;
  workspace: string;
  isStudio: boolean;
  /** For workspaces that split approvals into multiple buckets (development:
   *  frontend vs cms). Forwarded to the create action. */
  kind?: string;
  /** Override the button label / form heading (e.g. "+ הוסיפו עמוד CMS"). */
  ctaLabel?: string;
}

export function CreateApprovalForm({ projectId, projectSlug, workspace, isStudio, kind, ctaLabel }: CreateProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [desktopUrl, setDesktopUrl] = useState('');
  const [mobileUrl, setMobileUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isStudio) return null;

  const isDesign = workspace === 'design';

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const { createApproval } = await import('@/app/actions/client-workspace');
      const metadata = isDesign && (desktopUrl || mobileUrl)
        ? { desktop_url: desktopUrl || null, mobile_url: mobileUrl || null }
        : null;
      const result = await createApproval({
        projectId, projectSlug, workspace,
        title, description: description || null,
        link_url: linkUrl || null,
        metadata: metadata ?? undefined,
        kind,
      });
      if (!result.ok) { setError(result.error); return; }
      setTitle(''); setDescription(''); setLinkUrl('');
      setDesktopUrl(''); setMobileUrl(''); setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button type="button" variant="outline"
              onClick={() => setOpen(true)}
              className="w-full justify-center border-dashed py-3">
        {ctaLabel ?? '+ הוסיפו פריט לאישור'}
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
      {isDesign ? (
        <div className="grid gap-2 md:grid-cols-2">
          <input value={desktopUrl} onChange={e => setDesktopUrl(e.target.value)} dir="ltr"
                 placeholder="🖥️ לינק דסקטופ"
                 className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono" />
          <input value={mobileUrl} onChange={e => setMobileUrl(e.target.value)} dir="ltr"
                 placeholder="📱 לינק מובייל"
                 className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono" />
        </div>
      ) : (
        <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} dir="ltr"
               placeholder="https:// (אופציונלי)"
               className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono" />
      )}
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


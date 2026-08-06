'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  setApprovalStatus, deleteApproval, updateApproval,
} from '@/app/actions/client-workspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CommentThread, type CommentMessage,
} from '@/components/client/comment-thread';
import {
  ExternalLink, MessageCircle, Trash2, Edit2, Save, X,
  Smartphone, Monitor, Link2,
} from 'lucide-react';
import type { Json } from '@/lib/supabase/database.types';

export type ApprovalStatus = 'pending' | 'approved' | 'changes_requested' | 'rejected';

export interface ApprovalRowData {
  id: string;
  workspace: string;
  title: string;
  description: string | null;
  link_url: string | null;
  status: ApprovalStatus;
  metadata: Json | null;
  kind?: string | null;
  /** Depth in the page tree — used to indent nested pages in the dev
   *  workspace so the list mirrors the studio site tree. */
  depth?: number;
  /** When true the row renders read-only — name only, no link, no status
   *  flip, no comments. Used in the dev workspace for pages that don't
   *  have a usable preview/CMS URL yet. */
  disabled?: boolean;
}

interface ThreadInfo {
  id: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'wont_fix';
  messages: CommentMessage[];
}

interface Props {
  approvals: ApprovalRowData[];
  threadByApproval: Map<string, ThreadInfo>;
  projectId: string;
  projectSlug: string;
  workspace: string;
  currentUserId: string;
  isStudio: boolean;
  /** When true, each row shows desktop + mobile pills. Otherwise single link. */
  dualLinks?: boolean;
}

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending:           'ממתין לפידבק לקוח',
  approved:          'אושר',
  changes_requested: 'תיקון',
  rejected:          'נדחה',
};

const STATUS_PILL: Record<ApprovalStatus, string> = {
  pending:           'bg-blue-100 text-blue-700  border-blue-200',
  approved:          'bg-green-100 text-green-700 border-green-200',
  changes_requested: 'bg-amber-100 text-amber-800 border-amber-200',
  rejected:          'bg-red-100 text-red-700  border-red-200',
};

export function ApprovalsTable({
  approvals, threadByApproval, projectId, projectSlug, workspace,
  currentUserId, isStudio, dualLinks = false,
}: Props) {
  if (approvals.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-fg">
        עדיין לא הוספו עמודים. השתמשו בטופס למעלה כדי להוסיף.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <ul className="divide-y divide-border">
        {approvals.map(a => (
          <ApprovalTableRow
            key={a.id}
            approval={a}
            thread={threadByApproval.get(a.id) ?? { id: null, status: 'open', messages: [] }}
            projectId={projectId}
            projectSlug={projectSlug}
            workspace={workspace}
            currentUserId={currentUserId}
            isStudio={isStudio}
            dualLinks={dualLinks}
          />
        ))}
      </ul>
    </div>
  );
}

function ApprovalTableRow({
  approval, thread, projectId, projectSlug, workspace,
  currentUserId, isStudio, dualLinks,
}: {
  approval: ApprovalRowData;
  thread: ThreadInfo;
  projectId: string;
  projectSlug: string;
  workspace: string;
  currentUserId: string;
  isStudio: boolean;
  dualLinks: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showThread, setShowThread] = useState(false);
  const [editing, setEditing] = useState(false);

  const meta0 = approval.metadata as Record<string, unknown> | null;
  const desktopUrl = (meta0?.desktop_url as string | undefined) ?? null;
  const mobileUrl  = (meta0?.mobile_url  as string | undefined) ?? null;

  const [t,  setT]  = useState(approval.title);
  const [d,  setD]  = useState(approval.description ?? '');
  const [u,  setU]  = useState(approval.link_url ?? '');
  const [du, setDu] = useState(desktopUrl ?? '');
  const [mu, setMu] = useState(mobileUrl  ?? '');

  function setStatus(next: ApprovalStatus) {
    startTransition(async () => {
      await setApprovalStatus(approval.id, { projectSlug, workspace }, next, null);
      router.refresh();
    });
  }

  function saveEdit() {
    const newMeta = dualLinks
      ? { ...(meta0 ?? {}), desktop_url: du || null, mobile_url: mu || null }
      : (meta0 ?? {});
    startTransition(async () => {
      await updateApproval(approval.id, { projectSlug, workspace }, {
        title: t,
        description: d || null,
        link_url: dualLinks ? null : (u || null),
        metadata: newMeta as never,
      });
      setEditing(false);
      router.refresh();
    });
  }

  function cancelEdit() {
    setT(approval.title);
    setD(approval.description ?? '');
    setU(approval.link_url ?? '');
    setDu(desktopUrl ?? '');
    setMu(mobileUrl  ?? '');
    setEditing(false);
  }

  function handleDelete() {
    if (!confirm('למחוק את הפריט?')) return;
    startTransition(async () => {
      await deleteApproval(approval.id, { projectSlug, workspace });
      router.refresh();
    });
  }

  const messageCount = thread.messages.length;
  const disabled = approval.disabled === true;

  // Disabled row — page exists in the tree but no link to view it. Render
  // a stripped-down read-only version, no status flip, no comments.
  const depth = approval.depth ?? 0;
  const treeConnector = depth > 0 ? <TreeConnector depth={depth} /> : null;

  if (disabled) {
    return (
      <li>
        <div className="flex items-center gap-2 px-3 py-2 opacity-60">
          {treeConnector}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-muted-fg">{approval.title}</p>
            <p className="text-[11px] text-muted-fg italic">
              ממתין ללינק תצוגה — יוצג כשיהיה זמין
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-500">
            ללא לינק
          </span>
        </div>
      </li>
    );
  }

  return (
    <li>
      <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30">
        {treeConnector}
        {/* Title + description */}
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-1.5">
              <Input value={t} onChange={e => setT(e.target.value)} className="h-8 text-sm" />
              <Input value={d} onChange={e => setD(e.target.value)} className="h-8 text-xs" placeholder="תיאור" />
              {dualLinks ? (
                <div className="grid grid-cols-2 gap-1.5">
                  <Input value={du} dir="ltr" className="h-8 font-mono text-xs"
                         onChange={e => setDu(e.target.value)} placeholder="🖥️ דסקטופ" />
                  <Input value={mu} dir="ltr" className="h-8 font-mono text-xs"
                         onChange={e => setMu(e.target.value)} placeholder="📱 מובייל" />
                </div>
              ) : (
                <Input value={u} dir="ltr" className="h-8 font-mono text-xs"
                       onChange={e => setU(e.target.value)} placeholder="https://..." />
              )}
            </div>
          ) : (
            <>
              <p className="truncate text-sm font-medium">{approval.title}</p>
              {approval.description && (
                <p className="truncate text-xs text-muted-fg">{approval.description}</p>
              )}
            </>
          )}
        </div>

        {/* Link icons */}
        {!editing && (
          <div className="flex shrink-0 items-center gap-1">
            {dualLinks ? (
              <>
                {desktopUrl && (
                  <a href={desktopUrl} target="_blank" rel="noopener noreferrer"
                     className="rounded p-1.5 text-muted-fg hover:bg-muted hover:text-brand"
                     aria-label="דסקטופ" title="דסקטופ">
                    <Monitor className="h-4 w-4" />
                  </a>
                )}
                {mobileUrl && (
                  <a href={mobileUrl} target="_blank" rel="noopener noreferrer"
                     className="rounded p-1.5 text-muted-fg hover:bg-muted hover:text-brand"
                     aria-label="מובייל" title="מובייל">
                    <Smartphone className="h-4 w-4" />
                  </a>
                )}
              </>
            ) : (
              approval.link_url && (
                <a href={approval.link_url} target="_blank" rel="noopener noreferrer"
                   className="rounded p-1.5 text-muted-fg hover:bg-muted hover:text-brand"
                   aria-label="פתח לינק" title="פתח לינק">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )
            )}
            {!dualLinks && !approval.link_url && (
              <span className="rounded p-1.5 text-zinc-300" title="אין לינק">
                <Link2 className="h-4 w-4" />
              </span>
            )}
          </div>
        )}

        {/* Status select */}
        {!editing && (
          <select value={approval.status}
                  onChange={e => setStatus(e.target.value as ApprovalStatus)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium focus:outline-none ${STATUS_PILL[approval.status]}`}>
            {(Object.keys(STATUS_LABELS) as ApprovalStatus[])
              .filter(s => s !== 'rejected' || approval.status === 'rejected')
              .map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
          </select>
        )}

        {/* Comments toggle */}
        {!editing && (
          <button type="button" onClick={() => setShowThread(o => !o)}
                  className={`relative shrink-0 rounded p-1.5 text-muted-fg hover:bg-muted hover:text-brand ${showThread ? 'bg-muted text-brand' : ''}`}
                  aria-label="תגובות" title="תגובות">
            <MessageCircle className="h-4 w-4" />
            {messageCount > 0 && (
              <span className="absolute -top-1 -end-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-medium text-white">
                {messageCount}
              </span>
            )}
          </button>
        )}

        {/* Studio actions */}
        {isStudio && (
          editing ? (
            <>
              <button type="button" onClick={saveEdit}
                      className="shrink-0 rounded p-1.5 text-green-600 hover:bg-green-50"
                      aria-label="שמור">
                <Save className="h-4 w-4" />
              </button>
              <button type="button" onClick={cancelEdit}
                      className="shrink-0 rounded p-1.5 text-zinc-600 hover:bg-zinc-100"
                      aria-label="ביטול">
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setEditing(true)}
                      className="shrink-0 rounded p-1.5 text-muted-fg hover:bg-muted hover:text-brand"
                      aria-label="ערוך">
                <Edit2 className="h-4 w-4" />
              </button>
              {/* Dev rows are page-tree-driven — delete here would create
                   orphans. Hide only for the development workspace. */}
              {workspace !== 'development' && (
                <button type="button" onClick={handleDelete}
                        className="shrink-0 rounded p-1.5 text-red-600 hover:bg-red-50"
                        aria-label="מחק">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </>
          )
        )}
      </div>

      {showThread && !editing && (
        <div className="border-t border-border bg-muted/20 px-3 py-3">
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
            composerPlaceholder="בקשו תיקון, הוסיפו צילומי מסך, או כתבו הערה..."
          />
        </div>
      )}
    </li>
  );
}

/** Tree-style "└" connector rendered before nested rows so the
 *  hierarchy is visible (matches the studio page tree). The vertical
 *  trunk is full-height; the horizontal stub meets the row at its
 *  vertical center. RTL-safe via logical positioning. */
function TreeConnector({ depth }: { depth: number }) {
  const STEP = 20;
  return (
    <div
      aria-hidden
      className="relative shrink-0 self-stretch"
      style={{ width: `${depth * STEP}px` }}
    >
      <div
        className="absolute top-0 bottom-0 w-px bg-border"
        style={{ insetInlineStart: `${(depth - 1) * STEP + STEP / 2}px` }}
      />
      <div
        className="absolute top-1/2 h-px bg-border"
        style={{
          insetInlineStart: `${(depth - 1) * STEP + STEP / 2}px`,
          width: `${STEP / 2}px`,
        }}
      />
    </div>
  );
}

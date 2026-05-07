import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, ExternalLink } from 'lucide-react';
import { WORKSPACE_BY_SLUG } from '@/lib/client-workspaces';

interface Props { projectId: string; projectSlug: string }

interface ThreadRow {
  id: string;
  workspace: string | null;
  context_type: string;
  context_id: string | null;
  status: string;
  title: string | null;
  updated_at: string;
}

interface ApprovalRow {
  id: string;
  title: string;
  workspace: string;
}

export async function ClientCommentsFeed({ projectId, projectSlug }: Props) {
  const supabase = await createClient();

  // Pull threads with at least one message in the last 30 days, ordered by updated_at
  const { data: threadsData } = await supabase
    .from('comment_threads')
    .select('id, workspace, context_type, context_id, status, title, updated_at')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false })
    .limit(30);
  const threads = (threadsData ?? []) as ThreadRow[];
  if (threads.length === 0) return null;

  // For approval threads, resolve title from client_approvals
  const approvalIds = threads
    .filter(t => t.context_type === 'approval' && t.context_id)
    .map(t => t.context_id!) as string[];
  const { data: approvalsData } = approvalIds.length
    ? await supabase
        .from('client_approvals')
        .select('id, title, workspace')
        .in('id', approvalIds)
    : { data: [] as ApprovalRow[] };
  const approvalById = new Map((approvalsData ?? []).map(a => [a.id, a]));

  // Latest message per thread (one query, then map)
  const threadIds = threads.map(t => t.id);
  const { data: lastMsgsData } = await supabase
    .from('comment_messages')
    .select('id, thread_id, body, author_label, created_at')
    .in('thread_id', threadIds)
    .order('created_at', { ascending: false })
    .limit(threadIds.length * 5); // generous; we'll dedupe
  const lastByThread = new Map<string, { body: string; author: string | null; at: string }>();
  for (const m of (lastMsgsData ?? []) as { thread_id: string; body: string; author_label: string | null; created_at: string }[]) {
    if (!lastByThread.has(m.thread_id)) {
      lastByThread.set(m.thread_id, { body: m.body, author: m.author_label, at: m.created_at });
    }
  }

  const enriched = threads
    .filter(t => lastByThread.has(t.id))
    .map(t => {
      const approval = t.context_id ? approvalById.get(t.context_id) : null;
      const workspace = (t.workspace ?? approval?.workspace ?? null);
      const wsMeta = workspace ? WORKSPACE_BY_SLUG[workspace as keyof typeof WORKSPACE_BY_SLUG] : null;
      return {
        id: t.id, status: t.status,
        title: t.title ?? approval?.title ?? wsMeta?.label ?? 'תגובה',
        workspace, wsLabel: wsMeta?.label ?? workspace ?? '',
        wsEmoji: wsMeta?.emoji ?? '💬',
        last: lastByThread.get(t.id)!,
      };
    });

  if (enriched.length === 0) return null;

  // Bubble unresolved threads to the top
  enriched.sort((a, b) => {
    const aOpen = a.status !== 'resolved' && a.status !== 'wont_fix';
    const bOpen = b.status !== 'resolved' && b.status !== 'wont_fix';
    if (aOpen !== bOpen) return aOpen ? -1 : 1;
    return new Date(b.last.at).getTime() - new Date(a.last.at).getTime();
  });

  const open = enriched.filter(e => e.status === 'open' || e.status === 'in_progress').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          תגובות מהלקוח
        </CardTitle>
        <CardDescription>
          {open > 0 ? `${open} פתוחות` : 'אין הערות פתוחות'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {enriched.slice(0, 10).map(e => {
            const date = new Date(e.last.at).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
            return (
              <li key={e.id} className="rounded-md border border-border bg-background p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-medium">
                      <span>{e.wsEmoji}</span>
                      <span className="truncate">{e.title}</span>
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-fg">
                      <span className="font-semibold">{e.last.author ?? 'משתמש'}: </span>
                      {e.last.body || '(קובץ מצורף)'}
                    </p>
                    <p className="mt-1 text-xs text-muted-fg">{e.wsLabel} · {date}</p>
                  </div>
                  {e.workspace && (
                    <Link href={`/client/${projectSlug}/${e.workspace}`}
                          className="shrink-0 text-brand hover:underline" aria-label="פתח">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

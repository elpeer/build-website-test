import { createClient } from '@/lib/supabase/server';
import { ApprovalCard, CreateApprovalForm, type ApprovalCardData, type ApprovalStatus } from './approval-card';
import { CommentThread, type CommentMessage } from './comment-thread';
import { Checklist, type ChecklistItemRow, type ChecklistStatus } from './checklist';
import { FilesList, type ProjectFileRow } from './files-list';
import { WorkspaceSettingInput } from './workspace-setting-input';
import { Lock } from 'lucide-react';
import type { WorkspaceSlug, WorkspaceMeta } from '@/lib/client-workspaces';
import type { Json } from '@/lib/supabase/database.types';

interface Args {
  projectId: string;
  projectSlug: string;
  workspace: WorkspaceMeta;
  workspaceSettings: Record<string, string | null>;
  currentUserId: string;
  isStudio: boolean;
}

interface ApprovalRow {
  id: string;
  workspace: string;
  title: string;
  description: string | null;
  link_url: string | null;
  thumbnail_url: string | null;
  status: ApprovalStatus;
  status_note: string | null;
  status_changed_at: string | null;
  position: number;
}
interface ThreadRow {
  id: string;
  context_type: string;
  context_id: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'wont_fix';
}

async function fetchWorkspaceData(projectId: string, workspaceSlug: WorkspaceSlug) {
  const supabase = await createClient();

  const [{ data: approvalsData }, { data: checklistData }, { data: filesData }] = await Promise.all([
    supabase.from('client_approvals')
      .select('id, workspace, title, description, link_url, thumbnail_url, status, status_note, status_changed_at, position')
      .eq('project_id', projectId).eq('workspace', workspaceSlug)
      .order('position', { ascending: true }),
    supabase.from('checklist_items')
      .select('id, workspace, title, description, link_url, input_type, input_value, attachment_url, status, position')
      .eq('project_id', projectId).eq('workspace', workspaceSlug)
      .order('position', { ascending: true }),
    supabase.from('project_files')
      .select('id, filename, storage_path, file_url, mime_type, size_bytes, notes, created_at')
      .eq('project_id', projectId).eq('workspace', workspaceSlug)
      .order('created_at', { ascending: false }),
  ]);

  const approvals = (approvalsData ?? []) as ApprovalRow[];
  const checklist = (checklistData ?? []) as ChecklistItemRow[];
  const files     = (filesData     ?? []) as ProjectFileRow[];

  // Threads for these approvals + the workspace-level thread
  const approvalIds = approvals.map(a => a.id);
  const { data: threadsData } = await supabase
    .from('comment_threads')
    .select('id, context_type, context_id, status')
    .eq('project_id', projectId)
    .or(
      [
        approvalIds.length ? `and(context_type.eq.approval,context_id.in.(${approvalIds.join(',')}))` : null,
        `and(context_type.eq.workspace,workspace.eq.${workspaceSlug})`,
      ].filter(Boolean).join(',')
    );
  const threads = (threadsData ?? []) as ThreadRow[];
  const threadByApproval = new Map<string, ThreadRow>();
  let workspaceThread: ThreadRow | null = null;
  for (const t of threads) {
    if (t.context_type === 'approval' && t.context_id) threadByApproval.set(t.context_id, t);
    if (t.context_type === 'workspace') workspaceThread = t;
  }

  const allThreadIds = threads.map(t => t.id);
  const { data: messagesData } = allThreadIds.length
    ? await supabase
        .from('comment_messages')
        .select('id, thread_id, author_id, author_label, body, attachments, created_at')
        .in('thread_id', allThreadIds)
        .order('created_at', { ascending: true })
    : { data: [] as (CommentMessage & { thread_id: string })[] };
  const messages = (messagesData ?? []) as (CommentMessage & { thread_id: string; attachments: Json })[];
  const messagesByThread = new Map<string, CommentMessage[]>();
  for (const m of messages) {
    const arr = messagesByThread.get(m.thread_id) ?? [];
    arr.push({
      id: m.id, author_id: m.author_id, author_label: m.author_label,
      body: m.body,
      attachments: Array.isArray(m.attachments) ? (m.attachments as unknown as CommentMessage['attachments']) : [],
      created_at: m.created_at,
    });
    messagesByThread.set(m.thread_id, arr);
  }

  return { approvals, checklist, files, threadByApproval, workspaceThread, messagesByThread };
}

export async function WorkspaceContent({
  projectId, projectSlug, workspace, workspaceSettings, currentUserId, isStudio,
}: Args) {
  const data = await fetchWorkspaceData(projectId, workspace.slug);

  const approvalCards = data.approvals.map(a => {
    const thread = data.threadByApproval.get(a.id);
    return (
      <ApprovalCard key={a.id}
        approval={a as ApprovalCardData}
        thread={{
          id: thread?.id ?? null,
          status: thread?.status ?? 'open',
          messages: thread ? (data.messagesByThread.get(thread.id) ?? []) : [],
        }}
        projectId={projectId} projectSlug={projectSlug} workspace={workspace.slug}
        currentUserId={currentUserId} isStudio={isStudio}
        canDelete={isStudio}
      />
    );
  });

  // Default workspace-thread placeholder for general comments (always render so client can chat)
  const workspaceCommentSection = (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-fg">
        תגובות כלליות לשלב
      </h3>
      <CommentThread
        projectId={projectId} projectSlug={projectSlug}
        thread={{
          id: data.workspaceThread?.id ?? null,
          status: data.workspaceThread?.status ?? 'open',
        }}
        messages={data.workspaceThread ? (data.messagesByThread.get(data.workspaceThread.id) ?? []) : []}
        ensure={{
          projectId, contextType: 'workspace',
          workspace: workspace.slug,
          title: `תגובות כלליות — ${workspace.label}`,
        }}
        currentUserId={currentUserId} isStudio={isStudio}
      />
    </div>
  );

  // ─── Workspace-specific composition ─────────────────────────────────
  switch (workspace.slug) {
    case 'finance':
      return (
        <div className="space-y-6">
          <SectionHeader title="הצעות מחיר וחשבוניות" />
          <FilesList projectId={projectId} projectSlug={projectSlug} workspace="finance"
                     files={data.files} isStudio={isStudio} />
          <SectionHeader title="פריטים לאישור" />
          <div className="space-y-3">
            {approvalCards}
            <CreateApprovalForm projectId={projectId} projectSlug={projectSlug}
                                workspace="finance" isStudio={isStudio} />
          </div>
          {workspaceCommentSection}
        </div>
      );

    case 'spec':
      return (
        <div className="space-y-6">
          <SectionHeader title="מסמכי אפיון" subtitle="העלו / הורידו מסמכים, סיכומי שיחה, מסמכי אפיון טכני" />
          <FilesList projectId={projectId} projectSlug={projectSlug} workspace="spec"
                     files={data.files} isStudio={isStudio} />
          <SectionHeader title="צעדים נדרשים" />
          <Checklist projectId={projectId} projectSlug={projectSlug} workspace="spec"
                     items={data.checklist} isStudio={isStudio} />
          {workspaceCommentSection}
        </div>
      );

    case 'design':
      return (
        <div className="space-y-6">
          <WorkspaceSettingInput
            projectId={projectId} projectSlug={projectSlug}
            workspace="design" settingKey="figma_url"
            label="לינק לפיגמה" placeholder="https://www.figma.com/file/..."
            currentValue={workspaceSettings.figma_url ?? null}
            isStudio={isStudio} isUrl />
          <SectionHeader title="Brand Book ומסמכים" />
          <FilesList projectId={projectId} projectSlug={projectSlug} workspace="design"
                     files={data.files} isStudio={isStudio} />
          <SectionHeader title="עמודי עיצוב לאישור" subtitle="לכל עמוד: סטטוס, הערות והפניה לפיגמה" />
          <div className="space-y-3">
            {approvalCards}
            <CreateApprovalForm projectId={projectId} projectSlug={projectSlug}
                                workspace="design" isStudio={isStudio} />
          </div>
          {workspaceCommentSection}
        </div>
      );

    case 'development':
      return (
        <div className="space-y-6">
          <WorkspaceSettingInput
            projectId={projectId} projectSlug={projectSlug}
            workspace="development" settingKey="cms_url"
            label="לינק ל-CMS" placeholder="https://staging-site.com/wp-admin"
            currentValue={workspaceSettings.cms_url ?? null}
            isStudio={isStudio} isUrl />
          <SectionHeader title="עמודי פיתוח לאישור" subtitle="לחצו על הקישור לבדיקה, ואז אשרו או בקשו תיקון" />
          <div className="space-y-3">
            {approvalCards}
            <CreateApprovalForm projectId={projectId} projectSlug={projectSlug}
                                workspace="development" isStudio={isStudio} />
          </div>
          <SectionHeader title="Q&A" />
          {workspaceCommentSection}
        </div>
      );

    case 'qa':
      return (
        <div className="space-y-6">
          <WorkspaceSettingInput
            projectId={projectId} projectSlug={projectSlug}
            workspace="qa" settingKey="clickup_url"
            label="לינק ל-ClickUp" placeholder="https://app.clickup.com/..."
            currentValue={workspaceSettings.clickup_url ?? null}
            isStudio={isStudio} isUrl />
          <SectionHeader title="Checklist בדיקות" />
          <Checklist projectId={projectId} projectSlug={projectSlug} workspace="qa"
                     items={data.checklist} isStudio={isStudio} />
          <SectionHeader title="דיווח באגים והערות" subtitle="כתבו את הבעיה, הוסיפו צילום מסך — ננהל את התיקון מכאן" />
          {workspaceCommentSection}
          <SectionHeader title="קבצים מצורפים" />
          <FilesList projectId={projectId} projectSlug={projectSlug} workspace="qa"
                     files={data.files} isStudio={isStudio} />
        </div>
      );

    case 'content':
      return (
        <div className="space-y-6">
          <SectionHeader title="חומרים שצריך לקבל" />
          <Checklist projectId={projectId} projectSlug={projectSlug} workspace="content"
                     items={data.checklist} isStudio={isStudio} />
          <SectionHeader title="העלאות תוכן" subtitle="תמונות, וידאו, מסמכים, טקסטים" />
          <FilesList projectId={projectId} projectSlug={projectSlug} workspace="content"
                     files={data.files} isStudio={isStudio} />
          {workspaceCommentSection}
        </div>
      );

    case 'integrations':
      return (
        <div className="space-y-6">
          <SectionHeader title="אינטגרציות" subtitle="לכל פריט: הסבר, מקום למפתחות / קוד / קבצים" />
          <Checklist projectId={projectId} projectSlug={projectSlug} workspace="integrations"
                     items={data.checklist} isStudio={isStudio} />
          <SectionHeader title="קבצים מצורפים" />
          <FilesList projectId={projectId} projectSlug={projectSlug} workspace="integrations"
                     files={data.files} isStudio={isStudio} />
          {workspaceCommentSection}
        </div>
      );

    case 'launch':
      return (
        <div className="space-y-6">
          <WorkspaceSettingInput
            projectId={projectId} projectSlug={projectSlug}
            workspace="launch" settingKey="domain"
            label="דומיין סופי" placeholder="example.com"
            currentValue={workspaceSettings.domain ?? null}
            isStudio={isStudio} />
          <WorkspaceSettingInput
            projectId={projectId} projectSlug={projectSlug}
            workspace="launch" settingKey="launch_at"
            label="תאריך ושעת עליה" placeholder="YYYY-MM-DD HH:MM"
            currentValue={workspaceSettings.launch_at ?? null}
            isStudio={isStudio} />
          <SectionHeader title="Checklist עליה לאוויר" />
          <Checklist projectId={projectId} projectSlug={projectSlug} workspace="launch"
                     items={data.checklist} isStudio={isStudio} />
          {workspaceCommentSection}
        </div>
      );

    case 'training':
      return (
        <div className="space-y-6">
          <SectionHeader title="מדריכים וקבצים" />
          <FilesList projectId={projectId} projectSlug={projectSlug} workspace="training"
                     files={data.files} isStudio={isStudio} />
          <SectionHeader title="Checklist לימודי" />
          <Checklist projectId={projectId} projectSlug={projectSlug} workspace="training"
                     items={data.checklist} isStudio={isStudio} />
          <SectionHeader title="שאלות ותשובות" />
          {workspaceCommentSection}
        </div>
      );

    default:
      return (
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-muted-fg" />
          <p className="mt-2 text-sm text-muted-fg">workspace לא מוכר</p>
        </div>
      );
  }
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h3 className="text-base font-semibold">{title}</h3>
      {subtitle && <p className="mt-0.5 text-sm text-muted-fg">{subtitle}</p>}
    </div>
  );
}

// Re-export referenced types so the workspace page can build the args
export type { ChecklistStatus };

import { createClient } from '@/lib/supabase/server';
import { CreateApprovalForm, type ApprovalStatus } from './approval-card';
import { ApprovalsTable, type ApprovalRowData } from './approvals-table';
import { DevApprovalsTabs } from './dev-approvals-tabs';
import { CommentThread, type CommentMessage } from './comment-thread';
import { Checklist, type ChecklistItemRow, type ChecklistStatus } from './checklist';
import { FilesList, type ProjectFileRow } from './files-list';
import { LinksList, type ProjectLinkRow } from './links-list';
import { WorkspaceSettingInput } from './workspace-setting-input';
import { ClientNotes } from './client-notes';
import { CmsCredentials } from './cms-credentials';
import { QaSeedButton } from './qa-seed-button';
import { SupportTickets, type TicketRow } from './support-tickets';
import { GuidesList, type GuideListItem } from './guides-list';
import { Lock } from 'lucide-react';
import type { WorkspaceMeta } from '@/lib/client-workspaces';
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
  metadata: Json | null;
  kind: string | null;
  position: number;
}
interface ThreadRow {
  id: string;
  context_type: string;
  context_id: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'wont_fix';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string | null;
  created_at: string;
  updated_at: string;
}
interface FileRow extends ProjectFileRow {
  category: string | null;
}
interface LinkRow extends ProjectLinkRow {
  category: string | null;
}

async function fetchWorkspaceData(projectId: string, workspaceSlug: string) {
  const supabase = await createClient();

  const [
    { data: approvalsData }, { data: checklistData }, { data: filesData }, { data: linksData },
  ] = await Promise.all([
    supabase.from('client_approvals')
      .select('id, workspace, title, description, link_url, thumbnail_url, status, status_note, status_changed_at, metadata, kind, position')
      .eq('project_id', projectId).eq('workspace', workspaceSlug)
      .order('position', { ascending: true }),
    supabase.from('checklist_items')
      .select('id, workspace, title, description, link_url, input_type, input_value, client_note, amount_cents, attachment_url, status, position')
      .eq('project_id', projectId).eq('workspace', workspaceSlug)
      .order('position', { ascending: true }),
    supabase.from('project_files')
      .select('id, workspace, category, filename, storage_path, file_url, mime_type, size_bytes, notes, created_at')
      .eq('project_id', projectId).eq('workspace', workspaceSlug)
      .order('created_at', { ascending: false }),
    supabase.from('project_links')
      .select('id, workspace, category, url, label, created_at')
      .eq('project_id', projectId).eq('workspace', workspaceSlug)
      .order('created_at', { ascending: false }),
  ]);

  const approvals = (approvalsData ?? []) as ApprovalRow[];
  const checklist = (checklistData ?? []) as ChecklistItemRow[];
  const files     = (filesData     ?? []) as FileRow[];
  const links     = (linksData     ?? []) as LinkRow[];

  // Threads in this project for these contexts (approvals, workspace, tickets)
  const approvalIds = approvals.map(a => a.id);
  const inFilter = approvalIds.length ? approvalIds.join(',') : null;
  const orParts = [
    inFilter ? `and(context_type.eq.approval,context_id.in.(${inFilter}))` : null,
    `and(context_type.eq.workspace,workspace.eq.${workspaceSlug})`,
    `and(context_type.eq.ticket,workspace.eq.${workspaceSlug})`,
  ].filter(Boolean).join(',');

  const { data: threadsData } = await supabase
    .from('comment_threads')
    .select('id, context_type, context_id, status, priority, title, created_at, updated_at')
    .eq('project_id', projectId)
    .or(orParts)
    .order('updated_at', { ascending: false });
  const threads = (threadsData ?? []) as ThreadRow[];

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

  const threadByApproval = new Map<string, ThreadRow>();
  let workspaceThread: ThreadRow | null = null;
  const tickets: ThreadRow[] = [];
  for (const t of threads) {
    if (t.context_type === 'approval' && t.context_id) threadByApproval.set(t.context_id, t);
    if (t.context_type === 'workspace') workspaceThread = t;
    if (t.context_type === 'ticket')    tickets.push(t);
  }

  return {
    approvals, checklist, files, links,
    threadByApproval, workspaceThread, tickets, messagesByThread,
  };
}

export async function WorkspaceContent({
  projectId, projectSlug, workspace, workspaceSettings, currentUserId, isStudio,
}: Args) {
  const data = await fetchWorkspaceData(projectId, workspace.slug);

  // Build a Map<approvalId, {id,status,messages}> for the compact tables.
  const approvalThreadInfo = new Map<string, { id: string | null; status: 'open' | 'in_progress' | 'resolved' | 'wont_fix'; messages: CommentMessage[] }>();
  for (const a of data.approvals) {
    const thread = data.threadByApproval.get(a.id);
    approvalThreadInfo.set(a.id, {
      id: thread?.id ?? null,
      status: thread?.status ?? 'open',
      messages: thread ? (data.messagesByThread.get(thread.id) ?? []) : [],
    });
  }
  function toApprovalRowData(a: ApprovalRow): ApprovalRowData {
    return {
      id: a.id, workspace: a.workspace, title: a.title,
      description: a.description, link_url: a.link_url,
      status: a.status, metadata: a.metadata, kind: a.kind,
    };
  }

  // Workspace-level comments (used by most workspaces)
  const workspaceCommentSection = (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-fg">
        תגובות ושיחות כלליות
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

  // Files & links filtered by category
  const filesByCategory = (cat: string) => data.files.filter(f => f.category === cat);
  const filesNoCategory = data.files.filter(f => !f.category);
  const linksByCategory = (cat: string) => data.links.filter(l => l.category === cat);

  switch (workspace.slug) {
    // ─── FINANCE — studio-managed, client read+comment ─────────────────
    case 'finance':
      return (
        <div className="space-y-6">
          <SectionHeader title="הצעת מחיר לעיון"
                         subtitle="הצעת המחיר ששלחנו אליכם — צפו, ואחרי שתחזירו אותה חתומה היא תופיע למטה." />
          <FilesList projectId={projectId} projectSlug={projectSlug} workspace="finance"
                     category="proposed_quote"
                     files={filesByCategory('proposed_quote')}
                     isStudio={isStudio}
                     clientCanUpload={false}
                     title="הצעת מחיר"
                     emptyText="טרם הועלתה הצעת מחיר." />

          <SectionHeader title="הצעת מחיר חתומה"
                         subtitle="הגרסה החתומה — אפשר להעלות אותה בעצמכם או שנעלה כשנקבל אותה במייל." />
          <FilesList projectId={projectId} projectSlug={projectSlug} workspace="finance"
                     category="signed_quote"
                     files={filesByCategory('signed_quote')}
                     isStudio={isStudio}
                     clientCanUpload clientCanDelete={false}
                     title="הצעות מחיר חתומות"
                     emptyText="טרם הועלתה הצעת מחיר חתומה" />

          <SectionHeader title="שלבי תשלום וסטטוס"
                         subtitle="המקדמה, יתרת התשלומים, סכום וחשבונית — הכל לכל שלב במקום אחד." />
          <Checklist projectId={projectId} projectSlug={projectSlug} workspace="finance"
                     items={data.checklist} isStudio={isStudio}
                     clientCanAddItems={false}
                     showAmountField />
        </div>
      );

    // ─── SPEC — studio docs + client materials + client notes ─────────
    case 'spec':
      return (
        <div className="space-y-6">
          <SectionHeader title="סיכום ראיון העומק" subtitle="המסמך שסיכם הצוות אחרי הפגישה" />
          <FilesList projectId={projectId} projectSlug={projectSlug} workspace="spec"
                     category="interview_summary"
                     files={filesByCategory('interview_summary')}
                     isStudio={isStudio} clientCanUpload={false}
                     title="סיכום ראיון"
                     emptyText="טרם הועלה סיכום." />
          <WorkspaceSettingInput projectId={projectId} projectSlug={projectSlug}
                                 workspace="spec" settingKey="interview_summary_url"
                                 label="לינק לסיכום (במקום קובץ)" placeholder="https://..."
                                 currentValue={workspaceSettings.interview_summary_url ?? null}
                                 isStudio={isStudio} isUrl />

          <SectionHeader title="מסמך אפיון תוכן" />
          <FilesList projectId={projectId} projectSlug={projectSlug} workspace="spec"
                     category="content_spec"
                     files={filesByCategory('content_spec')}
                     isStudio={isStudio} clientCanUpload={false}
                     title="אפיון תוכן"
                     emptyText="טרם הועלה." />

          <SectionHeader title="חומרים מהלקוח"
                         subtitle="לוגו, ספר מותג, תמונות — אפשר להעלות קבצים או לצרף לינקים (Google Drive, Dropbox וכו׳)" />
          <FilesList projectId={projectId} projectSlug={projectSlug} workspace="spec"
                     category="client_materials"
                     files={filesByCategory('client_materials')}
                     isStudio={isStudio} clientCanUpload clientCanDelete
                     title="קבצים שהועלו"
                     emptyText="עדיין לא הועלו קבצים." />
          <LinksList projectId={projectId} projectSlug={projectSlug} workspace="spec"
                     category="client_materials"
                     links={linksByCategory('client_materials')}
                     isStudio={isStudio} clientCanEdit />

          <SectionHeader title="הערות הלקוח" />
          <ClientNotes projectId={projectId} projectSlug={projectSlug}
                       workspace="spec" settingKey="client_notes"
                       label="הערות, דרישות, מחשבות"
                       placeholder="כתבו פה כל מה שחשוב לכם — דרישות מיוחדות, השראות, גבולות, פרסונות..."
                       initialValue={workspaceSettings.client_notes ?? null}
                       canEdit={!isStudio || true /* studio also can edit */} />
        </div>
      );

    // ─── DESIGN — studio uploads design page links (desktop + mobile) ──
    case 'design':
      return (
        <div className="space-y-6">
          <SectionHeader title="Brand Book ומסמכים"
                         subtitle="קבצי שפה ויזואלית, פונטים, צבעים — אפשר להעלות קובץ או לצרף לינק (Figma / Google Drive וכו׳)" />
          <FilesList projectId={projectId} projectSlug={projectSlug} workspace="design"
                     category="brand"
                     files={filesByCategory('brand')}
                     isStudio={isStudio} clientCanUpload={false}
                     emptyText="עדיין לא הועלה brand book." />
          <LinksList projectId={projectId} projectSlug={projectSlug} workspace="design"
                     category="brand"
                     links={linksByCategory('brand')}
                     isStudio={isStudio} clientCanEdit={false} />

          <SectionHeader title="עמודי עיצוב לאישור"
                         subtitle="שורה לכל עמוד עם דסקטופ + מובייל, סטטוס בלחיצה, והערות שנפתחות מתחת." />
          <ApprovalsTable
            approvals={data.approvals.map(toApprovalRowData)}
            threadByApproval={approvalThreadInfo}
            projectId={projectId} projectSlug={projectSlug} workspace="design"
            currentUserId={currentUserId} isStudio={isStudio}
            dualLinks
          />
          <CreateApprovalForm projectId={projectId} projectSlug={projectSlug}
                              workspace="design" isStudio={isStudio} />
        </div>
      );

    // ─── DEVELOPMENT — Frontend + CMS approvals in tabs ────────────────
    case 'development': {
      const frontendApprovals = data.approvals.filter(a => (a.kind ?? 'frontend') === 'frontend').map(toApprovalRowData);
      const cmsApprovals      = data.approvals.filter(a => a.kind === 'cms').map(toApprovalRowData);
      return (
        <div className="space-y-6">
          <WorkspaceSettingInput projectId={projectId} projectSlug={projectSlug}
                                 workspace="development" settingKey="staging_url"
                                 label="סביבת פיתוח"
                                 placeholder="https://staging-..." currentValue={workspaceSettings.staging_url ?? null}
                                 isStudio={isStudio} isUrl />
          <CmsCredentials projectId={projectId} projectSlug={projectSlug}
                          workspace="development"
                          cmsUrl={workspaceSettings.cms_url ?? null}
                          cmsUser={workspaceSettings.cms_user ?? null}
                          cmsPassword={workspaceSettings.cms_password ?? null}
                          isStudio={isStudio} />

          <DevApprovalsTabs
            frontendApprovals={frontendApprovals}
            cmsApprovals={cmsApprovals}
            threadByApproval={approvalThreadInfo}
            projectId={projectId} projectSlug={projectSlug}
            currentUserId={currentUserId} isStudio={isStudio}
          />
        </div>
      );
    }

    // ─── QA — both can write ────────────────────────────────────────────
    case 'qa':
      return (
        <div className="space-y-6">
          <WorkspaceSettingInput projectId={projectId} projectSlug={projectSlug}
                                 workspace="qa" settingKey="clickup_url"
                                 label="לינק ל-ClickUp"
                                 placeholder="https://app.clickup.com/..." currentValue={workspaceSettings.clickup_url ?? null}
                                 isStudio={isStudio} isUrl />
          <SectionHeader title="Checklist בדיקות"
                         subtitle="לכל פריט יש שדה הערה — אם בדקתם ומשהו לא תקין כתבו פה ונתקן." />
          {data.checklist.length === 0 && isStudio ? (
            <QaSeedButton projectId={projectId} projectSlug={projectSlug} />
          ) : (
            <Checklist projectId={projectId} projectSlug={projectSlug} workspace="qa"
                       items={data.checklist} isStudio={isStudio} clientCanAddItems={false}
                       showFixField />
          )}
          <SectionHeader title="קבצים מצורפים" subtitle="צילומי מסך ועדויות נוספות לבעיות שמצאתם." />
          <FilesList projectId={projectId} projectSlug={projectSlug} workspace="qa"
                     files={filesNoCategory}
                     isStudio={isStudio} clientCanUpload clientCanDelete />
        </div>
      );

    // ─── CONTENT — link to external CMS + status indicator ─────────────
    case 'content':
      return (
        <div className="space-y-6">
          <CmsCredentials projectId={projectId} projectSlug={projectSlug}
                          workspace="content"
                          cmsUrl={workspaceSettings.cms_url ?? null}
                          cmsUser={workspaceSettings.cms_user ?? null}
                          cmsPassword={workspaceSettings.cms_password ?? null}
                          isStudio={isStudio} />
          <WorkspaceSettingInput projectId={projectId} projectSlug={projectSlug}
                                 workspace="content" settingKey="external_content_url"
                                 label="ממשק הזנת תוכן חיצוני (אופציונלי)"
                                 placeholder="https://..."
                                 currentValue={workspaceSettings.external_content_url ?? null}
                                 isStudio={isStudio} isUrl />
          <WorkspaceSettingInput projectId={projectId} projectSlug={projectSlug}
                                 workspace="content" settingKey="status_note"
                                 label="סטטוס כללי / באיזה עמודים נמצאים"
                                 placeholder="למשל: השלמנו עמוד הבית, בעבודה על ארכיון אטרקציות"
                                 currentValue={workspaceSettings.status_note ?? null}
                                 isStudio={isStudio} />

          <SectionHeader title="חומרי תוכן שנדרשים" />
          <Checklist projectId={projectId} projectSlug={projectSlug} workspace="content"
                     items={data.checklist} isStudio={isStudio}
                     clientCanAddItems={false} />

          <SectionHeader title="העלאת תוכן (תמונות, מסמכים, וידאו)" />
          <FilesList projectId={projectId} projectSlug={projectSlug} workspace="content"
                     files={filesNoCategory}
                     isStudio={isStudio} clientCanUpload clientCanDelete />

          {workspaceCommentSection}
        </div>
      );

    // ─── INTEGRATIONS — studio defines, client provides values ────────
    case 'integrations':
      return (
        <div className="space-y-6">
          <SectionHeader title="אינטגרציות לפרויקט"
                         subtitle="הצוות מוסיף את האינטגרציות הנדרשות. הזינו לכל אחת את הקוד / לינק / מפתח שלה." />
          <Checklist projectId={projectId} projectSlug={projectSlug} workspace="integrations"
                     items={data.checklist} isStudio={isStudio}
                     clientCanAddItems={false} />
          <SectionHeader title="קבצים מצורפים" />
          <FilesList projectId={projectId} projectSlug={projectSlug} workspace="integrations"
                     files={filesNoCategory}
                     isStudio={isStudio} clientCanUpload clientCanDelete />
          {workspaceCommentSection}
        </div>
      );

    // ─── LAUNCH — studio info, dev/prod, deadlines ─────────────────────
    case 'launch':
      return (
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-2">
            <WorkspaceSettingInput projectId={projectId} projectSlug={projectSlug}
                                   workspace="launch" settingKey="hosting"
                                   label="חברת אחסון / שרת"
                                   placeholder="Cloudways / SiteGround / וכו'"
                                   currentValue={workspaceSettings.hosting ?? null}
                                   isStudio={isStudio} />
            <WorkspaceSettingInput projectId={projectId} projectSlug={projectSlug}
                                   workspace="launch" settingKey="domain"
                                   label="דומיין סופי" placeholder="example.com"
                                   currentValue={workspaceSettings.domain ?? null}
                                   isStudio={isStudio} />
            <WorkspaceSettingInput projectId={projectId} projectSlug={projectSlug}
                                   workspace="launch" settingKey="staging_url"
                                   label="סביבת פיתוח"
                                   placeholder="https://staging-..." currentValue={workspaceSettings.staging_url ?? null}
                                   isStudio={isStudio} isUrl />
            <WorkspaceSettingInput projectId={projectId} projectSlug={projectSlug}
                                   workspace="launch" settingKey="production_url"
                                   label="סביבת פרודקשן"
                                   placeholder="https://example.com" currentValue={workspaceSettings.production_url ?? null}
                                   isStudio={isStudio} isUrl />
            <WorkspaceSettingInput projectId={projectId} projectSlug={projectSlug}
                                   workspace="launch" settingKey="launch_at"
                                   label="תאריך עליה לאוויר"
                                   placeholder="YYYY-MM-DD HH:MM"
                                   currentValue={workspaceSettings.launch_at ?? null}
                                   isStudio={isStudio} />
            <WorkspaceSettingInput projectId={projectId} projectSlug={projectSlug}
                                   workspace="launch" settingKey="launched_at"
                                   label="עלה לאוויר ב-"
                                   placeholder="(אחרי שעלה — מילוי ע״י הצוות)"
                                   currentValue={workspaceSettings.launched_at ?? null}
                                   isStudio={isStudio} />
          </div>

          <SectionHeader title="Checklist עליה לאוויר" />
          <Checklist projectId={projectId} projectSlug={projectSlug} workspace="launch"
                     items={data.checklist} isStudio={isStudio} clientCanAddItems={false} />
        </div>
      );

    // ─── TRAINING — studio-curated guides ──────────────────────────────
    case 'training': {
      const guides = await fetchGuidesForProject(projectId);
      return (
        <div className="space-y-6">
          <SectionHeader title="מדריכים מהמאגר"
                         subtitle="מדריכים מוכנים על המערכות שאנחנו עובדים איתן." />
          <GuidesList guides={guides} projectSlug={projectSlug} />

          <SectionHeader title="קבצים ומסמכים נוספים לפרויקט" />
          <FilesList projectId={projectId} projectSlug={projectSlug} workspace="training"
                     files={filesNoCategory}
                     isStudio={isStudio} clientCanUpload={false}
                     emptyText="לא הועלו קבצים נוספים." />

          <SectionHeader title="לינקים שימושיים" />
          <Checklist projectId={projectId} projectSlug={projectSlug} workspace="training"
                     items={data.checklist} isStudio={isStudio} clientCanAddItems={false} />
        </div>
      );
    }

    // ─── SUPPORT — tickets ─────────────────────────────────────────────
    case 'support':
      return (
        <div className="space-y-6">
          <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-semibold">איך זה עובד?</p>
            <p className="mt-1">
              כל בעיה או בקשה — פתחו טיקט. ניתן לצרף צילומי מסך (אפילו להדביק עם Ctrl+V).
              אנחנו נחזור אליכם דרך הטיקט עצמו עם תשובה או דיווח שתוקן. תקבלו התראה במייל.
            </p>
          </div>

          <SupportTickets
            projectId={projectId} projectSlug={projectSlug}
            tickets={data.tickets.map<TicketRow>(t => ({
              id: t.id,
              title: t.title ?? '(ללא כותרת)',
              status: t.status,
              priority: t.priority,
              created_at: t.created_at,
              updated_at: t.updated_at,
              messages: data.messagesByThread.get(t.id) ?? [],
            }))}
            currentUserId={currentUserId}
            isStudio={isStudio}
          />
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

async function fetchGuidesForProject(projectId: string): Promise<GuideListItem[]> {
  const supabase = await createClient();
  const [{ data: guidesData }, { data: hidden }] = await Promise.all([
    supabase.from('guide_articles')
      .select('id, slug, title, description, category, cover_url, video_url, published, position')
      .eq('published', true)
      .order('category', { ascending: true })
      .order('position', { ascending: true }),
    supabase.from('project_guide_overrides')
      .select('guide_id, hidden')
      .eq('project_id', projectId)
      .eq('hidden', true),
  ]);
  const hiddenSet = new Set((hidden ?? []).map((h: { guide_id: string }) => h.guide_id));
  return (guidesData ?? [])
    .filter((g: { id: string }) => !hiddenSet.has(g.id))
    .map((g: GuideListItem) => g);
}

export type { ChecklistStatus };

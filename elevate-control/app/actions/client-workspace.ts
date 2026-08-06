'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  notifyNewComment, notifyApprovalStatus, notifyNewTicket,
} from '@/lib/notify';
import type { Json } from '@/lib/supabase/database.types';

type Result<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

// ─── Approvals ─────────────────────────────────────────────────────────

const APPROVAL_STATUSES = ['pending','approved','changes_requested','rejected'] as const;
type ApprovalStatus = typeof APPROVAL_STATUSES[number];

export async function createApproval(input: {
  projectId: string; projectSlug: string; workspace: string;
  title: string; description?: string | null;
  link_url?: string | null; thumbnail_url?: string | null;
  metadata?: Json;
  kind?: string; // 'frontend' | 'cms' (development workspace) — defaults to 'frontend'
}): Promise<Result<{ id: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };
  if (!input.title?.trim()) return { ok: false, error: 'כותרת היא חובה' };

  const { data: last } = await supabase
    .from('client_approvals')
    .select('position')
    .eq('project_id', input.projectId).eq('workspace', input.workspace)
    .order('position', { ascending: false }).limit(1)
    .single<{ position: number }>();
  const position = (last?.position ?? 0) + 10;

  const { data, error } = await supabase
    .from('client_approvals')
    .insert({
      project_id: input.projectId, workspace: input.workspace,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      link_url: input.link_url?.trim() || null,
      thumbnail_url: input.thumbnail_url?.trim() || null,
      metadata: input.metadata ?? null,
      kind: input.kind ?? 'frontend',
      position, created_by: user.id,
    })
    .select('id').single<{ id: string }>();
  if (error || !data) return { ok: false, error: error?.message ?? 'נכשל' };

  revalidatePath(`/client/${input.projectSlug}/${input.workspace}`);
  revalidatePath(`/projects/${input.projectSlug}`);
  return { ok: true, data };
}

export async function setApprovalStatus(
  approvalId: string,
  ctx: { projectSlug: string; workspace: string },
  status: ApprovalStatus,
  note?: string | null
): Promise<Result> {
  if (!APPROVAL_STATUSES.includes(status)) return { ok: false, error: 'סטטוס לא חוקי' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { error } = await supabase
    .from('client_approvals')
    .update({
      status,
      status_note: note?.trim() || null,
      status_changed_by: user.id,
      status_changed_at: new Date().toISOString(),
    })
    .eq('id', approvalId);
  if (error) return { ok: false, error: error.message };

  // Notify the other side
  const { data: approval } = await supabase
    .from('client_approvals').select('project_id, title').eq('id', approvalId)
    .single<{ project_id: string; title: string }>();
  const { data: profile } = await supabase
    .from('profiles').select('full_name, email, role').eq('id', user.id)
    .single<{ full_name: string | null; email: string; role: string }>();

  if (approval && profile) {
    await notifyApprovalStatus({
      projectId: approval.project_id,
      projectSlug: ctx.projectSlug,
      workspace: ctx.workspace,
      approvalTitle: approval.title,
      newStatus: status,
      changedByLabel: profile.full_name ?? profile.email,
      changedByIsClient: profile.role === 'client',
      note: note?.trim() || null,
    });
  }

  revalidatePath(`/client/${ctx.projectSlug}/${ctx.workspace}`);
  revalidatePath(`/projects/${ctx.projectSlug}`);
  return { ok: true };
}

export async function updateApproval(
  approvalId: string,
  ctx: { projectSlug: string; workspace: string },
  patch: { title?: string; description?: string | null;
           link_url?: string | null; thumbnail_url?: string | null;
           metadata?: Json; }
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const update: Record<string, unknown> = {};
  if (patch.title !== undefined)         update.title         = patch.title.trim();
  if (patch.description !== undefined)   update.description   = patch.description?.trim() || null;
  if (patch.link_url !== undefined)      update.link_url      = patch.link_url?.trim() || null;
  if (patch.thumbnail_url !== undefined) update.thumbnail_url = patch.thumbnail_url?.trim() || null;
  if (patch.metadata !== undefined)      update.metadata      = patch.metadata;

  const { error } = await supabase.from('client_approvals').update(update).eq('id', approvalId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/client/${ctx.projectSlug}/${ctx.workspace}`);
  revalidatePath(`/projects/${ctx.projectSlug}`);
  return { ok: true };
}

export async function deleteApproval(
  approvalId: string,
  ctx: { projectSlug: string; workspace: string }
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from('client_approvals').delete().eq('id', approvalId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/client/${ctx.projectSlug}/${ctx.workspace}`);
  return { ok: true };
}

// ─── Support tickets (use comment_threads with context_type='ticket') ─

export async function createTicket(input: {
  projectId: string; projectSlug: string;
  title: string; firstMessage: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attachments?: { url: string; name: string; mime: string; size_bytes: number }[];
}): Promise<Result<{ threadId: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };
  if (!input.title.trim()) return { ok: false, error: 'נושא חובה' };

  const { data: profile } = await supabase
    .from('profiles').select('full_name, email').eq('id', user.id)
    .single<{ full_name: string | null; email: string }>();
  const label = profile?.full_name ?? profile?.email ?? null;

  const { data: thread, error } = await supabase
    .from('comment_threads')
    .insert({
      project_id:   input.projectId,
      context_type: 'ticket',
      workspace:    'support',
      title:        input.title.trim(),
      priority:     input.priority,
      status:       'open',
      created_by:   user.id,
    })
    .select('id').single<{ id: string }>();
  if (error || !thread) return { ok: false, error: error?.message ?? 'נכשל' };

  await supabase.from('comment_messages').insert({
    thread_id:    thread.id,
    author_id:    user.id,
    author_label: label,
    body:         input.firstMessage,
    attachments:  (input.attachments ?? []) as unknown as Json,
  });

  await notifyNewTicket({
    projectId:   input.projectId,
    projectSlug: input.projectSlug,
    ticketTitle: input.title,
    priority:    input.priority,
    body:        input.firstMessage,
    authorLabel: label ?? 'משתמש',
  });

  revalidatePath(`/client/${input.projectSlug}/support`);
  revalidatePath(`/projects/${input.projectSlug}`);
  return { ok: true, data: { threadId: thread.id } };
}

// ─── Comments ──────────────────────────────────────────────────────────

const THREAD_STATUSES = ['open','in_progress','resolved','wont_fix'] as const;
type ThreadStatus = typeof THREAD_STATUSES[number];

export async function ensureThread(input: {
  projectId: string;
  contextType: 'approval' | 'workspace' | 'page' | 'section' | 'ticket';
  contextId?: string | null;
  workspace?: string | null;
  title?: string | null;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}): Promise<Result<{ threadId: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  // Try to find an existing thread for this context first
  let q = supabase.from('comment_threads').select('id').eq('project_id', input.projectId)
                  .eq('context_type', input.contextType);
  if (input.contextId) q = q.eq('context_id', input.contextId);
  else q = q.is('context_id', null);
  if (input.workspace) q = q.eq('workspace', input.workspace);

  const { data: existing } = await q.maybeSingle<{ id: string }>();
  if (existing) return { ok: true, data: { threadId: existing.id } };

  const { data: created, error } = await supabase
    .from('comment_threads')
    .insert({
      project_id:   input.projectId,
      context_type: input.contextType,
      context_id:   input.contextId ?? null,
      workspace:    input.workspace ?? null,
      title:        input.title ?? null,
      priority:     input.priority ?? 'normal',
      created_by:   user.id,
    })
    .select('id').single<{ id: string }>();
  if (error || !created) return { ok: false, error: error?.message ?? 'נכשל' };

  return { ok: true, data: { threadId: created.id } };
}

export async function postMessage(input: {
  threadId: string; projectSlug: string;
  body: string;
  attachments?: { url: string; name: string; mime: string; size_bytes: number }[];
  // Optional: reply to a specific earlier message in the thread.
  replyTo?: { id: string; author: string | null; snippet: string } | null;
  // Optional: create the thread on demand (used by client UI clicking "comment" on an approval)
  ensure?: {
    projectId: string;
    contextType: 'approval' | 'workspace' | 'page' | 'section';
    contextId?: string | null;
    workspace?: string | null;
    title?: string | null;
  };
}): Promise<Result<{ threadId: string; messageId: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  if (!input.body.trim() && !(input.attachments?.length)) {
    return { ok: false, error: 'הודעה ריקה' };
  }

  let threadId = input.threadId;
  if (!threadId && input.ensure) {
    const r = await ensureThread(input.ensure);
    if (!r.ok) return { ok: false, error: r.error };
    threadId = r.data.threadId;
  }
  if (!threadId) return { ok: false, error: 'thread_id חסר' };

  const { data: profile } = await supabase
    .from('profiles').select('full_name, email').eq('id', user.id).single<{ full_name: string | null; email: string }>();
  const label = profile?.full_name ?? profile?.email ?? null;

  const insertRow: Record<string, unknown> = {
    thread_id:    threadId,
    author_id:    user.id,
    author_label: label,
    body:         input.body,
    attachments:  (input.attachments ?? []) as unknown as Json,
  };
  // Only attach reply fields when actually replying — keeps normal
  // comments working even before migration 0026 adds these columns.
  if (input.replyTo?.id) {
    insertRow.reply_to_id     = input.replyTo.id;
    insertRow.reply_to_author = input.replyTo.author;
    insertRow.reply_to_snippet = input.replyTo.snippet.slice(0, 140);
  }
  const { data, error } = await supabase
    .from('comment_messages')
    .insert(insertRow)
    .select('id').single<{ id: string }>();
  if (error || !data) return { ok: false, error: error?.message ?? 'נכשל' };

  // Bump thread updated_at + reopen if it was resolved
  await supabase.from('comment_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', threadId);

  // Email the other side
  const { data: thread } = await supabase
    .from('comment_threads')
    .select('project_id, workspace, title, context_type')
    .eq('id', threadId)
    .single<{ project_id: string; workspace: string | null; title: string | null; context_type: string }>();
  const { data: actor } = await supabase
    .from('profiles').select('role').eq('id', user.id)
    .single<{ role: string }>();

  if (thread && actor) {
    await notifyNewComment({
      projectId: thread.project_id,
      projectSlug: input.projectSlug,
      workspace: thread.workspace,
      authorIsClient: actor.role === 'client',
      authorLabel: label ?? 'משתמש',
      body: input.body,
      threadTitle: thread.title,
    });
  }

  revalidatePath(`/client/${input.projectSlug}`);
  revalidatePath(`/projects/${input.projectSlug}`);
  return { ok: true, data: { threadId, messageId: data.id } };
}

/** Mark a single comment message as handled/clear (✓), or clear the
 *  mark. Shared state — both sides see it. */
export async function setMessageAcknowledged(
  messageId: string,
  projectSlug: string,
  done: boolean
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };
  const { error } = await supabase
    .from('comment_messages')
    .update({
      acknowledged_at: done ? new Date().toISOString() : null,
      acknowledged_by: done ? user.id : null,
    })
    .eq('id', messageId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/client/${projectSlug}`);
  revalidatePath(`/projects/${projectSlug}`);
  return { ok: true };
}

export async function setThreadPriority(
  threadId: string,
  projectSlug: string,
  priority: 'low' | 'normal' | 'high' | 'urgent'
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from('comment_threads').update({ priority }).eq('id', threadId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/client/${projectSlug}`);
  revalidatePath(`/projects/${projectSlug}`);
  return { ok: true };
}

export async function setThreadStatus(
  threadId: string,
  projectSlug: string,
  status: ThreadStatus
): Promise<Result> {
  if (!THREAD_STATUSES.includes(status)) return { ok: false, error: 'סטטוס לא חוקי' };
  const supabase = await createClient();
  const { error } = await supabase.from('comment_threads').update({ status }).eq('id', threadId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/client/${projectSlug}`);
  revalidatePath(`/projects/${projectSlug}`);
  return { ok: true };
}

// ─── Checklist ────────────────────────────────────────────────────────

const CHECKLIST_STATUSES = ['pending','in_progress','done','na'] as const;
type ChecklistStatus = typeof CHECKLIST_STATUSES[number];

export async function createChecklistItem(input: {
  projectId: string; projectSlug: string; workspace: string;
  title: string; description?: string | null;
  link_url?: string | null; input_type?: string | null;
  amount_cents?: number | null;
}): Promise<Result<{ id: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };
  if (!input.title?.trim()) return { ok: false, error: 'כותרת היא חובה' };

  const { data: last } = await supabase
    .from('checklist_items').select('position')
    .eq('project_id', input.projectId).eq('workspace', input.workspace)
    .order('position', { ascending: false }).limit(1)
    .single<{ position: number }>();
  const position = (last?.position ?? 0) + 10;

  const { data, error } = await supabase
    .from('checklist_items')
    .insert({
      project_id:  input.projectId,
      workspace:   input.workspace,
      title:       input.title.trim(),
      description: input.description?.trim() || null,
      link_url:    input.link_url?.trim() || null,
      input_type:  input.input_type ?? null,
      amount_cents: input.amount_cents ?? null,
      position,
      created_by:  user.id,
    })
    .select('id').single<{ id: string }>();
  if (error || !data) return { ok: false, error: error?.message ?? 'נכשל' };

  revalidatePath(`/client/${input.projectSlug}/${input.workspace}`);
  return { ok: true, data };
}

export async function updateChecklistItem(
  itemId: string,
  ctx: { projectSlug: string; workspace: string },
  patch: { title?: string; description?: string | null;
           link_url?: string | null; input_value?: string | null;
           client_note?: string | null;
           amount_cents?: number | null;
           attachment_url?: string | null; status?: ChecklistStatus }
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const update: Record<string, unknown> = { ...patch };
  if (patch.status) {
    if (!CHECKLIST_STATUSES.includes(patch.status)) return { ok: false, error: 'סטטוס לא חוקי' };
    update.status_changed_by = user.id;
    update.status_changed_at = new Date().toISOString();
  }
  const { error } = await supabase.from('checklist_items').update(update).eq('id', itemId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/client/${ctx.projectSlug}/${ctx.workspace}`);
  return { ok: true };
}

export async function deleteChecklistItem(
  itemId: string,
  ctx: { projectSlug: string; workspace: string }
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from('checklist_items').delete().eq('id', itemId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/client/${ctx.projectSlug}/${ctx.workspace}`);
  return { ok: true };
}

/**
 * Standard QA checklist — created with one click on an empty QA workspace.
 * Items here mirror what a senior tester would actually walk through before
 * shipping a marketing site. Studio users can edit/delete after creation.
 */
const STANDARD_QA_CHECKLIST: { title: string; description?: string }[] = [
  { title: 'תצוגה במובייל', description: 'מעבר על כל העמודים בגדלי מסך 360, 414, 768 — בלי גלילה אופקית, בלי טקסט קטוע.' },
  { title: 'תצוגה בדסקטופ', description: 'בדיקת רוחב 1280, 1440, 1920 — תמונות חדות, אין רווחים שבורים.' },
  { title: 'בדיקת קישורים פנימיים', description: 'כל קישור בתפריט / פוטר / כפתור CTA מוביל ליעד הנכון.' },
  { title: 'טפסים וטריגרים', description: 'טופס יצירת קשר נשלח ומגיע למייל, הודעת תודה מוצגת.' },
  { title: 'קוד אנליטיקס + פיקסלים', description: 'GA4, Meta Pixel, Tag Manager טוענים בלי שגיאות בקונסול.' },
  { title: 'מהירות עמוד', description: 'בדיקת PageSpeed Insights — ירוק במובייל ובדסקטופ.' },
  { title: 'נגישות', description: 'בדיקת ניגודיות, תיוגים, כפתור נגישות פעיל.' },
  { title: 'SEO בסיסי', description: 'Title + meta description לכל עמוד, תמונות עם alt, sitemap.xml + robots.txt.' },
  { title: 'בדיקת דפדפנים', description: 'Chrome, Safari, Firefox, Edge — לפחות גרסה אחרונה.' },
  { title: 'הגהה אחרונה', description: 'מעבר טקסטואלי על כל העמודים — בלי שגיאות הקלדה.' },
];

export async function createStandardQaChecklist(
  ctx: { projectId: string; projectSlug: string }
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const rows = STANDARD_QA_CHECKLIST.map((it, i) => ({
    project_id:  ctx.projectId,
    workspace:   'qa',
    title:       it.title,
    description: it.description ?? null,
    status:      'pending' as const,
    position:    (i + 1) * 10,
    created_by:  user.id,
  }));
  const { error } = await supabase.from('checklist_items').insert(rows);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${ctx.projectSlug}/manage/qa`);
  revalidatePath(`/client/${ctx.projectSlug}/qa`);
  return { ok: true };
}

// ─── Project files ─────────────────────────────────────────────────────

export async function recordFile(input: {
  projectId: string; projectSlug: string; workspace?: string | null;
  category?: string | null;
  filename: string; storagePath: string;
  mimeType: string; sizeBytes: number;
  notes?: string | null;
}): Promise<Result<{ id: string; file_url: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  if (!input.storagePath.startsWith(`${input.projectId}/`)) {
    return { ok: false, error: 'נתיב אחסון לא תקין' };
  }

  // Sign for 1 year
  const { data: signed } = await supabase.storage
    .from('client-files')
    .createSignedUrl(input.storagePath, 60 * 60 * 24 * 365);
  const fileUrl = signed?.signedUrl ?? '';

  const { data, error } = await supabase
    .from('project_files')
    .insert({
      project_id:   input.projectId,
      workspace:    input.workspace ?? null,
      category:     input.category ?? null,
      filename:     input.filename,
      storage_path: input.storagePath,
      file_url:     fileUrl,
      mime_type:    input.mimeType,
      size_bytes:   input.sizeBytes,
      notes:        input.notes ?? null,
      uploaded_by:  user.id,
    })
    .select('id, file_url').single<{ id: string; file_url: string }>();
  if (error || !data) {
    await supabase.storage.from('client-files').remove([input.storagePath]);
    return { ok: false, error: error?.message ?? 'נכשל' };
  }

  if (input.workspace) revalidatePath(`/client/${input.projectSlug}/${input.workspace}`);
  return { ok: true, data };
}

export async function renameFile(
  fileId: string,
  ctx: { projectSlug: string; workspace?: string | null },
  newFilename: string
): Promise<Result> {
  const supabase = await createClient();
  const trimmed = newFilename.trim();
  if (!trimmed) return { ok: false, error: 'שם קובץ לא יכול להיות ריק' };
  const { error } = await supabase
    .from('project_files').update({ filename: trimmed }).eq('id', fileId);
  if (error) return { ok: false, error: error.message };
  if (ctx.workspace) revalidatePath(`/client/${ctx.projectSlug}/${ctx.workspace}`);
  return { ok: true };
}

export async function deleteFile(
  fileId: string,
  ctx: { projectSlug: string; workspace?: string | null }
): Promise<Result> {
  const supabase = await createClient();
  const { data: file } = await supabase
    .from('project_files').select('id, storage_path').eq('id', fileId)
    .single<{ id: string; storage_path: string }>();
  if (file) await supabase.storage.from('client-files').remove([file.storage_path]);

  const { error } = await supabase.from('project_files').delete().eq('id', fileId);
  if (error) return { ok: false, error: error.message };

  if (ctx.workspace) revalidatePath(`/client/${ctx.projectSlug}/${ctx.workspace}`);
  return { ok: true };
}

// ─── Project links (external URLs alongside files) ───────────────────

export async function createProjectLink(input: {
  projectId: string; projectSlug: string;
  workspace?: string | null; category?: string | null;
  url: string; label?: string | null;
}): Promise<Result<{ id: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };
  if (!input.url?.trim()) return { ok: false, error: 'לינק הוא חובה' };

  const { data, error } = await supabase
    .from('project_links')
    .insert({
      project_id: input.projectId,
      workspace:  input.workspace ?? null,
      category:   input.category ?? null,
      url:        input.url.trim(),
      label:      input.label?.trim() || null,
      created_by: user.id,
    })
    .select('id').single<{ id: string }>();
  if (error || !data) return { ok: false, error: error?.message ?? 'נכשל' };
  if (input.workspace) revalidatePath(`/client/${input.projectSlug}/${input.workspace}`);
  return { ok: true, data };
}

export async function updateProjectLink(
  linkId: string,
  ctx: { projectSlug: string; workspace?: string | null },
  patch: { url?: string; label?: string | null }
): Promise<Result> {
  const supabase = await createClient();
  const update: Record<string, unknown> = {};
  if (patch.url !== undefined)   update.url   = patch.url.trim();
  if (patch.label !== undefined) update.label = patch.label?.trim() || null;
  const { error } = await supabase.from('project_links').update(update).eq('id', linkId);
  if (error) return { ok: false, error: error.message };
  if (ctx.workspace) revalidatePath(`/client/${ctx.projectSlug}/${ctx.workspace}`);
  return { ok: true };
}

export async function deleteProjectLink(
  linkId: string,
  ctx: { projectSlug: string; workspace?: string | null }
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from('project_links').delete().eq('id', linkId);
  if (error) return { ok: false, error: error.message };
  if (ctx.workspace) revalidatePath(`/client/${ctx.projectSlug}/${ctx.workspace}`);
  return { ok: true };
}

// ─── Workspace settings (e.g. Figma URL, ClickUp URL, launch date) ────

export async function setWorkspaceSetting(
  projectId: string,
  projectSlug: string,
  workspace: string,
  key: string,
  value: string | null
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { data: project } = await supabase
    .from('projects').select('workspace_settings').eq('id', projectId)
    .single<{ workspace_settings: Json }>();
  const settings = ((project?.workspace_settings as Record<string, Record<string, string | null>>) ?? {});
  settings[workspace] = { ...(settings[workspace] ?? {}), [key]: value };

  const { error } = await supabase
    .from('projects')
    .update({ workspace_settings: settings as unknown as Json })
    .eq('id', projectId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/client/${projectSlug}/${workspace}`);
  revalidatePath(`/projects/${projectSlug}`);
  return { ok: true };
}

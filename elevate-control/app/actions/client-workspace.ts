'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
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

// ─── Comments ──────────────────────────────────────────────────────────

const THREAD_STATUSES = ['open','in_progress','resolved','wont_fix'] as const;
type ThreadStatus = typeof THREAD_STATUSES[number];

export async function ensureThread(input: {
  projectId: string;
  contextType: 'approval' | 'workspace' | 'page' | 'section';
  contextId?: string | null;
  workspace?: string | null;
  title?: string | null;
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

  const { data, error } = await supabase
    .from('comment_messages')
    .insert({
      thread_id:    threadId,
      author_id:    user.id,
      author_label: label,
      body:         input.body,
      attachments:  (input.attachments ?? []) as unknown as Json,
    })
    .select('id').single<{ id: string }>();
  if (error || !data) return { ok: false, error: error?.message ?? 'נכשל' };

  // Bump thread updated_at + reopen if it was resolved
  await supabase.from('comment_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', threadId);

  revalidatePath(`/client/${input.projectSlug}`);
  revalidatePath(`/projects/${input.projectSlug}`);
  return { ok: true, data: { threadId, messageId: data.id } };
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

// ─── Project files ─────────────────────────────────────────────────────

export async function recordFile(input: {
  projectId: string; projectSlug: string; workspace?: string | null;
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

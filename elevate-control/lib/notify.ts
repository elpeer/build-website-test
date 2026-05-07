/**
 * Email notification helper. Uses Resend when RESEND_API_KEY is set.
 * Silent no-op (with console.warn) if not configured — keeps dev easy.
 *
 * Required env:
 *   RESEND_API_KEY        — sk_xxx
 *   EMAIL_FROM            — "Elevate Control <noreply@elevate.co.il>"
 *   NEXT_PUBLIC_APP_URL   — used to build links back to the app
 */
import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase/server';
import type { MemberRole } from '@/lib/supabase/database.types';

interface EmailRecipient { id: string; email: string; full_name: string | null }

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[notify] RESEND_API_KEY not set — emails skipped');
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function from(): string {
  return process.env.EMAIL_FROM ?? 'Elevate Control <noreply@example.com>';
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? '';
}

/**
 * Get recipients for a project filtered by role(s) — used to email "the
 * other side" of a conversation. Pass roles=['client'] to email the client
 * after a studio change, or roles=['owner','pm','designer','developer','reviewer']
 * to email the studio after a client change.
 */
export async function recipientsForProject(
  projectId: string,
  roles: MemberRole[]
): Promise<EmailRecipient[]> {
  const admin = createServiceClient();
  const { data } = await admin
    .from('project_members')
    .select('user_id, role, profiles(id, email, full_name)')
    .eq('project_id', projectId)
    .in('role', roles);

  type Joined = { profiles: { id: string; email: string; full_name: string | null } | null };
  const rows = (data ?? []) as unknown as Joined[];
  const seen = new Set<string>();
  const out: EmailRecipient[] = [];
  for (const r of rows) {
    if (!r.profiles?.email) continue;
    if (seen.has(r.profiles.id)) continue;
    seen.add(r.profiles.id);
    out.push(r.profiles);
  }
  return out;
}

interface SendInput {
  to: EmailRecipient[];
  subject: string;
  preview: string;        // first line shown in inbox
  bodyHtml: string;       // main content (HTML)
  ctaLabel?: string;
  ctaHref?: string;       // absolute URL
  fromActor?: string;     // who triggered ("הלקוח", "אלי גינסברג", etc.)
  // In-app notification fields (used in addition to email)
  inAppKind?: string;     // 'comment' | 'approval' | 'ticket' | ...
  inAppTitle?: string;    // short title for the bell
  inAppBody?: string;     // optional body / snippet
  inAppLink?: string;     // relative path to navigate to
  projectId?: string;     // for filtering on project page
}

export async function sendNotification(input: SendInput): Promise<void> {
  if (input.to.length === 0) return;

  // Always insert in-app notifications (regardless of Resend)
  if (input.inAppKind && input.inAppTitle) {
    try {
      const admin = createServiceClient();
      const rows = input.to.map(r => ({
        user_id:    r.id,
        project_id: input.projectId ?? null,
        kind:       input.inAppKind,
        title:      input.inAppTitle,
        body:       input.inAppBody ?? null,
        link:       input.inAppLink ?? null,
      }));
      await admin.from('notifications').insert(rows);
    } catch (e) {
      console.warn('[notify] in-app insert failed:', (e as Error).message);
    }
  }

  const client = getClient();
  if (!client) return;

  const html = wrapEmail(input);
  try {
    await client.emails.send({
      from:    from(),
      to:      input.to.map(r => r.email),
      subject: input.subject,
      html,
    });
  } catch (e) {
    console.warn('[notify] send failed:', (e as Error).message);
  }
}

function wrapEmail(i: SendInput): string {
  const cta = i.ctaHref && i.ctaLabel
    ? `<p style="margin:24px 0;"><a href="${i.ctaHref}" style="display:inline-block;background:#1f2937;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">${escape(i.ctaLabel)}</a></p>`
    : '';

  return `<!doctype html>
<html dir="rtl" lang="he"><body style="font-family:system-ui,Heebo,Segoe UI,sans-serif;background:#fafaf7;padding:24px;color:#1f2937;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
    <p style="margin:0 0 12px;color:#6b7280;font-size:13px;">${escape(i.preview)}</p>
    <h1 style="margin:0 0 16px;font-size:18px;line-height:1.4;">${escape(i.subject)}</h1>
    <div style="font-size:14px;line-height:1.6;">${i.bodyHtml}</div>
    ${cta}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
    <p style="margin:0;color:#9ca3af;font-size:12px;">
      ${i.fromActor ? `נשלח על ידי ${escape(i.fromActor)} · ` : ''}
      Elevate Control
    </p>
  </div>
</body></html>`;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',
  }[c]!));
}

// ─── Pre-baked notification templates ─────────────────────────────────────

export async function notifyNewComment(input: {
  projectId: string;
  projectSlug: string;
  workspace: string | null;
  authorIsClient: boolean;
  authorLabel: string;
  body: string;
  threadTitle: string | null;
}) {
  const studioRoles: MemberRole[] = ['owner', 'pm', 'designer', 'developer', 'reviewer'];
  const recipients = input.authorIsClient
    ? await recipientsForProject(input.projectId, studioRoles)
    : await recipientsForProject(input.projectId, ['client']);

  if (recipients.length === 0) return;

  const link = input.workspace
    ? `${appUrl()}/client/${input.projectSlug}/${input.workspace}`
    : `${appUrl()}/client/${input.projectSlug}`;

  const snippet = input.body.length > 200 ? input.body.slice(0, 200) + '…' : input.body;

  const localLink = link.replace(process.env.NEXT_PUBLIC_APP_URL ?? '', '');
  await sendNotification({
    to: recipients,
    subject: `תגובה חדשה${input.threadTitle ? `: ${input.threadTitle}` : ''}`,
    preview: `${input.authorLabel} כתב/ה תגובה`,
    fromActor: input.authorLabel,
    ctaLabel: 'פתח/י את התגובה',
    ctaHref: link,
    inAppKind: 'comment',
    inAppTitle: `${input.authorLabel}: ${input.threadTitle ?? 'תגובה חדשה'}`,
    inAppBody: snippet,
    inAppLink: localLink,
    projectId: input.projectId,
    bodyHtml: `
      <p><strong>${escape(input.authorLabel)}</strong> כתב/ה תגובה ${input.threadTitle ? `על: <em>${escape(input.threadTitle)}</em>` : ''}:</p>
      <blockquote style="margin:8px 0;padding:12px;border-inline-start:3px solid #f59e0b;background:#fffbeb;border-radius:0 6px 6px 0;color:#1f2937;white-space:pre-wrap;">${escape(snippet)}</blockquote>
    `,
  });
}

export async function notifyApprovalStatus(input: {
  projectId: string;
  projectSlug: string;
  workspace: string;
  approvalTitle: string;
  newStatus: string;
  changedByLabel: string;
  changedByIsClient: boolean;
  note: string | null;
}) {
  const studioRoles: MemberRole[] = ['owner', 'pm', 'designer', 'developer', 'reviewer'];
  const recipients = input.changedByIsClient
    ? await recipientsForProject(input.projectId, studioRoles)
    : await recipientsForProject(input.projectId, ['client']);
  if (recipients.length === 0) return;

  const STATUS_LABELS: Record<string, string> = {
    pending:           'ממתין',
    approved:          'אושר ✓',
    changes_requested: 'בקשה לתיקון',
    rejected:          'נדחה',
  };

  const link = `${appUrl()}/client/${input.projectSlug}/${input.workspace}`;
  const noteHtml = input.note
    ? `<blockquote style="margin:8px 0;padding:12px;background:#fffbeb;border-inline-start:3px solid #f59e0b;border-radius:0 6px 6px 0;white-space:pre-wrap;">${escape(input.note)}</blockquote>`
    : '';

  const localLink = link.replace(process.env.NEXT_PUBLIC_APP_URL ?? '', '');
  await sendNotification({
    to: recipients,
    subject: `סטטוס "${input.approvalTitle}": ${STATUS_LABELS[input.newStatus] ?? input.newStatus}`,
    preview: `${input.changedByLabel} עדכן/ה סטטוס`,
    fromActor: input.changedByLabel,
    ctaLabel: 'פתח/י את הפריט',
    ctaHref: link,
    inAppKind: 'approval',
    inAppTitle: `${STATUS_LABELS[input.newStatus] ?? input.newStatus}: ${input.approvalTitle}`,
    inAppBody: input.note ?? `${input.changedByLabel} שינה/תה את הסטטוס`,
    inAppLink: localLink,
    projectId: input.projectId,
    bodyHtml: `
      <p><strong>${escape(input.changedByLabel)}</strong> עדכן/ה את הסטטוס של <em>${escape(input.approvalTitle)}</em> ל-<strong>${escape(STATUS_LABELS[input.newStatus] ?? input.newStatus)}</strong>.</p>
      ${noteHtml}
    `,
  });
}

export async function notifyNewTicket(input: {
  projectId: string;
  projectSlug: string;
  ticketTitle: string;
  priority: string;
  body: string;
  authorLabel: string;
}) {
  const studioRoles: MemberRole[] = ['owner', 'pm', 'designer', 'developer', 'reviewer'];
  const recipients = await recipientsForProject(input.projectId, studioRoles);
  if (recipients.length === 0) return;

  const PRIORITY_LABELS: Record<string, string> = {
    low: 'נמוכה', normal: 'רגילה', high: 'גבוהה', urgent: 'דחוף!',
  };
  const link = `${appUrl()}/client/${input.projectSlug}/support`;

  const localLink = link.replace(process.env.NEXT_PUBLIC_APP_URL ?? '', '');
  await sendNotification({
    to: recipients,
    subject: `🎧 טיקט חדש (${PRIORITY_LABELS[input.priority] ?? input.priority}): ${input.ticketTitle}`,
    preview: `${input.authorLabel} פתח/ה טיקט`,
    fromActor: input.authorLabel,
    ctaLabel: 'פתח/י את הטיקט',
    ctaHref: link,
    inAppKind: 'ticket',
    inAppTitle: `🎧 טיקט (${PRIORITY_LABELS[input.priority] ?? input.priority}): ${input.ticketTitle}`,
    inAppBody: input.body.slice(0, 200),
    inAppLink: localLink,
    projectId: input.projectId,
    bodyHtml: `
      <p><strong>${escape(input.authorLabel)}</strong> פתח/ה טיקט חדש בדחיפות <strong>${escape(PRIORITY_LABELS[input.priority] ?? input.priority)}</strong>:</p>
      <p style="font-size:16px;font-weight:600;">${escape(input.ticketTitle)}</p>
      <blockquote style="margin:8px 0;padding:12px;background:#fef2f2;border-inline-start:3px solid #ef4444;border-radius:0 6px 6px 0;white-space:pre-wrap;">${escape(input.body.slice(0, 400))}${input.body.length > 400 ? '…' : ''}</blockquote>
    `,
  });
}

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
    ? `<p style="margin:28px 0 8px;text-align:center;"><a href="${i.ctaHref}" style="display:inline-block;background:#0f172a;color:#fff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:600;font-size:15px;letter-spacing:.02em;">${escape(i.ctaLabel)}</a></p>`
    : '';

  return `<!doctype html>
<html dir="rtl" lang="he"><body style="margin:0;font-family:'Heebo',system-ui,Segoe UI,sans-serif;background:linear-gradient(180deg,#faf7f2 0%,#f5f1ea 100%);padding:32px 16px;color:#1f2937;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #ece6dc;border-radius:18px;padding:36px 32px;box-shadow:0 8px 24px rgba(15,23,42,0.04);">
    <div style="margin-bottom:18px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#b45309;font-weight:600;">Elevate Control</div>
    <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;">${escape(i.preview)}</p>
    <h1 style="margin:0 0 18px;font-size:22px;line-height:1.4;font-weight:700;color:#0f172a;">${escape(i.subject)}</h1>
    <div style="font-size:15px;line-height:1.7;color:#334155;">${i.bodyHtml}</div>
    ${cta}
    <hr style="border:none;border-top:1px solid #ece6dc;margin:28px 0 16px;">
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
      ${i.fromActor ? `נשלח על ידי <strong style="color:#475569;">${escape(i.fromActor)}</strong> · ` : ''}
      Elevate Digital Studio
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

// ─── Welcome email for newly-invited users ────────────────────────────────

/**
 * Send a friendly Hebrew welcome email to someone the admin just added to
 * the platform. Email is informational — the user's account is already
 * usable (email_confirm=true + password set), so the link points to the
 * sign-in page, not a magic-link activation.
 */
export async function sendWelcomeEmail(input: {
  email: string;
  fullName?: string | null;
  inviterName?: string | null;
  projectName?: string | null;
  isStudioMember?: boolean;
}): Promise<void> {
  const client = getClient();
  if (!client) return;

  const signInUrl = `${appUrl()}/sign-in`;
  const greetingName = input.fullName?.trim() || input.email.split('@')[0];
  const audience = input.isStudioMember ? 'צוות הסטודיו' : 'הפרויקט';
  const projectLine = input.projectName
    ? `<p>נוספת כחבר/ה בפרויקט <strong>${escape(input.projectName)}</strong>.</p>`
    : `<p>נוספת כחבר/ה ב${audience} שלנו.</p>`;

  const inviterLine = input.inviterName
    ? `<p style="color:#64748b;font-size:14px;">המזמין/ה: ${escape(input.inviterName)}</p>`
    : '';

  const bodyHtml = `
    <p>שלום ${escape(greetingName)} 👋</p>
    <p>ברוכים הבאים ל-<strong>Elevate Control</strong> — מערכת ניהול הפרויקטים של Elevate Digital Studio.</p>
    ${projectLine}
    <p>פרטי ההתחברות שלך נשלחים אליך בנפרד. לחיצה על הכפתור תיקח אותך לעמוד הכניסה.</p>
    ${inviterLine}
  `;

  try {
    await client.emails.send({
      from:    from(),
      to:      [input.email],
      subject: 'ברוכים הבאים ל-Elevate Control',
      html:    wrapEmail({
        to:        [],
        subject:   'ברוכים הבאים ל-Elevate Control',
        preview:   'הוזמנת למערכת — לחצו לכניסה',
        bodyHtml,
        ctaLabel:  'כניסה למערכת',
        ctaHref:   signInUrl,
        fromActor: input.inviterName ?? undefined,
      }),
    });
  } catch (e) {
    console.warn('[notify] welcome send failed:', (e as Error).message);
  }
}

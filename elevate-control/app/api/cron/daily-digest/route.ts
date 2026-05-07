import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendNotification } from '@/lib/notify';
import { listRecentCommits, type GhCommit } from '@/app/actions/github';
import { STAGE_LABELS, type ProjectStage } from '@/lib/client-workspaces';

/**
 * Vercel cron entry: hourly. Each hour, finds profiles whose
 * daily_digest_enabled=true AND daily_digest_hour matches the current hour,
 * and sends them a per-project recap of what's happened in the last 24h.
 *
 * Auth: protected by CRON_SECRET. Vercel sends Authorization: Bearer <secret>
 * automatically when CRON_SECRET is set as an env var.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ProjectAgg {
  id: string;
  slug: string;
  name: string;
  current_stage: ProjectStage;
  github_repo: string | null;
}

export async function GET(req: Request) {
  // Auth check — Vercel cron passes Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const admin = createServiceClient();
  const nowHour = new Date().getUTCHours();
  // Compare against Israel time (UTC+2/+3). Simple +3 offset; close enough.
  const ilHour = (nowHour + 3) % 24;

  // Eligible recipients
  const { data: profilesData } = await admin
    .from('profiles')
    .select('id, email, full_name, daily_digest_hour, digest_last_sent_at')
    .eq('daily_digest_enabled', true)
    .eq('daily_digest_hour', ilHour);

  type Profile = {
    id: string; email: string; full_name: string | null;
    daily_digest_hour: number; digest_last_sent_at: string | null;
  };
  const profiles = (profilesData ?? []) as Profile[];
  if (profiles.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, hour: ilHour });
  }

  let sent = 0;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  for (const p of profiles) {
    // Skip if already sent within the last 23 hours (de-dup safety)
    if (p.digest_last_sent_at && Date.now() - new Date(p.digest_last_sent_at).getTime() < 23 * 60 * 60 * 1000) {
      continue;
    }

    const html = await buildDigestHtml(admin, p.id, since);
    if (!html) continue;

    await sendNotification({
      to: [{ id: p.id, email: p.email, full_name: p.full_name }],
      subject: `סיכום יומי · ${new Date().toLocaleDateString('he-IL')}`,
      preview: 'מה קרה אתמול בפרויקטים שלך',
      bodyHtml: html,
      ctaLabel: 'פתח/י את הדאשבורד',
      ctaHref: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/projects`,
    });

    await admin.from('profiles').update({ digest_last_sent_at: new Date().toISOString() })
      .eq('id', p.id);
    sent++;
  }

  return NextResponse.json({ ok: true, sent, hour: ilHour });
}

async function buildDigestHtml(
  admin: ReturnType<typeof createServiceClient>,
  userId: string,
  since: string
): Promise<string | null> {
  // Projects this user belongs to
  const { data: memberships } = await admin
    .from('project_members')
    .select('project_id')
    .eq('user_id', userId);
  const projectIds = (memberships ?? []).map(m => m.project_id);
  if (projectIds.length === 0) return null;

  const { data: projectsData } = await admin
    .from('projects')
    .select('id, slug, name, current_stage, github_repo')
    .in('id', projectIds)
    .is('archived_at', null);
  const projects = (projectsData ?? []) as ProjectAgg[];
  if (projects.length === 0) return null;

  // Per-project: count activity, comments, threads, GitHub commits in last 24h
  const sections: string[] = [];

  for (const project of projects) {
    // Pre-fetch this project's thread IDs for the comment count query
    const { data: projectThreads } = await admin
      .from('comment_threads').select('id').eq('project_id', project.id);
    const threadIds = (projectThreads ?? []).map(t => t.id);

    const [
      { count: activityCount },
      { count: commentsCount },
      { count: approvalsChanged },
      { data: latestThreads },
      commits,
    ] = await Promise.all([
      admin.from('activity_log')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', project.id).gte('created_at', since),
      threadIds.length
        ? admin.from('comment_messages')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', since).in('thread_id', threadIds)
        : Promise.resolve({ count: 0 }),
      admin.from('client_approvals')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', project.id).gte('updated_at', since),
      admin.from('comment_threads')
        .select('id, title, status, priority, workspace, updated_at')
        .eq('project_id', project.id).gte('updated_at', since)
        .neq('status', 'resolved').order('updated_at', { ascending: false }).limit(5),
      project.github_repo
        ? listRecentCommits(project.github_repo, 50).then(rs =>
            rs.filter(c => c.date >= since))
        : Promise.resolve([] as GhCommit[]),
    ]);

    const total = (activityCount ?? 0) + (commentsCount ?? 0) + (approvalsChanged ?? 0) + commits.length;
    if (total === 0) continue;

    const threads = latestThreads ?? [];
    const commitItems = (commits as GhCommit[]).slice(0, 5).map(c => `
      <li style="margin:4px 0;">
        <code style="background:#f3f4f6;padding:2px 4px;border-radius:3px;font-size:12px;">${c.sha}</code>
        ${escape(c.message)}
        <span style="color:#9ca3af;font-size:12px;">— ${escape(c.author_name)}</span>
      </li>
    `).join('');

    const threadItems = threads.map(t => `
      <li style="margin:4px 0;">
        <strong>${escape(t.title ?? '(תגובה)')}</strong>
        <span style="color:#9ca3af;font-size:12px;">${escape(t.workspace ?? '')}</span>
      </li>
    `).join('');

    sections.push(`
      <div style="margin:20px 0;padding:16px;border:1px solid #e5e7eb;border-radius:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <h2 style="margin:0;font-size:16px;font-weight:700;">${escape(project.name)}</h2>
          <span style="background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:9999px;font-size:11px;">
            ${escape(STAGE_LABELS[project.current_stage] ?? project.current_stage)}
          </span>
        </div>
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
          ${activityCount ?? 0} פעולות ·
          ${commentsCount ?? 0} תגובות ·
          ${approvalsChanged ?? 0} אישורים ·
          ${commits.length} commits
        </p>
        ${threadItems ? `<p style="margin:8px 0 4px;font-size:13px;font-weight:600;">תגובות פעילות:</p><ul style="margin:0;padding-inline-start:16px;font-size:13px;">${threadItems}</ul>` : ''}
        ${commitItems ? `<p style="margin:12px 0 4px;font-size:13px;font-weight:600;">Commits אחרונים:</p><ul style="margin:0;padding-inline-start:16px;font-size:13px;">${commitItems}</ul>` : ''}
      </div>
    `);
  }

  if (sections.length === 0) return null;

  return `
    <p>סיכום של מה שקרה ב-24 השעות האחרונות בפרויקטים שלך.</p>
    ${sections.join('')}
  `;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',
  }[c]!));
}

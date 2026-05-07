'use server';

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { listRecentCommits } from '@/app/actions/github';
import { STAGE_LABELS, WORKSPACE_BY_SLUG } from '@/lib/client-workspaces';

type Result =
  | { ok: true; answer: string }
  | { ok: false; error: string };

/**
 * Take a free-form question about a project and answer it in Hebrew using
 * Claude with the project's current state as context. The "MCP-style" data
 * dump lives entirely in the system prompt (cached) so the user prompt is
 * just their question.
 */
export async function askAboutProject(input: {
  projectSlug: string;
  question: string;
}): Promise<Result> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: 'ANTHROPIC_API_KEY לא מוגדר' };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, name, client_name, description, current_stage, status, target_at, kickoff_at, launched_at, github_repo, vercel_url, workspace_settings, design_tokens')
    .eq('slug', input.projectSlug)
    .single<{
      id: string; slug: string; name: string; client_name: string | null;
      description: string | null; current_stage: string; status: string;
      target_at: string | null; kickoff_at: string | null; launched_at: string | null;
      github_repo: string | null; vercel_url: string | null;
      workspace_settings: Record<string, Record<string, string | null>> | null;
      design_tokens: unknown;
    }>();
  if (!project) return { ok: false, error: 'פרויקט לא נמצא' };

  // Gather state in parallel
  const [
    { data: pages },
    { data: cpts },
    { data: openThreads },
    { data: pendingApps },
    { data: recentActivity },
    { data: recentMsgs },
    commits,
  ] = await Promise.all([
    supabase.from('pages')
      .select('slug, name_he, type, status, parent_id')
      .eq('project_id', project.id).order('order'),
    supabase.from('cpts')
      .select('slug, name_he')
      .eq('project_id', project.id),
    supabase.from('comment_threads')
      .select('id, workspace, context_type, status, priority, title, updated_at')
      .eq('project_id', project.id)
      .neq('status', 'resolved').neq('status', 'wont_fix')
      .order('updated_at', { ascending: false }).limit(15),
    supabase.from('client_approvals')
      .select('workspace, title, status')
      .eq('project_id', project.id).neq('status', 'approved')
      .limit(15),
    supabase.from('activity_log')
      .select('summary, kind, entity_type, created_at, actor_label')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false }).limit(20),
    supabase.from('comment_messages')
      .select('body, author_label, created_at, thread_id')
      .order('created_at', { ascending: false }).limit(10),
    project.github_repo
      ? listRecentCommits(project.github_repo, 10).then(r => r.commits)
      : Promise.resolve([]),
  ]);

  // Build a compact state snapshot for the model.
  const stage = STAGE_LABELS[project.current_stage as keyof typeof STAGE_LABELS] ?? project.current_stage;
  const launchAt = project.workspace_settings?.launch?.launch_at ?? project.target_at ?? null;

  const pagesList = (pages ?? []).map(p =>
    `- ${p.name_he ?? p.slug} [/${p.slug}] (${p.type}, סטטוס=${p.status}${p.parent_id ? ', יש הורה' : ''})`
  ).join('\n');

  const cptsList = (cpts ?? []).map(c => `- ${c.name_he ?? c.slug} (slug=${c.slug})`).join('\n');

  const threadsList = (openThreads ?? []).map(t => {
    const ws = WORKSPACE_BY_SLUG[t.workspace as keyof typeof WORKSPACE_BY_SLUG];
    return `- [${t.context_type}${ws ? ` · ${ws.label}` : ''} · עדיפות=${t.priority} · סטטוס=${t.status}] ${t.title ?? '(ללא כותרת)'}`;
  }).join('\n');

  const appsList = (pendingApps ?? []).map(a => {
    const ws = WORKSPACE_BY_SLUG[a.workspace as keyof typeof WORKSPACE_BY_SLUG];
    return `- [${ws?.label ?? a.workspace} · ${a.status}] ${a.title}`;
  }).join('\n');

  const activityList = (recentActivity ?? []).map(a =>
    `- ${a.created_at?.slice(0,10) ?? ''} · ${a.actor_label ?? 'משתמש'} · ${a.summary ?? `${a.kind} ${a.entity_type}`}`
  ).join('\n');

  const commentsList = (recentMsgs ?? []).map(m =>
    `- ${m.created_at?.slice(0,10) ?? ''} · ${m.author_label ?? '?'}: ${(m.body ?? '').slice(0, 200)}`
  ).join('\n');

  const commitsList = commits.slice(0, 5).map(c =>
    `- ${c.sha} · ${c.author_login ?? c.author_name} · ${c.message}`
  ).join('\n');

  const tokens = (project.design_tokens && typeof project.design_tokens === 'object')
    ? JSON.stringify(project.design_tokens, null, 2)
    : '(לא הוגדרו)';

  const systemPrompt = `אתה עוזר AI של מנהל פרויקט בסטודיו Elevate Digital Studio. ענה בעברית בצורה תכליתית ומדויקת על שאלות לגבי הפרויקט הזה. סמוך רק על הנתונים למטה — אל תמציא.

# הפרויקט
שם: ${project.name}${project.client_name ? ` (${project.client_name})` : ''}
תיאור: ${project.description ?? '(אין)'}
שלב: ${stage}
סטטוס: ${project.status}
תאריך עליה לאוויר: ${launchAt ?? '(לא נקבע)'}
Kickoff: ${project.kickoff_at ?? '(לא ידוע)'}
GitHub: ${project.github_repo ?? '(לא מקושר)'}
Vercel URL: ${project.vercel_url ?? '(לא מוגדר)'}

# Design tokens
\`\`\`json
${tokens}
\`\`\`

# עמודים בפרויקט (${pages?.length ?? 0})
${pagesList || '(אין)'}

# CPTs (${cpts?.length ?? 0})
${cptsList || '(אין)'}

# threads פתוחים — תגובות / טיקטים שעדיין לא נסגרו (${openThreads?.length ?? 0})
${threadsList || '(אין)'}

# פריטים שממתינים לאישור הלקוח / שינוי דרוש (${pendingApps?.length ?? 0})
${appsList || '(אין)'}

# פעילות אחרונה במערכת
${activityList || '(אין)'}

# תגובות אחרונות
${commentsList || '(אין)'}

# Commits אחרונים בריפו
${commitsList || '(אין)'}

# הוראות
- ענה תמיד בעברית, ניטרלית ותכליתית.
- כשהשאלה היא "מה נשאר?", סכם לפי שלב הפרויקט הנוכחי ומה עדיין לא הסתיים.
- כשהשאלה היא לגבי עמודים/סקשנים — תן רשימה.
- אם משהו לא קיים בנתונים, אמור שאתה לא יודע ולא תמציא.`;

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 4000,
      thinking: { type: 'adaptive' },
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: input.question }],
    });
    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return { ok: false, error: 'Claude לא החזיר תגובה טקסטואלית' };
    }
    return { ok: true, answer: textBlock.text };
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      return { ok: false, error: `שגיאת Claude (${e.status}): ${e.message}` };
    }
    return { ok: false, error: `שגיאה: ${(e as Error).message}` };
  }
}

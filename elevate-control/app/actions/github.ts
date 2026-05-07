'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { PageStatus } from '@/lib/supabase/database.types';

type Result<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

interface ProjectRepoInfo {
  id: string;
  slug: string;
  github_repo: string | null;
  github_html_path: string | null;
  github_theme_path: string | null;
}

const DEFAULT_FRONTEND_PATH = 'frontend';
const DEFAULT_THEME_PATH    = 'wp-theme';

/**
 * Update GitHub-related project fields. The repo string is canonicalized
 * to "owner/repo" — accepting full URLs, "git@" forms, or bare slug pairs.
 */
export async function updateProjectRepo(
  projectId: string,
  projectSlug: string,
  patch: { repo?: string | null; htmlPath?: string | null; themePath?: string | null }
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  let normalized: string | null = null;
  if (patch.repo !== undefined && patch.repo !== null) {
    const trimmed = patch.repo.trim();
    if (trimmed === '') {
      normalized = null;
    } else {
      const m = trimmed.match(/(?:github\.com[:/]|^)([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/.*)?$/);
      if (!m) return { ok: false, error: 'פורמט repo לא חוקי. השתמשו ב-owner/repo או URL מלא של GitHub.' };
      normalized = `${m[1]}/${m[2]}`;
    }
  }

  const update: Record<string, string | null> = {};
  if (patch.repo      !== undefined) update.github_repo       = normalized;
  if (patch.htmlPath  !== undefined) update.github_html_path  = patch.htmlPath?.trim() || null;
  if (patch.themePath !== undefined) update.github_theme_path = patch.themePath?.trim() || null;

  const { error } = await supabase
    .from('projects')
    .update(update)
    .eq('id', projectId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${projectSlug}`);
  return { ok: true };
}

interface GhTreeEntry { path: string; type: 'blob' | 'tree' }

/**
 * Recursively pull the file tree of a directory inside the project's repo
 * via GitHub's REST API. Uses GITHUB_TOKEN if set (private repos / higher
 * rate limits); otherwise falls back to anonymous access (public repos
 * only, ~60 reqs/hour).
 */
async function ghListTree(
  repo: string,
  ref: string,
  rootPath: string
): Promise<GhTreeEntry[]> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Resolve ref → commit SHA → tree SHA
  const branchRes = await fetch(`https://api.github.com/repos/${repo}/branches/${ref}`, { headers });
  if (!branchRes.ok) {
    throw new Error(`GitHub: cannot read branch ${ref} (${branchRes.status})`);
  }
  const branch = await branchRes.json();
  const treeSha = branch.commit?.commit?.tree?.sha;
  if (!treeSha) throw new Error('GitHub: missing tree sha');

  const treeRes = await fetch(
    `https://api.github.com/repos/${repo}/git/trees/${treeSha}?recursive=1`,
    { headers },
  );
  if (!treeRes.ok) throw new Error(`GitHub: cannot read tree (${treeRes.status})`);
  const tree = await treeRes.json();
  if (tree.truncated) {
    console.warn('[ghListTree] tree was truncated — large repo, results partial');
  }
  const all = (tree.tree ?? []) as GhTreeEntry[];

  const prefix = rootPath.replace(/\/+$/, '') + '/';
  return all
    .filter(e => e.path === rootPath || e.path.startsWith(prefix))
    .map(e => ({ ...e, path: e.path.replace(new RegExp(`^${rootPath.replace(/\/+$/, '')}/?`), '') }))
    .filter(e => e.path !== '');
}

/**
 * Sync page/section progress from the linked GitHub repo.
 *
 *   <repo>/<frontend_path>/sections/<def-slug>.html  → section status='built'
 *   <repo>/<frontend_path>/<page-slug>.html          → page status='built'
 *   <repo>/<frontend_path>/<page-slug>/index.html    → page status='built'
 *   <repo>/<theme_path>/templates/parts/sections/<def-slug>.php  → section 'in_dev'
 *   any file under <theme_path>/                                 → page 'in_dev' if currently 'sectioned'
 *
 * Detection only ever ADVANCES status — it never regresses (a page already
 * 'reviewed' or 'live' won't be knocked back to 'built').
 */
export async function syncFromGithub(
  projectId: string,
  projectSlug: string
): Promise<Result<{
  pagesUpdated: number;
  sectionsUpdated: number;
  frontendChecked: number;
  themeChecked: number;
}>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, github_repo, github_html_path, github_theme_path')
    .eq('id', projectId)
    .single<ProjectRepoInfo>();
  if (!project) return { ok: false, error: 'פרויקט לא נמצא' };
  if (!project.github_repo) return { ok: false, error: 'לא הוגדר GitHub repo לפרויקט' };

  const frontendRoot = project.github_html_path  ?? DEFAULT_FRONTEND_PATH;
  const themeRoot    = project.github_theme_path ?? DEFAULT_THEME_PATH;

  // Fetch trees (try main, then master). Errors are non-fatal — we just
  // skip whichever section couldn't be read.
  let frontend: GhTreeEntry[] = [];
  let theme: GhTreeEntry[] = [];
  for (const ref of ['main', 'master']) {
    try {
      if (frontend.length === 0) frontend = await ghListTree(project.github_repo, ref, frontendRoot);
      if (theme.length    === 0) theme    = await ghListTree(project.github_repo, ref, themeRoot);
      if (frontend.length || theme.length) break;
    } catch (e) {
      console.warn(`[syncFromGithub] ${ref} read failed:`, (e as Error).message);
    }
  }

  if (frontend.length === 0 && theme.length === 0) {
    return { ok: false, error: 'לא הצלחנו לקרוא את ה-repo. ודאו שה-repo ציבורי או הגדירו GITHUB_TOKEN ב-Vercel, ושיש main/master.' };
  }

  // Pages + sections to evaluate
  const { data: pagesData } = await supabase
    .from('pages')
    .select('id, slug, status')
    .eq('project_id', projectId);
  const pages = (pagesData ?? []) as { id: string; slug: string; status: PageStatus }[];

  const pageIds = pages.map(p => p.id);
  const { data: sectionsData } = pageIds.length
    ? await supabase
        .from('sections')
        .select('id, page_id, definition_slug, status')
        .in('page_id', pageIds)
    : { data: [] as { id: string; page_id: string; definition_slug: string; status: string }[] };
  const sections = sectionsData ?? [];

  // Index frontend paths
  const frontendPaths = new Set(frontend.map(e => e.path));
  const themePaths    = new Set(theme.map(e => e.path));

  // Status ordering — only advance, never regress
  const PAGE_RANK: Record<PageStatus, number> = {
    planned: 0, designed: 1, sectioned: 2, in_dev: 3, built: 4, reviewed: 5, live: 6,
  };
  function nextPageStatus(current: PageStatus, candidate: PageStatus): PageStatus {
    return PAGE_RANK[candidate] > PAGE_RANK[current] ? candidate : current;
  }

  let pagesUpdated = 0;
  let sectionsUpdated = 0;

  // Pages: detect frontend builds
  for (const page of pages) {
    let target: PageStatus = page.status;

    // Frontend: <slug>.html OR <slug>/index.html OR a folder named <slug>
    const hasFrontend =
      frontendPaths.has(`${page.slug}.html`) ||
      frontendPaths.has(`${page.slug}/index.html`) ||
      Array.from(frontendPaths).some(p => p.startsWith(`${page.slug}/`));

    if (hasFrontend) target = nextPageStatus(target, 'built');

    // Theme: any file mentioning the slug (a template-name.php / page-<slug>.php)
    const hasThemeMention = Array.from(themePaths).some(p =>
      p.includes(`${page.slug}.php`) || p.includes(`page-${page.slug}.php`)
    );
    if (hasThemeMention) target = nextPageStatus(target, 'in_dev');

    if (target !== page.status) {
      const { error } = await supabase
        .from('pages')
        .update({ status: target })
        .eq('id', page.id);
      if (!error) pagesUpdated++;
    }
  }

  // Sections: detect frontend / theme presence by definition_slug
  for (const sec of sections) {
    if (!sec.definition_slug) continue;
    let nextStatus: string | null = null;

    const hasFrontend =
      frontendPaths.has(`sections/${sec.definition_slug}.html`) ||
      frontendPaths.has(`sections/${sec.definition_slug}/index.html`) ||
      Array.from(frontendPaths).some(p => p.startsWith(`sections/${sec.definition_slug}/`));

    const hasTheme = Array.from(themePaths).some(p =>
      p.endsWith(`/sections/${sec.definition_slug}.php`) ||
      p.endsWith(`/parts/sections/${sec.definition_slug}.php`)
    );

    if (hasTheme) nextStatus = 'built';
    else if (hasFrontend) nextStatus = 'in_dev';

    // Only advance if the section is currently planned/confirmed/in_dev.
    if (nextStatus &&
        (sec.status === 'planned' || sec.status === 'confirmed' || (sec.status === 'in_dev' && nextStatus === 'built'))) {
      const { error } = await supabase
        .from('sections')
        .update({ status: nextStatus })
        .eq('id', sec.id);
      if (!error) sectionsUpdated++;
    }
  }

  await supabase.from('activity_log').insert({
    project_id:  projectId,
    actor_id:    user.id,
    actor_label: 'GitHub Sync',
    kind:        'updated',
    entity_type: 'project',
    entity_id:   projectId,
    summary:     `סנכרון מ-GitHub: ${pagesUpdated} עמודים, ${sectionsUpdated} סקשנים עודכנו`,
  });

  revalidatePath(`/projects/${projectSlug}`);
  return {
    ok: true,
    data: {
      pagesUpdated, sectionsUpdated,
      frontendChecked: frontend.length, themeChecked: theme.length,
    },
  };
}

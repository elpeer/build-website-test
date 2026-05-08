'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProjectRepo, syncFromGithub } from '@/app/actions/github';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Github, RefreshCw, Save, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

interface Props {
  projectId: string;
  projectSlug: string;
  initialRepo: string | null;
  initialHtmlPath: string | null;
  initialThemePath: string | null;
}

export function GithubPanel({
  projectId, projectSlug, initialRepo, initialHtmlPath, initialThemePath,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [repo, setRepo] = useState(initialRepo ?? '');
  const [htmlPath, setHtmlPath] = useState(initialHtmlPath ?? 'frontend');
  const [themePath, setThemePath] = useState(initialThemePath ?? 'wp-theme');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isSyncing, startSync] = useTransition();

  function handleSave() {
    setError(null); setSuccess(null);
    startSave(async () => {
      const result = await updateProjectRepo(projectId, projectSlug, {
        repo: repo || null,
        htmlPath: htmlPath || null,
        themePath: themePath || null,
      });
      if (result.ok) {
        setEditing(false);
        setSuccess('נשמר.');
        router.refresh();
      } else setError(result.error);
    });
  }

  function handleSync() {
    setError(null); setSuccess(null);
    startSync(async () => {
      const result = await syncFromGithub(projectId, projectSlug);
      if (result.ok) {
        setSuccess(
          `סנכרון בוצע — עודכנו ${result.data.pagesUpdated} עמודים ו-${result.data.sectionsUpdated} סקשנים. (frontend: ${result.data.frontendChecked} קבצים, theme: ${result.data.themeChecked} קבצים)`
        );
        router.refresh();
      } else setError(result.error);
    });
  }

  const repoUrl = initialRepo ? `https://github.com/${initialRepo}` : null;

  return (
    <div className="space-y-3 rounded-md border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Github className="h-4 w-4" />
          GitHub
        </h3>
        {!editing && initialRepo && (
          <Button type="button" variant="accent" size="sm" onClick={handleSync} disabled={isSyncing}>
            <RefreshCw className={`ms-1 h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'מסנכרן...' : 'סנכרן התקדמות'}
          </Button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-2 text-sm">
          {initialRepo ? (
            <div className="flex items-center gap-2">
              <span className="text-muted-fg">Repo:</span>
              <a href={repoUrl ?? '#'} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1 font-mono text-brand hover:underline" dir="ltr">
                {initialRepo}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : (
            <p className="text-muted-fg">לא הוגדר repo. הוסיפו כדי לאפשר סנכרון אוטומטי של ההתקדמות.</p>
          )}
          {initialRepo && (
            <p className="text-xs text-muted-fg">
              Frontend: <code className="rounded bg-muted px-1.5">{initialHtmlPath ?? 'frontend'}</code>
              <span className="mx-2">·</span>
              Theme: <code className="rounded bg-muted px-1.5">{initialThemePath ?? 'wp-theme'}</code>
            </p>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
            {initialRepo ? 'ערוך הגדרות' : 'הוסף repo'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <Label htmlFor="gh_repo" className="text-xs">Repo</Label>
            <Input id="gh_repo" value={repo} dir="ltr"
                   className="font-mono"
                   placeholder="owner/repo או https://github.com/owner/repo"
                   onChange={e => setRepo(e.target.value)} />
            <p className="mt-1 text-xs text-muted-fg">
              ה-repo יכול להיות פרטי (תוסיפו GITHUB_TOKEN ב-Vercel) או ציבורי.
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <Label htmlFor="gh_html" className="text-xs">תיקיית Frontend</Label>
              <Input id="gh_html" value={htmlPath} dir="ltr" className="font-mono"
                     onChange={e => setHtmlPath(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="gh_theme" className="text-xs">תיקיית WP Theme</Label>
              <Input id="gh_theme" value={themePath} dir="ltr" className="font-mono"
                     onChange={e => setThemePath(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm"
                    onClick={() => { setEditing(false); setError(null); setRepo(initialRepo ?? ''); }}>
              ביטול
            </Button>
            <Button type="button" variant="accent" size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="ms-1 h-3.5 w-3.5" />
              {isSaving ? 'שומר...' : 'שמור'}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-2 text-xs text-green-700">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{success}</span>
        </div>
      )}
    </div>
  );
}

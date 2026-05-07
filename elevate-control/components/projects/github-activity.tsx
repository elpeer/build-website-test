import { listRecentCommits } from '@/app/actions/github';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitCommit, ExternalLink, Github, AlertCircle, Info } from 'lucide-react';

interface Props {
  repo: string | null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'הרגע';
  const min = Math.floor(sec / 60);
  if (min < 60) return `לפני ${min} דק׳`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `לפני ${hr} שע׳`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `לפני ${days} ימים`;
  return new Date(iso).toLocaleDateString('he-IL');
}

export async function GithubActivity({ repo }: Props) {
  if (!repo) return null;
  const { commits, error, hasToken } = await listRecentCommits(repo, 15);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          פעילות בריפו
        </CardTitle>
        <CardDescription>
          {commits.length > 0
            ? <>{commits.length} commits אחרונים מ-<code dir="ltr" className="rounded bg-muted px-1.5">{repo}</code></>
            : <code dir="ltr" className="rounded bg-muted px-1.5">{repo}</code>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">לא הצלחנו לקרוא את ה-repo</p>
              <p className="mt-1 text-xs">{error}</p>
              {!hasToken && (
                <p className="mt-2 text-xs">
                  הוסיפו <code>GITHUB_TOKEN</code> ב-Vercel Environment Variables (PAT עם scope <code>repo</code>) כדי להעלות את ה-rate limit ולקרוא ריפו פרטי.
                </p>
              )}
            </div>
          </div>
        )}

        {!error && commits.length === 0 && (
          <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>אין עדיין commits ב-main / master.</p>
          </div>
        )}

        {commits.length > 0 && (
          <ul className="space-y-2">
            {commits.map(c => (
              <li key={c.sha} className="flex items-start gap-3 rounded-md border border-border bg-background p-3">
                {c.author_avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.author_avatar_url} alt={c.author_name}
                       className="h-8 w-8 shrink-0 rounded-full" />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <GitCommit className="h-4 w-4 text-muted-fg" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.message}</p>
                  <p className="mt-0.5 text-xs text-muted-fg">
                    <span className="font-mono">{c.sha}</span>
                    <span className="mx-2">·</span>
                    <span>{c.author_login ?? c.author_name}</span>
                    <span className="mx-2">·</span>
                    <span>{timeAgo(c.date)}</span>
                  </p>
                </div>
                <a href={c.url} target="_blank" rel="noopener noreferrer"
                   className="shrink-0 text-muted-fg hover:text-brand"
                   aria-label="פתח ב-GitHub">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

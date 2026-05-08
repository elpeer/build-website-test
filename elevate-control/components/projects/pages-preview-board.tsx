import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { listProjectHtmlFiles } from '@/app/actions/github';
import { findPagePreview } from '@/lib/preview-links';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Globe, ExternalLink, AlertTriangle, CheckCircle2, FileText, Folder, Layers, Settings, AlertTriangle as AT,
} from 'lucide-react';
import type { PageType } from '@/lib/supabase/database.types';

interface Props {
  projectId: string;
  projectSlug: string;
}

interface PageRow {
  id: string;
  slug: string;
  name_he: string | null;
  type: PageType;
}

const PAGE_TYPE_ICONS: Record<PageType, React.ComponentType<{ className?: string }>> = {
  page: FileText, archive: Folder, single: Layers, system: AT, service: Settings,
};

export async function PagesPreviewBoard({ projectId, projectSlug }: Props) {
  const supabase = await createClient();

  const { data: pagesData } = await supabase
    .from('pages').select('id, slug, name_he, type')
    .eq('project_id', projectId)
    .order('order', { ascending: true });
  const pages = (pagesData ?? []) as PageRow[];
  if (pages.length === 0) return null;

  const { files, htmlPath, vercelUrl, error } = await listProjectHtmlFiles(projectId);

  // Don't render if we can't tell anything (no repo + no vercel url + nothing)
  if (error && !vercelUrl) return null;

  const found    = pages.filter(p => findPagePreview(files, p.slug, vercelUrl).status === 'found').length;
  const missing  = pages.length - found;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          לינקי תצוגה לעמודים
        </CardTitle>
        <CardDescription>
          מותאם בין שמות העמודים לקבצים תחת{' '}
          <code dir="ltr" className="rounded bg-muted px-1.5">{htmlPath || 'frontend'}</code>{' '}
          ב-GitHub. {found} נמצאו · {missing} חסרים.
          {!vercelUrl && (
            <span className="block mt-1 text-amber-700">
              לא הוגדר Vercel URL — לינקי תצוגה לא ייווצרו. ערוך ב-{' '}
              <Link href={`/projects/${projectSlug}/settings`} className="underline">הגדרות הפרויקט</Link>.
            </span>
          )}
          {error && (
            <span className="block mt-1 text-amber-700">⚠ {error}</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {pages.map(page => {
            const info = findPagePreview(files, page.slug, vercelUrl);
            const Icon = PAGE_TYPE_ICONS[page.type];
            return (
              <li key={page.id}
                  className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
                <Icon className="h-4 w-4 shrink-0 text-muted-fg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    <Link href={`/projects/${projectSlug}/${page.slug}`} className="hover:text-brand">
                      {page.name_he ?? page.slug}
                    </Link>
                  </p>
                  <p className="truncate text-xs text-muted-fg">
                    <code dir="ltr">/{page.slug}</code>
                    {info.matchedFile && (
                      <> · קובץ:{' '}
                        <code dir="ltr">{htmlPath}/{info.matchedFile}</code>
                      </>
                    )}
                  </p>
                </div>
                {info.status === 'found' ? (
                  info.previewUrl ? (
                    <a href={info.previewUrl} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100">
                      <CheckCircle2 className="h-3 w-3" />
                      תצוגה
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                      <CheckCircle2 className="h-3 w-3" />
                      קובץ נמצא
                    </span>
                  )
                ) : (
                  <details className="ms-auto">
                    <summary className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100">
                      <AlertTriangle className="h-3 w-3" />
                      חסר
                    </summary>
                    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                      ציפינו לקובץ באחד מהשמות:
                      <ul className="mt-1 list-disc ps-5">
                        {info.expectedFiles.map(f => (
                          <li key={f}><code dir="ltr">{htmlPath}/{f}</code></li>
                        ))}
                      </ul>
                    </div>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

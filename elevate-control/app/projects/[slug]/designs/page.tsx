import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Monitor, Tablet, Smartphone } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DesignUploader } from '@/components/designs/design-uploader';
import { DesignCard } from '@/components/designs/design-card';
import type { DesignViewport } from '@/lib/supabase/database.types';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ viewport?: string; page?: string }>;
}

interface DesignRecord {
  id: string;
  viewport: DesignViewport;
  storage_path: string;
  file_url: string;
  mime_type: string | null;
  notes: string | null;
  created_at: string;
  page_id: string | null;
}

interface PageRecord {
  id: string;
  slug: string;
  name_he: string | null;
}

const VIEWPORT_TABS: { value: DesignViewport | 'all'; label: string; icon: typeof Monitor | null }[] = [
  { value: 'all',     label: 'הכל',   icon: null       },
  { value: 'desktop', label: 'דסקטופ', icon: Monitor    },
  { value: 'tablet',  label: 'טאבלט',  icon: Tablet     },
  { value: 'mobile',  label: 'מובייל', icon: Smartphone },
];

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: `עיצובים · ${slug}` };
}

export default async function DesignsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { viewport: viewportFilter } = await searchParams;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, name')
    .eq('slug', slug)
    .single<{ id: string; slug: string; name: string }>();

  if (!project) notFound();

  const { data: pagesData } = await supabase
    .from('pages')
    .select('id, slug, name_he')
    .eq('project_id', project.id)
    .order('order', { ascending: true });

  const pages = (pagesData ?? []) as PageRecord[];
  const pagesById = new Map(pages.map(p => [p.id, p]));

  let designsQuery = supabase
    .from('designs')
    .select('id, viewport, storage_path, file_url, mime_type, notes, created_at, page_id')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false });

  const isViewportFilter = ['desktop', 'tablet', 'mobile'].includes(viewportFilter ?? '');
  if (isViewportFilter) {
    designsQuery = designsQuery.eq('viewport', viewportFilter as DesignViewport);
  }

  const { data: designsData } = await designsQuery;
  const designs = ((designsData ?? []) as DesignRecord[]).map(d => {
    const page = d.page_id ? pagesById.get(d.page_id) : null;
    return {
      ...d,
      page_slug: page?.slug ?? null,
      page_name: page?.name_he ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        href={`/projects/${project.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-fg hover:text-brand"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        חזרה ל-{project.name}
      </Link>

      <header>
        <h1 className="text-3xl font-bold tracking-tight">עיצובים</h1>
        <p className="mt-1 text-sm text-muted-fg">
          העלו קבצי עיצוב לכל פרויקט. שייכו לעמוד ולגודל מסך כדי לעזור למפתחים למצוא את הקובץ הנכון.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>העלאת עיצוב</CardTitle>
          <CardDescription>גררו לכאן או לחצו לבחירת קובץ</CardDescription>
        </CardHeader>
        <CardContent>
          <DesignUploader
            projectId={project.id}
            projectSlug={project.slug}
            pages={pages}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>גלריית עיצובים</CardTitle>
              <CardDescription>{designs.length} קבצים</CardDescription>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {VIEWPORT_TABS.map(tab => {
              const Icon = tab.icon;
              const active = (viewportFilter ?? 'all') === tab.value;
              const href = tab.value === 'all'
                ? `/projects/${project.slug}/designs`
                : `/projects/${project.slug}/designs?viewport=${tab.value}`;
              return (
                <Link
                  key={tab.value}
                  href={href}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                    active
                      ? 'border-brand bg-brand/5 text-brand'
                      : 'border-border bg-background text-muted-fg hover:border-brand/40'
                  }`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </CardHeader>
        <CardContent>
          {designs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-fg">
              עדיין לא הועלו עיצובים{isViewportFilter ? ` ל-${viewportFilter}` : ''}.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {designs.map(d => (
                <DesignCard key={d.id} design={d} projectSlug={project.slug} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

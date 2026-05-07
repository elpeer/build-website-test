import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Monitor, Tablet, Smartphone, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { DesignAnalysisPanel } from '@/components/designs/design-analysis-panel';
import type { DesignViewport, Json } from '@/lib/supabase/database.types';

interface Props {
  params: Promise<{ slug: string; pageSlug: string; designId: string }>;
}

interface DesignRecord {
  id: string;
  project_id: string;
  page_id: string | null;
  viewport: DesignViewport;
  storage_path: string;
  file_url: string;
  mime_type: string | null;
  notes: string | null;
  ai_analysis: Json | null;
  ai_analyzed_at: string | null;
  created_at: string;
}

const VIEWPORT_ICONS: Record<DesignViewport, typeof Monitor> = {
  desktop: Monitor, tablet: Tablet, mobile: Smartphone,
};
const VIEWPORT_LABELS: Record<DesignViewport, string> = {
  desktop: 'דסקטופ', tablet: 'טאבלט', mobile: 'מובייל',
};

export async function generateMetadata({ params }: Props) {
  const { pageSlug } = await params;
  return { title: `עיצוב · ${pageSlug}` };
}

export default async function DesignDetailPage({ params }: Props) {
  const { slug, pageSlug, designId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, name')
    .eq('slug', slug)
    .single<{ id: string; slug: string; name: string }>();
  if (!project) notFound();

  const { data: page } = await supabase
    .from('pages')
    .select('id, slug, name_he')
    .eq('project_id', project.id)
    .eq('slug', pageSlug)
    .single<{ id: string; slug: string; name_he: string | null }>();
  if (!page) notFound();

  const { data: design } = await supabase
    .from('designs')
    .select('id, project_id, page_id, viewport, storage_path, file_url, mime_type, notes, ai_analysis, ai_analyzed_at, created_at')
    .eq('id', designId)
    .single<DesignRecord>();
  if (!design || design.project_id !== project.id) notFound();

  const Icon = VIEWPORT_ICONS[design.viewport];
  const isImage = design.mime_type?.startsWith('image/');

  return (
    <div className="mx-auto max-w-[1600px] space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/projects/${project.slug}/${page.slug}`}
          className="inline-flex items-center gap-1 text-sm text-muted-fg hover:text-brand"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          חזרה ל-{page.name_he ?? page.slug}
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
          <Icon className="h-3.5 w-3.5" />
          {VIEWPORT_LABELS[design.viewport]}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-md border border-border bg-muted/40 p-2">
          {isImage ? (
            <a href={design.file_url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={design.file_url}
                alt={design.notes ?? 'עיצוב מלא'}
                className="block w-full rounded"
              />
            </a>
          ) : (
            <div className="flex h-96 items-center justify-center text-muted-fg">
              <FileText className="h-12 w-12" />
              <a href={design.file_url} target="_blank" rel="noopener noreferrer" className="ms-3 text-sm text-brand hover:underline">
                פתח את הקובץ
              </a>
            </div>
          )}
          {design.notes && (
            <p className="mt-2 px-2 text-xs text-muted-fg">{design.notes}</p>
          )}
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <DesignAnalysisPanel
            designId={design.id}
            projectId={project.id}
            projectSlug={project.slug}
            pageId={page.id}
            pageSlug={page.slug}
            isImage={!!isImage}
            initialAnalysis={design.ai_analysis}
            analyzedAt={design.ai_analyzed_at}
          />
        </div>
      </div>
    </div>
  );
}

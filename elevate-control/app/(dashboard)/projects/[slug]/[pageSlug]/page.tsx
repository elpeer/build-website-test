import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, FileText, Folder, Layers, Settings, AlertTriangle, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddSectionPicker } from '@/components/sections/add-section-picker';
import { SectionRow } from '@/components/sections/section-row';
import { DesignUploader } from '@/components/designs/design-uploader';
import { PageStructureSuggester } from '@/components/pages/page-structure-suggester';
import { DeletePageButton } from '@/components/pages/delete-page-button';
import { PageDevSettings } from '@/components/projects/page-dev-settings';
import type { DesignViewport, PageStatus, PageType, SectionStatus } from '@/lib/supabase/database.types';

interface Props {
  params: Promise<{ slug: string; pageSlug: string }>;
}

interface ProjectRecord {
  id: string;
  slug: string;
  name: string;
}

interface PageRecord {
  id: string;
  slug: string;
  name_he: string | null;
  name_en: string | null;
  type: PageType;
  status: PageStatus;
  dev_status: 'in_dev' | 'awaiting_pm' | 'pm_approved' | 'client_visible';
  notes: string | null;
  creation_context: unknown;
  preview_url_override: string | null;
  cms_url_override: string | null;
}

interface SectionRecord {
  id: string;
  definition_slug: string;
  status: SectionStatus;
  notes: string | null;
  order: number;
  content: unknown;
}

interface DefinitionRecord {
  id: string;
  slug: string;
  name_he: string | null;
  name_en: string | null;
  category: string | null;
  description: string | null;
}

interface DesignThumb {
  id: string;
  viewport: DesignViewport;
  file_url: string;
  mime_type: string | null;
  ai_analyzed_at: string | null;
}

const PAGE_TYPE_LABELS: Record<PageType, string> = {
  page:    'עמוד רגיל',
  archive: 'ארכיון CPT',
  single:  'עמוד פנימי CPT',
  system:  'עמוד מערכת',
  service: 'עמוד שירות',
};

const PAGE_TYPE_ICONS: Record<PageType, React.ComponentType<{ className?: string }>> = {
  page: FileText, archive: Folder, single: Layers, system: AlertTriangle, service: Settings,
};

const PAGE_STATUS_LABELS: Record<PageStatus, string> = {
  planned: 'מתוכנן', designed: 'עוצב', sectioned: 'חולק לסקשנים',
  in_dev: 'בפיתוח', built: 'נבנה', reviewed: 'נסקר', live: 'בייצור',
};

const VIEWPORT_LABELS: Record<DesignViewport, string> = {
  desktop: 'דסקטופ', tablet: 'טאבלט', mobile: 'מובייל',
};

export async function generateMetadata({ params }: Props) {
  const { slug, pageSlug } = await params;
  return { title: `${pageSlug} · ${slug}` };
}

export default async function PageDetailPage({ params }: Props) {
  const { slug, pageSlug } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, name')
    .eq('slug', slug)
    .single<ProjectRecord>();

  if (!project) notFound();

  const { data: page } = await supabase
    .from('pages')
    .select('id, slug, name_he, name_en, type, status, dev_status, notes, creation_context, preview_url_override, cms_url_override')
    .eq('project_id', project.id)
    .eq('slug', pageSlug)
    .single<PageRecord>();

  if (!page) notFound();

  const { data: sectionsData } = await supabase
    .from('sections')
    .select('id, definition_slug, status, notes, order, content')
    .eq('page_id', page.id)
    .order('order', { ascending: true });

  const sections: SectionRecord[] = (sectionsData ?? []) as SectionRecord[];

  const { data: definitionsData } = await supabase
    .from('section_definitions')
    .select('id, slug, name_he, name_en, category, description')
    .order('category', { ascending: true });

  const definitions: DefinitionRecord[] = (definitionsData ?? []) as DefinitionRecord[];
  const definitionsBySlug = new Map(definitions.map(d => [d.slug, d]));

  // Designs attached to this page
  const { data: designsData } = await supabase
    .from('designs')
    .select('id, viewport, file_url, mime_type, ai_analyzed_at')
    .eq('page_id', page.id)
    .order('created_at', { ascending: false });

  const designs: DesignThumb[] = (designsData ?? []) as DesignThumb[];

  // Children pages — for the delete confirmation summary
  const { count: childrenCount } = await supabase
    .from('pages')
    .select('id', { count: 'exact', head: true })
    .eq('parent_id', page.id);

  const TypeIcon = PAGE_TYPE_ICONS[page.type];
  const ctx = {
    pageId:      page.id,
    projectId:   project.id,
    projectSlug: project.slug,
    pageSlug:    page.slug,
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      <Link
        href={`/projects/${project.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-fg hover:text-brand"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        חזרה ל-{project.name}
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <TypeIcon className="h-6 w-6 text-muted-fg" />
            <h1 className="text-3xl font-bold tracking-tight">
              {page.name_he ?? page.slug}
            </h1>
            <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              {PAGE_STATUS_LABELS[page.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-fg">
            <code className="rounded bg-muted px-1.5 py-0.5">/{page.slug}</code>
            <span className="mx-2">·</span>
            {PAGE_TYPE_LABELS[page.type]}
          </p>
        </div>
        <DeletePageButton
          pageId={page.id}
          pageSlug={page.slug}
          pageName={page.name_he ?? page.slug}
          projectSlug={project.slug}
          sectionsCount={sections.length}
          designsCount={designs.length}
          childrenCount={childrenCount ?? 0}
        />
      </header>

      <PageDevSettings
        pageId={page.id}
        projectSlug={project.slug}
        initial={{
          preview_url_override: page.preview_url_override,
          cms_url_override:     page.cms_url_override,
          dev_status:           page.dev_status ?? 'in_dev',
        }}
      />

      {page.notes && (
        <Card>
          <CardContent className="pt-6">
            <p className="whitespace-pre-wrap text-sm text-foreground">{page.notes}</p>
          </CardContent>
        </Card>
      )}

      <PageStructureSuggester
        pageId={page.id}
        projectSlug={project.slug}
        pageSlug={page.slug}
        hasSections={sections.length > 0}
        creationContext={page.creation_context as never}
      />

      <Card>
        <CardHeader>
          <CardTitle>עיצובים של העמוד</CardTitle>
          <CardDescription>
            העלו עיצוב לעמוד הזה. לחיצה על תמונה פותחת את התצוגה המלאה עם כפתור ניתוח עם Claude.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {designs.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {designs.map(d => (
                <Link
                  key={d.id}
                  href={`/projects/${project.slug}/${page.slug}/designs/${d.id}`}
                  className="group relative block overflow-hidden rounded-md border border-border bg-muted transition-shadow hover:shadow-md"
                >
                  <div className="aspect-video bg-muted">
                    {d.mime_type?.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={d.file_url}
                        alt={`עיצוב ${d.viewport}`}
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-fg">
                        <FileText className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-background/95 px-3 py-2 text-xs">
                    <span className="font-medium">{VIEWPORT_LABELS[d.viewport]}</span>
                    {d.ai_analyzed_at ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-brand">
                        <Sparkles className="h-3 w-3" />
                        נותח
                      </span>
                    ) : (
                      <span className="text-muted-fg">טרם נותח</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <details className="rounded-md border border-dashed border-border bg-muted/30 p-4" {...(designs.length === 0 ? { open: true } : {})}>
            <summary className="cursor-pointer text-sm font-medium text-muted-fg hover:text-brand">
              + העלאת עיצוב חדש לעמוד
            </summary>
            <div className="mt-4">
              <DesignUploader
                projectId={project.id}
                projectSlug={project.slug}
                defaultPageId={page.id}
              />
            </div>
          </details>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>סקשנים</CardTitle>
          <CardDescription>
            {sections.length === 0
              ? 'אין סקשנים בעמוד הזה. בחרו סקשן ראשון מהקטלוג למטה, או נתחו עיצוב כדי שייווצרו אוטומטית.'
              : `${sections.length} סקשנים. גרור או השתמש בחיצים לסידור.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {sections.length > 0 && (
            <ul className="space-y-2">
              {sections.map((section, idx) => (
                <SectionRow
                  key={section.id}
                  section={section as never}
                  definition={definitionsBySlug.get(section.definition_slug)}
                  ctx={ctx}
                  promptCtx={{
                    pageNameHe: page.name_he ?? page.slug,
                    pageSlug:   page.slug,
                    pageType:   page.type,
                    projectName: project.name,
                  }}
                  isFirst={idx === 0}
                  isLast={idx === sections.length - 1}
                  index={idx}
                />
              ))}
            </ul>
          )}

          <AddSectionPicker ctx={ctx} definitions={definitions} />

        </CardContent>
      </Card>

    </div>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, FileText, Folder, Layers, Settings, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddSectionPicker } from '@/components/sections/add-section-picker';
import { SectionRow } from '@/components/sections/section-row';
import type { PageStatus, PageType, SectionStatus } from '@/lib/supabase/database.types';

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
  notes: string | null;
}

interface SectionRecord {
  id: string;
  definition_slug: string;
  status: SectionStatus;
  notes: string | null;
  order: number;
}

interface DefinitionRecord {
  id: string;
  slug: string;
  name_he: string | null;
  name_en: string | null;
  category: string | null;
  description: string | null;
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

export async function generateMetadata({ params }: Props) {
  const { slug, pageSlug } = await params;
  return { title: `${pageSlug} · ${slug}` };
}

export default async function PageDetailPage({ params }: Props) {
  const { slug, pageSlug } = await params;
  const supabase = await createClient();

  // Look up the project (also enforces RLS — non-members get null)
  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, name')
    .eq('slug', slug)
    .single<ProjectRecord>();

  if (!project) notFound();

  // Then the page
  const { data: page } = await supabase
    .from('pages')
    .select('id, slug, name_he, name_en, type, status, notes')
    .eq('project_id', project.id)
    .eq('slug', pageSlug)
    .single<PageRecord>();

  if (!page) notFound();

  // Sections on this page
  const { data: sectionsData } = await supabase
    .from('sections')
    .select('id, definition_slug, status, notes, order')
    .eq('page_id', page.id)
    .order('order', { ascending: true });

  const sections: SectionRecord[] = (sectionsData ?? []) as SectionRecord[];

  // Section definitions catalog (for the picker + row labels)
  const { data: definitionsData } = await supabase
    .from('section_definitions')
    .select('id, slug, name_he, name_en, category, description')
    .order('category', { ascending: true });

  const definitions: DefinitionRecord[] = (definitionsData ?? []) as DefinitionRecord[];
  const definitionsBySlug = new Map(definitions.map(d => [d.slug, d]));

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
      </header>

      {page.notes && (
        <Card>
          <CardContent className="pt-6">
            <p className="whitespace-pre-wrap text-sm text-foreground">{page.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>סקשנים</CardTitle>
          <CardDescription>
            {sections.length === 0
              ? 'אין סקשנים בעמוד הזה. בחרו סקשן ראשון מהקטלוג למטה.'
              : `${sections.length} סקשנים. גרור או השתמש בחיצים לסידור.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {sections.length > 0 && (
            <ul className="space-y-2">
              {sections.map((section, idx) => (
                <SectionRow
                  key={section.id}
                  section={section}
                  definition={definitionsBySlug.get(section.definition_slug)}
                  ctx={ctx}
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

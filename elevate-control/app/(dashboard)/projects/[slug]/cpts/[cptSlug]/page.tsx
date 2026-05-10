import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Database } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TaxonomyEditor } from '@/components/cpts/taxonomy-editor';
import { FieldSchemaEditor } from '@/components/cpts/field-schema-editor';
import type { Json } from '@/lib/supabase/database.types';

interface Props {
  params: Promise<{ slug: string; cptSlug: string }>;
}

interface CptRecord {
  id: string;
  slug: string;
  name_he: string | null;
  name_en: string | null;
  description: string | null;
  has_archive: boolean;
  has_single: boolean;
  is_slider_only: boolean;
  field_schema: Json;
}

interface TaxonomyRecord {
  id: string;
  slug: string;
  name_he: string | null;
  hierarchical: boolean;
  terms: Json;
}

export async function generateMetadata({ params }: Props) {
  const { slug: _slugRaw, cptSlug: _cptSlugRaw } = await params; const slug = _slugRaw.normalize('NFC'); const cptSlug = _cptSlugRaw.normalize('NFC');
  return { title: `${cptSlug} · CPT · ${slug}` };
}

export default async function CptDetailPage({ params }: Props) {
  const { slug: _slugRaw, cptSlug: _cptSlugRaw } = await params; const slug = _slugRaw.normalize('NFC'); const cptSlug = _cptSlugRaw.normalize('NFC');
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, name')
    .eq('slug', slug)
    .single<{ id: string; slug: string; name: string }>();

  if (!project) notFound();

  const { data: cpt } = await supabase
    .from('cpts')
    .select('id, slug, name_he, name_en, description, has_archive, has_single, is_slider_only, field_schema')
    .eq('project_id', project.id)
    .eq('slug', cptSlug)
    .single<CptRecord>();

  if (!cpt) notFound();

  const { data: taxonomiesData } = await supabase
    .from('taxonomies')
    .select('id, slug, name_he, hierarchical, terms')
    .eq('cpt_id', cpt.id)
    .order('created_at', { ascending: true });

  const taxonomies = ((taxonomiesData ?? []) as TaxonomyRecord[]).map(t => ({
    id: t.id,
    slug: t.slug,
    name_he: t.name_he,
    hierarchical: t.hierarchical,
    terms: Array.isArray(t.terms) ? (t.terms as string[]) : [],
  }));

  const label = cpt.name_he ?? cpt.name_en ?? cpt.slug;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/projects/${project.slug}/cpts`}
        className="inline-flex items-center gap-1 text-sm text-muted-fg hover:text-brand"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        חזרה ל-CPTs
      </Link>

      <header className="flex items-start gap-4">
        <Database className="mt-1 h-6 w-6 text-muted-fg" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{label}</h1>
          <p className="mt-1 text-sm text-muted-fg">
            <code className="rounded bg-muted px-1.5 py-0.5" dir="ltr">{cpt.slug}</code>
            <span className="mx-2">·</span>
            {cpt.has_archive && <span className="me-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">archive</span>}
            {cpt.has_single && <span className="me-2 rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700">single</span>}
          </p>
          {cpt.description && <p className="mt-2 text-sm text-muted-fg">{cpt.description}</p>}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>טקסונומיות</CardTitle>
          <CardDescription>
            {taxonomies.length === 0
              ? 'עדיין לא הוגדרו טקסונומיות. הוסיפו טקסונומיה כדי לקטלג את התוכן.'
              : `${taxonomies.length} טקסונומיות. כל אחת יכולה להכיל ערכים (terms).`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaxonomyEditor
            projectId={project.id}
            projectSlug={project.slug}
            cptId={cpt.id}
            cptSlug={cpt.slug}
            taxonomies={taxonomies}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>סכמת שדות</CardTitle>
          <CardDescription>
            השדות המותאמים שיופיעו בכל פוסט מסוג {label}. ייוצא ל-ACF בעת בניית התמה.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldSchemaEditor
            cptId={cpt.id}
            projectId={project.id}
            projectSlug={project.slug}
            initialSchema={cpt.field_schema}
          />
        </CardContent>
      </Card>
    </div>
  );
}

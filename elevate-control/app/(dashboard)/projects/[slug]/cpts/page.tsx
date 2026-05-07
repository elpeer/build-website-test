import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CptList } from '@/components/cpts/cpt-list';

interface Props {
  params: Promise<{ slug: string }>;
}

interface CptRow {
  id: string;
  slug: string;
  name_he: string | null;
  name_en: string | null;
  description: string | null;
  has_archive: boolean;
  has_single: boolean;
  order: number;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: `CPTs · ${slug}` };
}

export default async function CptsPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, name')
    .eq('slug', slug)
    .single<{ id: string; slug: string; name: string }>();

  if (!project) notFound();

  const { data: cptsData } = await supabase
    .from('cpts')
    .select('id, slug, name_he, name_en, description, has_archive, has_single, order')
    .eq('project_id', project.id)
    .order('order', { ascending: true });

  const cpts: CptRow[] = (cptsData ?? []) as CptRow[];

  // Counts: taxonomies + pages per CPT
  const cptIds = cpts.map(c => c.id);

  const [{ data: taxonomyCounts }, { data: pageCounts }] = await Promise.all([
    cptIds.length
      ? supabase.from('taxonomies').select('cpt_id').in('cpt_id', cptIds)
      : Promise.resolve({ data: [] as { cpt_id: string }[] }),
    cptIds.length
      ? supabase.from('pages').select('cpt_id').in('cpt_id', cptIds)
      : Promise.resolve({ data: [] as { cpt_id: string | null }[] }),
  ]);

  const taxCount = new Map<string, number>();
  (taxonomyCounts ?? []).forEach(r => {
    taxCount.set(r.cpt_id, (taxCount.get(r.cpt_id) ?? 0) + 1);
  });
  const pageCount = new Map<string, number>();
  (pageCounts ?? []).forEach(r => {
    if (r.cpt_id) pageCount.set(r.cpt_id, (pageCount.get(r.cpt_id) ?? 0) + 1);
  });

  const cptsEnriched = cpts.map(c => ({
    ...c,
    taxonomy_count: taxCount.get(c.id) ?? 0,
    page_count:     pageCount.get(c.id) ?? 0,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/projects/${project.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-fg hover:text-brand"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        חזרה ל-{project.name}
      </Link>

      <header>
        <h1 className="text-3xl font-bold tracking-tight">Custom Post Types</h1>
        <p className="mt-1 text-sm text-muted-fg">
          הגדירו את סוגי התוכן המותאמים של האתר. כל CPT יכול לקבל ארכיון, עמוד פנימי וטקסונומיות משלו.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>CPTs בפרויקט</CardTitle>
          <CardDescription>{cpts.length} CPTs מוגדרים</CardDescription>
        </CardHeader>
        <CardContent>
          <CptList projectId={project.id} projectSlug={project.slug} cpts={cptsEnriched} />
        </CardContent>
      </Card>
    </div>
  );
}

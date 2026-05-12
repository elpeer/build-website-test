import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectBrandForm } from '@/components/projects/project-brand-form';
import { ProgressOverrideEditor } from '@/components/projects/progress-override-editor';
import { DEFAULT_BRAND_TOKENS, type BrandTokens } from '@/lib/brand-tokens';

const STAGE_ORDER = ['quote','spec','design','frontend','backend','qa','integrations','launch','live'] as const;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug: _slugRaw } = await params; const slug = _slugRaw.normalize('NFC');
  return { title: `הגדרות · ${slug}` };
}

export default async function ProjectSettingsPage({ params }: Props) {
  const { slug: _slugRaw } = await params; const slug = _slugRaw.normalize('NFC');
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, name, description, design_tokens, vercel_url, github_repo, current_stage, progress_override, progress_note')
    .eq('slug', slug)
    .single<{
      id: string; slug: string; name: string; description: string | null;
      design_tokens: unknown; vercel_url: string | null; github_repo: string | null;
      current_stage: string;
      progress_override: number | null;
      progress_note: string | null;
    }>();
  if (!project) notFound();

  const stageIdx = STAGE_ORDER.indexOf(project.current_stage as typeof STAGE_ORDER[number]);
  const fallbackPercent = Math.round((Math.max(0, stageIdx) / 8) * 100);

  const tokens: BrandTokens = {
    ...DEFAULT_BRAND_TOKENS,
    ...((project.design_tokens && typeof project.design_tokens === 'object')
        ? (project.design_tokens as Partial<BrandTokens>) : {}),
    fonts: {
      ...DEFAULT_BRAND_TOKENS.fonts,
      ...((project.design_tokens && typeof project.design_tokens === 'object'
           && 'fonts' in (project.design_tokens as object))
          ? ((project.design_tokens as { fonts?: BrandTokens['fonts'] }).fonts ?? {})
          : {}),
    },
    colors: {
      ...DEFAULT_BRAND_TOKENS.colors,
      ...((project.design_tokens && typeof project.design_tokens === 'object'
           && 'colors' in (project.design_tokens as object))
          ? ((project.design_tokens as { colors?: BrandTokens['colors'] }).colors ?? {})
          : {}),
    },
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href={`/projects/${project.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-fg hover:text-brand"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        חזרה ל-{project.name}
      </Link>

      <header>
        <h1 className="text-3xl font-bold tracking-tight">הגדרות הפרויקט</h1>
        <p className="mt-1 text-sm text-muted-fg">
          טוקנים של ה-brand (צבעים, פונטים) וה-URL של ה-Vercel.
          ההגדרות האלה זמינות לקלוד כשהוא מנתח עיצובים, ומשמשות ליצירת לינקי תצוגה ללקוח.
        </p>
      </header>

      <ProgressOverrideEditor
        projectId={project.id}
        projectSlug={project.slug}
        initialPercent={project.progress_override}
        initialNote={project.progress_note}
        fallbackPercent={fallbackPercent}
      />

      <Card>
        <CardHeader>
          <CardTitle>Brand</CardTitle>
          <CardDescription>
            הצבעים והפונטים של ה-design system. עדכון כאן ישפיע על הפרומפטים שקלוד שולח כשהוא בונה סקשנים.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectBrandForm
            projectId={project.id}
            projectSlug={project.slug}
            initialBrand={tokens}
            initialVercelUrl={project.vercel_url}
            initialDescription={project.description}
          />
        </CardContent>
      </Card>
    </div>
  );
}

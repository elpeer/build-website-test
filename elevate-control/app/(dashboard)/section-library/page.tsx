import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Plus, Database } from 'lucide-react';

export const metadata = { title: 'מאגר סקשנים' };

interface DefinitionRow {
  id: string;
  slug: string;
  name_he: string | null;
  name_en: string | null;
  description: string | null;
  category: string | null;
  recipe_id: string | null;
  cpt_driven: boolean;
  cpt_slug: string | null;
  is_global: boolean;
  preview_url: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  hero: 'Hero', feature: 'Feature', listing: 'Listings (CPT)',
  content: 'Content', utility: 'Utility', social: 'Social', cta: 'CTA',
};

export default async function SectionLibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles').select('studio_admin').eq('id', user.id).single<{ studio_admin: boolean }>();

  const { data: defsData } = await supabase
    .from('section_definitions')
    .select('id, slug, name_he, name_en, description, category, recipe_id, cpt_driven, cpt_slug, is_global, preview_url')
    .order('category', { ascending: true })
    .order('slug', { ascending: true });

  const defs = (defsData ?? []) as DefinitionRow[];

  const grouped: Record<string, DefinitionRow[]> = {};
  for (const d of defs) {
    const key = d.category ?? 'other';
    (grouped[key] ??= []).push(d);
  }
  const orderedCats = ['hero', 'feature', 'listing', 'content', 'utility', 'social', 'cta', 'other']
    .filter(c => grouped[c]?.length);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <BookOpen className="h-7 w-7" />
            מאגר סקשנים
          </h1>
          <p className="mt-1 text-sm text-muted-fg">
            הקטלוג המלא של סקשנים זמינים. סקשן עם תיוג CPT-driven טוען תוכן דינמי מ-Custom Post Type.
          </p>
        </div>
        {profile?.studio_admin && (
          <Link
            href="/admin/section-definitions"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:border-brand"
          >
            <Plus className="h-4 w-4" />
            ניהול הקטלוג
          </Link>
        )}
      </header>

      {defs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-fg">
            אין סקשנים בקטלוג. {profile?.studio_admin && (
              <Link href="/admin/section-definitions" className="text-brand hover:underline">הוסיפו סקשן ראשון</Link>
            )}
          </CardContent>
        </Card>
      ) : (
        orderedCats.map(cat => (
          <Card key={cat}>
            <CardHeader>
              <CardTitle>{CATEGORY_LABELS[cat] ?? cat}</CardTitle>
              <CardDescription>{grouped[cat].length} סקשנים</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[cat].map(d => (
                  <article key={d.id} className="space-y-2 rounded-md border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium">{d.name_he ?? d.name_en ?? d.slug}</h3>
                      {d.cpt_driven && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                          <Database className="h-3 w-3" />
                          CPT
                        </span>
                      )}
                    </div>
                    <code className="block text-xs text-muted-fg" dir="ltr">{d.slug}</code>
                    {d.description && <p className="text-sm text-muted-fg">{d.description}</p>}
                    {d.cpt_slug && (
                      <p className="text-xs text-purple-700">
                        טוען מ-CPT: <code dir="ltr">{d.cpt_slug}</code>
                      </p>
                    )}
                    {d.recipe_id && (
                      <p className="text-xs text-muted-fg">
                        recipe: <code dir="ltr">{d.recipe_id}</code>
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

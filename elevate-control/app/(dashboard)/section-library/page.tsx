import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { SectionLibraryBrowser, type DefinitionRow } from '@/components/admin/section-library-browser';
import { BookOpen } from 'lucide-react';

export const metadata = { title: 'מאגר סקשנים' };

export default async function SectionLibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles').select('studio_admin').eq('id', user.id).single<{ studio_admin: boolean }>();
  const canEdit = !!profile?.studio_admin;

  const { data: defsData } = await supabase
    .from('section_definitions')
    .select('id, slug, name_he, name_en, description, category, kind, recipe_id, cpt_driven, cpt_slug, is_global, preview_url, content_schema')
    .order('kind', { ascending: true })
    .order('slug', { ascending: true });

  const defs = (defsData ?? []) as DefinitionRow[];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <BookOpen className="h-7 w-7" />
          מאגר סקשנים
        </h1>
        <p className="mt-1 text-sm text-muted-fg">
          הקטלוג המלא של סקשנים זמינים. הקטלוג הזה מנחה את ה-AI כשהוא מנתח עיצובים — Claude
          ישייך כל סקשן בעיצוב לאחד מה-slugs פה. שדות ההתאמה הספציפיים של כל סקשן בעמוד נשמרים
          על ה-instance עצמו.
        </p>
      </header>

      {defs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-fg">
            אין סקשנים בקטלוג עדיין.
          </CardContent>
        </Card>
      ) : (
        <SectionLibraryBrowser definitions={defs} canEdit={canEdit} />
      )}
    </div>
  );
}

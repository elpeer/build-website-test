import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionDefinitionsAdmin } from '@/components/admin/section-definitions-admin';
import { Settings } from 'lucide-react';

export const metadata = { title: 'קטלוג סקשנים — אדמין' };

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
}

export default async function SectionDefinitionsAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles').select('studio_admin').eq('id', user.id).single<{ studio_admin: boolean }>();
  if (!profile?.studio_admin) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-fg">העמוד הזה זמין רק ל-Studio Admins.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: defsData } = await supabase
    .from('section_definitions')
    .select('id, slug, name_he, name_en, description, category, recipe_id, cpt_driven, cpt_slug, is_global')
    .order('category', { ascending: true })
    .order('slug', { ascending: true });

  const defs = (defsData ?? []) as DefinitionRow[];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Settings className="h-7 w-7" />
          קטלוג סקשנים
        </h1>
        <p className="mt-1 text-sm text-muted-fg">
          ניהול הסקשנים הזמינים בכל הפרויקטים. הקטלוג הזה מנחה את ה-AI כשהוא מנתח עיצובים.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{defs.length} סקשנים מוגדרים</CardTitle>
          <CardDescription>שינויים כאן משתקפים בכל הפרויקטים.</CardDescription>
        </CardHeader>
        <CardContent>
          <SectionDefinitionsAdmin definitions={defs} />
        </CardContent>
      </Card>
    </div>
  );
}

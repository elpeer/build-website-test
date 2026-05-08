import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GuidesAdmin } from '@/components/admin/guides-admin';
import { GuideCategoriesAdmin, type CategoryRow } from '@/components/admin/guide-categories-admin';
import { BookOpen, Tag } from 'lucide-react';

export const metadata = { title: 'מאגר מדריכים — אדמין' };

interface GuideRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content_md: string;
  content_html: string;
  category: string | null;
  category_id: string | null;
  visibility: 'global' | 'project';
  video_url: string | null;
  cover_url: string | null;
  published: boolean;
  position: number;
  updated_at: string;
}

interface AssignmentRow { project_id: string; guide_id: string }

export default async function GuidesAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles').select('studio_admin').eq('id', user.id).single<{ studio_admin: boolean }>();
  if (!profile?.studio_admin) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-fg">
            העמוד הזה זמין רק ל-Studio Admins.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [
    { data: guidesData },
    { data: categoriesData },
    { data: projectsData },
    { data: assignmentsData },
  ] = await Promise.all([
    supabase.from('guide_articles')
      .select('id, slug, title, description, content_md, content_html, category, category_id, visibility, video_url, cover_url, published, position, updated_at')
      .order('category', { ascending: true })
      .order('position', { ascending: true }),
    supabase.from('guide_categories')
      .select('id, slug, label, position')
      .order('position', { ascending: true }),
    supabase.from('projects')
      .select('id, slug, name')
      .order('created_at', { ascending: false }),
    supabase.from('project_guide_assignments')
      .select('project_id, guide_id'),
  ]);

  const guides      = (guidesData      ?? []) as GuideRow[];
  const categories  = (categoriesData  ?? []) as { id: string; slug: string; label: string; position: number }[];
  const projects    = (projectsData    ?? []) as { id: string; slug: string; name: string }[];
  const assignments = (assignmentsData ?? []) as AssignmentRow[];

  const guidesByCategory = new Map<string, number>();
  for (const g of guides) {
    if (!g.category_id) continue;
    guidesByCategory.set(g.category_id, (guidesByCategory.get(g.category_id) ?? 0) + 1);
  }
  const categoriesWithCounts: CategoryRow[] = categories.map(c => ({
    ...c, guide_count: guidesByCategory.get(c.id) ?? 0,
  }));

  const assignmentsByGuide: Record<string, string[]> = {};
  for (const a of assignments) {
    (assignmentsByGuide[a.guide_id] ??= []).push(a.project_id);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <BookOpen className="h-7 w-7" />
          מאגר מדריכים
        </h1>
        <p className="mt-1 text-sm text-muted-fg">
          מדריכים מופיעים אוטומטית בקובייה &quot;הדרכה&quot; של כל פרויקט. אפשר לסמן מדריך כ-&quot;לפרויקטים נבחרים&quot;
          ולשייך אותו רק לחלק מהלקוחות.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            קטגוריות
          </CardTitle>
          <CardDescription>הוסיפו, ערכו או מחקו קטגוריות. כל מדריך משויך לקטגוריה אחת (אופציונלי).</CardDescription>
        </CardHeader>
        <CardContent>
          <GuideCategoriesAdmin categories={categoriesWithCounts} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{guides.length} מדריכים</CardTitle>
          <CardDescription>עורך עשיר עם תפריט סלאש (/) להוספת בלוקים, העלאת תמונות, וידאו ותמונת cover.</CardDescription>
        </CardHeader>
        <CardContent>
          <GuidesAdmin
            guides={guides}
            categories={categories.map(c => ({ id: c.id, slug: c.slug, label: c.label }))}
            projects={projects}
            assignmentsByGuide={assignmentsByGuide}
          />
        </CardContent>
      </Card>
    </div>
  );
}

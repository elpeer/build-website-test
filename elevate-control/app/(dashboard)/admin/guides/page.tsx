import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GuidesAdmin } from '@/components/admin/guides-admin';
import { BookOpen } from 'lucide-react';

export const metadata = { title: 'מאגר מדריכים — אדמין' };

interface GuideRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content_md: string;
  content_html: string;
  category: string | null;
  video_url: string | null;
  cover_url: string | null;
  published: boolean;
  position: number;
  updated_at: string;
}

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

  const { data: guidesData } = await supabase
    .from('guide_articles')
    .select('id, slug, title, description, content_md, content_html, category, video_url, cover_url, published, position, updated_at')
    .order('category', { ascending: true })
    .order('position', { ascending: true });

  const guides = (guidesData ?? []) as GuideRow[];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <BookOpen className="h-7 w-7" />
          מאגר מדריכים
        </h1>
        <p className="mt-1 text-sm text-muted-fg">
          מדריכים אלו נראים אוטומטית בכל הפרויקטים תחת הקובייה &quot;הדרכה&quot;. אפשר להסתיר ספציפיים בכל פרויקט.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{guides.length} מדריכים</CardTitle>
          <CardDescription>נתמך Markdown + לינק ל-YouTube/Vimeo + תמונת cover.</CardDescription>
        </CardHeader>
        <CardContent>
          <GuidesAdmin guides={guides} />
        </CardContent>
      </Card>
    </div>
  );
}

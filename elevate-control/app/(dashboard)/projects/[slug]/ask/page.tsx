import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AskClient } from '@/components/projects/ask-client';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug: _slugRaw } = await params; const slug = _slugRaw.normalize('NFC');
  return { title: `שאל את Claude · ${slug}` };
}

const SUGGESTIONS = [
  'מה נשאר לסיים בפרויקט?',
  'אילו עמודים נמצאים בפיתוח?',
  'מה הסטטוס של אישורי הלקוח?',
  'איזה תגובות פתוחות יש?',
  'סכם לי את הפרויקט בכמה שורות',
];

export default async function AskProjectPage({ params }: Props) {
  const { slug: _slugRaw } = await params; const slug = _slugRaw.normalize('NFC');
  const supabase = await createClient();
  const { data: project } = await supabase
    .from('projects').select('id, slug, name').eq('slug', slug)
    .single<{ id: string; slug: string; name: string }>();
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href={`/projects/${project.slug}`}
            className="inline-flex items-center gap-1 text-sm text-muted-fg hover:text-brand">
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        חזרה ל-{project.name}
      </Link>

      <header>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Sparkles className="h-7 w-7 text-brand" />
          שאל את Claude
        </h1>
        <p className="mt-1 text-sm text-muted-fg">
          קבל תשובות בשפה טבעית על מצב הפרויקט. Claude יראה את כל ה-state — עמודים, תגובות, אישורים, commits, פעילות.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>שאלה</CardTitle>
          <CardDescription>תוכל גם לבחור מהשאלות המוצעות למטה</CardDescription>
        </CardHeader>
        <CardContent>
          <AskClient projectSlug={project.slug} suggestions={SUGGESTIONS} />
        </CardContent>
      </Card>
    </div>
  );
}

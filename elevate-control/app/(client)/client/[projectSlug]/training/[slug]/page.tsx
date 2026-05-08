import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, PlayCircle } from 'lucide-react';
import { marked } from 'marked';
import { createClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ projectSlug: string; slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: `מדריך · ${slug}` };
}

interface GuideRecord {
  id: string;
  title: string;
  description: string | null;
  content_md: string;
  content_html: string;
  category: string | null;
  video_url: string | null;
  cover_url: string | null;
  published: boolean;
  updated_at: string;
}

function youtubeEmbed(url: string): string | null {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  const loom = url.match(/loom\.com\/share\/([\w-]+)/);
  if (loom) return `https://www.loom.com/embed/${loom[1]}`;
  return null;
}

export default async function ClientGuidePage({ params }: Props) {
  const { projectSlug, slug } = await params;
  const supabase = await createClient();

  const { data: guide } = await supabase
    .from('guide_articles')
    .select('id, title, description, content_md, content_html, category, video_url, cover_url, published, updated_at')
    .eq('slug', slug)
    .eq('published', true)
    .single<GuideRecord>();
  if (!guide) notFound();

  // Prefer the rich HTML; fall back to legacy Markdown if HTML is empty.
  const html = guide.content_html?.trim()
    ? guide.content_html
    : (guide.content_md ? await marked.parse(guide.content_md, { async: true }) : '');
  const embed = guide.video_url ? youtubeEmbed(guide.video_url) : null;

  return (
    <div className="space-y-6">
      <Link href={`/client/${projectSlug}/training`}
            className="inline-flex items-center gap-1 text-sm text-muted-fg hover:text-brand">
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        חזרה למדריכים
      </Link>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{guide.title}</h1>
        {guide.description && (
          <p className="text-muted-fg">{guide.description}</p>
        )}
      </header>

      {guide.cover_url && !embed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={guide.cover_url} alt={guide.title}
             className="w-full rounded-lg border border-border" />
      )}

      {embed && (
        <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
          <iframe src={embed} className="h-full w-full" allow="autoplay; encrypted-media" allowFullScreen />
        </div>
      )}

      {!embed && guide.video_url && (
        <a href={guide.video_url} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-sm hover:border-brand">
          <PlayCircle className="h-4 w-4" />
          צפו בוידאו
        </a>
      )}

      <article
        className="prose prose-sm max-w-none prose-headings:font-bold prose-a:text-brand prose-img:rounded-md"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <footer className="text-xs text-muted-fg">
        עודכן: {new Date(guide.updated_at).toLocaleDateString('he-IL')}
      </footer>
    </div>
  );
}

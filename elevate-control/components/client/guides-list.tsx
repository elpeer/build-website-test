import Link from 'next/link';
import { ExternalLink, PlayCircle, BookOpen } from 'lucide-react';

export interface GuideListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  cover_url: string | null;
  video_url: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'כללי', wordpress: 'WordPress', clickup: 'ClickUp',
  figma: 'Figma', launch: 'עליה לאוויר',
};

interface Props {
  guides: GuideListItem[];
  projectSlug: string;
}

export function GuidesList({ guides, projectSlug }: Props) {
  if (guides.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-fg">
        עדיין לא הוגדרו מדריכים.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {guides.map(g => (
        <Link key={g.id}
              href={`/client/${projectSlug}/training/${g.slug}`}
              className="group flex gap-3 overflow-hidden rounded-lg border border-border bg-background p-3 transition-shadow hover:shadow-md">
          <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md bg-muted">
            {g.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={g.cover_url} alt={g.title}
                   className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-fg">
                <BookOpen className="h-6 w-6" />
              </div>
            )}
            {g.video_url && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                <PlayCircle className="h-6 w-6" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="truncate font-medium group-hover:text-brand">{g.title}</h4>
              {g.category && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-fg">
                  {CATEGORY_LABELS[g.category] ?? g.category}
                </span>
              )}
            </div>
            {g.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-fg">{g.description}</p>
            )}
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-brand">
              קרא/י <ExternalLink className="h-3 w-3" />
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

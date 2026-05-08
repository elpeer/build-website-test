import Image from 'next/image';
import Link from 'next/link';
import { formatRelativeHe } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar } from 'lucide-react';

type ProjectSummary = {
  id: string;
  slug: string;
  name: string;
  client_name: string | null;
  status: string;
  logo_url: string | null;
  target_at: string | null;
  updated_at: string;
  pages_total?: number;
  pages_live?: number;
};

const STATUS_PILLS: Record<string, string> = {
  draft:     'bg-zinc-100 text-zinc-700',
  active:    'bg-blue-50 text-blue-700',
  on_hold:   'bg-amber-50 text-amber-800',
  review:    'bg-purple-50 text-purple-700',
  completed: 'bg-green-50 text-green-700',
  archived:  'bg-zinc-100 text-zinc-500',
};

const STATUS_LABELS: Record<string, string> = {
  draft:     'הכנה',
  active:    'פעיל',
  on_hold:   'המתנה',
  review:    'סקירה',
  completed: 'הושלם',
  archived:  'בארכיון',
};

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link href={`/projects/${project.slug}`} className="group block">
      <Card className="transition-all group-hover:border-brand group-hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              {project.logo_url ? (
                <Image
                  src={project.logo_url}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 shrink-0 rounded-md border border-border object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand text-sm font-bold text-white">
                  {project.name.slice(0, 2)}
                </div>
              )}
              <div className="min-w-0">
                <CardTitle className="truncate text-base">{project.name}</CardTitle>
                {project.client_name && (
                  <p className="mt-0.5 truncate text-xs text-muted-fg">{project.client_name}</p>
                )}
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_PILLS[project.status] ?? 'bg-zinc-100 text-zinc-700'
              }`}
            >
              {STATUS_LABELS[project.status] ?? project.status}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {typeof project.pages_total === 'number' && project.pages_total > 0 && (
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-fg">התקדמות עמודים</span>
                <span className="font-medium">
                  {project.pages_live ?? 0} / {project.pages_total}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-brand transition-all"
                  style={{ width: `${Math.round(((project.pages_live ?? 0) / project.pages_total) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-fg">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatRelativeHe(project.updated_at)}
            </span>
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

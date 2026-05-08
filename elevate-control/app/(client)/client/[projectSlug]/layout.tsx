import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { ClientSideMenu, ClientMobileBar } from '@/components/client/client-side-menu';
import { WORKSPACE_BY_SLUG, type WorkspaceSlug, type ProjectStage } from '@/lib/client-workspaces';

interface Props {
  children: React.ReactNode;
  params: Promise<{ projectSlug: string }>;
}

export default async function ClientProjectLayout({ children, params }: Props) {
  const { projectSlug } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, name, current_stage')
    .eq('slug', projectSlug)
    .single<{ id: string; slug: string; name: string; current_stage: ProjectStage }>();
  if (!project) notFound();

  // Detect which workspace is open from the URL so the side menu can highlight it.
  const h = await headers();
  const path = h.get('x-pathname') ?? h.get('x-invoke-path') ?? '';
  let currentSlug: WorkspaceSlug | null = null;
  const m = path.match(new RegExp(`/client/${project.slug}/([^/?]+)`));
  if (m && WORKSPACE_BY_SLUG[m[1] as WorkspaceSlug]) {
    currentSlug = m[1] as WorkspaceSlug;
  }

  return (
    <>
      {/* Mobile chip bar — pins to top across all client project pages. */}
      <ClientMobileBar
        projectId={project.id}
        projectSlug={project.slug}
        currentSlug={currentSlug}
        currentStage={project.current_stage}
      />

      <div className="flex gap-6">
        {/* In RTL, the first flex child sits on the right edge. We want the
            sidebar there, so it goes first in DOM order on desktop. The
            sidebar itself is `hidden lg:block` so on mobile the content
            occupies the full width. */}
        <ClientSideMenu
          projectId={project.id}
          projectSlug={project.slug}
          projectName={project.name}
          currentSlug={currentSlug}
          currentStage={project.current_stage}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  );
}

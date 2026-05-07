'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ProjectStage, WorkspaceSlug } from '@/lib/client-workspaces';

type Result = { ok: true } | { ok: false; error: string };

export async function setProjectStage(
  projectId: string,
  projectSlug: string,
  stage: ProjectStage
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { error } = await supabase
    .from('projects')
    .update({ current_stage: stage })
    .eq('id', projectId);
  if (error) return { ok: false, error: error.message };

  await supabase.from('activity_log').insert({
    project_id:  projectId,
    actor_id:    user.id,
    kind:        'updated',
    entity_type: 'project',
    entity_id:   projectId,
    summary:     `שלב הפרויקט עודכן ל-${stage}`,
  });

  revalidatePath(`/projects/${projectSlug}`);
  revalidatePath(`/client/${projectSlug}`);
  return { ok: true };
}

export async function setWorkspaceOverride(
  projectId: string,
  projectSlug: string,
  workspace: WorkspaceSlug,
  unlocked: boolean,
  message: string | null = null
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { error } = await supabase
    .from('client_workspace_overrides')
    .upsert({
      project_id: projectId, workspace, unlocked, message,
      set_by: user.id, set_at: new Date().toISOString(),
    }, { onConflict: 'project_id,workspace' });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${projectSlug}`);
  revalidatePath(`/client/${projectSlug}`);
  return { ok: true };
}

export async function clearWorkspaceOverride(
  projectId: string,
  projectSlug: string,
  workspace: WorkspaceSlug
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { error } = await supabase
    .from('client_workspace_overrides')
    .delete()
    .eq('project_id', projectId)
    .eq('workspace', workspace);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${projectSlug}`);
  revalidatePath(`/client/${projectSlug}`);
  return { ok: true };
}

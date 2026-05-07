'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';

type CreateProjectResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

/**
 * Create a new project. Adds the current user as the project owner and
 * writes an activity log entry. Returns either the new slug (for redirect)
 * or an error to display to the user.
 */
export async function createProject(formData: FormData): Promise<CreateProjectResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const name        = (formData.get('name')        as string | null)?.trim() ?? '';
  const slugInput   = (formData.get('slug')        as string | null)?.trim() ?? '';
  const clientName  = (formData.get('client_name') as string | null)?.trim() || null;
  const description = (formData.get('description') as string | null)?.trim() || null;
  const targetAt    = (formData.get('target_at')   as string | null) || null;

  // Toggles arrive as 'on' (checked) or absent. has_wordpress/has_mobile default true.
  const hasWordpress    = formData.get('has_wordpress')     === 'on';
  const hasMobileDesign = formData.get('has_mobile_design') === 'on';

  if (!name) return { ok: false, error: 'שם הפרויקט הוא שדה חובה' };

  const slug = slugify(slugInput || name);
  if (!slug) return { ok: false, error: 'לא הצלחנו ליצור slug תקין מהשם' };

  // NB: cast to `never` on insert until `pnpm db:types` is run against the
  // live schema. Our placeholder Database types collapse Insert<T> to never
  // in the supabase-js generic, blocking type-check. Runtime is unaffected.
  const projectInsert = {
    name,
    slug,
    client_name: clientName,
    description,
    target_at: targetAt,
    has_wordpress: hasWordpress,
    has_mobile_design: hasMobileDesign,
    created_by: user.id,
    pm_id: user.id,
    status: 'draft',
  };

  const { data: project, error: insertError } = await supabase
    .from('projects')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(projectInsert as any)
    .select('id, slug')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return { ok: false, error: `Slug "${slug}" כבר קיים. בחר שם או slug אחר.` };
    }
    console.error('createProject insert error:', insertError);
    return { ok: false, error: insertError.message };
  }

  // Add the creator as the project owner
  const memberInsert = {
    project_id: project.id,
    user_id: user.id,
    role: 'owner',
    added_by: user.id,
  };
  const { error: memberError } = await supabase
    .from('project_members')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(memberInsert as any);

  if (memberError) {
    console.error('createProject member error:', memberError);
    // Project exists but membership didn't — admin can fix later
  }

  // Log the activity
  const activityInsert = {
    project_id: project.id,
    actor_id: user.id,
    kind: 'created',
    entity_type: 'project',
    entity_id: project.id,
    summary: `נוצר פרויקט: ${name}`,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await supabase.from('activity_log').insert(activityInsert as any);

  revalidatePath('/projects');
  return { ok: true, slug: project.slug as string };
}

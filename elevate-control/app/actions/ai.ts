'use server';

import { revalidatePath } from 'next/cache';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';
import type { Json, PageType, SectionStatus } from '@/lib/supabase/database.types';

type Result<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

interface AnalysisSection {
  definition_slug: string;
  name_he: string;
  description_he: string;
  order_hint: number;
  content_hints?: Record<string, unknown>;
}

interface DesignAnalysis {
  page_name_he: string;
  page_name_en: string | null;
  page_slug: string;
  page_type: PageType;
  summary_he: string;
  sections: AnalysisSection[];
  design_notes_he: string | null;
}

const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['page_name_he', 'page_name_en', 'page_slug', 'page_type', 'summary_he', 'sections', 'design_notes_he'],
  properties: {
    page_name_he: { type: 'string', description: 'שם העמוד בעברית' },
    page_name_en: { type: ['string', 'null'], description: 'Page name in English' },
    page_slug:    { type: 'string', description: 'kebab-case URL slug, English only' },
    page_type:    { type: 'string', enum: ['page', 'archive', 'single', 'system', 'service'] },
    summary_he:   { type: 'string', description: 'תקציר של מטרת העמוד ושל מה הוא מציג' },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['definition_slug', 'name_he', 'description_he', 'order_hint'],
        properties: {
          definition_slug: { type: 'string', description: 'slug from the catalog of section_definitions' },
          name_he:         { type: 'string' },
          description_he:  { type: 'string', description: 'מה יהיה בסקשן הזה - 2-4 משפטים' },
          order_hint:      { type: 'integer', description: 'סדר הופעה בעמוד, החל מ-1' },
          content_hints: {
            type: 'object',
            description: 'רמזי תוכן: כותרות, CTA, טקסט מוצע',
            additionalProperties: true,
          },
        },
      },
    },
    design_notes_he: { type: ['string', 'null'], description: 'הערות עיצוב כלליות (טיפוגרפיה, צבעים, אווירה)' },
  },
} as const;

/**
 * Run Claude Vision on a design file, get back a structured plan
 * (page + sections). Persists to designs.ai_analysis.
 */
export async function analyzeDesign(
  designId: string,
  ctx: { projectSlug: string }
): Promise<Result<{ analysis: DesignAnalysis }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: 'ANTHROPIC_API_KEY לא מוגדר ב-Vercel' };
  }

  const { data: design } = await supabase
    .from('designs')
    .select('id, project_id, storage_path, mime_type, viewport, notes')
    .eq('id', designId)
    .single<{ id: string; project_id: string; storage_path: string; mime_type: string | null; viewport: string; notes: string | null }>();

  if (!design) return { ok: false, error: 'העיצוב לא נמצא' };

  if (!design.mime_type?.startsWith('image/')) {
    return { ok: false, error: 'ניתוח אוטומטי תומך כרגע רק בתמונות (לא PDF)' };
  }

  // Fresh signed URL — Claude needs to fetch the image
  const { data: signed } = await supabase.storage
    .from('designs')
    .createSignedUrl(design.storage_path, 60 * 10); // 10 min is enough for the API call
  if (!signed?.signedUrl) return { ok: false, error: 'לא הצלחנו לחתום URL לעיצוב' };

  // Section definitions catalog (so Claude picks valid slugs)
  const { data: defsData } = await supabase
    .from('section_definitions')
    .select('slug, name_he, name_en, category, description, cpt_driven')
    .order('category', { ascending: true });

  const definitions = (defsData ?? []) as { slug: string; name_he: string | null; name_en: string | null; category: string | null; description: string | null; cpt_driven: boolean }[];

  if (definitions.length === 0) {
    return { ok: false, error: 'אין section_definitions בקטלוג. הריצו seed קודם.' };
  }

  const catalogText = definitions.map(d => {
    const name = d.name_he ?? d.name_en ?? d.slug;
    const cat  = d.category ? `[${d.category}]` : '[other]';
    const desc = d.description ? ` — ${d.description}` : '';
    const cpt  = d.cpt_driven ? ' (CPT-driven)' : '';
    return `- \`${d.slug}\` ${cat} ${name}${cpt}${desc}`;
  }).join('\n');

  const systemPrompt = `אתה מנתח עיצובי אתרים עבור Elevate Digital Studio (סטודיו ישראלי לפיתוח אתרים).

המשימה שלך: לקבל צילום של עיצוב עמוד אחד (Figma/Photoshop/screenshot) ולפרק אותו לעמוד + רשימת סקשנים, בהתאם לקטלוג הסקשנים של הסטודיו.

חוקי זהב:
1. כל סקשן חייב לקבל \`definition_slug\` שקיים בקטלוג למטה. אם אתה לא מוצא התאמה מדויקת — בחר את הקרובה ביותר ואל תמציא slug חדש.
2. ה-slug של העמוד באנגלית, kebab-case (home, about, contact, services, our-team).
3. ה-page_type:
   - "page" = עמוד רגיל
   - "archive" = עמוד שמציג רשימה של פוסטים מ-CPT (למשל רשימת אטרקציות)
   - "single" = תבנית של פוסט פנימי בודד
   - "system" = עמודי מערכת (404, search results)
   - "service" = עמוד שירות (תקנון, נגישות)
4. תאר כל סקשן ב-2-4 משפטים בעברית: מה רואים, איזה תוכן בפנים, איזה CTA או פעולה.
5. אם יש viewport מסוים (mobile/tablet) — קח אותו בחשבון בהערות.

קטלוג ה-section_definitions הזמינים:

${catalogText}
`;

  const client = new Anthropic();

  let parsed: unknown;
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      output_config: {
        format: { type: 'json_schema', schema: ANALYSIS_SCHEMA },
      },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'url', url: signed.signedUrl },
            },
            {
              type: 'text',
              text: `נתח את העיצוב הזה (viewport: ${design.viewport}${design.notes ? `, הערות הצוות: ${design.notes}` : ''}).

החזר JSON תקני לפי הסכמה — שם עמוד, slug, סוג, רשימת סקשנים מהקטלוג עם תיאור, וסדר הופעה.`,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return { ok: false, error: 'Claude לא החזיר תוכן טקסטואלי' };
    }
    parsed = JSON.parse(textBlock.text);
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error('[analyzeDesign] Anthropic error:', err.status, err.message);
      return { ok: false, error: `שגיאת Claude API (${err.status}): ${err.message}` };
    }
    console.error('[analyzeDesign] error:', err);
    return { ok: false, error: `שגיאה בניתוח: ${(err as Error).message}` };
  }

  const analysis = parsed as DesignAnalysis;

  // Sanitize: keep only sections whose definition_slug exists in catalog
  const validSlugs = new Set(definitions.map(d => d.slug));
  analysis.sections = (analysis.sections ?? [])
    .filter(s => validSlugs.has(s.definition_slug))
    .sort((a, b) => a.order_hint - b.order_hint);

  if (!analysis.page_slug || !slugify(analysis.page_slug)) {
    analysis.page_slug = slugify(analysis.page_name_en || analysis.page_name_he);
  }

  // Persist to designs.ai_analysis
  await supabase
    .from('designs')
    .update({
      ai_analysis: analysis as unknown as Json,
      ai_analyzed_at: new Date().toISOString(),
    })
    .eq('id', designId);

  await supabase.from('activity_log').insert({
    project_id:  design.project_id,
    actor_id:    user.id,
    actor_label: 'Claude (claude-opus-4-7)',
    kind:        'updated',
    entity_type: 'design',
    entity_id:   design.id,
    summary:     `Claude ניתח עיצוב: ${analysis.page_name_he} (${analysis.sections.length} סקשנים)`,
  });

  revalidatePath(`/projects/${ctx.projectSlug}/designs`);
  return { ok: true, data: { analysis } };
}

/**
 * Take a design's stored ai_analysis and turn it into a real page + sections.
 * If a page with the same slug already exists, it's reused (sections are
 * appended in order).
 */
export async function materializeAnalysis(
  designId: string,
  ctx: { projectSlug: string }
): Promise<Result<{ pageSlug: string; sectionsAdded: number }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { data: design } = await supabase
    .from('designs')
    .select('id, project_id, page_id, ai_analysis')
    .eq('id', designId)
    .single<{ id: string; project_id: string; page_id: string | null; ai_analysis: Json }>();

  if (!design) return { ok: false, error: 'העיצוב לא נמצא' };
  if (!design.ai_analysis) return { ok: false, error: 'אין ניתוח שמור — הריצו ניתוח קודם' };

  const analysis = design.ai_analysis as unknown as DesignAnalysis;
  const slug = slugify(analysis.page_slug);
  if (!slug) return { ok: false, error: 'slug לא תקין בניתוח' };

  // Find or create the page
  const { data: existing } = await supabase
    .from('pages')
    .select('id, slug')
    .eq('project_id', design.project_id)
    .eq('slug', slug)
    .maybeSingle<{ id: string; slug: string }>();

  let pageId: string;
  if (existing) {
    pageId = existing.id;
  } else {
    const { data: lastPage } = await supabase
      .from('pages')
      .select('order')
      .eq('project_id', design.project_id)
      .order('order', { ascending: false })
      .limit(1)
      .single<{ order: number }>();
    const nextOrder = (lastPage?.order ?? 0) + 10;

    const { data: page, error: pageError } = await supabase
      .from('pages')
      .insert({
        project_id: design.project_id,
        slug,
        name_he:    analysis.page_name_he,
        name_en:    analysis.page_name_en,
        type:       analysis.page_type,
        status:     'sectioned',
        order:      nextOrder,
        notes:      analysis.summary_he,
        created_by: user.id,
      })
      .select('id, slug')
      .single<{ id: string; slug: string }>();

    if (pageError || !page) {
      return { ok: false, error: pageError?.message ?? 'יצירת העמוד נכשלה' };
    }
    pageId = page.id;
  }

  // Resolve section definition IDs in one query
  const slugs = analysis.sections.map(s => s.definition_slug);
  const { data: defs } = slugs.length
    ? await supabase
        .from('section_definitions')
        .select('id, slug')
        .in('slug', slugs)
    : { data: [] as { id: string; slug: string }[] };
  const defBySlug = new Map((defs ?? []).map(d => [d.slug, d.id]));

  // Existing sections — for offset-only ordering (don't dedupe; designer may want duplicates)
  const { data: existingSections } = await supabase
    .from('sections')
    .select('order')
    .eq('page_id', pageId)
    .order('order', { ascending: false })
    .limit(1);

  let nextOrder = ((existingSections?.[0]?.order ?? 0) + 10);

  let sectionsAdded = 0;
  for (const s of analysis.sections) {
    const definitionId = defBySlug.get(s.definition_slug);
    if (!definitionId) continue; // skip unknown slugs

    const { error } = await supabase.from('sections').insert({
      page_id:         pageId,
      definition_id:   definitionId,
      definition_slug: s.definition_slug,
      order:           nextOrder,
      status:          'planned' as SectionStatus,
      notes:           s.description_he,
      content:         (s.content_hints ?? {}) as unknown as Json,
    });

    if (!error) {
      sectionsAdded++;
      nextOrder += 10;
    }
  }

  // Link the design to the page
  await supabase.from('designs').update({ page_id: pageId }).eq('id', design.id);

  await supabase.from('activity_log').insert({
    project_id:  design.project_id,
    actor_id:    user.id,
    actor_label: 'Claude (claude-opus-4-7)',
    kind:        'created',
    entity_type: 'page',
    entity_id:   pageId,
    summary:     `נוצר עמוד "${analysis.page_name_he}" עם ${sectionsAdded} סקשנים מתוך ניתוח של Claude`,
  });

  revalidatePath(`/projects/${ctx.projectSlug}`);
  revalidatePath(`/projects/${ctx.projectSlug}/${slug}`);
  revalidatePath(`/projects/${ctx.projectSlug}/designs`);

  return { ok: true, data: { pageSlug: slug, sectionsAdded } };
}

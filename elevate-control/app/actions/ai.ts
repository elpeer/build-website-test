'use server';

import { revalidatePath } from 'next/cache';
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';
import type { Json, PageType, SectionStatus } from '@/lib/supabase/database.types';

// Anthropic caps images at 8000px on either dimension. Opus 4.7's high-res
// vision actually maxes out at 2576px on the long edge — anything larger is
// downsampled server-side anyway, so resizing client-side saves bandwidth
// and avoids the 8000px hard limit on tall full-page screenshots.
const MAX_LONG_EDGE = 2576;

type Result<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

export type FieldType =
  | 'text' | 'textarea' | 'wysiwyg' | 'number' | 'email' | 'url' | 'tel'
  | 'select' | 'true_false' | 'image' | 'gallery' | 'file' | 'link'
  | 'color' | 'date' | 'icon' | 'repeater' | 'group';

export interface FieldDef {
  key: string;             // ACF-style key, e.g. "headline", "bullets"
  label_he: string;
  type: FieldType;
  required: boolean;
  notes?: string | null;   // freeform — instructions for the dev
  // For repeater/group only:
  sub_fields?: FieldDef[];
}

export interface AnalysisSection {
  definition_slug: string;     // slug from section_definitions
  name_he: string;
  description_he: string;      // 2–4 sentences: what's in the section
  order_hint: number;
  cpt_driven: boolean;
  suggested_cpt: { slug: string; name_he: string } | null;
  field_schema: FieldDef[];    // proposed ACF fields (excluding CPT-driven content fields)
}

export interface SuggestedPage {
  slug: string;
  name_he: string;
  type: PageType;
  parent_slug: string | null;  // null = top-level under the project root
  reason_he: string;           // why we're proposing this page
}

export interface DetectedDesignSystem {
  colors: {
    primary:    string; // hex
    secondary:  string;
    accent:     string;
    neutral:    string;
  };
  fonts: {
    headings: string; // CSS font-family
    body:     string;
  };
  notes_he: string;
}

export interface DesignAnalysis {
  page_name_he: string;
  page_name_en: string | null;
  page_slug: string;
  page_type: PageType;
  summary_he: string;
  sections: AnalysisSection[];
  additional_pages: SuggestedPage[]; // pages detected from links/menus/footers
  design_notes_he: string | null;
  design_system: DetectedDesignSystem | null;  // populated only when this is a homepage analysis
}

const FIELD_TYPE_ENUM = [
  'text','textarea','wysiwyg','number','email','url','tel',
  'select','true_false','image','gallery','file','link',
  'color','date','icon','repeater','group',
] as const;

const FIELD_DEF_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['key', 'label_he', 'type', 'required'],
  properties: {
    key:      { type: 'string', description: 'snake_case key, English' },
    label_he: { type: 'string', description: 'תווית בעברית' },
    type:     { type: 'string', enum: FIELD_TYPE_ENUM as unknown as string[] },
    required: { type: 'boolean' },
    notes:    { type: ['string', 'null'] },
    sub_fields: {
      type: 'array',
      description: 'רק עבור repeater/group',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'label_he', 'type', 'required'],
        properties: {
          key:      { type: 'string' },
          label_he: { type: 'string' },
          type:     { type: 'string', enum: FIELD_TYPE_ENUM as unknown as string[] },
          required: { type: 'boolean' },
          notes:    { type: ['string', 'null'] },
        },
      },
    },
  },
} as const;

const DESIGN_SYSTEM_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['colors', 'fonts', 'notes_he'],
  properties: {
    colors: {
      type: 'object', additionalProperties: false,
      required: ['primary', 'secondary', 'accent', 'neutral'],
      properties: {
        primary:    { type: 'string', description: 'הצבע הראשי של המותג (hex)' },
        secondary:  { type: 'string', description: 'צבע משני' },
        accent:     { type: 'string', description: 'צבע הדגשה / CTA' },
        neutral:    { type: 'string', description: 'אפור/ניטרלי לרקעים ועצמים משניים' },
      },
    },
    fonts: {
      type: 'object', additionalProperties: false,
      required: ['headings', 'body'],
      properties: {
        headings: { type: 'string', description: 'CSS font-family לכותרות' },
        body:     { type: 'string', description: 'CSS font-family לטקסט גוף' },
      },
    },
    notes_he: { type: 'string', description: 'הערות על ה-design system' },
  },
} as const;

const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'page_name_he', 'page_name_en', 'page_slug', 'page_type',
    'summary_he', 'sections', 'additional_pages', 'design_notes_he', 'design_system',
  ],
  properties: {
    page_name_he: { type: 'string' },
    page_name_en: { type: ['string', 'null'] },
    page_slug:    { type: 'string' },
    page_type:    { type: 'string', enum: ['page', 'archive', 'single', 'system', 'service'] },
    summary_he:   { type: 'string' },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'definition_slug', 'name_he', 'description_he', 'order_hint',
          'cpt_driven', 'suggested_cpt', 'field_schema',
        ],
        properties: {
          definition_slug: { type: 'string' },
          name_he:         { type: 'string' },
          description_he:  { type: 'string', description: '2–4 משפטים: מה בסקשן, כותרות מוצעות, CTA' },
          order_hint:      { type: 'integer' },
          cpt_driven: {
            type: 'boolean',
            description: 'true אם התוכן נטען מ-CPT (למשל רשימת אטרקציות)',
          },
          suggested_cpt: {
            anyOf: [
              {
                type: 'object',
                additionalProperties: false,
                required: ['slug', 'name_he'],
                properties: {
                  slug:    { type: 'string', description: 'singular, kebab-case English (attraction, team-member)' },
                  name_he: { type: 'string', description: 'שם CPT בעברית (אטרקציה, חבר/ת צוות)' },
                },
              },
              { type: 'null' },
            ],
            description: 'אם cpt_driven=true — הצע CPT. אחרת null.',
          },
          field_schema: {
            type: 'array',
            description: 'שדות ACF מוצעים לסקשן. עבור CPT-driven, כלול שדות עזר (כותרת על־עמודית, CTA) אבל לא את שדות ה-CPT עצמם.',
            items: FIELD_DEF_SCHEMA,
          },
        },
      },
    },
    additional_pages: {
      type: 'array',
      description: 'עמודים נוספים שזוהו דרך לינקים, תפריטים, פוטר, או הקשר עסקי. כולל עמודי מערכת (404, search) ועמודי שירות (תקנון, נגישות).',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['slug', 'name_he', 'type', 'parent_slug', 'reason_he'],
        properties: {
          slug:        { type: 'string' },
          name_he:     { type: 'string' },
          type:        { type: 'string', enum: ['page', 'archive', 'single', 'system', 'service'] },
          parent_slug: { type: ['string', 'null'], description: 'slug של עמוד-אב אם רלוונטי' },
          reason_he:   { type: 'string', description: 'איפה זוהה (פוטר/תפריט/וכו) ולמה צריך' },
        },
      },
    },
    design_notes_he: { type: ['string', 'null'] },
    design_system: {
      anyOf: [DESIGN_SYSTEM_SCHEMA, { type: 'null' }],
      description: 'אם זה עמוד הבית או עמוד שמייצג את שפת המותג — חלץ את הצבעים והפונטים. אחרת null.',
    },
  },
} as const;

interface ProjectCtx {
  projectId: string;
  projectSlug: string;
}

/**
 * Run Claude Vision on a design file. Persists to designs.ai_analysis.
 */
export async function analyzeDesign(
  designId: string,
  ctx: { projectSlug: string; pageSlug?: string }
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

  const { data: blob, error: downloadError } = await supabase.storage
    .from('designs')
    .download(design.storage_path);

  if (downloadError || !blob) {
    return { ok: false, error: `הורדת העיצוב נכשלה: ${downloadError?.message ?? 'לא נמצא'}` };
  }

  let resizedBuffer: Buffer;
  try {
    const inputBuffer = Buffer.from(await blob.arrayBuffer());
    resizedBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: MAX_LONG_EDGE, height: MAX_LONG_EDGE,
        fit: 'inside', withoutEnlargement: true,
      })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
  } catch (err) {
    return { ok: false, error: `כשל בעיבוד התמונה: ${(err as Error).message}` };
  }

  const imageBase64 = resizedBuffer.toString('base64');

  const { data: defsData } = await supabase
    .from('section_definitions')
    .select('slug, name_he, name_en, category, description, cpt_driven')
    .order('category', { ascending: true });
  const definitions = (defsData ?? []) as { slug: string; name_he: string | null; name_en: string | null; category: string | null; description: string | null; cpt_driven: boolean }[];
  if (definitions.length === 0) {
    return { ok: false, error: 'אין section_definitions בקטלוג. הריצו seed קודם.' };
  }

  // Existing CPTs in this project — so Claude prefers reusing them
  const { data: existingCptsData } = await supabase
    .from('cpts')
    .select('slug, name_he, name_en')
    .eq('project_id', design.project_id);
  const existingCpts = (existingCptsData ?? []) as { slug: string; name_he: string | null; name_en: string | null }[];

  const catalogText = definitions.map(d => {
    const name = d.name_he ?? d.name_en ?? d.slug;
    const cat  = d.category ? `[${d.category}]` : '[other]';
    const desc = d.description ? ` — ${d.description}` : '';
    const cpt  = d.cpt_driven ? ' (CPT-driven)' : '';
    return `- \`${d.slug}\` ${cat} ${name}${cpt}${desc}`;
  }).join('\n');

  const cptsText = existingCpts.length === 0
    ? '(אין CPTs בפרויקט עדיין — הצע חדשים אם צריך)'
    : existingCpts.map(c => `- \`${c.slug}\` — ${c.name_he ?? c.name_en ?? c.slug}`).join('\n');

  const systemPrompt = `אתה מנתח עיצובי אתרים עבור Elevate Digital Studio.

המשימה שלך: לקבל צילום של עיצוב עמוד אחד ולפרק אותו ל:
1. עמוד (שם, slug, סוג)
2. רשימת סקשנים — עם תיאור, רמזים אם הוא נטען מ-CPT, וסכמת שדות ACF מוצעת
3. עמודים נוספים שמשתמעים מהעיצוב (קישורי תפריט/פוטר, עמודי שירות וכו')

חוקי זהב:
1. כל סקשן חייב definition_slug שקיים בקטלוג. אין להמציא slugs חדשים.
2. page_slug באנגלית, kebab-case (home, about, contact).
3. סוגי עמוד:
   - "page" = עמוד רגיל
   - "archive" = רשימת פוסטים מ-CPT (למשל רשימת אטרקציות)
   - "single" = תבנית של פוסט פנימי (למשל אטרקציה אחת)
   - "system" = עמודי מערכת (404, חיפוש)
   - "service" = עמודי שירות (תקנון, נגישות, מדיניות פרטיות)
4. עבור כל סקשן, ציין אם cpt_driven=true (התוכן הוא רשימה דינמית שנטענת מ-CPT, למשל גריד אטרקציות, גריד צוות, סליידר טסטימוניאלס). אם כן, הצע CPT (slug באנגלית יחיד, name_he בעברית) — או reuse של CPT קיים בפרויקט (ראה למטה).
5. field_schema = שדות ACF שצריכים לאפשר עריכה של הסקשן הזה במנגנון ניהול. לסקשנים CPT-driven, אל תשים את שדות ה-CPT עצמם — רק שדות "עוטפים" כמו כותרת על־עמודית, תיאור, CTA, מספר פריטים להצגה. אם זה repeater (כמו רשימת תכונות, רשימת שלבים) השתמש ב-type=repeater עם sub_fields.
6. additional_pages = כל עמוד שזוהה דרך לינקים בעיצוב (תפריט, פוטר, breadcrumbs) שלא הוא העמוד הזה. גם עמודי מערכת ושירות צפויים (404, חיפוש, תקנון, נגישות, מדיניות פרטיות) — הוסף אותם גם אם לא ראית קישור מפורש. parent_slug = רק אם העמוד שייך תחת עמוד אב לוגי (לדוגמה, "תקנון" יכול להיות תחת "footer" כעמוד עצמאי, אז parent_slug=null; אבל "ארכיון של מאמר" יכול להיות parent="blog").
7. כל הטקסטים בעברית, פרט ל-slugs ול-keys.
8. design_system: אם זה נראה כמו עמוד הבית או עמוד מרכזי שחושף את שפת המותג, חלץ את הצבעים והפונטים. אם זה עמוד פנימי שלא נראה כמו עמוד-בית — החזר null.

הקטלוג של section_definitions:

${catalogText}

CPTs קיימים בפרויקט (העדף לעשות reuse במקום להציע חדשים אם מתאים):

${cptsText}
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
              source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
            },
            {
              type: 'text',
              text: `נתח את העיצוב הזה (viewport: ${design.viewport}${design.notes ? `, הערות: ${design.notes}` : ''}).

החזר JSON תקני לסכמה.`,
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
  const validSlugs = new Set(definitions.map(d => d.slug));
  analysis.sections = (analysis.sections ?? [])
    .filter(s => validSlugs.has(s.definition_slug))
    .sort((a, b) => a.order_hint - b.order_hint);
  if (!analysis.page_slug || !slugify(analysis.page_slug)) {
    analysis.page_slug = slugify(analysis.page_name_en || analysis.page_name_he);
  }

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
    summary:     `Claude ניתח עיצוב: ${analysis.page_name_he} (${analysis.sections.length} סקשנים, ${analysis.additional_pages.length} עמודים מוצעים)`,
  });

  revalidatePath(`/projects/${ctx.projectSlug}/${ctx.pageSlug ?? ''}/designs/${designId}`);
  revalidatePath(`/projects/${ctx.projectSlug}/${ctx.pageSlug ?? ''}`);
  revalidatePath(`/projects/${ctx.projectSlug}`);
  return { ok: true, data: { analysis } };
}

/**
 * Persist edits the designer made to the analysis. We trust the JSON blob
 * the client sends and overwrite designs.ai_analysis. Validation happens at
 * the UI level.
 */
export async function updateAnalysis(
  designId: string,
  ctx: { projectSlug: string; pageSlug: string },
  analysis: DesignAnalysis
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { error } = await supabase
    .from('designs')
    .update({ ai_analysis: analysis as unknown as Json })
    .eq('id', designId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${ctx.projectSlug}/${ctx.pageSlug}/designs/${designId}`);
  return { ok: true };
}

interface MaterializeReport {
  pageId: string;
  pageSlug: string;
  sectionsAdded: number;
  cptsCreated: number;
  pagesCreated: number;
}

/**
 * Take a design's stored ai_analysis and turn it into:
 *   - The main page (if not already linked) + its sections
 *   - Any suggested CPTs (idempotent — reuses existing slugs)
 *   - Any additional_pages (idempotent — reuses existing slugs)
 * Each section's `content` is populated with `{field_schema, cpt_driven, suggested_cpt}`
 * so the per-section prompt-copy panel later can read it back.
 */
export async function materializeAnalysis(
  designId: string,
  ctx: ProjectCtx
): Promise<Result<MaterializeReport>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { data: design } = await supabase
    .from('designs')
    .select('id, project_id, page_id, ai_analysis')
    .eq('id', designId)
    .single<{ id: string; project_id: string; page_id: string | null; ai_analysis: Json }>();
  if (!design) return { ok: false, error: 'העיצוב לא נמצא' };
  if (!design.ai_analysis) return { ok: false, error: 'אין ניתוח שמור' };

  const analysis = design.ai_analysis as unknown as DesignAnalysis;
  const slug = slugify(analysis.page_slug);
  if (!slug) return { ok: false, error: 'slug לא תקין' };

  const report: MaterializeReport = {
    pageId: '', pageSlug: slug, sectionsAdded: 0, cptsCreated: 0, pagesCreated: 0,
  };

  // ─── Apply detected design system to project (only if project tokens are
  //     empty so we never overwrite manually configured ones). ──────────
  if (analysis.design_system) {
    const { data: proj } = await supabase
      .from('projects').select('design_tokens')
      .eq('id', design.project_id).single<{ design_tokens: Json }>();
    const tokens = (proj?.design_tokens ?? {}) as Record<string, unknown>;
    const hasColors = !!(tokens.colors && Object.keys(tokens.colors as object).length);
    const hasFonts  = !!(tokens.fonts && Object.keys(tokens.fonts as object).length);
    if (!hasColors && !hasFonts) {
      await supabase.from('projects').update({
        design_tokens: {
          colors: analysis.design_system.colors,
          fonts:  analysis.design_system.fonts,
        } as unknown as Json,
      }).eq('id', design.project_id);
    }
  }

  // ─── Create CPTs ───────────────────────────────────────────────────────
  const cptByOriginalSlug = new Map<string, string>(); // original suggested slug → DB id
  const proposedCpts = analysis.sections
    .map(s => s.suggested_cpt)
    .filter((c): c is { slug: string; name_he: string } => !!c);

  // Dedupe by slug
  const uniqueCpts = new Map<string, { slug: string; name_he: string }>();
  for (const c of proposedCpts) uniqueCpts.set(slugify(c.slug), c);

  if (uniqueCpts.size > 0) {
    const { data: existingCpts } = await supabase
      .from('cpts')
      .select('id, slug')
      .eq('project_id', ctx.projectId)
      .in('slug', Array.from(uniqueCpts.keys()));
    const existingMap = new Map((existingCpts ?? []).map(c => [c.slug, c.id]));

    let cptOrder = 0;
    for (const [, c] of uniqueCpts) {
      const cleanSlug = slugify(c.slug);
      const existingId = existingMap.get(cleanSlug);
      if (existingId) {
        cptByOriginalSlug.set(c.slug, existingId);
        continue;
      }
      cptOrder += 10;
      const { data: created } = await supabase
        .from('cpts')
        .insert({
          project_id:  ctx.projectId,
          slug:        cleanSlug,
          name_he:     c.name_he,
          has_archive: true,
          has_single:  true,
          order:       cptOrder,
        })
        .select('id')
        .single<{ id: string }>();
      if (created) {
        cptByOriginalSlug.set(c.slug, created.id);
        report.cptsCreated++;
      }
    }
  }

  // ─── Create / find the main page ───────────────────────────────────────
  const { data: existingMain } = await supabase
    .from('pages')
    .select('id, slug')
    .eq('project_id', ctx.projectId)
    .eq('slug', slug)
    .maybeSingle<{ id: string; slug: string }>();

  let pageId: string;
  if (existingMain) {
    pageId = existingMain.id;
  } else {
    const { data: lastPage } = await supabase
      .from('pages')
      .select('order')
      .eq('project_id', ctx.projectId)
      .order('order', { ascending: false })
      .limit(1)
      .single<{ order: number }>();
    const nextOrder = (lastPage?.order ?? 0) + 10;

    const { data: newPage, error: pageError } = await supabase
      .from('pages')
      .insert({
        project_id: ctx.projectId,
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

    if (pageError || !newPage) {
      return { ok: false, error: pageError?.message ?? 'יצירת עמוד נכשלה' };
    }
    pageId = newPage.id;
    report.pagesCreated++;
  }
  report.pageId = pageId;

  // ─── Sections (skip if the page already has sections — avoid duplicates) ──
  const slugs = analysis.sections.map(s => s.definition_slug);
  const { data: defs } = slugs.length
    ? await supabase
        .from('section_definitions')
        .select('id, slug')
        .in('slug', slugs)
    : { data: [] as { id: string; slug: string }[] };
  const defBySlug = new Map((defs ?? []).map(d => [d.slug, d.id]));

  const { data: existingSections } = await supabase
    .from('sections')
    .select('id, order')
    .eq('page_id', pageId)
    .order('order', { ascending: false })
    .limit(1);

  let nextOrder = ((existingSections?.[0]?.order ?? 0) + 10);
  for (const s of analysis.sections) {
    const definitionId = defBySlug.get(s.definition_slug);
    if (!definitionId) continue;

    const content = {
      field_schema: s.field_schema ?? [],
      cpt_driven:   s.cpt_driven,
      cpt_id:       s.suggested_cpt ? cptByOriginalSlug.get(s.suggested_cpt.slug) ?? null : null,
      cpt_slug:     s.suggested_cpt?.slug ?? null,
      cpt_name_he:  s.suggested_cpt?.name_he ?? null,
    };

    const { error } = await supabase.from('sections').insert({
      page_id:         pageId,
      definition_id:   definitionId,
      definition_slug: s.definition_slug,
      order:           nextOrder,
      status:          'planned' as SectionStatus,
      notes:           s.description_he,
      content:         content as unknown as Json,
    });
    if (!error) {
      report.sectionsAdded++;
      nextOrder += 10;
    }
  }

  // ─── Additional pages (parent_id resolved by slug) ────────────────────
  if (analysis.additional_pages?.length) {
    // Existing pages keyed by slug (so we don't recreate)
    const allSlugs = analysis.additional_pages.map(p => slugify(p.slug));
    const { data: existing } = allSlugs.length
      ? await supabase
          .from('pages')
          .select('id, slug')
          .eq('project_id', ctx.projectId)
          .in('slug', allSlugs)
      : { data: [] as { id: string; slug: string }[] };
    const idBySlug = new Map((existing ?? []).map(p => [p.slug, p.id]));
    // Pre-seed with the main page so children can reference it
    idBySlug.set(slug, pageId);

    const { data: lastPage } = await supabase
      .from('pages')
      .select('order')
      .eq('project_id', ctx.projectId)
      .order('order', { ascending: false })
      .limit(1)
      .single<{ order: number }>();
    let pageOrder = (lastPage?.order ?? 0) + 10;

    // For each new page: try to figure out which trigger section it came
    // from. We match by CPT slug — if a section is CPT-driven and the page
    // is type=archive/single with that same suggested slug, that's the
    // trigger. Otherwise we just note "discovered from menu/footer".
    const sectionsByCptSlug = new Map<string, AnalysisSection>();
    for (const s of analysis.sections) {
      if (s.cpt_driven && s.suggested_cpt) {
        sectionsByCptSlug.set(slugify(s.suggested_cpt.slug), s);
      }
    }

    const siblingSummaries = analysis.sections.map(s => ({
      definition_slug: s.definition_slug,
      name_he: s.name_he,
      cpt_driven: s.cpt_driven,
    }));

    // Two passes: first create everyone with no parent, then patch parent_id
    const created: Array<{ id: string; slug: string; parent_slug: string | null }> = [];
    for (const sp of analysis.additional_pages) {
      const cleanSlug = slugify(sp.slug);
      if (idBySlug.has(cleanSlug)) continue;

      // Try to identify the trigger section. If the page type is archive or
      // single and the page slug matches a CPT slug, the trigger is that
      // CPT-driven section.
      const triggerSection = sectionsByCptSlug.get(cleanSlug)
        ?? Array.from(sectionsByCptSlug.values()).find(s =>
          s.suggested_cpt && (cleanSlug.includes(slugify(s.suggested_cpt.slug)) ||
                              slugify(s.suggested_cpt.slug).includes(cleanSlug))
        );

      const creationContext = {
        source: 'design_analysis' as const,
        source_design_id: design.id,
        source_page_slug: slug,
        source_page_name_he: analysis.page_name_he,
        source_page_type: analysis.page_type,
        trigger_section: triggerSection ? {
          definition_slug: triggerSection.definition_slug,
          name_he:         triggerSection.name_he,
          description_he:  triggerSection.description_he,
          cpt_slug:        triggerSection.suggested_cpt?.slug ?? null,
          cpt_name_he:     triggerSection.suggested_cpt?.name_he ?? null,
        } : null,
        sibling_sections: siblingSummaries,
        original_reason_he: sp.reason_he,
        suggested_at: new Date().toISOString(),
      };

      const { data: newPage, error } = await supabase
        .from('pages')
        .insert({
          project_id: ctx.projectId,
          slug:       cleanSlug,
          name_he:    sp.name_he,
          type:       sp.type,
          status:     'planned',
          order:      pageOrder,
          notes:      sp.reason_he,
          creation_context: creationContext as unknown as Json,
          created_by: user.id,
        })
        .select('id, slug')
        .single<{ id: string; slug: string }>();

      if (!error && newPage) {
        idBySlug.set(newPage.slug, newPage.id);
        created.push({ id: newPage.id, slug: newPage.slug, parent_slug: sp.parent_slug ? slugify(sp.parent_slug) : null });
        report.pagesCreated++;
        pageOrder += 10;
      }
    }

    for (const c of created) {
      if (!c.parent_slug) continue;
      const parentId = idBySlug.get(c.parent_slug);
      if (!parentId || parentId === c.id) continue;
      await supabase.from('pages').update({ parent_id: parentId }).eq('id', c.id);
    }
  }

  // Link the design to the main page
  await supabase.from('designs').update({ page_id: pageId }).eq('id', design.id);

  await supabase.from('activity_log').insert({
    project_id:  ctx.projectId,
    actor_id:    user.id,
    actor_label: 'Claude (claude-opus-4-7)',
    kind:        'created',
    entity_type: 'page',
    entity_id:   pageId,
    summary:     `נוצר עמוד "${analysis.page_name_he}" + ${report.sectionsAdded} סקשנים, ${report.cptsCreated} CPTs, ${report.pagesCreated} עמודים`,
  });

  revalidatePath(`/projects/${ctx.projectSlug}`);
  revalidatePath(`/projects/${ctx.projectSlug}/${slug}`);

  return { ok: true, data: report };
}

// ════════════════════════════════════════════════════════════════════════
// Page-structure suggester
// ────────────────────────────────────────────────────────────────────────
// Given a page that was created from a design analysis (so it has a rich
// creation_context), call Claude with that context + project state and ask
// for a proposed structure: sections (with field schemas), and (for archive
// pages) suggested taxonomies for the linked CPT.
// ════════════════════════════════════════════════════════════════════════

export interface SuggestedTaxonomy {
  slug: string;
  name_he: string;
  hierarchical: boolean;
  terms: string[];
  reasoning_he: string;
}

export interface PageStructureProposal {
  page_summary_he: string;
  reasoning_he: string;
  sections: AnalysisSection[];
  suggested_taxonomies: SuggestedTaxonomy[];
}

const TAXONOMY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['slug', 'name_he', 'hierarchical', 'terms', 'reasoning_he'],
  properties: {
    slug:         { type: 'string', description: 'kebab-case English' },
    name_he:      { type: 'string' },
    hierarchical: { type: 'boolean', description: 'true=קטגוריות, false=תגיות' },
    terms:        { type: 'array', items: { type: 'string' } },
    reasoning_he: { type: 'string', description: 'למה הצענו את הטקסונומיה הזו' },
  },
} as const;

const STRUCTURE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['page_summary_he', 'reasoning_he', 'sections', 'suggested_taxonomies'],
  properties: {
    page_summary_he: { type: 'string', description: 'תקציר מטרת העמוד' },
    reasoning_he:    { type: 'string', description: 'למה ההצעה הזו מתאימה — קצר וענייני' },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['definition_slug', 'name_he', 'description_he', 'order_hint',
                   'cpt_driven', 'suggested_cpt', 'field_schema'],
        properties: {
          definition_slug: { type: 'string' },
          name_he:         { type: 'string' },
          description_he:  { type: 'string' },
          order_hint:      { type: 'integer' },
          cpt_driven:      { type: 'boolean' },
          suggested_cpt: {
            anyOf: [
              { type: 'object', additionalProperties: false, required: ['slug', 'name_he'],
                properties: { slug: { type: 'string' }, name_he: { type: 'string' } } },
              { type: 'null' },
            ],
          },
          field_schema: {
            type: 'array',
            items: FIELD_DEF_SCHEMA,
          },
        },
      },
    },
    suggested_taxonomies: {
      type: 'array',
      description: 'רק אם רלוונטי (בעיקר עבור עמודי archive). אחרת מערך ריק.',
      items: TAXONOMY_SCHEMA,
    },
  },
} as const;

export async function suggestPageStructure(
  pageId: string,
  ctx: { projectSlug: string }
): Promise<Result<{ proposal: PageStructureProposal }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: 'ANTHROPIC_API_KEY לא מוגדר' };
  }

  const { data: page } = await supabase
    .from('pages')
    .select('id, project_id, slug, name_he, type, cpt_id, creation_context, notes')
    .eq('id', pageId)
    .single<{
      id: string; project_id: string; slug: string; name_he: string | null;
      type: PageType; cpt_id: string | null; creation_context: Json | null; notes: string | null;
    }>();
  if (!page) return { ok: false, error: 'העמוד לא נמצא' };

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, client_name')
    .eq('id', page.project_id)
    .single<{ id: string; name: string; client_name: string | null }>();

  // CPT info if linked
  let cptInfo: { slug: string; name_he: string | null; field_schema: Json } | null = null;
  if (page.cpt_id) {
    const { data: cpt } = await supabase
      .from('cpts')
      .select('slug, name_he, field_schema')
      .eq('id', page.cpt_id)
      .single<{ slug: string; name_he: string | null; field_schema: Json }>();
    if (cpt) cptInfo = cpt;
  }

  // Section catalog
  const { data: defsData } = await supabase
    .from('section_definitions')
    .select('slug, name_he, name_en, category, description, cpt_driven')
    .order('category', { ascending: true });
  const definitions = (defsData ?? []) as { slug: string; name_he: string | null; name_en: string | null; category: string | null; description: string | null; cpt_driven: boolean }[];

  // Existing CPTs
  const { data: cptsData } = await supabase
    .from('cpts')
    .select('slug, name_he')
    .eq('project_id', page.project_id);
  const existingCpts = (cptsData ?? []) as { slug: string; name_he: string | null }[];

  const catalogText = definitions.map(d => {
    const name = d.name_he ?? d.name_en ?? d.slug;
    const cat  = d.category ? `[${d.category}]` : '[other]';
    const cpt  = d.cpt_driven ? ' (CPT-driven)' : '';
    return `- \`${d.slug}\` ${cat} ${name}${cpt}`;
  }).join('\n');

  const cptsText = existingCpts.length === 0
    ? '(אין CPTs)'
    : existingCpts.map(c => `- \`${c.slug}\` — ${c.name_he ?? c.slug}`).join('\n');

  const ctxText = page.creation_context
    ? `\nהעמוד הזה נוצר אוטומטית במהלך ניתוח של עמוד אחר. הקונטקסט המלא:\n\`\`\`json\n${JSON.stringify(page.creation_context, null, 2)}\n\`\`\``
    : '\n(אין קונטקסט יצירה — זה עמוד שנוצר ידנית)';

  const cptText = cptInfo
    ? `\nהעמוד מקושר ל-CPT \`${cptInfo.slug}\` (${cptInfo.name_he ?? cptInfo.slug}). שדות ה-CPT:\n\`\`\`json\n${JSON.stringify(cptInfo.field_schema, null, 2)}\n\`\`\``
    : '';

  const systemPrompt = `אתה אדריכל UX/IA עבור Elevate Digital Studio.

המשימה שלך: לתכנן את המבנה של העמוד הספציפי. תקבל קונטקסט מפורט מאיפה העמוד הגיע (מאיזה עיצוב, מאיזה סקשן בעמוד אחר, מה האחים שלו), ועליך להציע:

1. **מבנה הסקשנים** — אילו סקשנים מהקטלוג מתאימים, באיזה סדר, ומה התיאור של כל אחד.
2. **מתי הסקשן אוטומטי לעומת ידני** — לעמודי ארכיון, לעיתים נכון שגריד הפריטים יטען אוטומטית מה-CPT (cpt_driven=true) במקום סקשן עריכת תוכן ידני. הסבר את זה ב-description.
3. **טקסונומיות מומלצות** — אם זה עמוד archive שצריך פילטרים (לפי קטגוריה/יעד/מחיר), הצע אותן עם terms ראשוניים.
4. **שדות ACF "עוטפים"** — לכל סקשן, שדות שמאפשרים עריכה (כותרת על-עמודית, מספר פריטים, CTA וכו'). אל תכלול שדות שכבר נמצאים ב-CPT עצמו.

חוקים:
- כל definition_slug חייב להיות מהקטלוג שלמטה.
- כל הטקסטים בעברית, פרט ל-slugs ול-keys.
- נטה לפשטות: אל תוסיף סקשנים סתם בשביל המראה.
- ההסבר ב-reasoning_he חייב לקשור בין ההצעה לבין הקונטקסט שקיבלת.

קטלוג הסקשנים:
${catalogText}

CPTs קיימים בפרויקט:
${cptsText}
`;

  const userText = `**פרויקט:** ${project?.name ?? '?'}${project?.client_name ? ` (${project.client_name})` : ''}

**העמוד:**
- שם: ${page.name_he ?? page.slug}
- slug: \`${page.slug}\`
- סוג: ${page.type}
- הערות נוכחיות: ${page.notes ?? '(ריק)'}${cptText}

**קונטקסט יצירה:**${ctxText}

הצע את המבנה האידיאלי של העמוד הזה — סקשנים, מה אוטומטי ומה ידני, וטקסונומיות אם רלוונטי.`;

  const client = new Anthropic();

  let parsed: unknown;
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      output_config: { format: { type: 'json_schema', schema: STRUCTURE_SCHEMA } },
      messages: [{ role: 'user', content: userText }],
    });
    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return { ok: false, error: 'Claude לא החזיר טקסט' };
    }
    parsed = JSON.parse(textBlock.text);
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return { ok: false, error: `שגיאת Claude (${err.status}): ${err.message}` };
    }
    return { ok: false, error: `שגיאה: ${(err as Error).message}` };
  }

  const proposal = parsed as PageStructureProposal;
  const validSlugs = new Set(definitions.map(d => d.slug));
  proposal.sections = (proposal.sections ?? [])
    .filter(s => validSlugs.has(s.definition_slug))
    .sort((a, b) => a.order_hint - b.order_hint);

  // Persist proposal under creation_context.proposed_structure
  const existingCtx = (page.creation_context as Record<string, unknown> | null) ?? {};
  const newCtx = { ...existingCtx, proposed_structure: proposal };

  await supabase
    .from('pages')
    .update({ creation_context: newCtx as unknown as Json })
    .eq('id', pageId);

  await supabase.from('activity_log').insert({
    project_id:  page.project_id,
    actor_id:    user.id,
    actor_label: 'Claude (claude-opus-4-7)',
    kind:        'updated',
    entity_type: 'page',
    entity_id:   page.id,
    summary:     `Claude הציע מבנה לעמוד ${page.name_he ?? page.slug}: ${proposal.sections.length} סקשנים${proposal.suggested_taxonomies.length ? `, ${proposal.suggested_taxonomies.length} טקסונומיות` : ''}`,
  });

  revalidatePath(`/projects/${ctx.projectSlug}/${page.slug}`);
  return { ok: true, data: { proposal } };
}

export async function updatePageProposal(
  pageId: string,
  ctx: { projectSlug: string },
  proposal: PageStructureProposal
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { data: page } = await supabase
    .from('pages')
    .select('slug, creation_context')
    .eq('id', pageId)
    .single<{ slug: string; creation_context: Json | null }>();
  if (!page) return { ok: false, error: 'העמוד לא נמצא' };

  const existingCtx = (page.creation_context as Record<string, unknown> | null) ?? {};
  const newCtx = { ...existingCtx, proposed_structure: proposal };

  const { error } = await supabase
    .from('pages')
    .update({ creation_context: newCtx as unknown as Json })
    .eq('id', pageId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${ctx.projectSlug}/${page.slug}`);
  return { ok: true };
}

export async function materializePageStructure(
  pageId: string,
  ctx: { projectSlug: string }
): Promise<Result<{ sectionsAdded: number; taxonomiesCreated: number }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'אינך מחובר' };

  const { data: page } = await supabase
    .from('pages')
    .select('id, project_id, slug, cpt_id, creation_context')
    .eq('id', pageId)
    .single<{
      id: string; project_id: string; slug: string;
      cpt_id: string | null; creation_context: Json | null;
    }>();
  if (!page) return { ok: false, error: 'העמוד לא נמצא' };

  const cc = page.creation_context as Record<string, unknown> | null;
  const proposal = cc?.proposed_structure as PageStructureProposal | undefined;
  if (!proposal) return { ok: false, error: 'אין הצעת מבנה שמורה. הריצו "הצע מבנה" קודם.' };

  // CPTs that the proposal references — create/reuse like in materializeAnalysis
  const cptByOriginalSlug = new Map<string, string>();
  const proposedCpts = proposal.sections
    .map(s => s.suggested_cpt)
    .filter((c): c is { slug: string; name_he: string } => !!c);
  const uniqueCpts = new Map<string, { slug: string; name_he: string }>();
  for (const c of proposedCpts) uniqueCpts.set(slugify(c.slug), c);

  if (uniqueCpts.size > 0) {
    const { data: existingCpts } = await supabase
      .from('cpts').select('id, slug')
      .eq('project_id', page.project_id)
      .in('slug', Array.from(uniqueCpts.keys()));
    const existingMap = new Map((existingCpts ?? []).map(c => [c.slug, c.id]));
    let cptOrder = 0;
    for (const [, c] of uniqueCpts) {
      const cleanSlug = slugify(c.slug);
      const existingId = existingMap.get(cleanSlug);
      if (existingId) { cptByOriginalSlug.set(c.slug, existingId); continue; }
      cptOrder += 10;
      const { data: created } = await supabase
        .from('cpts')
        .insert({
          project_id: page.project_id, slug: cleanSlug, name_he: c.name_he,
          has_archive: true, has_single: true, order: cptOrder,
        })
        .select('id').single<{ id: string }>();
      if (created) cptByOriginalSlug.set(c.slug, created.id);
    }
  }

  // Sections
  const slugs = proposal.sections.map(s => s.definition_slug);
  const { data: defs } = slugs.length
    ? await supabase.from('section_definitions').select('id, slug').in('slug', slugs)
    : { data: [] as { id: string; slug: string }[] };
  const defBySlug = new Map((defs ?? []).map(d => [d.slug, d.id]));

  const { data: existingSections } = await supabase
    .from('sections')
    .select('order')
    .eq('page_id', page.id)
    .order('order', { ascending: false })
    .limit(1);
  let nextOrder = ((existingSections?.[0]?.order ?? 0) + 10);

  let sectionsAdded = 0;
  for (const s of proposal.sections) {
    const definitionId = defBySlug.get(s.definition_slug);
    if (!definitionId) continue;
    const content = {
      field_schema: s.field_schema ?? [],
      cpt_driven:   s.cpt_driven,
      cpt_id:       s.suggested_cpt ? cptByOriginalSlug.get(s.suggested_cpt.slug) ?? null : null,
      cpt_slug:     s.suggested_cpt?.slug ?? null,
      cpt_name_he:  s.suggested_cpt?.name_he ?? null,
    };
    const { error } = await supabase.from('sections').insert({
      page_id:         page.id,
      definition_id:   definitionId,
      definition_slug: s.definition_slug,
      order:           nextOrder,
      status:          'planned' as SectionStatus,
      notes:           s.description_he,
      content:         content as unknown as Json,
    });
    if (!error) { sectionsAdded++; nextOrder += 10; }
  }

  // Taxonomies — only if the page is linked to a CPT
  let taxonomiesCreated = 0;
  if (page.cpt_id && proposal.suggested_taxonomies?.length) {
    for (const t of proposal.suggested_taxonomies) {
      const cleanSlug = slugify(t.slug);
      const { data: existing } = await supabase
        .from('taxonomies')
        .select('id')
        .eq('cpt_id', page.cpt_id)
        .eq('slug', cleanSlug)
        .maybeSingle<{ id: string }>();
      if (existing) continue;
      const { error } = await supabase.from('taxonomies').insert({
        project_id:   page.project_id,
        cpt_id:       page.cpt_id,
        slug:         cleanSlug,
        name_he:      t.name_he,
        hierarchical: t.hierarchical,
        terms:        t.terms as unknown as Json,
      });
      if (!error) taxonomiesCreated++;
    }
  }

  // Mark the proposal as approved/materialized so the UI doesn't re-offer it
  const ctxSrc = (page.creation_context as Record<string, unknown> | null) ?? {};
  const newCtx = { ...ctxSrc, proposed_structure: proposal, materialized_at: new Date().toISOString() };
  await supabase
    .from('pages')
    .update({ creation_context: newCtx as unknown as Json, status: 'sectioned' })
    .eq('id', page.id);

  await supabase.from('activity_log').insert({
    project_id:  page.project_id,
    actor_id:    user.id,
    actor_label: 'Claude (claude-opus-4-7)',
    kind:        'created',
    entity_type: 'page',
    entity_id:   page.id,
    summary:     `אושר מבנה לעמוד: ${sectionsAdded} סקשנים, ${taxonomiesCreated} טקסונומיות`,
  });

  revalidatePath(`/projects/${ctx.projectSlug}/${page.slug}`);
  return { ok: true, data: { sectionsAdded, taxonomiesCreated } };
}

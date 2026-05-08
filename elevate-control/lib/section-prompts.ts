/**
 * Build "copy-paste-ready" prompts for a section, one per downstream task.
 *
 * The studio's pipeline is two-step:
 *
 * 1. **Frontend** — pure HTML/CSS/JS for the section, following Elevate's
 *    visual conventions. No WordPress, no ACF, no PHP. The output is a
 *    static .html (+ .css/.js) that lives under the project's `frontend/`
 *    folder. This is what the designer/frontend dev hands the WP dev.
 *
 * 2. **Admin / WP theme** — takes the *existing* frontend HTML file as
 *    input and produces the WordPress theme template part (PHP) plus the
 *    ACF Field Group definition. The frontend HTML is the source of truth
 *    for the visual structure; the admin prompt's job is to break it into
 *    editable fields and rebuild it as a `flexible_content` layout.
 */

export interface FieldDefForPrompt {
  key: string;
  label_he: string;
  type: string;
  required: boolean;
  notes?: string | null;
  sub_fields?: FieldDefForPrompt[];
}

export interface SectionPromptInput {
  pageNameHe:      string;
  pageSlug:        string;
  pageType:        string;
  sectionNameHe:   string;
  definitionSlug:  string;
  description:     string;
  fieldSchema:     FieldDefForPrompt[];
  cptDriven:       boolean;
  cptSlug:         string | null;
  cptNameHe:       string | null;
  projectName?:    string;
  projectSlug?:    string;
}

function fieldsToText(fields: FieldDefForPrompt[], depth = 0): string {
  if (!fields?.length) return '(אין שדות מוגדרים)';
  const indent = '  '.repeat(depth);
  return fields.map(f => {
    const req = f.required ? ' (חובה)' : '';
    const note = f.notes ? ` — ${f.notes}` : '';
    let out = `${indent}- \`${f.key}\` (${f.type})${req}: ${f.label_he}${note}`;
    if (f.sub_fields?.length && (f.type === 'repeater' || f.type === 'group')) {
      out += '\n' + fieldsToText(f.sub_fields, depth + 1);
    }
    return out;
  }).join('\n');
}

// ─── Frontend prompt: pure HTML/CSS/JS, no WordPress ────────────────────

export function buildFrontendPrompt(input: SectionPromptInput): string {
  return `# בניית הסקשן (Frontend בלבד): ${input.sectionNameHe}

הקלט: צילום מסך של הסקשן הזה (מצורף בנפרד) + ההגדרה הבאה.
הפלט: קוד HTML/CSS/JS סטטי בלבד. **בלי WordPress, בלי PHP, בלי ACF.**

## מיקום
- עמוד: ${input.pageNameHe} (\`/${input.pageSlug}\`)
- מזהה הסקשן: \`${input.definitionSlug}\`${input.projectName ? `\n- פרויקט: ${input.projectName}` : ''}

## מה הסקשן עושה
${input.description}

## משימה
על-בסיס צילום המסך, הפיקו:

1. **HTML** — קובץ או section markup, RTL, עברית כברירת מחדל. שמרו על מבנה סמנטי (\`<section>\`, \`<header>\`, רשימות וכו').
2. **CSS** — כל הצבעים, הטיפוגרפיה, המרווחים, ה-states וה-responsive breakpoints. אפשר קובץ נפרד או section-scoped.
3. **JS** — רק אם הסקשן דורש זאת (קרוסלה, אקורדיון, מודאל, פילטר). Vanilla או Swiper/AOS לפי הצורך.

עקבו אחרי קונבנציות הסטודיו (skill: \`elevate-website-builder\`):
- BEM כפול underscore: \`.section-name\`, \`.section-name__element\`, \`.section-name--modifier\`.
- מחלקות כפתורים: \`btn btn--primary\`, \`btn btn--ghost\`, \`btn--lg\`.
- אייקונים: \`<i class="icon icon-name"></i>\` מ-icomoon, או SVG inline.
- Swiper: מחלקת \`default-slider\` כשרלוונטי.
- AOS: data-aos לאנימציות בגלילה.

**אל תכתבו PHP, אל תרשמו ACF, אל תשתמשו ב-\`get_field()\`. רק HTML+CSS+JS.**

הקבצים שתפיקו צריכים להישמר תחת תיקיית הפרויקט ב-\`frontend/sections/${input.definitionSlug}/\` (HTML) ובהתאמה תחת \`frontend/css/sections/\` ו-\`frontend/js/sections/\`.`;
}

// ─── Admin prompt: take EXISTING HTML → WP theme + ACF ──────────────────

export function buildAdminPrompt(input: SectionPromptInput): string {
  const cptInfo = input.cptDriven
    ? `\n## תוכן דינמי\nהסקשן נטען מ-CPT \`${input.cptSlug}\` (${input.cptNameHe}). שדות ה-field_schema למטה הם השדות "העוטפים" (כותרת על-עמודית, CTA, מספר פריטים) — שדות הפוסט עצמו (תמונה ראשית, תוכן) שייכים לרישום ה-CPT הנפרד.`
    : '';

  return `# המרת הסקשן ל-WordPress theme: ${input.sectionNameHe}

הקלט:
- קובץ ה-HTML/CSS/JS של הסקשן (כבר קיים תחת \`frontend/sections/${input.definitionSlug}/\`).
- צילום מסך של הסקשן כפי שהוא ב-frontend.
- ההגדרה הבאה.

הפלט: קובץ template part PHP + הגדרת ACF Field Group, מותאמים ל-flexible_content של תמת הוורדפרס.

## הקשר
- עמוד: ${input.pageNameHe} (\`/${input.pageSlug}\`, type=${input.pageType})
- Section definition: \`${input.definitionSlug}\`
${cptInfo}

## תיאור הסקשן
${input.description}

## שדות ACF המאושרים
${fieldsToText(input.fieldSchema)}

## משימה
1. **קראו את ה-HTML** של הסקשן מתיקיית \`frontend/sections/${input.definitionSlug}/\`.
2. **זהו את החלקים הניתנים לעריכה** (כותרות, טקסטים, תמונות, כפתורים, רשימות) והחליפו אותם ב-\`<?php the_field('...'); ?>\` או ב-loop על repeaters לפי ה-field_schema למעלה.
3. **שמרו את ה-CSS וה-JS כמו שהם** — רק ה-HTML הופך לתבנית PHP. ה-classes נשארים זהים כדי שה-CSS שכבר נכתב ימשיך לעבוד 1:1.
4. **הפיקו**:
   - \`templates/parts/sections/${input.definitionSlug}.php\` — ה-template part. מבוסס על ה-HTML המקורי, עם החלפת התוכן הקבוע ב-ACF calls. ${input.cptDriven ? 'כולל \`WP_Query\` לטעינת הפריטים מ-' + input.cptSlug + '.' : ''}
   - \`includes/acf/sections/${input.definitionSlug}.php\` — \`acf_add_local_field_group\` מלא. מפתחות \`field_${input.definitionSlug}_<key>\`, location: \`flexible_content_layout = ${input.definitionSlug}\` (תחת ה-FC הראשי של תמת הסטודיו).
   - שורת \`require_once\` לקובץ ה-ACF, להוספה ל-\`functions.php\`.

חוקי זהב:
- אין לשנות classes או מבנה מהקוד המקורי. רק להחליף תוכן בקריאות ACF.
- לכל שדה repeater — \`have_rows() / the_row()\` עם הסאב-שדות בדיוק לפי ה-schema.
- לתמונות: שדה ACF מוגדר return_format=array, ולקרוא \`['url']\` ו-\`['alt']\`.

עקבו אחרי קונבנציות הסטודיו (skill: \`elevate-website-builder\`).`;
}

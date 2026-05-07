/**
 * Build "copy-paste-ready" prompts for a section, one for each downstream
 * task (frontend HTML/CSS/JS via the elevate-website-builder skill,
 * and ACF-driven WordPress admin via the WordPress builder).
 *
 * The frontend prompt carries enough context that pasting it into Claude
 * Code along with a screenshot of the section is enough to produce the
 * markup. The admin prompt focuses on field types — same screenshot, but
 * the model is asked to write the ACF group definition + any PHP wiring.
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

export function buildFrontendPrompt(input: SectionPromptInput): string {
  const cptInfo = input.cptDriven
    ? `\n## תוכן דינמי\nהסקשן הזה נטען מ-CPT \`${input.cptSlug}\` (${input.cptNameHe}). כתבו את ה-HTML כתבנית עבור פריט בודד + לולאה. שדות ה-CPT עצמם לא מופיעים ב-field_schema למטה — הם של ה-CPT.`
    : '';

  return `# בניית הסקשן: ${input.sectionNameHe}

הקלט: צילום מסך של הסקשן הזה (מצורף בנפרד) + ההגדרה הבאה.

## מיקום
- עמוד: ${input.pageNameHe} (\`/${input.pageSlug}\`, type=${input.pageType})
- Section definition: \`${input.definitionSlug}\`${input.projectName ? `\n- פרויקט: ${input.projectName}` : ''}

## תיאור הסקשן
${input.description}
${cptInfo}

## שדות שיוזנו דרך ACF
${fieldsToText(input.fieldSchema)}

## משימה
על-בסיס צילום המסך + ההגדרה הזו, הפיקו:
1. קובץ HTML/PHP (template part / FC layout) של הסקשן ב-BEM, RTL-first, עברית כשפת ברירת המחדל.
2. CSS (קובץ נפרד או section-scoped) — צבעים, טיפוגרפיה ומרווחים מהעיצוב.
3. JS אם נדרש (Swiper, AOS, accordion, אלא אם זה סטטי).

עקבו אחרי הקונבנציות של הסטודיו (skill: \`elevate-website-builder\`):
- BEM כפול underscore.
- מחלקות כפתורים: \`btn btn--primary\`, \`btn btn--ghost\`, וכו'.
- אייקונים מ-icomoon (\`.icon__\`).
- Swiper עם מחלקת \`default-slider\` כשרלוונטי.
- AOS לאנימציות.

החזירו את הקבצים בהתאמה למבנה תמת WordPress (\`templates/parts/sections/<slug>.php\`).`;
}

export function buildAdminPrompt(input: SectionPromptInput): string {
  const cptInfo = input.cptDriven
    ? `\nהסקשן נטען מ-CPT \`${input.cptSlug}\` (${input.cptNameHe}). שדות ה-field_schema למטה הם השדות "העוטפים" (כותרת על־עמודית, CTA, מספר פריטים) — שדות הפוסט עצמו (תמונה ראשית, תוכן, תאריך) נמצאים ברישום ה-CPT הנפרד שלו.`
    : '';

  return `# הגדרת ACF + ניהול: ${input.sectionNameHe}

## הקשר
- עמוד: ${input.pageNameHe} (\`/${input.pageSlug}\`, type=${input.pageType})
- Section definition: \`${input.definitionSlug}\`
${cptInfo}

## תיאור הסקשן
${input.description}

## שדות מוצעים
${fieldsToText(input.fieldSchema)}

## משימה
הפיקו:
1. רישום ACF Field Group (קוד PHP, \`acf_add_local_field_group\`) — שדות בדיוק כמתואר, מפתחות \`field_<group>_<key>\`.
2. שיוך ה-Field Group לפי לוקיישן: \`flexible_content_layout = ${input.definitionSlug}\` או location מתאים אחר (להחליט לפי איך זה משתלב במבנה ה-FC של הסטודיו).
3. אם ה-section כולל ${input.cptDriven ? 'CPT-driven content' : 'אובייקטים שצריכים תמונות / קבצים'} — וודאו שהשדות מוגדרים נכון (return type, image format).
4. אם יש שדה repeater — וודאו min/max מתאימים והערות לעורך התוכן.

תפיקו קובץ \`includes/acf/sections/${input.definitionSlug}.php\` שאפשר להכליל מ-\`functions.php\`.

עקבו אחרי קונבנציות הסטודיו (skill: \`elevate-website-builder\`).`;
}

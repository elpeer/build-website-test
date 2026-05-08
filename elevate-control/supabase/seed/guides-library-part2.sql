-- ════════════════════════════════════════════════════════════════════════
-- Guide library — part 2: ACF, CPTs, Forms, SEO
-- Run after part1.sql (which seeds the categories used here).
-- ════════════════════════════════════════════════════════════════════════

do $$
declare
  v_user_id uuid;
  v_cat_wp uuid; v_cat_forms uuid; v_cat_seo uuid;
begin
  select id into v_user_id from public.profiles where studio_admin = true limit 1;
  if v_user_id is null then raise exception 'No studio_admin profile found'; end if;

  select id into v_cat_wp    from public.guide_categories where slug = 'wordpress';
  select id into v_cat_forms from public.guide_categories where slug = 'forms';
  select id into v_cat_seo   from public.guide_categories where slug = 'seo';

  -- ────────────────────────────────────────────────────────────────────
  -- ACF — rich editing
  -- ────────────────────────────────────────────────────────────────────

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('acf-edit-text-fields',
    'עריכת טקסטים בשדות ACF',
    'איך מזהים שדה טקסט פשוט מול אזור טקסט ארוך, ומה ההבדל ביניהם.',
    '', $H$<h2>סוגי שדות טקסט שתפגשו</h2>
<h3>Text — שורה אחת</h3>
<p>שדה קטן, שורה אחת. מתאים לכותרות קצרות, שמות, מספרי טלפון. אם תקלידו טקסט ארוך הוא יחתך באתר.</p>
<h3>Textarea — מספר שורות בלי עיצוב</h3>
<p>תיבה גדולה יותר. אפשר לשבור שורות. אין כפתורי הדגשה / קישורים — טקסט פשוט בלבד.</p>
<h3>WYSIWYG / Medium Editor — עורך עשיר</h3>
<p>תיבה עם כפתורי עיצוב מעל (B, I, U, רשימה, לינק). זה מה שמשתמשים בו לפסקאות תוכן רגילות.</p>
<h2>איך לערוך</h2>
<ol><li>פתחו את העמוד והסקשן הרצוי.</li><li>מצאו את השדה (לרוב מסומן בעברית: "כותרת", "תיאור", "טקסט עיקרי").</li><li>לחצו פנימה והחלף את הטקסט.</li><li>לחצו <strong>Update</strong> בראש העמוד.</li></ol>
<h2>טריקים שימושיים</h2>
<ul><li><strong>הדבקה ללא עיצוב:</strong> אם אתם מעתיקים טקסט מ-Word, השתמשו ב-<code>Ctrl+Shift+V</code> במקום <code>Ctrl+V</code> — זה יעתיק טקסט נקי בלי עיצוב מבלבל.</li><li><strong>שורה חדשה בלי פסקה:</strong> ב-WYSIWYG השתמשו ב-<code>Shift+Enter</code> במקום Enter רגיל.</li></ul>
<blockquote><p>⚠️ <strong>שדות עם הגבלת אורך:</strong> חלק מהשדות מוגבלים לתווים בודדים (למשל כותרת עד 60 תווים בשביל SEO). אם תכתבו יותר — תוצג הודעת אזהרה. תצמצמו או השאירו כך לפי שיקולכם.</p></blockquote>$H$,
    'wordpress', v_cat_wp, 'global', true, 200, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('acf-images-galleries',
    'החלפת תמונות וגלריות',
    'איך מחליפים תמונה בודדת או גלריה — מהמחשב או מספריית המדיה.',
    '', $H$<h2>שני סוגי שדות</h2>
<ul><li><strong>Image</strong> — תמונה בודדת.</li><li><strong>Gallery</strong> — קבוצת תמונות (לדוגמה גלריית עבודות).</li></ul>
<h2>החלפת תמונה בודדת</h2>
<ol><li>פתחו את הסקשן עם התמונה.</li><li>תראו תמונה ממוזערת + כפתור <strong>Remove</strong> מתחתיה.</li><li>לחצו על התמונה הממוזערת — תיפתח ספריית המדיה.</li><li>בחרו תמונה קיימת, או לכו ללשונית "<strong>Upload Files</strong>" כדי להעלות חדשה.</li><li>לחצו "<strong>Select</strong>" בפינה התחתונה.</li><li>חזרו לעמוד ולחצו <strong>Update</strong>.</li></ol>
<h2>הסרת תמונה</h2>
<p>לחצו על "<strong>Remove</strong>" מתחת לתמונה — היא לא תוצג בסקשן (אבל לא תימחק מספריית המדיה).</p>
<h2>גלריה — הוספה והסרה</h2>
<h3>הוספת תמונות לגלריה</h3>
<ol><li>גללו לשדה הגלריה.</li><li>לחצו "<strong>Add to Gallery</strong>".</li><li>בחרו מספר תמונות (Ctrl/Cmd + click או Shift + click לטווח).</li><li>לחצו "<strong>Select</strong>".</li></ol>
<h3>שינוי סדר</h3>
<p>גררו תמונות בתוך התצוגה כדי לשנות סדר.</p>
<h3>הסרת תמונה מהגלריה</h3>
<p>לחצו על ה-X באדום על פינת התמונה.</p>
<blockquote><p>💡 <strong>טיפ ל-SEO וביצועים:</strong> תמיד דחסו תמונות לפני העלאה (TinyPNG / Squoosh). תמונה של 5MB תאט את האתר בצורה דרמטית — תמונה של 200KB תיראה זהה.</p></blockquote>$H$,
    'wordpress', v_cat_wp, 'global', true, 210, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('acf-medium-editor',
    'שימוש ב-Medium Editor להדגשות בתוך טקסט',
    'איך מדגישים מילה בודדת או הופכים לקישור — באמצע פסקה רגילה.',
    '', $H$<h2>איפה תפגשו אותו</h2>
<p>ב-Elevate משתמשים ב-Medium Editor במקומות שצריך טקסט עם הדגשה קלה — לרוב כותרות עם מילה אחת מודגשת או קישור.</p>
<p>נראה כמו שדה טקסט רגיל, אבל כשמסמנים טקסט עם העכבר — קופץ פס כפתורים מעל.</p>
<p>[צילום מסך: שדה Medium Editor עם פס כפתורים B / I / U צף מעל טקסט נבחר]</p>
<h2>הכפתורים בפס</h2>
<ul><li><strong>B</strong> — מודגש (Bold)</li><li><strong>I</strong> — נטוי (Italic)</li><li><strong>U</strong> — קו תחתי</li><li>🔗 — הוספת קישור</li><li><strong>H1 / H2</strong> — כותרת (לרוב לא נדרש פה)</li></ul>
<h2>איך עובדים</h2>
<ol><li>סמנו את המילה / משפט עם העכבר.</li><li>הפס יקפוץ אוטומטית.</li><li>לחצו על הכפתור הרצוי.</li><li>לחיצה נוספת תבטל את האפקט.</li></ol>
<h2>הוספת קישור</h2>
<ol><li>סמנו את הטקסט שאמור להיות לחיץ.</li><li>לחצו על האייקון 🔗.</li><li>הקלידו / הדביקו URL מלא (כולל <code>https://</code>).</li><li>לחצו Enter.</li></ol>
<h2>הסרת עיצוב</h2>
<p>סמנו את הטקסט המעוצב וחזרו ולחצו על אותו הכפתור (B/I/U). הוא יבטל את האפקט.</p>
<blockquote><p>⚠️ <strong>שמרו על מינימליזם:</strong> אם תדגישו את כל הפסקה, שום דבר לא בולט. הדגשה אחת בכל 5-10 שורות מקסימום.</p></blockquote>$H$,
    'wordpress', v_cat_wp, 'global', true, 220, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('acf-repeater',
    'שדות Repeater — הוספה והסרה של פריטים בלולאה',
    'איך מוסיפים עוד כרטיסיות, עוד תכונות, עוד שירותים לסקשן שתומך בזה.',
    '', $H$<h2>מה זה Repeater?</h2>
<p>שדה Repeater מאפשר להוסיף כמה פעמים את אותו "מבנה" — לדוגמה כרטיסי שירות, פריטי FAQ, תכונות בסקשן Why Us.</p>
<p>תכירו אותו לפי המבנה: רשימה של "שורות", כל שורה עם כפתור <strong>+ Add Row</strong> בתחתיתה.</p>
<h2>הוספת פריט</h2>
<ol><li>גללו לשדה ה-Repeater.</li><li>לחצו "<strong>+ Add Row</strong>" בתחתית.</li><li>שורה חדשה תוסף בתחתית — מלאו את השדות שלה.</li><li>אפשר להוסיף כמה שדרוש.</li></ol>
<h2>שינוי סדר</h2>
<p>בצד כל שורה יש סמל גרירה (3 פסים אופקיים). גררו אותו למעלה או למטה.</p>
<h2>הסרת פריט</h2>
<p>בצד כל שורה יש סמל "−" קטן או "<strong>Remove</strong>". לחצו עליו.</p>
<h2>פתיחה / סגירה של שורה</h2>
<p>שורות יכולות להיות מקופלות (כדי שלא תופסות מסך). לחצו על החץ בצד השורה כדי לפתוח/לסגור. תוכן בשורה סגורה <strong>נשמר</strong> — רק מוסתר מהתצוגה.</p>
<blockquote><p>💡 <strong>טיפ:</strong> אם יש לכם 10+ פריטים בRepeater, סגרו את כולם ופתחו רק את זה שאתם עורכים. ככה לא תאבדו מקום על המסך.</p></blockquote>$H$,
    'wordpress', v_cat_wp, 'global', true, 230, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  -- ────────────────────────────────────────────────────────────────────
  -- CPTs (Custom Post Types)
  -- ────────────────────────────────────────────────────────────────────

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('cpt-add-edit',
    'הוספה ועריכה של פריט CPT (אטרקציה / מוצר / מאמר)',
    'איך עובדים עם סוגי תוכן ייחודיים שיצרנו לפרויקט שלכם — אטרקציות, חבילות, חברי צוות וכו׳.',
    '', $H$<h2>מה זה CPT?</h2>
<p>Custom Post Type — סוג תוכן ייחודי שיצרנו במיוחד לאתר שלכם. דוגמאות:</p>
<ul><li>אטרקציות (לאתרי תיירות)</li><li>מוצרים (לחנויות שלא משתמשות ב-WooCommerce)</li><li>חברי צוות</li><li>טסטימוניאלס</li><li>פרויקטים בפורטפוליו</li></ul>
<p>לכל פרויקט יש CPTs שונים. בתפריט הצד שלכם תראו אותם עם אייקון משלהם.</p>
<h2>הוספת פריט חדש</h2>
<ol><li>בתפריט הצד, לחצו על שם ה-CPT (למשל "Attractions" / "אטרקציות").</li><li>תגיעו לרשימה של כל הפריטים הקיימים.</li><li>בראש העמוד לחצו "<strong>Add New</strong>" / "<strong>הוסף חדש</strong>".</li><li>תיפתח עמוד עריכה דומה לעמוד WordPress רגיל.</li><li>הזינו <strong>כותרת</strong> בשדה הראשי.</li><li>גללו לשדות הנוספים (תמונה, תיאור, מחיר, פרטים נוספים — לפי מה שהוגדר).</li><li>לחצו <strong>Publish</strong> בפינה השמאלית.</li></ol>
<h2>עריכת פריט קיים</h2>
<ol><li>בתפריט הצד → ה-CPT.</li><li>תופיע רשימה — לחצו על שם הפריט שתרצו לערוך.</li><li>בצעו את השינויים.</li><li>לחצו <strong>Update</strong>.</li></ol>
<h2>השדות שיש בכל CPT</h2>
<p>תלוי בפרויקט — כל אחד שונה. בדרך כלל יש:</p>
<ul><li>כותרת ראשית</li><li>תמונה ראשית (Featured Image) — תמונת cover שמופיעה בכרטיסי הציפייה</li><li>תיאור קצר (Excerpt)</li><li>תיאור מלא — ב-WYSIWYG</li><li>שדות ACF ייעודיים: מחיר, מיקום, מספר ימים, אייקון וכו'</li><li>קטגוריות / תגיות (טקסונומיה — מדריך נפרד)</li></ul>
<h2>פרסום או טיוטה</h2>
<ul><li><strong>Publish</strong> — הפריט מופיע באתר מיד.</li><li><strong>Save Draft</strong> — הפריט נשמר אבל לא מוצג. שימושי כשרוצים להכין קמפיין מראש.</li></ul>
<h2>מחיקה</h2>
<p>ברשימת הפריטים, רחפו על שם הפריט ותראו "<strong>Trash</strong>" באדום. <mark>זה לא מחיקה סופית — הפריט עובר לפח. אפשר לשחזר תוך 30 יום.</mark></p>$H$,
    'wordpress', v_cat_wp, 'global', true, 300, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('cpt-taxonomies',
    'קטגוריות ותגיות (טקסונומיות) ב-CPT',
    'איך מארגנים פריטים לקטגוריות — לסינון ולתצוגה לפי נושא באתר.',
    '', $H$<h2>מה זה טקסונומיה?</h2>
<p>שיטה לארגן פריטים לקבוצות. שני סוגים עיקריים:</p>
<ul><li><strong>Categories / קטגוריות</strong> — היררכיות (כמו תיקיות ותתי-תיקיות). לדוגמה אטרקציה ב"מוזיאונים" → "מוזיאוני אומנות".</li><li><strong>Tags / תגיות</strong> — שטוחות. תגית כמו "מתאים-לילדים" יכולה להופיע על פריטים מ-3 קטגוריות שונות.</li></ul>
<h2>איפה זה?</h2>
<p>כל CPT יכול להיות עם הטקסונומיות שלו. לדוגמה — תחת "Attractions" אולי יש תפריט-משנה "Categories" ו"Tags".</p>
<h2>הוספת קטגוריה חדשה</h2>
<ol><li>תפריט הצד → ה-CPT → <strong>Categories</strong>.</li><li>בצד שמאל יש טופס "<strong>Add New Category</strong>".</li><li><strong>Name</strong> — השם שיופיע באתר.</li><li><strong>Slug</strong> — אנגלית קצרה ל-URL (יווצר אוטומטית אם תשאירו ריק).</li><li><strong>Parent</strong> — אם זו תת-קטגוריה, בחרו את ההורה.</li><li><strong>Description</strong> — אופציונלי.</li><li>לחצו <strong>Add New Category</strong>.</li></ol>
<h2>שיוך פריט לקטגוריה</h2>
<ol><li>פתחו פריט CPT לעריכה.</li><li>בצד ימין תראו תיבת "Categories".</li><li>סמנו את הקטגוריות הרלוונטיות (אפשר כמה).</li><li>שמרו עם <strong>Update</strong>.</li></ol>
<h2>תגיות — ההבדל</h2>
<p>תגיות מתווספות בתיבת "Tags" באותו אופן, אבל אין היררכיה. הקלידו תג ולחצו "Add" — אפשר להוסיף תגיות חדשות תוך כדי עריכה.</p>
<blockquote><p>💡 <strong>חוק האצבע:</strong> השתמשו בקטגוריות כשאתם מארגנים את האתר (תפריטים, ארכיונים). השתמשו בתגיות לסינון נושאי (מועדף לי, חדש, במבצע).</p></blockquote>$H$,
    'wordpress', v_cat_wp, 'global', true, 310, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('cpt-content-management',
    'ניהול שוטף של תוכן CPT',
    'איך מסדרים פריטים, מסירים פריטים ישנים, ומחפשים בארכיון גדול.',
    '', $H$<h2>תצוגת הרשימה</h2>
<p>כשנכנסים ל-CPT, רואים טבלה של כל הפריטים. מידע סטנדרטי:</p>
<ul><li>כותרת + תאריך</li><li>מחבר</li><li>קטגוריות / תגיות</li><li>סטטוס (Published / Draft / Trashed)</li></ul>
<h2>חיפוש</h2>
<p>בפינה הימנית-עליונה יש שדה חיפוש. הוא מחפש בכותרות ובתוכן.</p>
<h2>סינון</h2>
<p>מעל הטבלה יש פילטרים — לפי קטגוריה, חודש, סטטוס. אפשר לשלב.</p>
<h2>פעולות בכמות</h2>
<ol><li>סמנו את התיבה ליד הפריטים.</li><li>בתפריט נפתח "<strong>Bulk Actions</strong>" בחרו מה לעשות (Edit / Move to Trash).</li><li>לחצו <strong>Apply</strong>.</li></ol>
<p>שימושי במיוחד אם רוצים לשנות קטגוריה ל-20 פריטים בבת-אחת.</p>
<h2>סדר תצוגה באתר</h2>
<p>ברירת המחדל ב-WordPress — לפי תאריך פרסום. הכי חדש קודם.</p>
<p><mark>אם רוצים סדר ידני</mark> (למשל אטרקציות לפי חשיבות) — בודקים אם הוגדר תוסף שמאפשר drag-to-reorder ב-CPT הזה. אם לא, פנו לסטודיו ונוסיף.</p>
<h2>פח אשפה (Trash)</h2>
<p>מחיקה מעבירה לפח, לא מוחקת. כדי להחזיר:</p>
<ol><li>בראש הטבלה לחצו על "<strong>Trash</strong>" (יופיע מספר ליד).</li><li>תראו את הפריטים שמחקתם.</li><li>רחפו על אחד — תראו "Restore".</li></ol>
<p>פריטים נמחקים לצמיתות אחרי 30 יום או בלחיצה על "<strong>Delete Permanently</strong>".</p>$H$,
    'wordpress', v_cat_wp, 'global', true, 320, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('cpt-team-testimonials',
    'ניהול חברי צוות וטסטימוניאלס',
    'איך מוסיפים, עורכים וממליצים על שינוי סדר של חברי הצוות וההמלצות בעמוד.',
    '', $H$<h2>חברי צוות</h2>
<p>אם בפרויקט שלכם יש CPT "Team Members" / "חברי צוות", זה המקום לנהל אותו. כל חבר צוות הוא פריט עם:</p>
<ul><li>שם מלא (כותרת)</li><li>תפקיד (תת-כותרת)</li><li>תמונה (Featured Image)</li><li>ביו קצר</li><li>קישורי רשתות חברתיות (LinkedIn / Instagram)</li><li>סדר תצוגה (אם קיים)</li></ul>
<h3>הוספת חבר חדש</h3>
<ol><li>תפריט הצד → <strong>Team</strong> → <strong>Add New</strong>.</li><li>הזינו שם בכותרת.</li><li>העלו תמונת ראש (מומלץ ריבוע 600×600 על רקע ניטרלי).</li><li>מלאו את שדות התפקיד והביו.</li><li>הוסיפו לינקים אם רלוונטי.</li><li>לחצו <strong>Publish</strong>.</li></ol>
<h2>טסטימוניאלס (המלצות לקוחות)</h2>
<p>כל המלצה היא פריט עם:</p>
<ul><li>שם הלקוח (כותרת)</li><li>החברה / תפקיד</li><li>הציטוט עצמו</li><li>תמונה / לוגו של הלקוח</li><li>דירוג (אם הוגדר)</li></ul>
<h3>הוספת המלצה</h3>
<ol><li>תפריט הצד → <strong>Testimonials</strong> → <strong>Add New</strong>.</li><li>שם הלקוח בכותרת.</li><li>החברה — בשדה "Company" או דומה.</li><li>הציטוט בשדה הראשי.</li><li>תמונה — בשדה "Logo" או "Photo".</li><li><strong>Publish</strong>.</li></ol>
<blockquote><p>💡 <strong>איך מציגים אותם באתר:</strong> בסקשן Testimonials אפשר לבחור "כל ההמלצות" (אוטומטי) או "המלצות נבחרות" (לבחור ידנית). ערכו זאת בסקשן עצמו, לא בפריטי ה-CPT.</p></blockquote>$H$,
    'wordpress', v_cat_wp, 'global', true, 330, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  -- ────────────────────────────────────────────────────────────────────
  -- FORMS (Contact Form 7)
  -- ────────────────────────────────────────────────────────────────────

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('cf7-edit-fields',
    'עריכת שדות בטופס יצירת קשר',
    'איך משנים שדה קיים, מסמנים שדה כחובה, או משנים טקסט תווית.',
    '', $H$<h2>איפה הטפסים?</h2>
<ol><li>תפריט הצד → <strong>Contact</strong> / <strong>טפסים</strong>.</li><li>תראו רשימה של טפסים — בדרך כלל יש "Contact form 1" וייתכן עוד.</li><li>לחצו על שם הטופס שאתם רוצים לערוך.</li></ol>
<h2>מבנה הטופס</h2>
<p>הטופס מורכב משדות שכתובים בקוד פשוט. דוגמה לשדה אימייל חובה:</p>
<pre><code>[email* your-email]</code></pre>
<p>פירוק:</p>
<ul><li><code>[email]</code> = סוג השדה</li><li><code>*</code> = שדה חובה (אם אין * — אופציונלי)</li><li><code>your-email</code> = שם השדה (משתמשים בו במייל הנמען)</li></ul>
<h2>שינוי טקסט תווית</h2>
<p>הטקסט שמופיע מעל השדה כתוב לפני התגית. דוגמה:</p>
<pre><code>שם מלא [text* your-name]</code></pre>
<p>שנו את "שם מלא" לכל טקסט שתרצו.</p>
<h2>הפיכת שדה לחובה / לא חובה</h2>
<p>הוסיפו / הסירו את ה-<code>*</code>:</p>
<ul><li>חובה: <code>[text* your-name]</code></li><li>אופציונלי: <code>[text your-name]</code></li></ul>
<h2>שמירה ובדיקה</h2>
<ol><li>לחצו <strong>Save</strong> בפינה הימנית.</li><li>חיוני לבדוק! גשו לעמוד שבו מופיע הטופס באתר.</li><li>שלחו לעצמכם הודעת בדיקה.</li><li>וודאו שההודעה הגיעה לתיבת המייל.</li></ol>
<blockquote><p>⚠️ <strong>אזהרה:</strong> אל תוסיפו / תשנו סוגי שדות בעצמכם (לדוגמה <code>[file]</code> או <code>[date]</code>) אלא אם אתם בטוחים. שדה לא תקין יכול לשבור את הטופס. אם אתם רוצים שדה חדש — פנו אלינו.</p></blockquote>$H$,
    'forms', v_cat_forms, 'global', true, 400, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('cf7-recipient-email',
    'עדכון כתובת המייל שמקבלת הודעות מהטופס',
    'איך מחליפים את כתובת המייל שאליה הטופס שולח, או מוסיפים מספר נמענים.',
    '', $H$<h2>פתיחת הטופס</h2>
<ol><li>תפריט הצד → <strong>Contact</strong> → לחצו על הטופס.</li><li>למעלה תראו 4 לשוניות: Form, Mail, Messages, Additional Settings.</li><li>לחצו על <strong>Mail</strong>.</li></ol>
<h2>שדות הלשונית Mail</h2>
<h3>To</h3>
<p>כתובת/ות המייל שיקבלו הודעות. זה השדה שתשנו.</p>
<h3>From</h3>
<p>מאיפה ההודעה תיראה כנשלחת. בדרך כלל <code>[your-name] &lt;wordpress@yoursite.com&gt;</code> — לא לגעת.</p>
<h3>Subject</h3>
<p>כותרת המייל. <code>[your-subject]</code> מושך מהשדה בטופס. אפשר לשנות לטקסט קבוע.</p>
<h3>Message Body</h3>
<p>תוכן המייל — אילו שדות יופיעו. כל שדה מטופס מצוטט בסוגריים מרובעים: <code>[your-name]</code>, <code>[your-email]</code>.</p>
<h2>שינוי הנמען</h2>
<ol><li>בשדה <strong>To</strong> מחקו את הקיים.</li><li>הזינו את המייל החדש.</li><li>לחצו <strong>Save</strong>.</li><li>שלחו הודעת בדיקה לוודא.</li></ol>
<h2>הוספת מספר נמענים</h2>
<p>הפרידו עם פסיק:</p>
<pre><code>info@example.co.il, sales@example.co.il</code></pre>
<h2>נמען נסתר (BCC)</h2>
<p>אם רוצים שמישהו יקבל עותק בלי שהכותב יראה — גשו ללשונית <strong>Additional Headers</strong> בתחתית והוסיפו:</p>
<pre><code>Bcc: backup@example.co.il</code></pre>
<blockquote><p>💡 <strong>בדיקה חובה:</strong> אחרי כל שינוי — שלחו עצמכם הודעת בדיקה דרך הטופס. אם לא הגיעה תוך 5 דקות, בדקו spam. אם עדיין לא — פתחו טיקט.</p></blockquote>$H$,
    'forms', v_cat_forms, 'global', true, 410, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('cf7-add-field',
    'הוספת שדה חדש לטופס',
    'איך מוסיפים שדה (טלפון / נושא / הערות) ומוודאים שהוא מגיע במייל.',
    '', $H$<h2>שני שלבים</h2>
<p>הוספת שדה חדש דורשת שני שינויים:</p>
<ol><li>הוספת השדה לטופס עצמו (לשונית <strong>Form</strong>).</li><li>הוספת השדה לתבנית המייל (לשונית <strong>Mail</strong>).</li></ol>
<h2>שלב 1 — הוספה לטופס</h2>
<ol><li>פתחו את הטופס בלשונית <strong>Form</strong>.</li><li>הציבו את הסמן במקום שתרצו את השדה.</li><li>מעל לתיבת הקוד יש כפתורים: text, email, tel, textarea, dropdown וכו'.</li><li>לחצו על סוג השדה הרצוי.</li><li>תיפתח חלונית — הזינו <strong>Name</strong> (אנגלית, ללא רווחים — למשל <code>your-phone</code>).</li><li>סמנו <strong>Required field</strong> אם רלוונטי.</li><li>לחצו <strong>Insert Tag</strong>.</li><li>לפני התגית הוסיפו תווית בעברית. דוגמה:<pre><code>טלפון [tel your-phone]</code></pre></li></ol>
<h2>שלב 2 — הוספה למייל</h2>
<ol><li>עברו ללשונית <strong>Mail</strong>.</li><li>בשדה <strong>Message Body</strong>, הוסיפו שורה:<pre><code>טלפון: [your-phone]</code></pre></li><li>(התווית מצד שמאל היא רק לקריאה ולא חובה — אבל מומלץ).</li></ol>
<h2>שמירה ובדיקה</h2>
<ol><li>לחצו <strong>Save</strong>.</li><li>גשו לעמוד עם הטופס.</li><li>מלאו את כל השדות כולל החדש.</li><li>שלחו ובדקו שההודעה הגיעה עם הנתונים.</li></ol>
<blockquote><p>💡 <strong>סוגי שדות נפוצים:</strong> <code>[text]</code> שורה, <code>[email]</code> מייל, <code>[tel]</code> טלפון, <code>[textarea]</code> טקסט ארוך, <code>[select]</code> רשימה נפתחת, <code>[checkbox]</code> תיבות סימון.</p></blockquote>$H$,
    'forms', v_cat_forms, 'global', true, 420, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('cf7-recaptcha',
    'הגנה על הטופס מפני ספאם — reCAPTCHA',
    'איך מוודאים שהטופס לא מקבל הודעות אוטומטיות מבוטים.',
    '', $H$<h2>למה צריך?</h2>
<p>בלי הגנה, בוטים שולחים מאות הודעות ספאם בכל שבוע. reCAPTCHA של Google מסנן אותם — בלי שמשתמש אמיתי ירגיש משהו.</p>
<h2>איך זה אמור להיות מותקן?</h2>
<p>אם הסטודיו הקים לכם את האתר — reCAPTCHA כבר מוגדר ועובד. נא לא לגעת אלא אם משהו השתבש.</p>
<h2>איך מוודאים שזה עובד?</h2>
<ol><li>גשו לעמוד עם הטופס.</li><li>בפינה הימנית-תחתונה של המסך תראו אייקון reCAPTCHA קטן.</li><li>אם האייקון לא מופיע — ייתכן שהוא לא הוגדר. פתחו טיקט.</li></ol>
<h2>יש פתאום שיטפון של ספאם — מה לעשות?</h2>
<ol><li>בדקו שאייקון ה-reCAPTCHA מופיע בעמוד הטופס.</li><li>בדקו ב-<strong>Contact → Integration</strong> שמפתחות ה-API מוגדרים.</li><li>אם חסר משהו או שזה ממשיך — פתחו טיקט. אנחנו נחדש את המפתחות או נחזק את ההגדרה.</li></ol>
<blockquote><p>⚠️ <strong>אל תיגעו במפתחות API</strong> אלא אם אתם בטוחים מה אתם עושים. החלפת מפתח שגויה תכבה את ה-reCAPTCHA לחלוטין.</p></blockquote>$H$,
    'forms', v_cat_forms, 'global', true, 430, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  -- ────────────────────────────────────────────────────────────────────
  -- SEO (Yoast / RankMath)
  -- ────────────────────────────────────────────────────────────────────

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('seo-title-meta',
    'כותרת SEO ותיאור מטא לכל עמוד',
    'איך כותבים את הטקסט שמופיע בתוצאות החיפוש של Google.',
    '', $H$<h2>למה זה חשוב?</h2>
<p>כשמישהו מחפש בגוגל ורואה את האתר שלכם — הוא רואה שתי שורות עיקריות:</p>
<ol><li><strong>כותרת SEO</strong> (קישור כחול)</li><li><strong>תיאור מטא</strong> (טקסט אפור מתחת)</li></ol>
<p>כותרת ותיאור טובים מגדילים את אחוז ההקלקה (CTR) פי 2-3.</p>
<h2>איפה עורכים?</h2>
<p>בכל עמוד / פוסט / CPT, גללו לתחתית עמוד העריכה. תראו תיבה בשם <strong>Yoast SEO</strong> או <strong>RankMath</strong> (תלוי בתוסף שמותקן).</p>
<p>[צילום מסך: תיבת Yoast עם שדות SEO Title, Meta Description, ותצוגה מקדימה של תוצאת Google]</p>
<h2>כותרת SEO (SEO Title)</h2>
<ul><li>אורך מומלץ: 50-60 תווים</li><li>הכניסו את המילה החיפושית הראשית בהתחלה</li><li>סיימו עם שם המותג: <code>| Ninja Tours</code></li></ul>
<p>דוגמה טובה:</p>
<pre><code>חבילות טיול ליפן 2025 — מודרך ומותאם אישית | Ninja Tours</code></pre>
<h2>תיאור מטא (Meta Description)</h2>
<ul><li>אורך מומלץ: 140-160 תווים</li><li>הסבר מה יקבל המבקר אם ייכנס</li><li>סיימו עם call-to-action קצר ("הזמינו עכשיו", "קראו עוד")</li></ul>
<p>דוגמה טובה:</p>
<pre><code>הוויה אותנטית של תרבות יפן — מסלולים מותאמים, מדריכים מקומיים, חוויות שלא תמצאו במקום אחר. הזמינו ייעוץ חינם.</code></pre>
<h2>תצוגה מקדימה</h2>
<p>Yoast מציג למטה תצוגה כיצד התוצאה תיראה ב-Google. השתמשו בזה לבדוק את האורך והניסוח לפני שמירה.</p>
<h2>שגיאות נפוצות</h2>
<ul><li><strong>כותרת זהה ל-H1</strong> — בעמוד אחד אפשר, אבל בכל אחד טקסט שונה (כי מטרת הכותרת ב-SEO שונה).</li><li><strong>אותו תיאור בכל העמודים</strong> — Google ינכש את העמודים. כל עמוד צריך תיאור ייחודי.</li><li><strong>תיאור קצר מדי</strong> — אם פחות מ-100 תווים, Google ימציא תיאור משלו (בדרך כלל גרוע יותר).</li></ul>$H$,
    'seo', v_cat_seo, 'global', true, 500, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('seo-open-graph',
    'תמונת שיתוף ברשתות חברתיות (Open Graph)',
    'איך מוודאים שלינק לאתר שלכם נראה טוב כשמשתפים אותו ב-WhatsApp / Facebook / LinkedIn.',
    '', $H$<h2>מה זה Open Graph?</h2>
<p>פרוטוקול שמגדיר איזו תמונה, כותרת ותיאור יוצגו כשמישהו מדביק לינק ב-Facebook / WhatsApp / LinkedIn / Slack.</p>
<p>בלי Open Graph — תוצג תמונה אקראית מהעמוד (לפעמים לוגו פיצ'י, לפעמים תמונת ילד טופס).</p>
<h2>איפה מגדירים</h2>
<p>בעמוד עריכה, בתיבת Yoast / RankMath, יש לשונית <strong>Social</strong>:</p>
<ul><li><strong>Facebook</strong> — תמונה + כותרת + תיאור (משתמש גם בלינקדאין וב-WhatsApp)</li><li><strong>Twitter</strong> — נפרד אם רוצים שונה</li></ul>
<h2>תמונת שיתוף — דרישות</h2>
<ul><li>גודל מומלץ: <strong>1200×630 פיקסלים</strong></li><li>פורמט: JPG (קל יותר מ-PNG)</li><li>גודל קובץ: עד 1MB</li><li>הימנעו מטקסט קטן בתמונה — חלק יחתוך</li></ul>
<h2>מה לכתוב בכותרת ובתיאור?</h2>
<p>אפשר להעתיק את ה-SEO Title והתיאור — או לכתוב גרסה מותאמת לסושיאל (יותר מסעירה / מסקרנת).</p>
<h2>בדיקה</h2>
<p>אחרי השמירה, בדקו את הלינק עם הכלי הרשמי של Facebook:</p>
<pre><code>https://developers.facebook.com/tools/debug/</code></pre>
<ol><li>הדביקו את כתובת העמוד.</li><li>לחצו "Debug".</li><li>תראו תצוגה מקדימה כמו שמשתפים בפייסבוק.</li><li>אם משהו ישן — לחצו "Scrape Again".</li></ol>
<blockquote><p>💡 <strong>טיפ:</strong> פייסבוק שומר תוצאות בקאש שעות. אחרי שהעלתם תמונה חדשה — השתמשו ב-Scrape Again כדי שזה יתעדכן מיד בכל מקום.</p></blockquote>$H$,
    'seo', v_cat_seo, 'global', true, 510, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('seo-schema',
    'Schema Markup — איך לעזור לגוגל להבין את האתר',
    'הסבר על נתונים מובנים — מה הם, איך הם משפיעים על תוצאות החיפוש, ואיך לבדוק שיש.',
    '', $H$<h2>מה זה Schema?</h2>
<p>פורמט שמסביר ל-Google "מה" הדברים בעמוד שלכם — לא רק מה הטקסט. דוגמה:</p>
<ul><li>זה מאמר → אופציה לתצוגת AMP / News</li><li>זה מוצר → מחיר, זמינות, דירוג בתוצאות</li><li>זה אטרקציה → שעות פתיחה, מיקום, דירוג</li><li>זה עסק → טלפון, כתובת, שעות (Local SEO)</li></ul>
<p>Schema יכול לתת לכם "Rich Snippets" בתוצאות החיפוש — כוכבי דירוג, מחיר, תמונה.</p>
<h2>איך זה הוגדר אצלכם</h2>
<p>הסטודיו מגדיר Schema אוטומטי לכל פרויקט לפי סוגי התוכן. לדוגמה:</p>
<ul><li>אטרקציות → Schema של TouristAttraction</li><li>מוצרים → Product</li><li>עסק → LocalBusiness בעמוד צור קשר</li></ul>
<h2>איפה רואים מה הוגדר?</h2>
<p>ב-Yoast / RankMath יש לשונית "<strong>Schema</strong>" בתיבת ה-SEO של כל עמוד. שם רואים מה Schema מוגדר.</p>
<h2>בדיקה רשמית של Google</h2>
<ol><li>גשו ל-<code>search.google.com/test/rich-results</code></li><li>הדביקו URL של עמוד.</li><li>לחצו <strong>Test URL</strong>.</li><li>תראו אילו Schema זוהו ואם יש שגיאות.</li></ol>
<blockquote><p>💡 <strong>אל תוסיפו Schema ידנית</strong> — חוסר תיאום עם המבנה הקיים יגרום ל-Google להתעלם מהכל. אם חסר משהו — פתחו טיקט.</p></blockquote>$H$,
    'seo', v_cat_seo, 'global', true, 520, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('seo-image-alt',
    'Alt לתמונות — חשוב לנגישות וגם לגוגל',
    'מה זה Alt Text, איך כותבים אותו טוב, והאם להוסיף בכל תמונה.',
    '', $H$<h2>מה זה Alt Text?</h2>
<p>טקסט חלופי לתמונה. מי משתמש בו:</p>
<ul><li><strong>קוראי מסך</strong> (לעיוורים) — הם "קוראים" את ה-Alt במקום התמונה</li><li><strong>Google Images</strong> — מבין את התמונה לפי ה-Alt</li><li><strong>חיבור איטי</strong> — כשתמונה לא נטענת, ה-Alt מוצג</li></ul>
<h2>איפה מגדירים</h2>
<ol><li>פתחו את ה-<strong>Media Library</strong>.</li><li>לחצו על תמונה.</li><li>תיפתח חלונית פרטים — שדה <strong>Alt Text</strong>.</li><li>הזינו תיאור.</li><li>לחצו על ה-X לסגירה — נשמר אוטומטית.</li></ol>
<p>או — בעת הוספת תמונה לעמוד דרך ACF, לפעמים יש שדה Alt ייעודי בתוך הסקשן.</p>
<h2>איך כותבים Alt טוב</h2>
<h3>✓ טוב</h3>
<ul><li>"מדריך טיולים בקימונו אדום מצביע על הר פוג'י"</li><li>"לוגו של חברת ABC על רקע לבן"</li><li>"שולחן עם ספלי קפה ועוגה"</li></ul>
<h3>✗ לא טוב</h3>
<ul><li>"image123.jpg" (לא תיאור)</li><li>"תמונה של מדריך" (לא ספציפי)</li><li>"הר פוג'י, יפן, טיול, חוויה, הכי טוב, מומלץ" (Keyword stuffing — Google ייעניש)</li></ul>
<h2>לאילו תמונות לא צריך Alt?</h2>
<ul><li>תמונות דקורטיביות (קישוטים, פסיפסים) — השאירו Alt ריק (לא בלי, אלא <code>alt=""</code>).</li><li>תמונות שיש להן כבר תיאור בטקסט הסמוך — אפשר להישאר ריק.</li></ul>
<blockquote><p>📌 <strong>חוק:</strong> אורך 5-15 מילים, מסבירות מה בתמונה. בלי "תמונה של" בהתחלה — Google כבר יודע שזו תמונה.</p></blockquote>$H$,
    'seo', v_cat_seo, 'global', true, 530, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('seo-sitemap-robots',
    'Sitemap.xml ו-Robots.txt — הקבצים שגוגל קוראים',
    'מה הם, איפה הם, ולמה לא לגעת בהם בלי תיאום.',
    '', $H$<h2>Sitemap.xml — מפה לגוגל</h2>
<p>קובץ XML ברשימה של כל העמודים באתר שלכם. Google משתמש בו כדי "לגלות" מה יש לסרוק.</p>
<h3>איפה הוא?</h3>
<p>תמיד באותה כתובת:</p>
<pre><code>https://your-site.co.il/sitemap_index.xml</code></pre>
<p>אם פתחתם והוא ריק או שגיאה 404 — פתחו טיקט.</p>
<h3>איך הוא נוצר?</h3>
<p>אוטומטית על ידי Yoast / RankMath. כל פעם שאתם מוסיפים עמוד / פוסט / מוצר — הוא מתעדכן. אין מה לעשות ידנית.</p>
<h2>Robots.txt — אילו עמודים לא לסרוק</h2>
<p>קובץ טקסט פשוט שאומר ל-Google אילו אזורים בעולם הזה לא לסרוק. למשל לא לסרוק את <code>/wp-admin/</code>.</p>
<h3>איפה?</h3>
<pre><code>https://your-site.co.il/robots.txt</code></pre>
<h3>איך נוצר?</h3>
<p>אוטומטית על ידי WordPress + תוסף ה-SEO. הסטודיו הגדיר את כללי הברירת מחדל — אין מה לגעת.</p>
<h2>הגשה ל-Google Search Console</h2>
<p>פעם אחת בלבד, אחרי עליה לאוויר:</p>
<ol><li>גשו ל-<code>search.google.com/search-console</code></li><li>הוסיפו את האתר שלכם (תהליך אימות).</li><li>בתפריט הצד → <strong>Sitemaps</strong>.</li><li>הזינו: <code>sitemap_index.xml</code></li><li>לחצו <strong>Submit</strong>.</li></ol>
<p>זה אומר ל-Google "בוא תסרוק". מספיק פעם אחת — Google ימשיך לקרוא לעצמו.</p>
<blockquote><p>⚠️ <strong>סימני אזהרה:</strong> אם אתם רואים שגיאות בדוח Coverage של Search Console — פתחו טיקט עם הצילום מסך. לרוב זה תיקון מהיר אצלנו.</p></blockquote>$H$,
    'seo', v_cat_seo, 'global', true, 540, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  raise notice 'Part 2 done — ACF (4) + CPTs (4) + Forms (4) + SEO (5) = 17 guides';
end $$;

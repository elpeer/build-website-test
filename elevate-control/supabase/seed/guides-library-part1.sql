-- ════════════════════════════════════════════════════════════════════════
-- Seed: complete guide library
--
-- Inserts/upserts the full guide catalog for client end-users.
-- Categories used:
--   - wordpress (seeded by 0017)
--   - general   (seeded by 0017) — Elevate Control + tools
--   - clickup   (seeded by 0017)
--   - figma     (seeded by 0017)
--   - woocommerce, polylang, forms, seo — added by THIS seed
-- All guides are published=true, visibility='global' so they appear in
-- every project's training workspace by default. Studio can opt-out
-- per project via the 'hide' override.
-- Re-running this seed updates existing rows by slug (idempotent).
-- ════════════════════════════════════════════════════════════════════════

do $$
declare
  v_user_id uuid;
  v_cat_wp uuid; v_cat_gen uuid; v_cat_woo uuid; v_cat_poly uuid;
  v_cat_forms uuid; v_cat_seo uuid; v_cat_clickup uuid; v_cat_figma uuid;
begin
  select id into v_user_id from public.profiles where studio_admin = true limit 1;
  if v_user_id is null then
    raise exception 'No studio_admin profile found — sign in once first';
  end if;

  -- ── New categories (idempotent) ──────────────────────────────────
  insert into public.guide_categories (slug, label, position) values
    ('woocommerce', 'WooCommerce',  60),
    ('polylang',    'Polylang',     70),
    ('forms',       'טפסים',         80),
    ('seo',         'SEO',          90)
  on conflict (slug) do nothing;

  select id into v_cat_wp      from public.guide_categories where slug = 'wordpress';
  select id into v_cat_gen     from public.guide_categories where slug = 'general';
  select id into v_cat_clickup from public.guide_categories where slug = 'clickup';
  select id into v_cat_figma   from public.guide_categories where slug = 'figma';
  select id into v_cat_woo     from public.guide_categories where slug = 'woocommerce';
  select id into v_cat_poly    from public.guide_categories where slug = 'polylang';
  select id into v_cat_forms   from public.guide_categories where slug = 'forms';
  select id into v_cat_seo     from public.guide_categories where slug = 'seo';

  -- Helper: idempotent upsert is via per-row inserts with ON CONFLICT below.

  -- ────────────────────────────────────────────────────────────────────
  -- WORDPRESS BASICS
  -- ────────────────────────────────────────────────────────────────────

  -- 1. Already exists from guide-wp-first-login.sql; we re-upsert here so
  --    a fresh DB has it without needing to run two files.
  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('first-login-wp',
    'כניסה ראשונה למערכת הניהול של האתר',
    'איך נכנסים בפעם הראשונה למערכת הניהול של האתר שלכם — מה הכתובת, איפה הסיסמה, ומה רואים אחרי הכניסה.',
    '', $H$<h2>למה צריך מערכת ניהול?</h2>
<p>מערכת הניהול (נקראת באנגלית <code>wp-admin</code>) היא הלוח שלכם לעריכת התוכן באתר — מכאן אתם משנים טקסטים, מחליפים תמונות, מוסיפים אטרקציות או מוצרים, ומנהלים את הכל. אין צורך בידע טכני — בדיוק בשביל זה הכנו לכם את המדריך הזה.</p>
<blockquote><p>💡 <strong>טיפ לפני שמתחילים:</strong> שמרו את הכתובת של מערכת הניהול ואת פרטי הגישה במנהל סיסמאות (1Password, Bitwarden, או הסיסמאות של הדפדפן). ככה לא תצטרכו לחפש בכל פעם.</p></blockquote>
<h2>שלב 1 — איך מגיעים למערכת הניהול</h2>
<p>הכתובת של מערכת הניהול היא תמיד הדומיין שלכם בתוספת <code>/wp-admin</code>:</p>
<pre><code>https://your-site.co.il/wp-admin</code></pre>
<p>לדוגמה — אם הדומיין שלכם הוא <code>example.co.il</code>, הכתובת תהיה <code>https://example.co.il/wp-admin</code>.</p>
<h3>מה אם אני לא זוכר/ת את הסיסמה?</h3>
<p>אין מה לדאוג. <mark>שלחנו לכם במייל את פרטי הגישה ביום העברת האתר.</mark> אם המייל אבד, תחפשו "Elevate" בתיבה — או פשוט פנו אלינו דרך לשונית "שירות ותמיכה" באזור הלקוח שלכם, ונשלח שוב.</p>
<h2>שלב 2 — תהליך ההתחברות</h2>
<ol><li>פתחו את הדפדפן (Chrome / Safari / Firefox — לא משנה).</li><li>הקלידו בשורת הכתובת את <code>your-site.co.il/wp-admin</code> (החליפו ב-domain שלכם).</li><li>במסך שייפתח תקבלו שני שדות — <strong>שם משתמש או אימייל</strong>, ו<strong>סיסמה</strong>.</li><li>הזינו את הפרטים שקיבלתם במייל.</li><li>לחצו על הכפתור הכחול "<strong>Log In</strong>" (או "התחברות" אם המסך בעברית).</li></ol>
<p>[צילום מסך: מסך הכניסה של WordPress עם השדות username + password וכפתור Log In]</p>
<h3>סימנתם את "Remember Me"?</h3>
<p>זה אומר שלא תצטרכו להתחבר מחדש בכל פעם — המערכת תזכור אתכם בדפדפן הזה למשך כשבועיים. ממליצים לסמן <strong>רק במחשב פרטי</strong>. במחשב משותף — להשאיר ללא סימון.</p>
<h2>שלב 3 — מה רואים אחרי הכניסה?</h2>
<p>ברגע שתתחברו, תגיעו ללוח הראשי (Dashboard). זה ייראה ככה:</p>
<p>[צילום מסך: לוח wp-admin עם תפריט שחור בצד וווידג'טים במרכז]</p>
<ul><li><strong>תפריט בצד שמאל</strong> — כאן כל האפשרויות שלכם: עמודים, מדיה, אטרקציות, הגדרות וכו'.</li><li><strong>אזור המרכז</strong> — מציג סיכום של מה שקורה באתר.</li><li><strong>סרגל עליון שחור</strong> — קישורים מהירים, פרופיל, יציאה.</li></ul>
<blockquote><p>👋 <strong>חשוב לדעת:</strong> ב-99% מהמקרים אתם תעבדו רק בקטע אחד — "<strong>Pages</strong>" / "עמודים" — כדי לערוך תוכן בעמודים השונים. כל השאר נועד למקרים מיוחדים.</p></blockquote>
<h2>שלב 4 — התנתקות בטוחה</h2>
<p>סיימתם לעבוד? כדאי להתנתק, במיוחד במחשב משותף.</p>
<ol><li>בסרגל העליון השחור, רחפו עם העכבר על השם שלכם בפינה השמאלית.</li><li>תיפתח רשימה — לחצו על "<strong>Log Out</strong>" / "התנתקות".</li></ol>
<hr>
<h2>שכחתם סיסמה?</h2>
<ol><li>במסך הכניסה לחצו על הקישור "<strong>Lost your password?</strong>".</li><li>הזינו את כתובת המייל שלכם.</li><li>תקבלו למייל קישור לאיפוס סיסמה. הוא תקף שעה.</li><li>לחצו על הקישור, בחרו סיסמה חדשה (8+ תווים, רצוי גם מספר וסימן), ותתחברו עם החדשה.</li></ol>
<p>אם הקישור פג תוקף או לא הגיע — פתחו טיקט תמיכה דרך אזור הלקוח שלכם ב-Elevate Control, ונאפס לכם ידנית.</p>$H$,
    'wordpress', v_cat_wp, 'global', true, 10, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  -- 2.
  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('wp-dashboard-tour',
    'סיור בדאשבורד של מערכת הניהול',
    'מה כל פריט בתפריט הצד עושה — איך לדעת איפה לחפש כשאתם רוצים לערוך משהו.',
    '', $H$<h2>הדאשבורד — נקודת המוצא של כל עריכה</h2>
<p>אחרי שאתם נכנסים ל-<code>wp-admin</code>, הדאשבורד הוא העמוד הראשון. זה לא מקום שערכים בו — זה מסך סיכום + נקודת מוצא לכל דבר אחר.</p>
<p>[צילום מסך: דאשבורד של WordPress עם תפריט צד והודעות במרכז]</p>
<h2>תפריט הצד — איך זה מסודר</h2>
<p>כל הפעולות שאתם יכולים לעשות נמצאות בתפריט בצד שמאל. הינה מה שכל פריט עושה:</p>
<h3>📊 Dashboard / לוח בקרה</h3>
<p>סיכום מהיר של מה שקורה באתר. בדרך כלל לא צריך להישאר פה.</p>
<h3>📄 Pages / עמודים</h3>
<p><mark>זה המקום הכי חשוב.</mark> כאן רשומים כל העמודים של האתר — בית, אודות, צור קשר וכו'. תלחצו על כל עמוד כדי לערוך אותו.</p>
<h3>🖼️ Media / מדיה</h3>
<p>הספרייה של כל התמונות והקבצים שעלו לאתר. אפשר לחפש, להוסיף חדשים, ולמחוק.</p>
<h3>📝 Posts / פוסטים</h3>
<p>אם יש לכם בלוג — כאן הפוסטים. אם אין לכם בלוג, אפשר להתעלם.</p>
<h3>💬 Comments / תגובות</h3>
<p>תגובות שכותבים מבקרים על פוסטים בבלוג. ברוב האתרים שלנו זה מבוטל.</p>
<h3>📦 Custom Post Types — לפי הפרויקט שלכם</h3>
<p>פה תראו את ה"סוגי תוכן" המיוחדים של האתר שלכם — אטרקציות, מוצרים, חברי צוות, טסטימוניאלס. כל פרויקט שונה.</p>
<h3>👥 Users / משתמשים</h3>
<p>רשימת המשתמשים שיש להם גישה למערכת הניהול. לרוב הלקוחות לא צריכים להיכנס לכאן.</p>
<h3>⚙️ Settings / הגדרות</h3>
<p><strong>תיזהרו פה.</strong> אלו הגדרות מערכת — כתובת אתר, פורמט תאריכים וכו'. אל תשנו אם אתם לא בטוחים.</p>
<blockquote><p>💡 <strong>חוק האצבע:</strong> אם אתם מגיעים לפעולה ולא בטוחים מה היא עושה — <strong>אל תשמרו</strong>, חזרו עם החץ של הדפדפן, ופנו אלינו דרך טיקט תמיכה.</p></blockquote>
<h2>הסרגל העליון השחור</h2>
<p>הסרגל בראש מקצר לכם דרכים:</p>
<ul><li><strong>שם האתר עם בית</strong> — חוזרים לאתר עצמו לראות איך הוא נראה ללקוחות.</li><li><strong>+ New</strong> — קיצור להוספה מהירה (פוסט, עמוד, משתמש).</li><li><strong>השם שלכם בפינה</strong> — ערוך פרופיל / יציאה.</li></ul>
<h2>איך לחזור לדאשבורד מכל מקום?</h2>
<p>לחצו על הלוגו של WordPress בפינה השמאלית-עליונה, או על "Dashboard" בתפריט.</p>$H$,
    'wordpress', v_cat_wp, 'global', true, 20, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  -- 3.
  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('flexible-content-explained',
    'איך עובד "Flexible Content" — מבנה העמודים באתר שלכם',
    'מערכת הסקשנים הגמישה — איך כל עמוד מורכב מבלוקים שאפשר לסדר, להוסיף ולמחוק.',
    '', $H$<h2>למה האתר שלכם לא נראה כמו "WordPress רגיל"?</h2>
<p>ב-WordPress הסטנדרטי, עמוד הוא קובץ אחד גדול של טקסט. באתר שלכם זה אחרת — אנחנו השתמשנו במערכת שנקראת <strong>Flexible Content</strong>, שמרכיבה כל עמוד מ"בלוקים" עצמאיים.</p>
<p>כל בלוק כזה הוא <strong>סקשן</strong> — Hero, Why Us, אטרקציות, צור קשר וכו'. במקום עמוד אחד ארוך, יש לכם רשימה של סקשנים.</p>
<blockquote><p>🎯 <strong>למה זה טוב לכם:</strong> כל סקשן הוא יחידה עצמאית. אפשר לסדר מחדש (drag), להסתיר זמנית, להעתיק לעמוד אחר, או להחליף תמונה — בלי לשבור שום דבר אחר.</p></blockquote>
<h2>איך זה נראה בפועל?</h2>
<p>כשאתם פותחים עמוד לעריכה, רואים תיבה אחת גדולה שנקראת <strong>Flexible Content</strong>. בתוכה מופיעים שורות — שורה לכל סקשן.</p>
<p>[צילום מסך: עמוד עריכה עם רשימת שורות בתיבת Flexible Content]</p>
<p>כל שורה כזו אפשר:</p>
<ul><li><strong>לפתוח</strong> — לחיצה על השורה פותחת את כל השדות שלה (כותרת, טקסט, תמונה...).</li><li><strong>לסדר מחדש</strong> — לגרור עם העכבר למעלה או למטה.</li><li><strong>להסתיר</strong> — סימון <code>hide_section</code> מסתיר את הסקשן מהאתר בלי למחוק.</li><li><strong>למחוק</strong> — מחיקה סופית, אבל זה לרוב לא נדרש.</li></ul>
<h2>הוספת סקשן חדש</h2>
<ol><li>גללו לסוף תיבת Flexible Content.</li><li>לחצו על הכפתור "<strong>+ Add Row</strong>".</li><li>תיפתח רשימה של כל סוגי הסקשנים האפשריים — Hero, Trips, Testimonials וכו'. כל אחד עם תמונת תצוגה מקדימה.</li><li>לחצו על הסקשן שאתם רוצים — הוא יתווסף לסוף הרשימה.</li><li>פתחו אותו ומלאו את השדות.</li><li>לחצו "<strong>Update</strong>" בפינה השמאלית כדי לשמור.</li></ol>
<h2>אי אפשר לטעות לרעה</h2>
<p><mark>ה"שורות" בתיבת Flexible Content הן רק תוכן — לא קוד.</mark> אפשר להחליף טקסטים, תמונות, ולסדר כמה שתרצו — האתר ימשיך לעבוד. אם משהו נראה לא טוב, אפשר לחזור עם Ctrl+Z או לפנות אלינו.</p>
<h2>השלב הבא</h2>
<p>במדריך הבא נראה איך לפתוח סקשן בודד, להבין את השדות שלו, ולערוך תוכן בפועל.</p>$H$,
    'wordpress', v_cat_wp, 'global', true, 30, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  -- 4.
  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('edit-section',
    'הוספה ועריכה של סקשן בעמוד',
    'איך פותחים סקשן, מבינים את השדות, ושומרים שינויים.',
    '', $H$<h2>פתיחת סקשן לעריכה</h2>
<ol><li>היכנסו ל-<strong>Pages</strong> בתפריט הצד.</li><li>לחצו על העמוד שאתם רוצים לערוך (לדוגמה "דף הבית").</li><li>גללו עד לתיבת <strong>Flexible Content</strong>.</li><li>תראו רשימה של שורות — כל אחת עם שם ומספר. למשל "Home Hero #1".</li><li>לחצו על השורה שאתם רוצים לערוך — היא תיפתח ותציג את כל השדות.</li></ol>
<h2>השדות הסטנדרטיים בכל סקשן</h2>
<p>כל סקשן מתחיל עם 3-4 שדות שזהים בכולם:</p>
<h3>Use General Settings</h3>
<p>תיבת סימון. אם מסומנת — הסקשן מציג תוכן מ"<strong>הגדרות גלובליות</strong>" (אותו תוכן בכל עמוד). אם לא מסומנת — אתם ממלאים תוכן ייחודי לעמוד הזה.</p>
<blockquote><p>💡 <strong>מתי משתמשים בזה?</strong> טופס "צור קשר" שמופיע ב-10 עמודים — הגיוני לסמן ולערוך מקום אחד. במקום סקשן Hero ייחודי לעמוד "אודות" — לא לסמן.</p></blockquote>
<h3>Hide Section</h3>
<p>תיבת סימון. אם מסומנת — הסקשן <strong>לא מוצג</strong> באתר, אבל נשמר במערכת. שימושי כשרוצים להסתיר זמנית בלי למחוק.</p>
<h3>Section ID</h3>
<p>שדה טקסט באנגלית. זה ה"קישור-עוגן" של הסקשן — מאפשר לקפוץ ישירות אליו עם <code>#section-id</code> ב-URL. רק שינו אם אתם מבינים מה אתם עושים.</p>
<h2>השדות התוכניים</h2>
<p>אחרי השדות הסטנדרטיים, מתחיל התוכן עצמו — לפי סוג הסקשן. דוגמאות:</p>
<ul><li><strong>Hero:</strong> כותרת, תת-כותרת, תמונת רקע, כפתור CTA + לינק.</li><li><strong>Why Us:</strong> כותרת, רשימת תכונות (כל אחת עם אייקון + טקסט).</li><li><strong>Trips:</strong> בחירת CPTs להציג, מספר פריטים, סדר.</li><li><strong>Testimonials:</strong> רשימת המלצות (לוגו לקוח + ציטוט + שם).</li></ul>
<p>השדות מסומנים בעברית, וברוב המקרים יש "תיאור" קטן ליד שמסביר.</p>
<h2>שמירת השינויים</h2>
<p>שינוי לא נשמר אוטומטית. אחרי כל עריכה:</p>
<ol><li>גללו לראש העמוד.</li><li>בצד שמאל-עליון יש קופסה כחולה גדולה — "<strong>Update</strong>" / "עדכן".</li><li>לחצו עליה.</li><li>תראו הודעה ירוקה "Page updated" שאומרת שזה נשמר.</li></ol>
<h2>בדיקה אחרי השמירה</h2>
<p>הצד הציבורי של האתר לא מתעדכן באופן מיידי בכל הדפדפנים — לפעמים יש cache.</p>
<ul><li>לחצו "<strong>View Page</strong>" שמופיע אחרי ה-Update.</li><li>אם השינוי לא מופיע — רעננו עם <code>Ctrl+Shift+R</code> (Windows) או <code>Cmd+Shift+R</code> (Mac). זה רענון "קשה" שמתעלם מ-cache.</li></ul>
<blockquote><p>⚠️ <strong>טעיתם?</strong> אין כפתור "ביטול" אחרי שמירה. אבל מתחת לתיבת Update יש "<strong>Revisions</strong>" — היסטוריה של גרסאות. אפשר לחזור לגרסה קודמת בלחיצה.</p></blockquote>$H$,
    'wordpress', v_cat_wp, 'global', true, 40, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  -- 5.
  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('hide-section',
    'הסתרת סקשן בלי למחוק אותו',
    'איך מסתירים סקשן זמנית מהאתר — שימושי לקמפיינים, פעילויות עונתיות או תיקונים.',
    '', $H$<h2>למה לא פשוט למחוק?</h2>
<p>כשאתם מוחקים סקשן, התוכן שלו נעלם. אם תרצו להחזיר אותו בעוד חודש — תצטרכו למלא הכל מחדש.</p>
<p>במקום זה, אפשר פשוט <strong>להסתיר</strong> אותו — הוא נשאר במערכת עם כל התוכן, אבל לא מופיע באתר.</p>
<blockquote><p>🎯 <strong>שימושי במיוחד עבור:</strong> סקשן Black Friday שצריך להופיע רק בתקופת המבצע, סקשן "פעילויות קיץ" שמופיע רק בעונה, באנר הודעת חירום שצריך להפעיל מהר.</p></blockquote>
<h2>איך מסתירים</h2>
<ol><li>היכנסו ל-Pages ופתחו את העמוד.</li><li>גללו לסקשן שאתם רוצים להסתיר.</li><li>לחצו עליו כדי לפתוח אותו.</li><li>למעלה תראו תיבת סימון בשם <strong>Hide Section</strong>.</li><li>סמנו אותה ✓</li><li>לחצו "<strong>Update</strong>" בראש העמוד.</li></ol>
<p>זהו. הסקשן עכשיו מוסתר מהאתר אבל נשאר אצלכם במערכת.</p>
<h2>איך להחזיר</h2>
<p>אותו תהליך הפוך — בטלו את הסימון של <strong>Hide Section</strong> ולחצו Update.</p>
<h2>איך לזהות סקשנים מוסתרים?</h2>
<p>בתיבת Flexible Content, סקשן מוסתר נראה כמו כל השאר. <mark>טיפ: כדי לדעת מה מוסתר, פתחו כל שורה ובדקו את התיבה.</mark> אם זה מבלבל — תעדיפו לתת לשורות שמות ברורים בשדה "כותרת פנימית" אם קיים.</p>$H$,
    'wordpress', v_cat_wp, 'global', true, 50, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  -- 6.
  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('section-anchor',
    'שינוי קישור-עוגן (Section ID) של סקשן',
    'איך מגדירים שלחיצה על פריט בתפריט תקפיץ ישירות לסקשן ספציפי בעמוד.',
    '', $H$<h2>מה זה "קישור-עוגן"?</h2>
<p>זה מנגנון שמאפשר לקפוץ ישירות לסקשן ספציפי בתוך עמוד, באמצעות הוספת <code>#</code> ל-URL.</p>
<p>דוגמה: אם בעמוד הבית יש סקשן "צור קשר" עם anchor של <code>contact</code>, אפשר לתת לאנשים לינק:</p>
<pre><code>https://example.co.il/#contact</code></pre>
<p>הם יגיעו ישירות לסקשן ההוא בלי לגלול.</p>
<h2>איפה להגדיר</h2>
<ol><li>פתחו את העמוד שמכיל את הסקשן.</li><li>פתחו את הסקשן הרצוי.</li><li>בראש השדות יש שדה בשם <strong>Section ID</strong>.</li><li>הכניסו טקסט באנגלית בלי רווחים — למשל <code>contact</code>, <code>services</code>, <code>about-team</code>.</li><li>שמרו עם Update.</li></ol>
<h2>איך משתמשים בזה אחרי שהגדרתם?</h2>
<h3>בתפריט הראשי</h3>
<p>בעת הוספת פריט תפריט, במקום לבחור עמוד אפשר להזין כתובת מלאה עם anchor:</p>
<pre><code>/#contact</code></pre>
<h3>בתוך טקסט בעמוד</h3>
<p>בשדה לינק כלשהו, הכניסו את ה-URL עם anchor:</p>
<pre><code>https://example.co.il/services#pricing</code></pre>
<blockquote><p>💡 <strong>טיפ:</strong> השתמשו רק באותיות באנגלית קטנות, מספרים ומקפים — בלי רווחים, בלי עברית, בלי תווים מיוחדים. <code>about-us</code> ✓ · <code>About Us</code> ✗</p></blockquote>$H$,
    'wordpress', v_cat_wp, 'global', true, 60, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  -- 7.
  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('use-general-settings',
    'הגדרות גלובליות — לערוך פעם אחת, להופיע בכל מקום',
    'איך עובדים עם תוכן משותף שמופיע במספר עמודים — בלי להעתיק ולהדביק.',
    '', $H$<h2>הבעיה שזה פותר</h2>
<p>נניח שיש לכם סקשן "צור קשר" שמופיע ב-5 עמודים. אם תשנו טלפון בעמוד אחד, תצטרכו לזכור לעדכן ב-4 העמודים האחרים. שכחתם — הלקוח רואה טלפון לא נכון.</p>
<p><strong>הפתרון:</strong> תוכן גלובלי שאתם מעדכנים במקום אחד והוא מתעדכן בכל הסקשנים בו-זמנית.</p>
<h2>איך זה עובד טכנית</h2>
<p>בכל סקשן יש תיבה בשם <strong>Use General Settings</strong>:</p>
<ul><li>אם <strong>מסומנת</strong> — הסקשן יציג תוכן מתוך ההגדרות הגלובליות, ולא יציג שדות תוכן נוספים בעמוד.</li><li>אם <strong>לא מסומנת</strong> — הסקשן יציג שדות תוכן ייחודיים לעמוד הזה, ואתם ממלאים אותם בנפרד.</li></ul>
<h2>איפה משנים את ההגדרות הגלובליות?</h2>
<ol><li>בתפריט הצד תמצאו פריט בשם "<strong>Settings</strong>" או "<strong>Site Settings</strong>" או "<strong>Section Defaults</strong>" (השם משתנה לפי הפרויקט).</li><li>תיכנסו ושם תראו את אותם סקשנים — אבל בלי קשר לעמוד מסוים.</li><li>תערכו את התוכן.</li><li>תלחצו <strong>Update</strong>.</li></ol>
<p>כל סקשן בכל עמוד שמסומן ב-Use General Settings יקבל את התוכן החדש.</p>
<h2>מתי כן ומתי לא?</h2>
<h3>✅ כן לסמן Use General Settings:</h3>
<ul><li>סקשן "צור קשר" שזהה ב-5 עמודים</li><li>פוטר עם פרטי קשר ושעות פתיחה</li><li>"Why Us" שמופיע בכל עמודי השירות</li></ul>
<h3>❌ לא לסמן:</h3>
<ul><li>Hero — ייחודי לכל עמוד</li><li>סקשן "אודות" שיש לו תוכן מותאם לעמוד</li><li>סקשנים שבכוונה אמורים להיות שונים</li></ul>
<blockquote><p>⚠️ <strong>שימו לב:</strong> אם תסמנו Use General Settings אחרי שכבר מילאתם תוכן בעמוד הספציפי — התוכן הזה לא נמחק, אבל הוא לא יוצג. תצטרכו לבטל את הסימון אם תרצו לחזור אליו.</p></blockquote>$H$,
    'wordpress', v_cat_wp, 'global', true, 70, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  -- 8.
  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('wp-menus',
    'עריכת תפריט הניווט באתר',
    'איך מוסיפים, מסירים או משנים את הסדר של פריטים בתפריט הראשי או בפוטר.',
    '', $H$<h2>איפה מנהלים תפריטים?</h2>
<ol><li>בתפריט הצד של wp-admin, גללו ל-<strong>Appearance</strong> / <strong>מראה</strong>.</li><li>לחצו על <strong>Menus</strong> / <strong>תפריטים</strong>.</li></ol>
<p>תגיעו למסך ניהול תפריטים. כאן אפשר לערוך את כל התפריטים שיש באתר — תפריט ראשי, פוטר, מובייל וכו'.</p>
<h2>בחירת תפריט לעריכה</h2>
<p>בראש העמוד יש תפריט נפתח "<strong>Select a menu to edit</strong>". בחרו את התפריט הרצוי ולחצו <strong>Select</strong>.</p>
<p>לדוגמה — בדרך כלל יש לכם:</p>
<ul><li><strong>Main Menu</strong> — התפריט בראש האתר</li><li><strong>Footer Menu</strong> — קישורים בפוטר</li><li><strong>Mobile Menu</strong> — לפעמים תפריט נפרד למובייל</li></ul>
<h2>הוספת פריט לתפריט</h2>
<ol><li>בצד שמאל יש פאנל "<strong>Add menu items</strong>".</li><li>תוכלו לבחור: עמודים קיימים, פוסטים, קטגוריות, או "<strong>Custom Links</strong>" (לינק חופשי).</li><li>סמנו את הפריטים שאתם רוצים.</li><li>לחצו "<strong>Add to Menu</strong>".</li><li>הם יופיעו ברשימה בצד ימין.</li></ol>
<h2>סידור מחדש</h2>
<p>גררו פריטים למעלה ולמטה ברשימה כדי לשנות סדר.</p>
<p>כדי להפוך פריט ל"<strong>תת-פריט</strong>" של פריט אחר — גררו אותו ימינה (תזחה תיווצר). זה יוצר תפריט-משנה.</p>
<h2>עריכת פריט</h2>
<p>לחצו על החץ הקטן ליד שם הפריט — תיפתח חלונית עם:</p>
<ul><li><strong>Navigation Label</strong> — הטקסט שמופיע בתפריט (אפשר להיות שונה משם העמוד).</li><li><strong>URL</strong> — הלינק (רק לפריטים מסוג Custom Link).</li></ul>
<h2>הסרת פריט</h2>
<p>בחלונית של הפריט, לחצו "<strong>Remove</strong>". זה לא מוחק את העמוד עצמו — רק מסיר אותו מהתפריט.</p>
<h2>שמירה</h2>
<p>לחצו "<strong>Save Menu</strong>" בפינה השמאלית-עליונה. <mark>זה לא נשמר אוטומטית.</mark></p>
<blockquote><p>💡 <strong>טיפ:</strong> בלשונית "<strong>Custom Links</strong>" אפשר להוסיף קישור-עוגן לסקשן (<code>/#contact</code>) או לינק לאתר חיצוני.</p></blockquote>$H$,
    'wordpress', v_cat_wp, 'global', true, 80, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  -- 9.
  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('wp-media-library',
    'ספריית המדיה — ניהול תמונות וקבצים',
    'איך מעלים תמונות, מחפשים קבצים שכבר קיימים, ומה הגדלים המומלצים.',
    '', $H$<h2>איפה ספריית המדיה?</h2>
<p>בתפריט הצד → <strong>Media</strong> / <strong>מדיה</strong>.</p>
<p>זה אוסף כל התמונות, קבצי PDF, וידאו וכו' שעלו לאתר אי-פעם.</p>
<h2>שתי תצוגות</h2>
<p>בראש העמוד יש שני כפתורים:</p>
<ul><li><strong>תצוגת רשת</strong> (ברירת מחדל) — תמונות בסגנון Pinterest.</li><li><strong>תצוגת רשימה</strong> — טבלה עם פרטים (תאריך, גודל, מימדים).</li></ul>
<h2>העלאת קובץ חדש</h2>
<ol><li>לחצו "<strong>Add New</strong>" / "<strong>הוסף חדש</strong>" בראש העמוד.</li><li>תפתח אזור עם טקסט "Drop files anywhere".</li><li>גררו את הקובץ למסך, או לחצו <strong>Select Files</strong> ובחרו מהמחשב.</li><li>הקובץ יעלה. תראו מד-התקדמות.</li></ol>
<h2>חיפוש קובץ</h2>
<p>שדה החיפוש בראש העמוד מחפש לפי שם. אם שמרתם תמונה כ-<code>banner-summer-2024.jpg</code> — זה יקל למצוא אותה אחר-כך.</p>
<blockquote><p>💡 <strong>טיפ קריטי:</strong> שמרו תמונות עם שמות תיאוריים <strong>לפני</strong> שאתם מעלים: <code>about-team-photo.jpg</code> ולא <code>IMG_2345.jpg</code>. זה יחסוך לכם המון זמן בעתיד וגם טוב ל-SEO.</p></blockquote>
<h2>גדלים מומלצים לתמונות</h2>
<ul><li><strong>תמונות Hero</strong> (רקע לבאנר ראשי): 1920×1080 פיקסלים, JPG, עד 300KB</li><li><strong>תמונות סקשן רגיל</strong>: 1200×800 פיקסלים, JPG, עד 200KB</li><li><strong>תמונות פנים-תוכן</strong>: 800×600 פיקסלים, JPG, עד 150KB</li><li><strong>אייקונים / לוגואים</strong>: SVG אם אפשר, אחרת PNG עם רקע שקוף</li></ul>
<h2>דחיסת תמונות לפני העלאה</h2>
<p>תמונות גדולות מדי מאיטות את האתר. תמיד דחסו לפני שמעלים:</p>
<ul><li><strong>TinyPNG</strong> (חינמי, אונליין): <code>tinypng.com</code></li><li><strong>Squoosh</strong> (חינמי, אונליין): <code>squoosh.app</code></li><li>או דרך Photoshop: <strong>Save for Web</strong></li></ul>
<h2>מחיקת קובץ</h2>
<ol><li>לחצו על הקובץ.</li><li>בפינה הימנית-תחתונה לחצו "<strong>Delete Permanently</strong>".</li></ol>
<p>⚠️ <mark>אם הקובץ בשימוש בעמוד כלשהו, הוא יחסר שם.</mark> בדקו לפני שמוחקים.</p>$H$,
    'wordpress', v_cat_wp, 'global', true, 90, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  -- 10.
  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('wp-users',
    'משתמשים והרשאות במערכת הניהול',
    'מי יכול להיכנס למערכת, מה כל אחד יכול לעשות, ואיך להוסיף עורך חדש.',
    '', $H$<h2>סוגי משתמשים בWordPress</h2>
<p>WordPress יודע 5 רמות הרשאה. אלו הרלוונטיות לכם:</p>
<h3>👑 Administrator / מנהל</h3>
<p>שולט בהכל — תוכן, עיצוב, תוספים, משתמשים. <strong>שמרו על ההרשאה הזו רק לעצמכם.</strong></p>
<h3>✏️ Editor / עורך</h3>
<p>יכול לערוך תוכן, להוסיף עמודים, להעלות תמונות. לא יכול לשנות עיצוב או תוספים. <mark>זו ההרשאה המומלצת לעובדים שמעדכנים תוכן.</mark></p>
<h3>📝 Author / מחבר</h3>
<p>יכול לפרסם פוסטים שלו בלבד. שימושי בבלוג עם כמה כותבים.</p>
<h3>👀 Subscriber / רושם</h3>
<p>רק נכנס וצופה — לא יכול לערוך כלום. בדרך כלל לא נחוץ.</p>
<h2>הוספת משתמש חדש</h2>
<ol><li>תפריט הצד → <strong>Users</strong> → <strong>Add New</strong>.</li><li>הזינו <strong>Username</strong> (חייב להיות אנגלית).</li><li>הזינו <strong>Email</strong> אמיתי — לכאן ישלחו אישור והנחיות.</li><li>שדות שם פרטי / משפחה — אופציונליים אבל מומלצים.</li><li>הגדירו סיסמה (כפתור <strong>Generate Password</strong> ייצור חזקה אוטומטית).</li><li><strong>סמנו "Send User Notification"</strong> — המערכת תשלח להם מייל עם פרטי הכניסה.</li><li>בחרו <strong>Role</strong> מתאים מהרשימה (Editor רוב הזמן).</li><li>לחצו <strong>Add New User</strong>.</li></ol>
<blockquote><p>⚠️ <strong>חשוב:</strong> אל תיתנו הרשאת Administrator ללקוחות, עובדים או ספקים חיצוניים. רק Editor. ככה אם משהו ישתבש — אין סיכון לאתר עצמו.</p></blockquote>
<h2>שינוי הרשאה למשתמש קיים</h2>
<ol><li>תפריט הצד → <strong>Users</strong>.</li><li>לחצו על שם המשתמש.</li><li>גללו ל-<strong>Role</strong>.</li><li>בחרו את ההרשאה החדשה.</li><li>לחצו <strong>Update User</strong> בתחתית.</li></ol>
<h2>מחיקת משתמש</h2>
<ol><li>תפריט הצד → <strong>Users</strong>.</li><li>רחפו על שם המשתמש — תופיע "<strong>Delete</strong>" באדום.</li><li>לחצו עליה.</li><li>תישאל מה לעשות עם התוכן שהוא יצר — אפשר למחוק או להעביר למשתמש אחר.</li></ol>
<h2>איפוס סיסמה למשתמש</h2>
<ol><li>תפריט הצד → <strong>Users</strong>, לחצו על שמו.</li><li>גללו לתחתית ל-<strong>Account Management</strong>.</li><li>לחצו <strong>Set New Password</strong>.</li><li>אפשר להשתמש בכפתור Generate או להזין ידנית.</li><li>סמנו "<strong>Send Password Reset</strong>" אם רוצים שגם המשתמש יקבל הודעה.</li><li>לחצו <strong>Update User</strong>.</li></ol>$H$,
    'wordpress', v_cat_wp, 'global', true, 100, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  -- 11.
  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('wp-backup',
    'גיבוי ידני ושחזור של האתר',
    'איך לוודא שיש לכם גיבוי טרי לפני שעושים שינוי גדול, ואיך לחזור אם משהו השתבש.',
    '', $H$<h2>איזה גיבויים יש כבר?</h2>
<p>הסטודיו מגדיר לכל אתר גיבוי אוטומטי יומי דרך השרת (Cloudways). בנוסף יש לרוב תוסף UpdraftPlus שעושה גיבוי שני.</p>
<p>בדקו עם הסטודיו אם אתם לא בטוחים מה מוגדר אצלכם.</p>
<h2>גיבוי ידני לפני שינוי גדול</h2>
<p>גם אם יש גיבוי יומי — לפני עדכון תוסף או שינוי מבני, כדאי לעשות גיבוי טרי.</p>
<h3>אופציה 1: דרך UpdraftPlus (אם מותקן)</h3>
<ol><li>תפריט הצד → <strong>Settings</strong> → <strong>UpdraftPlus Backups</strong>.</li><li>לחצו על הכפתור הכחול הגדול "<strong>Backup Now</strong>".</li><li>בחלון שייפתח השאירו את כל הסימונים מסומנים.</li><li>לחצו "<strong>Backup Now</strong>".</li><li>חכו עד שהפס הירוק יגיע ל-100%.</li></ol>
<p>הגיבוי יישמר ב-cloud (Google Drive / Dropbox לפי ההגדרה) ובמקביל בשרת.</p>
<h3>אופציה 2: דרך השרת</h3>
<p>אם יש לכם גישה ללוח בקרה של Cloudways/SiteGround — אפשר לעשות snapshot ידני משם. אם לא — בקשו מהסטודיו.</p>
<h2>שחזור גיבוי</h2>
<p><strong>אל תנסו לשחזר לבד אם לא ביצעתם את זה בעבר.</strong> שחזור לא נכון יכול להחמיר את המצב.</p>
<ol><li>פתחו טיקט תמיכה דרך אזור הלקוח שלכם.</li><li>תארו מה השתבש ומתי בערך זה קרה.</li><li>הסטודיו ישחזר מהגיבוי הקרוב ביותר לפני הבעיה.</li></ol>
<blockquote><p>💡 <strong>חוק זהב:</strong> כשיש בעיה — אל תנסו לתקן עוד דברים בתקווה שזה יסתדר. זה בדרך כלל מחמיר. עצרו, צרו טיקט, תנו לסטודיו לשחזר. דקה של סבלנות שווה יום של טעויות.</p></blockquote>$H$,
    'wordpress', v_cat_wp, 'global', true, 110, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  -- 12.
  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('wp-updates',
    'עדכוני ליבת WordPress ותוספים',
    'מתי לעדכן בעצמכם, מתי לפנות לסטודיו, ולמה זה חשוב.',
    '', $H$<h2>למה בכלל לעדכן?</h2>
<p>שני סיבות עיקריות:</p>
<ul><li><strong>אבטחה</strong> — עדכונים סוגרים פרצות שתוקפים יכולים לנצל.</li><li><strong>תאימות</strong> — תוספים חדשים דורשים גרסת WordPress עדכנית.</li></ul>
<h2>הסכנה של עדכון</h2>
<p>עדכון עלול לשבור את האתר אם:</p>
<ul><li>תוסף ישן לא מסתדר עם הגרסה החדשה.</li><li>קוד מותאם אישית מסתמך על פונקציה שהשתנתה.</li></ul>
<p><mark>זאת הסיבה שאנחנו ממליצים לא לעדכן לבד את כל הזמן.</mark> אנחנו עושים בדיקות לפני עדכון משמעותי, ובמידת הצורך מעדכנים בסביבת staging קודם.</p>
<h2>מה כן לעדכן בעצמכם?</h2>
<p>עדכוני אבטחה דקים (minor) של WordPress עצמו או של תוספים — בדרך כלל בטוחים. למשל:</p>
<ul><li>WordPress 6.4.1 → 6.4.2 ✓ (דק - בטוח)</li><li>WordPress 6.4 → 6.5 ⚠️ (גדול - בקשו מאיתנו)</li></ul>
<h2>איך לעדכן</h2>
<ol><li>תפריט הצד → <strong>Dashboard</strong> → <strong>Updates</strong>.</li><li>תראו רשימה: WordPress, Plugins, Themes — מה זמין לעדכון.</li><li>לפני שלוחצים — <strong>עשו גיבוי</strong> (ראו המדריך הקודם).</li><li>סמנו את כל התוספים שרוצים לעדכן.</li><li>לחצו <strong>Update Plugins</strong>.</li><li>חכו עד שיסתיים — לרוב 30 שניות עד דקה.</li></ol>
<h2>אחרי עדכון</h2>
<ol><li>גשו לאתר ועברו על העמודים הראשיים.</li><li>בדקו טופס יצירת קשר (שלחו עצמכם).</li><li>אם משהו לא נראה תקין — פתחו טיקט תמיכה מיידית.</li></ol>
<blockquote><p>🚨 <strong>אם הכל נראה לבן או "There has been a critical error":</strong> אל תיכנסו לפאניקה, אל תנסו עוד עדכונים. פתחו טיקט תמיכה דחוף — אנחנו נחזיר ב-15-30 דקות מהגיבוי האחרון.</p></blockquote>$H$,
    'wordpress', v_cat_wp, 'global', true, 120, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  raise notice 'WordPress basics block done — 12 guides';
end $$;

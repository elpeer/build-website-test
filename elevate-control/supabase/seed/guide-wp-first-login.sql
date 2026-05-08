-- ════════════════════════════════════════════════════════════════════════
-- Sample guide: "כניסה ראשונה למערכת הניהול של האתר שלכם"
--
-- Idempotent: re-running updates the same guide by slug. Categories from
-- migration 0017 must already exist (this seed assumes 'wordpress' slug
-- is present).
-- ════════════════════════════════════════════════════════════════════════

do $$
declare
  v_user_id    uuid;
  v_category_id uuid;
begin
  -- A studio admin to attribute the guide to (any will do)
  select id into v_user_id from public.profiles where studio_admin = true limit 1;
  if v_user_id is null then
    raise exception 'No studio_admin profile found — sign in once first';
  end if;

  select id into v_category_id from public.guide_categories where slug = 'wordpress';
  if v_category_id is null then
    raise exception 'Category "wordpress" missing — apply migration 0017 first';
  end if;

  insert into public.guide_articles (
    slug, title, description,
    content_md, content_html,
    category, category_id, visibility,
    cover_url, video_url,
    published, position, created_by
  ) values (
    'first-login-wp',
    'כניסה ראשונה למערכת הניהול של האתר',
    'איך נכנסים בפעם הראשונה למערכת הניהול של האתר שלכם — מה הכתובת, איפה הסיסמה, ומה רואים אחרי הכניסה.',
    '',
    $html$
<h2>למה צריך מערכת ניהול?</h2>
<p>
  מערכת הניהול (נקראת באנגלית <code>wp-admin</code>) היא הלוח שלכם לעריכת התוכן באתר —
  מכאן אתם משנים טקסטים, מחליפים תמונות, מוסיפים אטרקציות או מוצרים, ומנהלים את הכל.
  אין צורך בידע טכני — בדיוק בשביל זה הכנו לכם את המדריך הזה.
</p>

<blockquote>
  <p>
    💡 <strong>טיפ לפני שמתחילים:</strong> שמרו את הכתובת של מערכת הניהול ואת פרטי הגישה
    במנהל סיסמאות (1Password, Bitwarden, או הסיסמאות של הדפדפן). ככה לא תצטרכו לחפש בכל פעם.
  </p>
</blockquote>

<h2>שלב 1 — איך מגיעים למערכת הניהול</h2>

<p>הכתובת של מערכת הניהול היא תמיד הדומיין שלכם בתוספת <code>/wp-admin</code>:</p>

<pre><code>https://your-site.co.il/wp-admin</code></pre>

<p>
  לדוגמה — אם הדומיין שלכם הוא <code>example.co.il</code>, הכתובת תהיה
  <code>https://example.co.il/wp-admin</code>.
</p>

<h3>מה אם אני לא זוכר/ת את הסיסמה?</h3>

<p>
  אין מה לדאוג. <mark>שלחנו לכם במייל את פרטי הגישה ביום העברת האתר.</mark>
  אם המייל אבד, תחפשו "Elevate" בתיבה — או פשוט פנו אלינו דרך לשונית
  "שירות ותמיכה" באזור הלקוח שלכם, ונשלח שוב.
</p>

<h2>שלב 2 — תהליך ההתחברות</h2>

<ol>
  <li>פתחו את הדפדפן (Chrome / Safari / Firefox — לא משנה).</li>
  <li>הקלידו בשורת הכתובת את <code>your-site.co.il/wp-admin</code> (החליפו ב-domain שלכם).</li>
  <li>במסך שייפתח תקבלו שני שדות — <strong>שם משתמש או אימייל</strong>, ו<strong>סיסמה</strong>.</li>
  <li>הזינו את הפרטים שקיבלתם במייל.</li>
  <li>לחצו על הכפתור הכחול "<strong>Log In</strong>" (או "התחברות" אם המסך בעברית).</li>
</ol>

<p>
  [צילום מסך: מסך הכניסה של WordPress עם השדות username + password וכפתור Log In]
</p>

<h3>סימנתם את "Remember Me"?</h3>

<p>
  זה אומר שלא תצטרכו להתחבר מחדש בכל פעם — המערכת תזכור אתכם בדפדפן הזה למשך כשבועיים.
  ממליצים לסמן <strong>רק במחשב פרטי</strong>. במחשב משותף — להשאיר ללא סימון.
</p>

<h2>שלב 3 — מה רואים אחרי הכניסה?</h2>

<p>
  ברגע שתתחברו, תגיעו ללוח הראשי (Dashboard). זה ייראה ככה:
</p>

<p>
  [צילום מסך: לוח wp-admin עם תפריט שחור בצד וווידג'טים במרכז]
</p>

<ul>
  <li><strong>תפריט בצד שמאל</strong> — כאן כל האפשרויות שלכם: עמודים, מדיה, אטרקציות, הגדרות וכו'.</li>
  <li><strong>אזור המרכז</strong> — מציג סיכום של מה שקורה באתר.</li>
  <li><strong>סרגל עליון שחור</strong> — קישורים מהירים, פרופיל, יציאה.</li>
</ul>

<blockquote>
  <p>
    👋 <strong>חשוב לדעת:</strong> ב-99% מהמקרים אתם תעבדו רק בקטע אחד —
    "<strong>Pages</strong>" / "עמודים" — כדי לערוך תוכן בעמודים השונים. כל השאר
    נועד למקרים מיוחדים.
  </p>
</blockquote>

<h2>שלב 4 — התנתקות בטוחה</h2>

<p>סיימתם לעבוד? כדאי להתנתק, במיוחד במחשב משותף. ככה עושים את זה:</p>

<ol>
  <li>בסרגל העליון השחור, רחפו עם העכבר על השם שלכם בפינה השמאלית.</li>
  <li>תיפתח רשימה — לחצו על "<strong>Log Out</strong>" / "התנתקות".</li>
</ol>

<hr>

<h2>שכחתם סיסמה?</h2>

<ol>
  <li>במסך הכניסה לחצו על הקישור "<strong>Lost your password?</strong>".</li>
  <li>הזינו את כתובת המייל שלכם.</li>
  <li>תקבלו למייל קישור לאיפוס סיסמה. הוא תקף שעה.</li>
  <li>לחצו על הקישור, בחרו סיסמה חדשה (8+ תווים, רצוי גם מספר וסימן), ותתחברו עם החדשה.</li>
</ol>

<p>
  אם הקישור פג תוקף או לא הגיע — פתחו טיקט תמיכה דרך אזור הלקוח שלכם ב-Elevate Control,
  ונאפס לכם ידנית.
</p>

<hr>

<h2>מה הלאה?</h2>

<p>
  עכשיו שאתם בפנים — המדריך הבא הוא <strong>"סיור בדאשבורד של wp-admin"</strong> שיראה לכם
  על מה כל פריט בתפריט הצד אחראי. נמשיך משם.
</p>
$html$,
    'wordpress',  -- legacy text column (kept for backward compat)
    v_category_id,
    'global',
    null,
    null,
    true,
    10,
    v_user_id
  )
  on conflict (slug) do update set
    title         = excluded.title,
    description   = excluded.description,
    content_html  = excluded.content_html,
    category_id   = excluded.category_id,
    visibility    = excluded.visibility,
    published     = excluded.published,
    position      = excluded.position,
    updated_at    = now();

  raise notice 'Guide first-login-wp upserted.';
end $$;

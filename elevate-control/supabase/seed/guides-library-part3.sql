-- ════════════════════════════════════════════════════════════════════════
-- Guide library — part 3: WooCommerce, Polylang, Elevate Control, Tools
-- Run after part1.sql and part2.sql.
-- ════════════════════════════════════════════════════════════════════════

do $$
declare
  v_user_id uuid;
  v_cat_woo uuid; v_cat_poly uuid; v_cat_gen uuid;
  v_cat_clickup uuid; v_cat_figma uuid;
begin
  select id into v_user_id from public.profiles where studio_admin = true limit 1;
  if v_user_id is null then raise exception 'No studio_admin profile found'; end if;

  select id into v_cat_woo     from public.guide_categories where slug = 'woocommerce';
  select id into v_cat_poly    from public.guide_categories where slug = 'polylang';
  select id into v_cat_gen     from public.guide_categories where slug = 'general';
  select id into v_cat_clickup from public.guide_categories where slug = 'clickup';
  select id into v_cat_figma   from public.guide_categories where slug = 'figma';

  -- ────────────────────────────────────────────────────────────────────
  -- WOOCOMMERCE
  -- ────────────────────────────────────────────────────────────────────

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('woo-add-simple-product',
    'הוספת מוצר פשוט לחנות',
    'איך מוסיפים מוצר רגיל — בלי וריאציות, רק מחיר ותיאור.',
    '', $H$<h2>פתיחת מוצר חדש</h2>
<ol><li>תפריט הצד → <strong>Products</strong> → <strong>Add New</strong>.</li><li>תיפתח עמוד דומה לעריכת עמוד WordPress.</li></ol>
<h2>השדות החיוניים</h2>
<h3>שם המוצר (Title)</h3>
<p>הכותרת בראש העמוד. מומלץ קצר וברור: "כיסא משרדי ארגונומי" ולא "הכיסא הכי טוב לעבודה".</p>
<h3>תיאור ארוך (Long Description)</h3>
<p>אזור התוכן הגדול. כתבו פירוט מלא — תכונות, חומרים, סיפור המוצר. זה מה שמופיע בלשונית "Description" בעמוד המוצר.</p>
<h3>תיאור קצר (Short Description)</h3>
<p>גללו למטה — תיבה נפרדת. 2-3 משפטים מסכמים שמופיעים ליד תמונת המוצר.</p>
<h2>נתוני המוצר (Product Data)</h2>
<p>תיבה מתחת לתוכן. בלשונית <strong>General</strong>:</p>
<ul><li><strong>Regular Price</strong> — המחיר הרגיל (₪).</li><li><strong>Sale Price</strong> — מחיר במבצע (אם רלוונטי). אפשר גם לקבוע תאריכים.</li></ul>
<p>בלשונית <strong>Inventory</strong>:</p>
<ul><li><strong>SKU</strong> — מק"ט פנימי (אופציונלי).</li><li><strong>Manage stock?</strong> — סמנו אם רוצים מעקב מלאי.</li><li><strong>Stock quantity</strong> — כמה במלאי.</li></ul>
<p>בלשונית <strong>Shipping</strong>:</p>
<ul><li><strong>Weight, Dimensions</strong> — חשוב לחישוב משלוח אם משתמשים בכך.</li></ul>
<h2>תמונות</h2>
<ul><li><strong>Product Image</strong> בצד ימין — התמונה הראשית (מופיעה בכרטיסיות).</li><li><strong>Product Gallery</strong> מתחת — תמונות נוספות (מקסימום 5-7 מומלץ).</li></ul>
<h2>קטגוריות ותגיות</h2>
<p>בצד ימין — בחרו <strong>Product Categories</strong> (אם אין הרצויה — לחצו "Add new").</p>
<h2>פרסום</h2>
<ol><li>לחצו <strong>Preview</strong> כדי לוודא שזה נראה טוב.</li><li>לחצו <strong>Publish</strong>.</li></ol>
<blockquote><p>💡 <strong>טיפ:</strong> עד שאתם בטוחים — שמרו כ-<strong>Draft</strong>. אפשר לעבוד יום-יומיים בלי שזה מופיע ללקוחות.</p></blockquote>$H$,
    'woocommerce', v_cat_woo, 'global', true, 600, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('woo-variable-product',
    'מוצר משתנה (וריאציות) — מידות, צבעים, גדלים',
    'איך מוסיפים מוצר עם בחירות — חולצה ב-3 גדלים, 4 צבעים וכו׳.',
    '', $H$<h2>הקדמה</h2>
<p>וריאציות מאפשרות מוצר אחד עם מספר אפשרויות — לקוח בוחר ואז קונה. דוגמאות: חולצה (S/M/L), כיסא (5 צבעים), חבילה (טיסה / מלון בלבד / שניהם).</p>
<h2>שלב 1 — Attributes (תכונות)</h2>
<p>לפני יצירת המוצר, מומלץ להגדיר תכונות גלובליות (כדי שיהיו זמינות לכל המוצרים):</p>
<ol><li>תפריט הצד → <strong>Products</strong> → <strong>Attributes</strong>.</li><li>הוסיפו <strong>Name</strong> (למשל "צבע") ו-<strong>Slug</strong> (color).</li><li>שמרו.</li><li>לחצו <strong>Configure terms</strong> ליד התכונה ב-טבלה.</li><li>הוסיפו ערכים: אדום, כחול, ירוק וכו'.</li></ol>
<h2>שלב 2 — צרו מוצר חדש</h2>
<ol><li>תפריט → <strong>Products</strong> → <strong>Add New</strong>.</li><li>מלאו פרטים בסיסיים (שם, תיאור, תמונה).</li><li>בתיבת <strong>Product data</strong>, בחלק העליון — שנו מ-"Simple product" ל-<strong>"Variable product"</strong>.</li></ol>
<h2>שלב 3 — Attributes ב-מוצר</h2>
<ol><li>בתיבת Product data → לשונית <strong>Attributes</strong>.</li><li>בחרו תכונה מהרשימה (למשל "צבע") ולחצו <strong>Add</strong>.</li><li>סמנו <strong>Used for variations</strong>.</li><li>בחרו ערכים ספציפיים למוצר הזה (למשל רק אדום+כחול אם זה מה שיש).</li><li>חזרו על זה לכל תכונה (למשל גם "מידה").</li><li>לחצו <strong>Save attributes</strong>.</li></ol>
<h2>שלב 4 — Variations (וריאציות בפועל)</h2>
<ol><li>עברו ללשונית <strong>Variations</strong>.</li><li>בחרו "<strong>Create variations from all attributes</strong>" → <strong>Go</strong>.</li><li>WooCommerce ייצור אוטומטית את כל הצירופים (אדום-S, אדום-M, כחול-S וכו').</li><li>לחצו על כל וריאציה והגדירו לה מחיר, מלאי, תמונה.</li><li>לחצו <strong>Save changes</strong>.</li></ol>
<h2>שלב 5 — פרסום</h2>
<p>לחצו <strong>Publish</strong> בעמוד המוצר.</p>
<blockquote><p>⚠️ <strong>חשוב:</strong> כל וריאציה חייבת מחיר אחרת היא לא תוצג ללקוח. אם הלקוחות לא יכולים לבחור — בדקו שכל וריאציה קיבלה מחיר.</p></blockquote>$H$,
    'woocommerce', v_cat_woo, 'global', true, 610, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('woo-inventory',
    'ניהול מלאי במוצרים',
    'איך לסמן "אזל מהמלאי", לעדכן כמויות, ולהוסיף הודעת התרעה כשנגמר.',
    '', $H$<h2>הפעלת מעקב מלאי</h2>
<p>מעקב מלאי הוא אופציונלי. אם אתם מוכרים שירות / מוצר דיגיטלי — אין צורך. אם פיזי עם כמות מוגבלת — כן.</p>
<h3>הפעלה גלובלית</h3>
<ol><li>תפריט → <strong>WooCommerce</strong> → <strong>Settings</strong> → לשונית <strong>Products</strong> → תת-לשונית <strong>Inventory</strong>.</li><li>סמנו <strong>Enable stock management</strong>.</li><li>הגדירו <strong>Hold stock (minutes)</strong> — כמה זמן להחזיק מלאי בעגלה לפני שחרור (60 ברירת מחדל).</li><li>שמרו.</li></ol>
<h3>הפעלה ספציפית למוצר</h3>
<ol><li>פתחו את המוצר.</li><li>לשונית <strong>Inventory</strong> בתיבת Product data.</li><li>סמנו <strong>Manage stock?</strong>.</li><li><strong>Stock quantity</strong> — כמה יחידות יש.</li><li><strong>Allow backorders</strong> — האם להרשות הזמנה גם כשאזל (No / Allow / Allow but notify).</li><li><strong>Low stock threshold</strong> — מתי להתריע (לדוגמה 5).</li></ol>
<h2>סטטוס מלאי</h2>
<p>אם אתם לא רוצים מעקב כמותי אלא רק "במלאי / אזל" — אל תסמנו Manage stock אבל בחרו ידנית ב-<strong>Stock status</strong>:</p>
<ul><li>In stock</li><li>Out of stock</li><li>On backorder</li></ul>
<h2>עדכון מלאי אחרי הזמנה</h2>
<p>אם Manage stock מסומן — המערכת תעדכן אוטומטית. הזמנה הופחתה → מלאי יורד.</p>
<h2>צפייה במוצרים שאזלו</h2>
<ol><li>תפריט → <strong>Products</strong>.</li><li>פילטר <strong>Filter by stock status</strong> → "Out of stock".</li></ol>
<blockquote><p>💡 <strong>התראה אוטומטית:</strong> WooCommerce שולח מייל לאדמין כשמוצר מגיע ל-Low stock threshold. ודאו ב-Settings → Email שהמייל פעיל.</p></blockquote>$H$,
    'woocommerce', v_cat_woo, 'global', true, 620, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('woo-orders',
    'ניהול הזמנות — מה לעשות אחרי שהלקוח קונה',
    'איך לראות הזמנה חדשה, לעדכן סטטוס, להוסיף הערה, ולתת החזר.',
    '', $H$<h2>איפה רואים הזמנות?</h2>
<p>תפריט הצד → <strong>WooCommerce</strong> → <strong>Orders</strong>.</p>
<h2>סטטוסים של הזמנה</h2>
<ul><li><strong>Pending payment</strong> — הוזמן אבל לא שולם עדיין</li><li><strong>Processing</strong> — שולם, מוכן להכנה / משלוח</li><li><strong>On hold</strong> — ממתין לאישור ידני</li><li><strong>Completed</strong> — נשלח / סופק. <mark>זה הסטטוס הסופי הנפוץ.</mark></li><li><strong>Cancelled</strong> — בוטל</li><li><strong>Refunded</strong> — הוחזר כסף</li><li><strong>Failed</strong> — תשלום נכשל</li></ul>
<h2>פתיחת הזמנה</h2>
<ol><li>ברשימת ההזמנות לחצו על מספר ההזמנה.</li><li>תראו: פרטי לקוח, פריטים, מחיר, אמצעי תשלום, כתובת משלוח.</li></ol>
<h2>שינוי סטטוס</h2>
<ol><li>בעמוד ההזמנה — בצד ימין יש תיבת <strong>Status</strong>.</li><li>בחרו את הסטטוס החדש.</li><li>לחצו <strong>Update</strong> בראש העמוד.</li></ol>
<h2>הוספת הערה</h2>
<p>בתיבת <strong>Order notes</strong>:</p>
<ul><li><strong>Private note</strong> — רק לכם (תיעוד פנימי).</li><li><strong>Note to customer</strong> — נשלח במייל ללקוח.</li></ul>
<p>שימוש לדוגמה: "ההזמנה נשלחה ב-FedEx, מספר מעקב: 123456".</p>
<h2>החזר כספי (Refund)</h2>
<ol><li>בעמוד ההזמנה לחצו <strong>Refund</strong> מתחת לרשימת המוצרים.</li><li>הזינו <strong>Refund amount</strong>.</li><li>בחרו: <strong>Refund manually</strong> או <strong>Refund via gateway</strong> (אם השער תומך).</li><li>הוסיפו סיבה (אופציונלי).</li><li>לחצו <strong>Refund</strong>.</li></ol>
<blockquote><p>⚠️ <strong>החזר ב-Refund manually</strong> רק מסמן ב-WooCommerce שהוחזר — לא מחזיר כסף בפועל. החזר אמיתי דרך השער (טרנזילה / Stripe) שיכול להיות אוטומטי או ידני.</p></blockquote>$H$,
    'woocommerce', v_cat_woo, 'global', true, 630, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('woo-shipping',
    'הגדרות משלוח',
    'איך מגדירים אזורי משלוח שונים עם מחירים שונים — וכמה זה עולה לאיזה לקוח.',
    '', $H$<h2>המבנה — Shipping Zones</h2>
<p>WooCommerce מגדיר משלוח לפי "אזורים". כל אזור הוא רשימת מדינות / אזורים, וכל אזור מקבל שיטות משלוח עם מחירים.</p>
<h2>איפה מגדירים</h2>
<p>תפריט → <strong>WooCommerce</strong> → <strong>Settings</strong> → לשונית <strong>Shipping</strong>.</p>
<h2>הוספת אזור</h2>
<ol><li>לחצו <strong>Add shipping zone</strong>.</li><li><strong>Zone name</strong> — שם פנימי (למשל "ישראל - מרכז").</li><li><strong>Zone regions</strong> — מדינה / אזור / מיקוד. אפשר לבחור Israel ולקבוע מיקודים ספציפיים.</li><li>לחצו <strong>Add shipping method</strong>.</li><li>בחרו שיטה: <strong>Flat rate</strong> (סכום קבוע) / <strong>Free shipping</strong> (חינם, אולי על תנאי) / <strong>Local pickup</strong> (איסוף עצמי).</li></ol>
<h2>הגדרת Flat rate</h2>
<ol><li>לחצו על השיטה → <strong>Edit</strong>.</li><li><strong>Method title</strong> — מה הלקוח רואה בעת קופה ("משלוח רגיל").</li><li><strong>Cost</strong> — סכום בש"ח (לדוגמה 30).</li><li>שמרו.</li></ol>
<h2>משלוח חינם מעל סכום</h2>
<ol><li>הוסיפו שיטה <strong>Free shipping</strong>.</li><li>בעריכה: <strong>Free shipping requires</strong> → "A minimum order amount".</li><li><strong>Minimum order amount</strong> — לדוגמה 250 (₪).</li></ol>
<h2>אזור Default — לאזורים שלא הוגדרו</h2>
<p>בתחתית רשימת האזורים יש "<strong>Locations not covered by your other zones</strong>". זה מה שיוצג ללקוחות מאזורים שלא רשמתם. אפשר להגדיר תעריף יקר במיוחד או להשאיר ריק (אז משלוח לא יוצג והם לא יוכלו לקנות).</p>
<blockquote><p>💡 <strong>בדיקה:</strong> אחרי שינוי, גשו לאתר כלקוח, הוסיפו מוצר לעגלה, וגשו ל-Cart. ודאו שעלות המשלוח מופיעה לפי הצפי.</p></blockquote>$H$,
    'woocommerce', v_cat_woo, 'global', true, 640, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('woo-payments',
    'הגדרות תשלום — טרנזילה / PayPlus / Cardcom',
    'איך מחברים שערי תשלום ישראלים, ומה לעשות אם הזמנה לא עברה.',
    '', $H$<h2>שערי תשלום נתמכים</h2>
<p>בישראל הנפוצים:</p>
<ul><li><strong>Tranzila</strong> — הוותיק והיציב</li><li><strong>PayPlus</strong> — UI נחמד יותר, תמיכה טובה</li><li><strong>Cardcom</strong> — אופציה נוספת</li><li><strong>Stripe / PayPal</strong> — אם אתם מוכרים גם לחו"ל</li></ul>
<h2>איפה מגדירים</h2>
<p>תפריט → <strong>WooCommerce</strong> → <strong>Settings</strong> → לשונית <strong>Payments</strong>.</p>
<h2>אילו שערים מותקנים?</h2>
<p>השערים הישראלים דורשים תוסף נפרד. הסטודיו התקין אצלכם את התוסף המתאים בעת ההקמה. בלשונית Payments תראו את השער (לדוגמה "Tranzila") ברשימה.</p>
<h2>הגדרת מפתחות API</h2>
<p>כל שער דורש פרטי גישה מהחשבון שלכם אצלם:</p>
<ol><li>בלשונית Payments, לחצו <strong>Manage</strong> ליד השער הרצוי.</li><li>הזינו את הפרטים שקיבלתם בעת רישום (Terminal Number, Username, API Key — תלוי בשער).</li><li>סמנו <strong>Enable</strong>.</li><li>שמרו.</li></ol>
<blockquote><p>⚠️ <strong>זהירות עם המפתחות:</strong> אם הם שגויים, תשלומים לא יעברו. תמיד עשו תשלום בדיקה (₪1) אחרי שינוי לפני שזה עולה לאוויר.</p></blockquote>
<h2>בדיקה לפני שעולים</h2>
<p>רוב השערים תומכים ב-<strong>Test Mode / מצב בדיקה</strong>:</p>
<ol><li>הפעילו את ה-Test Mode בהגדרות השער.</li><li>גשו לאתר ובצעו הזמנה אמיתית עם הכרטיס שלכם.</li><li>בדקו שהתשלום עובר ב-WooCommerce ובחשבון השער.</li><li>כבו Test Mode רק כשהכל עבד.</li></ol>
<h2>הזמנה לא עוברה — מה לעשות?</h2>
<ol><li>בדקו את ההזמנה ב-WooCommerce → Orders.</li><li>תראו את הסטטוס (Pending / Failed) ובהערות הפרטים.</li><li>אם זה "Failed" — הסיבה מצוינת לעיתים בהערות.</li><li>בקרו בלוח הבקרה של השער (Tranzila / PayPlus) ותחפשו את העסקה.</li><li>אם לא ברור — פתחו טיקט אצלנו עם מספר ההזמנה.</li></ol>$H$,
    'woocommerce', v_cat_woo, 'global', true, 650, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('woo-coupons',
    'קופונים והנחות',
    'איך מגדירים קוד הנחה, אחוזים או סכום קבוע, ומגבילים שימוש.',
    '', $H$<h2>איפה מנהלים</h2>
<p>תפריט → <strong>Marketing</strong> → <strong>Coupons</strong>.</p>
<p>(אם לא מופיע — תפריט → <strong>WooCommerce</strong> → <strong>Coupons</strong>.)</p>
<h2>יצירת קופון חדש</h2>
<ol><li>לחצו <strong>Add coupon</strong>.</li><li><strong>Coupon code</strong> — הקוד שהלקוח יזין (לדוגמה <code>SUMMER25</code>). אנגלית, ללא רווחים.</li><li><strong>Description</strong> — תיאור פנימי לכם (אופציונלי).</li></ol>
<h2>לשונית General — הגדרות עיקריות</h2>
<ul><li><strong>Discount type</strong>: Percentage discount (אחוזים), Fixed cart discount (סכום קבוע מהעגלה), Fixed product discount (סכום קבוע למוצר).</li><li><strong>Coupon amount</strong> — הערך (לדוגמה 25 לאחוזים = 25%).</li><li><strong>Allow free shipping</strong> — אם לסמן, גם המשלוח חינם.</li><li><strong>Coupon expiry date</strong> — תאריך תפוגה.</li></ul>
<h2>לשונית Usage restriction</h2>
<ul><li><strong>Minimum spend</strong> — מינימום סכום עגלה כדי שהקופון יעבוד.</li><li><strong>Individual use only</strong> — סמנו אם הקופון לא ניתן לשילוב עם אחרים.</li><li><strong>Exclude sale items</strong> — לא לחול על מוצרים שכבר במבצע.</li><li><strong>Products / Categories</strong> — להגביל מוצרים ספציפיים.</li><li><strong>Email restrictions</strong> — להגביל למיילים ספציפיים.</li></ul>
<h2>לשונית Usage limits</h2>
<ul><li><strong>Usage limit per coupon</strong> — סך השימושים (לדוגמה 100 פעם וזהו).</li><li><strong>Usage limit per user</strong> — כמה פעמים אדם אחד יכול להשתמש (1 = פעם אחת).</li></ul>
<h2>פרסום</h2>
<ol><li>לחצו <strong>Publish</strong>.</li><li>הקופון פעיל מיד.</li><li>פרסמו את הקוד ללקוחות.</li></ol>
<blockquote><p>💡 <strong>בדיקה לפני פרסום:</strong> נסו את הקוד עצמכם בעגלה — חשוב לוודא שזה מחשב נכון לפני שאלפי לקוחות מנסים.</p></blockquote>$H$,
    'woocommerce', v_cat_woo, 'global', true, 660, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  -- ────────────────────────────────────────────────────────────────────
  -- POLYLANG (multi-language)
  -- ────────────────────────────────────────────────────────────────────

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('polylang-translate-page',
    'הוספת תרגום לעמוד באנגלית / שפה נוספת',
    'איך יוצרים גרסה של עמוד בשפה אחרת ומסנכרנים את התוכן.',
    '', $H$<h2>הקדמה</h2>
<p>אם האתר שלכם רב-לשוני (מותקן Polylang), כל עמוד יכול להיות בכמה שפות. כל גרסה היא עמוד נפרד ב-WordPress, אבל מקושר לשאר.</p>
<h2>פתיחת תרגום</h2>
<ol><li>פתחו את העמוד בעברית (השפה המקורית).</li><li>בצד ימין תראו תיבה <strong>Languages</strong>.</li><li>תחת השפה השנייה (אנגלית) יש סמל "+" עגול — לחצו עליו.</li><li>תיפתח גרסה חדשה ריקה לעריכה באנגלית.</li></ol>
<h2>תרגום התוכן</h2>
<ol><li>הזינו <strong>Title</strong> באנגלית.</li><li>גללו לתיבת Flexible Content — תראו את אותם סקשנים כמו בעברית, אבל ריקים.</li><li>פתחו כל סקשן ותרגמו את התוכן.</li><li>תמונות אפשר להשאיר זהות (לחצו על התמונה ובחרו את אותה תמונה מהמדיה).</li></ol>
<h2>סנכרון אוטומטי של תמונות</h2>
<p>ב-Polylang יש הגדרה שמסנכרנת תמונות אוטומטית בין שפות:</p>
<ol><li>תפריט → <strong>Languages</strong> → <strong>Settings</strong>.</li><li>לשונית <strong>Synchronization</strong>.</li><li>סמנו "Featured image", "Page parent", "Page template", "Custom fields".</li><li>שמרו.</li></ol>
<p>עכשיו אם אתם מחליפים תמונה ראשית בעברית — היא מתעדכנת אוטומטית באנגלית.</p>
<h2>פרסום</h2>
<p>לחצו <strong>Publish</strong> בעמוד החדש. הוא יופיע באתר תחת ה-URL הנכון (למשל <code>/en/about</code>).</p>
<h2>קישור בין גרסאות</h2>
<p>אם הגרסאות לא מקושרות אוטומטית — בעמוד עריכה, תיבת Languages, תוכלו לבחור איזה עמוד הוא "התרגום של" איזה.</p>
<blockquote><p>💡 <strong>טיפ עבודה:</strong> תרגמו את השפה הראשית קודם, רק אחרי שהתוכן סופי — תרגמו לשפות אחרות. תרגום לפני סיום מוביל לעבודה כפולה.</p></blockquote>$H$,
    'polylang', v_cat_poly, 'global', true, 700, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('polylang-translate-acf',
    'תרגום שדות ACF בסקשנים',
    'איך מתרגמים תוכן בתוך סקשנים שעבד ב-ACF — בלי לאבד את המבנה.',
    '', $H$<h2>איך זה עובד</h2>
<p>כל גרסת שפה של עמוד היא עמוד נפרד עם רשימת סקשנים משלה. כשאתם פותחים את הגרסה האנגלית — הסקשנים שם ריקים בהתחלה.</p>
<h2>תרגום שדות שדה-שדה</h2>
<ol><li>פתחו את הגרסה האנגלית של העמוד.</li><li>בתיבת Flexible Content, הוסיפו <strong>אותם סקשנים</strong> שיש בעברית.</li><li>לכל שדה — הקלידו את התרגום.</li></ol>
<h2>איך לוודא שהמבנה זהה?</h2>
<p>פתחו את שתי הגרסאות בלשוניות נפרדות בדפדפן (טאב 1: עברית, טאב 2: אנגלית). השוו ב-Flexible Content שיש את אותם סקשנים באותו סדר.</p>
<h2>שדות שלא צריך לתרגם</h2>
<ul><li>תמונות — אם הן אוניברסליות (לוגו, תמונות סטוק)</li><li>אייקונים</li><li>קישורים פנימיים — חייבים להיות לעמודים בשפה הנכונה</li></ul>
<h2>קישורים בין שפות</h2>
<p>אם בסקשן יש כפתור "צור קשר" שמפנה ל-<code>/contact</code>:</p>
<ul><li>בעמוד עברי — צריך להפנות ל-<code>/contact</code></li><li>בעמוד באנגלית — צריך להפנות ל-<code>/en/contact</code></li></ul>
<p>וודאו לעדכן את ה-URLs בקישורים בכל שפה.</p>
<blockquote><p>⚠️ <strong>טעות נפוצה:</strong> אנשים מתרגמים רק כותרת והשאר נשאר בעברית. לקוח אנגלי שמגיע ורואה תערובת — חוויה גרועה. <mark>תמיד תרגמו את כל הסקשן או דלגו עליו לגמרי.</mark></p></blockquote>$H$,
    'polylang', v_cat_poly, 'global', true, 710, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('polylang-menus',
    'ניהול תפריטים בכל שפה',
    'איך יוצרים תפריט נפרד לכל שפה ומוודאים שהוא מוצג נכון.',
    '', $H$<h2>הבנה — תפריט לכל שפה</h2>
<p>WordPress מאפשר לקבוע איזה תפריט מוצג בכל "מיקום" (header, footer וכו'). עם Polylang, כל שפה צריכה תפריט משלה (מילוי שונה).</p>
<h2>יצירת תפריט בשפה חדשה</h2>
<ol><li>תפריט הצד → <strong>Appearance</strong> → <strong>Menus</strong>.</li><li>בראש העמוד יש "<strong>Select a menu to edit</strong>" — בחרו <strong>Create a new menu</strong>.</li><li>תנו שם תיאורי: <code>Main Menu - English</code>.</li><li>לחצו <strong>Create Menu</strong>.</li><li>הוסיפו פריטים — אבל זכרו: רק עמודים בשפה האנגלית מופיעים ברשימה הצד שמאלית.</li><li>שנו את הטקסטים בכל פריט (לחיצה על החץ הקטן ליד הפריט) ל-Navigation Label באנגלית.</li></ol>
<h2>הקצאת התפריט למיקום בשפה הנכונה</h2>
<ol><li>בתחתית עמוד התפריטים יש "<strong>Menu Settings</strong>".</li><li>סמנו את ה-<strong>Display location</strong>: "Primary Menu - English".</li><li>לחצו <strong>Save Menu</strong>.</li></ol>
<h2>בדיקה</h2>
<p>גשו לאתר באנגלית (<code>/en/</code>). וודאו שהתפריט שמופיע הוא הנכון.</p>
<blockquote><p>💡 <strong>טיפ:</strong> לפעמים יותר נוח להעתיק תפריט עברי כבסיס ולערוך אותו לאנגלית. בעמוד Menus → "<strong>Manage with Live Preview</strong>" → אופציה לשכפול.</p></blockquote>$H$,
    'polylang', v_cat_poly, 'global', true, 720, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('polylang-cpt',
    'תרגום פריטים מסוג CPT',
    'איך יוצרים גרסה מתורגמת של אטרקציה / מוצר / חבר צוות.',
    '', $H$<h2>אותו עיקרון</h2>
<p>כל פריט CPT הוא פוסט. יש לו "תרגום" שזה פוסט נפרד באותו CPT. הקישור בין השניים נעשה דרך תיבת Languages.</p>
<h2>יצירת תרגום</h2>
<ol><li>פתחו את הפריט (לדוגמה אטרקציה) בעברית.</li><li>בתיבת <strong>Languages</strong> בצד — לחצו על "+" ליד אנגלית.</li><li>תיפתח גרסה אנגלית ריקה.</li><li>תרגמו: כותרת, תיאור, שדות ACF.</li><li>תמונה ראשית — אם רלוונטית בשתי השפות, היא תוסנכרן אוטומטית (אם הגדרתם בלשונית Synchronization).</li><li>לחצו <strong>Publish</strong>.</li></ol>
<h2>תרגום קטגוריות / תגיות של CPT</h2>
<p>טקסונומיות גם הן מתורגמות:</p>
<ol><li>תפריט הצד → ה-CPT → <strong>Categories</strong>.</li><li>בכל קטגוריה תראו את עמודת הדגלים — סמל "+" ליד שפה ללא תרגום.</li><li>לחצו וצרו תרגום של הקטגוריה.</li></ol>
<h2>הצגה באתר</h2>
<p>הסקשנים שמושכים פריטים (גריד אטרקציות וכו') יציגו אוטומטית את הפריטים בשפה של העמוד שמציג אותם. אין צורך להגדיר משהו מיוחד.</p>
<blockquote><p>⚠️ <strong>שמירה על הקישור:</strong> תמיד וודאו ב-Languages box שהפריט בעברית והפריט באנגלית מקושרים. בלי קישור — Polylang לא יודע שזה אותו דבר, וזה ישבור את ההפניה הבין-שפתית.</p></blockquote>$H$,
    'polylang', v_cat_poly, 'global', true, 730, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  -- ────────────────────────────────────────────────────────────────────
  -- ELEVATE CONTROL (general)
  -- ────────────────────────────────────────────────────────────────────

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('ec-dashboard-tour',
    'ניווט באזור הלקוח שלכם ב-Elevate Control',
    'מה כל קובייה ולשונית עושה — איך מתמצאים בדאשבורד שלכם.',
    '', $H$<h2>ברוכים הבאים לאזור הלקוח</h2>
<p>Elevate Control הוא המקום היחיד שבו אתם רואים את כל מה שקשור לפרויקט — איפה הוא עומד, מה צריך לאשר, איפה התשלומים, ואיך לפתוח טיקט.</p>
<h2>תפריט הצד הקבוע</h2>
<p>בצד ימין של המסך, בכל עמוד, יש תפריט עם כל "אזורי העבודה" של הפרויקט:</p>
<ul><li>📊 <strong>סקירה כללית</strong> — דף הפתיחה עם כל הסיכום</li><li>💰 <strong>כספים</strong> — הצעת מחיר, מילסטוני תשלום, חשבוניות</li><li>📄 <strong>אפיון</strong> — סיכום ראיון, חומרים, אפיון תוכן</li><li>🎨 <strong>עיצוב</strong> — עמודי עיצוב לאישור</li><li>💻 <strong>פיתוח</strong> — עמודי פרונט-אנד ו-CMS לאישור</li><li>🧪 <strong>QA</strong> — צ'קליסט בדיקות לפני עליה לאוויר</li><li>📝 <strong>תוכן</strong> — מערכת ניהול וחומרי תוכן</li><li>🔌 <strong>אינטגרציות</strong> — Pixels, Tag Manager, וכו'</li><li>🚀 <strong>עליה לאוויר</strong> — Checklist final</li><li>🎓 <strong>הדרכה</strong> — המדריכים שאתם קוראים עכשיו</li><li>🎧 <strong>שירות ותמיכה</strong> — פתיחת טיקטים</li></ul>
<h2>נעילה אוטומטית</h2>
<p>חלק מהאזורים נעולים בהתחלה — הם נפתחים לפי השלב שהפרויקט נמצא בו. למשל "QA" יוצג רק כשהפיתוח יסתיים. זה נורמלי.</p>
<h2>מובייל</h2>
<p>במובייל, התפריט הופך לפס אופקי בראש העמוד. גללו ימינה / שמאלה לעבור בין אזורים.</p>
<h2>סקירה כללית — הדף הראשון</h2>
<p>מציג:</p>
<ul><li>שלב הפרויקט הנוכחי</li><li>תאריך עליה לאוויר</li><li>אחוז התקדמות</li><li>תגובות פתוחות</li><li>גישה מהירה לכל ה-workspaces</li></ul>
<blockquote><p>💡 <strong>טיפ:</strong> תתחילו תמיד מ"סקירה כללית" כשנכנסים. אם משהו דורש את תשומת לבכם, הוא יהיה מודגש שם.</p></blockquote>$H$,
    'general', v_cat_gen, 'global', true, 800, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('ec-approve-and-fix',
    'אישור עיצוב/פיתוח ובקשת תיקון',
    'איך מאשרים עמודים, מבקשים תיקון עם צילומי מסך, ומסיימים את הסבב.',
    '', $H$<h2>איפה מאשרים?</h2>
<p>בלשוניות "🎨 עיצוב" או "💻 פיתוח" שבתפריט.</p>
<p>תראו רשימה של עמודים — כל עמוד הוא שורה דחוסה עם:</p>
<ul><li>שם העמוד</li><li>אייקוני לינק (🖥️ דסקטופ, 📱 מובייל)</li><li>סטטוס בצבע (כחול=ממתין, ירוק=אושר, כתום=תיקון)</li><li>אייקון תגובות עם מספר הודעות</li></ul>
<h2>צפייה בעמוד</h2>
<ol><li>לחצו על אייקון 🖥️ דסקטופ — ייפתח טאב חדש עם העיצוב.</li><li>סקרו לאט. שימו לב לטקסטים, צבעים, פרטי קשר.</li><li>חזרו ל-Elevate Control.</li><li>לחצו על אייקון 📱 מובייל ובדקו גם שם.</li></ol>
<h2>אישור — אם הכל טוב</h2>
<ol><li>לחצו על תיבת הסטטוס בצבע (כחול "ממתין").</li><li>בחרו <strong>אושר</strong>.</li><li>הסטטוס יהפוך לירוק.</li><li>הסטודיו מקבל התראה ויודע שהעמוד מוכן.</li></ol>
<h2>בקשת תיקון — עם צילומי מסך</h2>
<ol><li>לחצו על תיבת הסטטוס ובחרו <strong>תיקון</strong>.</li><li>הסטטוס הופך לכתום.</li><li>לחצו על אייקון התגובות 💬 — תיפתח חלונית הודעות.</li><li>בתיבת ההודעה כתבו מה צריך לשנות.</li><li><strong>כדי לצרף צילום מסך:</strong> פתחו את העמוד הבעייתי, צלמו מסך (Win+Shift+S או Mac Cmd+Shift+4), חזרו לחלונית והדביקו עם <strong>Ctrl+V</strong>.</li><li>אפשר לצרף כמה צילומי מסך — מדביקים אחד אחרי השני.</li><li>לחצו <strong>שלח</strong>.</li></ol>
<blockquote><p>🎯 <strong>טיפ לתיאור טוב:</strong> במקום "תקן את ההירו" → כתבו "הכפתור 'הזמן עכשיו' צריך להיות אדום במקום שחור, והטקסט מתחת מבולגן במובייל". פירוט = פחות סבבים.</p></blockquote>
<h2>אחרי שביקשתם תיקון</h2>
<ol><li>הסטודיו רואה ועובד עליו.</li><li>כשהם מסיימים, יקבלו את הסטטוס בחזרה ל-"ממתין" ויעדכנו אתכם בהודעה.</li><li>תחזרו לעמוד, סקרו, ואשרו (או בקשו תיקון נוסף).</li></ol>$H$,
    'general', v_cat_gen, 'global', true, 810, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('ec-support-ticket',
    'פתיחת טיקט תמיכה',
    'איך לדווח על באג / לבקש שינוי / לשאול שאלה — כך שלא יישכח.',
    '', $H$<h2>למה דרך טיקט?</h2>
<p>WhatsApp ומיילים נעלמים בים ההודעות. טיקט נשאר במקום אחד, מקבל סטטוס, ואי-אפשר "לשכוח ממנו".</p>
<h2>פתיחת טיקט</h2>
<ol><li>לכו ללשונית <strong>🎧 שירות ותמיכה</strong> בתפריט הצד.</li><li>לחצו <strong>+ טיקט חדש</strong>.</li><li>הזינו <strong>כותרת</strong> — קצרה ותיאורית. דוגמה: "טופס יצירת קשר לא שולח מייל".</li><li>בחרו <strong>עדיפות</strong>: רגיל / דחוף.</li><li>בתיבת ההודעה תארו את הבעיה / הבקשה.</li><li>אפשר לצרף צילום מסך עם <strong>Ctrl+V</strong>.</li><li>לחצו <strong>שלח</strong>.</li></ol>
<h2>מתי "דחוף"?</h2>
<ul><li>האתר נפל / לבן</li><li>תשלומים לא עוברים</li><li>טופס עיקרי לא שולח</li><li>בעיה שמשפיעה על כל הלקוחות</li></ul>
<p><mark>אל תסמנו "דחוף" עבור שינויי תוכן או שיפורים.</mark> זה גורם להתראות לילה לכל הצוות. שמרו על זה לאמת.</p>
<h2>תיאור טיקט טוב</h2>
<p>המבנה האידיאלי:</p>
<ol><li><strong>מה אני רואה</strong> (מצב נוכחי) — "הכפתור 'הזמן' לא נראה לחיץ".</li><li><strong>מה אני מצפה לראות</strong> — "אמור להיות כחול וברור".</li><li><strong>איפה / מתי</strong> — "בעמוד הבית, רק במובייל".</li><li><strong>צילום מסך</strong> אם אפשר.</li></ol>
<h2>מעקב אחרי טיקט</h2>
<p>הטיקט יקבל סטטוס שמתעדכן:</p>
<ul><li><strong>פתוח</strong> — קיבלנו, נטפל בקרוב</li><li><strong>בטיפול</strong> — מישהו עובד עליו עכשיו</li><li><strong>תוקן</strong> — בוצע, אנא בדקו ואשרו סגירה</li></ul>
<p>תקבלו מייל בכל שינוי סטטוס ובכל תגובה חדשה.</p>
<h2>זמני תגובה</h2>
<ul><li><strong>דחוף</strong> — תוך 4 שעות בעבודה (ובחירום גם בלילה)</li><li><strong>רגיל</strong> — תוך יום עסקים</li></ul>
<blockquote><p>💡 <strong>טיפ:</strong> אם פתחתם טיקט וההודעה שלכם השתנתה — הוסיפו תגובה לטיקט הקיים במקום לפתוח חדש. ככה הסטודיו רואה את ההיסטוריה.</p></blockquote>$H$,
    'general', v_cat_gen, 'global', true, 820, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('ec-progress-tracking',
    'מעקב אחרי התקדמות הפרויקט',
    'איך לדעת באיזה שלב אתם, מתי האתר עולה, ומה עוד נשאר.',
    '', $H$<h2>שלבי הפרויקט</h2>
<p>בעמוד הסקירה של הפרויקט יש פס שלבים אופקי:</p>
<ol><li>הצעת מחיר</li><li>אפיון</li><li>עיצוב</li><li>פרונט-אנד</li><li>בק-אנד</li><li>QA</li><li>אינטגרציות</li><li>עליה לאוויר</li><li>באוויר</li></ol>
<p>השלב הנוכחי מודגש בצבע. המסיימים מקבלים סימן ✓.</p>
<h2>אחוז התקדמות</h2>
<p>הקובייה "התקדמות" מציגה אחוז כללי. זה ממוצע של כל השלבים.</p>
<h2>תאריך יעד</h2>
<p>בקובייה "עליה לאוויר" — התאריך שצופים שהאתר יעלה. זה משוער בהתחלה ומתעדכן ככל שהפרויקט מתקדם.</p>
<h2>איפה התקדמות בכל workspace?</h2>
<p>בכל אזור (עיצוב, פיתוח, QA וכו') יש מד התקדמות פנימי:</p>
<ul><li>בעיצוב — כמה עמודים אושרו מכמה</li><li>בפיתוח — אותו דבר</li><li>ב-QA — כמה פריטי בדיקה הושלמו</li></ul>
<h2>מה לעשות אם דאגתם מההתקדמות?</h2>
<p>פתחו טיקט תמיכה עם השאלה. נחזור עם תשובה ברורה — אם יש עיכוב, מה הסיבה ומה הצפי החדש.</p>
<blockquote><p>💡 <strong>טיפ:</strong> "תגובות פתוחות" בקובייה הראשית מציין כמה דברים מחכים לכם לאשר / לתת פידבק. ככל שזה גבוה — הפרויקט מתעכב בגללכם. תגיבו ותתקדמו!</p></blockquote>$H$,
    'general', v_cat_gen, 'global', true, 830, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  -- ────────────────────────────────────────────────────────────────────
  -- TOOLS
  -- ────────────────────────────────────────────────────────────────────

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('figma-view-comments',
    'צפייה בקובץ Figma של העיצוב',
    'איך פותחים את קובץ העיצוב, מסתכלים, ומשאירים הערות בלי לשנות כלום.',
    '', $H$<h2>פתיחת הקובץ</h2>
<p>אם הסטודיו שלח לכם לינק ל-Figma:</p>
<ol><li>לחצו על הלינק.</li><li>אם יש בקשה להתחבר — צרו חשבון חינם או היכנסו אם יש.</li><li>הקובץ ייפתח בדפדפן.</li></ol>
<h2>ניווט בקובץ</h2>
<ul><li><strong>גלילה</strong> — לזוז למעלה/למטה (גם עם trackpad).</li><li><strong>זום</strong> — Ctrl + scroll (PC) / pinch (Mac).</li><li><strong>הזזה</strong> — Spacebar + drag.</li><li><strong>תפריט עמודים</strong> בצד שמאל — Pages / Frames.</li></ul>
<h2>השארת הערה</h2>
<ol><li>בסרגל הצד יש אייקון <strong>Comment</strong> (בועת דיבור).</li><li>לחצו עליו — הסמן הופך לבועה.</li><li>לחצו במקום שתרצו להעיר.</li><li>תיפתח תיבת טקסט — כתבו את ההערה.</li><li>לחצו <strong>Post</strong>.</li></ol>
<h2>תגובה על הערה קיימת</h2>
<p>לחצו על הבועה ויפתח חוט שיחה — אפשר להגיב.</p>
<h2>ייצוא תמונה</h2>
<ol><li>סמנו את הפריט הרצוי (frame או אובייקט).</li><li>בצד ימין — תיבת <strong>Export</strong>.</li><li>בחרו פורמט (PNG / JPG / SVG).</li><li>לחצו <strong>Export</strong>.</li></ol>
<blockquote><p>⚠️ <strong>חשוב:</strong> אל תערכו את הקובץ עצמו. אם אתם רואים ש"מצב עריכה" פעיל ואתם יכולים לגרור דברים — חיתי לחצו <strong>Esc</strong> וודאו שאתם ב-View Mode. שינוי בקובץ העיצוב עלול לשבור משהו.</p></blockquote>$H$,
    'figma', v_cat_figma, 'global', true, 900, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  insert into public.guide_articles (slug, title, description, content_md, content_html, category, category_id, visibility, published, position, created_by)
  values ('clickup-client-area',
    'אזור הלקוח ב-ClickUp',
    'איך להיכנס, לראות משימות פתוחות, ולדווח על באג מהאזור.',
    '', $H$<h2>למה ClickUp?</h2>
<p>חלק מהפרויקטים שלנו עוקבים אחרי משימות ב-ClickUp במקביל ל-Elevate Control. זה כלי חיצוני שאנחנו משתמשים בו לניהול פנימי, ואתם יכולים להציץ.</p>
<h2>כניסה</h2>
<ol><li>פתחו את הלינק שקיבלתם מהסטודיו.</li><li>אם זו פעם ראשונה — הצטרפו לחשבון (חינמי, מספיק מייל).</li><li>תגיעו ל-Workspace הספציפי לפרויקט שלכם.</li></ol>
<h2>תצוגות עיקריות</h2>
<ul><li><strong>List</strong> — רשימה של משימות מסודרות לפי סטטוס</li><li><strong>Board (Kanban)</strong> — עמודות עם כרטיסיות, מצוין למעקב חזותי</li><li><strong>Calendar</strong> — לפי תאריכים</li><li><strong>Gantt</strong> — תרשים זמן</li></ul>
<h2>סטטוסים נפוצים</h2>
<ul><li>Backlog / To Do — עוד לא התחיל</li><li>In Progress — בעבודה</li><li>QA / Review — בבדיקות</li><li>Client Review — מחכה לכם</li><li>Done — הושלם</li></ul>
<h2>פתיחת משימה לראות פרטים</h2>
<ol><li>לחצו על שם המשימה.</li><li>תיפתח חלונית עם תיאור, תאריך יעד, אחראי, צירופים.</li><li>אפשר להגיב בתחתית.</li></ol>
<h2>דיווח באג מ-ClickUp</h2>
<p>בדרך כלל אנחנו מעדיפים שתפתחו טיקט ב-Elevate Control (לא ב-ClickUp). אבל אם זה מתאים לזרימה שלכם:</p>
<ol><li>לחצו <strong>+ Add Task</strong>.</li><li>תיאור הבעיה.</li><li>הצמידו צילומי מסך.</li><li>שמרו.</li></ol>
<blockquote><p>💡 <strong>טיפ:</strong> Elevate Control משתלב אוטומטית עם ClickUp במקרים מסוימים. כשפותחים טיקט אצלנו, נוצרת משימה ב-ClickUp בצד שני. לכן עדיפות לפתיחה דרכנו.</p></blockquote>$H$,
    'clickup', v_cat_clickup, 'global', true, 910, v_user_id)
  on conflict (slug) do update set title=excluded.title, description=excluded.description, content_html=excluded.content_html, category_id=excluded.category_id, visibility=excluded.visibility, published=excluded.published, position=excluded.position, updated_at=now();

  raise notice 'Part 3 done — WooCommerce (7) + Polylang (4) + Elevate Control (4) + Tools (2) = 17 guides';
  raise notice 'Total guides across part1+part2+part3 = 46';
end $$;

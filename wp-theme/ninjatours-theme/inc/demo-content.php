<?php
/**
 * Demo content installer.
 *
 * Runs once on theme activation. Creates:
 *   - WP pages (Home / About / Contact / Blog) with the FC template
 *   - Sample CPT posts (destinations, attractions, hotels, use cases,
 *     travel types, client reviews) with their CPT-specific fields filled
 *   - Header/Footer nav menus wired to the correct locations
 *   - Static homepage + posts page settings
 *   - Rich Flexible Content on Home, About, Contact, and the first
 *     travel-type post — the editor sees a fully composed site on first run
 *
 * Sets `nt_demo_installed` option after run; delete it to re-trigger.
 */

add_action('after_switch_theme', 'nt_install_demo_content');

function nt_install_demo_content(): void {
  if (get_option('nt_demo_installed')) return;

  // Defer until ACF + CPTs are registered
  add_action('init', function () {
    if (get_option('nt_demo_installed')) return;
    if (!function_exists('update_field')) return;   // requires ACF Pro

    $page_ids = nt_demo_create_pages();
    $cpt_ids  = nt_demo_create_cpt_posts();
    nt_demo_seed_taxonomy_terms($cpt_ids);
    nt_demo_seed_cpt_fields($cpt_ids);
    nt_demo_seed_general_settings();
    nt_demo_seed_pages_flexible_content($page_ids);
    nt_demo_seed_travel_type_flexible_content($cpt_ids);
    nt_demo_create_menus($page_ids);

    update_option('nt_demo_installed', current_time('mysql'));
  }, 100);
}

/* ──────────────────────────────────────────────────────────────────────
 * Section row builder for flexible_content
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Build a single row for the flexible_content field. The layout's content
 * fields go under group → <layout_name>, matching the structure built by
 * nt_layout_subfields() in inc/acf/helpers.php.
 */
function nt_demo_section(string $layout, array $fields, array $wrapper = []): array {
  return array_merge([
    'acf_fc_layout'        => $layout,
    'use_general_settings' => 0,
    'hide_section'         => 0,
    'section_id'           => '',
  ], $wrapper, [
    'group' => [
      $layout => $fields,
    ],
  ]);
}

/**
 * ACF Link field shape — short helper.
 */
function nt_demo_link(string $url, string $title, string $target = ''): array {
  return ['url' => $url, 'title' => $title, 'target' => $target];
}

/* ──────────────────────────────────────────────────────────────────────
 * Pages — create the default WP pages and set front/blog page
 * ────────────────────────────────────────────────────────────────────── */

function nt_demo_create_pages(): array {
  $template = 'views/page-flexible-content.php';

  $pages = [
    'home'        => 'Home',
    'about'       => 'אודות',
    'contact'     => 'יצירת קשר',
    'blog'        => 'בלוג',
    'why-us'      => 'למה אנחנו',
    'destinations-page' => 'יעדים פופולריים',
  ];

  $ids = [];
  foreach ($pages as $slug => $title) {
    $existing = get_page_by_path($slug);
    if ($existing) {
      $ids[$slug] = $existing->ID;
      continue;
    }
    $id = wp_insert_post([
      'post_title'    => $title,
      'post_name'     => $slug,
      'post_status'   => 'publish',
      'post_type'     => 'page',
      'page_template' => $template,
      'post_content'  => '',
    ]);
    if (!is_wp_error($id)) $ids[$slug] = $id;
  }

  if (!empty($ids['home'])) {
    update_option('show_on_front', 'page');
    update_option('page_on_front', $ids['home']);
  }
  if (!empty($ids['blog'])) {
    update_option('page_for_posts', $ids['blog']);
  }

  return $ids;
}

/* ──────────────────────────────────────────────────────────────────────
 * CPT posts — base creation
 * ────────────────────────────────────────────────────────────────────── */

function nt_demo_create_cpt_posts(): array {
  $samples = [
    'destination' => [
      ['title' => 'טוקיו',          'excerpt' => 'בירת יפן — שילוב של עיר עתיק-מודרנית, מקדשים ומסעדות מיכלן.'],
      ['title' => 'קיוטו',          'excerpt' => 'עיר הבירה ההיסטורית — גנים יפניים, מקדשים ויערות במבו.'],
      ['title' => 'אוסקה',          'excerpt' => 'בירת האוכל של יפן — שווקים תוססים, חיי לילה וטירת אוסקה.'],
      ['title' => 'הוקאידו',        'excerpt' => 'האי הצפוני — נופים פתוחים, אונסן ושלגים.'],
    ],
    'attraction' => [
      ['title' => 'מקדש פושימי אינארי',     'excerpt' => 'אלפי שערי טורי אדומים על פני הר אינארי בקיוטו.'],
      ['title' => 'יער הבמבו ארשייאמה',     'excerpt' => 'מסלול הליכה קסום בין הבמבו של ארשייאמה.'],
      ['title' => "הר פוג'י",               'excerpt' => 'הסמל האייקוני של יפן, בגובה 3,776 מטרים.'],
      ['title' => "גן קינקאקו-ג'י",         'excerpt' => 'מקדש הזהב — אחד מהמקדשים היפים ביותר בקיוטו.'],
      ['title' => 'שיבויה קרוסינג',         'excerpt' => 'הצומת המפורסמת בעולם — סמל של טוקיו המודרנית.'],
      ['title' => 'מקדש סנסו-ג\'י',          'excerpt' => 'המקדש העתיק ביותר בטוקיו, שכונת אסאקוסה.'],
    ],
    'hotel' => [
      ['title' => 'Park Hyatt Tokyo',       'excerpt' => 'מלון יוקרתי במגדל הענק של שינג\'וקו.'],
      ['title' => 'The Ritz-Carlton Kyoto', 'excerpt' => 'יוקרה על נהר קאמו בלב קיוטו.'],
      ['title' => 'Conrad Osaka',           'excerpt' => 'מלון מודרני עם נוף עוצר נשימה לעיר.'],
      ['title' => 'Hoshinoya Tokyo',        'excerpt' => 'ריוקאן עירוני במרכז טוקיו עם אונסן בגג.'],
    ],
    'use-case' => [
      ['title' => 'משפחת כהן ביפן — 10 ימים',           'excerpt' => 'טיול משפחתי בין טוקיו, אוסקה וקיוטו עם ילדים.'],
      ['title' => 'ירח דבש בקיוטו',                      'excerpt' => "שבוע רומנטי בין מקדשים, ריוקאן ובוקר עם פוג'י."],
      ['title' => 'חבורת חברים — חיי לילה ב-3 ערים',     'excerpt' => '12 ימים אינטנסיביים בטוקיו, אוסקה והוקאידו.'],
      ['title' => 'טיול תרבות מותאם — צוות ונופית',      'excerpt' => 'שבועיים של מקדשים, אומנות, וטקסי תה.'],
    ],
    'travel-type' => [
      ['title' => 'טבע ונופים',     'excerpt' => "נופים עוצרי נשימה — הר פוג'י, יערות הבמבו, גנים עתיקים."],
      ['title' => 'תרבות ומסורת',   'excerpt' => 'חוויה של התרבות היפנית מקרוב — מקדשים, גיישות, טקסי תה.'],
      ['title' => 'ערים תוססות',    'excerpt' => 'חיי לילה, שופינג ואורבניות — טוקיו, אוסקה, יוקוהמה.'],
      ['title' => 'שילוב מושלם',    'excerpt' => 'טיולים, אטרקציות ובין לבין — הטוב משני העולמות.'],
    ],
    'client-review' => [
      ['title' => 'שלומית ר.', 'excerpt' => 'הטיול היה חוויה של פעם בחיים. הצוות חשב על כל פרט.'],
      ['title' => 'אבי ל.',    'excerpt' => 'תכנון מדויק, ליווי מלא — לא היו הפתעות לא נעימות.'],
      ['title' => 'יעל וניר',  'excerpt' => 'ירח הדבש המושלם. ממליצים בחום!'],
      ['title' => 'משפחת לוי', 'excerpt' => 'נסענו עם 3 ילדים והכל היה מסודר עד הפרט האחרון.'],
    ],
  ];

  $ids = [];
  foreach ($samples as $cpt => $items) {
    $ids[$cpt] = [];
    foreach ($items as $item) {
      $existing = get_page_by_title($item['title'], OBJECT, $cpt);
      if ($existing) {
        $ids[$cpt][] = $existing->ID;
        continue;
      }
      $id = wp_insert_post([
        'post_type'    => $cpt,
        'post_title'   => $item['title'],
        'post_excerpt' => $item['excerpt'],
        'post_content' => $item['excerpt'],
        'post_status'  => 'publish',
      ]);
      if (!is_wp_error($id)) $ids[$cpt][] = $id;
    }
  }

  return $ids;
}

/* ──────────────────────────────────────────────────────────────────────
 * CPT-specific field values (taglines, ratings, durations, quotes, …)
 * ────────────────────────────────────────────────────────────────────── */

function nt_demo_seed_cpt_fields(array $cpt_ids): void {

  // Destinations — taglines
  $dest_data = [
    'טוקיו'    => 'בירת יפן · שילוב של עיר עתיק-מודרנית',
    'קיוטו'    => 'עיר הבירה ההיסטורית · 17 אתרי מורשת עולמית',
    'אוסקה'    => 'בירת האוכל של יפן · חיי לילה תוססים',
    'הוקאידו'  => 'האי הצפוני · אונסן, שלגים ונופים פתוחים',
  ];
  foreach ($cpt_ids['destination'] ?? [] as $id) {
    $title = get_the_title($id);
    if (isset($dest_data[$title])) update_field('tagline', $dest_data[$title], $id);
  }

  // Hotels — rating + tagline
  $hotel_data = [
    'Park Hyatt Tokyo'        => ['rating' => '5', 'tagline' => 'יוקרה במגדל ה-52 קומות, מבט פנורמי על העיר'],
    'The Ritz-Carlton Kyoto'  => ['rating' => '5', 'tagline' => 'על נהר קאמו, לב קיוטו ההיסטורית'],
    'Conrad Osaka'            => ['rating' => '5', 'tagline' => 'מלון מודרני בקומות העליונות עם spa בגג'],
    'Hoshinoya Tokyo'         => ['rating' => '5', 'tagline' => 'ריוקאן יוקרתי במרכז טוקיו עם אונסן עתיק'],
  ];
  foreach ($cpt_ids['hotel'] ?? [] as $id) {
    $title = get_the_title($id);
    if (isset($hotel_data[$title])) {
      update_field('rating',  $hotel_data[$title]['rating'],  $id);
      update_field('tagline', $hotel_data[$title]['tagline'], $id);
    }
  }

  // Attractions — info chips + tips
  foreach ($cpt_ids['attraction'] ?? [] as $id) {
    $title = get_the_title($id);

    // A small set of chip data per attraction type
    $chips = [
      ['label' => 'שעות פתיחה', 'value' => 'פתוח 24 שעות'],
      ['label' => 'מחיר',       'value' => 'כניסה חופשית'],
      ['label' => 'משך ביקור',  'value' => '2–4 שעות'],
      ['label' => 'הגעה',       'value' => 'תחבורה ציבורית'],
    ];
    update_field('info_chips', $chips, $id);

    update_field('tips', [
      ['title' => 'הגיעו מוקדם',     'text' => 'לפני 8:00 אין תיירים ויש אור מושלם לצילומים'],
      ['title' => 'נעליים נוחות',    'text' => 'חלק מהמסלולים כוללים מדרגות ועליות'],
      ['title' => 'תכננו את היום',   'text' => 'שלבו עם אטרקציות נוספות באזור לחיסכון בזמן'],
    ], $id);
  }

  // Use Cases — duration / capacity / modal content / tags / quote
  $uc_data = [
    'משפחת כהן ביפן — 10 ימים' => [
      'trip_duration' => '10 ימים',
      'trip_capacity' => 'זוג + 2 ילדים (8, 11)',
      'modal_content' => '<p>טיול משפחתי שילבנו טוקיו, פוג\'י, אוסקה וקיוטו. כל יום עם פעילויות מותאמות לילדים — דיסני סי, פארק האקווריום בקובה, ועדיין שמרנו על המסלולים התרבותיים.</p>',
      'quote' => ['text' => 'הטיול שינה את הילדים. היום הם מבקשים סושי במקום פיצה.', 'author' => 'משפחת כהן'],
      'tags'  => [['item' => 'משפחות'], ['item' => 'ילדים'], ['item' => 'טוקיו'], ['item' => 'קיוטו']],
    ],
    'ירח דבש בקיוטו' => [
      'trip_duration' => '7 ימים',
      'trip_capacity' => 'זוג',
      'modal_content' => '<p>שבוע רומנטי בקיוטו ובסביבתה: לינה ב-3 ריוקאן שונים, טקס תה פרטי, סדנת קליגרפיה, וערב גיישה בגיון. סיום עם 2 לילות במלון 5 כוכבים על נהר קאמו.</p>',
      'quote' => ['text' => 'הצוות של נינג\'ה טורס הצליח לתכנן את ירח הדבש המושלם.', 'author' => 'יעל וניר'],
      'tags'  => [['item' => 'ירח דבש'], ['item' => 'זוגות'], ['item' => 'קיוטו'], ['item' => 'תרבות']],
    ],
    'חבורת חברים — חיי לילה ב-3 ערים' => [
      'trip_duration' => '12 ימים',
      'trip_capacity' => '6 חברים',
      'modal_content' => '<p>12 ימים אינטנסיביים: טוקיו (שיבויה, רופונגי), אוסקה (דוטונבורי, נמבה), וסיום בהוקאידו עם פאודר סנואו ואונסן.</p>',
      'quote' => ['text' => 'התקציב היה מורכב — הצליחו לשמור עליו ועדיין נתנו לנו את הכל.', 'author' => 'אורי ל.'],
      'tags'  => [['item' => 'חברים'], ['item' => 'חיי לילה'], ['item' => 'הוקאידו']],
    ],
    'טיול תרבות מותאם — צוות ונופית' => [
      'trip_duration' => '14 ימים',
      'trip_capacity' => 'זוג + סבתא',
      'modal_content' => '<p>שבועיים של תרבות עמוקה: סדנאות מסורתיות, מקדשים, מוזיאונים, ושהייה ב-2 רייוקאן עם אונסן. מסלול בקצב נינוח עם נגישות מותאמת.</p>',
      'quote' => ['text' => 'סבתא חזרה צעירה ב-10 שנים מהטיול הזה.', 'author' => 'נופית ש.'],
      'tags'  => [['item' => 'תרבות'], ['item' => 'נינוח'], ['item' => 'מבוגרים']],
    ],
  ];
  foreach ($cpt_ids['use-case'] ?? [] as $id) {
    $title = get_the_title($id);
    if (!isset($uc_data[$title])) continue;
    foreach ($uc_data[$title] as $field => $value) update_field($field, $value, $id);
  }

  // Travel Types — tagline (matches excerpt)
  foreach ($cpt_ids['travel-type'] ?? [] as $id) {
    update_field('tagline', get_the_excerpt($id), $id);
  }

  // Client Reviews — name + text + rating
  $rev_data = [
    'שלומית ר.' => ['rating' => 5, 'text' => 'הטיול היה חוויה של פעם בחיים. הצוות חשב על כל פרט — מהמלונות ועד הפעילויות. ממליצים בחום על נינג\'ה טורס.'],
    'אבי ל.'    => ['rating' => 5, 'text' => 'תכנון מדויק, ליווי מלא בכל שלב. הגענו ליפן עם תוכנית ברורה, וכל פעם שהיה צריך גמישות הם היו שם.'],
    'יעל וניר'  => ['rating' => 5, 'text' => 'ירח דבש מושלם. הם הצליחו לתכנן בדיוק את האיזון בין רומנטיקה לאקשן. כל לקוח מקבל יחס אישי אמיתי.'],
    'משפחת לוי' => ['rating' => 5, 'text' => 'נסענו עם 3 ילדים בני 4, 7, 10. הכל היה מותאם בדיוק לקצב של ילדים, כולל הצעות לפיתרונות לרגעים מאתגרים.'],
  ];
  foreach ($cpt_ids['client-review'] ?? [] as $id) {
    $title = get_the_title($id);
    if (!isset($rev_data[$title])) continue;
    update_field('name',   $title,                    $id);
    update_field('text',   $rev_data[$title]['text'], $id);
    update_field('rating', $rev_data[$title]['rating'], $id);
  }
}

/* ──────────────────────────────────────────────────────────────────────
 * Pages → Flexible Content seed
 * ────────────────────────────────────────────────────────────────────── */

function nt_demo_seed_pages_flexible_content(array $page_ids): void {
  // Use field key (not name) for reliable persistence with nested ACF structures
  $key = 'field_flexible_content';
  if (!empty($page_ids['home']))              update_field($key, nt_demo_fc_home(),         $page_ids['home']);
  if (!empty($page_ids['about']))             update_field($key, nt_demo_fc_about(),        $page_ids['about']);
  if (!empty($page_ids['contact']))           update_field($key, nt_demo_fc_contact(),      $page_ids['contact']);
  if (!empty($page_ids['why-us']))            update_field($key, nt_demo_fc_why_us(),       $page_ids['why-us']);
  if (!empty($page_ids['destinations-page'])) update_field($key, nt_demo_fc_destinations(), $page_ids['destinations-page']);
}

// ─── HOME ─────────────────────────────────────────────────────────────
function nt_demo_fc_home(): array {
  return [
    nt_demo_section('home_hero', [
      'title'    => 'מתכננים לכם טיול עצמאי |ליפן|',
      'lead'     => 'ליווי מלא בעברית · מהרעיון ועד ההזמנה',
      'features' => [
        ['text' => 'תכנון מדויק'],
        ['text' => 'מותאם אליכם'],
        ['text' => 'תמיכה 24/7'],
      ],
      'video'  => '',
      'poster' => 0,
      'cta'    => nt_demo_link('#contact', 'בואו נתחיל'),
    ]),

    nt_demo_section('why_us', [
      'eyebrow' => 'למה אנחנו',
      'title'   => 'למה לתכנן |איתנו| את הטיול ליפן?',
      'cards'   => [
        ['title' => 'צוות שחי ביפן',         'description' => 'הצוות שלנו חי ונושם יפן ומכיר כל פינה ופינה במדינה.'],
        ['title' => 'חוסכים טעויות וכסף',    'description' => 'המומחיות שלנו תחסוך לכם זמן יקר וטעויות מיותרות בדרך.'],
        ['title' => 'ליווי מלא בעברית',      'description' => 'אנחנו מלווים אתכם לאורך כל הטיול שלכם מרחוק.'],
        ['title' => 'מומחים רק ליפן',        'description' => 'אנחנו מתמחים אך ורק ביפן וזה מה שעושה את ההבדל.'],
        ['title' => 'סוגרים הכל במקום אחד',  'description' => 'טיסות, מלונות, רכבות ואטרקציות — הכל מסודר במקום אחד.'],
      ],
      'cta' => nt_demo_link('#contact', 'בואו נתחיל'),
    ]),

    nt_demo_section('trip_types', [
      'title'    => 'איזה סוג טיול |מתאים לכם?|',
      'lead'     => 'לא בטוחים איזה סוג טיול מתאים לכם? יפן מציעה אינספור אפשרויות — מערים תוססות ומודרניות ועד כפרים שקטים, טבע עוצר נשימה וחוויות תרבות עמוקות.',
      'show_all' => 1,
      'items'    => [],
    ]),

    nt_demo_section('attractions', [
      'title'        => 'מגוון |אטרקציות| מומלצות ביפן',
      'lead'         => 'חוו את יפן מכל ההיבטים! גלו מגוון אטרקציות ופעילויות שמסמלות את התרבות היפנית.',
      'show_all'     => 1,
      'show_filters' => 1,
      'items'        => [],
      'cta'          => nt_demo_link('/attractions/', 'לכל האטרקציות'),
    ]),

    nt_demo_section('content_media', [
      'title'   => 'הסיפור שלנו ביפן',
      'content' => '<p>אנחנו ב-Ninja Tours מתכננים טיולים מותאמים אישית ביפן כבר למעלה מעשור. הצוות שלנו חי ביפן, מכיר את התרבות מקרוב ובונה לכם טיולים שמרגישים אישיים — לא מסלולים מוכנים.</p><p>מהפעם הראשונה שאתם פונים אלינו ועד היום שאחרי החזרה — אנחנו לצידכם.</p>',
      'image'   => 0,
      'button'  => nt_demo_link('/about/', 'קראו עוד עלינו'),
      'reverse' => 0,
    ]),

    nt_demo_section('use_cases', [
      'title'    => 'טיולים מותאמים |שבנינו| ללקוחות',
      'lead'     => 'דוגמאות מהטיולים שתכננו השנה — בכל אחד יש סיפור אחר.',
      'show_all' => 1,
      'items'    => [],
    ]),

    nt_demo_section('testimonials', [
      'title'    => 'לקוחות |משתפים| בחוויה',
      'show_all' => 1,
      'items'    => [],
    ]),

    nt_demo_section('partners', [
      'title' => 'שותפים |נבחרים|',
      'lead'  => 'אנחנו עובדים עם הטובים ביותר בתחום',
      'logos_row_1' => [],
      'logos_row_2' => [],
    ]),

    nt_demo_section('contact', [
      'title' => 'מוכנים לטיול של |פעם בחיים?|',
      'lead'  => 'בואו נתחיל לתכנן את יפן שלכם, בדיוק כמו שחלמתם.',
      'form'  => 0,
      'image' => 0,
    ]),
  ];
}

// ─── ABOUT ────────────────────────────────────────────────────────────
function nt_demo_fc_about(): array {
  return [
    nt_demo_section('home_hero', [
      'title'    => 'הסיפור |שלנו| ביפן',
      'lead'     => 'מי אנחנו, מה אנחנו עושים — ולמה כולנו מתעקשים על יפן.',
      'features' => [['text' => 'מ-2014']],
      'video'    => '',
      'poster'   => 0,
      'cta'      => nt_demo_link('#contact', 'בואו נכיר'),
    ]),

    nt_demo_section('content_media', [
      'title'   => 'התחלנו עם |חבורת מטיילים|',
      'content' => '<p>בשנת 2014 חזרנו מטיול עצמאי ביפן בלי מילה אחת ביפנית, אבל עם חוויה שלא הצלחנו להפסיק לדבר עליה. חברים שאלו "איך תכננתם?", ובמהרה הפכנו ליועצים של חברים ושל חברים-של-חברים.</p><p>היום, יותר מעשור אחר כך, נינג\'ה טורס היא חברת התכנון המוכרת בישראל ליפן. הצוות שלנו חי ביפן, חי בישראל, וכולנו דוברים את שתי השפות בצורה שוטפת.</p>',
      'image'   => 0,
      'button'  => nt_demo_link('/contact/', 'דברו איתנו'),
      'reverse' => 0,
    ]),

    nt_demo_section('why_us', [
      'eyebrow' => 'הערכים שלנו',
      'title'   => 'מה |חשוב לנו| כשאנחנו מתכננים',
      'cards'   => [
        ['title' => 'אישי',          'description' => 'כל לקוח מקבל יחס אישי אמיתי, ללא תבניות מוכנות.'],
        ['title' => 'מקצועי',        'description' => 'אנחנו מכירים כל פינה ביפן — וגם את הפינות הפחות מוכרות.'],
        ['title' => 'אמין',          'description' => 'אם משהו לא עובד — אנחנו נעדכן אתכם ראשונים.'],
        ['title' => 'גמיש',          'description' => 'הצרכים שלכם משתנים? אנחנו זזים איתם.'],
      ],
      'cta' => nt_demo_link('#contact', 'בואו נתחיל'),
    ]),

    nt_demo_section('process', [
      'title' => 'איך |עובדים| איתנו',
      'lead'  => 'התהליך שלנו פשוט וברור — בלי הפתעות.',
      'steps' => [
        ['title' => 'שיחת היכרות',      'description' => 'אנחנו לומדים מי אתם, מה חשוב לכם, ואיזה טיול אתם מחפשים.', 'image' => 0],
        ['title' => 'הצעה ראשונית',     'description' => 'תוך 5 ימי עסקים אנחנו חוזרים עם מסלול וגם הצעת תקציב.',     'image' => 0],
        ['title' => 'התאמה ועידון',     'description' => 'מתאמים את הפרטים, משנים מה שצריך, ומאשרים יחד.',          'image' => 0],
        ['title' => 'הזמנה וביצוע',    'description' => 'אנחנו מזמינים הכל עבורכם — טיסות, מלונות, רכבות, אטרקציות.', 'image' => 0],
        ['title' => 'בטיול',            'description' => 'תמיכה 24/7 בעברית לאורך כל הטיול.',                     'image' => 0],
      ],
      'cta' => nt_demo_link('#contact', 'בואו נתחיל'),
    ]),

    nt_demo_section('testimonials', [
      'title'    => 'מה |אומרים עלינו| לקוחות',
      'show_all' => 1,
      'items'    => [],
    ]),

    nt_demo_section('contact', [
      'title' => 'יש לכם |שאלות?|',
      'lead'  => 'נשמח לדבר ולענות על כל מה שצריך.',
      'form'  => 0,
      'image' => 0,
    ]),
  ];
}

// ─── CONTACT ──────────────────────────────────────────────────────────
function nt_demo_fc_contact(): array {
  return [
    nt_demo_section('home_hero', [
      'title'    => 'נשמח |לשמוע מכם|',
      'lead'     => 'התייעצות ראשונית ללא עלות · מענה תוך יום עסקים',
      'features' => [['text' => 'בעברית'], ['text' => 'ללא עלות'], ['text' => 'מענה מהיר']],
      'video'    => '',
      'poster'   => 0,
      'cta'      => nt_demo_link('#contact-form', 'מלאו טופס'),
    ]),

    nt_demo_section('contact', [
      'title' => 'בואו |נתחיל| לתכנן',
      'lead'  => 'מלאו את הטופס ונחזור אליכם תוך יום עסקים.',
      'form'  => 0,
      'image' => 0,
    ]),

    nt_demo_section('tips', [
      'eyebrow' => 'לפני שמתחילים',
      'title'   => 'מה |חשוב לדעת| לפני שמתכננים',
      'lead'    => 'כמה שאלות שתעזור לכם לחשוב לפני שמדברים איתנו.',
      'tips'    => [
        ['title' => 'מתי אתם מתכננים לטוס?',  'description' => 'יפן עונתית מאוד — דובדבן באפריל, סתיו בנובמבר, שלג בינואר. כל עונה דורשת תכנון אחר.'],
        ['title' => 'כמה ימים יש לכם?',        'description' => '7 ימים מספיקים ל-2 ערים. 14 ימים מאפשרים מסלול עמוק יותר.'],
        ['title' => 'מה התקציב שלכם?',          'description' => 'יפן מציעה הכל — מ-Backpacker ועד יוקרה. שווה להגדיר טווח לפני שמתחילים.'],
        ['title' => 'מי הקבוצה שלכם?',          'description' => 'זוג? משפחה? חברים? לכל קבוצה יש מסלול אחר.'],
      ],
    ]),
  ];
}

// ─── WHY US (focused page) ────────────────────────────────────────────
function nt_demo_fc_why_us(): array {
  return [
    nt_demo_section('home_hero', [
      'title'    => 'למה |Ninja Tours?|',
      'lead'     => 'מה שמבדיל אותנו מסוכנויות נסיעות אחרות',
      'features' => [['text' => 'מומחים רק ליפן'], ['text' => 'ליווי בעברית'], ['text' => 'תכנון מותאם']],
      'video'    => '',
      'poster'   => 0,
      'cta'      => nt_demo_link('#contact', 'בואו נדבר'),
    ]),

    nt_demo_section('why_us', [
      'eyebrow' => 'יתרונות',
      'title'   => '5 סיבות |להתחיל| איתנו',
      'cards'   => [
        ['title' => 'צוות שחי ביפן',         'description' => 'הצוות שלנו חי ונושם יפן ומכיר כל פינה ופינה במדינה.'],
        ['title' => 'חוסכים טעויות וכסף',    'description' => 'המומחיות שלנו תחסוך לכם זמן יקר וטעויות מיותרות בדרך.'],
        ['title' => 'ליווי מלא בעברית',      'description' => 'אנחנו מלווים אתכם לאורך כל הטיול שלכם מרחוק.'],
        ['title' => 'מומחים רק ליפן',        'description' => 'אנחנו מתמחים אך ורק ביפן וזה מה שעושה את ההבדל.'],
        ['title' => 'סוגרים הכל במקום אחד',  'description' => 'טיסות, מלונות, רכבות ואטרקציות — הכל מסודר במקום אחד.'],
      ],
      'cta' => nt_demo_link('#contact', 'בואו נתחיל'),
    ]),

    nt_demo_section('process', [
      'title' => 'איך |זה עובד?|',
      'lead'  => '5 שלבים פשוטים לטיול שלכם',
      'steps' => [
        ['title' => 'שיחת היכרות',  'description' => 'מתחילים בלמידה — מי אתם, מה אתם אוהבים, מה אתם רוצים.', 'image' => 0],
        ['title' => 'תכנון',        'description' => 'אנחנו בונים מסלול ראשוני שמתאים בדיוק לכם.',          'image' => 0],
        ['title' => 'אישור',        'description' => 'מתאמים, משנים, מאשרים יחד.',                          'image' => 0],
        ['title' => 'הזמנות',       'description' => 'אנחנו מזמינים הכל — אתם רק מתכוננים לטיסה.',          'image' => 0],
        ['title' => 'תמיכה',         'description' => '24/7 לאורך כל הטיול — ובכל מצב.',                     'image' => 0],
      ],
      'cta' => nt_demo_link('#contact', 'אני מוכן/ה'),
    ]),

    nt_demo_section('testimonials', [
      'title'    => 'מה |אומרים עלינו|',
      'show_all' => 1,
      'items'    => [],
    ]),

    nt_demo_section('contact', [
      'title' => 'מוכנים |להתחיל?|',
      'lead'  => 'התייעצות ראשונה ללא עלות.',
      'form'  => 0,
      'image' => 0,
    ]),
  ];
}

// ─── DESTINATIONS overview page ───────────────────────────────────────
function nt_demo_fc_destinations(): array {
  return [
    nt_demo_section('home_hero', [
      'title'    => 'יעדים |פופולריים| ביפן',
      'lead'     => 'מהערים הגדולות ועד הכפרים הנסתרים — בחרו לאן לטוס',
      'features' => [],
      'video'    => '',
      'poster'   => 0,
      'cta'      => null,
    ]),

    nt_demo_section('destinations', [
      'title'    => 'כל ה|יעדים|',
      'lead'     => 'בחרו את היעד הראשון שלכם — או שלבו כמה יחד.',
      'show_all' => 1,
      'items'    => [],
      'cta'      => null,
    ]),

    nt_demo_section('attractions', [
      'title'        => 'אטרקציות |מומלצות| בכל יעד',
      'lead'         => 'בכל יעד יש את האייקונים — אנחנו דואגים לשלב אותם נכון',
      'show_all'     => 1,
      'show_filters' => 1,
      'items'        => [],
      'cta'          => nt_demo_link('/attractions/', 'לכל האטרקציות'),
    ]),

    nt_demo_section('contact', [
      'title' => 'איזה יעד |מתאים לכם?|',
      'lead'  => 'בואו נדבר ונבחר ביחד.',
      'form'  => 0,
      'image' => 0,
    ]),
  ];
}

/* ──────────────────────────────────────────────────────────────────────
 * Travel Type post → Flexible Content seed
 * ────────────────────────────────────────────────────────────────────── */

function nt_demo_seed_travel_type_flexible_content(array $cpt_ids): void {
  if (empty($cpt_ids['travel-type'])) return;

  // Seed the first travel-type with a full layout matching travel-type.html
  $first_id = $cpt_ids['travel-type'][0] ?? null;
  if (!$first_id) return;

  update_field('field_flexible_content', nt_demo_fc_travel_type_nature(), $first_id);
}

function nt_demo_fc_travel_type_nature(): array {
  return [
    nt_demo_section('travel_type_hero', [
      'eyebrow'      => 'סוג טיול',
      'title'        => 'טבע |ונופים| של יפן',
      'lead'         => 'נופים עוצרי נשימה שנראים כמו חלום — מהר פוג\'י המושלג ועד יערות הבמבו של קיוטו. טיול שבו הטבע הוא הכוכב הראשי.',
      'image'        => 0,
      'image_mobile' => 0,
      'cta'          => nt_demo_link('#contact', 'בואו נתכנן יחד'),
    ]),

    nt_demo_section('meta_strip', [
      'items' => [
        ['icon' => 0, 'label' => 'משך מומלץ',       'value' => '8–12 ימים'],
        ['icon' => 0, 'label' => 'יעדים מרכזיים',   'value' => '3 אזורים'],
        ['icon' => 0, 'label' => 'עונה אופטימלית',  'value' => 'אפריל / אוקטובר'],
        ['icon' => 0, 'label' => 'רמת קושי',         'value' => 'קל עד בינוני'],
      ],
    ]),

    nt_demo_section('about_with_sidebar', [
      'body' => '<h2>על סוג הטיול</h2>
        <p>טיול טבע ונופים ביפן הוא הרבה יותר מתמונות יפות. זו חוויה שמשלבת הרים מקודשים, יערות עתיקים שטופחו במשך מאות שנים, אגמי קריסטל המשקפים את פוג\'י, וכפרים שעדיין חיים בקצב של עונת השנה.</p>
        <p>המסלול שלנו לוקח אתכם מהעיר אל הטבע ובחזרה — שילוב מושלם בין נוחות לאותנטיות, בין צילומים אגדיים למקומות שלא תמצאו במדריכי תיירות.</p>
        <h2>מה כולל סוג הטיול</h2>
        <ul class="attraction-tips">
          <li><strong>הר פוג\'י ואגמי הרשת</strong> — החוויה האיקונית של יפן</li>
          <li><strong>יערות במבו קסומים</strong> — חוויה מדיטטיבית בארשייאמה</li>
          <li><strong>גנים יפניים מסורתיים</strong> — קינקאקו-ג\'י, ריוקאן-ג\'י, ריאן-ג\'י</li>
          <li><strong>כפרים עתיקים</strong> — שירקאווה-גו ומגה</li>
          <li><strong>לינה ברייוקאן</strong> — מלונות מסורתיים עם אונסן</li>
        </ul>
        <h2>למי הטיול הזה מתאים?</h2>
        <p>הטיול מתאים למטיילים שאוהבים שילוב של נופים מרהיבים, חוויות תרבותיות ועיר קצובה במידה. הוא לא דורש כושר גבוה — רוב המסלולים נגישים — אך כן דורש פתיחות לחוויות חדשות.</p>',
      'sidebar_title' => 'מידע על הטיול',
      'sidebar_items' => [
        ['icon' => 0, 'label' => 'משך מומלץ',       'value' => '8–12 ימים, מותאם לפי קצב'],
        ['icon' => 0, 'label' => 'יעדים מרכזיים',   'value' => 'פוג\'י, קיוטו, שירקאווה-גו'],
        ['icon' => 0, 'label' => 'עונה אופטימלית',  'value' => 'אפריל ואוקטובר–נובמבר'],
        ['icon' => 0, 'label' => 'רמת קושי',         'value' => 'קל עד בינוני, נגיש לרוב המטיילים'],
        ['icon' => 0, 'label' => 'קהל יעד',           'value' => 'זוגות, משפחות, חובבי טבע וצילום'],
      ],
      'sidebar_cta' => nt_demo_link('#contact', 'להתאמת טיול אישי'),
    ]),

    nt_demo_section('itinerary', [
      'title' => 'מסלול לדוגמה — |8 ימים|',
      'lead'  => 'נקודת פתיחה שמותאמת אישית לכל לקוח. ניתן לשנות, לקצר ולהרחיב לפי הצרכים שלכם.',
      'note'  => 'מסלול זה הוא השראה — כל טיול נבנה אישית בהתאם להעדפות.',
      'days'  => [
        [
          'image'    => 0,
          'day_num'  => '1–2',
          'location' => 'טוקיו',
          'title'    => 'הגעה והתאקלמות — גנים ואגמות בלב העיר',
          'desc'     => "אחרי הנחיתה — גן שינג'וקו-גיואן ואגמות ינאקה. ביום השני: פארק אאויאמה ושכונת הגנים של מגורו.",
          'tags'     => [['tag' => 'גנים עירוניים'], ['tag' => 'אגמות'], ['tag' => 'טיול רגלי']],
        ],
        [
          'image'    => 0,
          'day_num'  => '3–4',
          'location' => "אזור הר פוג'י",
          'title'    => "הר פוג'י ואגמי הרשת — הלב של הטיול",
          'desc'     => "יום שלישי: ביקור באגמות קאוואגוצ'יקו וסאיקו לצילומי השתקפות פוג'י. יום רביעי: עלייה לתחנת 5 או טיול חוף האגם. לינה ב-Ryokan עם נוף לפוג'י.",
          'tags'     => [['tag' => "הר פוג'י"], ['tag' => 'אגמות'], ['tag' => 'ריוקאן']],
        ],
        [
          'image'    => 0,
          'day_num'  => '5',
          'location' => 'שינקאנסן · נאגויה',
          'title'    => 'רכבת ענן — נסיעה לקיוטו דרך נאגויה',
          'desc'     => 'יום של נסיעה בשינקאנסן עם נוף חובק ארץ. עצירה אפשרית בנאגויה לצהריים ומפגש עם הטירה ההיסטורית.',
          'tags'     => [['tag' => 'שינקאנסן'], ['tag' => 'נוף פנורמי']],
        ],
        [
          'image'    => 0,
          'day_num'  => '6–8',
          'location' => 'קיוטו',
          'title'    => 'ארשייאמה, יערות במבו וגנים עתיקים',
          'desc'     => "שלושה ימים בקיוטו: יער הבמבו של ארשייאמה, גן קינקאקו-ג'י, גן הסלעים ריוקאן-ג'י, ומסלול ה-Philosopher's Path. ביום האחרון — קניות ואוכל ברחוב ניישיקי.",
          'tags'     => [['tag' => 'יער במבו'], ['tag' => 'גנים יפניים'], ['tag' => 'מסלולי טבע'], ['tag' => 'מקדשים']],
        ],
      ],
    ]),

    nt_demo_section('tips', [
      'eyebrow' => 'טיפים',
      'title'   => 'מה |שיעשה את ההבדל| בטיול',
      'lead'    => 'מה שחשוב לדעת לפני שיוצאים לטיול טבע ביפן — מהזמנים הנכונים ועד הטיפים הקטנים שהופכים את החוויה למיוחדת.',
      'tips'    => [
        ['icon' => 0, 'title' => 'הגיעו בשעות הבוקר המוקדמות',     'description' => "יער הבמבו ואגמות פוג'י נראים שונה לחלוטין בין 6:00–8:00 לפני שמגיעים ההמונים. זה גם הזמן שבו האור הכי יפה והתמונות הכי טובות."],
        ['icon' => 0, 'title' => 'אביב ואוקטובר — העונות הכי טובות', 'description' => 'פריחת הדובדבן באפריל ועלי הסתיו של נובמבר הם שיאי הטיול. ספטמבר–אוקטובר גם נהדרים. הימנעו מיולי-אוגוסט שחמים ולחים.'],
        ['icon' => 0, 'title' => 'לינה ברייוקאן — לפחות לילה אחד',   'description' => 'חוויית הלינה ברייוקאן יפני מסורתי עם יוקאטה, אמבט אונסן וארוחה קייסקי — חלק בלתי נפרד מטיול טבע אמיתי ביפן.'],
        ['icon' => 0, 'title' => 'הזמינו מראש — הר פוג\'י מתמלא מהר', 'description' => 'כניסה לנתיב העלייה של הר פוג\'י (עונת קיץ) דורשת הרשמה מראש. ריוקאנים עם נוף לפוג\'י נסגרים חודשים מראש בעונות שיא.'],
      ],
    ]),

    nt_demo_section('attractions', [
      'title'        => 'אטרקציות |טבע| מומלצות',
      'lead'         => 'מקומות שכדאי לשלב בטיול הטבע שלכם ביפן',
      'show_all'     => 1,
      'show_filters' => 0,
      'items'        => [],
      'cta'          => null,
    ]),

    nt_demo_section('why_us', [
      'eyebrow' => 'למה אנחנו',
      'title'   => 'למה לתכנן |איתנו| את הטיול ליפן?',
      'cards'   => [
        ['title' => 'צוות שחי ביפן',         'description' => 'הצוות שלנו חי ונושם יפן ומכיר כל פינה ופינה במדינה.'],
        ['title' => 'חוסכים טעויות וכסף',    'description' => 'המומחיות שלנו תחסוך לכם זמן יקר וטעויות מיותרות בדרך.'],
        ['title' => 'ליווי מלא בעברית',      'description' => 'אנחנו מלווים אתכם לאורך כל הטיול שלכם מרחוק.'],
        ['title' => 'מומחים רק ליפן',        'description' => 'אנחנו מתמחים אך ורק ביפן וזה מה שעושה את ההבדל.'],
        ['title' => 'סוגרים הכל במקום אחד',  'description' => 'טיסות, מלונות, רכבות ואטרקציות — הכל מסודר במקום אחד.'],
      ],
      'cta' => nt_demo_link('#contact', 'בואו נתחיל'),
    ]),

    nt_demo_section('contact', [
      'title' => 'מוכנים לטיול של |פעם בחיים?|',
      'lead'  => 'בואו נתחיל לתכנן את יפן שלכם, בדיוק כמו שחלמתם.',
      'form'  => 0,
      'image' => 0,
    ]),
  ];
}

/* ──────────────────────────────────────────────────────────────────────
 * Taxonomy terms — categories so filter tabs/dropdowns aren't empty
 * ────────────────────────────────────────────────────────────────────── */

function nt_demo_seed_taxonomy_terms(array $cpt_ids): void {

  // Attraction categories — and assign each demo attraction to one
  $attraction_cats = ['מקדשים', 'פארקים וגנים', 'תרבות וחוויות', 'נופים', 'קניות ואוכל'];
  foreach ($attraction_cats as $name) {
    if (!term_exists($name, 'attraction-category')) {
      wp_insert_term($name, 'attraction-category');
    }
  }

  $attraction_assignments = [
    'מקדש פושימי אינארי' => 'מקדשים',
    'יער הבמבו ארשייאמה' => 'נופים',
    "הר פוג'י"           => 'נופים',
    "גן קינקאקו-ג'י"     => 'פארקים וגנים',
    'שיבויה קרוסינג'     => 'קניות ואוכל',
    "מקדש סנסו-ג'י"      => 'מקדשים',
  ];
  foreach ($cpt_ids['attraction'] ?? [] as $id) {
    $title = get_the_title($id);
    if (!isset($attraction_assignments[$title])) continue;
    $term = get_term_by('name', $attraction_assignments[$title], 'attraction-category');
    if ($term) wp_set_post_terms($id, [$term->term_id], 'attraction-category');
  }

  // Hotel cities + audiences
  $hotel_cities    = ['טוקיו', 'קיוטו', 'אוסקה'];
  $hotel_audiences = ['משפחות', 'זוגות', 'יוקרה', 'תקציב'];
  foreach ($hotel_cities    as $n) if (!term_exists($n, 'hotel-city'))     wp_insert_term($n, 'hotel-city');
  foreach ($hotel_audiences as $n) if (!term_exists($n, 'hotel-audience')) wp_insert_term($n, 'hotel-audience');

  $hotel_assignments = [
    'Park Hyatt Tokyo'        => ['city' => 'טוקיו', 'audience' => 'יוקרה'],
    'The Ritz-Carlton Kyoto'  => ['city' => 'קיוטו', 'audience' => 'יוקרה'],
    'Conrad Osaka'            => ['city' => 'אוסקה', 'audience' => 'יוקרה'],
    'Hoshinoya Tokyo'         => ['city' => 'טוקיו', 'audience' => 'זוגות'],
  ];
  foreach ($cpt_ids['hotel'] ?? [] as $id) {
    $title = get_the_title($id);
    if (!isset($hotel_assignments[$title])) continue;
    $cfg = $hotel_assignments[$title];
    if ($t = get_term_by('name', $cfg['city'],     'hotel-city'))     wp_set_post_terms($id, [$t->term_id], 'hotel-city');
    if ($t = get_term_by('name', $cfg['audience'], 'hotel-audience')) wp_set_post_terms($id, [$t->term_id], 'hotel-audience');
  }

  // Use case taxonomies
  $audiences = ['משפחות', 'זוגות', 'חברים', 'מבוגרים'];
  $tags      = ['תרבות', 'טבע', 'חיי לילה', 'ירח דבש', 'אוכל'];
  $lengths   = ['קצר (עד 7 ימים)', 'בינוני (8–12 ימים)', 'ארוך (13+ ימים)'];

  foreach ($audiences as $n) if (!term_exists($n, 'trip-audience')) wp_insert_term($n, 'trip-audience');
  foreach ($tags      as $n) if (!term_exists($n, 'trip-tag'))      wp_insert_term($n, 'trip-tag');
  foreach ($lengths   as $n) if (!term_exists($n, 'trip-length'))   wp_insert_term($n, 'trip-length');

  $uc_taxonomies = [
    'משפחת כהן ביפן — 10 ימים' => ['trip-audience' => 'משפחות', 'trip-length' => 'בינוני (8–12 ימים)', 'trip-tag' => ['תרבות']],
    'ירח דבש בקיוטו'           => ['trip-audience' => 'זוגות',  'trip-length' => 'קצר (עד 7 ימים)',     'trip-tag' => ['ירח דבש', 'תרבות']],
    'חבורת חברים — חיי לילה ב-3 ערים' => ['trip-audience' => 'חברים', 'trip-length' => 'בינוני (8–12 ימים)', 'trip-tag' => ['חיי לילה', 'אוכל']],
    'טיול תרבות מותאם — צוות ונופית' => ['trip-audience' => 'מבוגרים', 'trip-length' => 'ארוך (13+ ימים)', 'trip-tag' => ['תרבות']],
  ];
  foreach ($cpt_ids['use-case'] ?? [] as $id) {
    $title = get_the_title($id);
    if (!isset($uc_taxonomies[$title])) continue;
    $cfg = $uc_taxonomies[$title];
    foreach ($cfg as $tax => $term_names) {
      $names = (array) $term_names;
      $term_ids = [];
      foreach ($names as $n) {
        if ($t = get_term_by('name', $n, $tax)) $term_ids[] = $t->term_id;
      }
      if ($term_ids) wp_set_post_terms($id, $term_ids, $tax);
    }
  }

  // Travel regions for destinations
  $regions = ['קאנטו', 'קאנסאי', 'הוקאידו'];
  foreach ($regions as $n) if (!term_exists($n, 'travel-region')) wp_insert_term($n, 'travel-region');
  $dest_regions = [
    'טוקיו'   => 'קאנטו',
    'קיוטו'   => 'קאנסאי',
    'אוסקה'   => 'קאנסאי',
    'הוקאידו' => 'הוקאידו',
  ];
  foreach ($cpt_ids['destination'] ?? [] as $id) {
    $title = get_the_title($id);
    if (!isset($dest_regions[$title])) continue;
    if ($t = get_term_by('name', $dest_regions[$title], 'travel-region')) {
      wp_set_post_terms($id, [$t->term_id], 'travel-region');
    }
  }
}

/* ──────────────────────────────────────────────────────────────────────
 * General Settings — site-wide defaults
 * ────────────────────────────────────────────────────────────────────── */

function nt_demo_seed_general_settings(): void {
  // Header CTA — sensible default linking to the contact section
  if (!get_field('general_header_cta', 'options')) {
    update_field('field_general_header_cta', nt_demo_link('#contact', 'בואו נתחיל'), 'options');
  }
  if (!get_field('general_email', 'options')) {
    update_field('field_general_email', 'info@ninjatours.co.il', 'options');
  }
  if (!get_field('general_footer_copy', 'options')) {
    update_field('field_general_footer_copy', 'כל הזכויות שמורות לנינג\'ה טורס', 'options');
  }
  if (!get_field('general_footer_credit', 'options')) {
    update_field('field_general_footer_credit', 'Design & Code by Elevate', 'options');
  }
}

/* ──────────────────────────────────────────────────────────────────────
 * Default nav menus — Header 1, Header 2, Footer
 * ────────────────────────────────────────────────────────────────────── */

function nt_demo_create_menus(array $page_ids = []): void {
  $locations = get_theme_mod('nav_menu_locations', []);

  // Header Menu 1 — start side (CPT archives)
  if (!wp_get_nav_menu_object('Header Menu 1')) {
    $id = wp_create_nav_menu('Header Menu 1');
    wp_update_nav_menu_item($id, 0, ['menu-item-title' => 'יעדים',     'menu-item-url' => get_post_type_archive_link('destination'), 'menu-item-status' => 'publish']);
    wp_update_nav_menu_item($id, 0, ['menu-item-title' => 'מלונות',    'menu-item-url' => get_post_type_archive_link('hotel'),       'menu-item-status' => 'publish']);
    wp_update_nav_menu_item($id, 0, ['menu-item-title' => 'אטרקציות',  'menu-item-url' => get_post_type_archive_link('attraction'),  'menu-item-status' => 'publish']);
    wp_update_nav_menu_item($id, 0, ['menu-item-title' => 'סוגי טיולים','menu-item-url' => get_post_type_archive_link('travel-type'),'menu-item-status' => 'publish']);
    $locations['header_menu_1'] = $id;
  }

  // Header Menu 2 — end side (story / contact)
  if (!wp_get_nav_menu_object('Header Menu 2')) {
    $id = wp_create_nav_menu('Header Menu 2');
    if (!empty($page_ids['about'])) {
      wp_update_nav_menu_item($id, 0, ['menu-item-title' => 'אודות',     'menu-item-object-id' => $page_ids['about'],   'menu-item-object' => 'page', 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish']);
    }
    if (!empty($page_ids['why-us'])) {
      wp_update_nav_menu_item($id, 0, ['menu-item-title' => 'למה אנחנו', 'menu-item-object-id' => $page_ids['why-us'],  'menu-item-object' => 'page', 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish']);
    }
    if (!empty($page_ids['contact'])) {
      wp_update_nav_menu_item($id, 0, ['menu-item-title' => 'יצירת קשר', 'menu-item-object-id' => $page_ids['contact'], 'menu-item-object' => 'page', 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish']);
    }
    $locations['header_menu_2'] = $id;
  }

  // Footer
  if (!wp_get_nav_menu_object('Footer Menu')) {
    $id = wp_create_nav_menu('Footer Menu');
    wp_update_nav_menu_item($id, 0, ['menu-item-title' => 'יעדים',    'menu-item-url' => get_post_type_archive_link('destination'), 'menu-item-status' => 'publish']);
    wp_update_nav_menu_item($id, 0, ['menu-item-title' => 'מלונות',   'menu-item-url' => get_post_type_archive_link('hotel'),       'menu-item-status' => 'publish']);
    wp_update_nav_menu_item($id, 0, ['menu-item-title' => 'אטרקציות', 'menu-item-url' => get_post_type_archive_link('attraction'),  'menu-item-status' => 'publish']);
    if (!empty($page_ids['about']))   wp_update_nav_menu_item($id, 0, ['menu-item-title' => 'אודות',     'menu-item-object-id' => $page_ids['about'],   'menu-item-object' => 'page', 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish']);
    if (!empty($page_ids['contact'])) wp_update_nav_menu_item($id, 0, ['menu-item-title' => 'יצירת קשר', 'menu-item-object-id' => $page_ids['contact'], 'menu-item-object' => 'page', 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish']);
    $locations['footer_menu'] = $id;
  }

  set_theme_mod('nav_menu_locations', $locations);
}

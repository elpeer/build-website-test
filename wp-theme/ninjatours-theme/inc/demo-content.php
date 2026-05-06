<?php
/**
 * Demo content installer.
 *
 * Runs once on theme activation. Creates:
 *   - Default WP pages (Home, About, Contact, Blog) using the FC template
 *   - Sets the homepage (page_on_front) and posts page (page_for_posts)
 *   - A small set of demo CPT posts (3 destinations, 4 attractions, etc.)
 *   - Header and footer nav menus assigned to the right locations
 *   - Default General Settings (logo, social URLs)
 *
 * Once run, sets a flag in options so it doesn't re-run on every activation.
 * To re-trigger manually: delete the `nt_demo_installed` option in the DB.
 */

add_action('after_switch_theme', 'nt_install_demo_content');

function nt_install_demo_content(): void {
  if (get_option('nt_demo_installed')) return;

  // Defer until ACF/CPTs are registered
  add_action('init', function () {
    if (get_option('nt_demo_installed')) return;
    nt_demo_create_pages();
    nt_demo_create_cpt_posts();
    nt_demo_create_menus();
    update_option('nt_demo_installed', current_time('mysql'));
  }, 100);
}

// ─── Pages ─────────────────────────────────────────────────────────────────
function nt_demo_create_pages(): void {
  $template = 'views/page-flexible-content.php';

  $pages = [
    'home'         => ['title' => 'Home',          'slug' => 'home'],
    'about'        => ['title' => 'אודות',         'slug' => 'about'],
    'contact'      => ['title' => 'יצירת קשר',     'slug' => 'contact'],
    'blog'         => ['title' => 'בלוג',          'slug' => 'blog'],
  ];

  $created_ids = [];

  foreach ($pages as $key => $info) {
    $existing = get_page_by_path($info['slug']);
    if ($existing) {
      $created_ids[$key] = $existing->ID;
      continue;
    }

    $id = wp_insert_post([
      'post_title'     => $info['title'],
      'post_name'      => $info['slug'],
      'post_status'    => 'publish',
      'post_type'      => 'page',
      'page_template'  => $template,
      'post_content'   => '',
    ]);
    if (!is_wp_error($id)) $created_ids[$key] = $id;
  }

  // Reading settings: static front page = Home, posts page = Blog
  if (!empty($created_ids['home'])) {
    update_option('show_on_front', 'page');
    update_option('page_on_front', $created_ids['home']);
  }
  if (!empty($created_ids['blog'])) {
    update_option('page_for_posts', $created_ids['blog']);
  }
}

// ─── CPT demo posts ────────────────────────────────────────────────────────
function nt_demo_create_cpt_posts(): void {

  $samples = [
    'destination' => [
      ['title' => 'טוקיו',  'excerpt' => 'בירת יפן — שילוב של עיר עתיק-מודרנית, מקדשים ומסעדות מיכלן.'],
      ['title' => 'קיוטו',  'excerpt' => 'עיר הבירה ההיסטורית — גנים יפניים, מקדשים ויערות במבו.'],
      ['title' => 'אוסקה',  'excerpt' => 'בירת האוכל של יפן — שווקים תוססים, חיי לילה וטירת אוסקה.'],
    ],
    'attraction' => [
      ['title' => 'מקדש פושימי אינארי',  'excerpt' => 'אלפי שערי טורי אדומים על פני הר אינארי בקיוטו.'],
      ['title' => 'יער הבמבו ארשייאמה',  'excerpt' => 'מסלול הליכה קסום בין הבמבו של ארשייאמה.'],
      ['title' => "הר פוג'י",             'excerpt' => 'הסמל האייקוני של יפן, בגובה 3,776 מטרים.'],
      ['title' => "גן קינקאקו-ג'י",       'excerpt' => 'מקדש הזהב — אחד מהמקדשים היפים ביותר בקיוטו.'],
    ],
    'hotel' => [
      ['title' => 'Park Hyatt Tokyo',     'excerpt' => 'מלון יוקרתי במגדל הענק של שינג\'וקו.'],
      ['title' => 'The Ritz-Carlton Kyoto', 'excerpt' => 'יוקרה על נהר קאמו בלב קיוטו.'],
      ['title' => 'Conrad Osaka',          'excerpt' => 'מלון מודרני עם נוף עוצר נשימה לעיר.'],
    ],
    'use-case' => [
      ['title' => 'משפחת כהן ביפן — 10 ימים', 'excerpt' => 'טיול משפחתי בין טוקיו, אוסקה וקיוטו עם ילדים.'],
      ['title' => 'ירח דבש בקיוטו', 'excerpt' => "שבוע רומנטי בין מקדשים, ריוקאן ובוקר עם פוג'י."],
      ['title' => 'חבורת חברים — חיי לילה ב-3 ערים', 'excerpt' => '12 ימים אינטנסיביים בטוקיו, אוסקה והוקאידו.'],
    ],
    'travel-type' => [
      ['title' => 'טבע ונופים',     'excerpt' => 'נופים עוצרי נשימה — הר פוג\'י, יערות הבמבו, גנים עתיקים.'],
      ['title' => 'תרבות ומסורת',   'excerpt' => 'חוויה של התרבות היפנית מקרוב — מקדשים, גיישות, טקסי תה.'],
      ['title' => 'ערים תוססות',    'excerpt' => 'חיי לילה, שופינג ואורבניות — טוקיו, אוסקה, יוקוהמה.'],
      ['title' => 'שילוב מושלם',    'excerpt' => 'טיולים, אטרקציות ובין לבין — הטוב משני העולמות.'],
    ],
    'client-review' => [
      ['title' => 'שלומית ר.', 'excerpt' => 'הטיול היה חוויה של פעם בחיים. הצוות חשב על כל פרט.'],
      ['title' => 'אבי ל.',    'excerpt' => 'תכנון מדויק, ליווי מלא — לא היו הפתעות לא נעימות.'],
      ['title' => 'יעל וניר',  'excerpt' => 'ירח הדבש המושלם. ממליצים בחום!'],
    ],
  ];

  foreach ($samples as $cpt => $items) {
    foreach ($items as $item) {
      $existing = get_page_by_title($item['title'], OBJECT, $cpt);
      if ($existing) continue;

      $id = wp_insert_post([
        'post_type'    => $cpt,
        'post_title'   => $item['title'],
        'post_excerpt' => $item['excerpt'],
        'post_content' => $item['excerpt'],
        'post_status'  => 'publish',
      ]);

      if ($cpt === 'client-review' && !is_wp_error($id)) {
        update_field('text', $item['excerpt'], $id);
        update_field('name', $item['title'],   $id);
        update_field('rating', 5, $id);
      }
    }
  }
}

// ─── Default nav menus ─────────────────────────────────────────────────────
function nt_demo_create_menus(): void {
  $locations = get_theme_mod('nav_menu_locations', []);

  // Header Menu 1 (start side)
  $menu1 = wp_get_nav_menu_object('Header Menu 1');
  if (!$menu1) {
    $menu1_id = wp_create_nav_menu('Header Menu 1');
    wp_update_nav_menu_item($menu1_id, 0, ['menu-item-title' => 'יעדים',     'menu-item-url' => get_post_type_archive_link('destination'), 'menu-item-status' => 'publish']);
    wp_update_nav_menu_item($menu1_id, 0, ['menu-item-title' => 'מלונות',    'menu-item-url' => get_post_type_archive_link('hotel'),       'menu-item-status' => 'publish']);
    wp_update_nav_menu_item($menu1_id, 0, ['menu-item-title' => 'אטרקציות',  'menu-item-url' => get_post_type_archive_link('attraction'),  'menu-item-status' => 'publish']);
    wp_update_nav_menu_item($menu1_id, 0, ['menu-item-title' => 'סוגי טיולים','menu-item-url' => get_post_type_archive_link('travel-type'),'menu-item-status' => 'publish']);
    $locations['header_menu_1'] = $menu1_id;
  }

  // Header Menu 2 (end side)
  $menu2 = wp_get_nav_menu_object('Header Menu 2');
  if (!$menu2) {
    $menu2_id = wp_create_nav_menu('Header Menu 2');
    $about    = get_page_by_path('about');
    $contact  = get_page_by_path('contact');
    if ($about)   wp_update_nav_menu_item($menu2_id, 0, ['menu-item-title' => 'אודות',     'menu-item-object-id' => $about->ID,   'menu-item-object' => 'page', 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish']);
    if ($contact) wp_update_nav_menu_item($menu2_id, 0, ['menu-item-title' => 'יצירת קשר', 'menu-item-object-id' => $contact->ID, 'menu-item-object' => 'page', 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish']);
    $locations['header_menu_2'] = $menu2_id;
  }

  // Footer menu
  $footer = wp_get_nav_menu_object('Footer Menu');
  if (!$footer) {
    $footer_id = wp_create_nav_menu('Footer Menu');
    wp_update_nav_menu_item($footer_id, 0, ['menu-item-title' => 'יעדים',    'menu-item-url' => get_post_type_archive_link('destination'), 'menu-item-status' => 'publish']);
    wp_update_nav_menu_item($footer_id, 0, ['menu-item-title' => 'מלונות',   'menu-item-url' => get_post_type_archive_link('hotel'),       'menu-item-status' => 'publish']);
    wp_update_nav_menu_item($footer_id, 0, ['menu-item-title' => 'אטרקציות', 'menu-item-url' => get_post_type_archive_link('attraction'),  'menu-item-status' => 'publish']);
    $locations['footer_menu'] = $footer_id;
  }

  set_theme_mod('nav_menu_locations', $locations);
}

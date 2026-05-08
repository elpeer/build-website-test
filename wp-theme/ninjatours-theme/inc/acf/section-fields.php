<?php
/**
 * Per-section content-field factories.
 *
 * Each `nt_section_<name>_fields()` returns the layout's content fields —
 * NOT including the wrapper (use_general_settings / hide_section / section_id).
 * The wrapper is added via `nt_layout_subfields()` in helpers.php.
 *
 * The same fields are reused in two places:
 *   1. Inline on each page (inside the flexible_content layout)
 *   2. Mirrored on General Settings → Sections Content (the global default)
 *
 * Editor convention: titles use the |word| accent syntax (rendered via
 * `nt_render_title()`). Long copy uses textarea or wysiwyg.
 */

// ─── Home Hero ─────────────────────────────────────────────────────────────
function nt_section_home_hero_fields(): array {
  $k = 'fld_home_hero_';
  return [
    nt_field_title($k, 'כותרת', 'מילה בתוך |...| תהפוך לאדומה.'),
    nt_field_lead($k, 'תת-כותרת'),
    [
      'key'   => $k . 'features',
      'label' => 'תגיות',
      'name'  => 'features',
      'type'  => 'repeater',
      'layout' => 'table',
      'min'   => 0,
      'max'   => 5,
      'sub_fields' => [
        [
          'key'   => $k . 'feature_text',
          'label' => 'טקסט',
          'name'  => 'text',
          'type'  => 'text',
        ],
      ],
    ],
    [
      'key'           => $k . 'video',
      'label'         => 'סרטון רקע (mp4)',
      'name'          => 'video',
      'type'          => 'file',
      'return_format' => 'url',
      'mime_types'    => 'mp4,webm',
    ],
    nt_field_image($k, 'תמונת רקע / Poster', 'poster'),
    nt_field_link($k, 'כפתור CTA'),
  ];
}

// ─── Why Us ────────────────────────────────────────────────────────────────
function nt_section_why_us_fields(): array {
  $k = 'fld_why_us_';
  return [
    [
      'key'   => $k . 'eyebrow',
      'label' => 'Eyebrow',
      'name'  => 'eyebrow',
      'type'  => 'text',
      'default_value' => 'למה אנחנו',
    ],
    nt_field_title($k),
    [
      'key'   => $k . 'cards',
      'label' => 'כרטיסיות',
      'name'  => 'cards',
      'type'  => 'repeater',
      'layout' => 'block',
      'min'   => 1,
      'max'   => 6,
      'sub_fields' => [
        nt_field_image($k . 'card', 'אייקון', 'icon'),
        [
          'key'   => $k . 'card_title',
          'label' => 'כותרת',
          'name'  => 'title',
          'type'  => 'text',
        ],
        [
          'key'   => $k . 'card_desc',
          'label' => 'תיאור',
          'name'  => 'description',
          'type'  => 'textarea',
          'rows'  => 2,
        ],
      ],
    ],
    nt_field_link($k),
  ];
}

// ─── Trip Types (uses CPT travel-type) ─────────────────────────────────────
function nt_section_trip_types_fields(): array {
  $k = 'fld_trip_types_';
  return [
    nt_field_title($k),
    nt_field_lead($k),
    nt_field_show_all_toggle($k),
    nt_field_relation($k, 'travel-type', 'סוגי טיולים לבחירה ידנית'),
  ];
}

// ─── Attractions ───────────────────────────────────────────────────────────
function nt_section_attractions_fields(): array {
  $k = 'fld_attractions_';
  return [
    nt_field_title($k),
    nt_field_lead($k),
    nt_field_show_all_toggle($k),
    nt_field_relation($k, 'attraction', 'אטרקציות לבחירה ידנית'),
    [
      'key'           => $k . 'show_filters',
      'label'         => 'הצג טאבים לסינון לפי קטגוריה',
      'name'          => 'show_filters',
      'type'          => 'true_false',
      'ui'            => 1,
      'default_value' => 1,
    ],
    nt_field_link($k, 'כפתור — לכל האטרקציות', 'cta'),
  ];
}

// ─── Destinations ──────────────────────────────────────────────────────────
function nt_section_destinations_fields(): array {
  $k = 'fld_destinations_';
  return [
    nt_field_title($k),
    nt_field_lead($k),
    nt_field_show_all_toggle($k),
    nt_field_relation($k, 'destination', 'יעדים לבחירה ידנית'),
    nt_field_link($k, 'כפתור — לכל היעדים', 'cta'),
  ];
}

// ─── Use Cases ─────────────────────────────────────────────────────────────
function nt_section_use_cases_fields(): array {
  $k = 'fld_use_cases_';
  return [
    nt_field_title($k),
    nt_field_lead($k),
    nt_field_show_all_toggle($k),
    nt_field_relation($k, 'use-case', 'Use Cases לבחירה ידנית'),
  ];
}

// ─── Testimonials / Client Reviews ─────────────────────────────────────────
function nt_section_testimonials_fields(): array {
  $k = 'fld_testimonials_';
  return [
    nt_field_title($k),
    nt_field_show_all_toggle($k),
    nt_field_relation($k, 'client-review', 'המלצות לבחירה ידנית'),
  ];
}

// ─── Process (numbered timeline) ───────────────────────────────────────────
function nt_section_process_fields(): array {
  $k = 'fld_process_';
  return [
    nt_field_title($k),
    nt_field_lead($k),
    [
      'key'   => $k . 'steps',
      'label' => 'שלבים',
      'name'  => 'steps',
      'type'  => 'repeater',
      'layout' => 'block',
      'min'   => 1,
      'max'   => 8,
      'sub_fields' => [
        nt_field_image($k . 'step'),
        [
          'key'   => $k . 'step_title',
          'label' => 'כותרת השלב',
          'name'  => 'title',
          'type'  => 'text',
        ],
        [
          'key'   => $k . 'step_desc',
          'label' => 'תיאור',
          'name'  => 'description',
          'type'  => 'textarea',
          'rows'  => 3,
        ],
      ],
    ],
    nt_field_link($k),
  ];
}

// ─── Partners (logo marquee) ───────────────────────────────────────────────
function nt_section_partners_fields(): array {
  $k = 'fld_partners_';
  return [
    nt_field_title($k),
    nt_field_lead($k),
    [
      'key'           => $k . 'logos_row_1',
      'label'         => 'שורת לוגואים — 1',
      'name'          => 'logos_row_1',
      'type'          => 'gallery',
      'return_format' => 'id',
      'preview_size'  => 'thumbnail',
    ],
    [
      'key'           => $k . 'logos_row_2',
      'label'         => 'שורת לוגואים — 2',
      'name'          => 'logos_row_2',
      'type'          => 'gallery',
      'return_format' => 'id',
      'preview_size'  => 'thumbnail',
    ],
  ];
}

// ─── Contact (form + image) ────────────────────────────────────────────────
function nt_section_contact_fields(): array {
  $k = 'fld_contact_';
  return [
    nt_field_title($k),
    nt_field_lead($k),
    [
      'key'           => $k . 'form',
      'label'         => 'טופס Contact Form 7',
      'name'          => 'form',
      'type'          => 'post_object',
      'post_type'     => ['wpcf7_contact_form'],
      'return_format' => 'object',
      'allow_null'    => 1,
    ],
    nt_field_image($k, 'תמונה ליד הטופס'),
  ];
}

// ─── Content + Media (about-style two-column) ─────────────────────────────
function nt_section_content_media_fields(): array {
  $k = 'fld_content_media_';
  return [
    nt_field_title($k),
    [
      'key'        => $k . 'content',
      'label'      => 'תוכן',
      'name'       => 'content',
      'type'       => 'wysiwyg',
      'tabs'       => 'visual',
      'toolbar'    => 'basic',
      'media_upload' => 0,
    ],
    nt_field_image($k),
    nt_field_link($k, 'כפתור CTA', 'button'),
    [
      'key'           => $k . 'reverse',
      'label'         => 'הפוך סדר (תמונה משמאל)',
      'name'          => 'reverse',
      'type'          => 'true_false',
      'ui'            => 1,
      'default_value' => 0,
    ],
  ];
}

// ─── Image Separator (full-bleed image divider) ────────────────────────────
function nt_section_image_separator_fields(): array {
  $k = 'fld_image_separator_';
  return [
    nt_field_image($k, 'תמונת מפריד'),
    nt_field_image($k, 'תמונת מפריד — מובייל', 'image_mobile'),
  ];
}

// ─── Travel-type Hero (for travel-type singles) ────────────────────────────
function nt_section_travel_type_hero_fields(): array {
  $k = 'fld_tt_hero_';
  return [
    [
      'key'   => $k . 'eyebrow',
      'label' => 'תגית מעל הכותרת',
      'name'  => 'eyebrow',
      'type'  => 'text',
      'default_value' => 'סוג טיול',
    ],
    nt_field_title($k),
    nt_field_lead($k),
    nt_field_image($k, 'תמונת רקע'),
    nt_field_image($k, 'תמונת רקע — מובייל', 'image_mobile'),
    nt_field_link($k, 'כפתור CTA'),
  ];
}

// ─── Meta Strip (4 quick-fact icons) ───────────────────────────────────────
function nt_section_meta_strip_fields(): array {
  $k = 'fld_meta_strip_';
  return [
    [
      'key'        => $k . 'items',
      'label'      => 'פרטים',
      'name'       => 'items',
      'type'       => 'repeater',
      'layout'     => 'table',
      'min'        => 1,
      'max'        => 6,
      'sub_fields' => [
        [
          'key'   => $k . 'icon',
          'label' => 'אייקון (SVG עדיף)',
          'name'  => 'icon',
          'type'  => 'image',
          'return_format' => 'id',
        ],
        ['key' => $k . 'label', 'label' => 'תווית',  'name' => 'label', 'type' => 'text'],
        ['key' => $k . 'value', 'label' => 'ערך',    'name' => 'value', 'type' => 'text'],
      ],
    ],
  ];
}

// ─── About / Sidebar layout (used on attraction-detail / hotel-detail) ────
function nt_section_about_with_sidebar_fields(): array {
  $k = 'fld_about_sidebar_';
  return [
    [
      'key'     => $k . 'body',
      'label'   => 'גוף הטקסט',
      'name'    => 'body',
      'type'    => 'wysiwyg',
      'toolbar' => 'basic',
    ],
    [
      'key'     => $k . 'sidebar_title',
      'label'   => 'כותרת סיידבר',
      'name'    => 'sidebar_title',
      'type'    => 'text',
      'default_value' => 'מידע שימושי',
    ],
    [
      'key'        => $k . 'sidebar_items',
      'label'      => 'פריטי מידע',
      'name'       => 'sidebar_items',
      'type'       => 'repeater',
      'layout'     => 'block',
      'sub_fields' => [
        ['key' => $k . 'sb_icon',  'label' => 'אייקון', 'name' => 'icon',  'type' => 'image', 'return_format' => 'id', 'preview_size' => 'thumbnail'],
        ['key' => $k . 'sb_label', 'label' => 'תווית',   'name' => 'label', 'type' => 'text'],
        ['key' => $k . 'sb_value', 'label' => 'ערך',     'name' => 'value', 'type' => 'text'],
      ],
    ],
    nt_field_link($k, 'CTA סיידבר', 'sidebar_cta'),
  ];
}

// ─── Itinerary (day-by-day) ────────────────────────────────────────────────
function nt_section_itinerary_fields(): array {
  $k = 'fld_itinerary_';
  return [
    nt_field_title($k),
    nt_field_lead($k),
    [
      'key'   => $k . 'note',
      'label' => 'הערה',
      'name'  => 'note',
      'type'  => 'text',
      'default_value' => 'מסלול זה הוא השראה — כל טיול נבנה אישית',
    ],
    [
      'key'        => $k . 'days',
      'label'      => 'ימים',
      'name'       => 'days',
      'type'       => 'repeater',
      'layout'     => 'block',
      'min'        => 1,
      'sub_fields' => [
        nt_field_image($k . 'day'),
        ['key' => $k . 'day_num',      'label' => 'מספר יום (לדוגמה: 1–2)', 'name' => 'day_num',  'type' => 'text'],
        ['key' => $k . 'day_location', 'label' => 'מיקום',                  'name' => 'location', 'type' => 'text'],
        ['key' => $k . 'day_title',    'label' => 'כותרת היום',             'name' => 'title',    'type' => 'text'],
        ['key' => $k . 'day_desc',     'label' => 'תיאור',                   'name' => 'desc',     'type' => 'textarea', 'rows' => 3],
        [
          'key'   => $k . 'day_tags',
          'label' => 'תגיות',
          'name'  => 'tags',
          'type'  => 'repeater',
          'layout' => 'table',
          'sub_fields' => [
            ['key' => $k . 'day_tag', 'label' => 'תגית', 'name' => 'tag', 'type' => 'text'],
          ],
        ],
      ],
    ],
  ];
}

// ─── Tips (4 tip cards with icons) ─────────────────────────────────────────
function nt_section_tips_fields(): array {
  $k = 'fld_tips_';
  return [
    [
      'key'   => $k . 'eyebrow',
      'label' => 'Eyebrow',
      'name'  => 'eyebrow',
      'type'  => 'text',
      'default_value' => 'טיפים',
    ],
    nt_field_title($k),
    nt_field_lead($k),
    [
      'key'        => $k . 'tips',
      'label'      => 'טיפים',
      'name'       => 'tips',
      'type'       => 'repeater',
      'layout'     => 'block',
      'min'        => 1,
      'max'        => 8,
      'sub_fields' => [
        ['key' => $k . 'tip_icon',  'label' => 'אייקון', 'name' => 'icon',  'type' => 'image', 'return_format' => 'id', 'preview_size' => 'thumbnail'],
        ['key' => $k . 'tip_title', 'label' => 'כותרת',   'name' => 'title', 'type' => 'text'],
        ['key' => $k . 'tip_desc',  'label' => 'תיאור',   'name' => 'description', 'type' => 'textarea', 'rows' => 3],
      ],
    ],
  ];
}

// ─── Page Hero (full-bleed, used on archive-style pages) ───────────────────
function nt_section_page_hero_fields(): array {
  $k = 'fld_page_hero_';
  return [
    nt_field_title($k),
    nt_field_lead($k),
    [
      'key'           => $k . 'video',
      'label'         => 'סרטון רקע (mp4)',
      'name'          => 'video',
      'type'          => 'file',
      'return_format' => 'url',
      'mime_types'    => 'mp4,webm',
    ],
    nt_field_image($k, 'תמונת רקע / Poster', 'image'),
  ];
}

// ─── Hotels Listing (rich filter + catalog matching hotels.html) ───────────
function nt_section_hotels_listing_fields(): array {
  $k = 'fld_hotels_listing_';
  return [
    [
      'key'           => $k . 'show_filters',
      'label'         => 'הצג סינון',
      'name'          => 'show_filters',
      'type'          => 'true_false',
      'ui'            => 1,
      'default_value' => 1,
    ],
    nt_field_show_all_toggle($k),
    nt_field_relation($k, 'hotel', 'מלונות לבחירה ידנית'),
  ];
}

// ─── Attractions Listing (rich filter + catalog matching attractions.html) ─
function nt_section_attractions_listing_fields(): array {
  $k = 'fld_attractions_listing_';
  return [
    [
      'key'           => $k . 'show_filters',
      'label'         => 'הצג סינון',
      'name'          => 'show_filters',
      'type'          => 'true_false',
      'ui'            => 1,
      'default_value' => 1,
    ],
    nt_field_show_all_toggle($k),
    nt_field_relation($k, 'attraction', 'אטרקציות לבחירה ידנית'),
  ];
}

// ─── Use Cases Listing (filter + grid matching use-cases.html) ─────────────
function nt_section_use_cases_listing_fields(): array {
  $k = 'fld_uc_listing_';
  return [
    [
      'key'           => $k . 'show_filters',
      'label'         => 'הצג סינון',
      'name'          => 'show_filters',
      'type'          => 'true_false',
      'ui'            => 1,
      'default_value' => 1,
    ],
    nt_field_show_all_toggle($k),
    nt_field_relation($k, 'use-case', 'Use Cases לבחירה ידנית'),
  ];
}

// ─── Train Types / Service Types (used by service.html + car-rental.html) ──
function nt_section_service_types_fields(): array {
  $k = 'fld_service_types_';
  return [
    nt_field_title($k),
    nt_field_lead($k),
    [
      'key'   => $k . 'items',
      'label' => 'פריטים',
      'name'  => 'items',
      'type'  => 'repeater',
      'layout' => 'block',
      'min'   => 1,
      'sub_fields' => [
        nt_field_image($k . 'item', 'תמונה', 'image'),
        ['key' => $k . 'item_title',  'label' => 'כותרת',  'name' => 'title',       'type' => 'text'],
        ['key' => $k . 'item_desc',   'label' => 'תיאור',  'name' => 'description', 'type' => 'textarea', 'rows' => 3],
        ['key' => $k . 'item_price',  'label' => 'מחיר',   'name' => 'price',       'type' => 'text'],
        nt_field_link($k . 'item', 'כפתור', 'cta'),
      ],
    ],
  ];
}

// ─── Service Info (3-column info bar) ──────────────────────────────────────
function nt_section_service_info_fields(): array {
  $k = 'fld_service_info_';
  return [
    nt_field_title($k),
    [
      'key'   => $k . 'items',
      'label' => 'פריטים',
      'name'  => 'items',
      'type'  => 'repeater',
      'layout' => 'block',
      'min'   => 1,
      'max'   => 6,
      'sub_fields' => [
        nt_field_image($k . 'info', 'אייקון', 'icon'),
        ['key' => $k . 'info_title', 'label' => 'כותרת', 'name' => 'title',       'type' => 'text'],
        ['key' => $k . 'info_desc',  'label' => 'תיאור', 'name' => 'description', 'type' => 'textarea', 'rows' => 3],
      ],
    ],
  ];
}

// ─── FAQ (accordion) ───────────────────────────────────────────────────────
function nt_section_faq_fields(): array {
  $k = 'fld_faq_';
  return [
    nt_field_title($k),
    nt_field_lead($k),
    [
      'key'   => $k . 'items',
      'label' => 'שאלות',
      'name'  => 'items',
      'type'  => 'repeater',
      'layout' => 'block',
      'min'   => 1,
      'sub_fields' => [
        ['key' => $k . 'q', 'label' => 'שאלה', 'name' => 'question', 'type' => 'text'],
        ['key' => $k . 'a', 'label' => 'תשובה', 'name' => 'answer',  'type' => 'wysiwyg', 'toolbar' => 'basic', 'media_upload' => 0],
      ],
    ],
  ];
}

// ─── Service Hero (image + copy + CTA, used by service & car-rental pages) ─
function nt_section_service_hero_fields(): array {
  $k = 'fld_service_hero_';
  return [
    [
      'key'           => $k . 'eyebrow',
      'label'         => 'תגית מעל הכותרת',
      'name'          => 'eyebrow',
      'type'          => 'text',
    ],
    nt_field_title($k),
    nt_field_lead($k),
    nt_field_image($k, 'תמונת רקע'),
    nt_field_link($k, 'כפתור CTA'),
  ];
}

/**
 * Master registry: layout name → [label, fields callback].
 * Used by both flexible-content.php and options-sections-content.php.
 */
function nt_section_registry(): array {
  return [
    'home_hero'                 => ['Home Hero',                 'nt_section_home_hero_fields'],
    'page_hero'                 => ['Page Hero (archive style)', 'nt_section_page_hero_fields'],
    'service_hero'              => ['Service Hero',              'nt_section_service_hero_fields'],
    'why_us'                    => ['Why Us',                    'nt_section_why_us_fields'],
    'trip_types'                => ['Trip Types',                'nt_section_trip_types_fields'],
    'attractions'               => ['Attractions (homepage tabs)','nt_section_attractions_fields'],
    'attractions_listing'       => ['Attractions Listing (filter+grid)', 'nt_section_attractions_listing_fields'],
    'destinations'              => ['Destinations',              'nt_section_destinations_fields'],
    'hotels_listing'            => ['Hotels Listing (filter+catalog)',  'nt_section_hotels_listing_fields'],
    'use_cases'                 => ['Use Cases (slider)',        'nt_section_use_cases_fields'],
    'use_cases_listing'         => ['Use Cases Listing (filter+grid)',  'nt_section_use_cases_listing_fields'],
    'testimonials'              => ['Client Reviews',            'nt_section_testimonials_fields'],
    'process'                   => ['Process',                   'nt_section_process_fields'],
    'partners'                  => ['Partners',                  'nt_section_partners_fields'],
    'content_media'             => ['Content + Media',           'nt_section_content_media_fields'],
    'image_separator'           => ['Image Separator',           'nt_section_image_separator_fields'],
    'contact'                   => ['Contact',                   'nt_section_contact_fields'],
    'service_types'             => ['Service Types',             'nt_section_service_types_fields'],
    'service_info'              => ['Service Info (3-col)',      'nt_section_service_info_fields'],
    'faq'                       => ['FAQ',                       'nt_section_faq_fields'],
    'travel_type_hero'          => ['Travel-Type Hero',          'nt_section_travel_type_hero_fields'],
    'meta_strip'                => ['Meta Strip',                'nt_section_meta_strip_fields'],
    'about_with_sidebar'        => ['About + Sidebar',           'nt_section_about_with_sidebar_fields'],
    'itinerary'                 => ['Itinerary',                 'nt_section_itinerary_fields'],
    'tips'                      => ['Tips',                      'nt_section_tips_fields'],
  ];
}

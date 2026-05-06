<?php
/**
 * Custom Post Types for Ninja Tours.
 *
 * Note: in production these would typically live in a site-specific plugin
 * so the data survives a theme switch. For this build they're in the theme
 * so installation is one step. Move to a plugin once the site is live.
 */

add_action('init', 'nt_register_post_types');

function nt_register_post_types(): void {

  // ─── Destinations (cities/regions in Japan) ──────────────────────────────
  register_post_type('destination', [
    'label'         => __('יעדים', 'ninjatours'),
    'labels'        => nt_pt_labels('יעד', 'יעדים', 'destination'),
    'public'        => true,
    'show_in_menu'  => true,
    'menu_position' => 21,
    'menu_icon'     => 'dashicons-location-alt',
    'supports'      => ['title', 'editor', 'thumbnail', 'excerpt', 'page-attributes'],
    'has_archive'   => 'destinations',
    'rewrite'       => ['slug' => 'destinations', 'with_front' => false],
    'show_in_rest'  => false,
    'hierarchical'  => false,
  ]);

  // ─── Hotels ──────────────────────────────────────────────────────────────
  register_post_type('hotel', [
    'label'         => __('מלונות', 'ninjatours'),
    'labels'        => nt_pt_labels('מלון', 'מלונות', 'hotel'),
    'public'        => true,
    'show_in_menu'  => true,
    'menu_position' => 22,
    'menu_icon'     => 'dashicons-building',
    'supports'      => ['title', 'editor', 'thumbnail', 'excerpt', 'page-attributes'],
    'has_archive'   => 'hotels',
    'rewrite'       => ['slug' => 'hotels', 'with_front' => false],
    'show_in_rest'  => false,
  ]);

  // ─── Attractions ─────────────────────────────────────────────────────────
  register_post_type('attraction', [
    'label'         => __('אטרקציות', 'ninjatours'),
    'labels'        => nt_pt_labels('אטרקציה', 'אטרקציות', 'attraction'),
    'public'        => true,
    'show_in_menu'  => true,
    'menu_position' => 23,
    'menu_icon'     => 'dashicons-palmtree',
    'supports'      => ['title', 'editor', 'thumbnail', 'excerpt', 'page-attributes'],
    'has_archive'   => 'attractions',
    'rewrite'       => ['slug' => 'attractions', 'with_front' => false],
    'show_in_rest'  => false,
  ]);

  // ─── Use Cases (custom trips we built for past clients) ──────────────────
  register_post_type('use-case', [
    'label'         => __('Use Cases', 'ninjatours'),
    'labels'        => nt_pt_labels('Use Case', 'טיולים שבנינו', 'use-case'),
    'public'        => true,
    'show_in_menu'  => true,
    'menu_position' => 24,
    'menu_icon'     => 'dashicons-portfolio',
    'supports'      => ['title', 'editor', 'thumbnail', 'excerpt', 'page-attributes'],
    'has_archive'   => 'use-cases',
    'rewrite'       => ['slug' => 'use-cases', 'with_front' => false],
    'show_in_rest'  => false,
  ]);

  // ─── Travel Types (the categories on the homepage trip-types slider) ─────
  register_post_type('travel-type', [
    'label'         => __('סוגי טיולים', 'ninjatours'),
    'labels'        => nt_pt_labels('סוג טיול', 'סוגי טיולים', 'travel-type'),
    'public'        => true,
    'show_in_menu'  => true,
    'menu_position' => 25,
    'menu_icon'     => 'dashicons-tag',
    'supports'      => ['title', 'editor', 'thumbnail', 'excerpt', 'page-attributes'],
    'has_archive'   => 'travel-types',
    'rewrite'       => ['slug' => 'travel-types', 'with_front' => false],
    'show_in_rest'  => false,
  ]);

  // ─── Client Reviews (testimonials) ───────────────────────────────────────
  register_post_type('client-review', [
    'label'         => __('המלצות לקוחות', 'ninjatours'),
    'labels'        => nt_pt_labels('המלצה', 'המלצות', 'client-review'),
    'public'        => false,                   // not a public archive — only in slider
    'publicly_queryable' => false,
    'show_ui'       => true,
    'show_in_menu'  => true,
    'menu_position' => 26,
    'menu_icon'     => 'dashicons-format-quote',
    'supports'      => ['title', 'thumbnail'],
    'has_archive'   => false,
    'show_in_rest'  => false,
  ]);
}

/**
 * Generate full WP labels array from singular + plural — keeps registrations short.
 */
function nt_pt_labels(string $singular, string $plural, string $slug): array {
  return [
    'name'                  => $plural,
    'singular_name'         => $singular,
    'menu_name'             => $plural,
    'name_admin_bar'        => $singular,
    'add_new'               => __('הוסף חדש', 'ninjatours'),
    'add_new_item'          => sprintf(__('הוסף %s חדש/ה', 'ninjatours'), $singular),
    'new_item'              => sprintf(__('%s חדש/ה', 'ninjatours'), $singular),
    'edit_item'             => sprintf(__('עריכת %s', 'ninjatours'), $singular),
    'view_item'             => sprintf(__('צפייה ב-%s', 'ninjatours'), $singular),
    'view_items'            => sprintf(__('צפייה ב-%s', 'ninjatours'), $plural),
    'all_items'             => sprintf(__('כל ה%s', 'ninjatours'), $plural),
    'search_items'          => sprintf(__('חיפוש %s', 'ninjatours'), $plural),
    'not_found'             => sprintf(__('לא נמצאו %s', 'ninjatours'), $plural),
    'not_found_in_trash'    => sprintf(__('אין %s בסל המחזור', 'ninjatours'), $plural),
    'featured_image'        => __('תמונה ראשית', 'ninjatours'),
    'set_featured_image'    => __('בחר תמונה ראשית', 'ninjatours'),
    'remove_featured_image' => __('הסר תמונה ראשית', 'ninjatours'),
    'archives'              => sprintf(__('ארכיון %s', 'ninjatours'), $plural),
  ];
}

<?php
/**
 * Taxonomies for filterable listings.
 *
 * - attraction-category   → Attractions   (Temples, Parks, Cultural, Shopping, …)
 * - hotel-city            → Hotels        (links to a destination conceptually)
 * - hotel-audience        → Hotels        (Family, Couples, Luxury, Budget, …)
 * - trip-audience         → Use-cases     (Family, Couples, Friends, Honeymoon, …)
 * - trip-tag              → Use-cases     (Free-form tags: Mt Fuji, Onsen, Foodie, …)
 * - trip-length           → Use-cases     (Short / Medium / Long — predefined terms)
 * - travel-region         → Destinations  (Kanto / Kansai / Hokkaido / Kyushu / …)
 *
 * All taxonomies are non-hierarchical (tags-style) unless noted otherwise —
 * easier UX for editors than a category tree they have to maintain.
 */

add_action('init', 'nt_register_taxonomies');

function nt_register_taxonomies(): void {

  // ─── Attractions ────────────────────────────────────────────────────────
  register_taxonomy('attraction-category', 'attraction', [
    'label'             => __('קטגוריות אטרקציות', 'ninjatours'),
    'labels'            => nt_tax_labels('קטגוריה', 'קטגוריות'),
    'hierarchical'      => true,
    'public'            => true,
    'show_admin_column' => true,
    'show_in_rest'      => false,
    'rewrite'           => ['slug' => 'attraction-category'],
  ]);

  // ─── Hotels ─────────────────────────────────────────────────────────────
  register_taxonomy('hotel-city', 'hotel', [
    'label'             => __('עיר (מלונות)', 'ninjatours'),
    'labels'            => nt_tax_labels('עיר', 'ערים'),
    'hierarchical'      => false,
    'public'            => true,
    'show_admin_column' => true,
    'show_in_rest'      => false,
    'rewrite'           => ['slug' => 'hotel-city'],
  ]);

  register_taxonomy('hotel-audience', 'hotel', [
    'label'             => __('קהל יעד (מלונות)', 'ninjatours'),
    'labels'            => nt_tax_labels('קהל יעד', 'קהלי יעד'),
    'hierarchical'      => false,
    'public'            => true,
    'show_admin_column' => true,
    'show_in_rest'      => false,
    'rewrite'           => ['slug' => 'hotel-audience'],
  ]);

  // ─── Use Cases ──────────────────────────────────────────────────────────
  register_taxonomy('trip-audience', 'use-case', [
    'label'             => __('קהל יעד (טיולים)', 'ninjatours'),
    'labels'            => nt_tax_labels('קהל יעד', 'קהלי יעד'),
    'hierarchical'      => false,
    'public'            => true,
    'show_admin_column' => true,
    'show_in_rest'      => false,
    'rewrite'           => ['slug' => 'trip-audience'],
  ]);

  register_taxonomy('trip-tag', 'use-case', [
    'label'             => __('תגיות טיול', 'ninjatours'),
    'labels'            => nt_tax_labels('תגית', 'תגיות'),
    'hierarchical'      => false,
    'public'            => true,
    'show_admin_column' => true,
    'show_in_rest'      => false,
    'rewrite'           => ['slug' => 'trip-tag'],
  ]);

  register_taxonomy('trip-length', 'use-case', [
    'label'             => __('אורך טיול', 'ninjatours'),
    'labels'            => nt_tax_labels('אורך', 'אורכים'),
    'hierarchical'      => true,    // hierarchical so editors get checkboxes (short/medium/long)
    'public'            => true,
    'show_admin_column' => true,
    'show_in_rest'      => false,
    'rewrite'           => ['slug' => 'trip-length'],
  ]);

  // ─── Destinations ───────────────────────────────────────────────────────
  register_taxonomy('travel-region', 'destination', [
    'label'             => __('אזור', 'ninjatours'),
    'labels'            => nt_tax_labels('אזור', 'אזורים'),
    'hierarchical'      => true,
    'public'            => true,
    'show_admin_column' => true,
    'show_in_rest'      => false,
    'rewrite'           => ['slug' => 'travel-region'],
  ]);
}

function nt_tax_labels(string $singular, string $plural): array {
  return [
    'name'              => $plural,
    'singular_name'     => $singular,
    'search_items'      => sprintf(__('חיפוש %s', 'ninjatours'), $plural),
    'all_items'         => sprintf(__('כל ה%s', 'ninjatours'), $plural),
    'edit_item'         => sprintf(__('עריכת %s', 'ninjatours'), $singular),
    'update_item'       => sprintf(__('עדכון %s', 'ninjatours'), $singular),
    'add_new_item'      => sprintf(__('הוסף %s חדש/ה', 'ninjatours'), $singular),
    'new_item_name'     => sprintf(__('שם %s חדש/ה', 'ninjatours'), $singular),
    'menu_name'         => $plural,
  ];
}

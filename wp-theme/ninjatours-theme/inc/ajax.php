<?php
/**
 * AJAX handlers — return rendered HTML (template parts), not JSON.
 *
 * All handlers verify the nonce that's exposed via window.theme_data in
 * inc/theme-settings.php, and use sanitize_text_field on every $_POST read.
 */

// ─── Attractions filter (homepage section + archive) ──────────────────────
add_action('wp_ajax_nt_filter_attractions',        'nt_filter_attractions');
add_action('wp_ajax_nopriv_nt_filter_attractions', 'nt_filter_attractions');

function nt_filter_attractions(): void {
  check_ajax_referer('ninjatours_nonce', 'nonce');

  $category_id = isset($_POST['category_id']) ? sanitize_text_field(wp_unslash($_POST['category_id'])) : 'all';

  $args = [
    'post_type'      => 'attraction',
    'posts_per_page' => -1,
    'orderby'        => 'date',
    'order'          => 'DESC',
    'post_status'    => 'publish',
    'no_found_rows'  => true,
  ];
  if ($category_id !== 'all' && is_numeric($category_id)) {
    $args['tax_query'] = [[
      'taxonomy' => 'attraction-category',
      'field'    => 'term_id',
      'terms'    => absint($category_id),
    ]];
  }

  $q = new WP_Query($args);
  if ($q->have_posts()) {
    while ($q->have_posts()) {
      $q->the_post();
      get_template_part('parts/attraction-card', null, ['id' => get_the_ID()]);
    }
    wp_reset_postdata();
  }
  wp_die();
}

// ─── Hotels filter ────────────────────────────────────────────────────────
add_action('wp_ajax_nt_filter_hotels',        'nt_filter_hotels');
add_action('wp_ajax_nopriv_nt_filter_hotels', 'nt_filter_hotels');

function nt_filter_hotels(): void {
  check_ajax_referer('ninjatours_nonce', 'nonce');

  $args = [
    'post_type'      => 'hotel',
    'posts_per_page' => -1,
    'orderby'        => 'date',
    'order'          => 'DESC',
    'post_status'    => 'publish',
    'no_found_rows'  => true,
    'tax_query'      => [],
  ];

  // Whitelisted taxonomies — anything else is ignored
  foreach (['hotel-city', 'hotel-audience'] as $tax_slug) {
    $key = str_replace('-', '_', $tax_slug);
    if (empty($_POST[$key]) || !is_array($_POST[$key])) continue;
    $ids = array_map('absint', wp_unslash($_POST[$key]));
    $ids = array_filter($ids);
    if ($ids) {
      $args['tax_query'][] = [
        'taxonomy' => $tax_slug,
        'field'    => 'term_id',
        'terms'    => $ids,
        'operator' => 'IN',
      ];
    }
  }

  if (count($args['tax_query']) > 1) {
    $args['tax_query']['relation'] = 'AND';
  }

  $q = new WP_Query($args);
  if ($q->have_posts()) {
    while ($q->have_posts()) {
      $q->the_post();
      get_template_part('parts/hotel-card', null, ['id' => get_the_ID()]);
    }
    wp_reset_postdata();
  }
  wp_die();
}

// ─── Use Cases filter ─────────────────────────────────────────────────────
add_action('wp_ajax_nt_filter_use_cases',        'nt_filter_use_cases');
add_action('wp_ajax_nopriv_nt_filter_use_cases', 'nt_filter_use_cases');

function nt_filter_use_cases(): void {
  check_ajax_referer('ninjatours_nonce', 'nonce');

  $args = [
    'post_type'      => 'use-case',
    'posts_per_page' => -1,
    'orderby'        => 'date',
    'order'          => 'DESC',
    'post_status'    => 'publish',
    'no_found_rows'  => true,
    'tax_query'      => [],
  ];

  foreach (['trip-audience', 'trip-tag', 'trip-length'] as $tax_slug) {
    $key = str_replace('-', '_', $tax_slug);
    if (empty($_POST[$key]) || !is_array($_POST[$key])) continue;
    $ids = array_map('absint', wp_unslash($_POST[$key]));
    $ids = array_filter($ids);
    if ($ids) {
      $args['tax_query'][] = [
        'taxonomy' => $tax_slug,
        'field'    => 'term_id',
        'terms'    => $ids,
      ];
    }
  }

  if (count($args['tax_query']) > 1) {
    $args['tax_query']['relation'] = 'AND';
  }

  $q = new WP_Query($args);
  if ($q->have_posts()) {
    while ($q->have_posts()) {
      $q->the_post();
      get_template_part('parts/use-case-card', null, ['id' => get_the_ID()]);
    }
    wp_reset_postdata();
  }
  wp_die();
}

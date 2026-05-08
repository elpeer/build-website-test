<?php
/**
 * ACF loader: programmatic field groups + JSON sync bridge.
 *
 * Architecture:
 *   - Field groups are *defined in PHP* (one file per concern, in this folder).
 *   - ACF's local-JSON feature is enabled, pointing at /acf-json/ in the theme.
 *     Any structural change made via the ACF admin UI auto-saves there, so it
 *     ends up in git alongside the PHP definitions.
 *   - To bring a PHP-defined group into the editable admin UI, use:
 *       Custom Fields → Tools → Import Field Groups → upload the JSON
 *     (or use ACF's "Sync Available" prompt when JSON drifts ahead of DB).
 *
 * Loading order:
 *   helpers (utility functions used by registrations) → registrations.
 */

// Bail if ACF Pro isn't active. The theme degrades gracefully — nothing breaks,
// but no editable fields show in admin. Print an admin notice once.
if (!function_exists('acf_add_local_field_group')) {
  add_action('admin_notices', function () {
    if (current_user_can('activate_plugins')) {
      echo '<div class="notice notice-error"><p>';
      echo esc_html__('Ninja Tours theme requires Advanced Custom Fields PRO. Install and activate it to enable editable content.', 'ninjatours');
      echo '</p></div>';
    }
  });
  return;
}

// ─── JSON sync bridge ──────────────────────────────────────────────────────
add_filter('acf/settings/save_json', function () {
  $dir = get_template_directory() . '/acf-json';
  if (!is_dir($dir)) wp_mkdir_p($dir);
  return $dir;
});

add_filter('acf/settings/load_json', function ($paths) {
  $paths[] = get_template_directory() . '/acf-json';
  return $paths;
});

// ─── Helpers (must load before registration files) ─────────────────────────
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/section-fields.php';

// ─── Registrations ─────────────────────────────────────────────────────────
add_action('acf/init', function () {
  require_once __DIR__ . '/options-general.php';
  require_once __DIR__ . '/options-sections-content.php';
  require_once __DIR__ . '/flexible-content.php';
  require_once __DIR__ . '/post-attraction.php';
  require_once __DIR__ . '/post-destination.php';
  require_once __DIR__ . '/post-hotel.php';
  require_once __DIR__ . '/post-use-case.php';
  require_once __DIR__ . '/post-travel-type.php';
  require_once __DIR__ . '/post-client-review.php';
  require_once __DIR__ . '/taxonomy-fields.php';
});

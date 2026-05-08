<?php
/**
 * Theme bootstrap. Each concern lives in its own file under /inc.
 * Load order matters: helpers must exist before ACF + sections use them.
 */

if (!defined('NINJATOURS_VERSION')) {
  define('NINJATOURS_VERSION', '1.0.0');
}

require_once get_template_directory() . '/inc/disable.php';
require_once get_template_directory() . '/inc/svg-support.php';
require_once get_template_directory() . '/inc/theme-settings.php';
require_once get_template_directory() . '/inc/assets.php';
require_once get_template_directory() . '/inc/post-types.php';
require_once get_template_directory() . '/inc/taxonomies.php';
require_once get_template_directory() . '/inc/functions.php';
require_once get_template_directory() . '/inc/ajax.php';
require_once get_template_directory() . '/inc/demo-content.php';

// ACF — programmatic field groups + JSON sync bridge
require_once get_template_directory() . '/inc/acf/loader.php';

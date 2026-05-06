<?php
/**
 * Theme support, nav menus, ACF options page, JS variables.
 * NB: Header/Footer menus are managed via WP Menus admin (Appearance → Menus).
 *     Site-wide singletons (logo, social URLs, fallback contact info) live on
 *     the General Settings ACF options page.
 */

add_action('after_setup_theme', function () {
  add_theme_support('title-tag');
  add_theme_support('post-thumbnails');
  add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption']);
  add_theme_support('automatic-feed-links');

  register_nav_menus([
    'header_menu_1' => __('Header Menu — Start (Right in RTL)', 'ninjatours'),
    'header_menu_2' => __('Header Menu — End (Left in RTL)', 'ninjatours'),
    'footer_menu'   => __('Footer Menu', 'ninjatours'),
    'mobile_menu'   => __('Mobile Menu (optional override)', 'ninjatours'),
  ]);
});

// ─── ACF Options Page: General Settings ────────────────────────────────────
add_action('acf/init', function () {
  if (!function_exists('acf_add_options_page')) return;

  acf_add_options_page([
    'page_title' => __('הגדרות כלליות', 'ninjatours'),
    'menu_title' => __('הגדרות כלליות', 'ninjatours'),
    'menu_slug'  => 'theme-general-settings',
    'capability' => 'edit_posts',
    'redirect'   => false,
    'position'   => 10,
    'icon_url'   => 'dashicons-admin-generic',
  ]);
});

// ─── Expose JS data (ajax_url + nonce) on every page ───────────────────────
add_action('wp_head', function () {
  $vars = [
    'ajax_url' => admin_url('admin-ajax.php'),
    'nonce'    => wp_create_nonce('ninjatours_nonce'),
    'home_url' => home_url('/'),
  ];
  echo '<script>window.theme_data = ' . wp_json_encode($vars) . ';</script>' . "\n";
});

// ─── Strip noisy default image sizes ───────────────────────────────────────
add_action('after_setup_theme', function () {
  remove_image_size('2048x2048');
  remove_image_size('1536x1536');
  remove_image_size('medium_large');
});

// ─── Disable Gutenberg for pages (we use ACF flexible-content); keep for posts
add_filter('use_block_editor_for_post', function ($can_edit, $post) {
  return $post->post_type === 'post';
}, 10, 2);

// ─── Contact Form 7: don't load default CSS or auto-add <p> tags ───────────
add_filter('wpcf7_load_css',     '__return_false', 999);
add_filter('wpcf7_autop_or_not', '__return_false');

// ─── Set "Flexible Content" template as default for new pages ──────────────
add_filter('default_page_template_title', function ($title) {
  return __('Flexible Content', 'ninjatours');
});

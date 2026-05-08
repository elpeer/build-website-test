<?php
/**
 * Remove WP cruft: emojis, comments, customizer, patterns, block editor for pages.
 * This file is the same across most agency builds — copy as-is.
 */

// ─── Emojis ────────────────────────────────────────────────────────────────
add_action('init', function () {
  remove_action('wp_head', 'print_emoji_detection_script', 7);
  remove_action('admin_print_scripts', 'print_emoji_detection_script');
  remove_action('wp_print_styles', 'print_emoji_styles');
  remove_action('admin_print_styles', 'print_emoji_styles');
  remove_filter('the_content_feed', 'wp_staticize_emoji');
  remove_filter('comment_text_rss', 'wp_staticize_emoji');
  remove_filter('wp_mail', 'wp_staticize_emoji_for_email');
  add_filter('tiny_mce_plugins', function ($plugins) {
    return is_array($plugins) ? array_diff($plugins, ['wpemoji']) : [];
  });
  add_filter('wp_resource_hints', function ($urls, $relation_type) {
    if ('dns-prefetch' === $relation_type) {
      $emoji_svg_url = apply_filters('emoji_svg_url', 'https://s.w.org/images/core/emoji/2/svg/');
      $urls = array_diff($urls, [$emoji_svg_url]);
    }
    return $urls;
  }, 10, 2);
});

// ─── Hide unused admin items ───────────────────────────────────────────────
add_action('admin_menu', function () {
  remove_menu_page('edit-comments.php');
  remove_submenu_page('themes.php', 'customize.php');

  $patterns_slugs = [
    'site-editor.php?path=/patterns',
    'site-editor.php?postType=wp_block',
    'edit.php?post_type=wp_block',
  ];
  foreach ($patterns_slugs as $slug) remove_submenu_page('themes.php', $slug);

  global $submenu;
  if (isset($submenu['themes.php'])) {
    foreach ($submenu['themes.php'] as $i => $item) {
      $title = wp_strip_all_tags($item[0]);
      $slug  = $item[2];
      if (
        stripos($title, 'Pattern')   !== false ||
        stripos($slug,  'patterns')  !== false ||
        stripos($slug,  'wp_block')  !== false ||
        stripos($slug,  'customize') !== false ||
        stripos($title, 'Customize') !== false
      ) {
        unset($submenu['themes.php'][$i]);
      }
    }
  }
}, 999);

add_action('admin_bar_menu', function ($bar) {
  $bar->remove_node('comments');
  $bar->remove_node('customize');
}, 999);

add_action('load-edit-comments.php', function () {
  wp_safe_redirect(admin_url());
  exit;
});

add_action('load-customize.php', function () {
  wp_safe_redirect(admin_url('themes.php'));
  exit;
});

add_action('load-site-editor.php', function () {
  if (
    (isset($_GET['path'])     && strpos($_GET['path'], 'patterns') !== false) ||
    (isset($_GET['postType']) && $_GET['postType'] === 'wp_block')
  ) {
    wp_safe_redirect(admin_url('themes.php'));
    exit;
  }
});

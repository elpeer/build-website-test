<?php

/**
 * Disable the emoji's
 */
function disable_emojis()
{
  remove_action('wp_head', 'wp_print_auto_sizes_contain_css_fix', 1);
  remove_action('wp_head', 'print_emoji_detection_script', 7);
  remove_action('admin_print_scripts', 'print_emoji_detection_script');
  remove_action('wp_print_styles', 'print_emoji_styles');
  remove_action('admin_print_styles', 'print_emoji_styles');
  remove_filter('the_content_feed', 'wp_staticize_emoji');
  remove_filter('comment_text_rss', 'wp_staticize_emoji');
  remove_filter('wp_mail', 'wp_staticize_emoji_for_email');
  add_filter('tiny_mce_plugins', 'disable_emojis_tinymce');
  add_filter('wp_resource_hints', 'disable_emojis_remove_dns_prefetch', 10, 2);
}
add_action('init', 'disable_emojis');

/**
 * Filter function used to remove the tinymce emoji plugin.
 * 
 * @param array $plugins 
 * @return array Difference betwen the two arrays
 */
function disable_emojis_tinymce($plugins)
{
  if (is_array($plugins)) {
    return array_diff($plugins, array('wpemoji'));
  } else {
    return array();
  }
}

/**
 * Remove emoji CDN hostname from DNS prefetching hints.
 *
 * @param array $urls URLs to print for resource hints.
 * @param string $relation_type The relation type the URLs are printed for.
 * @return array Difference betwen the two arrays.
 */
function disable_emojis_remove_dns_prefetch($urls, $relation_type)
{
  if ('dns-prefetch' == $relation_type) {
    /** This filter is documented in wp-includes/formatting.php */
    $emoji_svg_url = apply_filters('emoji_svg_url', 'https://s.w.org/images/core/emoji/2/svg/');

    $urls = array_diff($urls, array($emoji_svg_url));
  }

  return $urls;
}

add_action('admin_menu', function () {
  remove_menu_page('edit-comments.php');

  remove_submenu_page('themes.php', 'customize.php');

  $possible_slugs = array(
    'site-editor.php?path=/patterns',
    'site-editor.php?postType=wp_block',
    'edit.php?post_type=wp_block',
  );
  foreach ($possible_slugs as $slug) {
    remove_submenu_page('themes.php', $slug);
  }

  global $submenu;
  if (isset($submenu['themes.php'])) {
    foreach ($submenu['themes.php'] as $i => $item) {
      $title = wp_strip_all_tags($item[0]);
      $slug  = $item[2];
      if (
        stripos($title, 'Pattern') !== false ||
        stripos($slug, 'patterns') !== false ||
        stripos($slug, 'wp_block') !== false
      ) {
        unset($submenu['themes.php'][$i]);
      }

      if (
        stripos($slug, 'customize.php') !== false ||
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
    (isset($_GET['path']) && strpos($_GET['path'], 'patterns') !== false) ||
    (isset($_GET['postType']) && $_GET['postType'] === 'wp_block')
  ) {
    wp_safe_redirect(admin_url('themes.php'));
    exit;
  }
});

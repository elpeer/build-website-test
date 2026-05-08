<?php
if (function_exists('acf_add_options_page')) {
  $page = acf_add_options_page(array(
    'page_title' => 'General Settings',
    'menu_title' => 'General Settings',
    'menu_slug' => 'theme-general-settings',
    'capability' => 'edit_posts',
    'redirect' => false,
    'position' => 10
  ));
}

function theme_js_variables()
{
  $variables = array(
    'ajax_url' => admin_url('admin-ajax.php'),
  );
  echo '<script type="text/javascript">window.theme_data = ' . json_encode($variables) . ';</script>';
}
add_action('wp_head', 'theme_js_variables');

add_theme_support('post-thumbnails');
add_theme_support('menus');
//add_theme_support('html5', array('search-form'));

register_nav_menus(array(
  'header_menu_1' => 'Header Menu 1',
  'header_menu_2' => 'Header Menu 2',
  'footer_menu' => 'Footer Menu',
));

add_action('after_setup_theme', 'remove_plugin_image_sizes');
function remove_plugin_image_sizes()
{
  remove_image_size('2048x2048');
  remove_image_size('1536x1536');
  remove_image_size('medium_large');
}

add_filter('use_block_editor_for_post', 'my_disable_gutenberg', 10, 2);
function my_disable_gutenberg($can_edit, $post)
{
  if ($post->post_type == 'post') {
    return true;
  }
  return false;
}

add_filter('wpcf7_load_css', '__return_false', 999);
add_filter('wpcf7_autop_or_not', '__return_false');

add_filter('ai1wm_exclude_themes_from_export', function ($exclude_filters) {
  $exclude_filters[] = 'ninjatours-theme/assets/node_modules';
  return $exclude_filters;
});

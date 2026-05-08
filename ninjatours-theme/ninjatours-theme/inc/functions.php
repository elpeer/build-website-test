<?php
function get_acf_link($acf_link, $class, $with_icon = false, $icon_class = null)
{

  if (!$acf_link) return;

  $link_url = $acf_link['url'];
  $link_title = $acf_link['title'];
  $link_target = $acf_link['target'] ? $acf_link['target'] : '_self';
?>
  <a class="<?php echo $class; ?>" href="<?php echo esc_url($link_url); ?>" target="<?php echo esc_attr($link_target); ?>">
    <?php if ($with_icon):  ?>
      <span><?php echo esc_html($link_title); ?></span>
      <i class="<?php echo $icon_class; ?>"></i>
    <?php else: ?>
      <?php echo esc_html($link_title); ?>
    <?php endif; ?>
  </a>
  <?php
}

function render_picture($image, $image_mobile)
{
  if (!empty($image_mobile)): ?>
    <picture>
      <source srcset="<?php echo wp_get_attachment_image_url($image_mobile, 'full'); ?>" media="(max-width: 768px) and (orientation: portrait)">
      <?php echo wp_get_attachment_image($image, 'full', null, ['loading' => 'lazy']); ?>
    </picture>
<?php else:
    echo wp_get_attachment_image($image, 'full', null, ['loading' => 'lazy']);
  endif;
}

function render_title($title, $tag = 'span', $class = false)
{
  $class = '';
  if ($class) {
    $class = 'class="' . $class . '"';
  }
  if (!empty($title)) {
    $modified_title = preg_replace('/\|(.*?)\|/', '<' . $tag . ' ' . $class . '>$1</' . $tag . '>', $title);
  }
  return $modified_title;
}

// Handle the AJAX request
add_action('wp_ajax_handle_attractions_filter_ajax', 'handle_attractions_filter_ajax');
add_action('wp_ajax_nopriv_handle_attractions_filter_ajax', 'handle_attractions_filter_ajax');

function handle_attractions_filter_ajax()
{
  $category_id = isset($_POST['category_id']) ? sanitize_text_field($_POST['category_id']) : 'all';

  // Default query arguments
  $args = array(
    'post_type'      => 'attraction',
    'posts_per_page' => -1,
    'orderby'        => 'date',
    'order'          => 'DESC',
    'post_status'    => 'publish',
  );

  if ($category_id !== 'all') {
    $args['tax_query'] = array(
      array(
        'taxonomy' => 'attraction-category',
        'field'    => 'term_id',
        'terms'    => absint($category_id),
      ),
    );
  }

  $query = new WP_Query($args);

  if ($query->have_posts()) {
    while ($query->have_posts()) {
      $query->the_post();
      // Load the template part as requested
      get_template_part('parts/attraction-card', null, ['id' => get_the_ID()]);
    }
    wp_reset_postdata();
  }

  // Always die() or wp_die() at the end of an AJAX handler in WordPress
  wp_die();
}

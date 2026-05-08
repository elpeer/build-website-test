<?php
/**
 * Destination card — matches static destinations.html markup with region tag,
 * title, full-image background, and overlay.
 *
 * @args ['id' => int]
 */

$id = $args['id'] ?? 0;
if (!$id) return;

$regions    = get_the_terms($id, 'travel-region');
$region_str = (!empty($regions) && !is_wp_error($regions)) ? $regions[0]->name . ', יפן' : '';
?>
<a href="<?php echo esc_url(get_permalink($id)); ?>" class="destinations__card-link">
  <?php
  if (has_post_thumbnail($id)) {
    echo get_the_post_thumbnail($id, 'large', ['class' => 'destinations__card-img', 'loading' => 'lazy']);
  }
  ?>
  <span class="destinations__card-overlay" aria-hidden="true"></span>
  <span class="destinations__card-body">
    <?php if ($region_str): ?>
      <span class="destinations__card-region"><?php echo esc_html($region_str); ?></span>
    <?php endif; ?>
    <span class="destinations__card-title"><?php echo esc_html(get_the_title($id)); ?></span>
  </span>
</a>

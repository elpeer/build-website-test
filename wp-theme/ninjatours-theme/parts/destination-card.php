<?php
/**
 * Destination card — used in destinations listing, homepage suggestions,
 * and inside CPT singles where related destinations appear.
 *
 * @args ['id' => int]
 */

$id = $args['id'] ?? 0;
if (!$id) return;

$tagline = get_field('tagline', $id);
if (!$tagline) $tagline = get_the_excerpt($id);

$permalink = get_the_permalink($id);
?>
<a class="destinations__card" href="<?php echo esc_url($permalink); ?>">
  <div class="destinations__card-image">
    <?php echo get_the_post_thumbnail($id, 'large', ['loading' => 'lazy']); ?>
    <span class="destinations__card-overlay" aria-hidden="true"></span>
  </div>
  <div class="destinations__card-body">
    <h3 class="destinations__card-title"><?php echo esc_html(get_the_title($id)); ?></h3>
    <?php if ($tagline): ?>
      <p class="destinations__card-tag"><?php echo esc_html($tagline); ?></p>
    <?php endif; ?>
  </div>
  <span class="destinations__card-arrow" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  </span>
</a>

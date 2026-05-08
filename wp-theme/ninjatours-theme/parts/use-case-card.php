<?php
/**
 * Use Case card — opens a modal with full content + customer quote.
 *
 * @args ['id' => int]
 */

$id = $args['id'] ?? 0;
if (!$id) return;

$duration = get_field('trip_duration', $id);
$capacity = get_field('trip_capacity', $id);
?>
<article class="custom-trips__card swiper-slide" data-id="<?php echo (int) $id; ?>">
  <figure class="custom-trips__card-image">
    <?php echo get_the_post_thumbnail($id, 'large', ['loading' => 'lazy']); ?>
  </figure>
  <div class="custom-trips__card-body">
    <h3 class="custom-trips__card-title"><?php echo esc_html(get_the_title($id)); ?></h3>
    <p class="custom-trips__card-desc"><?php echo esc_html(get_the_excerpt($id)); ?></p>
    <?php if ($duration || $capacity): ?>
      <p class="custom-trips__card-meta">
        <?php if ($duration): ?><span><?php echo esc_html($duration); ?></span><?php endif; ?>
        <?php if ($duration && $capacity): ?><span class="custom-trips__card-bullet" aria-hidden="true"></span><?php endif; ?>
        <?php if ($capacity): ?><span><?php echo esc_html($capacity); ?></span><?php endif; ?>
      </p>
    <?php endif; ?>
    <button type="button" class="custom-trips__card-cta" data-fancybox data-src="#trip-modal-<?php echo (int) $id; ?>">
      <?php esc_html_e('קרא עוד', 'ninjatours'); ?>
    </button>
  </div>
</article>

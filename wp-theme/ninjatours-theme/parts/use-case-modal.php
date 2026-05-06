<?php
/**
 * Use-case modal source — Fancybox clones it on open.
 * Lives in a hidden container inside the section markup.
 *
 * @args ['id' => int]
 */

$id = $args['id'] ?? 0;
if (!$id) return;

$duration   = get_field('trip_duration', $id);
$capacity   = get_field('trip_capacity', $id);
$content    = get_field('modal_content', $id);
$tags       = get_field('tags', $id);
$quote      = get_field('quote', $id);
?>
<div id="trip-modal-<?php echo (int) $id; ?>" class="trip-modal" dir="rtl">
  <button type="button" class="trip-modal__close" data-fancybox-close aria-label="<?php esc_attr_e('סגור', 'ninjatours'); ?>">
    <span class="trip-modal__close-text"><?php esc_html_e('סגור', 'ninjatours'); ?></span>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
      <line x1="6"  y1="6"  x2="18" y2="18"/>
      <line x1="18" y1="6"  x2="6"  y2="18"/>
    </svg>
  </button>

  <div class="trip-modal__media">
    <?php echo get_the_post_thumbnail($id, 'large', ['loading' => 'lazy']); ?>
  </div>

  <div class="trip-modal__body">
    <h3 class="trip-modal__title"><?php echo esc_html(get_the_title($id)); ?></h3>

    <?php if ($duration || $capacity): ?>
      <p class="trip-modal__meta">
        <?php echo esc_html($duration); ?>
        <?php if ($duration && $capacity): ?> • <?php endif; ?>
        <?php echo esc_html($capacity); ?>
      </p>
    <?php endif; ?>

    <?php if ($content): ?>
      <div class="trip-modal__desc"><?php echo wp_kses_post($content); ?></div>
    <?php endif; ?>

    <?php if (!empty($tags)): ?>
      <div class="trip-modal__tags">
        <?php foreach ($tags as $tag): ?>
          <?php if (!empty($tag['item'])): ?>
            <span class="trip-modal__tag"><?php echo esc_html($tag['item']); ?></span>
          <?php endif; ?>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

    <?php if (!empty($quote['text'])): ?>
      <blockquote class="trip-modal__quote">
        <p><?php echo esc_html($quote['text']); ?></p>
        <?php if (!empty($quote['author'])): ?>
          <cite><?php echo esc_html($quote['author']); ?></cite>
        <?php endif; ?>
      </blockquote>
    <?php endif; ?>
  </div>
</div>

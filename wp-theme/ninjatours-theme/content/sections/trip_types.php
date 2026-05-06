<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'trip_types';
$slug       = 'trip-types';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout);
if (!$group) return;

$title    = $group['title']    ?? '';
$lead     = $group['lead']     ?? '';
$show_all = !empty($group['show_all']);

if ($show_all) {
  // Force fallback by passing an empty field
  $items = nt_get_items_with_fallback('__force_empty__', 'travel-type', false, 20);
} else {
  // Use the relationship field as-is, with fallback if empty
  $items = !empty($group['items'])
    ? array_filter(array_map(fn($i) => $i instanceof WP_Post ? $i : get_post($i), (array) $group['items']))
    : nt_get_items_with_fallback('__force_empty__', 'travel-type', false, 20);
}

if (empty($items)) return;
?>

<section class="trip-types" id="<?php echo esc_attr($section_id); ?>">
  <header class="trip-types__head">
    <?php if ($title): ?>
      <h2 class="section-title"><?php echo wp_kses_post(nt_render_title($title)); ?></h2>
    <?php endif; ?>
    <?php if ($lead): ?>
      <p class="trip-types__lead"><?php echo esc_html($lead); ?></p>
    <?php endif; ?>
  </header>

  <div class="trip-types__slider-wrapper">
    <div class="trip-types__slider">
      <div class="swiper-wrapper">
        <?php foreach ($items as $item):
          $tagline = get_field('tagline', $item->ID) ?: get_the_excerpt($item->ID);
        ?>
          <div class="swiper-slide">
            <a href="<?php echo esc_url(get_permalink($item->ID)); ?>" class="trip-types__card">
              <?php echo get_the_post_thumbnail($item->ID, 'large', ['class' => 'trip-types__card-img', 'loading' => 'lazy']); ?>
              <span class="trip-types__card-overlay" aria-hidden="true"></span>
              <div class="trip-types__card-body">
                <h3 class="trip-types__card-title"><?php echo esc_html(get_the_title($item->ID)); ?></h3>
                <?php if ($tagline): ?>
                  <p class="trip-types__card-desc"><?php echo esc_html($tagline); ?></p>
                <?php endif; ?>
              </div>
            </a>
          </div>
        <?php endforeach; ?>
      </div>
    </div>

    <div class="trip-types__nav">
      <button class="trip-types__nav-btn trip-types__nav-prev" aria-label="<?php esc_attr_e('הקודם', 'ninjatours'); ?>" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      </button>
      <button class="trip-types__nav-btn trip-types__nav-next" aria-label="<?php esc_attr_e('הבא', 'ninjatours'); ?>" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
      </button>
    </div>
  </div>
</section>

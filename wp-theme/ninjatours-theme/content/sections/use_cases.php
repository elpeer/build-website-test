<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'use_cases';
$slug       = 'use-cases';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout);
if (!$group) return;

$title    = $group['title']    ?? '';
$show_all = !empty($group['show_all']);

$items = $show_all
  ? nt_get_items_with_fallback('__force_empty__', 'use-case', false, 20)
  : (!empty($group['items'])
      ? array_filter(array_map(fn($i) => $i instanceof WP_Post ? $i : get_post($i), (array) $group['items']))
      : nt_get_items_with_fallback('__force_empty__', 'use-case', false, 10));

if (empty($items)) return;
?>

<section class="custom-trips" id="<?php echo esc_attr($section_id); ?>">
  <header class="custom-trips__head">
    <?php if ($title): ?>
      <h2 class="section-title"><?php echo wp_kses_post(nt_render_title($title)); ?></h2>
    <?php endif; ?>
  </header>

  <div class="custom-trips__slider">
    <div class="swiper-wrapper">
      <?php foreach ($items as $item): ?>
        <?php get_template_part('parts/use-case-card', null, ['id' => $item->ID]); ?>
      <?php endforeach; ?>
    </div>
  </div>

  <div class="custom-trips__nav">
    <button type="button" class="custom-trips__nav-btn custom-trips__nav-prev" aria-label="<?php esc_attr_e('הקודם', 'ninjatours'); ?>">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
    </button>
    <button type="button" class="custom-trips__nav-btn custom-trips__nav-next" aria-label="<?php esc_attr_e('הבא', 'ninjatours'); ?>">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
      </svg>
    </button>
  </div>

  <div class="trip-modal-sources" hidden>
    <?php foreach ($items as $item): ?>
      <?php get_template_part('parts/use-case-modal', null, ['id' => $item->ID]); ?>
    <?php endforeach; ?>
  </div>
</section>

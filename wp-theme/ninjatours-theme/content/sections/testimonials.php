<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'testimonials';
$slug       = 'testimonials';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout);
if (!$group) return;

$title    = $group['title']    ?? '';
$show_all = !empty($group['show_all']);

$items = $show_all
  ? nt_get_items_with_fallback('__force_empty__', 'client-review', false, 20)
  : (!empty($group['items'])
      ? array_filter(array_map(fn($i) => $i instanceof WP_Post ? $i : get_post($i), (array) $group['items']))
      : nt_get_items_with_fallback('__force_empty__', 'client-review', false, 10));

if (empty($items)) return;
?>

<section class="testimonials" id="<?php echo esc_attr($section_id); ?>">
  <header class="testimonials__head">
    <span class="testimonials__head-stars" aria-hidden="true">
      <?php for ($i = 0; $i < 5; $i++): ?>
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 L14.6 8.6 L21.6 9.2 L16.3 13.7 L17.9 20.5 L12 16.9 L6.1 20.5 L7.7 13.7 L2.4 9.2 L9.4 8.6 Z"/></svg>
      <?php endfor; ?>
    </span>
    <?php if ($title): ?>
      <h2 class="section-title"><?php echo wp_kses_post(nt_render_title($title)); ?></h2>
    <?php endif; ?>
  </header>

  <div class="testimonials__slider">
    <div class="swiper-wrapper">
      <?php foreach ($items as $item):
        $text   = get_field('text',  $item->ID);
        $name   = get_field('name',  $item->ID) ?: get_the_title($item->ID);
        $photo  = get_field('photo', $item->ID);
      ?>
        <article class="testimonials__card swiper-slide">
          <span class="testimonials__quote-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 11h-3l3-7h2zm7 0h-3l3-7h2z"/></svg>
          </span>
          <p class="testimonials__quote"><?php echo esc_html($text); ?></p>
          <div class="testimonials__author">
            <div class="testimonials__author-info">
              <?php if ($photo): echo wp_get_attachment_image($photo, 'thumbnail', false, ['class' => 'testimonials__author-photo', 'loading' => 'lazy']); endif; ?>
              <div class="testimonials__author-text">
                <span class="testimonials__author-name"><?php echo esc_html($name); ?></span>
                <span class="testimonials__author-stars" aria-hidden="true">★★★★★</span>
              </div>
            </div>
          </div>
        </article>
      <?php endforeach; ?>
    </div>
  </div>

  <div class="testimonials__nav">
    <button type="button" class="testimonials__nav-btn testimonials__nav-prev" aria-label="<?php esc_attr_e('הקודם', 'ninjatours'); ?>">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
    </button>
    <button type="button" class="testimonials__nav-btn testimonials__nav-next" aria-label="<?php esc_attr_e('הבא', 'ninjatours'); ?>">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
      </svg>
    </button>
  </div>
</section>

<?php
$dir = get_template_directory_uri() . '/assets/app/';
$data = $args['item'];
$use_general = $data['use_general_settings'];
$hide_section = $data['hide_section'];
$section_id = $data['section_id'];
if ($section_id) $section_id = 'trip-types-' . $args['i'];

if ($use_general) {
  $group = get_field('sections_content', 'options')['trip_types'];
} else {
  $group = $data['group']['trip_types'];
}

if ($hide_section) return;
if (!$group) return;
$title = $group['title'];
$text = $group['text'];
$show_all = $group['show_all'];
$items = $group['items'];
if ($show_all) {
  $args = array(
    'post_type' => 'travel-type',
    'posts_per_page' => -1,
    'orderby' => 'date',
    'order' => 'ASC',
    'post_status' => 'publish',
  );
  $items = get_posts($args);
}
?>
<section class="trip-types" id="<?php echo $section_id; ?>">
  <header class="trip-types__head">
    <?php if (!empty($title)) echo '<h2 class="section-title">' . wp_kses_post($title) . '</h2>'; ?>
    <?php if (!empty($text)) echo '<p class="trip-types__lead">' . esc_html($text) . '</p>'; ?>
  </header>
  <?php if (!empty($items)): ?>
    <div class="trip-types__slider-wrapper">
      <div class="trip-types__slider">
        <div class="swiper-wrapper">
          <?php foreach ($items as $item): ?>
            <div class="swiper-slide">
              <article class="trip-types__card">
                <?php echo get_the_post_thumbnail($item->ID, 'full', ['class' => 'trip-types__card-img', 'loading' => 'lazy']) ?>
                <span class="trip-types__card-overlay" aria-hidden="true"></span>
                <div class="trip-types__card-body">
                  <h3 class="trip-types__card-title"><?php echo get_the_title($item->ID); ?></h3>
                  <p class="trip-types__card-desc"><?php echo get_the_excerpt($item->ID); ?></p>
                </div>
              </article>
            </div>
          <?php endforeach; ?>
        </div>
      </div>

      <div class="trip-types__nav">
        <button class="trip-types__nav-btn trip-types__nav-prev" aria-label="הקודם" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
            stroke-linejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
        <button class="trip-types__nav-btn trip-types__nav-next" aria-label="הבא" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
            stroke-linejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
      </div>
    </div>
  <?php endif; ?>
</section>
<?php
$dir = get_template_directory_uri() . '/assets/app/';
$data = $args['item'];
$use_general = $data['use_general_settings'];
$hide_section = $data['hide_section'];
$section_id = $data['section_id'];

if (empty($section_id)) {
  $section_id = 'customized-trips-' . $args['i'];
}

if ($use_general) {
  $group = get_field('sections_content', 'options')['customized_trips'];
} else {
  $group = $data['group']['customized_trips'];
}

if ($hide_section) return;
if (!$group) return;
$title = $group['title'];
$show_all = $group['show_all'];
$items = $group['items'];
if ($show_all) {
  $args = array(
    'post_type' => 'use-case',
    'posts_per_page' => -1,
    'orderby' => 'date',
    'order' => 'ASC',
    'post_status' => 'publish',
  );
  $items = get_posts($args);
}
if (empty($items)) return;
?>
<section class="custom-trips" id="<?php echo $section_id; ?>">
  <header class="custom-trips__head">
    <?php if (!empty($title)) echo '<h2 class="section-title">' . wp_kses_post($title) . '</h2>'; ?>
  </header>

  <div class="custom-trips__slider">
    <div class="swiper-wrapper">
      <?php foreach ($items as $item): ?>
        <?php
        $duration = get_field('trip_duration', $item->ID);
        $capacity = get_field('trip_сapacity', $item->ID);
        ?>
        <article class="custom-trips__card swiper-slide">
          <figure class="custom-trips__card-image">
            <?php echo get_the_post_thumbnail($item->ID, 'full', ['loading' => 'lazy']) ?>
          </figure>
          <div class="custom-trips__card-body">
            <h3 class="custom-trips__card-title"><?php echo get_the_title($item->ID) ?></h3>
            <p class="custom-trips__card-desc"><?php echo get_the_excerpt($item->ID) ?></p>
            <?php if (!empty($duration) || !empty($capacity)): ?>
              <p class="custom-trips__card-meta">
                <span><?php echo $duration ?></span>
                <span class="custom-trips__card-bullet" aria-hidden="true"></span>
                <span><?php echo $capacity ?></span>
              </p>
            <?php endif; ?>
            <button type="button" class="custom-trips__card-cta" data-fancybox data-src="#trip-modal-<?php echo $item->ID; ?>">
              קרא עוד
            </button>
          </div>
        </article>
      <?php endforeach; ?>
    </div>
  </div>

  <div class="custom-trips__nav">
    <button type="button" class="custom-trips__nav-btn custom-trips__nav-prev" aria-label="הקודם">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </button>
    <button type="button" class="custom-trips__nav-btn custom-trips__nav-next" aria-label="הבא">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    </button>
  </div>

  <!-- Modal sources (cloned by Fancybox on open) -->
  <div class="trip-modal-sources" hidden>
    <?php foreach ($items as $item): ?>
      <div id="trip-modal-<?php echo $item->ID; ?>" class="trip-modal" dir="rtl">
        <button type="button" class="trip-modal__close"
          data-fancybox-close aria-label="סגור"><span class="trip-modal__close-text">סגור</span><svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"
            aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg></button>
        <div class="trip-modal__media">
          <?php echo get_the_post_thumbnail($item->ID, 'full', ['loading' => 'lazy']) ?>
        </div>
        <div class="trip-modal__body">
          <h3 class="trip-modal__title"><?php echo get_the_title($item->ID) ?></h3>
          <p class="trip-modal__meta"><?php echo get_field('trip_duration', $item->ID) ?> • <?php echo get_field('trip_сapacity', $item->ID) ?></p>
          <p class="trip-modal__desc"><?php echo get_field('modal_content', $item->ID); ?></p>
          <?php
          $tags = get_field('tags', $item->ID);
          $quote = get_field('quote', $item->ID);
          $quote_text = !empty($quote) ? $quote['text'] : '';
          $quote_author =  !empty($quote) ? $quote['author'] : '';
          if (!empty($tags)):
          ?>
            <div class="trip-modal__tags">
              <?php foreach ($tags as $tag): ?>
                <span class="trip-modal__tag"><?php echo esc_html($tag['item']); ?></span>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
          <?php if (!empty($quote_text)): ?>
            <blockquote class="trip-modal__quote">
              <p><?php echo esc_html($quote_text); ?></p>
              <cite><?php echo esc_html($quote_author); ?></cite>
            </blockquote>
          <?php endif; ?>
        </div>
      </div>
    <?php endforeach; ?>
  </div><!-- /.trip-modal-sources -->
</section>
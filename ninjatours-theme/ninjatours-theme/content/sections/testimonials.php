<?php
$dir = get_template_directory_uri() . '/assets/app/';
$data = $args['item'];
$use_general = $data['use_general_settings'];
$hide_section = $data['hide_section'];
$section_id = $data['section_id'];

if ($section_id) {
  $section_id = 'testimonials-' . $args['i'];
}

if ($use_general) {
  $group = get_field('sections_content', 'options')['testimonials'];
} else {
  $group = $data['group']['testimonials'];
}

if ($hide_section) return;
if (!$group) return;
$title = $group['title'];
$show_all = $group['show_all'];
$items = $group['items'];
if ($show_all) {
  $args = array(
    'post_type' => 'testimonial',
    'posts_per_page' => -1,
    'orderby' => 'date',
    'order' => 'ASC',
    'post_status' => 'publish',
  );
  $items = get_posts($args);
}
if (empty($items)) return;
?>
<section class="testimonials" id="testimonials">
  <header class="testimonials__head">
    <span class="testimonials__head-stars" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M12 2 L14.6 8.6 L21.6 9.2 L16.3 13.7 L17.9 20.5 L12 16.9 L6.1 20.5 L7.7 13.7 L2.4 9.2 L9.4 8.6 Z" />
      </svg>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M12 2 L14.6 8.6 L21.6 9.2 L16.3 13.7 L17.9 20.5 L12 16.9 L6.1 20.5 L7.7 13.7 L2.4 9.2 L9.4 8.6 Z" />
      </svg>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M12 2 L14.6 8.6 L21.6 9.2 L16.3 13.7 L17.9 20.5 L12 16.9 L6.1 20.5 L7.7 13.7 L2.4 9.2 L9.4 8.6 Z" />
      </svg>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M12 2 L14.6 8.6 L21.6 9.2 L16.3 13.7 L17.9 20.5 L12 16.9 L6.1 20.5 L7.7 13.7 L2.4 9.2 L9.4 8.6 Z" />
      </svg>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M12 2 L14.6 8.6 L21.6 9.2 L16.3 13.7 L17.9 20.5 L12 16.9 L6.1 20.5 L7.7 13.7 L2.4 9.2 L9.4 8.6 Z" />
      </svg>
    </span>
    <?php if (!empty($title)) echo '<h2 class="section-title">' . wp_kses_post($title) . '</h2>'; ?>
  </header>

  <div class="testimonials__slider">
    <div class="swiper-wrapper">
      <?php foreach ($items as $item): ?>
        <?php
        $text = get_field('text', $item->ID);
        $name = get_field('name', $item->ID);
        $photo = get_field('photo', $item->ID);
        ?>
        <article class="testimonials__card swiper-slide">
          <span class="testimonials__quote-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 11h-3l3-7h2zm7 0h-3l3-7h2z" />
            </svg>
          </span>
          <p class="testimonials__quote"><?php echo esc_html($text); ?></p>
          <div class="testimonials__author">
            <div class="testimonials__author-info">
              <?php echo wp_get_attachment_image($photo, 'full', false, ['class' => 'testimonials__author-photo', 'loading' => 'lazy']); ?>
              <div class="testimonials__author-text">
                <span class="testimonials__author-name"><?php echo esc_html($name); ?></span>
                <span class="testimonials__author-stars" aria-hidden="true">★★★★★</span>
              </div>
            </div>
            <span class="testimonials__google" aria-label="Google review">
              <svg viewBox="0 0 48 48">
                <path fill="#FFC107"
                  d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4C12.9 4 4 12.9 4 24s8.9 20 20 20s20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
                <path fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4C16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50"
                  d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5c-2 1.5-4.6 2.5-7.6 2.5c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.7 39.6 16.3 44 24 44z" />
                <path fill="#1976D2"
                  d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4 5.7l6.5 5.5C37.5 39.7 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
              </svg>
            </span>
          </div>
        </article>
      <?php endforeach; ?>
    </div>
  </div>

  <div class="testimonials__nav">
    <button type="button" class="testimonials__nav-btn testimonials__nav-prev" aria-label="הקודם">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </button>
    <button type="button" class="testimonials__nav-btn testimonials__nav-next" aria-label="הבא">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    </button>
  </div>
</section>
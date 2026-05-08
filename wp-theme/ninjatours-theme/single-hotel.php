<?php
/**
 * Single Hotel — flexible_content if present, otherwise default layout.
 */

get_header(); ?>

<main id="main-content" class="page-destinations page-hotel-detail">
  <?php
  $has_fc = function_exists('get_field') && !empty(get_field('flexible_content'));
  if ($has_fc) {
    get_template_part('content/flexible-content');
  } else {
    while (have_posts()): the_post();
      $id            = get_the_ID();
      $rating        = get_field('rating');
      $tagline       = get_field('tagline');
      $gallery       = get_field('gallery') ?: [];
      $amenities     = get_field('amenities') ?: [];
      $rooms         = get_field('rooms') ?: [];
      $location      = get_field('location_text');
      $location_q    = get_field('location_query') ?: get_the_title();
      $related       = nt_get_items_with_fallback('related', 'hotel', $id, 10, ['post__not_in' => [$id]]);
  ?>
      <nav class="breadcrumbs">
        <div class="container">
          <ol class="breadcrumbs__list">
            <li><a href="<?php echo esc_url(home_url('/')); ?>"><?php esc_html_e('עמוד הבית', 'ninjatours'); ?></a></li>
            <li><a href="<?php echo esc_url(get_post_type_archive_link('hotel')); ?>"><?php esc_html_e('מלונות', 'ninjatours'); ?></a></li>
            <li aria-current="page"><?php the_title(); ?></li>
          </ol>
        </div>
      </nav>

      <section class="hotel-hero">
        <div class="container">
          <div class="hotel-hero__top">
            <div>
              <h1 class="hotel-hero__name"><?php the_title(); ?></h1>
              <?php if ($rating): ?>
                <div class="hotel-hero__rating"><?php echo str_repeat('★', (int) $rating); ?></div>
              <?php endif; ?>
              <?php if ($location): ?>
                <div class="hotel-hero__location">
                  <span><?php echo esc_html($location); ?></span>
                </div>
              <?php endif; ?>
            </div>
          </div>

          <?php if (!empty($gallery)): ?>
            <div class="hotel-hero__gallery">
              <?php foreach (array_slice($gallery, 0, 3) as $idx => $img): ?>
                <a href="<?php echo esc_url(wp_get_attachment_image_url($img, 'full')); ?>" data-fancybox="hotel-gallery" class="<?php echo $idx === 0 ? 'hotel-hero__gallery-main' : 'hotel-hero__gallery-side'; ?>">
                  <img src="<?php echo esc_url(wp_get_attachment_image_url($img, 'large')); ?>" alt="" loading="lazy">
                </a>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </div>
      </section>

      <section class="hotel-detail">
        <div class="container">
          <div class="hotel-detail__layout">
            <div class="hotel-detail__body">
              <h2><?php esc_html_e('על המלון', 'ninjatours'); ?></h2>
              <?php the_content(); ?>

              <?php if (!empty($amenities)): ?>
                <h2><?php esc_html_e('מתקנים פופולריים', 'ninjatours'); ?></h2>
                <ul class="hotel-amenities">
                  <?php foreach ($amenities as $a): ?>
                    <li>
                      <?php if (!empty($a['icon'])) echo wp_get_attachment_image($a['icon'], 'thumbnail', false, ['loading' => 'lazy']); ?>
                      <span><?php echo esc_html($a['name'] ?? ''); ?></span>
                    </li>
                  <?php endforeach; ?>
                </ul>
              <?php endif; ?>

              <?php if (!empty($rooms)): ?>
                <h2><?php esc_html_e('חדרים', 'ninjatours'); ?></h2>
                <div class="hotel-rooms">
                  <?php foreach ($rooms as $room): ?>
                    <article class="hotel-rooms__card">
                      <?php if (!empty($room['image'])) echo wp_get_attachment_image($room['image'], 'medium_large', false, ['loading' => 'lazy']); ?>
                      <div class="hotel-rooms__body">
                        <h3><?php echo esc_html($room['name'] ?? ''); ?></h3>
                        <ul>
                          <?php if (!empty($room['size'])):  ?><li><?php echo esc_html($room['size']);  ?></li><?php endif; ?>
                          <?php if (!empty($room['pax'])):   ?><li><?php echo esc_html($room['pax']);   ?></li><?php endif; ?>
                          <?php if (!empty($room['price'])): ?><li><?php echo esc_html($room['price']); ?></li><?php endif; ?>
                        </ul>
                      </div>
                    </article>
                  <?php endforeach; ?>
                </div>
              <?php endif; ?>
            </div>

            <aside>
              <div class="hotel-detail__sidebar-card">
                <h3><?php esc_html_e('מידע שימושי', 'ninjatours'); ?></h3>
                <?php if ($rating): ?>
                  <div class="hotel-detail__sidebar-highlight"><span><strong><?php esc_html_e('דירוג', 'ninjatours'); ?>:</strong> <?php echo str_repeat('★', (int) $rating); ?></span></div>
                <?php endif; ?>
                <?php if ($location): ?>
                  <div class="hotel-detail__sidebar-highlight"><span><strong><?php esc_html_e('מיקום', 'ninjatours'); ?>:</strong> <?php echo esc_html($location); ?></span></div>
                <?php endif; ?>
                <a class="hotel-detail__sidebar-cta" href="<?php echo esc_url(home_url('/#contact')); ?>"><?php esc_html_e('להזמנת חופשה אישית', 'ninjatours'); ?></a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <?php if ($location_q): ?>
        <section class="hotel-location" id="location">
          <div class="container">
            <h2 class="hotel-location__title"><?php esc_html_e('מיקום המלון', 'ninjatours'); ?></h2>
            <div class="hotel-location__map">
              <iframe src="https://maps.google.com/maps?q=<?php echo urlencode($location_q); ?>&z=16&output=embed" loading="lazy"></iframe>
            </div>
          </div>
        </section>
      <?php endif; ?>

      <?php if (!empty($related)): ?>
        <section class="related-attractions">
          <div class="related-attractions__header">
            <h2 class="related-attractions__title"><?php esc_html_e('מלונות נוספים', 'ninjatours'); ?></h2>
          </div>
          <div class="related-attractions__slider swiper" id="related-attractions-slider">
            <div class="swiper-wrapper">
              <?php foreach ($related as $rel): ?>
                <div class="swiper-slide">
                  <?php get_template_part('parts/hotel-card', null, ['id' => $rel->ID]); ?>
                </div>
              <?php endforeach; ?>
            </div>
          </div>
        </section>
      <?php endif; ?>
  <?php endwhile;
  } ?>
</main>

<?php get_footer(); ?>

<?php
/**
 * Single Attraction.
 * Renders flexible_content if the editor has built one for this post,
 * otherwise renders a default layout pulling from CPT-specific ACF fields
 * (gallery, info chips, location map, related slider).
 */

get_header(); ?>

<main id="main-content" class="page-destinations page-attraction-detail">
  <?php
  $has_fc = function_exists('get_field') && !empty(get_field('flexible_content'));
  if ($has_fc) {
    get_template_part('content/flexible-content');
  } else {
    while (have_posts()): the_post();
      $id              = get_the_ID();
      $gallery         = get_field('gallery') ?: [];
      $location_text   = get_field('location_text');
      $location_query  = get_field('location_query') ?: get_the_title();
      $info_chips      = get_field('info_chips') ?: [];
      $tips            = get_field('tips') ?: [];
      $related         = nt_get_items_with_fallback('related', 'attraction', $id, 10, ['post__not_in' => [$id]]);
      $cats            = get_the_terms($id, 'attraction-category');
  ?>
      <nav class="breadcrumbs" aria-label="<?php esc_attr_e('פירורי לחם', 'ninjatours'); ?>">
        <div class="container">
          <ol class="breadcrumbs__list">
            <li><a href="<?php echo esc_url(home_url('/')); ?>"><?php esc_html_e('עמוד הבית', 'ninjatours'); ?></a></li>
            <li><a href="<?php echo esc_url(get_post_type_archive_link('attraction')); ?>"><?php esc_html_e('אטרקציות', 'ninjatours'); ?></a></li>
            <li aria-current="page"><?php the_title(); ?></li>
          </ol>
        </div>
      </nav>

      <section class="hotel-hero">
        <div class="container">
          <div class="hotel-hero__top">
            <div>
              <h1 class="hotel-hero__name"><?php the_title(); ?></h1>
              <?php if ($location_text): ?>
                <div class="hotel-hero__location">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span><?php echo esc_html($location_text); ?> — <a href="#location"><?php esc_html_e('הצג על המפה', 'ninjatours'); ?></a></span>
                </div>
              <?php endif; ?>
            </div>
          </div>

          <?php if (!empty($gallery)): ?>
            <div class="hotel-hero__gallery">
              <?php
              $first = array_slice($gallery, 0, 3);
              $rest  = array_slice($gallery, 3);
              foreach ($first as $idx => $img):
                $url   = wp_get_attachment_image_url($img, 'full');
                $thumb = wp_get_attachment_image_url($img, 'large');
                $class = $idx === 0 ? 'hotel-hero__gallery-main' : 'hotel-hero__gallery-side';
              ?>
                <a href="<?php echo esc_url($url); ?>" data-fancybox="attraction-gallery" class="<?php echo esc_attr($class); ?>">
                  <img src="<?php echo esc_url($thumb); ?>" alt="" loading="lazy">
                  <?php if ($idx === 2 && !empty($rest)): ?>
                    <span class="hotel-hero__gallery-more">+<?php echo count($rest); ?></span>
                  <?php endif; ?>
                </a>
              <?php endforeach; ?>
              <?php foreach ($rest as $img): ?>
                <a href="<?php echo esc_url(wp_get_attachment_image_url($img, 'full')); ?>" data-fancybox="attraction-gallery" class="--fb-hidden"></a>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>

          <?php if (!empty($cats) && !is_wp_error($cats)): ?>
            <div class="hotel-hero__tags">
              <?php foreach ($cats as $cat): ?>
                <span class="hotel-hero__tag"><?php echo esc_html($cat->name); ?></span>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </div>
      </section>

      <?php if (!empty($info_chips)): ?>
        <section class="attraction-info">
          <div class="container">
            <ul class="attraction-info__list">
              <?php foreach ($info_chips as $chip): ?>
                <li class="attraction-info__chip">
                  <?php if (!empty($chip['icon'])) echo wp_get_attachment_image($chip['icon'], 'thumbnail', false, ['loading' => 'lazy']); ?>
                  <div>
                    <span class="attraction-info__chip-label"><?php echo esc_html($chip['label'] ?? ''); ?></span>
                    <span class="attraction-info__chip-value"><?php echo esc_html($chip['value'] ?? ''); ?></span>
                  </div>
                </li>
              <?php endforeach; ?>
            </ul>
          </div>
        </section>
      <?php endif; ?>

      <section class="hotel-detail">
        <div class="container">
          <div class="hotel-detail__layout">
            <div class="hotel-detail__body">
              <h2><?php esc_html_e('על האטרקציה', 'ninjatours'); ?></h2>
              <?php the_content(); ?>

              <?php if (!empty($tips)): ?>
                <h2><?php esc_html_e('טיפים לביקור', 'ninjatours'); ?></h2>
                <ul class="attraction-tips">
                  <?php foreach ($tips as $tip): ?>
                    <li><strong><?php echo esc_html($tip['title'] ?? ''); ?></strong> — <?php echo esc_html($tip['text'] ?? ''); ?></li>
                  <?php endforeach; ?>
                </ul>
              <?php endif; ?>
            </div>

            <aside>
              <div class="hotel-detail__sidebar-card">
                <h3><?php esc_html_e('מידע שימושי', 'ninjatours'); ?></h3>
                <?php foreach ($info_chips as $chip): ?>
                  <div class="hotel-detail__sidebar-highlight">
                    <?php if (!empty($chip['icon'])) echo wp_get_attachment_image($chip['icon'], 'thumbnail', false, ['loading' => 'lazy']); ?>
                    <span><strong><?php echo esc_html($chip['label'] ?? ''); ?>:</strong> <?php echo esc_html($chip['value'] ?? ''); ?></span>
                  </div>
                <?php endforeach; ?>
                <a class="hotel-detail__sidebar-cta" href="<?php echo esc_url(home_url('/#contact')); ?>"><?php esc_html_e('להתאמת טיול אישי', 'ninjatours'); ?></a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <?php if ($location_query): ?>
        <section class="hotel-location" id="location">
          <div class="container">
            <h2 class="hotel-location__title"><?php esc_html_e('מיקום האטרקציה', 'ninjatours'); ?></h2>
            <div class="hotel-location__map">
              <iframe src="https://maps.google.com/maps?q=<?php echo urlencode($location_query); ?>&z=16&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            </div>
          </div>
        </section>
      <?php endif; ?>

      <?php if (!empty($related)): ?>
        <section class="related-attractions">
          <div class="related-attractions__header">
            <h2 class="related-attractions__title"><?php esc_html_e('אטרקציות קשורות', 'ninjatours'); ?></h2>
          </div>
          <div class="related-attractions__slider swiper" id="related-attractions-slider">
            <div class="swiper-wrapper">
              <?php foreach ($related as $rel): ?>
                <div class="swiper-slide">
                  <?php get_template_part('parts/attraction-card', null, ['id' => $rel->ID]); ?>
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

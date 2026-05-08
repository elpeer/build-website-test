<?php
/**
 * Single Destination — flexible_content if present, otherwise default layout
 * with related hotels + attractions sliders.
 */

get_header(); ?>

<main id="main-content" class="page-destinations">
  <?php
  $has_fc = function_exists('get_field') && !empty(get_field('flexible_content'));
  if ($has_fc) {
    get_template_part('content/flexible-content');
  } else {
    while (have_posts()): the_post();
      $id           = get_the_ID();
      $hero_image   = get_field('hero_image');
      $tagline      = get_field('tagline');
      $top_attr     = nt_get_items_with_fallback('top_attractions', 'attraction', $id, 6);
      $top_hotels   = nt_get_items_with_fallback('top_hotels',      'hotel',      $id, 4);
  ?>
      <section class="destination-hero">
        <div class="destination-hero__media">
          <?php
          if ($hero_image) echo wp_get_attachment_image($hero_image, 'full', false, ['loading' => 'eager']);
          elseif (has_post_thumbnail()) the_post_thumbnail('full', ['loading' => 'eager']);
          ?>
          <div class="destination-hero__overlay" aria-hidden="true"></div>
        </div>
        <div class="container">
          <h1 class="destination-hero__title"><?php the_title(); ?></h1>
          <?php if ($tagline): ?><p class="destination-hero__tagline"><?php echo esc_html($tagline); ?></p><?php endif; ?>
        </div>
      </section>

      <section class="destination-body">
        <div class="container">
          <div class="editor-area"><?php the_content(); ?></div>
        </div>
      </section>

      <?php if (!empty($top_attr)): ?>
        <section class="attractions">
          <div class="container">
            <header class="attractions__head">
              <h2 class="section-title"><?php esc_html_e('אטרקציות מומלצות ב', 'ninjatours'); ?><?php the_title(); ?></h2>
            </header>
            <div class="attractions__grid">
              <?php foreach ($top_attr as $rel): ?>
                <?php get_template_part('parts/attraction-card', null, ['id' => $rel->ID]); ?>
              <?php endforeach; ?>
            </div>
          </div>
        </section>
      <?php endif; ?>

      <?php if (!empty($top_hotels)): ?>
        <section class="hotels">
          <div class="container">
            <header class="hotels__head">
              <h2 class="section-title"><?php esc_html_e('מלונות נבחרים', 'ninjatours'); ?></h2>
            </header>
            <div class="hotels__grid">
              <?php foreach ($top_hotels as $rel): ?>
                <?php get_template_part('parts/hotel-card', null, ['id' => $rel->ID]); ?>
              <?php endforeach; ?>
            </div>
          </div>
        </section>
      <?php endif; ?>
  <?php endwhile;
  } ?>
</main>

<?php get_footer(); ?>

<?php
/**
 * Travel Types archive — same trip-types slider as the homepage section,
 * just rendered as a full-page grid.
 */

get_header();

$query = new WP_Query([
  'post_type'      => 'travel-type',
  'posts_per_page' => -1,
  'orderby'        => 'menu_order date',
  'order'          => 'ASC',
]);
?>

<main id="main-content" class="page-destinations">
  <section class="trip-types">
    <header class="trip-types__head">
      <h2 class="section-title"><?php post_type_archive_title(); ?></h2>
    </header>
    <div class="container">
      <div class="trip-types__grid">
        <?php if ($query->have_posts()): while ($query->have_posts()): $query->the_post();
          $tagline = get_field('tagline') ?: get_the_excerpt();
        ?>
          <a href="<?php the_permalink(); ?>" class="trip-types__card">
            <?php the_post_thumbnail('large', ['class' => 'trip-types__card-img', 'loading' => 'lazy']); ?>
            <span class="trip-types__card-overlay" aria-hidden="true"></span>
            <div class="trip-types__card-body">
              <h3 class="trip-types__card-title"><?php the_title(); ?></h3>
              <?php if ($tagline): ?><p class="trip-types__card-desc"><?php echo esc_html($tagline); ?></p><?php endif; ?>
            </div>
          </a>
        <?php endwhile; wp_reset_postdata(); else: ?>
          <p class="empty-state"><?php esc_html_e('עדיין לא הוגדרו סוגי טיולים.', 'ninjatours'); ?></p>
        <?php endif; ?>
      </div>
    </div>
  </section>
</main>

<?php get_footer(); ?>

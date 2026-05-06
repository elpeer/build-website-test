<?php
get_header();

$query = new WP_Query([
  'post_type'      => 'destination',
  'posts_per_page' => -1,
  'orderby'        => 'menu_order date',
  'order'          => 'ASC',
]);
?>

<main id="main-content" class="page-destinations">
  <section class="destinations">
    <div class="container">
      <header class="destinations__head">
        <h2 class="section-title"><?php post_type_archive_title(); ?></h2>
      </header>
      <div class="destinations__grid">
        <?php if ($query->have_posts()): while ($query->have_posts()): $query->the_post(); ?>
          <?php get_template_part('parts/destination-card', null, ['id' => get_the_ID()]); ?>
        <?php endwhile; wp_reset_postdata(); else: ?>
          <p class="empty-state"><?php esc_html_e('עדיין לא הוספנו יעדים.', 'ninjatours'); ?></p>
        <?php endif; ?>
      </div>
    </div>
  </section>
</main>

<?php get_footer(); ?>

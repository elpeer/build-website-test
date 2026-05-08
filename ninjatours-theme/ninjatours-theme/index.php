<?php
get_header(); ?>

<main class="inner-page --compensate-for-header">
  <div class="container --index">
    <?php if (have_posts()) : ?>
      <h1 class="page-title"><?php echo get_the_archive_title(); ?></h1>
      <div class="grid">
        <?php while (have_posts()) : the_post(); ?>
          <?php get_template_part('parts/post-item', null, ['id' => get_the_ID()]); ?>
        <?php endwhile; ?>
        <?php the_posts_navigation(); ?>
      <?php endif; ?>
      </div>
  </div>
</main>

<?php get_footer();

<?php
/**
 * Generic singular template — used for any single post type that doesn't have
 * a more specific template. Renders flexible_content if present, otherwise
 * falls back to a basic title + featured image + content layout.
 */

get_header(); ?>

<main id="main-content" class="page-destinations">
  <?php
  $has_fc = function_exists('get_field') && !empty(get_field('flexible_content'));

  if ($has_fc):
    get_template_part('content/flexible-content');
  else: ?>
    <article class="basic-single">
      <div class="container">
        <?php while (have_posts()): the_post(); ?>
          <?php if (has_post_thumbnail()): ?>
            <figure class="basic-single__image"><?php the_post_thumbnail('large'); ?></figure>
          <?php endif; ?>
          <h1 class="basic-single__title"><?php the_title(); ?></h1>
          <div class="basic-single__content editor-area"><?php the_content(); ?></div>
        <?php endwhile; ?>
      </div>
    </article>
  <?php endif; ?>
</main>

<?php get_footer(); ?>

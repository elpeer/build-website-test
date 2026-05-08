<?php
/**
 * Fallback template — used when no more specific template matches.
 * Most content uses page-flexible-content.php or single-{cpt}.php.
 */

get_header(); ?>

<main id="main-content" class="page-destinations">
  <div class="container">
    <?php if (have_posts()): ?>
      <?php if (is_archive() || is_home()): ?>
        <h1 class="page-title"><?php echo wp_kses_post(get_the_archive_title()); ?></h1>
        <?php if ($desc = get_the_archive_description()): ?>
          <div class="archive-description"><?php echo wp_kses_post($desc); ?></div>
        <?php endif; ?>
      <?php endif; ?>

      <div class="post-grid">
        <?php while (have_posts()): the_post(); ?>
          <article class="post-grid__item">
            <a href="<?php the_permalink(); ?>" class="post-grid__link">
              <?php if (has_post_thumbnail()): ?>
                <div class="post-grid__image">
                  <?php the_post_thumbnail('large'); ?>
                </div>
              <?php endif; ?>
              <h2 class="post-grid__title"><?php the_title(); ?></h2>
              <p class="post-grid__excerpt"><?php echo esc_html(get_the_excerpt()); ?></p>
            </a>
          </article>
        <?php endwhile; ?>
      </div>

      <?php the_posts_pagination(); ?>
    <?php else: ?>
      <h1 class="page-title"><?php esc_html_e('לא נמצאו פריטים', 'ninjatours'); ?></h1>
    <?php endif; ?>
  </div>
</main>

<?php get_footer(); ?>

<?php get_header(); ?>

<main id="main-content" class="page-destinations">
  <div class="container">
    <h1 class="page-title">
      <?php printf(esc_html__('תוצאות חיפוש עבור: %s', 'ninjatours'), '<em>' . esc_html(get_search_query()) . '</em>'); ?>
    </h1>

    <?php if (have_posts()): ?>
      <div class="search-results">
        <?php while (have_posts()): the_post(); ?>
          <article class="search-result">
            <a href="<?php the_permalink(); ?>">
              <?php if (has_post_thumbnail()): the_post_thumbnail('medium'); endif; ?>
              <h2><?php the_title(); ?></h2>
              <p><?php echo esc_html(get_the_excerpt()); ?></p>
            </a>
          </article>
        <?php endwhile; ?>
      </div>
      <?php the_posts_pagination(); ?>
    <?php else: ?>
      <p class="empty-state"><?php esc_html_e('לא נמצאו תוצאות. נסו לחפש מילה אחרת.', 'ninjatours'); ?></p>
    <?php endif; ?>
  </div>
</main>

<?php get_footer(); ?>

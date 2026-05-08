<?php
/**
 * Single Use Case — most use cases are shown as modals from the homepage,
 * but they also have their own URL for SEO. Renders FC if present.
 */

get_header(); ?>

<main id="main-content" class="page-destinations">
  <?php
  $has_fc = function_exists('get_field') && !empty(get_field('flexible_content'));
  if ($has_fc) {
    get_template_part('content/flexible-content');
  } else {
    while (have_posts()): the_post();
      $duration   = get_field('trip_duration');
      $capacity   = get_field('trip_capacity');
      $modal      = get_field('modal_content');
      $quote      = get_field('quote');
  ?>
      <article class="use-case-single">
        <div class="container">
          <h1><?php the_title(); ?></h1>
          <?php if (has_post_thumbnail()): ?>
            <figure><?php the_post_thumbnail('large'); ?></figure>
          <?php endif; ?>
          <?php if ($duration || $capacity): ?>
            <p class="use-case-single__meta">
              <?php echo esc_html($duration); ?>
              <?php if ($duration && $capacity): ?> · <?php endif; ?>
              <?php echo esc_html($capacity); ?>
            </p>
          <?php endif; ?>
          <div class="editor-area"><?php echo wp_kses_post($modal ?: get_the_content()); ?></div>

          <?php if (!empty($quote['text'])): ?>
            <blockquote class="trip-modal__quote">
              <p><?php echo esc_html($quote['text']); ?></p>
              <?php if (!empty($quote['author'])): ?><cite><?php echo esc_html($quote['author']); ?></cite><?php endif; ?>
            </blockquote>
          <?php endif; ?>
        </div>
      </article>
  <?php endwhile;
  } ?>
</main>

<?php get_footer(); ?>

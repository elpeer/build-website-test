<?php
/**
 * Attractions archive — title + AJAX-filterable grid.
 * The grid uses the same `parts/attraction-card.php` and the same JS
 * filter handler as the attractions homepage section.
 */

get_header();

$cats = get_terms(['taxonomy' => 'attraction-category', 'hide_empty' => true]);
$query = new WP_Query([
  'post_type'      => 'attraction',
  'posts_per_page' => -1,
  'orderby'        => 'date',
  'order'          => 'DESC',
]);
?>

<main id="main-content" class="page-destinations">
  <section class="attractions">
    <div class="container">
      <header class="attractions__head">
        <h2 class="section-title"><?php post_type_archive_title(); ?></h2>
      </header>

      <?php if (!empty($cats) && !is_wp_error($cats)): ?>
        <div class="attractions__tabs" role="tablist">
          <button type="button" class="attractions__tab --active" role="tab" data-tab="all" aria-selected="true"><span><?php esc_html_e('הכל', 'ninjatours'); ?></span></button>
          <?php foreach ($cats as $cat):
            $icon = function_exists('get_field') ? get_field('icon', $cat) : null;
          ?>
            <button type="button" class="attractions__tab" role="tab" data-tab="<?php echo (int) $cat->term_id; ?>" aria-selected="false">
              <?php if ($icon) echo wp_get_attachment_image($icon, 'thumbnail', false, ['loading' => 'lazy']); ?>
              <span><?php echo esc_html($cat->name); ?></span>
            </button>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

      <div class="attractions__grid" data-attractions-grid>
        <?php if ($query->have_posts()): while ($query->have_posts()): $query->the_post(); ?>
          <?php get_template_part('parts/attraction-card', null, ['id' => get_the_ID()]); ?>
        <?php endwhile; wp_reset_postdata(); else: ?>
          <p class="empty-state"><?php esc_html_e('עדיין לא הוספנו אטרקציות. בקרוב!', 'ninjatours'); ?></p>
        <?php endif; ?>
      </div>
    </div>
  </section>
</main>

<?php get_footer(); ?>

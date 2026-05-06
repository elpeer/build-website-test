<?php
/**
 * Hotels archive — filterable by city / audience / rating via AJAX.
 */

get_header();

$cities    = get_terms(['taxonomy' => 'hotel-city',     'hide_empty' => true]);
$audiences = get_terms(['taxonomy' => 'hotel-audience', 'hide_empty' => true]);

$query = new WP_Query([
  'post_type'      => 'hotel',
  'posts_per_page' => -1,
  'orderby'        => 'date',
  'order'          => 'DESC',
]);
?>

<main id="main-content" class="page-destinations">
  <section class="hotels">
    <div class="container">
      <header class="hotels__head">
        <h2 class="section-title"><?php post_type_archive_title(); ?></h2>
      </header>

      <div class="hotels__filters" data-hotels-filters>
        <?php if (!empty($cities) && !is_wp_error($cities)): ?>
          <div class="custom-dropdown" data-filter-tax="hotel-city">
            <button type="button" class="custom-dropdown__toggle"><?php esc_html_e('עיר', 'ninjatours'); ?></button>
            <ul class="custom-dropdown__menu">
              <?php foreach ($cities as $term): ?>
                <li><label><input type="checkbox" value="<?php echo (int) $term->term_id; ?>"> <?php echo esc_html($term->name); ?></label></li>
              <?php endforeach; ?>
            </ul>
          </div>
        <?php endif; ?>
        <?php if (!empty($audiences) && !is_wp_error($audiences)): ?>
          <div class="custom-dropdown" data-filter-tax="hotel-audience">
            <button type="button" class="custom-dropdown__toggle"><?php esc_html_e('קהל יעד', 'ninjatours'); ?></button>
            <ul class="custom-dropdown__menu">
              <?php foreach ($audiences as $term): ?>
                <li><label><input type="checkbox" value="<?php echo (int) $term->term_id; ?>"> <?php echo esc_html($term->name); ?></label></li>
              <?php endforeach; ?>
            </ul>
          </div>
        <?php endif; ?>
      </div>

      <div class="hotels__grid" data-hotels-grid>
        <?php if ($query->have_posts()): while ($query->have_posts()): $query->the_post(); ?>
          <?php get_template_part('parts/hotel-card', null, ['id' => get_the_ID()]); ?>
        <?php endwhile; wp_reset_postdata(); else: ?>
          <p class="empty-state"><?php esc_html_e('עדיין לא הוספנו מלונות.', 'ninjatours'); ?></p>
        <?php endif; ?>
      </div>
    </div>
  </section>
</main>

<?php get_footer(); ?>

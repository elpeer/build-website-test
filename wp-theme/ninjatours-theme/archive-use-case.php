<?php
get_header();

$audiences = get_terms(['taxonomy' => 'trip-audience', 'hide_empty' => true]);
$tags      = get_terms(['taxonomy' => 'trip-tag',      'hide_empty' => true]);
$lengths   = get_terms(['taxonomy' => 'trip-length',   'hide_empty' => true]);

$query = new WP_Query([
  'post_type'      => 'use-case',
  'posts_per_page' => -1,
  'orderby'        => 'date',
  'order'          => 'DESC',
]);
?>

<main id="main-content" class="page-destinations page-use-cases">
  <section class="custom-trips">
    <div class="container">
      <header class="custom-trips__head">
        <h2 class="section-title"><?php post_type_archive_title(); ?></h2>
      </header>

      <div class="custom-trips__filters" data-use-case-filters>
        <?php foreach ([
          'trip-audience' => [__('קהל יעד', 'ninjatours'), $audiences],
          'trip-tag'      => [__('תגיות',   'ninjatours'), $tags],
          'trip-length'   => [__('אורך',    'ninjatours'), $lengths],
        ] as $tax => [$label, $terms]):
          if (empty($terms) || is_wp_error($terms)) continue;
        ?>
          <div class="custom-dropdown" data-filter-tax="<?php echo esc_attr($tax); ?>">
            <button type="button" class="custom-dropdown__toggle"><?php echo esc_html($label); ?></button>
            <ul class="custom-dropdown__menu">
              <?php foreach ($terms as $t): ?>
                <li><label><input type="checkbox" value="<?php echo (int) $t->term_id; ?>"> <?php echo esc_html($t->name); ?></label></li>
              <?php endforeach; ?>
            </ul>
          </div>
        <?php endforeach; ?>
      </div>

      <div class="custom-trips__grid" data-use-cases-grid>
        <?php if ($query->have_posts()): while ($query->have_posts()): $query->the_post(); ?>
          <?php get_template_part('parts/use-case-card', null, ['id' => get_the_ID()]); ?>
        <?php endwhile; wp_reset_postdata(); else: ?>
          <p class="empty-state"><?php esc_html_e('עדיין לא הוספנו טיולים.', 'ninjatours'); ?></p>
        <?php endif; ?>
      </div>

      <?php /* Modals — clones for Fancybox */ ?>
      <?php if ($query->have_posts()): ?>
        <div class="trip-modal-sources" hidden>
          <?php while ($query->have_posts()): $query->the_post(); ?>
            <?php get_template_part('parts/use-case-modal', null, ['id' => get_the_ID()]); ?>
          <?php endwhile; wp_reset_postdata(); ?>
        </div>
      <?php endif; ?>
    </div>
  </section>
</main>

<?php get_footer(); ?>

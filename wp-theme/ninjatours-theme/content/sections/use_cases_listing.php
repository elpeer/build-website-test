<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'use_cases_listing';
$slug       = 'use-cases-listing';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout) ?? [];

$show_filters = !empty($group['show_filters']) || !isset($group['show_filters']);
$show_all     = !empty($group['show_all']);

$items = $show_all
  ? nt_get_items_with_fallback('__force_empty__', 'use-case', false, 30)
  : (!empty($group['items'])
      ? array_filter(array_map(fn($i) => $i instanceof WP_Post ? $i : get_post($i), (array) $group['items']))
      : nt_get_items_with_fallback('__force_empty__', 'use-case', false, 30));

if (empty($items)) return;

$audiences = $show_filters ? get_terms(['taxonomy' => 'trip-audience', 'hide_empty' => false]) : [];
$tags      = $show_filters ? get_terms(['taxonomy' => 'trip-tag',      'hide_empty' => false]) : [];
$lengths   = $show_filters ? get_terms(['taxonomy' => 'trip-length',   'hide_empty' => false]) : [];
?>

<?php if ($show_filters): ?>
  <div class="hotels-filter">
    <div class="container">
      <form class="hotels-filter__form" data-use-case-filters onsubmit="event.preventDefault();">
        <div class="hotels-filter__row">
          <?php
          $filters = [
            'trip-audience' => [__('קהל יעד', 'ninjatours'),  $audiences],
            'trip-length'   => [__('אורך טיול', 'ninjatours'), $lengths],
            'trip-tag'      => [__('תגיות', 'ninjatours'),     $tags],
          ];
          foreach ($filters as $tax => [$label, $terms]):
            if (empty($terms) || is_wp_error($terms)) continue;
          ?>
            <div class="hotels-filter__col">
              <label class="hotels-filter__label"><?php echo esc_html($label); ?></label>
              <div class="custom-dropdown" data-filter-tax="<?php echo esc_attr($tax); ?>">
                <button type="button" class="custom-dropdown__trigger" aria-haspopup="listbox" aria-expanded="false">
                  <span class="custom-dropdown__value --placeholder">בחרו…</span>
                  <svg class="custom-dropdown__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <div class="custom-dropdown__panel" role="listbox" aria-multiselectable="true">
                  <?php foreach ($terms as $term): ?>
                    <label class="custom-dropdown__option">
                      <input type="checkbox" value="<?php echo (int) $term->term_id; ?>"><span><?php echo esc_html($term->name); ?></span>
                    </label>
                  <?php endforeach; ?>
                </div>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
        <div class="hotels-filter__active"></div>
      </form>
    </div>
  </div>
<?php endif; ?>

<section class="use-cases-catalog" id="<?php echo esc_attr($section_id); ?>">
  <div class="container">
    <div class="use-cases-catalog__grid" data-use-cases-grid>
      <?php foreach ($items as $item): ?>
        <?php get_template_part('parts/use-case-card', null, ['id' => $item->ID]); ?>
      <?php endforeach; ?>
    </div>

    <div class="trip-modal-sources" hidden>
      <?php foreach ($items as $item): ?>
        <?php get_template_part('parts/use-case-modal', null, ['id' => $item->ID]); ?>
      <?php endforeach; ?>
    </div>
  </div>
</section>

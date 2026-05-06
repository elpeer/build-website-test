<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'hotels_listing';
$slug       = 'hotels-listing';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout) ?? [];

$show_filters = !empty($group['show_filters']) || !isset($group['show_filters']);
$show_all     = !empty($group['show_all']);

$items = $show_all
  ? nt_get_items_with_fallback('__force_empty__', 'hotel', false, 30)
  : (!empty($group['items'])
      ? array_filter(array_map(fn($i) => $i instanceof WP_Post ? $i : get_post($i), (array) $group['items']))
      : nt_get_items_with_fallback('__force_empty__', 'hotel', false, 30));

if (empty($items)) return;

$cities    = $show_filters ? get_terms(['taxonomy' => 'hotel-city',     'hide_empty' => false]) : [];
$audiences = $show_filters ? get_terms(['taxonomy' => 'hotel-audience', 'hide_empty' => false]) : [];
?>

<?php if ($show_filters && (!empty($cities) || !empty($audiences))): ?>
  <div class="hotels-filter" id="<?php echo esc_attr($section_id . '-filter'); ?>">
    <div class="container">
      <form class="hotels-filter__form" data-hotels-filters onsubmit="event.preventDefault();">
        <div class="hotels-filter__row">

          <?php if (!empty($cities) && !is_wp_error($cities)): ?>
            <div class="hotels-filter__col">
              <label class="hotels-filter__label"><?php esc_html_e('עיר', 'ninjatours'); ?></label>
              <div class="custom-dropdown" data-filter-tax="hotel-city">
                <button type="button" class="custom-dropdown__trigger" aria-haspopup="listbox" aria-expanded="false">
                  <span class="custom-dropdown__value --placeholder"><?php esc_html_e('בחרו עיר…', 'ninjatours'); ?></span>
                  <svg class="custom-dropdown__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <div class="custom-dropdown__panel" role="listbox" aria-multiselectable="true">
                  <?php foreach ($cities as $term): ?>
                    <label class="custom-dropdown__option">
                      <input type="checkbox" value="<?php echo (int) $term->term_id; ?>"><span><?php echo esc_html($term->name); ?></span>
                    </label>
                  <?php endforeach; ?>
                </div>
              </div>
            </div>
          <?php endif; ?>

          <?php if (!empty($audiences) && !is_wp_error($audiences)): ?>
            <div class="hotels-filter__col">
              <label class="hotels-filter__label"><?php esc_html_e('למי מתאים?', 'ninjatours'); ?></label>
              <div class="custom-dropdown" data-filter-tax="hotel-audience">
                <button type="button" class="custom-dropdown__trigger" aria-haspopup="listbox" aria-expanded="false">
                  <span class="custom-dropdown__value --placeholder"><?php esc_html_e('בחרו קהל יעד…', 'ninjatours'); ?></span>
                  <svg class="custom-dropdown__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <div class="custom-dropdown__panel" role="listbox" aria-multiselectable="true">
                  <?php foreach ($audiences as $term): ?>
                    <label class="custom-dropdown__option">
                      <input type="checkbox" value="<?php echo (int) $term->term_id; ?>"><span><?php echo esc_html($term->name); ?></span>
                    </label>
                  <?php endforeach; ?>
                </div>
              </div>
            </div>
          <?php endif; ?>

          <div class="hotels-filter__col hotels-filter__col--submit">
            <button type="submit" class="hotels-filter__search-btn">
              <span><?php esc_html_e('הצג תוצאות', 'ninjatours'); ?></span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="hotels-filter__active"></div>
      </form>
    </div>
  </div>
<?php endif; ?>

<section class="hotels-catalog" id="<?php echo esc_attr($section_id); ?>">
  <div class="container">
    <div class="hotels-catalog__grid" data-hotels-grid>
      <?php foreach ($items as $item): ?>
        <?php get_template_part('parts/hotel-card', null, ['id' => $item->ID]); ?>
      <?php endforeach; ?>
    </div>
  </div>
</section>

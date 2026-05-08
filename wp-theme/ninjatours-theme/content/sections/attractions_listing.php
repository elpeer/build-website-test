<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'attractions_listing';
$slug       = 'attractions-listing';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout) ?? [];

$show_filters = !empty($group['show_filters']) || !isset($group['show_filters']);
$show_all     = !empty($group['show_all']);

$items = $show_all
  ? nt_get_items_with_fallback('__force_empty__', 'attraction', false, 30)
  : (!empty($group['items'])
      ? array_filter(array_map(fn($i) => $i instanceof WP_Post ? $i : get_post($i), (array) $group['items']))
      : nt_get_items_with_fallback('__force_empty__', 'attraction', false, 30));

if (empty($items)) return;

$cats = $show_filters ? get_terms(['taxonomy' => 'attraction-category', 'hide_empty' => false]) : [];
?>

<?php if ($show_filters && !empty($cats) && !is_wp_error($cats)): ?>
  <div class="hotels-filter">
    <div class="container">
      <form class="hotels-filter__form" data-attractions-archive-filter onsubmit="event.preventDefault();">
        <div class="hotels-filter__row">
          <div class="hotels-filter__col">
            <label class="hotels-filter__label"><?php esc_html_e('קטגוריה', 'ninjatours'); ?></label>
            <div class="custom-dropdown" data-filter-tax="attraction-category">
              <button type="button" class="custom-dropdown__trigger" aria-haspopup="listbox" aria-expanded="false">
                <span class="custom-dropdown__value --placeholder"><?php esc_html_e('בחרו קטגוריה…', 'ninjatours'); ?></span>
                <svg class="custom-dropdown__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div class="custom-dropdown__panel" role="listbox" aria-multiselectable="true">
                <?php foreach ($cats as $term): ?>
                  <label class="custom-dropdown__option">
                    <input type="checkbox" value="<?php echo (int) $term->term_id; ?>"><span><?php echo esc_html($term->name); ?></span>
                  </label>
                <?php endforeach; ?>
              </div>
            </div>
          </div>

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

<section class="attract-catalog" id="<?php echo esc_attr($section_id); ?>">
  <div class="container">
    <div class="attract-catalog__grid" data-attractions-grid>
      <?php foreach ($items as $item): ?>
        <?php get_template_part('parts/attraction-card', null, ['id' => $item->ID]); ?>
      <?php endforeach; ?>
    </div>
  </div>
</section>

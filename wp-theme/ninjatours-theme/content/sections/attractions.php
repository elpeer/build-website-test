<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'attractions';
$slug       = 'attractions';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout);
if (!$group) return;

$title         = $group['title']         ?? '';
$lead          = $group['lead']          ?? '';
$show_all      = !empty($group['show_all']);
$show_filters  = !empty($group['show_filters']);
$cta           = $group['cta']           ?? null;

$items = $show_all
  ? nt_get_items_with_fallback('__force_empty__', 'attraction', false, 20)
  : (!empty($group['items'])
      ? array_filter(array_map(fn($i) => $i instanceof WP_Post ? $i : get_post($i), (array) $group['items']))
      : nt_get_items_with_fallback('__force_empty__', 'attraction', false, 10));

if (empty($items)) return;

$categories = $show_filters ? get_terms(['taxonomy' => 'attraction-category', 'hide_empty' => true]) : [];
?>

<section class="attractions" id="<?php echo esc_attr($section_id); ?>">
  <div class="container">
    <header class="attractions__head">
      <?php if ($title): ?>
        <h2 class="section-title"><?php echo wp_kses_post(nt_render_title($title)); ?></h2>
      <?php endif; ?>
      <?php if ($lead): ?>
        <p class="attractions__lead"><?php echo esc_html($lead); ?></p>
      <?php endif; ?>
    </header>

    <?php if (!empty($categories) && !is_wp_error($categories)): ?>
      <div class="attractions__tabs" role="tablist" aria-label="<?php esc_attr_e('קטגוריות', 'ninjatours'); ?>">
        <button type="button" class="attractions__tab --active" role="tab" data-tab="all" aria-selected="true">
          <span><?php esc_html_e('הכל', 'ninjatours'); ?></span>
        </button>
        <?php foreach ($categories as $cat):
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
      <?php foreach ($items as $item): ?>
        <?php get_template_part('parts/attraction-card', null, ['id' => $item->ID]); ?>
      <?php endforeach; ?>
    </div>

    <?php nt_render_cta($cta, '--blue --lg', 'attractions__cta'); ?>
  </div>
</section>

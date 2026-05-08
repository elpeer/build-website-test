<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'destinations';
$slug       = 'destinations';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout) ?? [];

$title    = $group['title']    ?? '';
$lead     = $group['lead']     ?? '';
$show_all = !empty($group['show_all']);
$cta      = $group['cta']      ?? null;

$items = $show_all
  ? nt_get_items_with_fallback('__force_empty__', 'destination', false, 12)
  : (!empty($group['items'])
      ? array_filter(array_map(fn($i) => $i instanceof WP_Post ? $i : get_post($i), (array) $group['items']))
      : nt_get_items_with_fallback('__force_empty__', 'destination', false, 10));

if (empty($items)) return;
?>

<section class="destinations" id="<?php echo esc_attr($section_id); ?>">
  <div class="container">
    <?php if ($title || $lead): ?>
      <header class="destinations__head">
        <?php if ($title): ?>
          <h2 class="section-title"><?php echo wp_kses_post(nt_render_title($title)); ?></h2>
        <?php endif; ?>
        <?php if ($lead): ?>
          <p class="destinations__lead"><?php echo esc_html($lead); ?></p>
        <?php endif; ?>
      </header>
    <?php endif; ?>

    <ul class="destinations__grid" role="list">
      <?php foreach ($items as $item): ?>
        <li class="destinations__card" role="listitem">
          <?php get_template_part('parts/destination-card', null, ['id' => $item->ID]); ?>
        </li>
      <?php endforeach; ?>
    </ul>

    <?php nt_render_cta($cta, '--blue --lg', 'destinations__cta'); ?>
  </div>
</section>

<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'hotels';
$slug       = 'hotels';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout);
if (!$group) return;

$title    = $group['title']    ?? '';
$lead     = $group['lead']     ?? '';
$show_all = !empty($group['show_all']);
$cta      = $group['cta']      ?? null;

$items = $show_all
  ? nt_get_items_with_fallback('__force_empty__', 'hotel', false, 20)
  : (!empty($group['items'])
      ? array_filter(array_map(fn($i) => $i instanceof WP_Post ? $i : get_post($i), (array) $group['items']))
      : nt_get_items_with_fallback('__force_empty__', 'hotel', false, 10));

if (empty($items)) return;
?>

<section class="hotels" id="<?php echo esc_attr($section_id); ?>">
  <div class="container">
    <header class="hotels__head">
      <?php if ($title): ?>
        <h2 class="section-title"><?php echo wp_kses_post(nt_render_title($title)); ?></h2>
      <?php endif; ?>
      <?php if ($lead): ?>
        <p class="hotels__lead"><?php echo esc_html($lead); ?></p>
      <?php endif; ?>
    </header>

    <div class="hotels__grid">
      <?php foreach ($items as $item): ?>
        <?php get_template_part('parts/hotel-card', null, ['id' => $item->ID]); ?>
      <?php endforeach; ?>
    </div>

    <?php nt_render_cta($cta, '--blue --lg', 'hotels__cta'); ?>
  </div>
</section>

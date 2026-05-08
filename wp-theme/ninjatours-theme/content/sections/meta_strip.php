<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'meta_strip';
$slug       = 'meta-strip';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout);
if (!$group) return;

$items = $group['items'] ?? [];
if (empty($items)) return;
?>

<section class="tt-meta" id="<?php echo esc_attr($section_id); ?>" aria-label="<?php esc_attr_e('פרטי הטיול', 'ninjatours'); ?>">
  <div class="tt-meta__inner">
    <?php foreach ($items as $item): ?>
      <div class="tt-meta__item">
        <?php if (!empty($item['icon'])): ?>
          <span class="tt-meta__icon">
            <?php echo wp_get_attachment_image($item['icon'], 'thumbnail', false, ['loading' => 'lazy']); ?>
          </span>
        <?php endif; ?>
        <span>
          <?php if (!empty($item['label'])): ?>
            <span class="tt-meta__label"><?php echo esc_html($item['label']); ?></span>
          <?php endif; ?>
          <?php if (!empty($item['value'])): ?>
            <span class="tt-meta__value"><?php echo esc_html($item['value']); ?></span>
          <?php endif; ?>
        </span>
      </div>
    <?php endforeach; ?>
  </div>
</section>

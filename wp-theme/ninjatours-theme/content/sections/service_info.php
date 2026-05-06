<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'service_info';
$slug       = 'service-info';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout) ?? [];

$title = $group['title'] ?? '';
$items = $group['items'] ?? [];
if (empty($items)) return;
?>

<section class="service-info" id="<?php echo esc_attr($section_id); ?>">
  <div class="container">
    <?php if ($title): ?>
      <header class="service-info__head">
        <h2 class="section-title"><?php echo wp_kses_post(nt_render_title($title)); ?></h2>
      </header>
    <?php endif; ?>

    <div class="service-info__grid">
      <?php foreach ($items as $item): ?>
        <article class="service-info__item">
          <?php if (!empty($item['icon'])): ?>
            <span class="service-info__icon" aria-hidden="true">
              <?php echo wp_get_attachment_image($item['icon'], 'thumbnail', false, ['loading' => 'lazy']); ?>
            </span>
          <?php endif; ?>
          <?php if (!empty($item['title'])): ?>
            <h3 class="service-info__item-title"><?php echo esc_html($item['title']); ?></h3>
          <?php endif; ?>
          <?php if (!empty($item['description'])): ?>
            <p class="service-info__item-desc"><?php echo nl2br(esc_html($item['description'])); ?></p>
          <?php endif; ?>
        </article>
      <?php endforeach; ?>
    </div>
  </div>
</section>

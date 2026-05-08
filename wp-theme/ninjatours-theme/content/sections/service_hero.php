<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'service_hero';
$slug       = 'service-hero';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout) ?? [];

$eyebrow = $group['eyebrow'] ?? '';
$title   = $group['title']   ?? '';
$lead    = $group['lead']    ?? '';
$image   = $group['image']   ?? null;
$cta     = $group['cta']     ?? null;
?>

<section class="service-hero" id="<?php echo esc_attr($section_id); ?>" aria-labelledby="<?php echo esc_attr($section_id . '-title'); ?>">
  <?php if ($image): ?>
    <div class="service-hero__media" aria-hidden="true">
      <?php echo wp_get_attachment_image($image, 'full', false, ['loading' => 'eager']); ?>
      <div class="service-hero__overlay"></div>
    </div>
  <?php endif; ?>

  <div class="service-hero__inner">
    <?php if ($eyebrow): ?>
      <p class="service-hero__eyebrow"><?php echo esc_html($eyebrow); ?></p>
    <?php endif; ?>
    <?php if ($title): ?>
      <h1 class="service-hero__title" id="<?php echo esc_attr($section_id . '-title'); ?>">
        <?php echo wp_kses_post(nt_render_title($title)); ?>
      </h1>
    <?php endif; ?>
    <?php if ($lead): ?>
      <p class="service-hero__lead"><?php echo esc_html($lead); ?></p>
    <?php endif; ?>
    <?php nt_render_cta($cta, '--primary --lg'); ?>
  </div>
</section>

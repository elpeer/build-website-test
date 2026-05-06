<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'travel_type_hero';
$slug       = 'tt-hero';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout);
if (!$group) return;

$eyebrow      = $group['eyebrow']      ?? '';
$title        = $group['title']        ?? '';
$lead         = $group['lead']         ?? '';
$image        = $group['image']        ?? null;
$image_mobile = $group['image_mobile'] ?? null;
$cta          = $group['cta']          ?? null;
?>

<section class="tt-hero" id="<?php echo esc_attr($section_id); ?>">
  <?php if ($image): ?>
    <div class="tt-hero__media">
      <?php nt_render_picture($image, $image_mobile, ['alt' => esc_attr($title)]); ?>
    </div>
  <?php endif; ?>
  <div class="tt-hero__overlay" aria-hidden="true"></div>

  <div class="tt-hero__inner">
    <?php if ($eyebrow): ?>
      <span class="tt-hero__tag">
        <span class="tt-hero__tag-dot" aria-hidden="true"></span>
        <?php echo esc_html($eyebrow); ?>
      </span>
    <?php endif; ?>

    <?php if ($title): ?>
      <h1 class="tt-hero__title"><?php echo wp_kses_post(nt_render_title($title)); ?></h1>
    <?php endif; ?>

    <?php if ($lead): ?>
      <p class="tt-hero__desc"><?php echo esc_html($lead); ?></p>
    <?php endif; ?>

    <?php nt_render_cta($cta, '--primary --lg'); ?>
  </div>
</section>

<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'image_separator';
$slug       = 'image-separator';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout);
if (!$group) return;

$image        = $group['image']        ?? null;
$image_mobile = $group['image_mobile'] ?? null;
if (!$image) return;
?>
<section class="image-separator" id="<?php echo esc_attr($section_id); ?>" aria-hidden="true">
  <?php nt_render_picture($image, $image_mobile); ?>
</section>

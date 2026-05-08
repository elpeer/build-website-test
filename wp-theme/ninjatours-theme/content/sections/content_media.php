<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'content_media';
$slug       = 'about';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout);
if (!$group) return;

$title   = $group['title']   ?? '';
$content = $group['content'] ?? '';
$image   = $group['image']   ?? null;
$button  = $group['button']  ?? null;
$reverse = !empty($group['reverse']) ? ' --reverse' : '';
?>

<section class="about<?php echo $reverse; ?>" id="<?php echo esc_attr($section_id); ?>">
  <div class="container">
    <div class="about__text">
      <?php if ($title): ?>
        <h2 class="section-title"><?php echo wp_kses_post(nt_render_title($title)); ?></h2>
      <?php endif; ?>
      <?php if ($content): ?>
        <div class="about__body"><?php echo wp_kses_post($content); ?></div>
      <?php endif; ?>
      <?php nt_render_cta($button, '--blue --lg', 'about__cta'); ?>
    </div>
    <?php if ($image): ?>
      <figure class="about__image">
        <?php echo wp_get_attachment_image($image, 'large', false, ['loading' => 'lazy']); ?>
      </figure>
    <?php endif; ?>
  </div>
</section>

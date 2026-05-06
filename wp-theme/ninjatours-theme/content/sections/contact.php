<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'contact';
$slug       = 'contact';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout);
if (!$group) return;

$title = $group['title'] ?? '';
$lead  = $group['lead']  ?? '';
$form  = $group['form']  ?? null;
$image = $group['image'] ?? null;

$dir = nt_assets_url();
?>

<section class="contact" id="<?php echo esc_attr($section_id); ?>">
  <img class="contact__leaf contact__leaf--right" src="<?php echo esc_url($dir . 'images/right_leaf.png'); ?>" alt="" loading="lazy">
  <img class="contact__leaf contact__leaf--left"  src="<?php echo esc_url($dir . 'images/left_leaf.png'); ?>"  alt="" loading="lazy">

  <div class="contact__inner">
    <header class="contact__head">
      <?php if ($title): ?>
        <h2 class="section-title"><?php echo wp_kses_post(nt_render_title($title)); ?></h2>
      <?php endif; ?>
      <?php if ($lead): ?>
        <p class="contact__lead"><?php echo esc_html($lead); ?></p>
      <?php endif; ?>
    </header>

    <div class="contact__layout">
      <?php if (!empty($form) && $form instanceof WP_Post): ?>
        <div class="contact__form">
          <?php echo do_shortcode('[contact-form-7 id="' . (int) $form->ID . '" title="' . esc_attr($form->post_title) . '"]'); ?>
        </div>
      <?php endif; ?>

      <?php if ($image): ?>
        <figure class="contact__image">
          <?php echo wp_get_attachment_image($image, 'large', false, ['loading' => 'lazy']); ?>
        </figure>
      <?php endif; ?>
    </div>
  </div>
</section>

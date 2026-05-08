<?php
$dir = get_template_directory_uri() . '/assets/app/';
$data = $args['item'];
$use_general = $data['use_general_settings'];
$hide_section = $data['hide_section'];
$section_id = $data['section_id'];

if ($section_id) {
  $section_id = 'contact-' . $args['i'];
}

if ($use_general) {
  $group = get_field('sections_content', 'options')['contact'];
} else {
  $group = $data['group']['contact'];
}

if ($hide_section) return;
if (!$group) return;
$title = $group['title'];
$text = $group['text'];
$form = $group['form'];
$image = $group['image'];
?>
<section class="contact" id="contact">
  <img class="contact__leaf contact__leaf--right" src="<?php echo $dir; ?>images/right_leaf.png" alt="<?php echo get_bloginfo('name'); ?>" loading="lazy">
  <img class="contact__leaf contact__leaf--left" src="<?php echo $dir; ?>images/left_leaf.png" alt="<?php echo get_bloginfo('name'); ?>" loading="lazy">

  <div class="contact__inner">
    <header class="contact__head">
      <?php if (!empty($title)) echo '<h2 class="section-title">' . wp_kses_post($title) . '</h2>'; ?>
      <?php if (!empty($text)) echo '<p  class="contact__lead">' . esc_html($text) . '</p>'; ?>
    </header>
    <div class="contact__layout">
      <?php if (!empty($form)) echo '<div class="contact__form">' . do_shortcode('[contact-form-7 id="' . $form->ID . '" title="' . $form->post_title . '"]') . '</div>'; ?>

      <figure class="contact__image">
        <?php echo wp_get_attachment_image($image, 'full', false, ['loading' => 'lazy']); ?>
      </figure>
    </div>
  </div>
</section>
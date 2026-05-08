<?php
$dir = get_template_directory_uri() . '/assets/app/';
$data = $args['item'];
$use_general = $data['use_general_settings'];
$hide_section = $data['hide_section'];
$section_id = $data['section_id'];

if ($section_id) {
  $section_id = 'image-separator-' . $args['i'];
}

if ($use_general) {
  $group = get_field('sections_content', 'options')['image_separator'];
} else {
  $group = $data['group']['image_separator'];
}

if ($hide_section) return;
if (!$group) return;
$image = $group['image'];
if (!empty($image)):
?>
  <section class="image-separator" aria-hidden="true" id="<?php echo $section_id; ?>">
    <?php echo wp_get_attachment_image($image, 'full', false, ['loading' => 'lazy']); ?>
  </section>
<?php endif; ?>
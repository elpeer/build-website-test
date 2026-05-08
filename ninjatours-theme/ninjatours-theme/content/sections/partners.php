<?php
$dir = get_template_directory_uri() . '/assets/app/';
$data = $args['item'];
$use_general = $data['use_general_settings'];
$hide_section = $data['hide_section'];
$section_id = $data['section_id'];

if ($section_id) {
  $section_id = 'partners-' . $args['i'];
}

if ($use_general) {
  $group = get_field('sections_content', 'options')['partners'];
} else {
  $group = $data['group']['partners'];
}

if ($hide_section) return;
if (!$group) return;
$title = $group['title'];
$text = $group['text'];
$logos_row_1 = $group['logos_row_1'];
$logos_row_2 = $group['logos_row_2'];
?>
<section class="partners" id="<?php echo $section_id; ?>">
  <header class="partners__head">
    <?php if (!empty($title)) echo '<h2 class="section-title">' . wp_kses_post($title) . '</h2>'; ?>
    <?php if (!empty($text)) echo '<p class="partners__lead">' . esc_html($text) . '</p>'; ?>
  </header>
  <?php if (!empty($logos_row_1)): ?>
    <div class="partners__row">
      <div class="partners__track">
        <?php foreach ($logos_row_1 as $logo): ?>
          <span class="partners__logo">
            <?php echo wp_get_attachment_image($logo, 'full', false, ['loading' => 'lazy']); ?>
          </span>
        <?php endforeach; ?>
      </div>
    </div>
  <?php endif; ?>

  <?php if (!empty($logos_row_2)): ?>
    <div class="partners__row">
      <div class="partners__track" data-direction="right" data-duration="60000">
        <?php foreach ($logos_row_2 as $logo): ?>
          <span class="partners__logo">
            <?php echo wp_get_attachment_image($logo, 'full', false, ['loading' => 'lazy']); ?>
          </span>
        <?php endforeach; ?>
      </div>
    </div>
  <?php endif; ?>
</section>
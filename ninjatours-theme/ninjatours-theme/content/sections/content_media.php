<?php
$dir = get_template_directory_uri() . '/assets/app/';
$data = $args['item'];
$use_general = $data['use_general_settings'];
$hide_section = $data['hide_section'];
$section_id = $data['section_id'];

if ($section_id) {
  $section_id = 'content-media-' . $args['i'];
}

if ($use_general) {
  $group = get_field('sections_content', 'options')['content_media'];
} else {
  $group = $data['group']['content_media'];
}

if ($hide_section) return;
if (!$group) return;
$title = $group['title'];
$content = $group['content'];
$button = $group['button'];
$image = $group['image'];
?>
<section class="about" id="<?php echo $section_id; ?>">
  <div class="container">
    <div class="about__text">
      <?php if (!empty($title)) echo '<h2 class="section-title">' . esc_html($title) . '</h2>'; ?>
      <?php if (!empty($content)) echo '<div class="about__body">' . wp_kses_post($content) . '</div>'; ?>
      <a href="<?php echo esc_url($button['url']); ?>" class="btn-pill --blue --lg about__cta" target="<?php echo esc_attr($button['target'] ?: '_self'); ?>">
        <span class=" btn-pill__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
          stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        </span>
        <span class="btn-pill__text"><?php echo esc_html($button['title']); ?></span>
      </a>
    </div>
    <figure class="about__image">
      <?php echo wp_get_attachment_image($image, 'full', false, ['loading' => 'lazy']); ?>
    </figure>
  </div>
</section>
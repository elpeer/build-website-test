<?php
$dir = get_template_directory_uri() . '/assets/app/';
$data = $args['item'];
$use_general = $data['use_general_settings'];
$hide_section = $data['hide_section'];
$section_id = $data['section_id'];
if (empty($section_id)) $section_id = 'home-hero-' . $args['i'];

if ($use_general) {
  $group = get_field('sections_content', 'options')['home_hero'];
} else {
  $group = $data['group']['home_hero'];
}

if ($hide_section) return;
if (!$group) return;

// Extract fields from the group array
$title = $group['hero_title'] ?? '';
$lead_text = $group['hero_lead'] ?? '';
$features = $group['hero_features'] ?? [];
$cta = $group['hero_cta'] ?? null;
$video_url = $group['hero_video'] ?? '';
$poster_url = $group['hero_poster'] ?? '';
?>
<section class="home-hero" id="<?php echo esc_attr($section_id); ?>">
  <div class="home-hero__media" aria-hidden="true">
    <video class="home-hero__video" autoplay muted loop playsinline poster="<?php echo esc_url($poster_url); ?>">
      <source src="<?php echo esc_url($video_url); ?>" type="video/mp4">
    </video>
    <div class="home-hero__overlay"></div>
  </div>

  <div class="home-hero__inner">
    <?php if ($title): ?>
      <h1 class="home-hero__title"><?php echo esc_html($title); ?></h1>
    <?php endif; ?>

    <?php if (!empty($features)): ?>
      <ul class="home-hero__features" aria-label="יתרונות השירות">
        <?php foreach ($features as $feature): ?>
          <?php if (!empty($feature['text'])): ?>
            <li><?php echo esc_html($feature['text']); ?></li>
          <?php endif; ?>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>

    <?php if ($lead_text): ?>
      <p class="home-hero__lead"><?php echo esc_html($lead_text); ?></p>
    <?php endif; ?>

    <?php if (!empty($cta) && !empty($cta['url'])): ?>
      <a href="<?php echo esc_url($cta['url']); ?>" class="btn-pill --primary --lg home-hero__cta" target="<?php echo esc_attr($cta['target'] ?: '_self'); ?>">
        <span class="btn-pill__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </span>
        <span class="btn-pill__text"><?php echo esc_html($cta['title']); ?></span>
      </a>
    <?php endif; ?>
  </div>
</section>
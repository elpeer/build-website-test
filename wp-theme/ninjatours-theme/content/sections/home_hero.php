<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'home_hero';
$slug       = 'home-hero';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout);
if (!$group) return;

$title    = $group['title']    ?? '';
$lead     = $group['lead']     ?? '';
$features = $group['features'] ?? [];
$video    = $group['video']    ?? '';
$poster   = $group['poster']   ?? null;
$cta      = $group['cta']      ?? null;
?>

<section class="home-hero" id="<?php echo esc_attr($section_id); ?>">
  <?php if ($video || $poster): ?>
    <div class="home-hero__media" aria-hidden="true">
      <?php if ($video): ?>
        <video class="home-hero__video" autoplay muted loop playsinline
               <?php if ($poster) echo 'poster="' . esc_url(wp_get_attachment_image_url($poster, 'full')) . '"'; ?>>
          <source src="<?php echo esc_url($video); ?>" type="video/mp4">
        </video>
      <?php elseif ($poster): ?>
        <?php echo wp_get_attachment_image($poster, 'full', false, ['class' => 'home-hero__video', 'loading' => 'eager']); ?>
      <?php endif; ?>
      <div class="home-hero__overlay"></div>
    </div>
  <?php endif; ?>

  <div class="home-hero__inner">
    <?php if ($title): ?>
      <h1 class="home-hero__title"><?php echo wp_kses_post(nt_render_title($title)); ?></h1>
    <?php endif; ?>

    <?php if (!empty($features)): ?>
      <ul class="home-hero__features" aria-label="<?php esc_attr_e('יתרונות השירות', 'ninjatours'); ?>">
        <?php foreach ($features as $feature): if (empty($feature['text'])) continue; ?>
          <li><?php echo esc_html($feature['text']); ?></li>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>

    <?php if ($lead): ?>
      <p class="home-hero__lead"><?php echo esc_html($lead); ?></p>
    <?php endif; ?>

    <?php nt_render_cta($cta, '--primary --lg', 'home-hero__cta'); ?>
  </div>
</section>

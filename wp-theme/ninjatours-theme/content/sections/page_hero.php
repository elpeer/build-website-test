<?php
/**
 * Page Hero — full-bleed video/image with title + lead, used on archive-style
 * pages (hotels / attractions / use-cases). Matches `.hotels-page-hero` markup.
 */

$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'page_hero';
$slug       = 'page-hero';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout) ?? [];

$title = $group['title'] ?? '';
$lead  = $group['lead']  ?? '';
$video = $group['video'] ?? '';
$image = $group['image'] ?? null;
?>

<section class="hotels-page-hero" id="<?php echo esc_attr($section_id); ?>">
  <?php if ($video || $image): ?>
    <div class="hotels-page-hero__media" aria-hidden="true">
      <?php if ($video): ?>
        <video class="hotels-page-hero__video" autoplay muted loop playsinline
               <?php if ($image) echo 'poster="' . esc_url(wp_get_attachment_image_url($image, 'full')) . '"'; ?>>
          <source src="<?php echo esc_url($video); ?>" type="video/mp4">
        </video>
      <?php elseif ($image): ?>
        <?php echo wp_get_attachment_image($image, 'full', false, ['class' => 'hotels-page-hero__video', 'loading' => 'eager']); ?>
      <?php endif; ?>
      <div class="hotels-page-hero__overlay"></div>
    </div>
  <?php endif; ?>

  <div class="hotels-page-hero__inner">
    <?php if ($title): ?>
      <h1 class="hotels-page-hero__title"><?php echo wp_kses_post(nt_render_title($title)); ?></h1>
    <?php endif; ?>
    <?php if ($lead): ?>
      <p class="hotels-page-hero__lead"><?php echo esc_html($lead); ?></p>
    <?php endif; ?>
  </div>
</section>

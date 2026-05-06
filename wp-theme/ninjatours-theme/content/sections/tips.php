<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'tips';
$slug       = 'tt-tips';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout);
if (!$group) return;

$eyebrow = $group['eyebrow'] ?? '';
$title   = $group['title']   ?? '';
$lead    = $group['lead']    ?? '';
$tips    = $group['tips']    ?? [];
if (empty($tips)) return;
?>

<section class="tt-tips" id="<?php echo esc_attr($section_id); ?>">
  <div class="tt-tips__inner">
    <header class="tt-tips__head">
      <div>
        <?php if ($eyebrow): ?>
          <span class="tt-tips__eyebrow"><?php echo esc_html($eyebrow); ?></span>
        <?php endif; ?>
        <?php if ($title): ?>
          <h2><?php echo wp_kses_post(nt_render_title($title)); ?></h2>
        <?php endif; ?>
      </div>
      <div>
        <?php if ($lead): ?><p><?php echo esc_html($lead); ?></p><?php endif; ?>
      </div>
    </header>

    <div class="tt-tips__grid">
      <?php foreach ($tips as $i => $tip): ?>
        <article class="tt-tip">
          <div class="tt-tip__head">
            <span class="tt-tip__num"><?php echo esc_html(sprintf('%02d', $i + 1)); ?></span>
            <span class="tt-tip__divider"></span>
            <?php if (!empty($tip['icon'])): ?>
              <span class="tt-tip__icon">
                <?php echo wp_get_attachment_image($tip['icon'], 'thumbnail', false, ['loading' => 'lazy']); ?>
              </span>
            <?php endif; ?>
          </div>
          <?php if (!empty($tip['title'])): ?>
            <h3 class="tt-tip__title"><?php echo esc_html($tip['title']); ?></h3>
          <?php endif; ?>
          <?php if (!empty($tip['description'])): ?>
            <p class="tt-tip__desc"><?php echo nl2br(esc_html($tip['description'])); ?></p>
          <?php endif; ?>
        </article>
      <?php endforeach; ?>
    </div>
  </div>
</section>

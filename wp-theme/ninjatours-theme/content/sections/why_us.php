<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'why_us';
$slug       = 'why-us';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout);
if (!$group) return;

$eyebrow = $group['eyebrow'] ?? '';
$title   = $group['title']   ?? '';
$cards   = $group['cards']   ?? [];
$cta     = $group['cta']     ?? null;
?>

<section class="why-us" id="<?php echo esc_attr($section_id); ?>">
  <div class="container">
    <header class="why-us__head">
      <?php if ($eyebrow): ?>
        <p class="why-us__eyebrow">
          <span class="why-us__eyebrow-dot" aria-hidden="true"></span>
          <span><?php echo esc_html($eyebrow); ?></span>
        </p>
      <?php endif; ?>

      <?php if ($title): ?>
        <h2 class="section-title"><?php echo wp_kses_post(nt_render_title($title)); ?></h2>
      <?php endif; ?>
    </header>

    <?php if (!empty($cards)): ?>
      <div class="why-us__row" role="list">
        <?php foreach ($cards as $i => $card): ?>
          <article class="why-us__card" role="listitem">
            <div class="why-us__card-head">
              <span class="why-us__card-num"><?php echo esc_html(sprintf('%02d', $i + 1)); ?></span>
              <?php if (!empty($card['icon'])): ?>
                <span class="why-us__card-icon" aria-hidden="true">
                  <?php echo wp_get_attachment_image($card['icon'], 'full', false, ['loading' => 'lazy']); ?>
                </span>
              <?php endif; ?>
            </div>
            <div class="why-us__card-body">
              <?php if (!empty($card['title'])): ?>
                <h3 class="why-us__card-title"><?php echo esc_html($card['title']); ?></h3>
              <?php endif; ?>
              <?php if (!empty($card['description'])): ?>
                <p class="why-us__card-desc"><span><?php echo esc_html($card['description']); ?></span></p>
              <?php endif; ?>
            </div>
          </article>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

    <?php nt_render_cta($cta, '--blue --lg', 'why-us__cta'); ?>
  </div>
</section>

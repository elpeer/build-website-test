<?php
$dir = get_template_directory_uri() . '/assets/app/';
$data = $args['item'];
$use_general = $data['use_general_settings'];
$hide_section = $data['hide_section'];
$section_id = $data['section_id'];

if ($section_id) {
  $section_id = 'why-us-' . $args['i'];
}

if ($use_general) {
  $group = get_field('sections_content', 'options')['why_us'];
} else {
  $group = $data['group']['why_us'];
}

if ($hide_section) return;
if (!$group) return;

$eyebrow_text = $group['eyebrow_text'] ?? '';
$title = $group['title'] ?? '';
$cards = $group['cards'] ?? [];
$cta = $group['cta'] ?? null;
$acf_section_id = $group['section_id'] ?? '';
?>
<section class="why-us" id="<?php echo esc_attr($section_id); ?>">
  <div class="container">
    <header class="why-us__head">
      <?php if ($eyebrow_text): ?>
        <p class="why-us__eyebrow">
          <span class="why-us__eyebrow-dot" aria-hidden="true"></span>
          <span><?php echo esc_html($eyebrow_text); ?></span>
        </p>
      <?php endif; ?>

      <?php if ($title): ?>
        <h2 class="section-title">
          <?php echo wp_kses_post($title); ?>
        </h2>
      <?php endif; ?>
    </header>

    <?php if (!empty($cards)): ?>
      <div class="why-us__row" role="list">
        <?php $i = 1;
        foreach ($cards as $card): ?>
          <article class="why-us__card" role="listitem">
            <div class="why-us__card-head">
              <?php if (!empty($card['number'])): ?>
                <span class="why-us__card-num"><?php echo '0' . $i; ?></span>
              <?php endif; ?>

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

    <?php if (!empty($cta) && !empty($cta['url'])): ?>
      <a href="<?php echo esc_url($cta['url']); ?>" class="btn-pill --blue --lg why-us__cta" target="<?php echo esc_attr($cta['target'] ?? '_self'); ?>">
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
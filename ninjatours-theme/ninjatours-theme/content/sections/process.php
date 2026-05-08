<?php
$dir = get_template_directory_uri() . '/assets/app/';
$data = $args['item'];
$use_general = $data['use_general_settings'];
$hide_section = $data['hide_section'];
$section_id = $data['section_id'];

if ($section_id) {
  $section_id = 'process-' . $args['i'];
}

if ($use_general) {
  $group = get_field('sections_content', 'options')['process'];
} else {
  $group = $data['group']['process'];
}

if ($hide_section) return;
if (!$group) return;

// Extract fields from the ACF group
$title = $group['title'] ?? '';
$lead_text = $group['lead_text'] ?? '';
$steps = $group['steps'] ?? [];
$cta = $group['cta'] ?? null;
?>
<section class="process" id="<?php echo esc_attr($section_id); ?>">
  <div class="container">
    <header class="process__head">
      <?php if ($title): ?>
        <h2 class="section-title">
          <?php
          // Allow basic HTML like <br> and <em> in the title
          echo wp_kses_post($title);
          ?>
        </h2>
      <?php endif; ?>

      <?php if ($lead_text): ?>
        <p class="process__lead"><?php echo esc_html($lead_text); ?></p>
      <?php endif; ?>
    </header>

    <?php if (!empty($steps)): ?>
      <div class="process__timeline">
        <span class="process__line" aria-hidden="true">
          <span class="process__line-fill"></span>
        </span>

        <?php
        // Initialize counter
        $i = 1;
        foreach ($steps as $step):
          // Add reverse class for even items
          $reverse_class = ($i % 2 === 0) ? ' --reverse' : '';
        ?>
          <article class="process__step<?php echo $reverse_class; ?>">
            <?php if (!empty($step['image'])): ?>
              <figure class="process__step-image">
                <?php echo wp_get_attachment_image($step['image'], 'full', false, ['loading' => 'lazy']); ?>
              </figure>
            <?php endif; ?>

            <div class="process__step-text">
              <?php
              // Output number with leading zero (e.g., 01, 02)
              ?>
              <span class="process__step-num"><?php echo sprintf('%02d', $i); ?></span>

              <?php if (!empty($step['title'])): ?>
                <h3 class="process__step-title"><?php echo wp_kses_post($step['title']); ?></h3>
              <?php endif; ?>

              <?php if (!empty($step['description'])): ?>
                <p class="process__step-desc"><?php echo nl2br(esc_html($step['description'])); ?></p>
              <?php endif; ?>
            </div>
            <span class="process__step-dot" aria-hidden="true"></span>
          </article>
        <?php
          // Increment counter
          $i++;
        endforeach;
        ?>
      </div>
    <?php endif; ?>

    <?php if (!empty($cta) && !empty($cta['url'])): ?>
      <a href="<?php echo esc_url($cta['url']); ?>" class="btn-pill --blue --lg process__cta" target="<?php echo esc_attr($cta['target'] ?? '_self'); ?>">
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
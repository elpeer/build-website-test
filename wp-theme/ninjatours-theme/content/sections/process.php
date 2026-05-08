<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'process';
$slug       = 'process';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout);
if (!$group) return;

$title = $group['title'] ?? '';
$lead  = $group['lead']  ?? '';
$steps = $group['steps'] ?? [];
$cta   = $group['cta']   ?? null;
?>

<section class="process" id="<?php echo esc_attr($section_id); ?>">
  <div class="container">
    <header class="process__head">
      <?php if ($title): ?>
        <h2 class="section-title"><?php echo wp_kses_post(nt_render_title($title)); ?></h2>
      <?php endif; ?>
      <?php if ($lead): ?>
        <p class="process__lead"><?php echo esc_html($lead); ?></p>
      <?php endif; ?>
    </header>

    <?php if (!empty($steps)): ?>
      <div class="process__timeline">
        <span class="process__line" aria-hidden="true"><span class="process__line-fill"></span></span>
        <?php foreach ($steps as $i => $step):
          $reverse = ($i % 2 === 1) ? ' --reverse' : '';
        ?>
          <article class="process__step<?php echo $reverse; ?>">
            <?php if (!empty($step['image'])): ?>
              <figure class="process__step-image">
                <?php echo wp_get_attachment_image($step['image'], 'large', false, ['loading' => 'lazy']); ?>
              </figure>
            <?php endif; ?>
            <div class="process__step-text">
              <span class="process__step-num"><?php echo esc_html(sprintf('%02d', $i + 1)); ?></span>
              <?php if (!empty($step['title'])): ?>
                <h3 class="process__step-title"><?php echo wp_kses_post($step['title']); ?></h3>
              <?php endif; ?>
              <?php if (!empty($step['description'])): ?>
                <p class="process__step-desc"><?php echo nl2br(esc_html($step['description'])); ?></p>
              <?php endif; ?>
            </div>
            <span class="process__step-dot" aria-hidden="true"></span>
          </article>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

    <?php nt_render_cta($cta, '--blue --lg', 'process__cta'); ?>
  </div>
</section>

<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'partners';
$slug       = 'partners';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout);
if (!$group) return;

$title  = $group['title']        ?? '';
$lead   = $group['lead']         ?? '';
$row1   = $group['logos_row_1']  ?? [];
$row2   = $group['logos_row_2']  ?? [];

if (empty($row1) && empty($row2)) return;
?>

<section class="partners" id="<?php echo esc_attr($section_id); ?>">
  <header class="partners__head">
    <?php if ($title): ?>
      <h2 class="section-title"><?php echo wp_kses_post(nt_render_title($title)); ?></h2>
    <?php endif; ?>
    <?php if ($lead): ?>
      <p class="partners__lead"><?php echo esc_html($lead); ?></p>
    <?php endif; ?>
  </header>

  <?php if (!empty($row1)): ?>
    <div class="partners__row">
      <div class="partners__track">
        <?php foreach ($row1 as $logo): ?>
          <span class="partners__logo">
            <?php echo wp_get_attachment_image($logo, 'medium', false, ['loading' => 'lazy']); ?>
          </span>
        <?php endforeach; ?>
      </div>
    </div>
  <?php endif; ?>

  <?php if (!empty($row2)): ?>
    <div class="partners__row">
      <div class="partners__track" data-direction="right" data-duration="60000">
        <?php foreach ($row2 as $logo): ?>
          <span class="partners__logo">
            <?php echo wp_get_attachment_image($logo, 'medium', false, ['loading' => 'lazy']); ?>
          </span>
        <?php endforeach; ?>
      </div>
    </div>
  <?php endif; ?>
</section>

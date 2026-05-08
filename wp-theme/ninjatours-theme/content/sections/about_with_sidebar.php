<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'about_with_sidebar';
$slug       = 'about-sidebar';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout);
if (!$group) return;

$body          = $group['body']          ?? '';
$sidebar_title = $group['sidebar_title'] ?? '';
$sidebar_items = $group['sidebar_items'] ?? [];
$sidebar_cta   = $group['sidebar_cta']   ?? null;
?>

<section class="hotel-detail" id="<?php echo esc_attr($section_id); ?>">
  <div class="container">
    <div class="hotel-detail__layout">

      <div class="hotel-detail__body">
        <?php echo wp_kses_post($body); ?>
      </div>

      <aside>
        <div class="hotel-detail__sidebar-card">
          <?php if ($sidebar_title): ?>
            <h3><?php echo esc_html($sidebar_title); ?></h3>
          <?php endif; ?>

          <?php foreach ($sidebar_items as $item): ?>
            <div class="hotel-detail__sidebar-highlight">
              <?php if (!empty($item['icon'])): ?>
                <?php echo wp_get_attachment_image($item['icon'], 'thumbnail', false, ['loading' => 'lazy']); ?>
              <?php endif; ?>
              <span>
                <?php if (!empty($item['label'])): ?><strong><?php echo esc_html($item['label']); ?>:</strong> <?php endif; ?>
                <?php echo esc_html($item['value'] ?? ''); ?>
              </span>
            </div>
          <?php endforeach; ?>

          <?php if (!empty($sidebar_cta) && !empty($sidebar_cta['url'])): ?>
            <a class="hotel-detail__sidebar-cta" href="<?php echo esc_url($sidebar_cta['url']); ?>" target="<?php echo esc_attr($sidebar_cta['target'] ?: '_self'); ?>">
              <?php echo esc_html($sidebar_cta['title']); ?>
            </a>
          <?php endif; ?>
        </div>
      </aside>

    </div>
  </div>
</section>

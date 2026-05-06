<?php
/**
 * Service / Train / Car types listing — repeater of cards with image, title,
 * description, price, CTA. Matches `.train-types` markup in the static HTML.
 */

$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'service_types';
$slug       = 'train-types';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout) ?? [];

$title = $group['title'] ?? '';
$lead  = $group['lead']  ?? '';
$items = $group['items'] ?? [];
if (empty($items)) return;
?>

<section class="train-types" id="<?php echo esc_attr($section_id); ?>">
  <div class="container">
    <header class="train-types__head">
      <?php if ($title): ?>
        <h2 class="section-title"><?php echo wp_kses_post(nt_render_title($title)); ?></h2>
      <?php endif; ?>
      <?php if ($lead): ?>
        <p class="train-types__lead"><?php echo esc_html($lead); ?></p>
      <?php endif; ?>
    </header>

    <div class="train-types__grid">
      <?php foreach ($items as $item): ?>
        <article class="train-types__card">
          <?php if (!empty($item['image'])): ?>
            <figure class="train-types__card-image">
              <?php echo wp_get_attachment_image($item['image'], 'large', false, ['loading' => 'lazy']); ?>
            </figure>
          <?php endif; ?>
          <div class="train-types__card-body">
            <?php if (!empty($item['title'])): ?>
              <h3 class="train-types__card-title"><?php echo esc_html($item['title']); ?></h3>
            <?php endif; ?>
            <?php if (!empty($item['description'])): ?>
              <p class="train-types__card-desc"><?php echo nl2br(esc_html($item['description'])); ?></p>
            <?php endif; ?>
            <?php if (!empty($item['price'])): ?>
              <p class="train-types__card-price"><?php echo esc_html($item['price']); ?></p>
            <?php endif; ?>
            <?php nt_render_cta($item['cta'] ?? null, '--blue', 'train-types__card-cta'); ?>
          </div>
        </article>
      <?php endforeach; ?>
    </div>
  </div>
</section>

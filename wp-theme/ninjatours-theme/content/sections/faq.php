<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'faq';
$slug       = 'faq';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout) ?? [];

$title = $group['title'] ?? '';
$lead  = $group['lead']  ?? '';
$items = $group['items'] ?? [];
if (empty($items)) return;
?>

<section class="faq" id="<?php echo esc_attr($section_id); ?>">
  <div class="container">
    <header class="faq__head">
      <?php if ($title): ?>
        <h2 class="section-title"><?php echo wp_kses_post(nt_render_title($title)); ?></h2>
      <?php endif; ?>
      <?php if ($lead): ?>
        <p class="faq__lead"><?php echo esc_html($lead); ?></p>
      <?php endif; ?>
    </header>

    <div class="faq__list">
      <?php foreach ($items as $i => $item): ?>
        <details class="faq__item"<?php echo $i === 0 ? ' open' : ''; ?>>
          <summary class="faq__question">
            <span><?php echo esc_html($item['question'] ?? ''); ?></span>
            <span class="faq__chevron" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          </summary>
          <div class="faq__answer"><?php echo wp_kses_post($item['answer'] ?? ''); ?></div>
        </details>
      <?php endforeach; ?>
    </div>
  </div>
</section>

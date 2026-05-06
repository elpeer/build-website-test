<?php
$data       = $args['item'] ?? [];
$index      = $args['i']    ?? 1;
$layout     = 'itinerary';
$slug       = 'tt-itinerary';
$section_id = nt_section_id($data, $slug, $index);

if (!empty($data['hide_section'])) return;
$group = nt_get_section_group($data, $layout);
if (!$group) return;

$title = $group['title'] ?? '';
$lead  = $group['lead']  ?? '';
$note  = $group['note']  ?? '';
$days  = $group['days']  ?? [];
if (empty($days)) return;
?>

<section class="tt-itinerary" id="<?php echo esc_attr($section_id); ?>">
  <div class="tt-itinerary__inner">
    <header class="tt-itinerary__head">
      <div>
        <?php if ($title): ?>
          <h2><?php echo wp_kses_post(nt_render_title($title)); ?></h2>
        <?php endif; ?>
        <?php if ($lead): ?><p><?php echo esc_html($lead); ?></p><?php endif; ?>
      </div>
      <?php if ($note): ?>
        <p class="tt-itinerary__note">
          <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="#d2170a" stroke-width="1.5"/>
            <line x1="8" y1="7" x2="8" y2="12" stroke="#d2170a" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="8" cy="4.5" r="0.9" fill="#d2170a"/>
          </svg>
          <span><?php echo esc_html($note); ?></span>
        </p>
      <?php endif; ?>
    </header>

    <div class="tt-itinerary__timeline">
      <?php foreach ($days as $day): ?>
        <div class="tt-day">
          <div class="tt-day__image">
            <?php if (!empty($day['image'])): ?>
              <?php echo wp_get_attachment_image($day['image'], 'medium_large', false, ['loading' => 'lazy']); ?>
            <?php endif; ?>
            <div class="tt-day__image-overlay" aria-hidden="true"></div>
            <span class="tt-day__day-label">DAY</span>
            <?php if (!empty($day['day_num'])): ?>
              <span class="tt-day__num"><?php echo esc_html($day['day_num']); ?></span>
            <?php endif; ?>
          </div>
          <div class="tt-day__content">
            <?php if (!empty($day['location'])): ?>
              <span class="tt-day__location">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <?php echo esc_html($day['location']); ?>
              </span>
            <?php endif; ?>
            <?php if (!empty($day['title'])): ?>
              <h3 class="tt-day__title"><?php echo esc_html($day['title']); ?></h3>
            <?php endif; ?>
            <?php if (!empty($day['desc'])): ?>
              <p class="tt-day__desc"><?php echo nl2br(esc_html($day['desc'])); ?></p>
            <?php endif; ?>
            <?php if (!empty($day['tags'])): ?>
              <div class="tt-day__tags">
                <?php foreach ($day['tags'] as $tag): if (empty($tag['tag'])) continue; ?>
                  <span class="tt-day__tag"><?php echo esc_html($tag['tag']); ?></span>
                <?php endforeach; ?>
              </div>
            <?php endif; ?>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>

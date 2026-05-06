<?php
/**
 * Hotel card.
 *
 * @args ['id' => int]
 */

$id = $args['id'] ?? 0;
if (!$id) return;

$rating      = get_field('rating', $id);
$tagline     = get_field('tagline', $id) ?: get_the_excerpt($id);
$destination = get_field('destination', $id);
$city_terms  = get_the_terms($id, 'hotel-city');
$city        = $destination ? $destination->post_title : (!empty($city_terms) ? $city_terms[0]->name : '');
?>
<article class="hotels__card">
  <a href="<?php echo esc_url(get_permalink($id)); ?>" class="hotels__card-link">
    <div class="hotels__card-image">
      <?php echo get_the_post_thumbnail($id, 'large', ['loading' => 'lazy']); ?>
      <?php if ($rating): ?>
        <span class="hotels__card-rating" aria-label="<?php echo esc_attr(sprintf(__('דירוג: %s כוכבים', 'ninjatours'), $rating)); ?>">
          <?php echo str_repeat('★', (int) $rating); ?>
        </span>
      <?php endif; ?>
    </div>
    <div class="hotels__card-body">
      <h3 class="hotels__card-title"><?php echo esc_html(get_the_title($id)); ?></h3>
      <?php if ($city): ?>
        <p class="hotels__card-loc">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <?php echo esc_html($city); ?>
        </p>
      <?php endif; ?>
      <?php if ($tagline): ?>
        <p class="hotels__card-desc"><?php echo esc_html($tagline); ?></p>
      <?php endif; ?>
    </div>
  </a>
</article>

<?php
/**
 * Hotel card — matches the markup in static hotels.html (rich version with
 * tags, audience pills, stars, title, description).
 *
 * @args ['id' => int]
 */

$id = $args['id'] ?? 0;
if (!$id) return;

$rating       = (int) get_field('rating', $id) ?: 5;
$tagline      = get_field('tagline', $id) ?: get_the_excerpt($id);
$destination  = get_field('destination', $id);
$city_terms   = get_the_terms($id, 'hotel-city');
$location     = $destination ? get_the_title($destination) : (!empty($city_terms) && !is_wp_error($city_terms) ? $city_terms[0]->name : '');
$audiences    = get_the_terms($id, 'hotel-audience');
$audience_arr = (!empty($audiences) && !is_wp_error($audiences)) ? wp_list_pluck($audiences, 'name') : [];
$permalink    = get_the_permalink($id);
?>
<article class="hotels__card">
  <a href="<?php echo esc_url($permalink); ?>" class="hotels__card-link">
    <figure class="hotels__card-media">
      <?php
      if (has_post_thumbnail($id)) {
        echo get_the_post_thumbnail($id, 'large', ['loading' => 'lazy']);
      }
      ?>
    </figure>
    <div class="hotels__card-body">
      <?php if ($location): ?>
        <div class="hotels__card-tags">
          <span class="hotels__card-tag --location"><?php echo esc_html($location); ?></span>
        </div>
      <?php endif; ?>

      <?php if (!empty($audience_arr)): ?>
        <div class="hotels__card-audience">
          <?php foreach ($audience_arr as $name): ?>
            <span><?php echo esc_html($name); ?></span>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

      <?php if ($rating > 0): ?>
        <div class="hotels__card-stars" aria-label="<?php echo esc_attr(sprintf(__('דירוג %d כוכבים', 'ninjatours'), $rating)); ?>">
          <?php for ($i = 0; $i < $rating; $i++): ?>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 L14.6 8.6 L21.6 9.2 L16.3 13.7 L17.9 20.5 L12 16.9 L6.1 20.5 L7.7 13.7 L2.4 9.2 L9.4 8.6 Z"/></svg>
          <?php endfor; ?>
        </div>
      <?php endif; ?>

      <h3 class="hotels__card-title"><?php echo esc_html(get_the_title($id)); ?></h3>
      <?php if ($tagline): ?>
        <p class="hotels__card-desc"><?php echo wp_kses_post($tagline); ?></p>
      <?php endif; ?>
    </div>
  </a>
</article>

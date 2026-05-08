<?php
$dir = get_template_directory_uri() . '/assets/app/';
$data = $args['item'];
$use_general = $data['use_general_settings'];
$hide_section = $data['hide_section'];
$section_id = $data['section_id'];
if ($section_id) $section_id = 'attractions-' . $args['i'];

if ($use_general) {
  $group = get_field('sections_content', 'options')['attractions'];
} else {
  $group = $data['group']['attractions'];
}

if ($hide_section) return;
if (!$group) return;
$title = $group['title'];
$text = $group['text'];
$button = $group['button'];
$categories = get_terms(['taxonomy' => 'attraction-category']);
$args = array(
  'post_type' => 'attraction',
  'posts_per_page' => -1,
  'orderby' => 'date',
  'order' => 'DESC',
  'post_status' => 'publish',
);
$query = new WP_Query($args);
?>
<section class="attractions" id="attractions">
  <div class="container">
    <header class="attractions__head">
      <?php if (!empty($title)) echo '<h2 class="section-title">' . wp_kses_post($title) . '</h2>'; ?>
      <?php if (!empty($text)) echo '<p class="attractions__lead">' . esc_html($text) . '</p>'; ?>
    </header>

    <?php if ($categories): ?>
      <div class="attractions__tabs" role="tablist" aria-label="קטגוריות">
        <button type="button" class="attractions__tab --active" role="tab" data-tab="all" aria-selected="true">
          <?php echo wp_get_attachment_image(86, 'full', false, ['loading' => 'lazy']); ?>
          <span>הכל</span>
        </button>
        <?php foreach ($categories as $category): ?>
          <?php $icon = get_field('icon', $category); ?>
          <button type="button" class="attractions__tab" role="tab" data-tab="<?php echo esc_attr($category->term_id); ?>" aria-selected="false">
            <?php echo wp_get_attachment_image($icon, 'full', false, ['loading' => 'lazy']); ?>
            <span><?php echo esc_html($category->name); ?></span>
          </button>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

    <?php if ($query->have_posts()): ?>
      <div class="attractions__grid">
        <?php while ($query->have_posts()): $query->the_post(); ?>
          <?php get_template_part('parts/attraction-card', null, ['id' => get_the_ID()]); ?>
        <?php endwhile; ?>
      </div>
    <?php endif; ?>
    <?php if (!empty($button['url'])): ?>
      <a href="<?php echo esc_url($button['url']); ?>" class="btn-pill --blue --lg attractions__cta" target="<?php echo esc_attr($button['target'] ?? '_self'); ?>">
        <span class="btn-pill__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
            stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </span>
        <span class="btn-pill__text"><?php echo esc_html($button['title']); ?></span>
      </a>
    <?php endif; ?>
  </div>
</section>
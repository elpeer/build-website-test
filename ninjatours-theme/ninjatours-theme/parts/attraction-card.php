<?php
$id = $args['id'];
$image = get_the_post_thumbnail($id, 'full', ['class' => 'attractions__card-img', 'loading' => 'lazy']);
$title = get_the_title($id);
$excerpt = get_the_excerpt($id);
$permalink = get_the_permalink($id);
?>
<article class="attractions__card">
  <a href="<?php echo $permalink; ?>">
    <?php echo $image; ?>
    <span class="attractions__card-overlay" aria-hidden="true"></span>
    <span class="attractions__card-arrow" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
        stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    </span>
    <div class="attractions__card-body">
      <h3 class="attractions__card-title"><?php echo $title; ?></h3>
      <p class="attractions__card-desc"><?php echo $excerpt; ?></p>
    </div>
  </a>
</article>
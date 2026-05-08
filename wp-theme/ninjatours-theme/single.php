<?php
/**
 * Single Post — matches static post.html with hero, cover image, TOC sidebar,
 * and content. Falls back gracefully if the post has no TOC headings.
 */

get_header();

while (have_posts()): the_post();
  $cats          = get_the_category();
  $cat           = !empty($cats) ? $cats[0] : null;
  $reading_time  = max(1, (int) round(str_word_count(strip_tags(get_the_content())) / 200));
  $author_id     = get_the_author_meta('ID');
?>

<main id="main-content">

  <section class="post-hero" aria-labelledby="post-title">
    <div class="post-hero__inner">
      <?php if ($cat): ?>
        <p class="post-hero__category"><?php echo esc_html($cat->name); ?></p>
      <?php endif; ?>
      <h1 class="post-hero__title" id="post-title"><?php the_title(); ?></h1>

      <div class="post-hero__meta">
        <button class="post-hero__share" type="button" aria-label="<?php esc_attr_e('שתף את הפוסט', 'ninjatours'); ?>">
          <span class="post-hero__share-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </span>
          <span><?php esc_html_e('שיתוף', 'ninjatours'); ?></span>
        </button>
        <span class="post-hero__divider" aria-hidden="true"></span>
        <span class="post-hero__date"><?php echo esc_html(get_the_date('j בF Y')); ?></span>
        <span class="post-hero__read"><?php echo esc_html(sprintf(__('%d דקות קריאה', 'ninjatours'), $reading_time)); ?></span>
      </div>

      <?php if (has_excerpt()): ?>
        <p class="post-hero__lead"><?php echo esc_html(get_the_excerpt()); ?></p>
      <?php endif; ?>
    </div>
  </section>

  <?php if (has_post_thumbnail()): ?>
    <figure class="post-cover">
      <?php the_post_thumbnail('full', ['loading' => 'eager']); ?>
    </figure>
  <?php endif; ?>

  <div class="post-layout">
    <article class="post-content">
      <aside class="post-author">
        <div class="post-author__avatar" aria-hidden="true">
          <?php echo get_avatar($author_id, 64); ?>
        </div>
        <div class="post-author__text">
          <h4 class="post-author__heading"><?php esc_html_e('היכרות עם הכותב', 'ninjatours'); ?></h4>
          <p>
            <a href="<?php echo esc_url(get_author_posts_url($author_id)); ?>" class="post-author__name"><?php the_author(); ?></a>
          </p>
        </div>
      </aside>

      <div class="post-content__body editor-area">
        <?php the_content(); ?>
      </div>
    </article>
  </div>

  <?php
  // Related posts — same category, exclude current
  if ($cat) {
    $related = get_posts([
      'category__in'   => [$cat->term_id],
      'post__not_in'   => [get_the_ID()],
      'posts_per_page' => 3,
      'orderby'        => 'date',
      'order'          => 'DESC',
    ]);
  ?>
    <?php if (!empty($related)): ?>
      <section class="blog-list" aria-label="<?php esc_attr_e('פוסטים קשורים', 'ninjatours'); ?>">
        <div class="container">
          <h2 class="section-title"><?php esc_html_e('פוסטים נוספים', 'ninjatours'); ?></h2>
          <ul class="blog-list__grid" role="list">
            <?php foreach ($related as $rel): ?>
              <li class="blog-card">
                <a href="<?php echo esc_url(get_permalink($rel->ID)); ?>" class="blog-card__link">
                  <?php if (has_post_thumbnail($rel->ID)): ?>
                    <figure class="blog-card__image">
                      <?php echo get_the_post_thumbnail($rel->ID, 'large', ['loading' => 'lazy']); ?>
                    </figure>
                  <?php endif; ?>
                  <div class="blog-card__body">
                    <span class="blog-card__category"><?php echo esc_html($cat->name); ?></span>
                    <h3 class="blog-card__title"><?php echo esc_html(get_the_title($rel->ID)); ?></h3>
                    <p class="blog-card__excerpt"><?php echo esc_html(get_the_excerpt($rel->ID)); ?></p>
                  </div>
                </a>
              </li>
            <?php endforeach; ?>
          </ul>
        </div>
      </section>
    <?php endif; ?>
  <?php } ?>

</main>

<?php endwhile;

get_footer();

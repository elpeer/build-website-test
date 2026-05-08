<?php
/**
 * Blog index — matches static blog.html with hero + tabs + cards grid.
 * Used when "Posts page" in Settings → Reading is set to a Page.
 */

get_header();

$blog_page_id = get_option('page_for_posts');
$page_obj     = $blog_page_id ? get_post($blog_page_id) : null;

$title = $page_obj ? $page_obj->post_title : __('הבלוג שלנו', 'ninjatours');
$lead  = $page_obj && !empty($page_obj->post_excerpt) ? $page_obj->post_excerpt : __('סיפורים, מדריכים וטיפים מיפן — מהצוות שמכיר את היפן שלכם מקרוב.', 'ninjatours');

$categories = get_categories(['hide_empty' => true]);
?>

<main id="main-content">

  <section class="blog-hero" aria-labelledby="blog-hero-title">
    <div class="blog-hero__content">
      <h1 class="blog-hero__title" id="blog-hero-title"><?php echo esc_html($title); ?></h1>
      <p class="blog-hero__lead"><?php echo esc_html($lead); ?></p>
    </div>
    <?php if ($blog_page_id && has_post_thumbnail($blog_page_id)): ?>
      <figure class="blog-hero__image">
        <?php echo get_the_post_thumbnail($blog_page_id, 'large', ['loading' => 'eager']); ?>
      </figure>
    <?php endif; ?>
  </section>

  <?php if (!empty($categories)): ?>
    <nav class="blog-tabs" aria-label="<?php esc_attr_e('קטגוריות הבלוג', 'ninjatours'); ?>">
      <ul>
        <li><button type="button" class="blog-tabs__btn --active" data-category="all"><?php esc_html_e('הכל', 'ninjatours'); ?></button></li>
        <?php foreach ($categories as $cat): ?>
          <li><button type="button" class="blog-tabs__btn" data-category="<?php echo (int) $cat->term_id; ?>"><?php echo esc_html($cat->name); ?></button></li>
        <?php endforeach; ?>
      </ul>
    </nav>
  <?php endif; ?>

  <section class="blog-list" aria-label="<?php esc_attr_e('פוסטים אחרונים', 'ninjatours'); ?>">
    <div class="container">
      <?php if (have_posts()): ?>
        <ul class="blog-list__grid" role="list">
          <?php while (have_posts()): the_post();
            $cats = get_the_category();
            $cat  = !empty($cats) ? $cats[0] : null;
          ?>
            <li class="blog-card" data-category="<?php echo $cat ? (int) $cat->term_id : 'all'; ?>">
              <a href="<?php the_permalink(); ?>" class="blog-card__link">
                <?php if (has_post_thumbnail()): ?>
                  <figure class="blog-card__image">
                    <?php the_post_thumbnail('large', ['loading' => 'lazy']); ?>
                  </figure>
                <?php endif; ?>
                <div class="blog-card__body">
                  <?php if ($cat): ?>
                    <span class="blog-card__category"><?php echo esc_html($cat->name); ?></span>
                  <?php endif; ?>
                  <h3 class="blog-card__title"><?php the_title(); ?></h3>
                  <p class="blog-card__excerpt"><?php echo esc_html(get_the_excerpt()); ?></p>
                </div>
              </a>
            </li>
          <?php endwhile; ?>
        </ul>

        <div class="blog-list__pagination"><?php the_posts_pagination(); ?></div>
      <?php else: ?>
        <p class="empty-state"><?php esc_html_e('אין עדיין פוסטים בבלוג. בקרוב!', 'ninjatours'); ?></p>
      <?php endif; ?>
    </div>
  </section>
</main>

<?php get_footer();

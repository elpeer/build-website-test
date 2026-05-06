<?php get_header(); ?>

<main id="main-content" class="page-destinations">
  <section class="error-404">
    <div class="container">
      <h1 class="error-404__title">404</h1>
      <p class="error-404__lead"><?php esc_html_e('הדף שחיפשתם לא נמצא — אבל יש עוד הרבה לגלות ביפן.', 'ninjatours'); ?></p>
      <a href="<?php echo esc_url(home_url('/')); ?>" class="btn-pill --primary --lg">
        <span class="btn-pill__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </span>
        <span class="btn-pill__text"><?php esc_html_e('חזרה לעמוד הבית', 'ninjatours'); ?></span>
      </a>
    </div>
  </section>
</main>

<?php get_footer(); ?>

<?php
/**
 * 404 — matches static 404.html with full-bleed background, glass CTA,
 * and quick-links nav.
 */

get_header();

$bg_desktop = nt_assets_url('images/bg_desktop.jpg');
$bg_mobile  = nt_assets_url('images/bg_mobile.jpg');
?>

<style>
  body.page-404 .error-404__inner { background-image: url('<?php echo esc_url($bg_desktop); ?>'); }
  @media (max-width: 768px) and (orientation: portrait) {
    body.page-404 .error-404__inner { background-image: url('<?php echo esc_url($bg_mobile); ?>'); }
  }
</style>

<main id="main-content">
  <section class="error-404" aria-labelledby="error-404-title">
    <div class="error-404__inner">
      <h1 class="error-404__title" id="error-404-title"><?php esc_html_e('הדף שחיפשת לא נמצא', 'ninjatours'); ?></h1>

      <a href="<?php echo esc_url(home_url('/')); ?>" class="btn-pill --glass --lg error-404__cta">
        <span class="btn-pill__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </span>
        <span class="btn-pill__text"><?php esc_html_e('חזרה לעמוד הבית', 'ninjatours'); ?></span>
      </a>

      <nav class="error-404__links" aria-label="<?php esc_attr_e('קישורים מהירים', 'ninjatours'); ?>">
        <?php
        $links = [];
        if ($p = get_page_by_path('destinations')) $links[] = '<a href="' . esc_url(get_permalink($p)) . '">' . esc_html__('יעדים', 'ninjatours') . '</a>';
        if ($p = get_page_by_path('hotels'))       $links[] = '<a href="' . esc_url(get_permalink($p)) . '">' . esc_html__('מלונות', 'ninjatours') . '</a>';
        if ($p = get_page_by_path('attractions'))  $links[] = '<a href="' . esc_url(get_permalink($p)) . '">' . esc_html__('אטרקציות', 'ninjatours') . '</a>';
        echo implode('<span class="error-404__sep" aria-hidden="true"></span>', $links);
        ?>
      </nav>
    </div>
  </section>
</main>

<?php get_footer();

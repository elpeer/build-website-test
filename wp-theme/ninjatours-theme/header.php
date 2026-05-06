<!DOCTYPE html>
<html <?php language_attributes(); ?>>

<head>
  <?php
  get_template_part('parts/meta');
  wp_head();
  ?>
</head>

<?php
$general    = function_exists('get_field') ? get_field('general', 'options') : [];
$logo       = $general['logo']        ?? null;
$logo_dark  = $general['logo_dark']   ?? null;
$header_cta = $general['header_cta']  ?? null;

// Body classes — add per-CPT helper class
$body_classes = [];
if (!is_front_page() && !is_home()) {
  $body_classes[] = 'page-destinations';   // forces dark-on-light header on inner pages
}
if (is_404())   $body_classes[] = 'page-404';
if (is_search()) $body_classes[] = 'page-search';
?>

<body <?php body_class(implode(' ', $body_classes)); ?>>
  <a class="skip-link screen-reader-text" href="#main-content"><?php esc_html_e('דלג לתוכן הראשי', 'ninjatours'); ?></a>

  <header class="header">
    <div class="header-inner">

      <nav class="main-menu main-menu--start" aria-label="<?php esc_attr_e('תפריט ראשי - ימין', 'ninjatours'); ?>">
        <?php
        if (has_nav_menu('header_menu_1')) {
          wp_nav_menu([
            'theme_location' => 'header_menu_1',
            'container'      => false,
            'items_wrap'     => '<ul>%3$s</ul>',
            'depth'          => 1,
            'fallback_cb'    => false,
          ]);
        }
        ?>
      </nav>

      <div>
        <a href="<?php echo esc_url(home_url('/')); ?>" class="logo" aria-label="<?php bloginfo('name'); ?>">
          <?php if ($logo):      echo wp_get_attachment_image($logo,      'full', false, ['class' => '--default', 'loading' => 'eager']); endif; ?>
          <?php if ($logo_dark): echo wp_get_attachment_image($logo_dark, 'full', false, ['class' => '--dark',    'loading' => 'eager']); endif; ?>
        </a>
      </div>

      <div class="header-end">
        <nav class="main-menu main-menu--end" aria-label="<?php esc_attr_e('תפריט ראשי - שמאל', 'ninjatours'); ?>">
          <?php
          if (has_nav_menu('header_menu_2')) {
            wp_nav_menu([
              'theme_location' => 'header_menu_2',
              'container'      => false,
              'items_wrap'     => '<ul>%3$s</ul>',
              'depth'          => 1,
              'fallback_cb'    => false,
            ]);
          }
          ?>
        </nav>

        <button class="search-btn" aria-label="<?php esc_attr_e('חיפוש', 'ninjatours'); ?>">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/>
            <line x1="20" y1="20" x2="16.65" y2="16.65"/>
          </svg>
        </button>

        <?php if (!empty($header_cta) && !empty($header_cta['url'])): ?>
          <a href="<?php echo esc_url($header_cta['url']); ?>" class="btn-pill --light" target="<?php echo esc_attr($header_cta['target'] ?: '_self'); ?>">
            <span class="btn-pill__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
            </span>
            <span class="btn-pill__text"><?php echo esc_html($header_cta['title']); ?></span>
          </a>
        <?php endif; ?>
      </div>

      <button class="burger-btn" aria-label="<?php esc_attr_e('פתיחת תפריט', 'ninjatours'); ?>" aria-expanded="false" aria-controls="mobile-menu">
        <span></span><span></span><span></span>
      </button>
    </div>

    <div class="mobile-menu" id="mobile-menu">
      <nav class="main-menu" aria-label="<?php esc_attr_e('תפריט מובייל', 'ninjatours'); ?>">
        <ul>
          <?php
          // Mobile fallback — combine both header menus into one list
          $mobile_location = has_nav_menu('mobile_menu') ? 'mobile_menu' : 'header_menu_1';
          if (has_nav_menu($mobile_location)) {
            wp_nav_menu([
              'theme_location' => $mobile_location,
              'container'      => false,
              'items_wrap'     => '%3$s',
              'fallback_cb'    => false,
            ]);
          }
          if ($mobile_location === 'header_menu_1' && has_nav_menu('header_menu_2')) {
            wp_nav_menu([
              'theme_location' => 'header_menu_2',
              'container'      => false,
              'items_wrap'     => '%3$s',
              'fallback_cb'    => false,
            ]);
          }
          ?>
        </ul>
      </nav>
    </div>
  </header>

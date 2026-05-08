<!DOCTYPE html>
<html <?php language_attributes(); ?>>

<head>
  <?php
  get_template_part('parts/meta');
  wp_head();
  ?>
  <title><?php wp_title('|', true); ?></title>
</head>

<?php
$dir = get_template_directory_uri() . '/assets/app/';
$general = get_field('general', 'options');
$logo = $general['logo'];
$logo_dark = $general['logo_dark'];
?>

<body <?php echo body_class(); ?>>
  <div class="preloader"></div>

  <header class="header">
    <div class="header-inner">
      <nav class="main-menu main-menu--start" aria-label="תפריט ראשי - יעדים">
        <?php
        // Header Menu 1
        if (has_nav_menu('header_menu_1')) {
          wp_nav_menu([
            'theme_location' => 'header_menu_1',
            'container'      => false,
            'items_wrap'     => '<ul>%3$s</ul>',
            'fallback_cb'    => false,
          ]);
        }
        ?>
      </nav>

      <div>
        <a href="<?php echo esc_url(home_url('/')); ?>" class="logo" aria-label="Ninja Tours - חזרה לדף הבית">
          <?php echo wp_get_attachment_image($logo, 'full', false, ['class' => '--default', 'loading' => 'lazy']); ?>
          <?php echo wp_get_attachment_image($logo_dark, 'full', false, ['class' => '--dark', 'loading' => 'lazy']); ?>
        </a>
      </div>

      <div class="header-end">
        <nav class="main-menu main-menu--end" aria-label="תפריט ראשי - אודות">
          <?php
          // Header Menu 2
          if (has_nav_menu('header_menu_2')) {
            wp_nav_menu([
              'theme_location' => 'header_menu_2',
              'container'      => false,
              'items_wrap'     => '<ul>%3$s</ul>',
              'fallback_cb'    => false,
            ]);
          }
          ?>
        </nav>

        <button class="search-btn" aria-label="חיפוש">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.65" y2="16.65" />
          </svg>
        </button>

        <a href="#contact" class="btn-pill --light">
          <span class="btn-pill__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </span>
          <span class="btn-pill__text">בואו נתחיל</span>
        </a>
      </div>

      <button class="burger-btn" aria-label="פתיחת תפריט" aria-expanded="false" aria-controls="main-menu">
        <span></span><span></span><span></span>
      </button>
    </div>

    <div class="mobile-menu">
      <nav class="main-menu" aria-label="תפריט ראשי - מובייל">
        <ul>
          <?php
          // Output Menu 1 items only (without the <ul> wrapper)
          if (has_nav_menu('header_menu_1')) {
            wp_nav_menu([
              'theme_location' => 'header_menu_1',
              'container'      => false,
              'items_wrap'     => '%3$s',
              'fallback_cb'    => false,
            ]);
          }

          // Output Menu 2 items only (without the <ul> wrapper)
          if (has_nav_menu('header_menu_2')) {
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
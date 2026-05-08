<?php
/**
 * Front-end + admin asset enqueueing.
 * Vendors load from CDN; theme code only ships /assets/app/.
 */

// ─── Google Fonts ──────────────────────────────────────────────────────────
add_action('wp_head', function () {
  echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
  echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
}, 5);

add_action('wp_enqueue_scripts', function () {
  wp_enqueue_style(
    'ninjatours-google-fonts',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;600;700;800&display=swap',
    [], null
  );
});

// ─── Front-end CSS ─────────────────────────────────────────────────────────
add_action('wp_enqueue_scripts', function () {
  $dir = get_template_directory_uri() . '/assets/app/';
  $ver = NINJATOURS_VERSION;

  wp_enqueue_style('swiper-css',   'https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.css', [], '8.0.0');
  wp_enqueue_style('aos-css',      'https://unpkg.com/aos@2.3.4/dist/aos.css', [], '2.3.4');
  wp_enqueue_style('fancybox-css', 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.css', [], '5.0.0');

  wp_enqueue_style('ninjatours-main',         $dir . 'css/main.css',          [], $ver);
  wp_enqueue_style('ninjatours-hotels',       $dir . 'css/hotels.css',        ['ninjatours-main'], $ver);
  wp_enqueue_style('ninjatours-hotel-detail', $dir . 'css/hotel-detail.css',  ['ninjatours-main'], $ver);

  // Allow theme.style.css overrides (admin-friendly emergency CSS file)
  wp_enqueue_style('ninjatours-overrides', get_template_directory_uri() . '/style.css', ['ninjatours-main'], $ver);
});

// ─── Front-end JS — register on wp_footer so they go just before </body> ───
add_action('wp_footer', function () {
  $dir = get_template_directory_uri() . '/assets/app/';
  $ver = NINJATOURS_VERSION;

  wp_enqueue_script('swiper-js',   'https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.js', [], '8.0.0', true);
  wp_enqueue_script('aos-js',      'https://unpkg.com/aos@2.3.4/dist/aos.js', [], '2.3.4', true);
  wp_enqueue_script('fancybox-js', 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.umd.js', [], '5.0.0', true);
  wp_enqueue_script('marquee',     'https://cdnjs.cloudflare.com/ajax/libs/jQuery.Marquee/1.6.1/jquery.marquee.min.js', ['jquery'], '1.6.1', true);

  wp_enqueue_script(
    'ninjatours-main',
    $dir . 'js/main.js',
    ['jquery', 'swiper-js', 'aos-js', 'fancybox-js', 'marquee'],
    $ver,
    true
  );

  wp_enqueue_script('ninjatours-ajax', $dir . 'js/ajax.js', ['jquery'], $ver, true);
});

// ─── Admin: ACF chooser preview thumbnails ─────────────────────────────────
add_action('admin_enqueue_scripts', function () {
  wp_register_style(
    'ninjatours-acf',
    get_template_directory_uri() . '/assets/app/css/acf.css',
    [], NINJATOURS_VERSION
  );
  wp_enqueue_style('ninjatours-acf');
});

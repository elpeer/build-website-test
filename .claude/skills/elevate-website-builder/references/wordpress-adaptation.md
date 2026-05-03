# WordPress Adaptation Reference

This file documents how to convert a static HTML page (built per the rest of this skill) into a WordPress theme structure. The agency uses a custom-coded theme stack, not Elementor. Common stack: WordPress + Advanced Custom Fields PRO (ACF) + Polylang + WooCommerce + Contact Form 7 (with Salesforce / Leader / Bmby integrations) + Yoast or Rank Math for SEO.

---

## Theme file structure

```
wp-content/themes/elevate-{client}/
├── style.css                 // theme header (required by WP)
├── functions.php             // hooks, enqueues, ACF blocks, helpers
├── index.php                 // fallback
├── header.php
├── footer.php
├── front-page.php            // home
├── page.php                  // generic page
├── single.php                // single post
├── archive.php               // post archive (blog index)
├── 404.php
├── searchform.php
├── template-parts/
│   ├── sections/
│   │   ├── home-hero.php
│   │   ├── features.php
│   │   ├── products-slider.php
│   │   └── … (one per section)
│   └── components/
│       ├── product-card.php
│       ├── post-card.php
│       └── breadcrumbs.php
├── inc/
│   ├── acf-blocks.php        // register ACF blocks
│   ├── enqueue.php           // wp_enqueue_scripts hook
│   ├── menus.php             // register_nav_menus
│   ├── post-types.php        // register_post_type
│   ├── shortcodes.php
│   └── ajax.php              // admin-ajax handlers
├── woocommerce/              // WC template overrides
│   ├── single-product.php
│   ├── archive-product.php
│   └── … (other overrides)
├── css/
│   ├── main.min.css
│   └── main.scss             // source
├── js/
│   ├── main.js
│   └── libs/
└── img/                      // theme-shipped images (logos, icons)
```

---

## header.php

```php
<!DOCTYPE html>
<html <?php language_attributes(); ?>>

<head>
  <meta charset="<?php bloginfo('charset'); ?>" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
  <link rel="profile" href="https://gmpg.org/xfn/11" />
  <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a href="#main-content" class="skip-link"><?php esc_html_e('דלג לתוכן הראשי', 'elevate'); ?></a>
<div class="preloader"></div>

<header class="header">
  <div class="header-inner">
    <div class="wrapper">
      <a href="<?php echo esc_url(home_url('/')); ?>" class="logo" aria-label="<?php esc_attr_e('חזרה לדף הבית', 'elevate'); ?>">
        <img src="<?php echo esc_url(get_template_directory_uri()); ?>/img/logo.svg" alt="<?php bloginfo('name'); ?>">
      </a>
      <nav class="main-menu" aria-label="<?php esc_attr_e('תפריט ראשי', 'elevate'); ?>">
        <?php wp_nav_menu([
          'theme_location' => 'main_menu',
          'container' => false,
          'menu_class' => '',
          'fallback_cb' => false,
          'depth' => 2,
        ]); ?>
      </nav>
    </div>
    <div class="header-actions">
      <?php if (class_exists('WooCommerce')) : ?>
        <a href="#minicart" id="miniCartInit" data-fancybox class="cart-btn" aria-label="<?php esc_attr_e('צפייה בעגלה', 'elevate'); ?>">
          <span id="productCount"><?php echo WC()->cart ? WC()->cart->get_cart_contents_count() : 0; ?></span>
          <i class="icon__bag"></i>
        </a>
      <?php endif; ?>
    </div>
    <button class="burger-btn" aria-label="<?php esc_attr_e('פתיחת תפריט', 'elevate'); ?>" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>

  <?php if (class_exists('WooCommerce')) : ?>
    <?php get_template_part('template-parts/components/minicart'); ?>
  <?php endif; ?>
</header>

<main id="main-content">
```

Notes:
- `language_attributes()` outputs the lang and dir based on the site's locale. For Hebrew, this gives `dir="rtl" lang="he-IL"`.
- `wp_head()` and `wp_footer()` are mandatory — they're where plugins inject styles, scripts, and meta tags.
- `body_class()` adds context-aware classes (`page`, `single-product`, `home`, etc.) — useful for page-specific CSS.
- All visible strings go through translation functions (`esc_html_e` / `__`) so Polylang can swap them per language.
- All URLs go through `esc_url`, all attributes through `esc_attr` — security baseline.

---

## footer.php

```php
</main>

<footer class="footer">
  <div class="container --row">
    <div class="footer-logo">
      <a href="<?php echo esc_url(home_url('/')); ?>">
        <img src="<?php echo esc_url(get_template_directory_uri()); ?>/img/logo.svg" alt="<?php bloginfo('name'); ?>">
      </a>
    </div>

    <?php if (get_field('newsletter_title', 'option')) : ?>
      <div class="footer-subscribe">
        <div class="footer-subscribe__title"><?php the_field('newsletter_title', 'option'); ?></div>
        <div class="footer-subscribe__text"><?php the_field('newsletter_text', 'option'); ?></div>
        <?php echo do_shortcode('[contact-form-7 id="' . get_field('newsletter_form_id', 'option') . '"]'); ?>
      </div>
    <?php endif; ?>

    <div class="footer-menus">
      <?php wp_nav_menu([
        'theme_location' => 'footer_menu',
        'container' => false,
        'menu_class' => 'footer-menus__items',
        'depth' => 2,
      ]); ?>

      <div class="contacts">
        <span><?php esc_html_e('שירות לקוחות', 'elevate'); ?></span>
        <a href="mailto:<?php the_field('contact_email', 'option'); ?>"><?php the_field('contact_email', 'option'); ?></a>
        <a href="tel:<?php echo esc_attr(preg_replace('/\D/', '', get_field('contact_phone', 'option'))); ?>"><?php the_field('contact_phone', 'option'); ?></a>
      </div>

      <div class="social-media">
        <div class="social-media__title"><?php esc_html_e('עקבו אחרינו', 'elevate'); ?></div>
        <ul>
          <?php if (have_rows('social_links', 'option')) : while (have_rows('social_links', 'option')) : the_row(); ?>
            <li>
              <a href="<?php the_sub_field('url'); ?>" aria-label="<?php the_sub_field('label'); ?>" target="_blank" rel="noopener">
                <img src="<?php the_sub_field('icon'); ?>" alt="">
              </a>
            </li>
          <?php endwhile; endif; ?>
        </ul>
      </div>
    </div>
  </div>

  <div class="footer-middle">
    <div class="container --row">
      <div class="footer-middle__menus">
        <?php wp_nav_menu([
          'theme_location' => 'legal_menu',
          'container' => 'ul',
          'menu_class' => '',
        ]); ?>
        <p class="d-none-mob">
          <span><?php printf(esc_html__('כל הזכויות שמורות ל-Ⓒ %s', 'elevate'), get_bloginfo('name')); ?></span>
          <span><?php esc_html_e('עיצוב ופיתוח אתר: אלוויט דיגיטל סטודיו', 'elevate'); ?></span>
        </p>
      </div>
      <div class="footer-payments">
        <?php if (have_rows('payment_methods', 'option')) : while (have_rows('payment_methods', 'option')) : the_row(); ?>
          <div><img src="<?php the_sub_field('logo'); ?>" alt="<?php the_sub_field('name'); ?>"></div>
        <?php endwhile; endif; ?>
      </div>
    </div>
  </div>

  <?php if (get_field('legal_disclaimer', 'option')) : ?>
    <div class="footer-bottom">
      <div class="container">
        <p><?php the_field('legal_disclaimer', 'option'); ?></p>
      </div>
    </div>
  <?php endif; ?>
</footer>

<?php wp_footer(); ?>
</body>
</html>
```

Site-wide content (newsletter copy, contact details, social links, legal disclaimer) lives in an ACF Options Page — register it in `functions.php`:

```php
if (function_exists('acf_add_options_page')) {
  acf_add_options_page([
    'page_title' => 'הגדרות אתר',
    'menu_title' => 'הגדרות אתר',
    'menu_slug'  => 'site-settings',
    'capability' => 'edit_posts',
  ]);
}
```

---

## functions.php — typical bootstrap

```php
<?php
// Theme support
add_action('after_setup_theme', function () {
  add_theme_support('title-tag');
  add_theme_support('post-thumbnails');
  add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption']);
  add_theme_support('woocommerce');
  add_theme_support('wc-product-gallery-zoom');
  add_theme_support('wc-product-gallery-lightbox');
  add_theme_support('wc-product-gallery-slider');

  register_nav_menus([
    'main_menu'   => 'תפריט ראשי',
    'footer_menu' => 'תפריט תחתון',
    'legal_menu'  => 'תפריט משפטי',
  ]);
});

// Enqueue
add_action('wp_enqueue_scripts', function () {
  $version = wp_get_theme()->get('Version');

  // CSS
  wp_enqueue_style('elevate-main', get_template_directory_uri() . '/css/main.min.css', [], $version);

  // JS
  wp_enqueue_script('jquery'); // WP-bundled
  wp_enqueue_script('elevate-swiper', get_template_directory_uri() . '/js/libs/swiper/swiper.min.js', [], '11.0.0', true);
  wp_enqueue_script('elevate-aos', get_template_directory_uri() . '/js/libs/aos/aos.js', [], '2.3.4', true);
  wp_enqueue_script('elevate-fancybox', get_template_directory_uri() . '/js/libs/fancybox/fancybox.js', [], '5.0.0', true);
  wp_enqueue_script('elevate-main', get_template_directory_uri() . '/js/main.js', ['jquery', 'elevate-swiper', 'elevate-aos', 'elevate-fancybox'], $version, true);

  // Localize for AJAX
  wp_localize_script('elevate-main', 'elevate', [
    'ajaxurl' => admin_url('admin-ajax.php'),
    'nonce'   => wp_create_nonce('elevate_nonce'),
    'home'    => home_url('/'),
  ]);
});

// Includes
require_once get_template_directory() . '/inc/acf-blocks.php';
require_once get_template_directory() . '/inc/post-types.php';
require_once get_template_directory() . '/inc/ajax.php';
require_once get_template_directory() . '/inc/shortcodes.php';

// ACF Options
if (function_exists('acf_add_options_page')) {
  acf_add_options_page([
    'page_title' => 'הגדרות אתר',
    'menu_slug'  => 'site-settings',
  ]);
}

// Disable Gutenberg (the agency uses ACF flexible-content for page building)
add_filter('use_block_editor_for_post', '__return_false', 10);
add_filter('use_block_editor_for_post_type', '__return_false', 10);
```

---

## ACF flexible content for page building

The agency's primary page-building approach: a single ACF flexible-content field on Page that contains a list of blocks (hero, features, product slider, CTA, etc.). Each block is a layout in the flexible-content field, with its own subfields. The `page.php` template loops over the blocks and renders them via `get_template_part`.

### page.php

```php
<?php get_header(); ?>

<?php if (have_rows('sections')) : ?>
  <?php while (have_rows('sections')) : the_row(); ?>
    <?php
    $layout = get_row_layout();
    // Maps layout name (snake_case) → template-parts/sections/{name}.php
    get_template_part('template-parts/sections/' . str_replace('_', '-', $layout));
    ?>
  <?php endwhile; ?>
<?php else : ?>
  <article class="default-page">
    <div class="default-page__inner">
      <?php while (have_posts()) : the_post(); ?>
        <h1><?php the_title(); ?></h1>
        <div class="editor-area">
          <?php the_content(); ?>
        </div>
      <?php endwhile; ?>
    </div>
  </article>
<?php endif; ?>

<?php get_footer(); ?>
```

### A flexible-content section file: template-parts/sections/products-slider.php

```php
<?php
$title = get_sub_field('title');
$products = get_sub_field('products'); // post-object relationship to WooCommerce products
$section_id = 'products-' . get_row_index();
?>
<section class="products-slider" id="<?php echo esc_attr($section_id); ?>">
  <div class="container">
    <?php if ($title) : ?>
      <h2 class="section-title" data-aos="fade-up" data-aos-delay="100" data-aos-anchor="#<?php echo esc_attr($section_id); ?>">
        <?php echo esc_html($title); ?>
      </h2>
    <?php endif; ?>

    <?php if ($products) : ?>
      <div class="products-slider__items" data-aos="fade-up" data-aos-delay="200" data-aos-anchor="#<?php echo esc_attr($section_id); ?>">
        <div class="products-slider__swiper default-slider" data-initial="<?php echo (int) (count($products) / 2); ?>">
          <div class="swiper-wrapper">
            <?php foreach ($products as $product_post) : ?>
              <?php $product = wc_get_product($product_post->ID); if (!$product) continue; ?>
              <div class="swiper-slide">
                <div class="product-slide">
                  <a href="<?php echo esc_url(get_permalink($product_post->ID)); ?>" class="product-slide__image">
                    <?php echo get_the_post_thumbnail($product_post->ID, 'large', ['alt' => esc_attr($product->get_name())]); ?>
                    <?php $label = get_field('label', $product_post->ID); ?>
                    <?php if ($label) : ?>
                      <div class="product-slide__label">
                        <span><?php echo esc_html($label); ?></span>
                        <i class="icon__asterisk"></i>
                      </div>
                    <?php endif; ?>
                    <span class="btn --primary">
                      <span><?php esc_html_e('למידע ורכישה', 'elevate'); ?></span>
                      <i class="icon__plus"></i>
                    </span>
                  </a>
                  <div class="product-slide__text">
                    <h3 class="product-slide__title"><?php echo esc_html($product->get_name()); ?></h3>
                    <p><?php echo wp_kses_post(wp_trim_words($product->get_short_description(), 25, '...')); ?></p>
                  </div>
                </div>
              </div>
            <?php endforeach; ?>
          </div>
          <div class="btns">
            <button class="swiper-btn-prev default-prev" aria-label="<?php esc_attr_e('הקודם', 'elevate'); ?>"><i class="icon__arrow-right"></i></button>
            <button class="swiper-btn-next default-next" aria-label="<?php esc_attr_e('הבא', 'elevate'); ?>"><i class="icon__arrow-left"></i></button>
          </div>
        </div>
      </div>
    <?php endif; ?>
  </div>
</section>
```

The `get_row_index()` call gives a unique id per repeated section, so AOS anchors don't collide when the same section type appears twice on a page.

---

## Mapping static HTML → ACF fields

When converting a static page:

1. **Identify each editable string, image, link, and repeating group.**
2. **Group them by section.** Each section becomes a flexible-content layout.
3. **Per section, list the fields:**
   - Single text → text field
   - Long text → textarea or wysiwyg
   - Single image → image field (return Array or URL)
   - Multiple images → repeater of image
   - Link → link field (returns array with url/title/target)
   - Selection from posts → post-object or relationship
   - List of icon+text → repeater
4. **For repeated content like cards in a slider**, use a repeater field whose row contains: image, title, text, link.
5. **For section visibility**, add a true/false field "Show this section" so the editor can hide a section without deleting it.

Each ACF field's "Field Name" should be snake_case to match the variable convention. The "Label" is what the editor sees — write it in Hebrew.

---

## WooCommerce overrides

Place in `theme/woocommerce/`:

- `single-product.php` — replaces the WC default and gives full layout control.
- `archive-product.php` — for shop / category archives.
- `content-single-product.php` — body of single product (hooks: `woocommerce_before_single_product`, `_after`, etc.).
- `cart/cart.php`, `checkout/form-checkout.php` — replace cart / checkout templates.
- `loop/`, `single-product/`, `cart/`, `checkout/` — finer-grained partials.

Don't modify the canonical WC templates inside the plugin — they get overwritten on update. The `theme/woocommerce/` mirror is the supported override path.

For checkout customization, use hooks rather than full template replacement when possible:

```php
add_action('woocommerce_review_order_before_payment', function () {
  echo '<div class="custom-trust-badges">…</div>';
});

add_filter('woocommerce_checkout_fields', function ($fields) {
  unset($fields['billing']['billing_company']);
  $fields['billing']['billing_phone']['placeholder'] = 'טלפון נייד';
  return $fields;
});
```

---

## Polylang (multilingual)

Most agency sites are Hebrew + Arabic, sometimes + English.

- Each post / page / product has a per-language version. Polylang adds a language switcher in the admin.
- Strings hard-coded in the theme need wrapping in `__()` / `_e()` so they can be translated via Polylang's "Strings translations" panel.
- For ACF field translations, Polylang's ACF integration plugin is needed. Mark each ACF field as translatable in its settings.
- The language switcher in the front-end:

```php
<?php if (function_exists('pll_the_languages')) : ?>
  <ul class="lang-switcher">
    <?php pll_the_languages(['display_names_as' => 'name', 'show_flags' => 0]); ?>
  </ul>
<?php endif; ?>
```

- Language detection: by URL prefix (`/he/`, `/ar/`, `/en/`) or subdomain. URL prefix is the simpler default.
- Hreflang tags: Polylang generates them automatically. Verify they're in the rendered HTML.
- Don't forget RTL/LTR switching: Arabic and Hebrew are RTL, English is LTR. Polylang sets `dir` automatically based on the locale, so `<html dir="<?php language_attributes(); ?>">` Just Works.

---

## Hooks / filters worth knowing

- `wp_head` — inject `<head>` content (analytics, structured data)
- `wp_footer` — inject before `</body>`
- `wp_body_open` — inject just after `<body>` (GTM dataLayer noscript fallback)
- `the_content` — modify post content before render
- `wp_get_attachment_image_attributes` — modify attributes on `wp_get_attachment_image()` output (e.g., add `loading="lazy"`)
- `template_include` — swap which template file renders
- `pre_get_posts` — modify the main query (limit posts per page on archive, exclude categories, etc.)

---

## Security baseline

- Escape all output: `esc_html`, `esc_attr`, `esc_url`, `wp_kses_post` for content with allowed HTML.
- Verify nonces on all form submissions and AJAX handlers: `wp_verify_nonce` on receive, `wp_create_nonce` on output.
- Use `current_user_can()` for capability checks before privileged actions.
- Sanitize input: `sanitize_text_field`, `sanitize_email`, `absint`, `wp_kses` per-field.
- Use prepared statements for any custom DB query: `$wpdb->prepare`.
- Don't `eval()`. Don't `extract()` user input. Don't trust `$_GET` / `$_POST` / `$_REQUEST` without validation.

---

## Performance baseline

- Defer / async non-critical JS: `wp_script_add_data('handle', 'defer', true);`
- Lazy-load images below the fold: WP does this by default since 5.5 — verify it's not disabled.
- Use `srcset` and `sizes` via `wp_get_attachment_image()` instead of hard-coded `<img>` tags.
- Cache: most Israeli hosts (Plesk, cPanel, WPEngine) provide page caching. Agencies typically also enable WP Rocket or W3 Total Cache.
- Cloudflare CDN in front of the site for static asset delivery and DDoS protection.
- Bunny CDN (or similar) for image / video delivery in heavy-media projects.

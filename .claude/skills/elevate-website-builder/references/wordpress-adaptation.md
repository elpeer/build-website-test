# WordPress Adaptation Reference

This file documents how to convert a static HTML page (built per the rest of this skill) into an Elevate WordPress theme. The reference implementation is the **Ninja Tours theme** — every new theme should follow this exact structure unless the brief explicitly says otherwise.

## Stack assumptions

- WordPress (current stable)
- **Advanced Custom Fields PRO** (`advanced-custom-fields-pro`) — required, drives every editable area
- **ACF Medium Editor Field** (`acf-medium-editor-field`) — used wherever an inline-styled rich text is needed (titles with bold/italic accents, short captions)
- **Contact Form 7** — for forms (rendered via `do_shortcode`)
- **Custom Post Type UI** *or* a custom plugin — registers CPTs and taxonomies *outside the theme* (the theme assumes they exist and only queries them)
- Polylang and WooCommerce — only when the brief calls for them; not in the default stack

---

## Theme file structure (canonical)

```
elevate-{client}-theme/
├── style.css                          # Theme header metadata only — no real styles here
├── functions.php                      # 5–6 include_once lines, nothing else
├── header.php                         # <html><head>, header markup, mobile menu
├── footer.php                         # footer markup, wp_footer
├── index.php                          # Archive / blog fallback
├── inc/
│   ├── assets.php                     # wp_enqueue_scripts/styles + admin ACF css
│   ├── disable.php                    # Remove WP cruft (emojis, comments, customizer, patterns)
│   ├── functions.php                  # Render helpers + AJAX handlers
│   ├── svg-support.php                # Allow admin SVG uploads
│   └── theme-settings.php             # ACF options page, nav menus, theme_supports, Gutenberg toggle
├── parts/
│   ├── meta.php                       # <meta charset>, <meta viewport>, wp_site_icon
│   └── {entity}-card.php              # Reusable cards (e.g., attraction-card, post-item) — called via get_template_part with ['id' => …]
├── views/
│   └── page-flexible-content.php     # The ONE page template — `Template name: Flexible Content`
├── content/
│   ├── flexible-content.php           # Iterates ACF flexible_content, dispatches to sections/
│   └── sections/
│       ├── home_hero.php
│       ├── why_us.php
│       ├── trip_types.php
│       ├── attractions.php
│       ├── testimonials.php
│       ├── process.php
│       ├── partners.php
│       ├── contact.php
│       ├── content_media.php
│       ├── image_separator.php
│       └── …                          # one file per layout, snake_case filename matching ACF layout name
└── assets/
    └── app/
        ├── css/main.css               # Compiled stylesheet (built from SCSS source)
        ├── css/acf.css                # Admin-only — adds preview thumbnails to ACF flexible-content layout chooser
        ├── js/main.js                 # Front-end behavior (IIFE pattern, jQuery)
        ├── js/ajax.js                 # AJAX handlers
        ├── images/                    # Theme-shipped images (leaves, decorative shapes, etc.)
        └── previews/                  # ACF layout-chooser thumbnails: home_hero.jpg, why_us.jpg, …
```

Notes:
- **`style.css` is metadata only.** Do not put real CSS there. Real CSS goes in `assets/app/css/main.css`. The two files *are both enqueued* (style.css second, as "additional styles"), but `style.css` typically stays empty after the header comment.
- **`functions.php` is short.** It only has `include_once` lines for the `inc/` files. All real bootstrapping happens in `inc/`.
- **No `front-page.php`, `page.php`, `single.php`** for the typical content. A single template `views/page-flexible-content.php` powers every flexible-content page; assign it in the page editor.
- **CPT singles** (`single-attraction.php` etc.) are added only when needed — most CPT detail pages can also use the flexible-content template by setting it on a per-post basis.

---

## functions.php — the entire file

```php
<?php
include_once 'inc/disable.php';
include_once 'inc/assets.php';
include_once 'inc/theme-settings.php';
include_once 'inc/functions.php';
include_once 'inc/svg-support.php';
```

That's it. Anything beyond five include_onces is a sign the inc/ split was skipped.

---

## inc/theme-settings.php

```php
<?php
// ACF options page — global content (logo, social, sections defaults)
if (function_exists('acf_add_options_page')) {
  acf_add_options_page([
    'page_title' => 'General Settings',
    'menu_title' => 'General Settings',
    'menu_slug'  => 'theme-general-settings',
    'capability' => 'edit_posts',
    'redirect'   => false,
    'position'   => 10,
  ]);
}

// Expose JS variables (ajax_url at minimum) on every page
function theme_js_variables() {
  $variables = ['ajax_url' => admin_url('admin-ajax.php')];
  echo '<script type="text/javascript">window.theme_data = ' . json_encode($variables) . ';</script>';
}
add_action('wp_head', 'theme_js_variables');

add_theme_support('post-thumbnails');
add_theme_support('menus');

register_nav_menus([
  'header_menu_1' => 'Header Menu 1',
  'header_menu_2' => 'Header Menu 2',
  'footer_menu'   => 'Footer Menu',
]);

// Strip noisy default image sizes
add_action('after_setup_theme', function () {
  remove_image_size('2048x2048');
  remove_image_size('1536x1536');
  remove_image_size('medium_large');
});

// Disable Gutenberg for pages (we use ACF flexible-content); keep it for posts
add_filter('use_block_editor_for_post', function ($can_edit, $post) {
  return $post->post_type === 'post';
}, 10, 2);

// CF7: don't load its default CSS or auto-add <p> tags
add_filter('wpcf7_load_css', '__return_false', 999);
add_filter('wpcf7_autop_or_not', '__return_false');
```

Key points:
- The ACF options page slug is **`theme-general-settings`** and the field group on it is conventionally named **`general`** (logo, logo_dark, email, instagram, facebook, etc.) plus **`sections_content`** (per-section default content, see below).
- **Nav menus**: two header menus + one footer menu, registered as `header_menu_1`, `header_menu_2`, `footer_menu`.
- **`window.theme_data.ajax_url`** is the standard hook front-end JS uses to find the AJAX endpoint.

---

## inc/assets.php

```php
<?php
// Google Fonts — preconnect + load
add_action('wp_head', function () {
  echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
  echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
}, 5);

add_action('wp_enqueue_scripts', function () {
  wp_enqueue_style(
    'theme-google-fonts',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;600;700;800&display=swap',
    [], null
  );
});

// Front-end CSS
add_action('wp_enqueue_scripts', function () {
  wp_enqueue_style('swiper-css',   'https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.css', [], '8.0.0');
  wp_enqueue_style('aos-css',      'https://unpkg.com/aos@2.3.4/dist/aos.css', [], '2.3.4');
  wp_enqueue_style('fancybox-css', 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.css', [], '5.0.0');
  wp_enqueue_style('style',        get_template_directory_uri() . '/assets/app/css/main.css', []);
  wp_enqueue_style('add-style',    get_template_directory_uri() . '/style.css', []);
});

// Front-end JS — registered on wp_footer so they go at the end of <body>
add_action('wp_footer', function () {
  wp_enqueue_script('swiper-js',   'https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.js', [], '8.0.0', true);
  wp_enqueue_script('aos-js',      'https://unpkg.com/aos@2.3.4/dist/aos.js', [], '2.3.4', true);
  wp_enqueue_script('fancybox-js', 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.umd.js', [], '5.0.0', true);
  wp_enqueue_script('marquee',     'https://cdnjs.cloudflare.com/ajax/libs/jQuery.Marquee/1.6.1/jquery.marquee.min.js', ['jquery'], '1.6.1', true);
  wp_enqueue_script('main',        get_template_directory_uri() . '/assets/app/js/main.js', ['jquery', 'swiper-js', 'aos-js', 'fancybox-js', 'marquee'], null, true);
  wp_enqueue_script('ajax',        get_template_directory_uri() . '/assets/app/js/ajax.js', ['jquery'], null, true);
});

// Admin: load ACF preview-image styles for the flexible-content layout chooser
add_action('admin_enqueue_scripts', function () {
  wp_register_style('acf', get_template_directory_uri() . '/assets/app/css/acf.css', [], null, 'all');
  wp_enqueue_style('acf');
});
```

Notes:
- Vendors load from CDN, not bundled. Theme code is the only thing in `assets/app/`.
- The `acf.css` admin file paints layout-chooser previews — see "ACF flexible content" section below.
- jQuery is the WordPress-bundled one; do not enqueue a custom version.

---

## header.php (canonical pattern)

```php
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
$dir       = get_template_directory_uri() . '/assets/app/';
$general   = get_field('general', 'options');
$logo      = $general['logo'];
$logo_dark = $general['logo_dark'];
?>

<body <?php echo body_class(); ?>>
  <div class="preloader"></div>

  <header class="header">
    <div class="header-inner">
      <nav class="main-menu main-menu--start" aria-label="תפריט ראשי - יעדים">
        <?php
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
        <a href="<?php echo esc_url(home_url('/')); ?>" class="logo" aria-label="...">
          <?php echo wp_get_attachment_image($logo,      'full', false, ['class' => '--default', 'loading' => 'lazy']); ?>
          <?php echo wp_get_attachment_image($logo_dark, 'full', false, ['class' => '--dark',    'loading' => 'lazy']); ?>
        </a>
      </div>

      <div class="header-end">
        <nav class="main-menu main-menu--end" aria-label="תפריט ראשי - אודות">
          <?php
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
        <!-- search button + CTA pill … -->
      </div>

      <button class="burger-btn" aria-label="פתיחת תפריט" aria-expanded="false" aria-controls="main-menu">
        <span></span><span></span><span></span>
      </button>
    </div>

    <!-- Mobile drawer — same menus, but unwrapped and merged into one <ul> -->
    <div class="mobile-menu">
      <nav class="main-menu" aria-label="תפריט ראשי - מובייל">
        <ul>
          <?php
          if (has_nav_menu('header_menu_1')) {
            wp_nav_menu([
              'theme_location' => 'header_menu_1',
              'container'      => false,
              'items_wrap'     => '%3$s',
              'fallback_cb'    => false,
            ]);
          }
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
```

Notes:
- Light + dark logos rendered side-by-side; CSS toggles which is visible based on body class (`.page-destinations` shows the dark logo on light header backgrounds, etc.).
- Mobile menu reuses the same nav menu items via `'items_wrap' => '%3$s'` (returns just `<li>`s, no `<ul>`).
- Meta tags live in `parts/meta.php` — keep that file tiny: charset, X-UA-Compatible, viewport, `wp_site_icon()`.

---

## footer.php (canonical pattern)

```php
<?php
$dir       = get_template_directory_uri() . '/assets/app/';
$general   = get_field('general', 'option');
$logo      = $general['logo'];
$email     = $general['email'];
$instagram = $general['instagram'];
$facebook  = $general['facebook'];
?>

<footer class="footer" id="footer">
  <div class="footer__inner">
    <div class="footer__col footer__col--logo">
      <a href="<?php echo esc_url(home_url('/')); ?>" class="footer__logo" aria-label="<?php bloginfo('name'); ?>">
        <?php echo wp_get_attachment_image($logo, 'full', false, ['loading' => 'lazy']); ?>
      </a>
    </div>

    <div class="footer__menus">
      <?php if (has_nav_menu('footer_menu')) {
        wp_nav_menu([
          'theme_location' => 'footer_menu',
          'container'      => false,
          'items_wrap'     => '<ul>%3$s</ul>',
          'fallback_cb'    => false,
        ]);
      } ?>
    </div>

    <div class="footer__col footer__col--contact">
      <h4 class="footer__heading">יצירת קשר</h4>
      <?php if (!empty($email)): ?>
        <a class="footer__email" href="mailto:<?php echo $email; ?>"><?php echo $email; ?></a>
      <?php endif; ?>
      <ul class="footer__socials" aria-label="רשתות חברתיות">
        <?php if (!empty($facebook)): ?>
          <li><a class="footer__social" href="<?php echo esc_url($facebook); ?>" aria-label="פייסבוק" target="_blank">…SVG…</a></li>
        <?php endif; ?>
        <?php if (!empty($instagram)): ?>
          <li><a class="footer__social" href="<?php echo esc_url($instagram); ?>" aria-label="אינסטגרם" target="_blank">…SVG…</a></li>
        <?php endif; ?>
      </ul>
    </div>
  </div>

  <div class="footer__bar">
    <p class="footer__copy">Copyright &copy;<?php bloginfo('name'); ?>. All rights reserved</p>
    <p class="footer__credit">Design &amp; Code by Elevate</p>
  </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
```

All editable values (logo, email, social URLs) come from the `general` field group on the ACF options page. The theme reads them once at the top, then renders.

---

## The page template — views/page-flexible-content.php

There is only one template, and every flexible-content page uses it.

```php
<?php
/* Template name: Flexible Content */
get_header();
$dir = get_template_directory_uri() . '/assets/app/';
?>

<main id="main-content">
  <?php get_template_part('content/flexible-content'); ?>
</main>

<?php get_footer(); ?>
```

In the WP admin, every page (including the homepage) has its template set to "Flexible Content" so this file renders the body.

---

## content/flexible-content.php — the section dispatcher

```php
<?php
$acf_content = get_field('flexible_content');

// Fallback: when the page is actually a taxonomy term (rare), pull from the term
if (is_tax()) {
  $tax = get_queried_object();
  $acf_content = get_field('flexible_content', $tax);
}

if (empty($acf_content)) return false;

$i_section = 1;
foreach ($acf_content as $item) {
  get_template_part('content/sections/' . $item['acf_fc_layout'], '', [
    'i'    => $i_section,
    'item' => $item,
  ]);
  $i_section++;
}
```

Two things to note:
1. **The dispatcher passes the entire ACF row as `args['item']`** — sections receive `$args['item']`, not `get_sub_field('...')`. This is a different pattern from the WP-default `have_rows()` loop and matters for every section file.
2. **Each layout's PHP file is named exactly the same as `acf_fc_layout`**, in snake_case. Layout `home_hero` → `content/sections/home_hero.php`.

---

## Section file boilerplate — every section starts with this

This is the most important convention. Every file in `content/sections/` opens with the same 18 lines (with `<slug>` and `<layout_name>` swapped):

```php
<?php
$dir          = get_template_directory_uri() . '/assets/app/';
$data         = $args['item'];
$use_general  = $data['use_general_settings'];
$hide_section = $data['hide_section'];
$section_id   = $data['section_id'];
if (empty($section_id)) $section_id = '<slug>-' . $args['i'];

if ($use_general) {
  $group = get_field('sections_content', 'options')['<layout_name>'];
} else {
  $group = $data['group']['<layout_name>'];
}

if ($hide_section) return;
if (!$group)       return;

// Now extract the layout-specific fields:
$title    = $group['title']    ?? '';
$lead     = $group['lead']     ?? '';
$cta      = $group['cta']      ?? null;
// …
?>
<section class="<slug>" id="<?php echo esc_attr($section_id); ?>">
  <!-- markup -->
</section>
```

Three top-level fields are present on **every** flexible-content layout (configure them as the first three subfields when designing the ACF group):

| Field name              | Type      | Purpose                                                                                       |
|-------------------------|-----------|-----------------------------------------------------------------------------------------------|
| `use_general_settings`  | true/false| When on, the section pulls its content from `sections_content[<layout>]` on the options page  |
| `hide_section`          | true/false| Skip rendering this section without deleting it                                                |
| `section_id`            | text      | Custom anchor id; if blank, falls back to `<slug>-<index>`                                     |
| `group`                 | group     | Container for all the layout's actual fields; named `<layout_name>` so both inline & options paths work |

The `group` wrapper is what lets the same section be content-driven from two places: when "use general" is on, the same field structure exists at `options › sections_content[<layout>]`, so the same key reads work whether the source is the page or the options page.

This pattern means the editor can:
- **Drop a section into any page** and either fill it inline or check "use general settings" to reuse a global version.
- **Hide a section** without losing its content.
- **Override the anchor id** for hash-link nav.

---

## Helpers in inc/functions.php

The agency theme ships three render helpers and any AJAX handlers:

```php
<?php
// Render an ACF link field as <a class="…">label</a> (with or without trailing icon)
function get_acf_link($acf_link, $class, $with_icon = false, $icon_class = null) {
  if (!$acf_link) return;
  $url    = $acf_link['url'];
  $title  = $acf_link['title'];
  $target = $acf_link['target'] ?: '_self';
  ?>
  <a class="<?php echo $class; ?>" href="<?php echo esc_url($url); ?>" target="<?php echo esc_attr($target); ?>">
    <?php if ($with_icon): ?>
      <span><?php echo esc_html($title); ?></span>
      <i class="<?php echo $icon_class; ?>"></i>
    <?php else: ?>
      <?php echo esc_html($title); ?>
    <?php endif; ?>
  </a>
  <?php
}

// Render a <picture> with optional mobile crop
function render_picture($image, $image_mobile) {
  if (!empty($image_mobile)): ?>
    <picture>
      <source srcset="<?php echo wp_get_attachment_image_url($image_mobile, 'full'); ?>" media="(max-width: 768px) and (orientation: portrait)">
      <?php echo wp_get_attachment_image($image, 'full', null, ['loading' => 'lazy']); ?>
    </picture>
  <?php else:
    echo wp_get_attachment_image($image, 'full', null, ['loading' => 'lazy']);
  endif;
}

// Convert "|word|" → "<tag>word</tag>" — used to mark inline accents inside a plain text title
function render_title($title, $tag = 'span', $class = false) {
  $class_attr = $class ? 'class="' . $class . '"' : '';
  if (!empty($title)) {
    return preg_replace('/\|(.*?)\|/', '<' . $tag . ' ' . $class_attr . '>$1</' . $tag . '>', $title);
  }
}
```

`render_title` is the agency's lightweight alternative to a rich-text field for headings: the editor types `נופים |מרהיבים| ביפן` in a plain text field and the front-end converts the pipes into a styled span. Use it when the only formatting needed is a single accent word.

For richer formatting (bold, italic, links inside a sentence), use the **ACF Medium Editor Field** plugin instead and output with `wp_kses_post()`.

---

## CPTs — register them OUTSIDE the theme

The theme assumes these post types exist; it does not register them:
- `attraction` (with taxonomy `attraction-category`)
- `travel-type`
- `use-case`
- `testimonial`

Register CPTs and taxonomies via:
- **Custom Post Type UI** plugin, or
- A site-specific plugin (recommended for production), or
- A separate file required from outside the theme

This separation matters: if the theme is deactivated the data should not disappear, so CPT registration belongs to a plugin, not a theme.

The theme then queries them with standard `WP_Query` / `get_posts`:

```php
$args = [
  'post_type'      => 'attraction',
  'posts_per_page' => -1,
  'orderby'        => 'date',
  'order'          => 'DESC',
  'post_status'    => 'publish',
];
$query = new WP_Query($args);
```

A common section pattern: a `show_all` toggle that, when true, queries all posts of a CPT; when false, uses an editor-curated `items` post-object/relationship array. See `content/sections/trip_types.php`, `testimonials.php`, `use_cases.php` in the reference theme.

---

## CPT card parts

Repeating cards live in `parts/`, called via `get_template_part` with an `id` arg:

```php
// In a section loop:
get_template_part('parts/attraction-card', null, ['id' => get_the_ID()]);

// In parts/attraction-card.php:
<?php
$id        = $args['id'];
$image     = get_the_post_thumbnail($id, 'full', ['class' => 'attractions__card-img', 'loading' => 'lazy']);
$title     = get_the_title($id);
$excerpt   = get_the_excerpt($id);
$permalink = get_the_permalink($id);
?>
<article class="attractions__card">
  <a href="<?php echo $permalink; ?>">
    <?php echo $image; ?>
    <span class="attractions__card-overlay" aria-hidden="true"></span>
    <span class="attractions__card-arrow" aria-hidden="true">…SVG…</span>
    <div class="attractions__card-body">
      <h3 class="attractions__card-title"><?php echo $title; ?></h3>
      <p class="attractions__card-desc"><?php echo $excerpt; ?></p>
    </div>
  </a>
</article>
```

The same card is reused in: the homepage attractions section, the AJAX filter response, the related-attractions slider on the single-attraction page, etc. One card file = one source of truth.

---

## AJAX pattern

Hook `wp_ajax_*` and `wp_ajax_nopriv_*` for both logged-in and guest users. The handler queries posts and echoes rendered template parts (HTML, not JSON):

```php
add_action('wp_ajax_handle_attractions_filter_ajax',        'handle_attractions_filter_ajax');
add_action('wp_ajax_nopriv_handle_attractions_filter_ajax', 'handle_attractions_filter_ajax');

function handle_attractions_filter_ajax() {
  $category_id = isset($_POST['category_id']) ? sanitize_text_field($_POST['category_id']) : 'all';

  $args = [
    'post_type'      => 'attraction',
    'posts_per_page' => -1,
    'orderby'        => 'date',
    'order'          => 'DESC',
    'post_status'    => 'publish',
  ];
  if ($category_id !== 'all') {
    $args['tax_query'] = [[
      'taxonomy' => 'attraction-category',
      'field'    => 'term_id',
      'terms'    => absint($category_id),
    ]];
  }
  $query = new WP_Query($args);

  if ($query->have_posts()) {
    while ($query->have_posts()) {
      $query->the_post();
      get_template_part('parts/attraction-card', null, ['id' => get_the_ID()]);
    }
    wp_reset_postdata();
  }
  wp_die();
}
```

Front-end uses `window.theme_data.ajax_url` (set by `theme-settings.php`) to find the endpoint. Add a nonce on every form / AJAX flow that mutates state — `wp_create_nonce()` on output, `wp_verify_nonce()` on receive.

---

## ACF flexible-content layout chooser previews

Every layout in the flexible-content field gets a thumbnail in the admin chooser, so the editor sees what the section looks like before adding it. Two pieces:

1. **Image at `assets/app/previews/<layout_name>.jpg`** — a real screenshot of the section, ~550 × 300 px.
2. **CSS rule in `assets/app/css/acf.css`**:

```css
.acf-fc-popup ul li a::after {
  position: absolute;
  content: '';
  z-index: 10;
  right: calc(100% + 0.5rem);
  top: 0;
  width: 34.375rem;
  height: 18.75rem;
  border-radius: .5rem;
  box-shadow: 0 0 0.5625rem 0.25rem rgba(0,0,0,0.25);
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  background-color: #FFFAF5;
}
@media (any-hover: hover) {
  .acf-fc-popup ul li a:hover::after { opacity: 1; visibility: visible; pointer-events: all; }
}
.acf-fc-popup ul li a[data-layout="home_hero"]::after { background-image: url("../previews/home_hero.jpg"); }
.acf-fc-popup ul li a[data-layout="why_us"]::after    { background-image: url("../previews/why_us.jpg"); }
/* … one rule per layout … */
```

`acf.css` is enqueued only on admin (`admin_enqueue_scripts`).

---

## Mapping static HTML → ACF fields

When converting a static section to ACF:

1. **Scan the section markup.** List every editable string, image, link, and repeating group.
2. **Wrap them in a layout group** named `<layout_name>` (matches the section file name).
3. **The first three fields are always:**
   - `use_general_settings` (true/false)
   - `hide_section` (true/false)
   - `section_id` (text)
4. **Then the layout's content lives inside a `group` field** named `<layout_name>` (a literal group field, not a wrapper concept) — so reads from both inline and options page work the same way.
5. **Pick the right field type per element:**
   - Single short text → text
   - Title with one accent word → text + `render_title($title, 'em')`
   - Title with rich inline formatting → ACF Medium Editor Field, output with `wp_kses_post()`
   - Long text → textarea or wysiwyg
   - Single image → image (return ID)
   - Multiple images → repeater of image, or gallery
   - Link → link field (returns `[url, title, target]`)
   - Selection from posts → post-object (single) or relationship (multi)
   - List of icon+text cards → repeater
   - Toggle for "show all" (auto-pull from a CPT) → true/false next to the items field
6. **Field name = snake_case.** Field label = Hebrew (or whatever the editor's language is).
7. **Mirror the same group at `options › sections_content[<layout>]`** so the "use general settings" toggle has somewhere to read from.

---

## Output rules — escaping & helpers

| Use case                        | Function                                                                       |
|---------------------------------|--------------------------------------------------------------------------------|
| Plain text                      | `esc_html($value)`                                                             |
| Plain text with manual `<br>`   | `nl2br(esc_html($value))`                                                      |
| HTML-allowed text (titles, body)| `wp_kses_post($value)`                                                         |
| URL                             | `esc_url($url)`                                                                |
| HTML attribute                  | `esc_attr($value)`                                                             |
| Image by attachment ID          | `wp_get_attachment_image($id, 'full', false, ['loading' => 'lazy'])`           |
| Featured image                  | `get_the_post_thumbnail($post_id, 'full', ['loading' => 'lazy'])`              |
| Image URL by attachment ID      | `wp_get_attachment_image_url($id, 'full')`                                     |
| Picture w/ mobile crop          | `render_picture($image_id, $image_mobile_id)` (helper)                         |
| ACF link field                  | `get_acf_link($acf_link, 'btn-pill --primary', true, 'icon__arrow-left')` (helper) |
| Inline-accent title             | `render_title($title, 'em')` then echo with `wp_kses_post`                     |
| CF7 form by ID                  | `do_shortcode('[contact-form-7 id="' . $form->ID . '"]')`                      |

ACF image return format: configure as **Image ID** in the field setup. All helpers expect IDs.

---

## inc/disable.php

A grab-bag of "remove WP cruft" actions. Copy the file as-is between projects — most agencies use the exact same list:

- Disable emojis (head + admin)
- Hide Comments menu item, redirect comment-related admin URLs
- Remove the Customizer menu and redirect `customize.php`
- Remove "Patterns" and `wp_block` from the Appearance menu
- Strip the Comments and Customize nodes from the admin bar

Full code: see `inc/disable.php` in the reference theme. It's ~115 lines and rarely changes.

---

## inc/svg-support.php

Allows admin users to upload SVG attachments — needed because the icon library is delivered as SVGs:

```php
add_filter('upload_mimes', function ($mimes) {
  $mimes['svg'] = 'image/svg+xml';
  return $mimes;
});

add_filter('wp_check_filetype_and_ext', function ($data, $file, $filename, $mimes, $real_mime = '') {
  $is_svg = in_array($real_mime, ['image/svg', 'image/svg+xml'])
         || ('.svg' === strtolower(substr($filename, -4)));
  if ($is_svg && current_user_can('manage_options')) {
    $data['ext']  = 'svg';
    $data['type'] = 'image/svg+xml';
  } elseif ($is_svg) {
    $data['ext'] = $data['type'] = false; // non-admins can't upload SVG
  }
  return $data;
}, 10, 5);
```

Note the capability gate: only `manage_options` users (administrators) can upload SVGs. SVG can carry XSS payloads, so don't open this up to all editors.

---

## When to deviate

The structure above is the default. Deviate only when the brief calls for it:

- **WooCommerce** → add a `woocommerce/` folder for template overrides; add WC-specific assets to `inc/assets.php`.
- **Polylang** → wrap user-visible strings in `__()` / `esc_html_e()`; mark ACF fields translatable; add a language switcher in `header.php` near the menu.
- **Single-CPT custom layout** → if a CPT detail page can't be rendered as a flexible-content page, add `single-{cpt}.php` (e.g., `single-attraction.php`); reuse cards from `parts/`.
- **Custom blog index** → add `archive.php` and `index.php` overrides. The default theme keeps them minimal because most agency sites' blog is secondary.

---

## Quick checklist when handing the theme over

- [ ] `style.css` has only the theme header, no real CSS
- [ ] `functions.php` is just the include_once block
- [ ] All five `inc/` files exist and only contain their stated concern
- [ ] `views/page-flexible-content.php` is set as the page template on every public-facing page
- [ ] ACF Pro is active; ACF Medium Editor Field is active
- [ ] CPTs are registered in a *separate* plugin (not the theme)
- [ ] Options Page "General Settings" exists with `general` + `sections_content` field groups
- [ ] Each layout's PHP file in `content/sections/` follows the boilerplate exactly
- [ ] `parts/<entity>-card.php` exists for every reused card; receives `['id' => …]` via `args`
- [ ] `assets/app/previews/<layout>.jpg` exists for every flexible-content layout
- [ ] `acf.css` has a rule for every layout
- [ ] AJAX handlers verify nonces and use `sanitize_*` on all `$_POST` reads
- [ ] SVG upload restricted to administrators only

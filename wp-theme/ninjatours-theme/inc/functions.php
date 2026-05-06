<?php
/**
 * Theme-wide render helpers and content utilities.
 *
 * Naming convention: every helper is prefixed `nt_` to avoid colliding with
 * WordPress core or plugin functions.
 */

/**
 * Render an ACF Link field as an <a class="..."> with optional trailing icon.
 *
 * @param array|null $acf_link  ACF link field array: [url, title, target]
 * @param string $class         CSS class on the anchor
 * @param bool $with_icon       When true, wrap text in <span> and append <i>
 * @param string|null $icon_class CSS class for the trailing <i>
 */
function nt_render_link($acf_link, string $class = '', bool $with_icon = false, ?string $icon_class = null): void {
  if (empty($acf_link) || empty($acf_link['url'])) return;

  $url    = $acf_link['url'];
  $title  = $acf_link['title'] ?? '';
  $target = !empty($acf_link['target']) ? $acf_link['target'] : '_self';
  ?>
  <a class="<?php echo esc_attr($class); ?>" href="<?php echo esc_url($url); ?>" target="<?php echo esc_attr($target); ?>">
    <?php if ($with_icon): ?>
      <span><?php echo esc_html($title); ?></span>
      <i class="<?php echo esc_attr($icon_class); ?>" aria-hidden="true"></i>
    <?php else: ?>
      <?php echo esc_html($title); ?>
    <?php endif; ?>
  </a>
  <?php
}

/**
 * Render a CTA pill button (matches the `.btn-pill --primary --lg` markup
 * pattern used across the theme). Accepts an ACF link field.
 *
 * @param array|null $cta      ACF link field: [url, title, target]
 * @param string $modifier     "--primary" | "--blue" | "--light"
 * @param string $extra_class  Optional additional class
 */
function nt_render_cta($cta, string $modifier = '--primary --lg', string $extra_class = ''): void {
  if (empty($cta) || empty($cta['url'])) return;
  $target = !empty($cta['target']) ? $cta['target'] : '_self';
  ?>
  <a href="<?php echo esc_url($cta['url']); ?>" class="btn-pill <?php echo esc_attr($modifier . ' ' . $extra_class); ?>" target="<?php echo esc_attr($target); ?>">
    <span class="btn-pill__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"/>
        <polyline points="12 19 5 12 12 5"/>
      </svg>
    </span>
    <span class="btn-pill__text"><?php echo esc_html($cta['title']); ?></span>
  </a>
  <?php
}

/**
 * Render a <picture> with optional mobile crop. Both args are attachment IDs.
 *
 * @param int|null $image          Desktop image ID
 * @param int|null $image_mobile   Optional mobile-portrait image ID
 * @param array $attrs             Extra <img> attrs (alt, class, etc.)
 */
function nt_render_picture($image, $image_mobile = null, array $attrs = []): void {
  if (empty($image)) return;

  $img_attrs = array_merge(['loading' => 'lazy'], $attrs);

  if (!empty($image_mobile)) {
    $mobile_url = wp_get_attachment_image_url($image_mobile, 'full');
    ?>
    <picture>
      <source srcset="<?php echo esc_url($mobile_url); ?>" media="(max-width: 768px) and (orientation: portrait)">
      <?php echo wp_get_attachment_image($image, 'full', false, $img_attrs); ?>
    </picture>
    <?php
  } else {
    echo wp_get_attachment_image($image, 'full', false, $img_attrs);
  }
}

/**
 * Convert "|word|" syntax in plain text → "<tag>word</tag>" — used for
 * inline accent spans inside titles without forcing a rich-text editor.
 *
 * Example: "טבע |ונופים| ביפן" → "טבע <em>ונופים</em> ביפן"
 *
 * Output should still be passed through `wp_kses_post()` when echoed.
 */
function nt_render_title(string $title, string $tag = 'em', string $class = ''): string {
  if (empty($title)) return '';
  $class_attr = $class ? ' class="' . esc_attr($class) . '"' : '';
  return preg_replace(
    '/\|(.*?)\|/',
    '<' . $tag . $class_attr . '>$1</' . $tag . '>',
    $title
  );
}

/**
 * Pull items from an ACF post-object/relationship field, falling back to a
 * fresh CPT query when the field is empty.
 *
 * Returns null if no items are available — callers should `if (empty($items)) return;`
 * to skip rendering entirely. This way a section never shows an empty/broken state.
 *
 * @param string $field_name      ACF field name on the current source
 * @param string $post_type       CPT slug to fall back to
 * @param mixed $context          Post ID, term, or 'options' — passed to get_field
 * @param int $fallback_count     Posts to load when the field is empty (default 10)
 * @param array $extra_args       Extra WP_Query args for the fallback
 * @return WP_Post[]|null
 */
function nt_get_items_with_fallback(
  string $field_name,
  string $post_type,
  $context = false,
  int $fallback_count = 10,
  array $extra_args = []
): ?array {
  $items = get_field($field_name, $context);

  // ACF returns false / empty array when nothing's selected
  if (empty($items)) {
    $args = array_merge([
      'post_type'      => $post_type,
      'posts_per_page' => $fallback_count,
      'orderby'        => 'date',
      'order'          => 'DESC',
      'post_status'    => 'publish',
      'no_found_rows'  => true,
    ], $extra_args);

    $items = get_posts($args);
  }

  // Normalize: relation can return mixed ID/object — coerce to WP_Post[]
  if (!empty($items)) {
    $items = array_map(function ($item) {
      if ($item instanceof WP_Post) return $item;
      if (is_numeric($item))        return get_post((int) $item);
      return null;
    }, is_array($items) ? $items : [$items]);
    $items = array_values(array_filter($items));
  }

  return !empty($items) ? $items : null;
}

/**
 * Get the section content group for a flexible-content layout — returns the
 * inline group, or falls back to General Settings → sections_content[layout]
 * when "use_general_settings" is checked.
 *
 * Returns null when nothing is configured (caller should skip render).
 */
function nt_get_section_group(array $data, string $layout_name): ?array {
  $use_general = !empty($data['use_general_settings']);

  if ($use_general) {
    $sections = get_field('sections_content', 'options');
    $group    = $sections[$layout_name] ?? null;
  } else {
    $group = $data['group'] ?? null;
    // Fallback: ACF sometimes nests by layout name when fields are auto-generated
    if (is_array($group) && isset($group[$layout_name])) {
      $group = $group[$layout_name];
    }
  }

  return is_array($group) && !empty($group) ? $group : null;
}

/**
 * Format a section ID — uses the override if provided, otherwise generates
 * a slug-based ID with the row index.
 */
function nt_section_id(array $data, string $slug, int $index): string {
  if (!empty($data['section_id'])) return sanitize_html_class($data['section_id']);
  return $slug . '-' . $index;
}

/**
 * Output a stylesheet directory URL relative to the theme's assets/app/ folder.
 * Used inside section files for image references.
 */
function nt_assets_url(string $path = ''): string {
  return get_template_directory_uri() . '/assets/app/' . ltrim($path, '/');
}

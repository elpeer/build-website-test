<?php
/**
 * Flexible content dispatcher.
 * Reads the ACF flexible_content field from the current context (page, single,
 * or term) and includes the matching section file from /content/sections/.
 *
 * Each section file receives:
 *   $args['i']    integer index (1-based) — useful for unique anchors / AOS scoping
 *   $args['item'] full ACF row including acf_fc_layout + all subfields
 */

if (!function_exists('get_field')) return;

$acf_content = get_field('flexible_content');

// Support taxonomy archives if needed
if (empty($acf_content) && is_tax()) {
  $term = get_queried_object();
  if ($term) $acf_content = get_field('flexible_content', $term);
}

if (empty($acf_content)) return;

$i = 1;
foreach ($acf_content as $item) {
  $layout = $item['acf_fc_layout'] ?? '';
  if (!$layout) continue;

  // Validate the section file exists before including
  $section_path = locate_template('content/sections/' . $layout . '.php');
  if (!$section_path) continue;

  get_template_part('content/sections/' . $layout, null, [
    'i'    => $i,
    'item' => $item,
  ]);
  $i++;
}

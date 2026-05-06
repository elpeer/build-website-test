<?php
/**
 * The main `flexible_content` field — drives every page and CPT single.
 *
 * Builds the layouts dynamically from `nt_section_registry()` so adding a new
 * section is a one-file change (define the fields callback in section-fields.php
 * and add a row to the registry).
 *
 * Location rules: attached to pages with the Flexible Content template,
 * AND to all CPT singles (destination/hotel/attraction/use-case/travel-type).
 */

$flex_layouts = [];

foreach (nt_section_registry() as $name => [$label, $fields_callback]) {
  if (!is_callable($fields_callback)) continue;
  $flex_layouts['layout_' . $name] = nt_make_layout(
    $name,
    $label,
    call_user_func($fields_callback)
  );
}

acf_add_local_field_group([
  'key'      => 'group_flexible_content',
  'title'    => 'תוכן העמוד',
  'fields'   => [
    [
      'key'           => 'field_flexible_content',
      'label'         => 'Flexible Content',
      'name'          => 'flexible_content',
      'type'          => 'flexible_content',
      'layouts'       => $flex_layouts,
      'button_label'  => 'הוסף סקשן',
      'min'           => 0,
      'max'           => 0,
      'instructions'  => 'גרור את הסקשנים לסידור מחודש. סמן Hide Section כדי להסתיר זמנית.',
    ],
  ],
  'location' => [
    // Pages using the Flexible Content template
    [[
      'param'    => 'page_template',
      'operator' => '==',
      'value'    => 'views/page-flexible-content.php',
    ]],
    // Plus the front page if no template assigned yet
    [[
      'param'    => 'page_type',
      'operator' => '==',
      'value'    => 'front_page',
    ]],
    // All CPT singles can also use flexible content for their body
    [[
      'param'    => 'post_type',
      'operator' => '==',
      'value'    => 'destination',
    ]],
    [[
      'param'    => 'post_type',
      'operator' => '==',
      'value'    => 'hotel',
    ]],
    [[
      'param'    => 'post_type',
      'operator' => '==',
      'value'    => 'attraction',
    ]],
    [[
      'param'    => 'post_type',
      'operator' => '==',
      'value'    => 'use-case',
    ]],
    [[
      'param'    => 'post_type',
      'operator' => '==',
      'value'    => 'travel-type',
    ]],
  ],
  'menu_order'    => 0,
  'position'      => 'normal',
  'style'         => 'default',
  'label_placement' => 'top',
]);

<?php
/**
 * General Settings → Sections Content.
 *
 * Mirrors every flexible-content layout as a group field on the options page,
 * so when a section's "Use General Settings?" toggle is on, it reads from here
 * instead of the inline page content.
 *
 * The same content fields used inline are also used here — a single source of
 * truth via `nt_section_registry()` in section-fields.php.
 */

$sections_content_groups = [];

foreach (nt_section_registry() as $name => [$label, $fields_callback]) {
  if (!is_callable($fields_callback)) continue;
  $sections_content_groups[] = nt_make_options_section($name, call_user_func($fields_callback));
}

acf_add_local_field_group([
  'key'      => 'group_options_sections_content',
  'title'    => 'תוכן ברירת מחדל לסקשנים',
  'fields'   => [
    [
      'key'        => 'field_sections_content',
      'label'      => 'Sections Content',
      'name'       => 'sections_content',
      'type'       => 'group',
      'layout'     => 'block',
      'instructions' => 'התוכן כאן ייטען בכל סקשן שמסומן בו "Use General Settings".',
      'sub_fields' => $sections_content_groups,
    ],
  ],
  'location' => [[[
    'param'    => 'options_page',
    'operator' => '==',
    'value'    => 'theme-general-settings',
  ]]],
  'menu_order' => 2,
]);

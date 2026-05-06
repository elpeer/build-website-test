<?php
/**
 * ACF field-builder helpers — eliminate repetition across layout definitions.
 *
 * Naming convention for keys (must be globally unique across all groups):
 *   field_<group>_<name>   for top-level fields
 *   sub_<layout>_<name>    for subfields inside a flexible-content layout
 *   layout_<name>          for layout itself
 *   group_<group>          for the field group key
 */

/**
 * Returns the four wrapper subfields that every flexible-content layout shares:
 *   use_general_settings, hide_section, section_id, group (named after layout).
 *
 * @param string $layout_name  Snake-case layout name (matches PHP file in content/sections/)
 * @param array $content_fields  The layout's actual content fields — they get wrapped in a group named $layout_name
 * @param string $group_label    Label shown above the content group (default "תוכן")
 * @return array  Subfields ready to drop into a flexible_content layout's `sub_fields`
 */
function nt_layout_subfields(string $layout_name, array $content_fields, string $group_label = 'תוכן'): array {
  $prefix = 'sub_' . $layout_name . '_';

  return [
    [
      'key'           => $prefix . 'use_general',
      'label'         => 'Use General Settings?',
      'name'          => 'use_general_settings',
      'type'          => 'true_false',
      'instructions'  => 'אם מסומן — התוכן ייקרא מההגדרות הכלליות (לא מהעמוד הזה).',
      'ui'            => 1,
      'default_value' => 0,
      'wrapper'       => ['width' => '33'],
    ],
    [
      'key'           => $prefix . 'hide',
      'label'         => 'Hide Section?',
      'name'          => 'hide_section',
      'type'          => 'true_false',
      'instructions'  => 'הסתר את הסקשן הזה מבלי למחוק אותו.',
      'ui'            => 1,
      'default_value' => 0,
      'wrapper'       => ['width' => '33'],
    ],
    [
      'key'          => $prefix . 'section_id',
      'label'        => 'Section ID',
      'name'         => 'section_id',
      'type'         => 'text',
      'instructions' => 'עוגן מותאם (אם ריק — נוצר אוטומטית).',
      'wrapper'      => ['width' => '34'],
    ],
    [
      'key'        => $prefix . 'group',
      'label'      => $group_label,
      'name'       => 'group',
      'type'       => 'group',
      'layout'     => 'block',
      'sub_fields' => [
        [
          'key'        => $prefix . 'group_inner',
          'label'      => '',
          'name'       => $layout_name,
          'type'       => 'group',
          'layout'     => 'block',
          'sub_fields' => $content_fields,
        ],
      ],
      // Hide this group when "use general" is on — clearer UX
      'conditional_logic' => [[[
        'field'    => $prefix . 'use_general',
        'operator' => '!=',
        'value'    => '1',
      ]]],
    ],
  ];
}

/**
 * Builds a flexible-content layout definition.
 *
 * @param string $name    Snake-case layout name (matches sections/<name>.php)
 * @param string $label   Human-readable label shown in the "+ Add Row" chooser
 * @param array $content_fields  Layout-specific content fields
 * @param string $content_label  Label for the inner content group
 * @return array
 */
function nt_make_layout(string $name, string $label, array $content_fields, string $content_label = 'תוכן'): array {
  return [
    'key'        => 'layout_' . $name,
    'name'       => $name,
    'label'      => $label,
    'display'    => 'block',
    'sub_fields' => nt_layout_subfields($name, $content_fields, $content_label),
    'min'        => '',
    'max'        => '',
  ];
}

/**
 * Builds the same content-field array as `nt_make_layout` content_fields, but
 * wrapped in a group ready to live inside the General Settings → sections_content
 * group. Used to mirror every layout on the options page.
 *
 * @param string $name    Layout name (must match)
 * @param array $content_fields  Same fields as in the inline layout
 * @return array  A single group field
 */
function nt_make_options_section(string $name, array $content_fields): array {
  return [
    'key'        => 'opt_section_' . $name,
    'label'      => $name,                        // editor sees the layout name as the panel title
    'name'       => $name,
    'type'       => 'group',
    'layout'     => 'block',
    'sub_fields' => $content_fields,
  ];
}

/**
 * Common field definitions reused across layouts and CPT groups.
 * These return ready-to-drop arrays — pass a unique key prefix.
 */

function nt_field_title(string $key_prefix, string $label = 'כותרת', string $instructions = 'ניתן להשתמש ב-|מילה| כדי להדגיש מילה (תקבל צבע אדום).'): array {
  return [
    'key'          => $key_prefix . '_title',
    'label'        => $label,
    'name'         => 'title',
    'type'         => 'text',
    'instructions' => $instructions,
  ];
}

function nt_field_lead(string $key_prefix, string $label = 'תת-כותרת'): array {
  return [
    'key'   => $key_prefix . '_lead',
    'label' => $label,
    'name'  => 'lead',
    'type'  => 'textarea',
    'rows'  => 3,
  ];
}

function nt_field_image(string $key_prefix, string $label = 'תמונה', string $name = 'image'): array {
  return [
    'key'           => $key_prefix . '_' . $name,
    'label'         => $label,
    'name'          => $name,
    'type'          => 'image',
    'return_format' => 'id',
    'preview_size'  => 'medium',
  ];
}

function nt_field_link(string $key_prefix, string $label = 'כפתור', string $name = 'cta'): array {
  return [
    'key'   => $key_prefix . '_' . $name,
    'label' => $label,
    'name'  => $name,
    'type'  => 'link',
    'return_format' => 'array',
  ];
}

function nt_field_relation(string $key_prefix, string $post_type, string $label, string $name = 'items', int $max = 0): array {
  return [
    'key'           => $key_prefix . '_' . $name,
    'label'         => $label,
    'name'          => $name,
    'type'          => 'relationship',
    'post_type'     => [$post_type],
    'filters'       => ['search'],
    'return_format' => 'object',
    'min'           => 0,
    'max'           => $max ?: '',
    'instructions'  => 'אם ריק — ייטענו אוטומטית עד 10 הפריטים האחרונים. אם אין פריטים בכלל — הסקשן לא יוצג.',
  ];
}

function nt_field_show_all_toggle(string $key_prefix, string $label = 'הצג את כל הפריטים אוטומטית'): array {
  return [
    'key'           => $key_prefix . '_show_all',
    'label'         => $label,
    'name'          => 'show_all',
    'type'          => 'true_false',
    'ui'            => 1,
    'default_value' => 0,
    'instructions'  => 'אם מסומן — מציג את כל הפריטים מהפוסט-טייפ ומתעלם מבחירה ידנית.',
  ];
}

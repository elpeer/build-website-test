<?php
/**
 * Per-use-case fields: trip duration, capacity, modal content, quote.
 * Use cases are typically shown as cards that open a modal — the modal_content
 * field holds the longer description.
 */

acf_add_local_field_group([
  'key'    => 'group_use_case_meta',
  'title'  => 'פרטי הטיול',
  'fields' => [
    [
      'key'           => 'fld_uc_duration',
      'label'         => 'משך הטיול',
      'name'          => 'trip_duration',
      'type'          => 'text',
      'instructions'  => 'לדוגמה: "10 ימים"',
      'wrapper'       => ['width' => '50'],
    ],
    [
      'key'           => 'fld_uc_capacity',
      'label'         => 'מספר נפשות',
      'name'          => 'trip_capacity',
      'type'          => 'text',
      'instructions'  => 'לדוגמה: "זוג + 2 ילדים"',
      'wrapper'       => ['width' => '50'],
    ],
    [
      'key'           => 'fld_uc_modal_content',
      'label'         => 'תוכן הפופ-אפ',
      'name'          => 'modal_content',
      'type'          => 'wysiwyg',
      'tabs'          => 'visual',
      'toolbar'       => 'basic',
      'media_upload'  => 0,
      'instructions'  => 'תוצג בפופ-אפ "קרא עוד".',
    ],
    [
      'key'           => 'fld_uc_destination_rel',
      'label'         => 'יעד עיקרי',
      'name'          => 'destination',
      'type'          => 'post_object',
      'post_type'     => ['destination'],
      'return_format' => 'object',
      'allow_null'    => 1,
    ],
    [
      'key'   => 'fld_uc_tags',
      'label' => 'תגיות (לטשטוש החזותי)',
      'name'  => 'tags',
      'type'  => 'repeater',
      'layout' => 'table',
      'sub_fields' => [
        ['key' => 'fld_uc_tag_item', 'label' => 'תגית', 'name' => 'item', 'type' => 'text'],
      ],
    ],
    [
      'key'        => 'fld_uc_quote',
      'label'      => 'ציטוט מהלקוח',
      'name'       => 'quote',
      'type'       => 'group',
      'sub_fields' => [
        ['key' => 'fld_uc_quote_text',   'label' => 'טקסט הציטוט', 'name' => 'text',   'type' => 'textarea', 'rows' => 3],
        ['key' => 'fld_uc_quote_author', 'label' => 'שם הלקוח',     'name' => 'author', 'type' => 'text'],
      ],
    ],
  ],
  'location' => [[[
    'param'    => 'post_type',
    'operator' => '==',
    'value'    => 'use-case',
  ]]],
  'position'   => 'normal',
  'menu_order' => 1,
]);

<?php
/**
 * Per-attraction fields: gallery, info chips (hours/price/duration),
 * location map, related attractions selection.
 */

acf_add_local_field_group([
  'key'    => 'group_attraction_meta',
  'title'  => 'פרטי האטרקציה',
  'fields' => [
    [
      'key'           => 'fld_attr_gallery',
      'label'         => 'גלריית תמונות',
      'name'          => 'gallery',
      'type'          => 'gallery',
      'return_format' => 'id',
      'preview_size'  => 'thumbnail',
      'instructions'  => 'התמונה הראשונה תוצג כמובילה. תמונה ראשית של הפוסט משמשת כברירת מחדל אם הגלריה ריקה.',
    ],
    [
      'key'   => 'fld_attr_location_text',
      'label' => 'כתובת מלאה',
      'name'  => 'location_text',
      'type'  => 'text',
    ],
    [
      'key'   => 'fld_attr_location_query',
      'label' => 'חיפוש Google Maps',
      'name'  => 'location_query',
      'type'  => 'text',
      'instructions' => 'מה שיוכנס ל-q בכתובת ה-iframe (לדוגמה: Fushimi Inari Taisha Kyoto).',
    ],
    [
      'key'        => 'fld_attr_chips',
      'label'      => 'פרטים מהירים (chips)',
      'name'       => 'info_chips',
      'type'       => 'repeater',
      'layout'     => 'block',
      'min'        => 0,
      'max'        => 6,
      'sub_fields' => [
        ['key' => 'fld_attr_chip_icon',  'label' => 'אייקון', 'name' => 'icon',  'type' => 'image', 'return_format' => 'id', 'preview_size' => 'thumbnail'],
        ['key' => 'fld_attr_chip_label', 'label' => 'תווית',  'name' => 'label', 'type' => 'text'],
        ['key' => 'fld_attr_chip_value', 'label' => 'ערך',    'name' => 'value', 'type' => 'text'],
      ],
    ],
    [
      'key'   => 'fld_attr_tips',
      'label' => 'טיפים לביקור',
      'name'  => 'tips',
      'type'  => 'repeater',
      'layout' => 'block',
      'sub_fields' => [
        ['key' => 'fld_attr_tip_title', 'label' => 'כותרת', 'name' => 'title', 'type' => 'text'],
        ['key' => 'fld_attr_tip_text',  'label' => 'תיאור', 'name' => 'text',  'type' => 'textarea', 'rows' => 2],
      ],
    ],
    [
      'key'           => 'fld_attr_related',
      'label'         => 'אטרקציות קשורות (לסליידר)',
      'name'          => 'related',
      'type'          => 'relationship',
      'post_type'     => ['attraction'],
      'filters'       => ['search', 'taxonomy'],
      'return_format' => 'object',
      'instructions'  => 'אם ריק — ייטענו 10 אטרקציות אחרות אוטומטית.',
    ],
  ],
  'location' => [[[
    'param'    => 'post_type',
    'operator' => '==',
    'value'    => 'attraction',
  ]]],
  'position'   => 'normal',
  'menu_order' => 1,
]);

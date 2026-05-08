<?php
/**
 * Per-destination fields: short tagline (used on cards),
 * full description, recommended hotels/attractions.
 */

acf_add_local_field_group([
  'key'    => 'group_destination_meta',
  'title'  => 'פרטי היעד',
  'fields' => [
    [
      'key'           => 'fld_dest_tagline',
      'label'         => 'תת-כותרת לכרטיסיה',
      'name'          => 'tagline',
      'type'          => 'text',
      'instructions'  => 'מוצגת על כרטיסיית היעד בקטלוג ובסליידרים. אם ריק — נטען excerpt.',
    ],
    [
      'key'           => 'fld_dest_hero_image',
      'label'         => 'תמונת Hero (גדולה)',
      'name'          => 'hero_image',
      'type'          => 'image',
      'return_format' => 'id',
      'instructions'  => 'אופציונלי. אם ריק — תמונה ראשית של הפוסט תשמש.',
    ],
    [
      'key'           => 'fld_dest_top_attractions',
      'label'         => 'אטרקציות מומלצות ביעד',
      'name'          => 'top_attractions',
      'type'          => 'relationship',
      'post_type'     => ['attraction'],
      'return_format' => 'object',
      'instructions'  => 'אם ריק — נטענות 10 האטרקציות האחרונות.',
    ],
    [
      'key'           => 'fld_dest_top_hotels',
      'label'         => 'מלונות מומלצים ביעד',
      'name'          => 'top_hotels',
      'type'          => 'relationship',
      'post_type'     => ['hotel'],
      'return_format' => 'object',
    ],
  ],
  'location' => [[[
    'param'    => 'post_type',
    'operator' => '==',
    'value'    => 'destination',
  ]]],
  'position'   => 'normal',
  'menu_order' => 1,
]);

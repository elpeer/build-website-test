<?php
/**
 * Per-travel-type fields: short tagline (for the homepage card),
 * extended description fields are handled via flexible_content on the post itself.
 */

acf_add_local_field_group([
  'key'    => 'group_travel_type_meta',
  'title'  => 'פרטי סוג הטיול',
  'fields' => [
    [
      'key'           => 'fld_tt_tagline',
      'label'         => 'תת-כותרת לכרטיסיה',
      'name'          => 'tagline',
      'type'          => 'text',
      'instructions'  => 'מוצגת על הכרטיסיה בסליידר בעמוד הבית.',
    ],
  ],
  'location' => [[[
    'param'    => 'post_type',
    'operator' => '==',
    'value'    => 'travel-type',
  ]]],
  'position'   => 'normal',
  'menu_order' => 1,
]);

<?php
/**
 * Per-client-review fields: review text, customer name + photo.
 */

acf_add_local_field_group([
  'key'    => 'group_client_review',
  'title'  => 'תוכן ההמלצה',
  'fields' => [
    [
      'key'   => 'fld_review_text',
      'label' => 'טקסט ההמלצה',
      'name'  => 'text',
      'type'  => 'textarea',
      'rows'  => 4,
      'required' => 1,
    ],
    [
      'key'           => 'fld_review_name',
      'label'         => 'שם הלקוח',
      'name'          => 'name',
      'type'          => 'text',
      'wrapper'       => ['width' => '50'],
      'required'      => 1,
    ],
    [
      'key'           => 'fld_review_photo',
      'label'         => 'תמונת לקוח',
      'name'          => 'photo',
      'type'          => 'image',
      'return_format' => 'id',
      'preview_size'  => 'thumbnail',
      'wrapper'       => ['width' => '50'],
    ],
    [
      'key'           => 'fld_review_rating',
      'label'         => 'דירוג כוכבים',
      'name'          => 'rating',
      'type'          => 'number',
      'min'           => 1,
      'max'           => 5,
      'default_value' => 5,
    ],
  ],
  'location' => [[[
    'param'    => 'post_type',
    'operator' => '==',
    'value'    => 'client-review',
  ]]],
  'position'   => 'normal',
  'menu_order' => 1,
]);

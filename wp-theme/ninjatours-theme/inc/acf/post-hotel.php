<?php
/**
 * Per-hotel fields: rating, gallery, room types, amenities, location, related hotels.
 */

acf_add_local_field_group([
  'key'    => 'group_hotel_meta',
  'title'  => 'פרטי המלון',
  'fields' => [
    [
      'key'           => 'fld_hotel_rating',
      'label'         => 'דירוג כוכבים',
      'name'          => 'rating',
      'type'          => 'select',
      'choices'       => [
        '3' => '★★★',
        '4' => '★★★★',
        '5' => '★★★★★',
      ],
      'allow_null'    => 1,
      'wrapper'       => ['width' => '50'],
    ],
    [
      'key'           => 'fld_hotel_destination',
      'label'         => 'יעד',
      'name'          => 'destination',
      'type'          => 'post_object',
      'post_type'     => ['destination'],
      'return_format' => 'object',
      'allow_null'    => 1,
      'wrapper'       => ['width' => '50'],
    ],
    [
      'key'           => 'fld_hotel_tagline',
      'label'         => 'תת-כותרת',
      'name'          => 'tagline',
      'type'          => 'text',
    ],
    [
      'key'           => 'fld_hotel_gallery',
      'label'         => 'גלריית תמונות',
      'name'          => 'gallery',
      'type'          => 'gallery',
      'return_format' => 'id',
      'preview_size'  => 'thumbnail',
    ],
    [
      'key'        => 'fld_hotel_amenities',
      'label'      => 'מתקנים פופולריים',
      'name'       => 'amenities',
      'type'       => 'repeater',
      'layout'     => 'table',
      'sub_fields' => [
        ['key' => 'fld_hotel_amen_icon', 'label' => 'אייקון', 'name' => 'icon', 'type' => 'image', 'return_format' => 'id', 'preview_size' => 'thumbnail'],
        ['key' => 'fld_hotel_amen_name', 'label' => 'שם',     'name' => 'name', 'type' => 'text'],
      ],
    ],
    [
      'key'        => 'fld_hotel_rooms',
      'label'      => 'חדרים',
      'name'       => 'rooms',
      'type'       => 'repeater',
      'layout'     => 'block',
      'sub_fields' => [
        ['key' => 'fld_hotel_room_image', 'label' => 'תמונה',  'name' => 'image', 'type' => 'image', 'return_format' => 'id', 'preview_size' => 'thumbnail'],
        ['key' => 'fld_hotel_room_name',  'label' => 'שם החדר', 'name' => 'name',  'type' => 'text'],
        ['key' => 'fld_hotel_room_size',  'label' => 'גודל',    'name' => 'size',  'type' => 'text'],
        ['key' => 'fld_hotel_room_pax',   'label' => 'תפוסה',   'name' => 'pax',   'type' => 'text'],
        ['key' => 'fld_hotel_room_price', 'label' => 'מחיר ללילה', 'name' => 'price', 'type' => 'text'],
      ],
    ],
    [
      'key'   => 'fld_hotel_location_text',
      'label' => 'כתובת',
      'name'  => 'location_text',
      'type'  => 'text',
    ],
    [
      'key'   => 'fld_hotel_location_query',
      'label' => 'חיפוש Google Maps',
      'name'  => 'location_query',
      'type'  => 'text',
    ],
    [
      'key'           => 'fld_hotel_related',
      'label'         => 'מלונות קשורים',
      'name'          => 'related',
      'type'          => 'relationship',
      'post_type'     => ['hotel'],
      'return_format' => 'object',
      'instructions'  => 'אם ריק — נטענים 10 מלונות אחרים.',
    ],
  ],
  'location' => [[[
    'param'    => 'post_type',
    'operator' => '==',
    'value'    => 'hotel',
  ]]],
  'position'   => 'normal',
  'menu_order' => 1,
]);

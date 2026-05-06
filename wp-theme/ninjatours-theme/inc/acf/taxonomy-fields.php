<?php
/**
 * Taxonomy term fields — let editors attach an icon to every category.
 * Used in the attractions section's filter tabs.
 */

acf_add_local_field_group([
  'key'    => 'group_tax_icon',
  'title'  => 'אייקון לטאב',
  'fields' => [
    [
      'key'           => 'fld_tax_icon',
      'label'         => 'אייקון',
      'name'          => 'icon',
      'type'          => 'image',
      'return_format' => 'id',
      'preview_size'  => 'thumbnail',
      'instructions'  => 'מוצג ב-tab הפילטר בקטלוג. SVG מומלץ.',
    ],
  ],
  'location' => [
    [['param' => 'taxonomy', 'operator' => '==', 'value' => 'attraction-category']],
    [['param' => 'taxonomy', 'operator' => '==', 'value' => 'hotel-city']],
    [['param' => 'taxonomy', 'operator' => '==', 'value' => 'hotel-audience']],
    [['param' => 'taxonomy', 'operator' => '==', 'value' => 'trip-audience']],
    [['param' => 'taxonomy', 'operator' => '==', 'value' => 'trip-tag']],
    [['param' => 'taxonomy', 'operator' => '==', 'value' => 'trip-length']],
    [['param' => 'taxonomy', 'operator' => '==', 'value' => 'travel-region']],
  ],
]);

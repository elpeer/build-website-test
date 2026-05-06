<?php
/**
 * General Settings (ACF Options Page).
 *
 * Site-wide singletons that aren't editable via WP Menus or per-page:
 *   - Logo (light + dark variants for header)
 *   - Footer logo
 *   - Email + social URLs
 *   - Header CTA fallback (when not overridden)
 *   - Footer copyright text
 *   - 404 page content
 *
 * Most editable navigation lives in WP Menus admin (Appearance → Menus).
 */

acf_add_local_field_group([
  'key'      => 'group_options_general',
  'title'    => 'הגדרות כלליות',
  'fields'   => [

    [
      'key'   => 'field_general',
      'label' => 'כללי',
      'name'  => 'general',
      'type'  => 'group',
      'layout' => 'block',
      'sub_fields' => [

        [
          'key'           => 'field_general_logo',
          'label'         => 'לוגו ראשי (בהיר)',
          'name'          => 'logo',
          'type'          => 'image',
          'return_format' => 'id',
          'instructions'  => 'משמש כברירת מחדל ב-header על רקע כהה. SVG מומלץ.',
          'wrapper'       => ['width' => '50'],
        ],
        [
          'key'           => 'field_general_logo_dark',
          'label'         => 'לוגו כהה (לרקע בהיר)',
          'name'          => 'logo_dark',
          'type'          => 'image',
          'return_format' => 'id',
          'instructions'  => 'מוצג ב-header על דפים פנימיים עם רקע בהיר.',
          'wrapper'       => ['width' => '50'],
        ],
        [
          'key'           => 'field_general_logo_footer',
          'label'         => 'לוגו פוטר',
          'name'          => 'logo_footer',
          'type'          => 'image',
          'return_format' => 'id',
          'wrapper'       => ['width' => '50'],
        ],
        [
          'key'           => 'field_general_email',
          'label'         => 'אימייל ליצירת קשר',
          'name'          => 'email',
          'type'          => 'email',
          'wrapper'       => ['width' => '50'],
        ],
        [
          'key'     => 'field_general_phone',
          'label'   => 'טלפון',
          'name'    => 'phone',
          'type'    => 'text',
          'wrapper' => ['width' => '50'],
        ],
        [
          'key'     => 'field_general_facebook',
          'label'   => 'פייסבוק',
          'name'    => 'facebook',
          'type'    => 'url',
          'wrapper' => ['width' => '50'],
        ],
        [
          'key'     => 'field_general_instagram',
          'label'   => 'אינסטגרם',
          'name'    => 'instagram',
          'type'    => 'url',
          'wrapper' => ['width' => '50'],
        ],
        [
          'key'     => 'field_general_youtube',
          'label'   => 'יוטיוב',
          'name'    => 'youtube',
          'type'    => 'url',
          'wrapper' => ['width' => '50'],
        ],
        [
          'key'     => 'field_general_tiktok',
          'label'   => 'טיקטוק',
          'name'    => 'tiktok',
          'type'    => 'url',
          'wrapper' => ['width' => '50'],
        ],

        // Header CTA — used in the header on every page
        [
          'key'           => 'field_general_header_cta',
          'label'         => 'כפתור CTA ב-header',
          'name'          => 'header_cta',
          'type'          => 'link',
          'return_format' => 'array',
          'instructions'  => 'הכפתור הצף בצד ה-header. אם ריק — לא יוצג.',
        ],

        // Footer copyright
        [
          'key'           => 'field_general_footer_copy',
          'label'         => 'טקסט זכויות יוצרים',
          'name'          => 'footer_copy',
          'type'          => 'text',
          'default_value' => 'כל הזכויות שמורות',
        ],
        [
          'key'           => 'field_general_footer_credit',
          'label'         => 'קרדיט עיצוב',
          'name'          => 'footer_credit',
          'type'          => 'text',
          'default_value' => 'Design & Code by Elevate',
        ],
      ],
    ],
  ],
  'location' => [[[
    'param'    => 'options_page',
    'operator' => '==',
    'value'    => 'theme-general-settings',
  ]]],
  'menu_order' => 1,
]);

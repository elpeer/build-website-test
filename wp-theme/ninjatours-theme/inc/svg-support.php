<?php
/**
 * Allow SVG uploads — administrators only.
 * SVG can carry XSS payloads, so we gate the capability.
 */

add_filter('upload_mimes', function ($mimes) {
  $mimes['svg'] = 'image/svg+xml';
  return $mimes;
});

add_filter('wp_check_filetype_and_ext', function ($data, $file, $filename, $mimes, $real_mime = '') {
  $is_svg = in_array($real_mime, ['image/svg', 'image/svg+xml'], true)
         || ('.svg' === strtolower(substr($filename, -4)));

  if (!$is_svg) return $data;

  if (current_user_can('manage_options')) {
    $data['ext']  = 'svg';
    $data['type'] = 'image/svg+xml';
  } else {
    $data['ext'] = $data['type'] = false;
  }
  return $data;
}, 10, 5);

<?php
$acf_content = get_field('flexible_content');

if (is_tax()) {
  $tax = get_queried_object();
  $acf_content = get_field('flexible_content', $tax);
}

if (empty($acf_content)) return false;

$i_section = 1;
foreach ($acf_content as $item) {
  get_template_part('content/sections/' . $item['acf_fc_layout'], '', ['i' => $i_section, 'item' => $item]);
  $i_section++;
}

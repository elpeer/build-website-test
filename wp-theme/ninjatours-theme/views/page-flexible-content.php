<?php
/**
 * Template Name: Flexible Content
 * Template Post Type: page
 *
 * The single page template every public-facing page uses. The body is composed
 * via the ACF flexible_content field — the dispatcher renders each row.
 */

get_header(); ?>

<main id="main-content">
  <?php get_template_part('content/flexible-content'); ?>
</main>

<?php get_footer(); ?>

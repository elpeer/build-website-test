<?php
add_action('wp_head', 'my_theme_google_fonts_preconnect', 5);
function my_theme_google_fonts_preconnect()
{
	echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
	echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
}

add_action('wp_enqueue_scripts', 'my_theme_enqueue_google_fonts');
function my_theme_enqueue_google_fonts()
{
	wp_enqueue_style(
		'my-theme-google-fonts',
		'https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;600;700;800&display=swap',
		array(),
		null
	);
}
function theme_styles()
{
	wp_enqueue_style('swiper-css', 'https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.css', array(), '8.0.0');
	wp_enqueue_style('aos-css', 'https://unpkg.com/aos@2.3.4/dist/aos.css', array(), '2.3.4');
	wp_enqueue_style('fancybox-css', 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.css', array(), '5.0.0');
	//compiled styles
	wp_enqueue_style('style', get_template_directory_uri() . '/assets/app/css/main.css', array());
	//additional styles
	wp_enqueue_style('add-style', get_template_directory_uri() . '/style.css', array());
}
add_action('wp_enqueue_scripts', 'theme_styles');

function register_scripts()
{
	//libs
	wp_enqueue_script('swiper-js', 'https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.js', array(), '8.0.0', true);
	wp_enqueue_script('aos-js', 'https://unpkg.com/aos@2.3.4/dist/aos.js', array(), '2.3.4', true);
	wp_enqueue_script('fancybox-js', 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.umd.js', array(), '5.0.0', true);
	wp_enqueue_script('marquee', 'https://cdnjs.cloudflare.com/ajax/libs/jQuery.Marquee/1.6.1/jquery.marquee.min.js', array('jquery'), '1.6.1', true);
	//custom scripts
	wp_enqueue_script('main', get_template_directory_uri() . '/assets/app/js/main.js', array('jquery', 'swiper-js', 'aos-js', 'fancybox-js', 'marquee'), true);
	wp_enqueue_script('ajax', get_template_directory_uri() . '/assets/app/js/ajax.js', array('jquery'), true);
}
add_action('wp_footer', 'register_scripts');

function custom_admin_styles()
{
	// ACF
	wp_register_style('acf', get_template_directory_uri() . '/assets/app/css/acf.css', array(), null, 'all');
	wp_enqueue_style('acf');
}
add_action('admin_enqueue_scripts', 'custom_admin_styles');

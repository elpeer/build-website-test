<?php
$dir = get_template_directory_uri() . '/assets/app/';
$general = get_field('general', 'option');
$logo = $general['logo'];
$email = $general['email'];
$instagram = $general['instagram'];
$facebook = $general['facebook'];
?>

<footer class="footer" id="footer">
  <div class="footer__inner">
    <div class="footer__col footer__col--logo">
      <a href="<?php echo esc_url(home_url('/')); ?>" class="footer__logo" aria-label="Ninja Tours">
        <?php echo wp_get_attachment_image($logo, 'full', false, ['loading' => 'lazy']); ?>
      </a>
    </div>

    <div class="footer__menus">
      <?php
      // Header Menu 1
      if (has_nav_menu('footer_menu')) {
        wp_nav_menu([
          'theme_location' => 'footer_menu',
          'container'      => false,
          'items_wrap'     => '<ul>%3$s</ul>',
          'fallback_cb'    => false,
        ]);
      }
      ?>
    </div>

    <div class="footer__col footer__col--contact">
      <h4 class="footer__heading">יצירת קשר</h4>
      <?php if (!empty($email)): ?>
        <a class="footer__email" href="mailto:<?php echo $email; ?>"><?php echo $email; ?></a>
      <?php endif; ?>
      <ul class="footer__socials" aria-label="רשתות חברתיות">
        <?php if (!empty($facebook)): ?>
          <li>
            <a class="footer__social" href="<?php echo esc_url($facebook); ?>" aria-label="פייסבוק" target="_blank">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path
                  d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.2-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8.2v3h2.5V21h2.8z" />
              </svg>
            </a>
          </li>
        <?php endif; ?>
        <?php if (!empty($instagram)): ?>
          <li>
            <a class="footer__social" href="<?php echo esc_url($instagram); ?>" aria-label="אינסטגרם" target="_blank">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
                stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
              </svg>
            </a>
          </li>
        <?php endif; ?>
      </ul>
    </div>
  </div>

  <div class="footer__bar">
    <p class="footer__copy">Copyright &copy;Ninja Tours. All right reserved</p>
    <p class="footer__credit">Design &amp; Code by Elevate</p>
  </div>
</footer>

<?php wp_footer(); ?>
</body>

</html>
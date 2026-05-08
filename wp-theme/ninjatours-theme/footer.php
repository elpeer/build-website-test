<?php
$general       = function_exists('get_field') ? get_field('general', 'options') : [];
$logo          = $general['logo_footer'] ?? $general['logo'] ?? null;
$email         = $general['email']       ?? '';
$phone         = $general['phone']       ?? '';
$facebook      = $general['facebook']    ?? '';
$instagram     = $general['instagram']   ?? '';
$youtube       = $general['youtube']     ?? '';
$tiktok        = $general['tiktok']      ?? '';
$footer_copy   = $general['footer_copy']   ?? sprintf('%s © %s', get_bloginfo('name'), date('Y'));
$footer_credit = $general['footer_credit'] ?? 'Design & Code by Elevate';
?>

<footer class="footer" id="footer">
  <div class="footer__inner">

    <div class="footer__col footer__col--logo">
      <a href="<?php echo esc_url(home_url('/')); ?>" class="footer__logo" aria-label="<?php bloginfo('name'); ?>">
        <?php if ($logo): echo wp_get_attachment_image($logo, 'full', false, ['loading' => 'lazy']); endif; ?>
      </a>
    </div>

    <div class="footer__menus">
      <?php
      if (has_nav_menu('footer_menu')) {
        wp_nav_menu([
          'theme_location' => 'footer_menu',
          'container'      => false,
          'items_wrap'     => '<ul>%3$s</ul>',
          'depth'          => 2,
          'fallback_cb'    => false,
        ]);
      }
      ?>
    </div>

    <div class="footer__col footer__col--contact">
      <h4 class="footer__heading"><?php esc_html_e('יצירת קשר', 'ninjatours'); ?></h4>

      <?php if ($email): ?>
        <a class="footer__email" href="mailto:<?php echo esc_attr($email); ?>"><?php echo esc_html($email); ?></a>
      <?php endif; ?>

      <?php if ($phone): ?>
        <a class="footer__phone" href="tel:<?php echo esc_attr(preg_replace('/\D/', '', $phone)); ?>"><?php echo esc_html($phone); ?></a>
      <?php endif; ?>

      <?php if ($facebook || $instagram || $youtube || $tiktok): ?>
        <ul class="footer__socials" aria-label="<?php esc_attr_e('רשתות חברתיות', 'ninjatours'); ?>">
          <?php if ($facebook): ?>
            <li>
              <a class="footer__social" href="<?php echo esc_url($facebook); ?>" aria-label="Facebook" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.2-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8.2v3h2.5V21h2.8z"/>
                </svg>
              </a>
            </li>
          <?php endif; ?>
          <?php if ($instagram): ?>
            <li>
              <a class="footer__social" href="<?php echo esc_url($instagram); ?>" aria-label="Instagram" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor"/>
                </svg>
              </a>
            </li>
          <?php endif; ?>
          <?php if ($youtube): ?>
            <li>
              <a class="footer__social" href="<?php echo esc_url($youtube); ?>" aria-label="YouTube" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8C22 15.2 22 12 22 12s0-3.2-.4-4.8zM10 15V9l5.2 3-5.2 3z"/>
                </svg>
              </a>
            </li>
          <?php endif; ?>
          <?php if ($tiktok): ?>
            <li>
              <a class="footer__social" href="<?php echo esc_url($tiktok); ?>" aria-label="TikTok" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16.6 2v3.4c1 .8 2.4 1.4 4 1.4v3.4c-1.5 0-2.9-.4-4-1.1v6.4a6 6 0 1 1-6-6c.4 0 .7 0 1 .1v3.5a2.5 2.5 0 1 0 1.5 2.4V2h3.5z"/>
                </svg>
              </a>
            </li>
          <?php endif; ?>
        </ul>
      <?php endif; ?>
    </div>
  </div>

  <div class="footer__bar">
    <p class="footer__copy"><?php echo esc_html($footer_copy); ?></p>
    <p class="footer__credit"><?php echo esc_html($footer_credit); ?></p>
  </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>

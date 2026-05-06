/**
 * AJAX wiring for filterable archives + homepage attractions section.
 * Reads endpoint + nonce from window.theme_data (set by inc/theme-settings.php).
 */
(function ($) {
  'use strict';

  if (typeof window.theme_data === 'undefined') return;
  const { ajax_url, nonce } = window.theme_data;

  // ─── Attractions: tab clicks → AJAX filter, swap grid contents ──────────
  $(document).on('click', '.attractions__tab', function () {
    const $tab  = $(this);
    const $tabs = $tab.closest('.attractions__tabs').find('.attractions__tab');
    const $grid = $tab.closest('.attractions').find('[data-attractions-grid]');
    const tabId = $tab.attr('data-tab');

    $tabs.removeClass('--active').attr('aria-selected', 'false');
    $tab.addClass('--active').attr('aria-selected', 'true');

    $grid.css('opacity', 0.4);
    $.post(ajax_url, {
      action:      'nt_filter_attractions',
      nonce,
      category_id: tabId,
    }).done(function (html) {
      $grid.html(html || '<p class="empty-state">לא נמצאו אטרקציות בקטגוריה זו.</p>').css('opacity', 1);
    }).fail(function () { $grid.css('opacity', 1); });
  });

  // ─── Hotels filter dropdowns ────────────────────────────────────────────
  $(document).on('change', '[data-hotels-filters] input[type=checkbox]', function () {
    runHotelsFilter();
  });

  function runHotelsFilter () {
    const $grid = $('[data-hotels-grid]');
    if (!$grid.length) return;

    const data = { action: 'nt_filter_hotels', nonce };
    $('[data-hotels-filters] [data-filter-tax]').each(function () {
      const tax = $(this).attr('data-filter-tax').replace(/-/g, '_');
      const ids = $(this).find('input:checked').map(function () { return $(this).val(); }).get();
      if (ids.length) data[tax] = ids;
    });

    $grid.css('opacity', 0.4);
    $.post(ajax_url, data).done(function (html) {
      $grid.html(html || '<p class="empty-state">לא נמצאו מלונות התואמים לסינון.</p>').css('opacity', 1);
    }).fail(function () { $grid.css('opacity', 1); });
  }

  // ─── Use cases filter dropdowns ─────────────────────────────────────────
  $(document).on('change', '[data-use-case-filters] input[type=checkbox]', function () {
    runUseCasesFilter();
  });

  function runUseCasesFilter () {
    const $grid = $('[data-use-cases-grid]');
    if (!$grid.length) return;

    const data = { action: 'nt_filter_use_cases', nonce };
    $('[data-use-case-filters] [data-filter-tax]').each(function () {
      const tax = $(this).attr('data-filter-tax').replace(/-/g, '_');
      const ids = $(this).find('input:checked').map(function () { return $(this).val(); }).get();
      if (ids.length) data[tax] = ids;
    });

    $grid.css('opacity', 0.4);
    $.post(ajax_url, data).done(function (html) {
      $grid.html(html || '<p class="empty-state">לא נמצאו טיולים התואמים לסינון.</p>').css('opacity', 1);
    }).fail(function () { $grid.css('opacity', 1); });
  }

})(jQuery);

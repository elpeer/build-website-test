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

  // ─── Custom multi-select dropdowns (used in hotels/attractions/use-cases filters)
  function initCustomDropdowns () {
    document.querySelectorAll('.custom-dropdown').forEach(function (dd) {
      if (dd.dataset.initialized) return;
      dd.dataset.initialized = '1';

      const trigger = dd.querySelector('.custom-dropdown__trigger');
      const valueEl = dd.querySelector('.custom-dropdown__value');
      const checks  = dd.querySelectorAll('input[type="checkbox"]');
      if (!trigger || !valueEl) return;
      const placeholder = valueEl.textContent;

      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        const wasOpen = dd.classList.contains('--open');
        document.querySelectorAll('.custom-dropdown').forEach(function (d) {
          d.classList.remove('--open');
        });
        if (!wasOpen) dd.classList.add('--open');
        trigger.setAttribute('aria-expanded', String(!wasOpen));
      });

      checks.forEach(function (cb) {
        cb.addEventListener('change', function () {
          const selected = [];
          checks.forEach(function (c) {
            if (c.checked) selected.push(c.parentNode.querySelector('span').textContent);
          });
          if (selected.length === 0) {
            valueEl.textContent = placeholder;
            valueEl.classList.add('--placeholder');
          } else {
            valueEl.textContent = selected.join(', ');
            valueEl.classList.remove('--placeholder');
          }
          renderActiveFilters();
        });
      });
    });
  }

  function renderActiveFilters () {
    document.querySelectorAll('.hotels-filter__active').forEach(function (host) {
      host.innerHTML = '';
      const checks = host.closest('.hotels-filter').querySelectorAll('input[type="checkbox"]:checked');
      checks.forEach(function (cb) {
        const label = cb.parentNode.querySelector('span').textContent;
        const pill = document.createElement('span');
        pill.className = 'hotels-filter__active-pill';
        pill.innerHTML = label + ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        pill.addEventListener('click', function () {
          cb.checked = false;
          cb.dispatchEvent(new Event('change'));
        });
        host.appendChild(pill);
      });
    });
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.custom-dropdown')) {
      document.querySelectorAll('.custom-dropdown').forEach(function (d) {
        d.classList.remove('--open');
        const t = d.querySelector('.custom-dropdown__trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
    }
  });

  $(document).ready(initCustomDropdowns);

})(jQuery);

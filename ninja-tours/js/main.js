/* ==========================================================================
   Ninja Tours — main.js
   Conventions: Elevate Digital Studio (jQuery IIFE)
   ========================================================================== */

(function ($) {
  'use strict';
  if (typeof $ === 'undefined') return;

  $(document).ready(function () {

    // -----------------------------------------------------------------------
    // Preloader — hide on ready (or load, whichever fires)
    // -----------------------------------------------------------------------
    function hidePreloader() { $('.preloader').addClass('--hidden'); }
    if (document.readyState === 'complete') hidePreloader();
    else $(window).on('load', hidePreloader);
    setTimeout(hidePreloader, 1500); // safety net

    // -----------------------------------------------------------------------
    // Sticky header
    // -----------------------------------------------------------------------
    function fixedHeaderActions() {
      var $header = $('.header');
      $(window).on('scroll', function () {
        if ($(window).scrollTop() > 50) {
          $header.addClass('fixed');
        } else {
          $header.removeClass('fixed');
        }
      });
    }
    fixedHeaderActions();

    // -----------------------------------------------------------------------
    // Mobile menu
    // -----------------------------------------------------------------------
    $('.burger-btn').on('click', function () {
      var expanded = $(this).attr('aria-expanded') === 'true';
      $(this).attr('aria-expanded', !expanded);
      $('.main-menu').toggleClass('--open');
      $('body').toggleClass('--menu-open');
    });

    $('.main-menu a').on('click', function () {
      $('.burger-btn').attr('aria-expanded', 'false');
      $('.main-menu').removeClass('--open');
      $('body').removeClass('--menu-open');
    });

    // -----------------------------------------------------------------------
    // Accordion init helper
    // -----------------------------------------------------------------------
    window.accordionInit = function (itemSelector, headSelector) {
      $(document).on('click', headSelector, function () {
        var $item = $(this).closest(itemSelector);
        $item.toggleClass('--open');
        $item.find('.accordion-item__body').first().slideToggle(300);
      });
    };

    // -----------------------------------------------------------------------
    // Default sliders — auto-init via data attributes on .default-slider
    // -----------------------------------------------------------------------
    window.defaultSliders = function () {
      $('.default-slider').each(function (idx) {
        var $el = $(this);
        if ($el.data('initialized')) return;
        $el.data('initialized', true);

        var $wrap = $el.find('.swiper-wrapper').first();
        if (!$wrap.length) {
          // wrap children
          $el.children().wrapAll('<div class="swiper-wrapper"></div>');
        }
        $el.addClass('swiper');

        var prev = $el.find('.default-prev').get(0);
        var next = $el.find('.default-next').get(0);

        new Swiper($el.get(0), {
          slidesPerView: $el.data('initial') || 1,
          spaceBetween: $el.data('offset') || 16,
          loop: !!$el.data('loop'),
          speed: $el.data('speed') || 600,
          autoplay: $el.data('autoplay') ? { delay: $el.data('duration') || 4000, disableOnInteraction: false } : false,
          effect: $el.data('effect') || 'slide',
          navigation: { prevEl: prev, nextEl: next },
          a11y: { enabled: true }
        });
      });
    };
    if (typeof Swiper !== 'undefined') defaultSliders();

    // -----------------------------------------------------------------------
    // Trip Types slider — custom init (nav buttons live outside the swiper)
    // -----------------------------------------------------------------------
    window.tripTypesSlider = function () {
      var $slider = $('.trip-types__slider');
      if (!$slider.length || typeof Swiper === 'undefined') return;
      if (!$slider.find('.swiper-wrapper').length) {
        $slider.children().wrapAll('<div class="swiper-wrapper"></div>');
      }
      $slider.addClass('swiper');

      new Swiper($slider.get(0), {
        slidesPerView: 'auto',
        spaceBetween: 24,
        speed: 600,
        navigation: {
          prevEl: '.trip-types__nav-prev',
          nextEl: '.trip-types__nav-next'
        },
        a11y: { enabled: true }
      });
    };
    if (typeof Swiper !== 'undefined') tripTypesSlider();

    // -----------------------------------------------------------------------
    // Trip Types — custom "בואו נתחיל" follower cursor on cards 2..n
    // -----------------------------------------------------------------------
    (function initTripTypesCursor() {
      var $cards = $('.trip-types__card');
      if (!$cards.length) return;
      // Skip touch devices
      if (window.matchMedia('(hover: none)').matches) return;

      var $cursor = $('<div class="trip-types__cursor" aria-hidden="true">בואו נתחיל</div>')
        .appendTo('body');

      var $hoverable = $cards.not(':first');

      $hoverable.on('mouseenter', function () {
        $cursor.addClass('--visible');
      });
      $hoverable.on('mouseleave', function () {
        $cursor.removeClass('--visible');
      });

      // Hide when entering the first card or leaving the section
      $cards.first().on('mouseenter', function () {
        $cursor.removeClass('--visible');
      });

      $(document).on('mousemove', function (e) {
        $cursor.css({ left: e.clientX + 'px', top: e.clientY + 'px' });
      });
    })();

    // -----------------------------------------------------------------------
    // AOS init
    // -----------------------------------------------------------------------
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 700,
        once: true,
        offset: 80,
        easing: 'ease-out-cubic'
      });
    }

    // -----------------------------------------------------------------------
    // Footer year
    // -----------------------------------------------------------------------
    $('#year').text(new Date().getFullYear());

  });
})(jQuery);

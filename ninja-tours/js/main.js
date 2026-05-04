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
    $('.burger-btn').on('click', function (e) {
      e.preventDefault();

      const $btn = $(this);
      const isExpanded = $btn.attr('aria-expanded') === 'true';

      $btn.attr('aria-expanded', !isExpanded ? 'true' : 'false');

      $('.mobile-menu').toggleClass('--open');
      $('body').toggleClass('--menu-open');
    });

    // $('.main-menu a').on('click', function () {
    //   $('.burger-btn').attr('aria-expanded', 'false');
    //   $('.main-menu').removeClass('--open');
    //   $('body').removeClass('--menu-open');
    // });

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
    // Custom Trips slider (past customer trips)
    // -----------------------------------------------------------------------
    window.customTripsSlider = function () {
      var $slider = $('.custom-trips__slider');
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
          prevEl: '.custom-trips__nav-prev',
          nextEl: '.custom-trips__nav-next'
        },
        a11y: { enabled: true }
      });
    };
    if (typeof Swiper !== 'undefined') customTripsSlider();

    // -----------------------------------------------------------------------
    // Testimonials slider — autoplay that pauses on hover and stops on
    // arrow click (disableOnInteraction).
    // -----------------------------------------------------------------------
    window.testimonialsSlider = function () {
      var $slider = $('.testimonials__slider');
      if (!$slider.length || typeof Swiper === 'undefined') return;
      if (!$slider.find('.swiper-wrapper').length) {
        $slider.children().wrapAll('<div class="swiper-wrapper"></div>');
      }
      $slider.addClass('swiper');

      new Swiper($slider.get(0), {
        slidesPerView: 'auto',
        spaceBetween: 24,
        speed: 1000,
        loop: true,
        autoplay: {
          delay: 2000,
          disableOnInteraction: true,
        },
        navigation: {
          prevEl: '.testimonials__nav-prev',
          nextEl: '.testimonials__nav-next'
        },
        a11y: { enabled: true }
      });
    };
    if (typeof Swiper !== 'undefined') testimonialsSlider();

    // -----------------------------------------------------------------------
    // Hotels slider (destination pages) — edge-to-edge, spaceBetween: 0.
    // -----------------------------------------------------------------------
    window.hotelsSlider = function () {
      var $slider = $('.hotels__slider');
      if (!$slider.length || typeof Swiper === 'undefined') return;
      if (!$slider.find('.swiper-wrapper').length) {
        $slider.children().wrapAll('<div class="swiper-wrapper"></div>');
      }
      $slider.addClass('swiper');

      new Swiper($slider.get(0), {
        slidesPerView: 'auto',
        spaceBetween: 0,
        speed: 600,
        navigation: {
          prevEl: '.hotels__nav-prev',
          nextEl: '.hotels__nav-next'
        },
        a11y: { enabled: true }
      });
    };
    if (typeof Swiper !== 'undefined') hotelsSlider();

    // -----------------------------------------------------------------------
    // Generic accordion — register the global click handler so any
    // .accordion-item__head on the page toggles its sibling
    // .accordion-item__body via slideToggle. Used by FAQ on the
    // destination page and any other Q&A-style block in the future.
    // -----------------------------------------------------------------------
    if (typeof window.accordionInit === 'function') {
      window.accordionInit('.accordion-item', '.accordion-item__head');
    }

    // -----------------------------------------------------------------------
    // Destination photo grid — 'הצג עוד' toggle reveals the hidden rows
    // beyond the first 8. Same handler swaps the label and chevron state.
    // -----------------------------------------------------------------------
    $('.dest-photo-grid__more').on('click', function () {
      var $btn = $(this);
      var $grid = $btn.closest('.dest-photo-grid').find('.dest-photo-grid__grid');
      var expanded = !$grid.hasClass('--all');
      $grid.toggleClass('--all', expanded);
      $btn.toggleClass('--shown', expanded);
      $btn.attr('aria-expanded', String(expanded));
      $btn.find('.dest-photo-grid__more-text')
          .text(expanded ? 'הצג פחות' : 'הצג עוד');
    });

    // Fancybox is auto-bound to [data-fancybox] elements once loaded.
    // hideScrollbar: false prevents the body padding-right shim Fancybox
    // adds on open, which was causing a few pixels of horizontal scroll
    // on the page after the modal closed.
    if (typeof Fancybox !== 'undefined' && Fancybox.bind) {
      Fancybox.bind('[data-fancybox]', { hideScrollbar: false });
    }

    // -----------------------------------------------------------------------
    // Process timeline — red line fills as the user scrolls through it,
    // and each step fades in when it enters the viewport.
    // -----------------------------------------------------------------------
    (function initProcessTimeline() {
      var timeline = document.querySelector('.process__timeline');
      if (!timeline) return;
      var fill = timeline.querySelector('.process__line-fill');

      // Scroll-driven line fill
      if (fill) {
        var ticking = false;
        function update() {
          var rect = timeline.getBoundingClientRect();
          var winH = window.innerHeight;
          var start = winH * 0.85;
          var end = winH * 0.40;
          var scrolled = start - rect.top;
          var range = rect.height + (start - end);
          var progress = Math.max(0, Math.min(1, scrolled / range));
          fill.style.height = (progress * 100) + '%';
        }
        function onScroll() {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(function () { update(); ticking = false; });
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', update);
        update();
      }

      // Per-step fade-in via IntersectionObserver
      var steps = timeline.querySelectorAll('.process__step');
      if ('IntersectionObserver' in window && steps.length) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('--in-view');
              io.unobserve(entry.target);
            }
          });
        }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
        steps.forEach(function (s) { io.observe(s); });
      } else {
        // Fallback: just show
        steps.forEach(function (s) { s.classList.add('--in-view'); });
      }
    })();

    // -----------------------------------------------------------------------
    // Attractions tabs — toggle active state
    // -----------------------------------------------------------------------
    $('.attractions__tab').on('click', function () {
      var $btn = $(this);
      $('.attractions__tab').removeClass('--active').attr('aria-selected', 'false');
      $btn.addClass('--active').attr('aria-selected', 'true');
    });

    // -----------------------------------------------------------------------
    // קרא עוד / הצג פחות toggle — used by both the destinations intro and
    // the destination-info body. We resolve the body element by aria-controls
    // so the same handler works for any consumer that reuses the markup.
    // -----------------------------------------------------------------------
    $('.destinations-intro__toggle').on('click', function () {
      var $btn = $(this);
      var $body = $('#' + $btn.attr('aria-controls'));
      var expanded = !$body.hasClass('--expanded');
      $body.toggleClass('--expanded', expanded);
      $btn.attr('aria-expanded', String(expanded));
      $btn.find('.destinations-intro__toggle-text').text(expanded ? 'הצג פחות' : 'קרא עוד');
    });

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


    //logos marquee
    if ($('.partners__track').length > 0) {
      $('.partners__track').marquee({
        allowCss3Support: true,
        css3easing: 'linear',
        easing: 'linear',
        delayBeforeStart: 0,
        direction: 'left',
        duplicated: true,
        duration: 50000,
        gap: 0,
        pauseOnCycle: false,
        pauseOnHover: false,
        startVisible: true
      });
    }

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
SimplyCodes


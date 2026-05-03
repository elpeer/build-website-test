/* =========================================================
   Ninja Tours — main.js
   Studio convention: jQuery IIFE, data-driven Swiper
   sliders, accordion init, header & menu actions, AOS init.
   ========================================================= */

(function ($) {
  $(document).ready(function () {
    $('.preloader').fadeOut(800);

    if (typeof Fancybox !== 'undefined' && $('[data-fancybox]').length > 0) {
      Fancybox.bind('[data-fancybox]', {
        placeFocusBack: false,
        dragToClose: false
      });
    }

    fixedHeaderActions();
    menuActions();
    accordionInit('.accordion-item', '.accordion-item__head');
    attractionsFilter();
  });

  /* ---------- Attractions filter tabs ---------- */
  function attractionsFilter() {
    var $tabs  = $('.attractions__filter');
    var $cards = $('.attraction-card');
    if (!$tabs.length) return;

    $tabs.on('click', function () {
      var filter = $(this).data('filter');
      $tabs.removeClass('isActive').attr('aria-selected', 'false');
      $(this).addClass('isActive').attr('aria-selected', 'true');

      if (filter === 'all') {
        $cards.removeClass('is-hidden');
      } else {
        $cards.each(function () {
          var match = $(this).data('category') === filter;
          $(this).toggleClass('is-hidden', !match);
        });
      }
    });
  }

  /* ---------- Sliders (data-driven) ---------- */
  function defaultSliders() {
    var sliders     = document.querySelectorAll('.default-slider');
    var prevArrows  = document.querySelectorAll('.default-prev');
    var nextArrows  = document.querySelectorAll('.default-next');
    var paginations = document.querySelectorAll('.default-pagination');
    if (!sliders.length || typeof Swiper === 'undefined') return;

    sliders.forEach(function (slider, index) {
      var initial   = parseInt(slider.getAttribute('data-initial')) || 0;
      var offset    = slider.getAttribute('data-offset');
      var loop      = slider.getAttribute('data-loop') === 'true';
      var effect    = slider.getAttribute('data-effect') || 'slide';
      var autoplay  = slider.getAttribute('data-autoplay') === 'true';
      var speed     = parseInt(slider.getAttribute('data-speed')) || 5000;
      var duration  = parseInt(slider.getAttribute('data-duration')) || 1000;

      var opts = {
        observer: true,
        observeParents: true,
        speed: duration,
        loop: loop,
        effect: effect,
        slidesPerView: 'auto',
        spaceBetween: offset,
        initialSlide: initial,
        navigation: { nextEl: nextArrows[index], prevEl: prevArrows[index] },
        pagination: { el: paginations[index], clickable: true }
      };

      if (autoplay) {
        opts.autoplay = { delay: speed, disableOnInteraction: true };
      }

      new Swiper(slider, opts);
    });
  }
  window.addEventListener('load', defaultSliders);

  /* ---------- AOS init ---------- */
  $(window).on('load', function () {
    if (typeof AOS !== 'undefined' && $('[data-aos]').length > 0) {
      AOS.init({ once: true, delay: 100, duration: 1000 });
    }
  });

  /* ---------- Sticky header ---------- */
  $(window).on('scroll', fixedHeaderActions);

  function fixedHeaderActions() {
    var header = $('.header');
    if (!header.length) return;
    if ($(window).scrollTop() > 50) header.addClass('fixed');
    else header.removeClass('fixed');
  }

  /* ---------- Mobile menu ---------- */
  function menuActions() {
    $('.burger-btn').on('click', function (e) {
      e.preventDefault();
      var $btn  = $(this);
      var $menu = $('.main-menu');
      $btn.toggleClass('isActive');
      $menu.toggleClass('isActive');
      $('body').toggleClass('fixed');
      $btn.attr('aria-expanded', $btn.hasClass('isActive') ? 'true' : 'false');
    });

    if (window.matchMedia('(max-width: 1024px)').matches) {
      $('.main-menu .menu-item-has-children > a').on('click', function (e) {
        e.preventDefault();
        $(this).toggleClass('opened');
        $(this).siblings('.sub-menu').slideToggle();
      });
    }
  }

  /* ---------- Accordion ---------- */
  function accordionInit(itemSelector, headSelector) {
    var $items = $(itemSelector);
    var $heads = $items.find(headSelector);

    $heads.on('click', function (e) {
      e.preventDefault();
      var $head = $(this);
      var $item = $head.parent();
      var $body = $head.next();

      if ($head.hasClass('isActive')) {
        $head.removeClass('isActive').attr('aria-expanded', 'false');
        $item.removeClass('isActive');
        $body.slideUp();
      } else {
        $item.siblings().find(headSelector)
          .removeClass('isActive').attr('aria-expanded', 'false')
          .next().slideUp();
        $item.siblings().removeClass('isActive');
        $head.addClass('isActive').attr('aria-expanded', 'true');
        $item.addClass('isActive');
        $body.slideDown();
      }
    });
  }

})(jQuery);

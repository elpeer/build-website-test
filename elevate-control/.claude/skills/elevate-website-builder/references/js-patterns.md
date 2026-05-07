# JavaScript Patterns Reference

This file documents the JS architecture used across Elevate sites. The codebase is jQuery-based (jQuery 3.x), with vanilla JS for newer additions like the slide-toggle and video-progress modules.

---

## File structure

All site JS lives in `js/main.js`. Libraries are loaded as separate `<script>` tags before main.js:

```html
<script src="libs/jquery/jquery.min.js"></script>
<script src="libs/swiper/swiper.min.js"></script>
<script src="libs/aos/aos.js"></script>
<script src="libs/fancybox/fancybox.js"></script>
<script src="js/main.js"></script>
```

Don't bundle these — keep them as separate files so they can be cached individually and so WordPress can enqueue them with `wp_enqueue_script`.

---

## The IIFE wrapper

`main.js` is wrapped in a jQuery-aliased IIFE. New code goes inside it:

```javascript
(function ($) {
  $(document).ready(function () {
    // initialization code

    $('.preloader').fadeOut(1000);

    if ($('[data-fancybox]').length > 0) {
      Fancybox.bind("[data-fancybox]", {
        placeFocusBack: false,
        dragToClose: false,
      });
    }

    // helper inits
    fixedHeaderActions();
    menuActions();
    accordionInit('.accordion-item', '.accordion-item__head');
    filterItems('.faq-page__nav button', '.faq-page__item', false);
    initTableOfContents('.post-page__content-inner .editor-area', '.post-page__content-nav');
    initSlideToggles('.checkout-page__summary-switcher', { duration: 500, openedClass: 'opened' });
    initScrollTitle();
    initStepsLine();
  });

  $(window).on('scroll', function () {
    fixedHeaderActions();
  });

  $(window).on('load', function () {
    if ($('[data-aos]').length > 0) {
      AOS.init({ once: true, delay: 100, duration: 1000 });
    }
  });

  // === helper functions defined inside the IIFE ===
  function fixedHeaderActions() { … }
  function accordionInit(item, button) { … }
  function menuActions() { … }
  function filterItems(button, items, parent = false) { … }
  function initTableOfContents(containerSelector, navSelector) { … }
  function initSlideToggles(selector, opts = {}) { … }
  function initScrollTitle() { … }
  function initStepsLine() { … }
})(jQuery);
```

When adding a new feature:
1. Define the helper function inside the IIFE.
2. Call it from inside `$(document).ready` or, if it depends on images/fonts, from `$(window).on('load')`.
3. Don't pollute `window.*` unless the function genuinely needs to be globally callable.

---

## Swiper initialization

Sliders are auto-initialized by the `defaultSliders()` function on `window.load`. The slider element gets the `.default-slider` class and configuration via data attributes. **Don't write per-slider Swiper init blocks** for any slider that fits this pattern.

```html
<div class="default-slider"
     data-initial="2"
     data-loop="true"
     data-autoplay="true"
     data-speed="3000"
     data-duration="600"
     data-effect="slide"
     data-offset="20">
  <div class="swiper-wrapper">…</div>
  <div class="btns">
    <button class="swiper-btn-prev default-prev">…</button>
    <button class="swiper-btn-next default-next">…</button>
    <div class="default-pagination"></div>
  </div>
</div>
```

Data attributes (all optional):

| Attribute        | Default | Type    | Effect                                           |
|------------------|---------|---------|--------------------------------------------------|
| `data-initial`   | 0       | int     | Index of the slide that's active on load         |
| `data-loop`      | false   | bool    | Infinite loop                                    |
| `data-effect`    | slide   | string  | Swiper effect: slide, fade, cube, coverflow      |
| `data-autoplay`  | false   | bool    | Auto-advance slides                              |
| `data-speed`     | 5000    | int     | Autoplay delay in ms                             |
| `data-duration`  | 1000    | int     | Transition duration in ms                        |
| `data-offset`    | —       | int/str | spaceBetween value                               |

The init function looks like this — read it before extending:

```javascript
const defaultSliders = () => {
  let sliders = document.querySelectorAll('.default-slider');
  let prevArrow = document.querySelectorAll('.default-prev');
  let nextArrow = document.querySelectorAll('.default-next');
  let pagination = document.querySelectorAll('.default-pagination');
  if (sliders.length === 0) return false;

  sliders.forEach((slider, index) => {
    let initial = parseInt(slider.getAttribute('data-initial')) || 0;
    let offset = slider.getAttribute('data-offset');
    let loop = slider.getAttribute('data-loop') === 'true';
    let effect = slider.getAttribute('data-effect') || 'slide';
    let autoplay = slider.getAttribute('data-autoplay') === 'true';
    let speed = parseInt(slider.getAttribute('data-speed')) || 5000;
    let duration = parseInt(slider.getAttribute('data-duration')) || 1000;

    let swiperOptions = {
      observe: true,
      observeParents: true,
      speed: duration,
      loop,
      effect,
      slidesPerView: 'auto',
      spaceBetween: offset,
      initialSlide: initial,
      navigation: { nextEl: nextArrow[index], prevEl: prevArrow[index] },
      pagination: { el: pagination[index], clickable: true },
    };

    if (autoplay) {
      swiperOptions.autoplay = { delay: speed, disableOnInteraction: true };
    }

    new Swiper(slider, swiperOptions);
  });
};

window.addEventListener('load', defaultSliders);
```

Key gotchas:
- The function uses `querySelectorAll` for `.default-prev`, `.default-next`, `.default-pagination` — they get matched by index across all sliders. So inside each `.default-slider`, the prev / next / pagination must be direct descendants OR there must be exactly one of each per slider in DOM order.
- `slidesPerView: 'auto'` is mandatory — the slide width is set in CSS, not JS.
- For thumbnail sliders or anything more complex, use `dualSliders()` (the `.main-slider` + `.secondary-slider` pattern) or write a custom init.

### Dual sliders (gallery + thumbs)

```html
<div class="main-slider" data-effect="fade">
  <div class="swiper-wrapper">
    <div class="swiper-slide"><img src="…" alt=""></div>
  </div>
</div>
<div class="secondary-slider" data-thumbs-offset="8">
  <div class="swiper-wrapper">
    <div class="swiper-slide"><img src="…" alt=""></div>
  </div>
</div>
<button class="main-slider-prev">prev</button>
<button class="main-slider-next">next</button>
<div class="main-slider-pagination"></div>
```

Auto-initialized by `dualSliders()`. Don't manually call Swiper here either.

### Video progress sliders

Add `data-video-progress` to the slider and the auto-init in `main.js` will:
- Pause/reset all videos on slide change
- Play the active slide's video
- Show a ring or pagination-bullet progress indicator
- Auto-advance when the video ends (or after a fallback timer if there's no video)

```html
<div class="default-slider" dir="ltr" data-loop="true" data-video-progress>
  <div class="swiper-wrapper">
    <div class="swiper-slide">
      <video src="v1.mp4" poster="v1.jpg" muted playsinline></video>
    </div>
  </div>
</div>
```

Use `data-video-progress="bullets"` to put the progress on the pagination bullets instead of a separate ring.

---

## Fancybox

Bound automatically to anything with `[data-fancybox]`:

```javascript
Fancybox.bind("[data-fancybox]", {
  placeFocusBack: false,
  dragToClose: false,
});
```

Common use:

```html
<a href="https://youtu.be/XXXX" data-fancybox aria-label="צפייה בסרטון">
  <i class="icon__play"></i>
</a>

<a href="#minicart" data-fancybox class="cart-btn">…</a>

<a href="img/zoom.jpg" data-fancybox="gallery">…</a>
```

For grouped galleries, give items the same `data-fancybox="group-name"` value. For inline content (mini-cart, modal forms), the `href` is `#element-id` and Fancybox finds and clones the element.

Override per-trigger options via `data-options='{"…":"…"}'` (JSON string).

---

## AOS (Animate On Scroll)

```javascript
AOS.init({
  once: true,
  delay: 100,
  duration: 1000,
});
```

`once: true` — animations fire only once, never re-trigger on scroll back. This is the agency convention.

Markup:

```html
<div data-aos="fade-up" data-aos-delay="100" data-aos-anchor="#section-id">
  …
</div>
```

`data-aos-anchor` ties the trigger to a sibling element rather than the animated element itself. This is critical for sections where the AOS-animated child is offscreen-positioned (e.g., a hero element animating in from the side) — without an anchor, AOS would only fire when the element itself enters the viewport, which never happens.

Common values: `fade-up`, `fade-down`, `fade-left`, `fade-right`, `zoom-in`. Stagger via incremental `data-aos-delay`: `100`, `200`, `300`, `400`.

---

## Header sticky behavior

```javascript
function fixedHeaderActions() {
  let header = $('.header');
  let scrolled = $(window).scrollTop();
  if (scrolled > 50) {
    header.addClass('fixed');
  } else {
    header.removeClass('fixed');
  }
}
```

Fired on `$(window).on('scroll', …)`. The CSS handles the visual change — JS only toggles the class.

---

## Mobile menu

```javascript
function menuActions() {
  $('.burger-btn').on('click', function (e) {
    e.preventDefault();
    $('.burger-btn').toggleClass('isActive');
    $('.main-menu').toggleClass('isActive');
    $('body').toggleClass('fixed');
  });

  if (window.matchMedia('(max-width: 1024px)').matches) {
    $('.main-menu .menu-item-has-children > a').on('click', function (e) {
      e.preventDefault();
      $(this).toggleClass('opened');
      $(this).siblings('.sub-menu').slideToggle();
    });
    initSlideToggles('.footer-menus .menu-item-has-children > a', {
      duration: 500,
      openedClass: 'opened'
    });
  }
}
```

`body.fixed` adds `overflow: hidden` so the page doesn't scroll behind the open menu.

Update the `aria-expanded` state when toggling — the existing function doesn't, but new code should:

```javascript
$('.burger-btn').on('click', function () {
  const expanded = $(this).hasClass('isActive');
  $(this).attr('aria-expanded', expanded ? 'true' : 'false');
});
```

---

## Accordion

```javascript
function accordionInit(item, button) {
  let elem = $(item);
  let btn = elem.find(button);
  btn.on('click', function (e) {
    e.preventDefault();
    let items = $(this).parent();
    if ($(this).hasClass('isActive')) {
      $(this).removeClass('isActive');
      $(this).parent(elem).removeClass('isActive');
      $(this).next().slideUp();
    } else {
      items.siblings().find(button).removeClass('isActive');
      items.siblings().find(button).next().slideUp();
      items.siblings().removeClass('isActive');
      $(this).addClass('isActive');
      $(this).parent(elem).addClass('isActive');
      $(this).next().slideDown();
    }
  });
}
```

Behavior: only one item open at a time (siblings collapse). To allow multiple items open simultaneously, fork this function rather than parameterizing — the existing call sites depend on the close-others behavior.

---

## Filter items

```javascript
function filterItems(button, items, parent = false) { … }
```

Used for FAQ category filters, product type filters, etc. Buttons need `data-id` matching the items' `data-id`. The special `data-id="all"` shows everything.

```html
<button data-id="all" class="isActive">הכל</button>
<button data-id="shipping">משלוחים</button>
<button data-id="returns">החזרות</button>

<div class="faq-page__item" data-id="shipping">…</div>
<div class="faq-page__item" data-id="returns,shipping">…</div>
```

Multiple ids on a single item: comma-separated.

---

## Table of contents (post pages)

```javascript
initTableOfContents('.post-page__content-inner .editor-area', '.post-page__content-nav');
```

- Scans for `<h2>` inside the container.
- Auto-assigns ids if missing.
- Renders a `<select>` on mobile (<768px) and a `<ul>` on desktop.
- Highlights the active item on scroll.
- Smooth-scrolls on click with a 100px header offset.

If your post pages use `<h3>` for sub-sections, fork the function — the existing one only picks up `<h2>`.

---

## Slide-toggle (vanilla)

```javascript
initSlideToggles(selector, {
  duration: 300,
  openedClass: 'opened',
  // optional: target panel resolution
  target: null,
  preventDefault: true,
  updateAria: true
});
```

Vanilla replacement for jQuery's `slideToggle()` that doesn't fight with `scroll-behavior: smooth`. Use this for footer menu accordions on mobile, sticky summary panels in checkout, anywhere a panel needs to expand smoothly without jumping the scroll.

Target resolution order: explicit option → `data-target` attribute on the trigger → `href="#id"` → next sibling.

Returns an API object: `{ destroy, open, close, toggle }`.

---

## Show password toggle

```javascript
$(document).on('click', '.show-password-input', function (e) {
  e.preventDefault();
  const inputId = $(this).attr('aria-describedby');
  const $input = $('#' + inputId);
  const type = $input.attr('type') === 'password' ? 'text' : 'password';
  $input.attr('type', type);
  $(this).toggleClass('--visible');
});
```

Markup:

```html
<div class="form-item password-input">
  <label for="signup-pass">סיסמה</label>
  <input type="password" id="signup-pass" required>
  <button type="button" class="show-password-input" aria-describedby="signup-pass" aria-label="הצגת סיסמה"></button>
</div>
```

---

## Scroll title (animated lines)

`initScrollTitle()` animates `.scroll-title__line` elements, fading them in line-by-line as the user scrolls past each line's center. Required markup:

```html
<h2 class="scroll-title">
  <span class="scroll-title__group">
    <span class="scroll-title__line">first line</span>
    <span class="scroll-title__line">second line</span>
  </span>
</h2>
```

Lines without `--empty` modifier participate in the scroll-driven animation.

---

## Steps line (vertical progress through numbered steps)

`initStepsLine()` looks for `.steps` and animates the SVG path inside `.steps-line-progress` (desktop) or the `.steps__line-fill` div (mobile) as the user scrolls. Used in the home-page steps section.

---

## Adding new functionality — checklist

1. Does it fit an existing pattern? Reuse the helper (accordion, filterItems, slideToggle).
2. Is it slider-based? Use `.default-slider` with data attributes.
3. Is it modal-based? Use Fancybox with `data-fancybox`.
4. Otherwise, write a new helper inside the IIFE, named `initFeatureName()`, called from `$(document).ready`.
5. Always check `if ($('.selector').length > 0)` before initializing — saves errors on pages where the element doesn't exist.
6. Use event delegation (`$(document).on('click', '.selector', …)`) for elements that may be dynamically added (mini-cart contents, AJAX-loaded products).
7. Avoid global variables. If state must persist across functions, attach it to a single namespace object (e.g., `window.elevate = { …state… }`).

---

## What NOT to do

- Don't load React, Vue, Alpine, or any framework. The site is jQuery + vanilla.
- Don't use ES modules (`import` / `export`) in `main.js` — the build doesn't bundle.
- Don't use `let` or `const` outside the IIFE — keeps the global scope clean and avoids accidental leakage.
- Don't introduce build-time JS like Webpack, Rollup, or Vite for a project that doesn't already have one. The codebase is intentionally simple.
- Don't write `addEventListener` for everything when jQuery delegation handles it more concisely. The codebase mixes both — match what surrounds your edit.
- Don't override Fancybox's focus management or AOS's scroll detection. They handle edge cases (tab traps, prefers-reduced-motion) that custom replacements miss.
